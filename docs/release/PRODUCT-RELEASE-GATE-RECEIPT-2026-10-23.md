# Product Release Gate Receipt — Creator Launch OS (`sku_creator_launch_os_v1`)

- **Product ID:** `product_creator_launch_os` / `sku_creator_launch_os_v1` (`creator-launch-os` in `data/products.graph.json`)
- **Brand:** GenCreator (`brand_gencreator`)
- **Repository:** `frankxai/creator-launch-os`
- **Date:** `2026-10-24` (revised after Claude Opus 5.5 G3 check at `89d38d0` and declined-buyer critique `#17#issuecomment-6378151291`)
- **Expiry:** `2027-01-22` (90 days or any material product change, whichever first)
- **Commercial posture:** **Waitlist-first (`available-soon`)**. Checkout stays off and no price or price-lock promise is shown until G3 and G5 are signed off by Frank.

---

## Gate Summary (G0–G5)

| Gate | Status | Evidence | Owner |
| :--- | :--- | :--- | :--- |
| **G0 — Claim truth** | **PASS (Revised)** | 18/18 buyer-facing claims mapped to exact `file:line` in §1 below. Upgraded `next` to `16.4.3` (patching `GHSA-673q-mjm6-r5xr` & `GHSA-2464-fhr4-w9xw`) and `sharp` to `0.35.5` with a real registry lockfile install. Rewrote `/kit` first screen around one buyer job, added the interactive 4-step `FirstSaleRehearsal` (`#prove-it-works`), and added the `"What you still do yourself"` boundary box (`#what-you-do-yourself`). | Maker (`Gemini 4 Argon`) |
| **G1 — Deterministic pass** | **PASS (Revised)** | At prior SHA `89d38d0` (before `.github/workflows/*` landed), GitHub CI run `40007764815` ran 123 tests (`122 pass, 1 fail`). At `d054e735` and at the current head, all 4 GitHub Actions jobs (`verify`, `research-boundary`, `portfolio-export (preview)`, `portfolio-export (published)`) and local `pnpm verify` pass (**128/128 contract tests**, `0 fail`, 31-page Next.js 16.4.3 build, **10/10 parent Playwright**, `141` MIT files, `12` kit files). | Maker (`Gemini 4 Argon`) |
| **G2 — Buyer simulation** | **PASS** | Fresh release ZIP extracted into isolated `/tmp/g2-buyer-sim`, cold `pnpm install --frozen-lockfile && pnpm verify` (**126 pass, 0 fail, 2 kit-content skips**), 10/10 Playwright browser journeys (including the interactive 4-step sale rehearsal and two-step waitlist on `/kit`), standalone Monograph export (`prepare-portfolio-check.mjs`), browser edit/save/reopen/rebuild, and `390px` + `1440px` captures with `.vis.provenance.json` sidecars. | Maker (`Gemini 4 Argon`) |
| **G3 — Independent check (maker ≠ checker)** | **AWAITING G3 RE-RUN BY CLAUDE** | Maker self-checks do not count as G3. Ready for cold G3 re-run by Claude Opus 5.5 at the new head SHA (see §5). | Claude Opus 5.5 (`claude-opus-5-5`) |
| **G4 — Post-purchase & first-run email path** | **PASS (Test Rehearsal)** | Interactive 4-step `FirstSaleRehearsal` on `/kit#prove-it-works` + `scripts/commerce-rehearsal.mjs` over HTTP (`TEST_REHEARSAL_PASSED_NOT_A_SALE`), early-refund tombstone, `409 E_ORDER_CONFLICT` + PII-free log, webhook timestamp freshness guard (`verifyWebhookTimestamp`), 7-day (>24h) signed token TTL, fail-closed waitlist (`503` when KV unset), and double-opt-in verification (`handleVerify`). | Maker (test mode) / Frank (live rail) |
| **G5 — Price integrity** | **PREPARED FOR FRANK** | `docs/release/G5-PRICE-EVIDENCE.md` proposes `$49` Launch / `$69` Standard / `$149` Team with buyer value logic, refund policy, and waitlist price-band wording. `offer.facts.json` keeps `price.state: "decision_required", amount: null`. | Frank Riemer |

