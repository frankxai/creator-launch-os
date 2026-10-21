import assert from "node:assert/strict"
import test from "node:test"
import { examplePortfolio, parsePortfolioContent } from "../lib/portfolio-content.ts"

const example = () => structuredClone(examplePortfolio)
const parse = (value) => parsePortfolioContent(JSON.stringify(value))

test("buyer case content survives normalization without accepting executable configuration", () => {
  const value = example()
  value.practice = "  My practice  "
  value.cases[0].title = '<script>alert("literal text")</script>'
  value.cases[0].evidenceUrl = "https://example.com/work?case=1#proof"
  value.contact.href = "mailto:designer+projects@example.com"
  value.scripts = { postinstall: "never execute" }
  value.contact.token = "never ship"
  value.cases[0].html = "never render"
  const result = parse(value)
  assert.equal(result.practice, "My practice")
  assert.equal(result.cases[0].title, value.cases[0].title)
  assert.equal(result.cases[0].evidenceUrl, value.cases[0].evidenceUrl)
  assert.equal(result.contact.href, value.contact.href)
  assert.ok(!("scripts" in result))
  assert.ok(!("token" in result.contact))
  assert.ok(!("html" in result.cases[0]))
  result.cases[0].title = "Buyer edit"
  assert.notEqual(examplePortfolio.cases[0].title, result.cases[0].title)
})

test("unsafe navigation and email header injection are rejected at the content boundary", () => {
  for (const href of [
    "javascript:alert(1)", "data:text/html,<script>", "//example.com", "http://example.com",
    "https://user:password@example.com", "https://example.com\n/path", "https://example.com/%0d",
    "mailto:person@example.com?bcc=other@example.com", "mailto:person@example.com%0aBCC:other@example.com",
    "mailto:person@example.com#fragment", "", undefined,
  ]) {
    const value = example()
    value.contact.href = href
    assert.throws(() => parse(value), /Portfolio link/)
  }
  const value = example()
  value.cases[0].evidenceUrl = "mailto:person@example.com"
  assert.throws(() => parse(value), /HTTPS/)
  value.cases[0].evidenceUrl = null
  value.contact.href = "https://example.com/contact"
  assert.equal(parse(value).contact.href, value.contact.href)
  value.contact.href = null
  assert.equal(parse(value).contact.href, null)
})

test("case counts, field limits, byte limits and sample declarations fail explicitly", () => {
  for (const count of [0, 7]) {
    const value = example()
    value.cases = Array.from({ length: count }, () => value.cases[0])
    assert.throws(() => parse(value), /one to six/)
  }
  const maximum = example()
  maximum.cases = Array.from({ length: 6 }, () => structuredClone(maximum.cases[0]))
  assert.equal(parse(maximum).cases.length, 6)
  for (const title of [" ", "x".repeat(161), "Hello\u0000world", 42]) {
    const value = example()
    value.cases[0].title = title
    assert.throws(() => parse(value), /title/)
  }
  for (const illustrative of [undefined, "false", 0]) {
    const value = example()
    value.cases[0].illustrative = illustrative
    assert.throws(() => parse(value), /explicit illustrative boolean/)
  }
  assert.throws(() => parsePortfolioContent("{"), /valid JSON/)
  assert.throws(() => parse({ ...example(), schemaVersion: "2.0.0" }), /schemaVersion/)
  assert.throws(() => parsePortfolioContent(JSON.stringify(example()) + "é".repeat(32768)), /64 KiB/)
})
