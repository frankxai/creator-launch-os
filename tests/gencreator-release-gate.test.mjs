import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { test } from "node:test"
import ts from "typescript"

import { loadCommerce } from "./support/load-commerce.mjs"

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
const { engine, config } = await loadCommerce()
const registry = JSON.parse(read("data/products.graph.json"))
const product = registry.products.find((entry) => entry.id === "creator-launch-os")

/** Simulate Upstash/Vercel KV REST commands in-test while exercising real fetch() in store.ts. */
function withMockKv(fn) {
  const hashes = new Map()
  const strings = new Map()
  const audienceCalls = []
  const origFetch = globalThis.fetch
  const origEnv = { ...process.env }

  return async () => {
    hashes.clear()
    strings.clear()
    audienceCalls.length = 0
    process.env.UPSTASH_REDIS_REST_URL = "https://kv.example.invalid"
    process.env.UPSTASH_REDIS_REST_TOKEN = "token-fixture"
    process.env.RESEND_API_KEY = "re_fixture"
    process.env.RESEND_AUDIENCE_ID__CREATOR_LAUNCH_OS = "aud_creator_launch_os"

    globalThis.fetch = async (url, init) => {
      if (String(url).startsWith("https://api.resend.com/")) {
        audienceCalls.push(JSON.parse(init.body))
        return new Response(JSON.stringify({ id: "contact_1" }), { status: 200 })
      }
      const cmd = JSON.parse(init.body)
      const [op, key, field, val] = cmd
      if (op === "hsetnx") {
        let h = hashes.get(key)
        if (!h) { h = new Map(); hashes.set(key, h) }
        if (h.has(field)) return new Response(JSON.stringify({ result: 0 }), { status: 200 })
        h.set(field, val)
        return new Response(JSON.stringify({ result: 1 }), { status: 200 })
      }
      if (op === "incr") {
        const next = (Number(strings.get(key)) || 0) + 1
        strings.set(key, String(next))
        return new Response(JSON.stringify({ result: next }), { status: 200 })
      }
      if (op === "get") {
        return new Response(JSON.stringify({ result: strings.get(key) ?? null }), { status: 200 })
      }
      if (op === "hset") {
        let h = hashes.get(key)
        if (!h) { h = new Map(); hashes.set(key, h) }
        h.set(field, val)
        return new Response(JSON.stringify({ result: 1 }), { status: 200 })
      }
      if (op === "hget") {
        return new Response(JSON.stringify({ result: hashes.get(key)?.get(field) ?? null }), { status: 200 })
      }
      if (op === "hgetall") {
        const h = hashes.get(key)
        const flat = []
        if (h) for (const [k, v] of h.entries()) flat.push(k, v)
        return new Response(JSON.stringify({ result: flat }), { status: 200 })
      }
      throw new Error(`Unexpected KV op: ${op}`)
    }

    try {
      await fn({ hashes, strings, audienceCalls })
    } finally {
      globalThis.fetch = origFetch
      for (const k of [" KV_REST_API_URL", "KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "RESEND_API_KEY", "RESEND_AUDIENCE_ID__CREATOR_LAUNCH_OS"]) {
        if (origEnv[k] === undefined) delete process.env[k]
        else process.env[k] = origEnv[k]
      }
    }
  }
}

test("waitlist fails closed (KvNotConfiguredError) when neither KV_REST_API_* nor UPSTASH_REDIS_REST_* is set", async () => {
  delete process.env.KV_REST_API_URL
  delete process.env.KV_REST_API_TOKEN
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  handler.resetWaitlistRateLimiter()

  const req = new Request("https://creator-launch-os-starlight-intelligence.vercel.app/api/waitlist", { method: "POST" })
  await assert.rejects(
    () => handler.handleJoin(product, { email: "buyer@example.com", consent: true }, req),
    (err) => err instanceof store.KvNotConfiguredError && err.code === "E_KV_NOT_CONFIGURED",
  )
  await assert.rejects(
    () => handler.handleState(product),
    (err) => err instanceof store.KvNotConfiguredError,
  )
  const routeSource = read("app/api/waitlist/route.ts")
  assert.match(routeSource, /KvNotConfiguredError/)
  assert.match(routeSource, /status: 503/)
  const envExample = read(".env.example")
  for (const key of ["KV_REST_API_URL=", "KV_REST_API_TOKEN=", "UPSTASH_REDIS_REST_URL=", "UPSTASH_REDIS_REST_TOKEN=", "RESEND_API_KEY=", "RESEND_AUDIENCE_ID="]) {
    assert.ok(envExample.includes(key), `.env.example must document ${key}`)
  }
})

test(
  "waitlist enforces atomic HSETNX position claim, stepToken overwrite guard, honeypot, rate limit and verification",
  withMockKv(async ({ audienceCalls }) => {
    handler.resetWaitlistRateLimiter()
    const makeReq = (ip = "203.0.113.10") =>
      new Request("https://creator-launch-os-starlight-intelligence.vercel.app/api/waitlist?utm_source=test", {
        method: "POST",
        headers: { "x-forwarded-for": ip },
      })

    // Bot honeypot is rejected
    const bot = await handler.handleJoin(product, { email: "bot@example.com", consent: true, website: "https://spam.invalid" }, makeReq())
    assert.equal(bot.status, 400)

    // Step 1: atomic claim returns position 1, stepToken, and withholds publicCount below threshold (50)
    const step1 = await handler.handleJoin(product, { email: "Creator@Example.com", consent: true, source: "/kit" }, makeReq())
    assert.equal(step1.status, 200)
    assert.equal(step1.body.position, 1)
    assert.equal(step1.body.publicCount, null)
    assert.equal(typeof step1.body.stepToken, "string")
    assert.equal(audienceCalls.length, 0, "unverified signup must not immediately push to Resend audience")

    // Attempting to overwrite Step-2 answers by email alone (missing or wrong stepToken) is rejected with 403
    const spoofed = await handler.handleJoin(
      product,
      { email: "creator@example.com", consent: true, role: "Attacker", priceBand: "free-only" },
      makeReq(),
    )
    assert.equal(spoofed.status, 403)
    const wrongToken = await handler.handleJoin(
      product,
      { email: "creator@example.com", consent: true, stepToken: "wrong-token", role: "Attacker" },
      makeReq(),
    )
    assert.equal(wrongToken.status, 403)

    // Step 2 with the valid stepToken succeeds and keeps position 1
    const step2 = await handler.handleJoin(
      product,
      {
        email: "creator@example.com",
        consent: true,
        stepToken: step1.body.stepToken,
        role: "Independent creator",
        priceBand: "25-99",
        urgency: "now",
        pain: "Turn my existing guides into an owned storefront.",
      },
      makeReq(),
    )
    assert.equal(step2.status, 200)
    assert.equal(step2.body.position, 1)
    assert.equal(step2.body.count, 1)

    const signals = await store.allSignals("creator-launch-os")
    assert.equal(signals.length, 1)
    assert.equal(signals[0].role, "Independent creator")
    assert.equal(signals[0].priceBand, "25-99")
    assert.equal(signals[0].verified, false)

    // Per-IP rate limiter blocks excessive POSTs from the same IP with 429
    for (let i = 0; i < 8; i++) {
      await handler.handleJoin(product, { email: `r${i}@example.com`, consent: true }, makeReq("198.51.100.77"))
    }
    const limited = await handler.handleJoin(product, { email: "overflow@example.com", consent: true }, makeReq("198.51.100.77"))
    assert.equal(limited.status, 429)
  }),
)

test("webhook timestamp freshness and self-hosted COMMERCE_ENV=production guard hold", () => {
  const now = new Date("2026-10-24T01:00:00.000Z")
  const freshTs = String(Math.floor(now.getTime() / 1000))
  const staleTs = String(Math.floor(now.getTime() / 1000) - 301)
  const futureTs = String(Math.floor(now.getTime() / 1000) + 301)

  assert.doesNotThrow(() => engine.verifyWebhookTimestamp(null, now))
  assert.doesNotThrow(() => engine.verifyWebhookTimestamp(freshTs, now))
  assert.throws(() => engine.verifyWebhookTimestamp(staleTs, now), { code: "E_SIGNATURE" })
  assert.throws(() => engine.verifyWebhookTimestamp(futureTs, now), { code: "E_SIGNATURE" })
  assert.throws(() => engine.verifyWebhookTimestamp("not-a-timestamp", now), { code: "E_SIGNATURE" })

  const prodRuntime = config.readCommerceRuntime({
    COMMERCE_MODE: "test",
    COMMERCE_MERCHANT: "fixture",
    COMMERCE_WEBHOOK_SECRET: "w".repeat(40),
    COMMERCE_DELIVERY_SECRET: "d".repeat(40),
    COMMERCE_ENV: "production",
  })
  assert.deepEqual(config.kitAvailability(prodRuntime), { state: "available-soon" })
})

test("buyer-facing copy stays in GenCreator voice, labels refund terms as draft and makes no unratified price-lock promise", () => {
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
  const kitPage = read("app/kit/page.tsx")
  assert.match(kitPage, /Sell digital products from your own domain—and prove payment, delivery and refunds work before you go live\./)
  assert.match(kitPage, /Draft policy \(\{offer\.refund\.state\}, pending owner ratification\)/)
  assert.doesNotMatch(kitPage, /keep launch pricing for life|lock founding terms/i)
  assert.doesNotMatch(read("data/products.graph.json"), /Price lock for life/i)
  assert.doesNotMatch(read("docs/release/LAUNCH-PREP-DRAFTS-2026-10.md"), /keep launch pricing for life|Founding price lock/i)
})

test("every tracked image carries a valid .vis.provenance.json sidecar and no Higgsfield provenance", () => {
  const images = ["app/icon.svg"]
  for (const img of images) {
    const sidecarPath = `${img}.vis.provenance.json`
    assert.ok(existsSync(new URL(sidecarPath, root)), `missing provenance sidecar: ${sidecarPath}`)
    const sidecar = JSON.parse(read(sidecarPath))
    const actualSha = createHash("sha256").update(readBytes(img)).digest("hex")
    assert.equal(sidecar.sha256, actualSha, `provenance sha256 mismatch for ${img}`)
    assert.doesNotMatch(JSON.stringify(sidecar), /higgsfield/i)
  }
})

test("G5 price evidence pack defines launch, standard and team proposals against verified HTTP-200 competitors", () => {
  const g5 = read("docs/release/G5-PRICE-EVIDENCE.md")
  const bar = read("docs/release/COMPETITIVE-BAR-2026-10.md")
  for (const url of [
    "https://www.framer.com/marketplace/templates/supplier/",
    "https://builtbyjoshstudio.com/products/creator-os-full-stack.html",
    "https://www.thatvibecoder.io/products",
    "https://www.framer.com/marketplace/templates/mention/",
    "https://www.menphine.com/notion-templates/notion-creator-os",
  ]) {
    assert.ok(g5.includes(url), `G5 evidence must include verified competitor URL: ${url}`)
    assert.ok(bar.includes(url), `COMPETITIVE-BAR must include verified competitor URL: ${url}`)
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
  const buyerJobOpeners = drafts.match(/^When you (?:need|want|wire|package|prepare|are turning) /gm) ?? []
  assert.equal(buyerJobOpeners.length, 7, "landing copy, 5 posts and 1 email must each open with a concrete buyer job")
  for (const citation of [
    "package.json:27",
    "LICENSE:1",
    "template.manifest.json:39",
    "components/portfolio-workspace.tsx:45",
    "scripts/export-template-project.mjs:179",
    "app/start/page.tsx:75",
    "lib/commerce/engine.ts:219-250",
    "lib/commerce/engine.ts:265",
    "app/api/commerce/webhook/route.ts:10,45",
    "lib/commerce/engine.ts:344",
    "app/kit/page.tsx:208",
    "app/kit/page.tsx:239",
    "app/kit/page.tsx:332",
    "app/kit/page.tsx:353",
    "lib/demand-capture/handler.ts:56",
  ]) {
    assert.ok(drafts.includes(citation), `launch copy must cite G0 evidence: ${citation}`)
  }
})

test("kit page embeds the 4-step FirstSaleRehearsal and the honest What you still do yourself boundary", () => {
  const kitPage = read("app/kit/page.tsx")
  const rehearsal = read("components/first-sale-rehearsal.tsx")
  assert.match(kitPage, /<FirstSaleRehearsal steps=\{rehearsalSteps\} \/>/)
  assert.match(kitPage, /What you still do yourself/)
  assert.match(rehearsal, /Walk one test order from webhook to delivery email and refund revocation\./)
  assert.doesNotMatch(rehearsal, /\$\s?\d/, "rehearsal component must not render a hand-typed dollar price")
})