---

## 1. G0 Receipt — Claim-to-Source Table (All 18 Buyer-Facing Claims Mapped)

| # | Buyer-facing claim | Exact `file:line` | Verification |
| :- | :--- | :--- | :--- |
| 1 | Deploys with no required secrets (`requiredEnvironmentVariables: []`) | `template.manifest.json:39` | `tests/template-contract.test.mjs` |
| 2 | Server-first Next.js 16.4.3 App Router (`next: 16.4.3`, `sharp: 0.35.5` override) | `package.json:27`, `pnpm-workspace.yaml:11` | `tests/template-contract.test.mjs` |
| 3 | MIT licensed free core | `LICENSE:1` | `tests/offer-facts.test.mjs` |
| 4 | Honest demo checkout fallback when no checkout URL is configured | `app/checkout/[slug]/page.tsx:40` | `tests/template-contract.test.mjs` |
| 5 | Six interactive template studies (`/studio/templates/[templateId]`) | `lib/template-catalog.ts:18` | `tests/browser/atelier.spec.mjs` |
| 6 | Browser Monograph editor with save, import review, multi-step undo & `beforeunload` guard | `components/portfolio-workspace.tsx:45,67` | `tests/standalone/portfolio.spec.mjs` |
| 7 | Standalone Next.js project exporter (`pnpm template:projects --project ...`) | `scripts/export-template-project.mjs:179` | `tests/template-project-export.test.mjs` |
| 8 | Free offline Architecture Decision Desk (`/architecture-decision-desk/index.html`) | `app/start/page.tsx:75` | `tests/browser/install.spec.mjs` |
| 9 | Merchant-agnostic commerce engine with convergent write-before-mark retries | `lib/commerce/engine.ts:219-250` | `tests/commerce-recovery.test.mjs` |
| 10 | Out-of-order early refund tombstone (`paidAt: null`) blocks subsequent payment | `lib/commerce/engine.ts:265` | `tests/commerce-order-safety.test.mjs` |
| 11 | Conflicting order ID reuse rejected with `409 E_ORDER_CONFLICT` (`:10`) + PII-free operator log (`:45`) | `app/api/commerce/webhook/route.ts:10,45` | `tests/commerce-order-safety.test.mjs` |
| 12 | Draft 14-day refund policy (`offer.facts.json:50`, `app/kit/page.tsx:378`, pending owner ratification; 14-day calendar window is policy-enforced, while `order.refunded` revokes entitlement & delivery link with `410 E_REVOKED` at `engine.ts:344`) | `offer.facts.json:50`, `app/kit/page.tsx:378`, `lib/commerce/engine.ts:344` | `tests/commerce-loop.test.mjs` |
| 13 | Webhook timestamp freshness guard (`±300s` on `x-commerce-timestamp`) & self-hosted production test-mode block (`COMMERCE_ENV=production`) | `lib/commerce/engine.ts:138`, `lib/commerce/config.ts:28,86` | `tests/gencreator-release-gate.test.mjs` |
| 14 | `/kit` first screen names one buyer job & visible outcome (`Sell digital products from your own domain—and prove payment, delivery and refunds work before you go live.`) | `app/kit/page.tsx:208` | `tests/gencreator-release-gate.test.mjs` |
| 15 | Interactive 4-step "Prove it works" first-sale rehearsal on `/kit#prove-it-works` (`1. Connect merchant in test mode -> 2. Test order -> 3. Delivery email & link -> 4. Refund revokes access (410 E_REVOKED)`) executed against `lib/commerce/engine.ts` | `app/kit/page.tsx:25-184,239`, `components/first-sale-rehearsal.tsx:16-148` | `tests/browser/kit.spec.mjs` |
| 16 | Honest `"What you still do yourself"` 4-item boundary box on `/kit#what-you-do-yourself` | `app/kit/page.tsx:186-200,353` | `tests/browser/kit.spec.mjs` |
| 17 | Checkout stays off (`available-soon`) and renders shared demand-capture waitlist with non-price founding credit (`First 100 are named in the release credits (optional)...`) | `app/kit/page.tsx:332-337`, `data/products.graph.json:37` | `tests/browser/kit.spec.mjs` |
| 18 | Waitlist fails closed (`503`) when KV/Upstash is unconfigured, claims positions atomically via `HSETNX`, blocks Step-2 overwrite without `stepToken` (`403`), rate-limits per IP (`429`), rejects honeypot (`400`), and verifies email (`?verify=`) before Resend sync | `lib/demand-capture/store.ts:28,44`, `lib/demand-capture/handler.ts:38,56,71,88,125`, `app/api/waitlist/route.ts:12` | `tests/gencreator-release-gate.test.mjs` |

