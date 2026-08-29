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
    "app/checkout/[slug]/loading.tsx",
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

  assert.equal(
    existsSync(new URL("../app/loading.tsx", import.meta.url)),
    false,
    "global loading UI must not stream static storefront pages behind a JavaScript swap",
  )
})

test("checkout fallback is honest and never embeds a secret", () => {
  const checkout = read("lib/checkout.ts")
  const checkoutPage = read("app/checkout/[slug]/page.tsx")

  assert.match(checkout, /NEXT_PUBLIC_CHECKOUT_GUIDE_URL/)
  assert.doesNotMatch(checkout, /API_KEY|SECRET|TOKEN/)
  assert.match(checkout, /url\.protocol === "https:"/)
  assert.match(checkout, /!url\.username && !url\.password/)
  assert.match(checkoutPage, /No payment is collected/)
  assert.match(checkoutPage, /Never expose API keys/)
})

test("public routes ship a conservative security-header baseline", () => {
  const nextConfig = read("next.config.ts")

  for (const header of [
    "Content-Security-Policy",
    "Permissions-Policy",
    "Referrer-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
  ]) {
    assert.match(nextConfig, new RegExp(`key: ["']${header}["']`))
  }

  assert.match(nextConfig, /frame-ancestors 'none'/)
  assert.match(nextConfig, /object-src 'none'/)
  assert.match(nextConfig, /source: ["']\/:path\*["']/)
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
  assert.doesNotMatch(read("lib/site.ts"), /studio@example\.com/)
  assert.match(read("lib/site.ts"), /VERCEL_PROJECT_PRODUCTION_URL/)
})

test("the public UI keeps interface copy in sentence case", () => {
  const files = [
    "app/checkout/[slug]/page.tsx",
    "app/globals.css",
    "app/opengraph-image.tsx",
    "app/page.tsx",
    "app/products/[slug]/page.tsx",
    "app/studio/page.tsx",
    "components/launch-console.tsx",
    "components/product-card.tsx",
    "components/product-explorer.tsx",
    "components/site-header.tsx",
  ]
  const source = files.map(read).join("\n")

  assert.doesNotMatch(source, /\buppercase\b/)
  assert.doesNotMatch(source, /text-transform\s*:\s*uppercase/i)
  assert.doesNotMatch(source, /textTransform\s*:\s*["']uppercase["']/)
})

test("muted interface labels preserve readable contrast", () => {
  const darkSurfaceFiles = [
    "app/checkout/[slug]/page.tsx",
    "app/page.tsx",
    "app/studio/page.tsx",
    "components/launch-console.tsx",
  ]
  const lightSurfaceFiles = [
    "app/checkout/[slug]/page.tsx",
    "app/page.tsx",
    "app/products/[slug]/page.tsx",
    "app/products/page.tsx",
    "app/studio/page.tsx",
    "components/product-card.tsx",
    "components/product-explorer.tsx",
    "components/site-footer.tsx",
    "components/site-header.tsx",
  ]

  assert.doesNotMatch(
    darkSurfaceFiles.map(read).join("\n"),
    /text-white\/(?:[0-3]\d|4[0-4])\b/,
    "white text on the ink surface must use at least 45% opacity",
  )
  assert.doesNotMatch(
    lightSurfaceFiles.map(read).join("\n"),
    /text-ink\/(?:[0-4]\d|5[0-7])\b/,
    "ink text on the paper surface must use at least 58% opacity",
  )

  for (const file of ["components/product-card.tsx", "app/products/[slug]/page.tsx"]) {
    const source = read(file)
    assert.match(source, /blue: "bg-blue text-ink"/)
    assert.doesNotMatch(source, /opacity-(?:60|65|70)\b/)
  }
})

test("premium motion stays inside one responsive, self-cleaning boundary", () => {
  const motion = read("components/home-motion.tsx")
  const home = read("app/page.tsx")

  assert.match(motion, /useGSAP/)
  assert.match(motion, /gsap\.matchMedia\(\)/)
  assert.match(motion, /prefers-reduced-motion: reduce/)
  assert.match(motion, /pointer: fine/)
  assert.match(motion, /removeEventListener/)
  assert.match(motion, /media\.revert\(\)/)
  assert.match(home, /data-hero-stage/)
  assert.match(home, /data-release-story/)
  assert.match(home, /data-story-panel/)
})

test("v0 remains the static composition lane while local code owns GSAP", () => {
  const brief = read("docs/V0-BUILD-BRIEF.md")
  const scene = read("docs/GSAP-SCENE-BRIEF.md")

  assert.match(brief, /v0 owns static composition/i)
  assert.match(brief, /do not author or replace GSAP code/i)
  assert.match(scene, /one signature hero/i)
  assert.match(scene, /one ScrollTrigger narrative/i)
})
