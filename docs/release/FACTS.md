# CMO & Creative Facts Sheet — Creator Launch OS (`sku_creator_launch_os_v1`)

> **Single source of truth for creative, copy, and launch posts.**
> Enforced in CI by `scripts/check-offer-facts.mjs` and `tests/gencreator-release-gate.test.mjs` so creative never drifts from `offer.facts.json`, `package.json`, `release/package-manifest.json`, or CI-printed test/bundle counts.

---

## 1. Identity & Commercial Posture (Derived from `offer.facts.json` & `package.json`)

| Fact | Value | Source |
| :--- | :--- | :--- |
| **Product ID** | `product_creator_launch_os` | `offer.facts.json:3` |
| **SKU ID** | `sku_creator_launch_os_v1` | `offer.facts.json:4` |
| **Brand ID** | `brand_gencreator` (GenCreator) | `offer.facts.json:5` |
| **Title** | `Creator Launch OS` | `offer.facts.json:6` |
| **Version** | `1.1.0` | `package.json:3`, `offer.facts.json:7` |
| **Free Core License** | `MIT` | `LICENSE:1`, `offer.facts.json:11` |
| **Next.js Version** | `16.4.3` (patches `GHSA-673q-mjm6-r5xr` & `GHSA-2464-fhr4-w9xw`) | `package.json:28` |
| **Sharp Override** | `0.35.5` (`libheif 1.23.5`) | `pnpm-workspace.yaml:11` |
| **Price State** | `decision_required` (`amount: null`) | `offer.facts.json:39-44` |
| **Merchant / Checkout State** | `decision_required` (`COMMERCE_MODE=off` by default -> `Available soon`) | `offer.facts.json:45-48`, `lib/commerce/config.ts:72` |
| **Refund Policy State** | `draft` (`window_days: 14`, pending owner ratification) | `offer.facts.json:49-53`, `app/kit/page.tsx:379` |
| **Waitlist Founding Benefit** | `First 100 are named in the release credits (optional) and help choose which merchant adapter ships first.` (no unratified price lock) | `app/kit/page.tsx:336`, `data/products.graph.json:37` |

---

## 2. CI-Printed Verification, Package & Route Counts (At `HEAD`)

| Metric | Verified Count | Command / Gate |
| :--- | :--- | :--- |
| **Repository Contract & Unit Tests** | `131 pass, 0 fail` | `pnpm run test` (`tests/*.test.mjs`) |
| **Commerce Contract Subset** | `32 pass, 0 fail` | `node --test tests/commerce-*.test.mjs` |
| **Parent Playwright Browser Tests** | `11 pass, 0 fail` (`375px`, `390px`, `768px`, `1440px`) | `pnpm exec playwright test` (`atelier`, `install`, `kit`) |
| **Standalone Monograph Playwright Tests** | `3 pass, 0 fail` (`preview` & `published` modes) | `pnpm exec playwright test -c playwright.portfolio.config.mjs` |
| **Next.js Static/App Routes Built** | `31/31` routes (`0` ESLint errors, `0` warnings) | `pnpm run build` |
| **Free MIT Buyer Package Files** | `138` files (internal `docs/release/*` excluded) | `release/package-manifest.json` (`pnpm package:release`) |
| **Commercial Kit Package Files** | `12` files (`6` numbered guides/schemas + policies) | `commercial/kit/kit.manifest.json` (`pnpm package:kit`) |
| **Template Studies in Atelier** | `6` interactive studies (`Monograph` exports standalone Next.js repo) | `lib/template-catalog.ts:18` |

---

## 3. Accessibility, Reduced-Motion & Performance Budget Receipts

