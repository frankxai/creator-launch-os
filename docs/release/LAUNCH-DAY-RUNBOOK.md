# Launch-Day Runbook & First-Week Metrics Spec — Creator Launch OS (`sku_creator_launch_os_v1`)

- **Product ID:** `product_creator_launch_os` / `sku_creator_launch_os_v1` (`creator-launch-os` in `data/products.graph.json`)
- **Brand:** GenCreator (`brand_gencreator`)
- **Repository:** `frankxai/creator-launch-os`
- **Status:** `STAGED_RUNBOOK_DO_NOT_EXECUTE_UNTIL_G2_G3_G5_PASS`
- **Hard guardrails:** Do not execute Steps 2–7 until Frank signs off on morning real-browser **G2**, **G3**, and **G5** (price + live payment rail). This document is excluded from `release/package-manifest.json` so internal operational procedures and price options never ship in the free MIT buyer archive.

---

## 1. Pre-Launch Plan Object (State Machine Before Any Live Action)

Before flipping `offer.facts.json` or merging to `main`, verify that the release plan object satisfies every precondition below:

```json
{
  "plan_id": "launch_creator_launch_os_2026_10",
  "product_id": "product_creator_launch_os",
  "sku_id": "sku_creator_launch_os_v1",
  "gates": {
    "G0_claim_truth": "PASS",
    "G1_deterministic_ci": "PASS",
    "G2_maker_playwright": "PASS",
    "G2_independent_browser": "REQUIRED_MORNING_SIGN_OFF",
    "G3_independent_checker": "PASS_AT_EC9C44C_P2S_FIXED",
    "G4_test_rehearsal": "PASS",
    "G5_owner_price_and_rail": "REQUIRED_FRANK_SIGN_OFF"
  },
  "stack": {
    "base_pr": "frankxai/creator-launch-os#16",
    "rc_pr": "frankxai/creator-launch-os#17",
    "estate_pr": "frankxai/starlight-estate#66",
    "evidence_pr": "frankxai/agentic-ops#307",
    "superseded_prs_to_close": [8, 11, 15]
  },
  "target_mode": "waitlist_first_or_live_after_g5"
}
```

| Step | Owner | Command or click | Check (pass criterion) |
| :--- | :--- | :--- | :--- |
| **1.1 Confirm morning G2 & G5 ruling** | **Frank** | Review `docs/release/G5-PRICE-EVIDENCE.md` and post owner ruling on `frankxai/creator-launch-os#17` (`waitlist-only merge` **or** `lock price + rail`: `$49` Founding / `$69` Standard / `$149` Team + chosen merchant). | Comment on `#17` explicitly records `G2: PASS` and either `MODE: WAITLIST_ONLY` or `G5: LOCKED ($XX USD, merchant=<rail>)`. |

---

## 2. `offer.facts.json` & Manifest Ratification (Only After Frank Signs G5)

> **Note:** If merging in **waitlist-first mode** (`COMMERCE_MODE=off` in production while collecting verified waitlist demand), **skip Step 2.1–2.2** so `offer.facts.json` stays `price.state: "decision_required", amount: null` and `/kit` stays `Available soon`. Execute Steps 2.1–2.2 only when locking the live price and merchant adapter.

| Step | Owner | Command or click | Check (pass criterion) |
| :--- | :--- | :--- | :--- |
| **2.1 Lock price and refund policy in `offer.facts.json`** | **Agent / Frank** | Update `offer.facts.json` (`:39-54`): set `"price": { "state": "locked", "amount": <APPROVED_USD>, "currency": "USD", "note": "One-time commercial license" }`, `"checkout": { "state": "enabled", "merchant": "<CHOSEN_MERCHANT>" }`, and `"refund": { "state": "ratified", "window_days": 14, ... }`. | `jq '.price, .checkout, .refund' offer.facts.json` prints `state: "locked"`, integer `amount`, and `refund.state: "ratified"`. |
| **2.2 Sync manifests and run offer check** | **Agent** | Update `product.manifest.yaml` and `marketplace.listing.yaml` to match `offer.facts.json`, wire the chosen merchant's signature translator in `lib/commerce/config.ts:21-42`, and run:<br>`pnpm run check:offer && pnpm verify` | `pnpm verify` exits `0` (`Offer facts agree across product, listing, template and package manifests`, all contract tests pass, 31/31 pages build). |

