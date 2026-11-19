import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { loadCommerce } from "./support/load-commerce.mjs"

/**
 * Partial-failure recovery. A store write can fail after earlier writes
 * succeeded (timeout, lost connection). The route then answers 500 and the
 * merchant retries the same event id. That retry must finish the job: it may
 * never be swallowed as a duplicate while access is missing or still live.
 */
const { engine } = await loadCommerce()
const fixture = (name) => JSON.parse(readFileSync(new URL(`fixtures/commerce/${name}.json`, import.meta.url), "utf8"))
const SKU = "sku_creator_launch_os_v1"
const options = { skus: [SKU], mode: "test" }
const DELIVERY = "fixture-delivery-secret-0123456789abcdef"
const now = new Date("2026-10-21T09:05:00.000Z")

/** Wrap a memory store so one named method throws once, like a transient outage. */
function failOnce(method, { when = () => true } = {}) {
  const store = engine.createMemoryStore()
  let armed = true
  return new Proxy(store, {
    get(target, key) {
      const value = target[key]
      if (key !== method || typeof value !== "function") return value
      return (...args) => {
        if (armed && when(...args)) {
          armed = false
          throw new Error(`synthetic transient ${method} failure`)
        }
        return value.apply(target, args)
      }
    },
  })
}

const names = (store) => store.activity().map((entry) => entry.name)

for (const method of ["putOrder", "putEntitlement", "record"]) {
  test(`a paid event retried after a failed ${method} grants exactly one active entitlement`, () => {
    const store = failOnce(method)
    assert.throws(() => engine.applyEvent(store, fixture("paid"), options), /synthetic transient/)
    const retry = engine.applyEvent(store, fixture("paid"), options)
    assert.equal(retry.outcome, "granted", "the retry must not be swallowed as a duplicate")
    assert.equal(store.entitlements().length, 1)
    assert.equal(store.entitlements()[0].status, "active")
    const token = engine.issueDeliveryToken(retry.entitlement, DELIVERY, now)
    assert.equal(engine.redeemDeliveryToken(store, token, DELIVERY, now).sku, SKU)
    const activity = names(store).filter((name) => name !== "delivery_opened")
    assert.deepEqual(activity, ["order_paid", "entitlement_granted"], "no duplicated or missing ledger entries")
    assert.equal(engine.applyEvent(store, fixture("paid"), options).outcome, "duplicate", "a completed event is idempotent")
  })
}

test("a failure after every paid write leaves a retry that changes nothing", () => {
  const store = failOnce("markEvent")
  assert.throws(() => engine.applyEvent(store, fixture("paid"), options), /synthetic transient/)
  assert.equal(engine.applyEvent(store, fixture("paid"), options).outcome, "granted")
  assert.deepEqual(names(store), ["order_paid", "entitlement_granted"])
  assert.equal(store.entitlements().length, 1)
})

for (const method of ["putOrder", "putEntitlement", "record"]) {
  test(`a refund retried after a failed ${method} revokes access`, () => {
    // Arm only for the refund's writes, after a clean payment.
    let refunding = false
    const store = failOnce(method, { when: () => refunding })
    const { entitlement } = engine.applyEvent(store, fixture("paid"), options)
    const token = engine.issueDeliveryToken(entitlement, DELIVERY, now)
    refunding = true
    assert.throws(() => engine.applyEvent(store, fixture("refunded"), options), /synthetic transient/)
    const retry = engine.applyEvent(store, fixture("refunded"), options)
    assert.equal(retry.outcome, "revoked")
    assert.equal(store.orders()[0].status, "refunded")
    assert.equal(store.entitlements()[0].status, "revoked", "a refunded order may never keep live access")
    assert.throws(() => engine.redeemDeliveryToken(store, token, DELIVERY, now), { code: "E_REVOKED" })
    assert.deepEqual(names(store), ["order_paid", "entitlement_granted", "order_refunded", "entitlement_revoked"])
    assert.equal(engine.applyEvent(store, fixture("refunded"), options).outcome, "duplicate")
  })
}

test("a late payment retry after a refund still never restores access", () => {
  const store = failOnce("markEvent", { when: (id) => id === "evt_fixture_paid_late" })
  engine.applyEvent(store, fixture("paid"), options)
  engine.applyEvent(store, fixture("refunded"), options)
  const late = { ...fixture("paid"), id: "evt_fixture_paid_late" }
  assert.throws(() => engine.applyEvent(store, late, options), /synthetic transient/)
  assert.equal(engine.applyEvent(store, late, options).outcome, "duplicate")
  assert.equal(store.entitlements()[0].status, "revoked")
})

test("a different refund event that completes a failed revoke keeps one consistent refund time", () => {
  let refunding = false
  const store = failOnce("putEntitlement", { when: () => refunding })
  engine.applyEvent(store, fixture("paid"), options)
  refunding = true
  const first = fixture("refunded")
  assert.throws(() => engine.applyEvent(store, first, options), /synthetic transient/)
  const second = { ...first, id: "evt_fixture_refund_second", occurredAt: "2030-01-01T00:00:00.000Z" }
  engine.applyEvent(store, second, options)
  const [order] = store.orders()
  const [entitlement] = store.entitlements()
  assert.equal(entitlement.status, "revoked")
  assert.equal(entitlement.revokedAt, order.refundedAt, "revocation time follows the recorded refund")
  const revokedEntry = store.activity().find((entry) => entry.name === "entitlement_revoked")
  assert.equal(revokedEntry.at, order.refundedAt)
})
