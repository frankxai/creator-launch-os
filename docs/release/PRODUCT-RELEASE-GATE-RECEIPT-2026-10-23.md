# Product Release Gate Receipt — Creator Launch OS (`sku_creator_launch_os_v1`)

- **Product ID:** `product_creator_launch_os` / `sku_creator_launch_os_v1` (`creator-launch-os` in `data/products.graph.json`)
- **Brand:** GenCreator (`brand_gencreator`)
- **Repository:** `frankxai/creator-launch-os`
- **Date:** `2026-10-23`
- **Expiry:** `2027-01-21` (90 days or any material product change, whichever first)
- **Commercial posture:** **Waitlist-first (`available-soon`)**. Checkout stays off until G3 and G5 are signed off by Frank.

---

## Gate Summary (G0–G5)

| Gate | Status | Evidence | Owner |
| :--- | :--- | :--- | :--- |
| **G0 — Claim truth** | **PASS** | 14/14 buyer-facing claims mapped to exact `file:line` below; unapproved price table and revenue arithmetic removed from `docs/TEMPLATE-PRODUCT-FAMILIES.md` and excluded from the buyer ZIP (`release/package-manifest.json`). | Maker (`Gemini 4 Argon`) |
| **G1 — Deterministic pass** | **PASS** | Command-printed counts: `pnpm verify` (`check:decision-desk` + `check:offer` + `type-check` + `lint` + **123/123 contract tests** + 31-page `next build`), **10/10 parent Playwright browser tests**, **3/3 standalone Playwright tests**, `pnpm package:release` (**140 files**), `pnpm package:kit` (**12 kit files**). | Maker (`Gemini 4 Argon`) |
| **G2 — Buyer simulation** | **PASS** | Fresh release ZIP extracted into isolated `/tmp/g2-buyer-sim`, `pnpm install --frozen-lockfile && pnpm verify` (**121 pass, 0 fail, 2 kit-content skips**), 10/10 Playwright browser journeys (including two-step waitlist signup on `/kit`), standalone Monograph export (`prepare-portfolio-check.mjs`), browser edit/save/reopen/rebuild, and `390px` + `1440px` captures with `.vis.provenance.json` sidecars. | Maker (`Gemini 4 Argon`) |
| **G3 — Independent check (maker ≠ checker)** | **PENDING CROSS-MODEL RUN** | Prior slices reviewed by 5 distinct subagent runs (`Gasket`, `Rivet`, `Latch`, `Bolt`, `Quill`). Full converged release-candidate G3 brief for a different model provider is included in §5 below. | Different-model checker |
| **G4 — Post-purchase & first-run email path** | **PASS (Test Rehearsal)** | `scripts/commerce-rehearsal.mjs` over HTTP (`order.paid` 200 -> duplicate replay 200 -> signed delivery link 200 -> `order.refunded` 200 -> post-refund delivery `410 E_REVOKED` -> forged webhook `401`), plus early-refund tombstone (`200 revoked` -> `200 duplicate`), `409 E_ORDER_CONFLICT`, 7-day signed token TTL (>24h persistence), and staged welcome/first-run email with instant free-core gift (`docs/release/LAUNCH-PREP-DRAFTS-2026-10.md`). Live merchant/email awaits Frank's rail ruling (`starlight-estate#65`). | Maker (test mode) / Frank (live rail) |
| **G5 — Price integrity** | **BLOCKED (Sovereign Gate)** | `offer.facts.json` keeps `price.state: "decision_required", amount: null`. Two-step waitlist (`lib/demand-capture/`) is live on `/kit` and `/api/waitlist` to collect `priceBand` evidence before Frank signs off on price. | Frank Riemer |

---

## 1. G0 Receipt — Claim-to-Source Table

Every buyer-facing claim on `/`, `/start`, `/products`, `/studio`, and `/kit` maps to an inspected file and line in this commit:

