import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { test } from "node:test"

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")

test("manifest exposes a public, zero-secret deploy path", () => {
  const manifest = JSON.parse(read("template.manifest.json"))

  assert.equal(manifest.maturity, "remixable")
  assert.deepEqual(manifest.requiredEnvironmentVariables, [])
  assert.match(manifest.sourceRepository, /^https:\/\/github\.com\/frankxai\/creator-launch-os$/)
  assert.match(manifest.deployUrl, /^https:\/\/vercel\.com\/new\/clone\?/)
})

test("complete Next.js states are present", () => {
  const requiredFiles = [
    "app/layout.tsx",
    "app/page.tsx",
    "app/loading.tsx",
    "app/error.tsx",
    "app/not-found.tsx",
    "app/products/page.tsx",
    "app/products/[slug]/page.tsx",
    "app/checkout/[slug]/page.tsx",
    "app/studio/page.tsx",
    "app/api/health/route.ts",
    "app/robots.ts",
    "app/sitemap.ts",
    "app/opengraph-image.tsx",
  ]

  for (const file of requiredFiles) {
    assert.equal(existsSync(new URL(`../${file}`, import.meta.url)), true, `${file} must exist`)
  }
})

test("checkout fallback is honest and never embeds a secret", () => {
  const checkout = read("lib/checkout.ts")
  const checkoutPage = read("app/checkout/[slug]/page.tsx")

  assert.match(checkout, /NEXT_PUBLIC_CHECKOUT_GUIDE_URL/)
  assert.doesNotMatch(checkout, /API_KEY|SECRET|TOKEN/)
  assert.match(checkoutPage, /No payment is collected/)
  assert.match(checkoutPage, /Never expose API keys/)
})

test("sample metrics and transactions are labeled as demo data", () => {
  const studio = read("app/studio/page.tsx")
  const consoleComponent = read("components/launch-console.tsx")

  assert.match(studio, /Sample operations view/)
  assert.match(studio, /Demo readiness/)
  assert.match(studio, /Live transactions/)
  assert.match(consoleComponent, /Demo data/)
})

test("the public UI avoids dead links and emoji chrome", () => {
  const files = [
    "app/page.tsx",
    "app/products/page.tsx",
    "app/products/[slug]/page.tsx",
    "app/studio/page.tsx",
    "components/site-header.tsx",
    "components/site-footer.tsx",
  ]
  const source = files.map(read).join("\n")

  assert.doesNotMatch(source, /href=["']#["']/)
  assert.doesNotMatch(source, /[🚀✨🔥💎⚡]/u)
})