| Quality Dimension | Budget / Requirement | Measured at `HEAD` | Gate |
| :--- | :--- | :--- | :--- |
| **WCAG / `axe-core` (`4.14.0`)** | `0` serious or critical violations on `/kit`, `/start`, `/studio/templates/portfolio/edit` at `390px` & `1440px` | **`0` total violations** across all 3 routes & waitlist states (`join`, `error`, `refine`, `done`) | `tests/browser/kit.spec.mjs` |
| **Keyboard-Only Navigation** | Full keyboard pass of `/kit` waitlist (Step 1 -> error alert -> Step 2 -> done) and Monograph editor | **Pass** (`:focus-visible` outlines, `<label htmlFor>`, `role="alert" aria-live="assertive"`, `role="status"`) | `tests/browser/kit.spec.mjs` |
| **Reduced Motion** | Honour `prefers-reduced-motion: reduce` across all routes & CSS/GSAP | **Pass** (`scroll-behavior: auto`, `transition-duration: 0s`, `animation-duration: 0s`) | `app/globals.css:242-265`, `tests/browser/kit.spec.mjs` |
| **`/kit` Page-Specific Client JS** | `<= 15 kB` gzip | **`4.44 kB` gzip** (`12.04 kB` raw) | `scripts/check-performance-budget.mjs` (`pnpm run check:perf`) |
| **`/kit` Non-Root Client JS** | `<= 65 kB` gzip | **`51.24 kB` gzip** | `scripts/check-performance-budget.mjs` |
| **`/kit` Total First-Load JS (incl. React 19 + Next.js 16)** | `<= 195 kB` gzip | **`180.51 kB` gzip** (`579.07 kB` raw) | `scripts/check-performance-budget.mjs` |
| **`/kit` Pre-Rendered HTML** | `<= 25 kB` gzip | **`11.12 kB` gzip** | `scripts/check-performance-budget.mjs` |
| **Mobile (`390×900`) LCP** | `< 2500 ms` (`< 2.5s`) | **`64.0 ms`** | `tests/browser/kit.spec.mjs` |
| **Mobile (`390×900`) CLS** | `< 0.10` | **`0.0000`** | `tests/browser/kit.spec.mjs` |

---

## 4. Shared `@starlight/demand-capture` Upstream Parity ([`frankxai/starlight-estate#70`](https://github.com/frankxai/starlight-estate/pull/70))

`lib/demand-capture/*` in `creator-launch-os` is kept byte-identical to `packages/demand-capture/src/*` on [`frankxai/starlight-estate#70`](https://github.com/frankxai/starlight-estate/pull/70) (`125f7445d5daf0bda0babac3a5b5082ae83e4a5b`).

| File | SHA-256 (`lib/demand-capture/*` == `starlight-estate/packages/demand-capture/src/*`) |
| :--- | :--- |
| `types.ts` | `3c572c8725bfa74a30d4dde82a03e227a1487487d128d91aebf58c5ad513e611` |
| `questions.ts` | `e77f7f65dd1c703143638cdf8c4f65b13f3a97d66662fdd81a7f66d391f676a3` |
| `store.ts` | `3fef2b87206f28d77fb143cb34593a36e33a17b2ad3a5f8a0e0982a057931586` |
| `handler.ts` | `3d06626551e2794552fcd4062688c459375bbef12191493cb73500033221a8b5` |
| `WaitlistForm.tsx` | `c9db91e25687438fd282d08327b5ec2216750fbf53b5e0af97cadfa26f3adb0d` |

### Consumption Plan for `#17`
1. **Before `starlight-estate#70` merges / publishes:** `creator-launch-os` vendors the exact 5 files in `lib/demand-capture/*` and enforces the SHA-256 parity table above in `tests/gencreator-release-gate.test.mjs`, so standalone MIT template clones and exports work with zero private-registry token.
2. **After `starlight-estate#70` merges:** Estate monorepo properties import `@starlight/demand-capture/*` directly, while `creator-launch-os` syncs `lib/demand-capture/*` via `pnpm run check:offer` whenever the upstream package changes.

---

## 5. Claims Creative Must Never Make (Guardrails)

- Never state a dollar price (`$49`, `$69`, `$149`, etc.) or `"price lock for life"` on any public surface while `offer.facts.json` has `price.state: "decision_required"`.
- Never claim `"zero webhook coding"` for live merchants: the kit ships the post-webhook fulfillment engine (`lib/commerce/engine.ts`) and integration guide (`commercial/kit/03-merchant-integration-guide.md`), while the operator wires their chosen live merchant's signature translator (`app/kit/page.tsx:190-192`).
- Never claim the `/kit` 4-step rehearsal makes live network requests: it displays verified results from `lib/commerce/engine.ts` computed at build time against fixture events (`app/kit/page.tsx:212`).
