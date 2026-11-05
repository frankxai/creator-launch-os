import assert from "node:assert/strict"
import test from "node:test"
import { examplePortfolio } from "../lib/portfolio-content.ts"
import { examplePublication, parseSitePublication } from "../lib/site-publication.ts"

const ready = () => {
  const value = structuredClone(examplePortfolio)
  value.contact.href = "https://example.com/contact"
  value.cases[0].illustrative = false
  return value
}
const published = () => ({ ...examplePublication, mode: "published", canonicalUrl: "https://example.com/work", indexable: true })
const parse = (value, template = "portfolio", portfolio = ready()) => parseSitePublication(JSON.stringify(value), template, portfolio)

test("publication defaults request noindex and discard executable properties", () => {
  assert.deepEqual(parse({ ...examplePublication, scripts: "never execute", approval: "not granted" }), examplePublication)
  assert.deepEqual(parse(published()), published())
  assert.equal(parse({ ...published(), indexable: false }).indexable, false)
})

test("a buyer cannot remove example presentation while examples or contact setup remain", () => {
  assert.throws(() => parse(published(), "portfolio", structuredClone(examplePortfolio)), /Replace illustrative/)
  const missingContact = ready()
  missingContact.contact.href = null
  assert.throws(() => parse(published(), "portfolio", missingContact), /configure the contact/)
  assert.throws(() => parse(published(), "music"), /only for Monograph/)
  assert.throws(() => parse({ ...published(), canonicalUrl: null }), /real canonical/)
  assert.throws(() => parse({ ...examplePublication, indexable: true }), /remain noindex/)
})

test("malformed settings and canonical URL injection fail explicitly", () => {
  for (const canonicalUrl of [undefined, "http://example.com", "javascript:alert(1)", "https://u:p@example.com", "https://example.com/?a=b", "https://example.com/#fragment", "https://example.com/%0a", "https://example.com\n/"]) {
    assert.throws(() => parse({ ...published(), canonicalUrl }), /Canonical URL/)
  }
  for (const value of [{ ...published(), mode: "live" }, { ...published(), indexable: "true" }, { ...published(), schemaVersion: "2.0.0" }, [], null]) {
    assert.throws(() => parse(value), /Publication settings/)
  }
  assert.throws(() => parseSitePublication("{", "portfolio"), /valid JSON/)
  assert.throws(() => parseSitePublication("é".repeat(2049), "portfolio"), /4 KiB/)
})
