# Staged launch preparation drafts — Creator Launch OS (GenCreator)

**Status:** `DRAFT_ONLY_DO_NOT_PUBLISH`
**Rules enforced:** Every piece names a real buyer job in the first line, contains zero superlatives and zero unratified price promises, and maps every factual claim to an exact `file:line` in the G0 table (`docs/release/PRODUCT-RELEASE-GATE-RECEIPT-2026-10-23.md`). No checkout, price, post, email send, or Whop publication is performed.

---

## 1. Staged landing copy (GenCreator voice, sentence case, waitlist-first)

When you need to publish and sell digital guides, templates or audio workshops from your own domain without paying a monthly website-builder fee, Creator Launch OS gives you a complete Next.js 16.4.3 storefront and release studio (`package.json:27`, `LICENSE:1`).

- **Headline:** Sell digital products from your own domain—and prove payment, delivery and refunds work before you go live. (`app/kit/page.tsx:208`)
- **Lede:** Start with the free MIT storefront that deploys to Vercel with zero required secrets (`template.manifest.json:39`, `LICENSE:1`). Edit your Monograph portfolio in the browser (`/studio/templates/portfolio/edit`), undo case removals in order (`components/portfolio-workspace.tsx:45`), click **Save project** (`monograph-project.json`), and run `pnpm template:projects --project monograph-project.json` to export a standalone Next.js repository (`scripts/export-template-project.mjs:179`).
- **Prove it works before you go live:** On `/kit`, walk one test order through the four-step rehearsal (`app/kit/page.tsx:239`, `components/first-sale-rehearsal.tsx:47`)—connecting a merchant in test mode, granting an entitlement on `order.paid`, opening the 7-day signed delivery link, and revoking access on `order.refunded` (`lib/commerce/engine.ts:219-250,344`).
- **What you still do yourself:** An explicit four-item checklist on `/kit` (`app/kit/page.tsx:353`) states what you supply: your own product files and copy, your own Vercel/KV/Resend/merchant accounts (`.env.example:1-27`), the webhook translator for the live merchant you choose (`lib/commerce/config.ts:28`), and your own legal review of the draft policy templates (`app/kit/page.tsx:378`).
- **Actions:** Prove the 4-step sale loop (`/kit#prove-it-works`) · Get the free starter (`/start`) · Join the commercial kit waitlist (`/kit`)

---

## 2. Five-post launch sequence (each opens with a buyer job, zero superlatives, G0-traceable)

### Post 1 — Specimen (Exporting an owned Monograph site)
When you want to publish a portfolio or product study on your own domain without renting a hosted page builder every month, you need source files you can export and build yourself.

In Creator Launch OS, you open `/studio/templates/portfolio/edit`, edit your case studies in the browser, undo removals in order, and get a warning before an accidental reload discards unsaved edits (`components/portfolio-workspace.tsx:45,67`). Clicking **Save project** downloads `monograph-project.json`, and running `pnpm template:projects --project monograph-project.json` writes a standalone Next.js 16.4.3 project (`package.json:27`, `scripts/export-template-project.mjs:179`) with its own lockfile and SHA-256 receipt.

What is open now: the MIT repository (`LICENSE:1`), all six template studies (`lib/template-catalog.ts:18`), and the offline Architecture Decision Desk at `/architecture-decision-desk/index.html` (`app/start/page.tsx:75`). Checkout on `/kit` stays off while the release gate finishes, and the waitlist is open (`app/kit/page.tsx:332`).

### Post 2 — Operator confession (Fixing webhook retries before taking an order)
When you wire a digital-product webhook to deliver paid downloads, a transient database error during checkout fulfillment should not leave your customer without access.

Our initial test-mode webhook handler marked `event.id` as processed before writing the order and entitlement. When a simulated write failed and returned HTTP 500, the merchant retry hit the processed marker and returned `200 duplicate`—dropping the buyer's entitlement. And if a refund webhook arrived before a delayed payment webhook, returning `422` allowed the later payment to grant access to a refunded order.

In `lib/commerce/engine.ts`, state writes now converge before `store.markEvent(event.id)` runs (`lib/commerce/engine.ts:219-250`), early signed refunds record a refunded tombstone with `paidAt: null` (`lib/commerce/engine.ts:265`), and reused order IDs with conflicting buyer facts return `409 E_ORDER_CONFLICT` with a PII-free log line (`app/api/commerce/webhook/route.ts:10,45`). You can walk all four steps interactively on `/kit#prove-it-works` (`app/kit/page.tsx:239`).

### Post 3 — Receipt (Testing the actual ZIP a buyer downloads)
When you package a codebase as a downloadable release archive, a test suite that passes in your git working tree can still fail for the person who unzips the file.

