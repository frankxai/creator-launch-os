import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { loadCommerce } from "./support/load-commerce.mjs"

/**
 * The commerce loop in this repository is a TEST-MODE rehearsal backed by
 * process memory. These tests pin that boundary so nobody mistakes the
 * retry-safe in-memory engine for durable commerce.
 */
const { engine, config } = await loadCommerce()
const paid = JSON.parse(readFileSync(new URL("fixtures/commerce/paid.json", import.meta.url), "utf8"))
const options = { skus: [paid.sku], mode: "test" }
const DELIVERY = "fixture-delivery-secret-0123456789abcdef"
const now = new Date("2026-10-21T09:05:00.000Z")
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")

test("memory store is not durable: a restart loses the order, entitlement and delivery access", () => {
  const before = engine.createMemoryStore()
  const { entitlement } = engine.applyEvent(before, paid, options)
  const token = engine.issueDeliveryToken(entitlement, DELIVERY, now)
  const afterRestart = engine.createMemoryStore()
  assert.equal(afterRestart.orders().length, 0)
  assert.equal(afterRestart.entitlements().length, 0)
  assert.equal(afterRestart.hasEvent(paid.id), false, "a restarted process would not recognise the event as processed")
  assert.throws(() => engine.redeemDeliveryToken(afterRestart, token, DELIVERY, now), { code: "E_TOKEN" })
})

test("only test mode is wired to the memory store; live mode has no store and refuses events", () => {
  const server = source("lib/commerce/server.ts")
  const testBranch = server.match(/if \(runtime\.mode === "test"\) \{([\s\S]*?)\n  \}/)
  assert.ok(testBranch && /createMemoryStore\(\)/.test(testBranch[1]), "memory store is created only inside the test-mode branch")
  assert.equal((server.match(/createMemoryStore\(\)/g) ?? []).length, 1)
  assert.match(server, /return \{ runtime, store: null \}\n\}/, "every non-test path ends with no store")
  for (const route of ["app/api/commerce/webhook/route.ts", "app/api/commerce/delivery/route.ts"]) {
    assert.match(source(route), /if \(!store[^)]*\)\s*\{?\s*return unavailable\(\)/, `${route} must refuse without a store`)
  }
})

test("live mode cannot become purchasable from this repository alone", () => {
  const runtime = config.readCommerceRuntime({
    COMMERCE_MODE: "live",
    COMMERCE_MERCHANT: "fixture",
    COMMERCE_WEBHOOK_SECRET: "w".repeat(40),
    COMMERCE_DELIVERY_SECRET: "d".repeat(40),
    NEXT_PUBLIC_KIT_CHECKOUT_URL: "https://checkout.example.invalid/kit",
  })
  assert.equal(runtime.adapter, null, "no live merchant adapter ships")
  assert.deepEqual(config.kitAvailability(runtime), { state: "available-soon" })
})

test("the store contract states the durable-store obligations the retry fix relies on", () => {
  const engineSource = source("lib/commerce/engine.ts")
  assert.match(engineSource, /idempotent\s*\n?\s*\* upsert/)
  assert.match(engineSource, /markEvent must only run after the writes it guards succeed/)
  assert.match(engineSource, /unique \(name, orderId\) key/)
})
