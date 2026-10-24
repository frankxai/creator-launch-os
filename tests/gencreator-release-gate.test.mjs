import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { test } from "node:test"
import ts from "typescript"

const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")
const readBytes = (path) => readFileSync(new URL(path, root))

async function loadDemandCapture() {
  const dir = mkdtempSync(join(tmpdir(), "creator-demand-capture-"))
  process.once("exit", () => rmSync(dir, { recursive: true, force: true }))
  for (const name of ["types", "questions", "store", "handler"]) {
    const source = read(`lib/demand-capture/${name}.ts`)
    const output = ts
      .transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
      .outputText.replace(/from "\.\/(types|questions|store|handler)"/g, 'from "./$1.mjs"')
    writeFileSync(join(dir, `${name}.mjs`), output)
  }
  const store = await import(pathToFileURL(join(dir, "store.mjs")).href)
  const handler = await import(pathToFileURL(join(dir, "handler.mjs")).href)
  const questions = await import(pathToFileURL(join(dir, "questions.mjs")).href)
  return { store, handler, questions }
}

const { store, handler, questions } = await loadDemandCapture()
const registry = JSON.parse(read("data/products.graph.json"))
const product = registry.products.find((entry) => entry.id === "creator-launch-os")

test("shared demand-capture waitlist enforces consent, withholds counts below threshold and updates in place", async () => {
  store.resetMemoryWaitlistStore()
  assert.ok(product, "creator-launch-os must exist in data/products.graph.json")
  assert.equal(product.waitlist.enabled, true)
  assert.equal(product.waitlist.publicCountThreshold, 50)
  assert.ok(questions.rolesFor("creator-launch-os").includes("Independent creator"))

  const req = new Request("https://creator-launch-os-starlight-intelligence.vercel.app/api/waitlist?utm_source=test", {
    method: "POST",
  })

  // Missing consent or invalid email is rejected
  const noConsent = await handler.handleJoin(product, { email: "Creator@Example.com", consent: false }, req)
  assert.equal(noConsent.status, 400)
  const badEmail = await handler.handleJoin(product, { email: "not-an-email", consent: true }, req)
  assert.equal(badEmail.status, 400)

  // Step 1: email + consent claims position 1 and withholds publicCount below threshold (50)
  const step1 = await handler.handleJoin(product, { email: "Creator@Example.com", consent: true, source: "/kit" }, req)
  assert.equal(step1.status, 200)
  assert.equal(step1.body.position, 1)
  assert.equal(step1.body.count, 1)
  assert.equal(step1.body.publicCount, null, "count below threshold must never be exposed")
  assert.equal(step1.body.foundingSeatsLeft, 99)

  // Step 2: same email refines role, priceBand, urgency and pain without double-counting
  const step2 = await handler.handleJoin(
    product,
    {
      email: "creator@example.com",
      consent: true,
      role: "Independent creator",
      priceBand: "25-99",
      urgency: "now",
      pain: "Turn my existing guides and notes into an owned storefront.",
    },
    req,
  )
  assert.equal(step2.status, 200)
  assert.equal(step2.body.position, 1, "re-submit must keep original queue position")
  assert.equal(step2.body.count, 1, "re-submit must not increment count")

  const signals = await store.allSignals("creator-launch-os")
  assert.equal(signals.length, 1)
  assert.equal(signals[0].priceBand, "25-99")
  assert.equal(signals[0].role, "Independent creator")
  assert.deepEqual(signals[0].utm, { utm_source: "test" })

  // Threshold check: publicCount appears only at >= 50
  assert.equal(handler.publicState(product, 49).publicCount, null)
  assert.equal(handler.publicState(product, 50).publicCount, 50)
})

