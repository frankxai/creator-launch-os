# Product Release Gate Receipt — Creator Launch OS (`sku_creator_launch_os_v1`)

- **Product ID:** `product_creator_launch_os` / `sku_creator_launch_os_v1` (`creator-launch-os` in `data/products.graph.json`)
- **Brand:** GenCreator (`brand_gencreator`)
- **Repository:** `frankxai/creator-launch-os`
- **Date:** `2026-10-24` (revised after Claude Opus 5.5 G3 #2 at `ec9c44c` `#17#issuecomment-6378752105`)
- **Expiry:** `2027-01-22` (90 days or any material product change, whichever first)
- **Commercial posture:** **Waitlist-first (`available-soon`)**. Checkout stays off and no price or price-lock promise is shown until G2 (real browser), G3, and G5 are signed off by Frank.

---

## Gate Summary (G0–G5)

| Gate | Status | Evidence | Owner |
| :--- | :--- | :--- | :--- |
| **G0 — Claim truth** | **PASS (P2s 1–7 fixed)** | 18/18 buyer-facing claims mapped to exact `file:line` in §1 below. Resolved all 7 P2 items from G3 #2 (`#17#issuecomment-6378752105`): staged double-opt-in verification email + full verify test, excluded internal docs from `release/package-manifest.json`, verified-only `foundingSeatsLeft` + per-instance rate-limiter note, accurate `32 commerce contract tests` & build-time rehearsal labels on `/kit`, required `x-commerce-timestamp` signed as `timestamp.rawBody`, aligned `COMPETITIVE-BAR-2026-10.md:7` with the DIY boundary, and re-synced all G0 line references. | Maker (`Gemini 4 Argon`) |
| **G1 — Deterministic pass** | **PASS** | All 4 GitHub Actions jobs (`verify`, `research-boundary`, `portfolio-export (preview)`, `portfolio-export (published)`) and local `pnpm verify` pass (**129/129 contract tests**, `0 fail`, `0` ESLint warnings, 31-page Next.js 16.4.3 build, `137` MIT files excluding internal release-gate docs, `12` kit files). | Maker (`Gemini 4 Argon`) |
| **G2 — Buyer simulation** | **SCHEDULED FOR MORNING (REAL BROWSER)** | Container Playwright (`10/10`) and fresh extracted ZIP verification (`125 pass, 0 fail, 4 internal-doc/kit skips`) pass; real-browser G2 runs in the morning per owner direction. | Frank / Maker |
| **G3 — Independent check (maker ≠ checker)** | **PASS AT `ec9c44c` (P2s fixed on new head)** | Claude Opus 5.5 (`claude-opus-5-5`) posted **PASS for G0, G1 and G4 with 0 P0 / 0 P1** at `ec9c44c` (`#17#issuecomment-6378752105`), plus 7 P2 items resolved in this commit. | Claude Opus 5.5 (`claude-opus-5-5`) |
| **G4 — Post-purchase & first-run email path** | **PASS (Test Rehearsal)** | Build-verified 4-step `FirstSaleRehearsal` on `/kit#prove-it-works` + HTTP `scripts/commerce-rehearsal.mjs` (`TEST_REHEARSAL_PASSED_NOT_A_SALE`), mandatory `x-commerce-timestamp` (`±300s`) signed into `timestamp.rawBody`, early-refund tombstone, `409 E_ORDER_CONFLICT` + PII-free log, 7-day (>24h) signed token TTL, fail-closed waitlist (`503` when KV unset), and staged double-opt-in verification email (`sendVerificationEmail` → `handleVerify` → `markVerified` → `addToAudience`). | Maker (test mode) / Frank (live rail) |
| **G5 — Price integrity** | **PREPARED FOR FRANK** | `docs/release/G5-PRICE-EVIDENCE.md` (excluded from the free buyer ZIP at `release/package-manifest.json:64-65`) proposes `$49` Launch / `$69` Standard / `$149` Team with buyer value logic, refund policy, and waitlist price-band wording. `offer.facts.json` keeps `price.state: "decision_required", amount: null`. | Frank Riemer |

---

## 1. G0 Receipt — Claim-to-Source Table (All 18 Buyer-Facing Claims Mapped)

| # | Buyer-facing claim | Exact `file:line` | Verification |
| :- | :--- | :--- | :--- |
| 1 | Deploys with no required secrets (`requiredEnvironmentVariables: []`) | `template.manifest.json:39` | `tests/template-contract.test.mjs` |
| 2 | Server-first Next.js 16.4.3 App Router (`next: 16.4.3`, `sharp: 0.35.5` override) | `package.json:27`, `pnpm-workspace.yaml:11` | `tests/template-contract.test.mjs` |
| 3 | MIT licensed free core; internal release-gate & price-proposal docs excluded from buyer ZIP (`docs/release/READINESS.md` & `RIGHTS-AND-PROVENANCE.md` only) | `LICENSE:1`, `release/package-manifest.json:64-65` | `tests/gencreator-release-gate.test.mjs` |
| 4 | Honest demo checkout fallback when no checkout URL is configured | `app/checkout/[slug]/page.tsx:40` | `tests/template-contract.test.mjs` |
| 5 | Six interactive template studies (`/studio/templates/[templateId]`) | `lib/template-catalog.ts:18` | `tests/browser/atelier.spec.mjs` |
| 6 | Browser Monograph editor with save, import review, multi-step undo & `beforeunload` guard | `components/portfolio-workspace.tsx:45,67` | `tests/standalone/portfolio.spec.mjs` |
| 7 | Standalone Next.js project exporter (`pnpm template:projects --project ...`) | `scripts/export-template-project.mjs:179` | `tests/template-project-export.test.mjs` |
| 8 | Free offline Architecture Decision Desk (`/architecture-decision-desk/index.html`) | `app/start/page.tsx:75` | `tests/browser/install.spec.mjs` |
| 9 | Merchant-agnostic commerce engine with convergent write-before-mark retries | `lib/commerce/engine.ts:223-255` | `tests/commerce-recovery.test.mjs` |
| 10 | Out-of-order early refund tombstone (`paidAt: null`) blocks subsequent payment | `lib/commerce/engine.ts:270` | `tests/commerce-order-safety.test.mjs` |
| 11 | Conflicting order ID reuse rejected with `409 E_ORDER_CONFLICT` (`:10`) + PII-free operator log (`:45`) | `app/api/commerce/webhook/route.ts:10,45` | `tests/commerce-order-safety.test.mjs` |
| 12 | Draft 14-day refund policy (`offer.facts.json:50`, `app/kit/page.tsx:379`, pending owner ratification; 14-day calendar window is policy-enforced, while `order.refunded` revokes entitlement & delivery link with `410 E_REVOKED` at `engine.ts:349`) | `offer.facts.json:50`, `app/kit/page.tsx:379`, `lib/commerce/engine.ts:349` | `tests/commerce-loop.test.mjs` |
| 13 | Mandatory `x-commerce-timestamp` freshness guard (`±300s`, rejects missing header) bound into the HMAC over `timestamp.rawBody` (`signPayload` / `verifySignature`), plus self-hosted production test-mode block (`COMMERCE_ENV=production`) | `lib/commerce/engine.ts:127-155`, `lib/commerce/config.ts:24-26,86`, `scripts/commerce-rehearsal.mjs:16-24` | `tests/gencreator-release-gate.test.mjs` |
| 14 | `/kit` first screen names one buyer job & visible outcome (`Sell digital products from your own domain—and prove payment, delivery and refunds work before you go live.`) | `app/kit/page.tsx:208-213` | `tests/gencreator-release-gate.test.mjs` |
| 15 | 4-step `"Prove it works"` first-sale rehearsal on `/kit#prove-it-works` showing verified results from `lib/commerce/engine.ts` computed at build time (`HMAC verified`, `Outcome: granted`, `Token redeemed`, `Throws E_REVOKED`) | `app/kit/page.tsx:26-178,240`, `components/first-sale-rehearsal.tsx:16-152` | `tests/browser/kit.spec.mjs` |
| 16 | Honest `"What you still do yourself"` 4-item boundary box on `/kit#what-you-do-yourself` (including `32 commerce contract tests` at `app/kit/page.tsx:191`) | `app/kit/page.tsx:180-197,346-370` | `tests/browser/kit.spec.mjs` |
| 17 | Checkout stays off (`available-soon`) and renders shared demand-capture waitlist with non-price founding credit (`First 100 are named in the release credits (optional)...`) | `app/kit/page.tsx:333-338`, `data/products.graph.json:37` | `tests/browser/kit.spec.mjs` |
| 18 | Waitlist fails closed (`503`) when KV/Upstash is unconfigured, claims positions atomically via `HSETNX`, blocks Step-2 overwrite without `stepToken` (`403`), rate-limits per IP (`429`, per-instance in process memory), rejects honeypot (`400`), sends double-opt-in verification email (`sendVerificationEmail`), counts only verified signups toward `foundingSeatsLeft` (`getVerifiedCount` / `markVerified`), and verifies email (`?verify=`) before Resend audience sync | `lib/demand-capture/store.ts:28,44,60-73,95-140`, `lib/demand-capture/handler.ts:29-68,76,90-95,131-159`, `app/api/waitlist/route.ts:12` | `tests/gencreator-release-gate.test.mjs` |

---

## 2. G1 Receipt — Deterministic Test & Build Counts

- **Commerce contract suite (`node --test tests/commerce-*.test.mjs`):** `32 pass, 0 fail`.
- **Full repository suite (`pnpm verify`):** `129 pass, 0 fail`, `0` ESLint warnings, 31-page Next.js `16.4.3` build.
- **Fresh buyer ZIP (`137` files, internal release-gate & price-proposal docs excluded):** `125 pass, 0 fail, 4 skips` (`2` commercial-kit-only tests + `2` internal release-gate doc tests).
