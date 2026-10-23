import { createHmac } from "node:crypto"
import { readFileSync } from "node:fs"

/**
 * Drive a running test-mode deployment through paid → delivery → refund → revoked.
 * Usage: COMMERCE_WEBHOOK_SECRET=... node scripts/commerce-rehearsal.mjs http://localhost:3000
 * It only sends fixture events; a live-mode deployment refuses them.
 */
const base = process.argv[2]
const secret = process.env.COMMERCE_WEBHOOK_SECRET
if (!base || !secret) {
  console.error("Usage: COMMERCE_WEBHOOK_SECRET=<secret> node scripts/commerce-rehearsal.mjs <base-url>")
  process.exit(1)
}
const fixture = (name) => readFileSync(new URL(`../tests/fixtures/commerce/${name}.json`, import.meta.url), "utf8")
const sign = (body) => "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex")
const post = async (body) => {
  const response = await fetch(new URL("/api/commerce/webhook", base), {
    method: "POST",
    headers: { "content-type": "application/json", "x-commerce-signature": sign(body) },
    body,
  })
  return { status: response.status, body: await response.json() }
}
const open = async (token) => {
  const response = await fetch(new URL(`/api/commerce/delivery?token=${encodeURIComponent(token)}`, base))
  return { status: response.status, body: await response.json() }
}
const expect = (condition, step, detail) => {
  if (!condition) {
    console.error(`FAILED at ${step}: ${JSON.stringify(detail)}`)
    process.exit(1)
  }
}

const steps = []
const paid = await post(fixture("paid"))
expect(paid.status === 200 && paid.body.outcome === "granted" && paid.body.deliveryToken, "order.paid", paid)
steps.push(["order.paid", paid.status, paid.body.outcome])

const replay = await post(fixture("paid"))
expect(replay.status === 200 && replay.body.outcome === "duplicate", "replay", replay)
steps.push(["replay ignored", replay.status, replay.body.outcome])

const delivered = await open(paid.body.deliveryToken)
expect(delivered.status === 200 && delivered.body.ok, "delivery", delivered)
steps.push(["delivery opened", delivered.status, delivered.body.delivery])

const refunded = await post(fixture("refunded"))
expect(refunded.status === 200 && refunded.body.outcome === "revoked", "order.refunded", refunded)
steps.push(["order.refunded", refunded.status, refunded.body.outcome])

const revoked = await open(paid.body.deliveryToken)
expect(revoked.status === 410 && revoked.body.code === "E_REVOKED", "revoked delivery", revoked)
steps.push(["delivery after refund", revoked.status, revoked.body.code])

const forged = await fetch(new URL("/api/commerce/webhook", base), { method: "POST", body: fixture("paid"), headers: { "x-commerce-signature": "sha256=00" } })
expect(forged.status === 401, "forged signature", forged.status)
steps.push(["forged webhook", forged.status, "rejected"])

console.log(JSON.stringify({ state: "TEST_REHEARSAL_PASSED_NOT_A_SALE", base, steps }, null, 2))