test("buyer-facing copy stays in GenCreator voice: sentence case and no hype words", () => {
  const files = [
    "app/page.tsx",
    "app/start/page.tsx",
    "app/products/page.tsx",
    "app/products/[slug]/page.tsx",
    "app/studio/page.tsx",
    "app/kit/page.tsx",
    "lib/products.ts",
  ]
  const combined = files.map(read).join("\n")
  assert.doesNotMatch(
    combined,
    /\b(revolutionary|game-changing|unprecedented|supercharge|skyrocket|10x|guaranteed|magic)\b/i,
    "buyer-facing copy must avoid hype words",
  )
  assert.match(read("app/kit/page.tsx"), /Your source is the beginning\. Your choices make the edition\./)
  assert.match(read("app/studio/page.tsx"), />Release studio</)
})

test("every tracked image carries a valid .vis.provenance.json sidecar and no Higgsfield provenance", () => {
  const images = [
    "app/icon.svg",
    "docs/release/evidence/kit-375.webp",
    "docs/release/evidence/kit-768.webp",
    "docs/release/evidence/kit-1440.webp",
  ]
  for (const img of images) {
    if (!existsSync(new URL(img, root))) continue
    const sidecarPath = `${img}.vis.provenance.json`
    assert.ok(existsSync(new URL(sidecarPath, root)), `missing provenance sidecar: ${sidecarPath}`)
    const sidecar = JSON.parse(read(sidecarPath))
    const actualSha = createHash("sha256").update(readBytes(img)).digest("hex")
    assert.equal(sidecar.sha256, actualSha, `provenance sha256 mismatch for ${img}`)
    assert.doesNotMatch(JSON.stringify(sidecar), /higgsfield/i)
  }
})

test("G5 price evidence pack defines launch, standard and team proposals while keeping offer.facts.json unlocked", () => {
  const g5 = read("docs/release/G5-PRICE-EVIDENCE.md")
  for (const url of [
    "https://virtualbacon.com/products/supply",
    "https://www.framer.com/marketplace/templates/supplier/",
    "https://builtbyjoshstudio.com/products/creator-os-full-stack.html",
    "https://framplates.com/templateshop",
    "https://www.thatvibecoder.io/products",
  ]) {
    assert.ok(g5.includes(url), `G5 evidence must include competitor URL: ${url}`)
  }
  assert.match(g5, /\*\*\$49 USD\*\* one-time/)
  assert.match(g5, /\*\*\$69 USD\*\* one-time/)
  assert.match(g5, /\*\*\$149 USD\*\* one-time/)
  assert.match(g5, /What would you expect something like this to cost\?/)
  assert.match(g5, /Decision: Do Not Bundle/)
  const facts = JSON.parse(read("offer.facts.json"))
  assert.equal(facts.price.state, "decision_required")
  assert.equal(facts.price.amount, null)
})

test("launch copy final pass opens with a buyer job, uses zero superlatives and maps claims to G0 file:line citations", () => {
  const drafts = read("docs/release/LAUNCH-PREP-DRAFTS-2026-10.md")
  assert.doesNotMatch(
    drafts,
    /\b(best|ultimate|fastest|easiest|first-ever|unbeatable|premier|greatest|flawless|seamless|revolutionary|game-changing|supercharge|skyrocket)\b/i,
    "launch copy must contain no superlatives or hype words",
  )
  // Every section (landing, 5 posts, email) opens with "When you..." naming a concrete buyer job
  const buyerJobOpeners = drafts.match(/^When you (?:need|want|wire|package|prepare|are turning) /gm) ?? []
  assert.equal(buyerJobOpeners.length, 7, "landing copy, 5 posts and 1 email must each open with a concrete buyer job")
  for (const citation of [
    "package.json:27",
    "LICENSE:1",
    "template.manifest.json:39",
    "components/portfolio-workspace.tsx:45",
    "scripts/export-template-project.mjs:179",
    "app/start/page.tsx:75",
    "lib/commerce/engine.ts:200",
    "lib/commerce/engine.ts:256",
    "app/api/commerce/webhook/route.ts:10",
    "lib/commerce/engine.ts:335",
    "app/kit/page.tsx:118",
    "lib/demand-capture/handler.ts:31",
  ]) {
    assert.ok(drafts.includes(citation), `launch copy must cite G0 evidence: ${citation}`)
  }
})
