import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { checkOfferFacts, scalars } from "../scripts/check-offer-facts.mjs"

test("product, listing, template and package manifests agree with offer.facts.json", () => {
  assert.deepEqual(checkOfferFacts(), [])
})

test("the price stays undecided until the owner locks it", () => {
  const facts = JSON.parse(readFileSync(new URL("../offer.facts.json", import.meta.url), "utf8"))
  assert.equal(facts.price.state, "decision_required")
  assert.equal(facts.price.amount, null)
  assert.equal(facts.merchant.state, "decision_required")
})

test("the scalar reader follows nesting and quoted values", () => {
  assert.deepEqual(scalars('a: 1\nb:\n  c: "x y"\n  d:\n    e: z\nf: 2\n'), { a: "1", "b.c": "x y", "b.d.e": "z", f: "2" })
})
