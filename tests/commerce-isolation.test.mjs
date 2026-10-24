import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { loadCommerce } from "./support/load-commerce.mjs"

/**
 * Cross-order behaviour of the in-memory test-mode engine: one buyer's
 * refund or failed write never touches another buyer, and interleaved
 * events across orders converge. Single-process only; this says nothing
 * about multi-worker locking in a future durable store.
 */
const { engine } = await loadCommerce()
const base = JSON.parse(readFileSync(new URL("fixtures/commerce/paid.json", import.meta.url), "utf8"))
const options = { skus: [base.sku], mode: "test" }
const DELIVERY = "fixture-delivery-secret-0123456789abcdef"
const now = new Date("2026-10-21T09:05:00.000Z")
const paidFor = (order, email, amount = base.amount) => ({ ...base, id: `evt_paid_${order}`, orderId: order, email, amount })
const refundOf = (event) => ({ ...event, id: `evt_refund_${event.orderId}`, type: "order.refunded" })

test("refunding one buyer revokes only that buyer's delivery and export", () => {
  const store = engine.createMemoryStore()
  const alice = paidFor("order_alice", "Alice@Example.Invalid")
  const bob = paidFor("order_bob", "bob@example.invalid")
  const tokenAlice = engine.issueDeliveryToken(engine.applyEvent(store, alice, options).entitlement, DELIVERY, now)
  const tokenBob = engine.issueDeliveryToken(engine.applyEvent(store, bob, options).entitlement, DELIVERY, now)

  engine.applyEvent(store, refundOf(alice), options)
  assert.throws(() => engine.redeemDeliveryToken(store, tokenAlice, DELIVERY, now), { code: "E_REVOKED" })
  assert.equal(engine.redeemDeliveryToken(store, tokenBob, DELIVERY, now).entitlement.orderId, "order_bob")

  const exportAlice = engine.exportBuyerData(store, "alice@example.invalid")
  const exportBob = engine.exportBuyerData(store, "BOB@example.invalid")
  assert.deepEqual(exportAlice.orders.map((order) => order.orderId), ["order_alice"])
  assert.deepEqual(exportAlice.entitlements.map((ent) => ent.status), ["revoked"])
  assert.deepEqual(exportBob.orders.map((order) => order.orderId), ["order_bob"])
  assert.deepEqual(exportBob.entitlements.map((ent) => ent.status), ["active"])
  assert.ok(exportBob.activity.every((entry) => entry.orderId === "order_bob"))
})

test("a delivery token cannot be re-pointed at another buyer's entitlement", () => {
  const store = engine.createMemoryStore()
  const tokenAlice = engine.issueDeliveryToken(
    engine.applyEvent(store, paidFor("order_alice", "alice@example.invalid"), options).entitlement, DELIVERY, now)
  engine.applyEvent(store, paidFor("order_bob", "bob@example.invalid"), options)
  const forgedBody = Buffer.from(JSON.stringify({ e: "ent_order_bob", s: base.sku, x: Math.floor(now.getTime() / 1000) + 3600 })).toString("base64url")
  assert.throws(() => engine.redeemDeliveryToken(store, `${forgedBody}.${tokenAlice.split(".")[1]}`, DELIVERY, now), { code: "E_TOKEN" })
})

test("interleaved replay, a failed write on another order, refund and late payment converge", () => {
  const inner = engine.createMemoryStore()
  let outage = true
  const store = {
    ...inner,
    putEntitlement(entitlement) {
      if (outage && entitlement.orderId === "order_two") {
        outage = false
        throw new Error("synthetic outage on order_two")
      }
      inner.putEntitlement(entitlement)
    },
  }
  const one = paidFor("order_one", "one@example.invalid", 100)
  const two = paidFor("order_two", "two@example.invalid", 250)

  assert.equal(engine.applyEvent(store, one, options).outcome, "granted")
  assert.throws(() => engine.applyEvent(store, two, options), /synthetic outage/)
  assert.equal(engine.applyEvent(store, { ...one }, options).outcome, "duplicate", "replay of a completed event")
  assert.equal(engine.applyEvent(store, two, options).outcome, "granted", "retry completes the interrupted order")
  assert.equal(engine.applyEvent(store, refundOf(one), options).outcome, "revoked")
  assert.equal(engine.applyEvent(store, { ...one, id: "evt_late_one" }, options).outcome, "duplicate")

  assert.equal(store.getEntitlement("ent_order_one").status, "revoked")
  assert.equal(store.getEntitlement("ent_order_two").status, "active")
  assert.deepEqual(engine.reconcile(store, true), { orders: 2, paid: 1, refunded: 1, activated: 0, net: { USD: 250 }, test: true })
  for (const order of ["order_one", "order_two"]) {
    const names = store.activity().filter((entry) => entry.orderId === order).map((entry) => entry.name)
    assert.equal(new Set(names).size, names.length, `no duplicated ledger entries for ${order}`)
  }
})