| Buyer-facing claim | Exact `file:line` | Verification |
| :--- | :--- | :--- |
| Deploys with no required secrets (`requiredEnvironmentVariables: []`) | `template.manifest.json:39` | `tests/template-contract.test.mjs` |
| Server-first Next.js 16 App Router (`next: 16.3.8`) | `package.json:27` | `pnpm build` (31 routes) |
| MIT licensed free core | `LICENSE:1` | `tests/offer-facts.test.mjs` |
| Honest demo checkout fallback when no checkout URL is configured | `app/checkout/[slug]/page.tsx:40` | `tests/template-contract.test.mjs` |
| Six interactive template studies (`/studio/templates/[templateId]`) | `lib/template-catalog.ts:18` | `tests/browser/atelier.spec.mjs` |
| Browser Monograph editor with save, import review, multi-step undo & `beforeunload` guard | `components/portfolio-workspace.tsx:45` | `tests/standalone/portfolio.spec.mjs` |
| Standalone Next.js project exporter (`pnpm template:projects`) | `scripts/export-template-project.mjs:179` | `tests/template-project-export.test.mjs` |
| Free offline Architecture Decision Desk (`/architecture-decision-desk/index.html`) | `app/start/page.tsx:75` | `tests/browser/install.spec.mjs` |
| Merchant-agnostic commerce engine with convergent write-before-mark retries | `lib/commerce/engine.ts:200` | `tests/commerce-recovery.test.mjs` |
| Out-of-order early refund tombstone (`paidAt: null`) blocks subsequent payment | `lib/commerce/engine.ts:256` | `tests/commerce-order-safety.test.mjs` |
| Conflicting order ID reuse rejected with `409 E_ORDER_CONFLICT` + PII-free log | `app/api/commerce/webhook/route.ts:10` | `tests/commerce-order-safety.test.mjs` |
| 14-day refund window revokes entitlement and delivery link (`410 E_REVOKED`) | `lib/commerce/engine.ts:335` | `tests/commerce-loop.test.mjs` |
| Checkout stays off (`available-soon`) and renders shared demand-capture waitlist | `app/kit/page.tsx:118` | `tests/browser/kit.spec.mjs` |
| Waitlist withholds public counts below threshold (`50`) and preserves position on step-2 update | `lib/demand-capture/handler.ts:31` | `tests/gencreator-release-gate.test.mjs` |

---

## 2. G1 Receipt — Deterministic Test & Build Counts (Produced by Command)

Executed on Node.js `v24.22.1`, `pnpm 10.28.0`:

```text
$ pnpm verify
Decision Desk delivery bytes and reconstructable upstream patch verified. Upstream integration remains pending.
Offer facts agree across product, listing, template and package manifests
✓ Generating static pages using 1 worker (31/31)
ℹ tests 123
ℹ pass 123
ℹ fail 0
```

```text
$ pnpm exec playwright test
  10 passed (atelier: 4, install + Decision Desk: 4, kit + two-step waitlist + 503 guard: 2)
```

---

## 3. G2 Receipt — Fresh-Download Buyer Simulation (`390px` & `1440px`)

1. **Fresh archive extraction:** Extracted `dist/releases/*/creator-launch-os-1.1.0-*.zip` into `/tmp/g2-buyer-sim` outside the git repository.
2. **Cold install & verify:** `pnpm install --frozen-lockfile && pnpm verify` exited `0` (**121 pass, 0 fail, 2 explicit kit-content skips**; 31 static/dynamic routes built).
3. **Browser waitlist & setup journey:** Ran `pnpm exec playwright test` against the extracted build (`10/10 pass`). On `/kit`, filled `buyer.simulation@example.com`, checked consent, submitted Step 1 (`You are in, at number 1.`), selected role `Independent creator`, price band `25 - 99`, urgency `I need this now`, and pain text, and submitted Step 2 (`Thank you. You are number 1.`).
4. **First real creator outcome (Monograph export -> edit -> save -> rebuild):**
   - Exported standalone Monograph project (`node scripts/prepare-portfolio-check.mjs`), installed from its frozen lockfile, and ran `pnpm verify` (`exit 0`).
   - Exercised `/edit` in headless Chromium (`3/3 pass`): edited case studies, verified multi-step undo and `beforeunload` guard, exported project JSON, rebuilt a fresh standalone Next.js site from the downloaded JSON, and verified the rendered site matches the buyer's exact edits (`1/1 pass`).
