import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { loadCommerce } from "./support/load-commerce.mjs"

/**
 * Order-level safety in the in-memory test-mode engine:
 * - a signed refund that arrives before its payment is recorded, so the
 *   payment can never grant access afterwards (previously: 422, and if the
 *   merchant did not retry, the later payment granted lasting access);
 * - a payment that reuses an order id with different buyer or purchase facts
 *   is rejected instead of silently granting on the first record.
 */
const { engine } = await loadCommerce()
const fixture = (name) => JSON.parse(readFileSync(new URL(`fixtures/commerce/${name}.json`, import.meta.url), "utf8"))
const options = { skus: [fixture("paid").sku], mode: "test" }

test("a refund before its payment is recorded and the payment never grants access", () => {
  const store = engine.createMemoryStore()
  const refund = engine.applyEvent(store, fixture("refunded"), options)
  assert.equal(refund.outcome, "revoked")
  assert.equal(refund.entitlement, undefined)
  assert.equal(store.orders()[0].status, "refunded")
  assert.equal(store.orders()[0].paidAt, null)

  assert.equal(engine.applyEvent(store, fixture("paid"), options).outcome, "duplicate")
  assert.equal(store.entitlements().length, 0, "no access is ever created")
  assert.deepEqual(store.activity().map((entry) => entry.name), ["order_refunded"])
  assert.deepEqual(engine.reconcile(store, true), { orders: 1, paid: 0, refunded: 1, activated: 0, net: { USD: 0 }, test: true })
  assert.equal(engine.applyEvent(store, fixture("refunded"), options).outcome, "duplicate", "refund replay stays idempotent")
})

test("an early refund that fails mid-write still blocks the later payment on retry", () => {
  const inner = engine.createMemoryStore()
  let outage = true
  const store = { ...inner, record(activity) { if (outage) { outage = false; throw new Error("synthetic outage") } inner.record(activity) } }
  assert.throws(() => engine.applyEvent(store, fixture("refunded"), options), /synthetic outage/)
  // Even before the refund is retried, the recorded order already blocks a payment.
  assert.equal(engine.applyEvent(store, fixture("paid"), options).outcome, "duplicate")
  assert.equal(engine.applyEvent(store, fixture("refunded"), options).outcome, "revoked")
  assert.equal(inner.entitlements().length, 0)
})

for (const [field, value] of [["email", "someone.else@example.invalid"], ["amount", 999], ["currency", "EUR"], ["merchant", "other"]]) {
  test(`a payment reusing an order id with a different ${field} is rejected, not silently granted`, () => {
    const store = engine.createMemoryStore()
    const first = engine.applyEvent(store, fixture("paid"), options)
    const conflicting = { ...fixture("paid"), id: "evt_conflict", [field]: value }
    assert.throws(() => engine.applyEvent(store, conflicting, options), { code: "E_ORDER_CONFLICT" })
    assert.equal(store.hasEvent("evt_conflict"), false, "a rejected event is not marked processed")
    assert.equal(store.entitlements().length, 1)
    assert.equal(store.entitlements()[0].email, first.order.email)
  })
}

test("an email differing only in case is the same buyer, not a conflict", () => {
  const store = engine.createMemoryStore()
  engine.applyEvent(store, fixture("paid"), options)
  const sameBuyer = { ...fixture("paid"), id: "evt_case", email: fixture("paid").email.toUpperCase() }
  assert.equal(engine.applyEvent(store, sameBuyer, options).outcome, "granted")
  assert.equal(store.entitlements().length, 1)
})

test("the webhook maps an order conflict to 409", () => {
  const route = readFileSync(new URL("../app/api/commerce/webhook/route.ts", import.meta.url), "utf8")
  assert.match(route, /E_ORDER_CONFLICT: 409/)
})