During verification of Creator Launch OS, our packaging tests passed in the repository checkout while a shipped test still read an internal research document excluded from `release/package-manifest.json`. Extracting the built ZIP into `/tmp` outside the git checkout exposed an immediate `ENOENT` failure.

We separated repository-only policy checks from shipped tests so extracting the release ZIP and running `pnpm install --frozen-lockfile && pnpm verify` passes cleanly on the 31-route Next.js 16.4.3 build (`package.json:27`, `template.manifest.json:39`).

### Post 4 — Calibration (Running a per-product waitlist before locking a price)
When you prepare to launch a commercial kit alongside an open-source core, guessing a price or displaying a broken buy button wastes visitor trust.

On Creator Launch OS `/kit`, `COMMERCE_MODE` defaults to `off` (`lib/commerce/config.ts`). While no live merchant adapter is configured, `/kit` renders `Available soon` (`app/kit/page.tsx:332`), shows an interactive four-step test rehearsal (`app/kit/page.tsx:239`), lists what you still do yourself (`app/kit/page.tsx:353`), and embeds the shared two-step waitlist. Step 1 claims an atomic queue position in KV (`lib/demand-capture/store.ts:44`); step 2 asks your role, urgency, and expected price band without incrementing your position or exposing counts below 50 (`lib/demand-capture/handler.ts:56`).

### Post 5 — Escalation ladder (Four steps from a local decision to a storefront)
When you are turning scattered notes and drafts into a digital product catalog, you can adopt Creator Launch OS one layer at a time:
1. Open the local Architecture Decision Desk at `/architecture-decision-desk/index.html` to map options, trust boundaries and failure tests (`app/start/page.tsx:75`).
2. Deploy the MIT storefront with zero required environment variables (`LICENSE:1`, `template.manifest.json:39`) and an honest demo checkout preview (`app/checkout/[slug]/page.tsx:40`).
3. Customize any of the six template studies (`lib/template-catalog.ts:18`) and export a standalone Next.js project (`scripts/export-template-project.mjs:179`).
4. Walk the four-step test sale on `/kit#prove-it-works` (`app/kit/page.tsx:239`) and join the `/kit` waitlist for the commercial kit—which adds the launch playbook, manifest pack, merchant integration guide, and refund revocation runbook (`app/kit/page.tsx:332`, `lib/commerce/engine.ts:344`).

---

## 3. Staged launch / welcome email draft (buyer job in line 1, saved-JSON handoff included, zero superlatives, G0-traceable)

**Subject:** Your Creator Launch OS starter and waitlist position (`#{position}`)
**From:** GenCreator (`noreply@gencreator.ai` — draft only, not sent)

When you want to publish digital products from your own domain without stitching together a storefront, editor and delivery check from scratch, you can start with the free MIT core of Creator Launch OS today (`LICENSE:1`, `package.json:27`).

Your email is recorded at position `#{position}` on the waitlist for the Creator Launch OS commercial kit (`lib/demand-capture/handler.ts:56`).

**Use the free MIT core right now (zero required secrets — `template.manifest.json:39`):**
1. Clone and run locally on Node.js 24 and pnpm 10.28.0:
   ```bash
   git clone https://github.com/frankxai/creator-launch-os.git
   cd creator-launch-os
   pnpm install --frozen-lockfile
   pnpm dev
   ```
2. Open `/studio/templates/portfolio/edit` to edit your Monograph case studies with multi-step undo and an unsaved-changes guard (`components/portfolio-workspace.tsx:45,67`). Click **Save project** in the editor bar to download `monograph-project.json`, then run `pnpm template:projects --project monograph-project.json` in your terminal to export a standalone Next.js repository containing your exact edits (`scripts/export-template-project.mjs:179`).
3. Walk the four-step test sale on `/kit#prove-it-works` (`app/kit/page.tsx:239`), browse the six template studies (`lib/template-catalog.ts:18`), inspect the demo checkout handoff (`app/checkout/[slug]/page.tsx:40`), and open the offline Architecture Decision Desk at `/architecture-decision-desk/index.html` (`app/start/page.tsx:75`).

**What your founding waitlist spot includes (`app/kit/page.tsx:332-336`):**
- First 100 are named in the release credits (optional—your choice) and help choose which merchant adapter ships first (`data/products.graph.json:37`).
- Draft refund policy (`offer.facts.json:50`, `app/kit/page.tsx:378`, pending owner ratification): once checkout opens, processing a refund revokes the entitlement and delivery link (`lib/commerce/engine.ts:344`).
- One email when the commercial kit passes its release gate and opens. Unsubscribe in any email.

— Frank / GenCreator

---

## 4. Staged Whop product draft (unpublished, no price set)

Stored at `commercial/whop-product-draft.json` (`status: "STAGED_LOCAL_DRAFT_NOT_CREATED_OR_PUBLISHED"`, `price_set: null`, `checkout_enabled: false`).
