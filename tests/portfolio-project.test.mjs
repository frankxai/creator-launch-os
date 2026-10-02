import assert from "node:assert/strict"
import test from "node:test"
import { getTemplate } from "../lib/template-catalog.ts"
import { examplePortfolio } from "../lib/portfolio-content.ts"
import { examplePublication } from "../lib/site-publication.ts"
import { parsePortfolioProject, portfolioProjectFiles, portfolioProjectByteLimit } from "../lib/portfolio-project.ts"

const project = () => ({ schemaVersion: "1.0.0", format: "monograph-project", copy: { ...getTemplate("portfolio").copy },
  portfolio: structuredClone(examplePortfolio), publication: { ...examplePublication } })

test("incomplete work round-trips as a draft but cannot become site files", () => {
  const draft = project()
  draft.copy.brand = ""
  draft.portfolio.cases[0].evidence = ""
  draft.publication.mode = "published"
  assert.deepEqual(parsePortfolioProject(JSON.stringify(draft)), draft)
  assert.throws(() => portfolioProjectFiles(draft), /Complete the brand/)
  draft.copy.brand = "My practice"
  assert.throws(() => portfolioProjectFiles(draft))
})

test("complete site export preserves every section and publication choices as fixed JSON files", () => {
  const draft = project()
  draft.copy.brand = "Buyer <literal>"
  draft.portfolio.cases.push({ ...draft.portfolio.cases[0], title: "Another case", illustrative: false })
  draft.portfolio.cases[0].illustrative = false
  draft.portfolio.contact.href = "mailto:buyer@example.com"
  draft.publication = { schemaVersion: "1.0.0", mode: "published", canonicalUrl: "https://example.com/buyer", indexable: true }
  const files = portfolioProjectFiles(draft)
  assert.deepEqual(Object.keys(files), ["content/site.json", "content/portfolio.json", "content/publication.json"])
  assert.deepEqual(files["content/portfolio.json"], draft.portfolio)
  assert.deepEqual(files["content/publication.json"], draft.publication)
  assert.equal(files["content/site.json"].copy.brand, draft.copy.brand)
})

test("unsafe destinations stay editable draft data and never enter a rendered site", () => {
  for (const value of ["javascript:alert(1)", "https://user:password@example.com", "mailto:a@example.com?bcc=b@example.com"]) {
    const draft = project()
    draft.portfolio.contact.href = value
    assert.equal(parsePortfolioProject(JSON.stringify(draft)).portfolio.contact.href, value)
    assert.throws(() => portfolioProjectFiles(draft))
  }
  const draft = project()
  draft.portfolio.cases[0].evidenceUrl = "data:text/html,<script>alert(1)</script>"
  assert.throws(() => portfolioProjectFiles(draft))
})

test("draft import rejects malformed, oversized and mistyped fields without mutating its input", () => {
  const draft = project()
  const original = JSON.stringify(draft)
  for (const source of ["{", "null", "[]", " ".repeat(portfolioProjectByteLimit + 1)]) assert.throws(() => parsePortfolioProject(source))
  for (const mutate of [
    (value) => { value.copy.brand = 12 },
    (value) => { value.portfolio.cases = [] },
    (value) => { value.portfolio.cases = Array(7).fill(value.portfolio.cases[0]) },
    (value) => { value.portfolio.cases[0].illustrative = "false" },
    (value) => { value.publication.indexable = "true" },
    (value) => { value.portfolio.contact.href = {} },
    (value) => { value.copy.headline = "x".repeat(111) },
    (value) => { value.copy.brand = "bad\u0000value" },
  ]) {
    const changed = structuredClone(draft)
    mutate(changed)
    assert.throws(() => parsePortfolioProject(JSON.stringify(changed)))
  }
  assert.equal(JSON.stringify(draft), original)
})

test("unknown executable and release properties are discarded at every draft level", () => {
  const draft = project()
  const injected = { ...draft, scripts: { postinstall: "do not run" }, copy: { ...draft.copy, released: true },
    portfolio: { ...draft.portfolio, cases: draft.portfolio.cases.map((entry) => ({ ...entry, verified: true })),
      contact: { ...draft.portfolio.contact, token: "synthetic" } }, publication: { ...draft.publication, gate: "PASS" } }
  assert.deepEqual(parsePortfolioProject(JSON.stringify(injected)), draft)
})

test("six maximum-length Unicode cases can still be saved when too large for site publication", () => {
  const draft = project()
  const entry = { title: "界".repeat(160), category: "界".repeat(80), role: "界".repeat(160), poster: "界".repeat(100),
    summary: "界".repeat(600), context: "界".repeat(2000), decision: "界".repeat(2000), evidence: "界".repeat(2000), evidenceUrl: null, illustrative: true }
  draft.portfolio.cases = Array.from({ length: 6 }, () => ({ ...entry }))
  assert.deepEqual(parsePortfolioProject(JSON.stringify(draft)), draft)
  assert.throws(() => portfolioProjectFiles(draft), /64 KiB/)
})
