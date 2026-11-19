import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { test } from "node:test"

import { loadCommerce } from "./support/load-commerce.mjs"

const { engine, config } = await loadCommerce()
const fixture = (name) => readFileSync(new URL(`fixtures/commerce/${name}.json`, import.meta.url), "utf8")
const SECRET = "fixture-webhook-secret-0123456789abcdef"
const DELIVERY = "fixture-delivery-secret-0123456789abcdef"
const SKU = "sku_creator_launch_os_v1"
const testEnv = {
  COMMERCE_MODE: "test",
  COMMERCE_MERCHANT: "fixture",
  COMMERCE_WEBHOOK_SECRET: SECRET,
  COMMERCE_DELIVERY_SECRET: DELIVERY,
}
const signed = (body, secret = SECRET) => new Headers({ "x-commerce-signature": engine.signPayload(body, secret) })

test("a fresh clone with no environment renders available soon and accepts nothing", () => {
  const runtime = config.readCommerceRuntime({})
  assert.equal(runtime.mode, "off")
  assert.equal(runtime.adapter, null)
  assert.deepEqual(config.kitAvailability(runtime), { state: "available-soon" })
})

test("live mode stays available soon while the price, merchant and checkout are undecided", () => {
  const runtime = config.readCommerceRuntime({
    COMMERCE_MODE: "live",
    COMMERCE_MERCHANT: "fixture",
    COMMERCE_WEBHOOK_SECRET: SECRET,
    COMMERCE_DELIVERY_SECRET: DELIVERY,
    NEXT_PUBLIC_KIT_CHECKOUT_URL: "https://checkout.example.invalid/kit",
  })
  assert.deepEqual(config.kitAvailability(runtime), { state: "available-soon" })
  assert.ok(runtime.blockers.some((reason) => /no live adapter/.test(reason)))
  assert.ok(runtime.blockers.some((reason) => /price is not locked/.test(reason)))
})

test("test mode is a rehearsal, never a buy control, and is refused on production", () => {
  assert.deepEqual(config.kitAvailability(config.readCommerceRuntime(testEnv)), { state: "test-rehearsal" })
  const production = config.readCommerceRuntime({ ...testEnv, VERCEL_ENV: "production" })
  assert.deepEqual(config.kitAvailability(production), { state: "available-soon" })
})

test("short secrets and credential-bearing checkout URLs are rejected", () => {
  const runtime = config.readCommerceRuntime({
    ...testEnv,
    COMMERCE_WEBHOOK_SECRET: "short",
    NEXT_PUBLIC_KIT_CHECKOUT_URL: "https://user:pass@checkout.example.invalid/kit",
  })
  assert.equal(runtime.webhookSecret, null)
  assert.equal(runtime.checkoutUrl, null)
  assert.deepEqual(config.kitAvailability(runtime), { state: "available-soon" })
})

test("order → entitlement → delivery → refund runs end to end against fixtures", () => {
  const runtime = config.readCommerceRuntime(testEnv)
  const store = engine.createMemoryStore()
  const options = { skus: config.fulfilledSkus, mode: runtime.mode }
  const now = new Date("2026-10-21T09:05:00.000Z")

  const paidBody = fixture("paid")
  const paid = engine.applyEvent(store, runtime.adapter(paidBody, signed(paidBody), runtime.webhookSecret), options)
  assert.equal(paid.outcome, "granted")
  assert.equal(paid.order.email, "rehearsal.buyer@example.invalid")
  assert.equal(paid.entitlement.status, "active")

  const replay = engine.applyEvent(store, runtime.adapter(paidBody, signed(paidBody), runtime.webhookSecret), options)
  assert.equal(replay.outcome, "duplicate", "merchant retries must not grant twice")

  const token = engine.issueDeliveryToken(paid.entitlement, runtime.deliverySecret, now)
  const grant = engine.redeemDeliveryToken(store, token, runtime.deliverySecret, now)
  assert.equal(grant.sku, SKU)

  const before = engine.reconcile(store, true)
  assert.deepEqual(before, { orders: 1, paid: 1, refunded: 0, activated: 1, net: { USD: 100 }, test: true })

  const refundBody = fixture("refunded")
  const refund = engine.applyEvent(store, runtime.adapter(refundBody, signed(refundBody), runtime.webhookSecret), options)
  assert.equal(refund.outcome, "revoked")
  assert.equal(refund.entitlement.status, "revoked")
  assert.throws(
    () => engine.redeemDeliveryToken(store, token, runtime.deliverySecret, now),
    (error) => error.code === "E_REVOKED",
  )

  const latePayment = engine.applyEvent(
    store,
    { ...JSON.parse(paidBody), id: "evt_fixture_paid_late" },
    options,
  )
  assert.equal(latePayment.outcome, "duplicate", "a refunded order is never re-granted")

  const after = engine.reconcile(store, true)
  assert.deepEqual(after, { orders: 1, paid: 0, refunded: 1, activated: 1, net: { USD: 0 }, test: true })
  assert.deepEqual(engine.reconcile(store, false).orders, 0, "test orders never appear in live totals")

  const exported = engine.exportBuyerData(store, "REHEARSAL.buyer@example.invalid")
  assert.deepEqual(
    exported.activity.map((entry) => entry.name),
    ["order_paid", "entitlement_granted", "delivery_opened", "order_refunded", "entitlement_revoked"],
  )

  if (process.env.COMMERCE_REHEARSAL_RECEIPT) {
    writeFileSync(
      process.env.COMMERCE_REHEARSAL_RECEIPT,
      JSON.stringify({ state: "TEST_REHEARSAL_PASSED_NOT_A_SALE", sku: SKU, before, after, activity: exported.activity }, null, 2) + "\n",
    )
  }
})