5. **Responsive captures with provenance sidecars:**
   - `kit-390.png` + `kit-390.png.vis.provenance.json` (`390x900`, zero horizontal overflow)
   - `kit-1440.png` + `kit-1440.png.vis.provenance.json` (`1440x900`, zero horizontal overflow)
   - `monograph-workspace-390.png` + `monograph-workspace-390.png.vis.provenance.json` (`390x1000`)
   - `monograph-workspace-1440.png` + `monograph-workspace-1440.png.vis.provenance.json` (`1440x1000`)

---

## 4. G4 Receipt — Post-Purchase Delivery, 24h Persistence, Refund & Welcome Email Path

1. **HTTP fulfillment & revocation loop (`scripts/commerce-rehearsal.mjs`):**
   - `order.paid` (HMAC-SHA256 signed) → `200 granted` + signed delivery token
   - Duplicate webhook replay → `200 duplicate` (idempotent)
   - `GET /api/commerce/delivery?token=...` → `200` delivery opened
   - `order.refunded` → `200 revoked`
   - Post-refund `GET /api/commerce/delivery?token=...` → `410 E_REVOKED`
   - Forged webhook signature → `401 E_SIGNATURE`
2. **Access persistence > 24h:** `issueDeliveryToken` issues a 7-day (`604,800s`) HMAC-signed token; redemption at `+24h` succeeds while entitlement status is `active` and fails at `+7d + 1s` with `410 E_TOKEN_EXPIRED` (`tests/commerce-loop.test.mjs`).
3. **Support & unsubscribe path:** Support boundary (`GitHub issues` for free core; written kit support for kit buyers) and 14-day no-reason refund window are stated on `/kit` and in `commercial/policies/`. Waitlist consent checkbox states one-click unsubscribe in every email, and `addToAudience` syncs `unsubscribed: false` to Resend (`lib/demand-capture/store.ts`).

---

## 5. G3 Brief — Instructions for the Independent Cross-Model Checker

> **Role:** Independent G3 Release Checker (`maker ≠ checker`; must run on a different model family than the maker).
> **Permissions:** Read-only repository and sandbox test execution only. Do not edit source files, push branches, or merge PRs.
> **Target:** `frankxai/creator-launch-os` PR `#18` (stacked on `#17` → `#16`), plus the immutable release archive in `frankxai/agentic-ops#307`.
>
> **Checklist to execute cold:**
> 1. **G0 audit:** Open `docs/release/PRODUCT-RELEASE-GATE-RECEIPT-2026-10-23.md` and verify that all 14 claims in §1 resolve to the cited files and lines. Confirm that no live checkout button or price is rendered on `/kit` when `COMMERCE_MODE` is unset (`data-kit-availability="available-soon"`).
> 2. **G1 audit:** Extract the release ZIP into an isolated `/tmp` directory outside the git checkout. Run `pnpm install --frozen-lockfile && pnpm verify` (after applying `creator-launch-os-h01-workflows-only.patch` if testing the GitHub branch, or directly from the complete release ZIP). Confirm zero test failures and inspect the exact test count printed by `node --test`.
> 3. **G2 audit:** Run `pnpm exec playwright test` and the standalone Monograph export check (`node scripts/prepare-portfolio-check.mjs`). Inspect the `390px` and `1440px` screenshots and verify that every tracked image has a `.vis.provenance.json` sidecar whose `sha256` matches the file on disk and contains no Higgsfield usage.
> 4. **G4 audit:** Run `scripts/commerce-rehearsal.mjs` against `next start` in test mode and run `node --test tests/commerce-recovery.test.mjs tests/commerce-order-safety.test.mjs tests/commerce-isolation.test.mjs tests/gencreator-release-gate.test.mjs`.
> 5. **Output:** Issue `PASS`, `REVISE`, or `FAIL` with your model identifier, timestamp, exact command outputs, and any findings by severity (`P0`, `P1`, `P2`).
