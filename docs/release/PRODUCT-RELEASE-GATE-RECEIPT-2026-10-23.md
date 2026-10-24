# Product Release Gate Receipt — Creator Launch OS (`sku_creator_launch_os_v1`)

- **Product ID:** `product_creator_launch_os` / `sku_creator_launch_os_v1` (`creator-launch-os` in `data/products.graph.json`)
- **Brand:** GenCreator (`brand_gencreator`)
- **Repository:** `frankxai/creator-launch-os`
- **Date:** `2026-10-24` (revised after Claude Opus 5.5 G3 check at `89d38d00f8d5433ef7b1622b3c96e4979318dcd7`)
- **Expiry:** `2027-01-22` (90 days or any material product change, whichever first)
- **Commercial posture:** **Waitlist-first (`available-soon`)**. Checkout stays off and no price or price-lock promise is shown until G3 and G5 are signed off by Frank.

---

## Gate Summary (G0–G5)

| Gate | Status | Evidence | Owner |
| :--- | :--- | :--- | :--- |
| **G0 — Claim truth** | **PASS (Revised)** | 16/16 buyer-facing claims mapped to exact `file:line` in §1 below. Removed unratified `"First 100 keep launch pricing for life"` / `"lock founding terms"` from `app/kit/page.tsx`, `data/products.graph.json`, and `LAUNCH-PREP-DRAFTS-2026-10.md` (moved to `G5-PRICE-EVIDENCE.md` as an option for Frank). Replaced unverified `Supply` URL with 5 HTTP-200 verified paid competitors (`Supplier` at `$79.00` as #1 must-beat). Labelled `/kit` refund terms as `Draft policy`. | Maker (`Gemini 4 Argon`) |
| **G1 — Deterministic pass** | **PASS (Revised)** | At prior SHA `89d38d0` (before `.github/workflows/*` landed), GitHub CI run `40007764815` ran 123 tests (`122 pass, 1 fail` on the missing workflow step). After `849799d` added the workflow files and with the G3 revision tests added here, `pnpm verify` passes **127/127 contract tests (`0 fail`)** + 31-page `next build`, **10/10 parent Playwright tests**, `pnpm package:release` (**140 MIT files**), and `pnpm package:kit` (**12 kit files**). | Maker (`Gemini 4 Argon`) |
| **G2 — Buyer simulation** | **PASS** | Fresh release ZIP extracted into isolated `/tmp/g2-buyer-sim`, cold `pnpm install --frozen-lockfile && pnpm verify` (**125 pass, 0 fail, 2 kit-content skips**), 10/10 Playwright browser journeys, standalone Monograph export (`prepare-portfolio-check.mjs`), browser edit/save/reopen/rebuild, and `390px` + `1440px` captures with `.vis.provenance.json` sidecars. | Maker (`Gemini 4 Argon`) |
| **G3 — Independent check (maker ≠ checker)** | **REVISE AT `89d38d0` → READY FOR RE-REVIEW** | Claude Opus 5.5 (`#17#issuecomment-6377680101`) issued `REVISE` at `89d38d0` (0 P0s, 35/35 commerce tests passed; 4 P1s and 6 P2s). All P1s and P2s are fixed in this revision; see §5 for the G3 re-review checklist on `PR #17`. | Claude Opus 5.5 (`claude-opus-5-5`) |
| **G4 — Post-purchase & first-run email path** | **PASS (Test Rehearsal)** | `scripts/commerce-rehearsal.mjs` over HTTP (`TEST_REHEARSAL_PASSED_NOT_A_SALE`), early-refund tombstone (`200 revoked` -> `200 duplicate`), `409 E_ORDER_CONFLICT` + PII-free log, webhook timestamp freshness guard (`verifyWebhookTimestamp`), 7-day (>24h) signed token TTL, fail-closed waitlist (`503` when KV unset) with `hsetnx` atomic position, `stepToken` overwrite protection, rate limiting, and double-opt-in verification (`handleVerify`). | Maker (test mode) / Frank (live rail) |
| **G5 — Price integrity** | **PREPARED FOR FRANK** | `docs/release/G5-PRICE-EVIDENCE.md` proposes `$49` Launch / `$69` Standard / `$149` Team with buyer value logic, refund policy, and waitlist price-band wording. `offer.facts.json` keeps `price.state: "decision_required", amount: null`. | Frank Riemer |

---

## 1. G0 Receipt — Claim-to-Source Table (All 16 Buyer-Facing Claims Mapped)

| # | Buyer-facing claim | Exact `file:line` | Verification |
| :- | :--- | :--- | :--- |
| 1 | Deploys with no required secrets (`requiredEnvironmentVariables: []`) | `template.manifest.json:39` | `tests/template-contract.test.mjs` |
| 2 | Server-first Next.js 16 App Router (`next: 16.3.8`) | `package.json:27` | `pnpm build` (31 routes) |
| 3 | MIT licensed free core | `LICENSE:1` | `tests/offer-facts.test.mjs` |
| 4 | Honest demo checkout fallback when no checkout URL is configured | `app/checkout/[slug]/page.tsx:40` | `tests/template-contract.test.mjs` |
| 5 | Six interactive template studies (`/studio/templates/[templateId]`) | `lib/template-catalog.ts:18` | `tests/browser/atelier.spec.mjs` |
| 6 | Browser Monograph editor with save, import review, multi-step undo & `beforeunload` guard | `components/portfolio-workspace.tsx:45,67` | `tests/standalone/portfolio.spec.mjs` |
| 7 | Standalone Next.js project exporter (`pnpm template:projects`) | `scripts/export-template-project.mjs:179` | `tests/template-project-export.test.mjs` |
| 8 | Free offline Architecture Decision Desk (`/architecture-decision-desk/index.html`) | `app/start/page.tsx:75` | `tests/browser/install.spec.mjs` |
| 9 | Merchant-agnostic commerce engine with convergent write-before-mark retries | `lib/commerce/engine.ts:219-250` | `tests/commerce-recovery.test.mjs` |
| 10 | Out-of-order early refund tombstone (`paidAt: null`) blocks subsequent payment | `lib/commerce/engine.ts:265` | `tests/commerce-order-safety.test.mjs` |
| 11 | Conflicting order ID reuse rejected with `409 E_ORDER_CONFLICT` (`:10`) + PII-free operator log (`:45`) | `app/api/commerce/webhook/route.ts:10,45` | `tests/commerce-order-safety.test.mjs` |
| 12 | Draft 14-day refund policy (`offer.facts.json:50`, `app/kit/page.tsx:138`, pending owner ratification; 14-day calendar window is policy-enforced, while `order.refunded` revokes entitlement & delivery link with `410 E_REVOKED` at `engine.ts:344`) | `offer.facts.json:50`, `app/kit/page.tsx:138`, `lib/commerce/engine.ts:344` | `tests/commerce-loop.test.mjs` |
| 13 | Webhook timestamp freshness guard (`±300s` on `x-commerce-timestamp`) & self-hosted production test-mode block (`COMMERCE_ENV=production`) | `lib/commerce/engine.ts:138`, `lib/commerce/config.ts:28,86` | `tests/gencreator-release-gate.test.mjs` |
| 14 | Checkout stays off (`available-soon`) and renders shared demand-capture waitlist with non-price founding credit (`First 100 are named in the release credits (optional)...`) | `app/kit/page.tsx:118-122`, `data/products.graph.json:37` | `tests/browser/kit.spec.mjs` |
| 15 | Waitlist fails closed (`503`) when KV/Upstash is unconfigured, claims positions atomically via `HSETNX`, and withholds public counts below threshold (`50`) | `lib/demand-capture/store.ts:28,44`, `lib/demand-capture/handler.ts:56`, `app/api/waitlist/route.ts:12` | `tests/gencreator-release-gate.test.mjs` |
| 16 | Waitlist blocks Step-2 overwrite without `stepToken` (`403`), rate-limits per IP (`429`), rejects honeypot fills (`400`), and requires email verification (`?verify=`) before Resend audience sync | `lib/demand-capture/handler.ts:38,71,88,125` | `tests/gencreator-release-gate.test.mjs` |

---

## 2. G1 Receipt — Deterministic Test & Build Counts (By SHA)

- **At `89d38d00f8d5433ef7b1622b3c96e4979318dcd7` (before `.github/workflows/*` commit `849799d`):**
  - GitHub CI run `40007764815`: `123` contract tests (`122 pass, 1 fail` on `tests/release-entry.test.mjs:18` because `.github/workflows/ci.yml` was not yet on the branch).
- **At current head (with `.github/workflows/*` from `849799d` + G3 revision fixes):**
  ```text
  $ pnpm verify
  Decision Desk delivery bytes and reconstructable upstream patch verified. Upstream integration remains pending.
  Offer facts agree across product, listing, template and package manifests
  ✓ Generating static pages using 1 worker (31/31)
  ℹ tests 127
  ℹ pass 127
  ℹ fail 0
  ```

---

## 3. G2 Receipt — Fresh-Download Buyer Simulation (`390px` & `1440px`)

1. Extracted built release ZIP (`140` files) into `/tmp/g2-buyer-sim` outside the git repository.
2. `pnpm install --frozen-lockfile && pnpm verify` exited `0` (**125 pass, 0 fail, 2 explicit kit-content skips**; 31 routes built).
3. `pnpm exec playwright test` (`10/10 pass`), standalone Monograph export (`prepare-portfolio-check.mjs`), browser edit/save/reopen/rebuild (`3/3 pass` + `1/1 roundtrip pass`), and `390px` & `1440px` captures (`kit-390.png`, `kit-1440.png`, `monograph-workspace-390.png`, `monograph-workspace-1440.png`) with `.vis.provenance.json` sidecars.

---

## 4. G4 Receipt — Post-Purchase Delivery, Revocation & Waitlist Verification Path

- HTTP rehearsal (`scripts/commerce-rehearsal.mjs`): `TEST_REHEARSAL_PASSED_NOT_A_SALE`.
- Early-refund tombstone, `409 E_ORDER_CONFLICT` + PII-free log, `verifyWebhookTimestamp` (`±300s`), 7-day (>24h) signed token TTL, and fail-closed waitlist + double-opt-in verification (`handleVerify`).

---

## 5. G3 Re-Review Brief — Target: `frankxai/creator-launch-os` PR `#17`

> **Target PR:** `frankxai/creator-launch-os` **PR `#17`** (`agent/hyperagent/sl-ha-20261023-h01`, targeting `#16` `4df461f`). PRs `#18` and `#19` are closed as folded into `#17`.
> **Verify on re-review:**
> 1. **P1-1 fixed:** No `"keep launch pricing for life"`, `"lock founding terms"`, or `"Price lock for life"` in `app/kit/page.tsx`, `data/products.graph.json`, or `docs/release/LAUNCH-PREP-DRAFTS-2026-10.md` (moved to `docs/release/G5-PRICE-EVIDENCE.md`).
> 2. **P1-2 fixed:** `lib/demand-capture/store.ts` throws `KvNotConfiguredError` when `KV_REST_API_*` / `UPSTASH_REDIS_REST_*` are unset; `/api/waitlist` returns `503` fail-closed; `.env.example` documents all variables.
> 3. **P1-3 fixed:** `.github/workflows/ci.yml` and `.github/workflows/repository-policy.yml` are on the branch (`849799d`), and §2 above records the exact `122/123` CI count at `89d38d0` vs `127/127` at the current head.
> 4. **P1-4 fixed:** `COMPETITIVE-BAR-2026-10.md` and `data/products.graph.json` replace the 404 `Supply` URL with 5 live HTTP-200 verified paid products (`Supplier` at `$79.00` as #1 must-beat).
> 5. **P2-1..P2-6 fixed:** Waitlist `hsetnx` atomic claim, `stepToken` guard (`403` on email-only overwrite), per-IP rate limit (`429`), honeypot (`400`), `?verify=` step, exact G0 line numbers, `Draft policy` refund label on `/kit`, webhook timestamp freshness (`verifyWebhookTimestamp`), `#18`/`#19` closed as folded, and `frankxai/starlight-estate#66` open for `graph/products.graph.json`.
