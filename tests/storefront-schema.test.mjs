import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

import { SCHEMA_ID, NODE_TYPES, validateStorefront, isForSale } from "../lib/storefront/schema.mjs"

const repoRoot = fileURLToPath(new URL("../", import.meta.url))
const configPath = fileURLToPath(new URL("../storefront.config.json", import.meta.url))
const starter = () => JSON.parse(readFileSync(configPath, "utf8"))

const firstProduct = (config) => config.releases[0].products[0]

const codesOf = (report) => report.errors.map((entry) => entry.code)

test("Storefront.v1 declares exactly the eight node types", () => {
  assert.equal(SCHEMA_ID, "storefront.v1")
  assert.deepEqual(NODE_TYPES, [
    "Release",
    "Product",
    "Price",
    "CheckoutHandoff",
    "Delivery",
    "Proof",
    "Campaign",
    "StudioMetric",
  ])
})

test("the shipped starter config is valid", () => {
  const report = validateStorefront(starter())
  assert.deepEqual(report.errors, [])
})

test("the shipped starter sells nothing, so no page can render a buy control", () => {
  const config = starter()
  const products = config.releases.flatMap((release) => release.products)

  assert.ok(products.length > 0)
  for (const product of products) {
    assert.equal(product.price, null, `${product.slug} must ship without a price`)
    assert.equal(product.checkoutHandoff.rail, "none", `${product.slug} must ship without a rail`)
    assert.equal(product.checkoutHandoff.url, null)
    assert.equal(isForSale(product), false)
  }
})

test("a price without a checkout rail is refused", () => {
  const config = starter()
  firstProduct(config).price = {
    amount: 29,
    currency: "USD",
    kind: "one-time",
    meta: {
      owner: "creator",
      provenance: "authored",
      version: "1.0.0",
      visibility: "public",
      evaluation: "Matches the amount configured on the rail.",
    },
  }

  const report = validateStorefront(config)
  assert.ok(codesOf(report).includes("E_PRICE_WITHOUT_RAIL"))
  assert.equal(report.ok, false)
})

test("a checkout rail without a price is refused", () => {
  const config = starter()
  firstProduct(config).checkoutHandoff.rail = "polar"
  firstProduct(config).checkoutHandoff.url = "https://polar.sh/example/checkout"

  const report = validateStorefront(config)
  assert.ok(codesOf(report).includes("E_RAIL_WITHOUT_PRICE"))
})

test("a rail URL must be https and must not carry credentials", () => {
  const withPrice = (config) => {
    const product = firstProduct(config)
    product.price = {
      amount: 29,
      currency: "USD",
      kind: "one-time",
      meta: {
        owner: "creator",
        provenance: "authored",
        version: "1.0.0",
        visibility: "public",
        evaluation: "Matches the amount configured on the rail.",
      },
    }
    product.checkoutHandoff.rail = "polar"
    return product
  }

  const insecure = starter()
  withPrice(insecure).checkoutHandoff.url = "http://polar.sh/example/checkout"
  assert.ok(codesOf(validateStorefront(insecure)).includes("E_INSECURE_URL"))

  const leaky = starter()
  withPrice(leaky).checkoutHandoff.url = "https://key:secret@polar.sh/example/checkout"
  assert.ok(codesOf(validateStorefront(leaky)).includes("E_CREDENTIALS_IN_URL"))
})

test("a URL on a product with no rail is refused rather than silently ignored", () => {
  const config = starter()
  firstProduct(config).checkoutHandoff.url = "https://polar.sh/example/checkout"
  assert.ok(codesOf(validateStorefront(config)).includes("E_ORPHAN_HANDOFF_URL"))
})

test("an affiliate link without a real disclosure is refused", () => {
  const affiliate = (disclosure) => ({
    network: "Example Network",
    url: "https://example.com/ref/creator",
    disclosure,
    meta: {
      owner: "creator",
      provenance: "third-party",
      version: "1.0.0",
      visibility: "public",
      evaluation: "The disclosure is visible next to the link on the rendered page.",
    },
  })

  const missing = starter()
  firstProduct(missing).affiliate = affiliate("ad")
  assert.ok(codesOf(validateStorefront(missing)).includes("E_AFFILIATE_WITHOUT_DISCLOSURE"))

  const disclosed = starter()
  firstProduct(disclosed).affiliate = affiliate(
    "This is an affiliate link. If you buy through it, the creator of this storefront earns a commission at no extra cost to you.",
  )
  assert.deepEqual(validateStorefront(disclosed).errors, [])
})

test("a proof without openable evidence is refused", () => {
  const config = starter()
  firstProduct(config).proofs[0].evidenceUrl = "ask me for the data"
  assert.ok(codesOf(validateStorefront(config)).includes("E_NOT_A_URL"))
})

test("a sample metric must say sample in the label a reader sees", () => {
  const config = starter()
  config.studioMetrics[0].label = "Monthly revenue"
  assert.ok(codesOf(validateStorefront(config)).includes("E_SAMPLE_METRIC_UNLABELED"))
})

test("a measured metric must name the instrument that produced it", () => {
  const config = starter()
  config.studioMetrics[0].meta.provenance = "measured"
  config.studioMetrics[0].source = null
  assert.ok(codesOf(validateStorefront(config)).includes("E_UNSOURCED_MEASUREMENT"))
})

test("every node carries owner, provenance, version, visibility, and evaluation", () => {
  const config = starter()
  delete firstProduct(config).meta.evaluation
  assert.ok(codesOf(validateStorefront(config)).includes("E_MISSING_KEY"))
})

test("the schema is closed — an invented key is an error, not a shrug", () => {
  const config = starter()
  firstProduct(config).discountPercent = 40
  assert.ok(codesOf(validateStorefront(config)).includes("E_UNKNOWN_KEY"))
})

test("duplicate slugs and dangling campaign edges are refused", () => {
  const duplicate = starter()
  const release = duplicate.releases[0]
  release.products.push(JSON.parse(JSON.stringify(release.products[0])))
  assert.ok(codesOf(validateStorefront(duplicate)).includes("E_DUPLICATE_ID"))

  const dangling = starter()
  dangling.campaigns.push({
    id: "launch-week",
    name: "Launch week",
    releaseId: "edition-nowhere",
    channel: "newsletter",
    startsAt: "2026-09-10",
    endsAt: null,
    goal: "Reach the first hundred readers of the release note.",
    meta: {
      owner: "creator",
      provenance: "authored",
      version: "1.0.0",
      visibility: "private",
      evaluation: "Every campaign must point at a release that exists in this file.",
    },
  })
  assert.ok(codesOf(validateStorefront(dangling)).includes("E_DANGLING_EDGE"))
})

test("the CLI exits 0 on the starter and 1 on a broken config", () => {
  const output = execFileSync(process.execPath, ["bin/validate-storefront.mjs", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
  const report = JSON.parse(output)
  assert.equal(report.ok, true)

  assert.throws(() =>
    execFileSync(process.execPath, ["bin/validate-storefront.mjs", "package.json", "--json"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
    }),
  )
})