---

## 2. G1 Receipt — Deterministic Test & Build Counts (By SHA)

- **At `89d38d0` (before `.github/workflows/*` commit `849799d`):** GitHub CI run `40007764815` ran `123` tests (`122 pass, 1 fail`).
- **At `d054e735`:** All 4 GitHub CI jobs (`verify`, `research-boundary`, `portfolio-export (preview)`, `portfolio-export (published)`) passed (`127/127` contract tests).
- **At current head (Next.js `16.4.3`, `sharp` `0.35.5`, interactive 4-step rehearsal & DIY boundary):**
  ```text
  $ pnpm verify
  Decision Desk delivery bytes and reconstructable upstream patch verified. Upstream integration remains pending.
  Offer facts agree across product, listing, template and package manifests
  ✓ Generating static pages using 1 worker (31/31)
  ℹ tests 128
  ℹ pass 128
  ℹ fail 0
  ```

---

## 3. G2 Receipt — Fresh-Download Buyer Simulation (`390px` & `1440px`)

1. Extracted built release ZIP (`141` files) into `/tmp/g2-buyer-sim` outside the git repository.
2. `pnpm install --frozen-lockfile && pnpm verify` exited `0` (**126 pass, 0 fail, 2 explicit kit-content skips**; 31 routes built on Next.js `16.4.3`).
3. `pnpm exec playwright test` (`10/10 pass`), exercising the 4-step interactive first-sale rehearsal (`#prove-it-works`), the `"What you still do yourself"` box (`#what-you-do-yourself`), and the two-step waitlist on `/kit`, plus standalone Monograph export/edit/save/reopen/rebuild and `390px` & `1440px` captures with `.vis.provenance.json` sidecars.

---

## 4. G4 Receipt — Post-Purchase Delivery, Revocation & Waitlist Verification Path

- Interactive 4-step `FirstSaleRehearsal` on `/kit#prove-it-works` + HTTP rehearsal (`scripts/commerce-rehearsal.mjs`: `TEST_REHEARSAL_PASSED_NOT_A_SALE`).

---

## 5. G3 Re-Review Brief — Target: `frankxai/creator-launch-os` PR `#17`

> **Target PR:** `frankxai/creator-launch-os` **PR `#17`** (`agent/hyperagent/sl-ha-20261023-h01`, targeting `#16` `4df461f`). PRs `#18` and `#19` are closed as folded into `#17`.
> **Checklist for cold G3 run (Claude Opus 5.5):**
> 1. Verify `package.json` and `pnpm-lock.yaml` resolve `next@16.4.3` and `sharp@0.35.5` (patching `GHSA-673q-mjm6-r5xr` and `GHSA-2464-fhr4-w9xw`).
> 2. Verify all 18 G0 claims in §1 above against the exact `file:line` citations.
> 3. Run `pnpm verify` and `pnpm exec playwright test` (including from an extracted release ZIP in `/tmp`), inspecting the `/kit` first screen, the interactive 4-step `FirstSaleRehearsal` (`#prove-it-works`), the `"What you still do yourself"` boundary (`#what-you-do-yourself`), and the fail-closed waitlist (`503` when KV is unset).
> 4. Post `PASS`, `REVISE`, or `FAIL` with model ID and timestamp.