---

## 3. PR Merge Order (`#16` → `#17` → `main` + Estate & Evidence)

| Step | Owner | Command or click | Check (pass criterion) |
| :--- | :--- | :--- | :--- |
| **3.1 Merge `#17` into `#16` (or merge `#16` to `main` first)** | **Frank** | 1. On GitHub, open [`frankxai/creator-launch-os#16`](https://github.com/frankxai/creator-launch-os/pull/16) and click **Merge pull request** into `main` (`gh pr merge 16 --merge`).<br>2. Confirm GitHub retargets [`frankxai/creator-launch-os#17`](https://github.com/frankxai/creator-launch-os/pull/17) base to `main` (or run `gh pr edit 17 --base main`), wait for the 4 CI checks, and click **Merge pull request** (`gh pr merge 17 --merge`). | `git log --oneline -n 3 origin/main` shows `#17` merged cleanly on top of `#16`; all 4 GitHub Actions jobs on `main` are `completed / success`. |
| **3.2 Close superseded PRs (`#8`, `#11`, `#15`)** | **Frank** | Run:<br>`gh pr close 8 11 15 --repo frankxai/creator-launch-os --comment "Superseded by converged release stack #16 -> #17."` | `gh pr list --repo frankxai/creator-launch-os --state open` returns `0` open PRs (`#18` and `#19` are already closed). |
| **3.3 Merge estate registry & evidence PRs** | **Frank** | Mark ready and merge [`frankxai/starlight-estate#66`](https://github.com/frankxai/starlight-estate/pull/66) (`graph/products.graph.json` row) and [`frankxai/agentic-ops#307`](https://github.com/frankxai/agentic-ops/pull/307) (canonical `SL-HA-20261023` receipts). | Both PRs show `MERGED` and `jq '.products[] | select(.id=="creator-launch-os")' graph/products.graph.json` resolves in `starlight-estate`. |

---

## 4. Production Deploy & Environment Wiring (Vercel + KV + Resend)

| Step | Owner | Command or click | Check (pass criterion) |
| :--- | :--- | :--- | :--- |
| **4.1 Configure waitlist KV & Resend env vars in Vercel** | **Frank** | In Vercel Project Settings → Environment Variables (`production`), set:<br>• `KV_REST_API_URL` & `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`)<br>• `RESEND_API_KEY`<br>• `RESEND_FROM_EMAIL="GenCreator <noreply@gencreator.ai>"`<br>• `RESEND_AUDIENCE_ID__CREATOR_LAUNCH_OS` | `vercel env ls production` lists all 5 keys; no secret appears in `NEXT_PUBLIC_*`. |
| **4.2 Configure commerce mode (`off` for waitlist-first, `live` after G5)** | **Frank** | • **Waitlist-first launch:** Leave `COMMERCE_MODE=off` (default).<br>• **Live checkout launch (after G5 & durable store):** Set `COMMERCE_MODE=live`, `COMMERCE_MERCHANT=<merchant>`, `COMMERCE_WEBHOOK_SECRET` (≥32 chars), `COMMERCE_DELIVERY_SECRET` (≥32 chars), `NEXT_PUBLIC_KIT_CHECKOUT_URL=https://...`. | In waitlist-first mode, `/kit` renders `data-kit-availability="available-soon"`; in live mode, `/kit` renders `data-kit-availability="available"`. |
| **4.3 Trigger production deploy** | **Frank** | Merge to `main` auto-deploys on Vercel, or run:<br>`vercel deploy --prod` | Vercel deployment status is `Ready` and aliases `https://creator-launch-os-starlight-intelligence.vercel.app` (or custom domain). |

---

## 5. Production Smoke Checks (T+0 Minutes After Deploy)

| Step | Owner | Command or click | Check (pass criterion) |
| :--- | :--- | :--- | :--- |
| **5.1 Health & route reachability** | **Agent / Frank** | Run:<br>`curl -fsS https://creator-launch-os-starlight-intelligence.vercel.app/api/health \| jq .` | Returns HTTP `200` with `{ "ok": true }`. |
| **5.2 `/kit` availability & rehearsal check** | **Agent / Frank** | Open `https://creator-launch-os-starlight-intelligence.vercel.app/kit` at `390px` and `1440px`; click **Run all 4 test steps** in `#prove-it-works`. | Step 04 displays `Throws E_REVOKED`; `#what-you-do-yourself` displays all 4 boundary cards; no horizontal scroll (`scrollWidth <= clientWidth + 1`). |
| **5.3 Waitlist double-opt-in smoke test** | **Frank** | Submit `frank+smoke@frankx.ai` on `/kit` Step 1 → complete Step 2 → click the `?verify=` link delivered to `frank+smoke@frankx.ai`. | Step 1 returns `{ position: 1 }`; verification email arrives via Resend; clicking `?verify=` returns `{ "ok": true, "verified": true, "count": 1 }` and adds contact to `RESEND_AUDIENCE_ID__CREATOR_LAUNCH_OS`. |
| **5.4 Webhook fail-closed / signature check** | **Agent / Frank** | Run:<br>`curl -i -X POST https://creator-launch-os-starlight-intelligence.vercel.app/api/commerce/webhook -d '{}'` | Returns `503 available_soon` when `COMMERCE_MODE=off`, or `401 E_SIGNATURE` (missing `x-commerce-timestamp`) when `COMMERCE_MODE=live`. |

---

## 6. Waitlist Announcement Email (When Commercial Kit Opens)

Staged copy lives in `docs/release/LAUNCH-PREP-DRAFTS-2026-10.md` §3. Only subscribers with `verified === true` in KV (`waitlist:creator-launch-os:signals`) are emailed.

| Step | Owner | Command or click | Check (pass criterion) |
| :--- | :--- | :--- | :--- |
| **6.1 Export verified waitlist recipients (dry run)** | **Agent / Frank** | Run read-only inspection against KV:<br>`node --input-type=module -e 'import { allSignals } from "./lib/demand-capture/store.ts"; const list = (await allSignals("creator-launch-os")).filter(s => s.verified); console.log({ verifiedRecipients: list.length, positions: list.map(s => s.position) });'` | Prints count of `verified: true` subscribers (`unverified` entries are excluded). |
| **6.2 Send preview email to Frank first** | **Frank** | In Resend Broadcasts (or via `POST https://api.resend.com/emails` to `frank@frankx.ai`), send the staged announcement draft from `docs/release/LAUNCH-PREP-DRAFTS-2026-10.md` §3. | Preview email renders cleanly on mobile and desktop; every link (`/start`, `/kit#prove-it-works`, `/studio/templates/portfolio/edit`) returns HTTP `200`; unsubscribe footer works. |
| **6.3 Send broadcast to `RESEND_AUDIENCE_ID__CREATOR_LAUNCH_OS`** | **Frank** | Click **Send Broadcast** in Resend dashboard to audience `RESEND_AUDIENCE_ID__CREATOR_LAUNCH_OS` (which contains only double-opt-in verified contacts). | Resend Broadcast status is `Sent`; bounce rate `< 2%`. |

---

## 7. Five-Post Launch Sequence Timing (`docs/release/LAUNCH-PREP-DRAFTS-2026-10.md` §2)

All 5 drafts are staged in `docs/release/LAUNCH-PREP-DRAFTS-2026-10.md` §2. Each opens with a concrete buyer job and cites `G0` `file:line` truth.

| Timing | Post | Owner | Action / click | Check (pass criterion) |
| :--- | :--- | :--- | :--- | :--- |
| **T+0h (Launch morning)** | **Post 1 — Specimen** *(Exporting an owned Monograph site)* | **Frank** | Publish Post 1 with the `1440px` `/kit` + Monograph editor screenshot (`kit-1440.png`) and link to `/studio/templates/portfolio/edit` and `/kit`. | Post is live; reply thread includes the GitHub repo link and `/kit#prove-it-works`. |
| **T+6h (Launch afternoon)** | **Post 2 — Operator confession** *(Fixing webhook retries & early refunds)* | **Frank** | Publish Post 2 highlighting convergent `write-before-mark` (`lib/commerce/engine.ts:223-255`), early-refund tombstones (`:270`), and `409 E_ORDER_CONFLICT`. | Post is live; links directly to `/kit#prove-it-works` Step 02 & Step 04. |
| **T+24h (Day 2)** | **Post 3 — Receipt** *(Testing the actual 137-file ZIP a buyer downloads)* | **Frank** | Publish Post 3 showing the clean `/tmp` buyer ZIP extraction and exclusion of internal release-gate docs (`release/package-manifest.json:64-65`). | Post is live; links to `/start` for the free MIT starter. |
| **T+48h (Day 3)** | **Post 4 — Calibration** *(Running a fail-closed, verified waitlist before locking price)* | **Frank** | Publish Post 4 explaining `KvNotConfiguredError` (`503`), atomic `HSETNX` claims, and verified-only `foundingSeatsLeft` (`lib/demand-capture/handler.ts:55-68`). | Post is live; links to `/kit` waitlist. |
| **T+72h (Day 4)** | **Post 5 — Escalation ladder** *(Four steps from local Decision Desk to storefront)* | **Frank** | Publish Post 5 walking the 4 adoption layers (`/architecture-decision-desk/index.html` → MIT storefront → standalone Monograph export → `/kit` commercial kit). | Post is live; first-week funnel snapshot (Step 9 below) recorded at T+72h and T+7d. |

---

## 8. Rollback Procedure (<60 Seconds, Zero Data Loss)

| Scenario | Owner | Command or click | Check (pass criterion) |
| :--- | :--- | :--- | :--- |
| **8.1 Pause checkout immediately (keep site, free starter & waitlist live)** | **Frank** | In Vercel Environment Variables, set `COMMERCE_MODE=off` and redeploy (or run `vercel env rm COMMERCE_MODE production -y && vercel deploy --prod`). | `/kit` immediately renders `data-kit-availability="available-soon"` and `/api/commerce/webhook` returns `503 available_soon`. All KV waitlist records remain intact. |
| **8.2 Full deployment rollback to prior Vercel build** | **Frank** | In Vercel Dashboard → Deployments → select the previous known-good production deployment → click **Instant Rollback** (or `vercel rollback <deployment-url>`). | `curl -fsS https://creator-launch-os-starlight-intelligence.vercel.app/api/health` returns `200`; `/kit` renders cleanly within 30 seconds. |

---

## 9. First-Week Metrics Spec (Zero New Tracking Vendors — Repo Primitives Only)

All first-week metrics are computed directly from existing repository stores (`lib/demand-capture/store.ts`, `commercial/kit/06-funnel-telemetry-schema.json`, and GitHub/Vercel built-in logs). **No third-party analytics script, pixel, or cookie banner is added.**

### 9.1 Metric Definitions & Exact Repo Sources

| Metric | Formula | Exact source in repository / infrastructure | Target / signal threshold |
| :--- | :--- | :--- | :--- |
| **1. Waitlist Step-1 → Verified → Step-2 Completion** | • `raw_step1 = getCount("creator-launch-os")`<br>• `verified = getVerifiedCount("creator-launch-os")`<br>• `step2_completed = allSignals("creator-launch-os").filter(s => Boolean(s.role \|\| s.priceBand \|\| s.urgency \|\| s.pain)).length`<br>• `verify_rate = verified / raw_step1`<br>• `step2_rate = step2_completed / raw_step1` | • `waitlist:creator-launch-os:count` (`lib/demand-capture/store.ts:54-57`)<br>• `waitlist:creator-launch-os:verified_count` (`lib/demand-capture/store.ts:60-63`)<br>• `waitlist:creator-launch-os:signals` hash (`lib/demand-capture/store.ts:84-89`, `lib/demand-capture/handler.ts:89,110-128`) | • `verify_rate >= 60%` (confirms Resend deliverability)<br>• `step2_rate >= 45%` (confirms buyer qualification depth)<br>• `verified >= 50` unlocks `publicCount` (`data/products.graph.json:33`) |
| **2. Price-Band Distribution (Verified vs. All)** | Histogram of `s.priceBand` across `allSignals("creator-launch-os")` (and filtered by `s.verified === true`) over the 7 enum values in `lib/demand-capture/types.ts:4`:<br>`"free-only" \| "under-25" \| "25-99" \| "100-299" \| "300-999" \| "over-1000" \| "company-pays"` | • `DemandSignal.priceBand` stored in `waitlist:creator-launch-os:signals` (`lib/demand-capture/types.ts:4,20`, `lib/demand-capture/questions.ts:24-32`, `lib/demand-capture/handler.ts:17,117`) | • Share of verified respondents selecting `"25-99"`, `"100-299"`, or `"company-pays"` `>= 50%` validates the `$49` Founding / `$69` Standard / `$149` Team G5 pricing ladder (`docs/release/G5-PRICE-EVIDENCE.md`). |
| **3. `/kit` → Free Download / Starter Rate** | • **Server route ratio (Vercel request logs):** `count(GET /start with Referer ending in /kit)` ÷ `count(GET /kit)`<br>• **Telemetry schema event ratio (when server log sink is enabled):** `count(event="free_core_clicked")` ÷ `count(event="kit_offer_viewed")`<br>• **GitHub clone/zip traffic:** `gh api repos/frankxai/creator-launch-os/traffic/clones` & `traffic/views` | • `app/kit/page.tsx:261-275` (`Get the free starter` → `/start` and `Inspect the source` → `siteConfig.sourceUrl`)<br>• `commercial/kit/06-funnel-telemetry-schema.json:12-20` (`kit_offer_viewed`, `free_core_clicked` — no PII)<br>• `DemandSignal.source === "/kit"` (`lib/demand-capture/handler.ts:119`) | • Track ratio of visitors who adopt the free MIT core (`/start`) vs. join the commercial kit waitlist (`POST /api/waitlist`) from `/kit`. |

### 9.2 Ready-to-Run First-Week Metrics CLI Command (Owner: Frank / Agent)

Run this read-only command with production KV credentials loaded (`KV_REST_API_URL` / `KV_REST_API_TOKEN`) to print the complete first-week waitlist funnel and price-band distribution table with zero external dependencies:

```bash
node --input-type=module -e '
import { allSignals, getCount, getVerifiedCount } from "./lib/demand-capture/store.ts";

const productId = "creator-launch-os";
const [rawCount, verifiedCount, signals] = await Promise.all([
  getCount(productId),
  getVerifiedCount(productId),
  allSignals(productId),
]);

const step2 = signals.filter((s) => Boolean(s.role || s.priceBand || s.urgency || s.pain));
const verifiedSignals = signals.filter((s) => s.verified);

const bands = ["free-only", "under-25", "25-99", "100-299", "300-999", "over-1000", "company-pays", "unanswered"];
const bandCounts = Object.fromEntries(bands.map((b) => [b, { all: 0, verified: 0 }]));
for (const s of signals) {
  const key = s.priceBand ?? "unanswered";
  bandCounts[key].all += 1;
  if (s.verified) bandCounts[key].verified += 1;
}

console.log(JSON.stringify({
  productId,
  generatedAt: new Date().toISOString(),
  funnel: {
    step1_claimed: rawCount,
    verified_double_opt_in: verifiedCount,
    step2_completed: step2.length,
    verify_rate_pct: rawCount ? Number(((verifiedCount / rawCount) * 100).toFixed(1)) : 0,
    step2_completion_rate_pct: rawCount ? Number(((step2.length / rawCount) * 100).toFixed(1)) : 0,
  },
  priceBandDistribution: bandCounts,
}, null, 2));
'
```