test("forged, foreign, live-in-test and unknown events are refused", () => {
  const runtime = config.readCommerceRuntime(testEnv)
  const store = engine.createMemoryStore()
  const options = { skus: config.fulfilledSkus, mode: "test" }
  const body = fixture("paid")

  assert.throws(() => runtime.adapter(body, signed(body, "another-secret-0123456789abcdef0123"), SECRET), { code: "E_SIGNATURE" })
  assert.throws(() => runtime.adapter(body, new Headers(), SECRET), { code: "E_SIGNATURE" })
  assert.throws(() => runtime.adapter("not json", signed("not json"), SECRET), { code: "E_EVENT_SHAPE" })

  const live = JSON.stringify({ ...JSON.parse(body), test: false })
  assert.throws(() => runtime.adapter(live, signed(live), SECRET), { code: "E_EVENT_SHAPE" })
  assert.throws(() => engine.applyEvent(store, { ...JSON.parse(body), test: false }, options), { code: "E_MODE_MISMATCH" })
  assert.throws(() => engine.applyEvent(store, { ...JSON.parse(body), sku: "sku_other" }, options), { code: "E_UNKNOWN_SKU" })
  // Refund-before-payment is now recorded fail-safe; see tests/commerce-order-safety.test.mjs.
  assert.equal(store.orders().length, 0)
})

test("delivery links are signed, bound to their entitlement and expire", () => {
  const store = engine.createMemoryStore()
  const now = new Date("2026-10-21T09:05:00.000Z")
  const { entitlement } = engine.applyEvent(store, JSON.parse(fixture("paid")), { skus: [SKU], mode: "test" })
  const token = engine.issueDeliveryToken(entitlement, DELIVERY, now, 60)

  assert.throws(() => engine.redeemDeliveryToken(store, token, "wrong-delivery-secret-0123456789abcd", now), { code: "E_TOKEN" })
  assert.throws(() => engine.redeemDeliveryToken(store, token + "x", DELIVERY, now), { code: "E_TOKEN" })
  assert.throws(() => engine.redeemDeliveryToken(store, "a.b.c", DELIVERY, now), { code: "E_TOKEN" })
  assert.throws(
    () => engine.redeemDeliveryToken(store, token, DELIVERY, new Date(now.getTime() + 61_000)),
    { code: "E_TOKEN_EXPIRED" },
  )
})

test("the offer page never renders a price or a buy control from undecided facts", () => {
  const page = readFileSync(new URL("../app/kit/page.tsx", import.meta.url), "utf8")
  assert.match(page, /Available soon/)
  assert.doesNotMatch(page, /\$\s?\d/, "no hand-typed price")
  assert.match(page, /availability\.state === "available"/)
  const route = readFileSync(new URL("../app/api/commerce/webhook/route.ts", import.meta.url), "utf8")
  assert.match(route, /runtime\.mode === "test" \? deliveryToken : undefined/, "live mode never echoes a delivery link")
  assert.doesNotMatch(readFileSync(new URL("../.env.example", import.meta.url), "utf8"), /^COMMERCE_\w+_SECRET=.+$/m)
})
