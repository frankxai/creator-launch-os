# Staged launch preparation drafts — Creator Launch OS (GenCreator)

**Status:** `DRAFT_ONLY_DO_NOT_PUBLISH`
**Hard stop enforced:** No checkout, no public price, no external post, no email send, no Whop publication, no merge, and no production promotion.

---

## 1. Staged landing copy (GenCreator voice, sentence case, waitlist-first)

### Hero
- **Eyebrow:** Creator Launch OS · v1.1.0 · Free MIT source
- **Headline:** Your source is the beginning. Your choices make the edition.
- **Lede:** Turn working notes, guides and studies into an owned Next.js storefront and signed release edition. Review every change in the browser, export a standalone project, and capture pre-launch demand before opening checkout.
- **Primary action (free core):** Get the free starter (`/start`)
- **Secondary action (commercial kit waitlist):** Join the waitlist (`/kit`)

### Three-step edition sequence
1. **Start from source you control.** Clone the free MIT repository or deploy to your own Vercel account with zero required secrets.
2. **Shape and inspect the edition.** Edit your Monograph case studies in `/studio/templates/portfolio/edit`, review local JSON imports before applying, undo removals in order, and export an independent Next.js codebase with a SHA-256 receipt.
3. **Collect demand before you price.** Until payment, delivery and refunds pass an end-to-end gate, `/kit` runs a two-step waitlist that records who is waiting, what they are building, and the price band they expect.

---

## 2. Five-post launch sequence (Voice Observatory moves, sentence case, draft only)

### Post 1 — Specimen (The exported Monograph workspace)
Most creator templates rent you a layout inside someone else's hosted builder. Stop paying the monthly fee and your storefront disappears.

Creator Launch OS takes a different route: you edit your Monograph portfolio in the browser (`/studio/templates/portfolio/edit`), review any imported JSON diff before it touches your draft, and run `pnpm template:projects` to export a standalone Next.js 16 repository with its own lockfile and SHA-256 receipt.

What works today: six composition studies, browser save/reopen, multi-step undo, and clean-room standalone builds.
What is not live yet: hosted checkout stays off until the release gate finishes. The MIT source is open now, and the commercial kit waitlist is open on `/kit`.

### Post 2 — Operator confession (Why our first webhook test lost a buyer's access)
Our first test-mode webhook handler marked `event.id` as processed on line 1, then wrote the order and entitlement on lines 2 and 3.

That passed every happy-path test. When we injected a single transient failure on `putEntitlement`, the route returned HTTP 500, the merchant retried the same event ID, and our handler answered `200 duplicate`—leaving a paid buyer with no access. Worse: if a signed refund arrived before a delayed payment webhook, returning `422` meant the later payment granted lasting access to a refunded order.

We rewrote `lib/commerce/engine.ts` (`PR #18`) so state writes converge first, early signed refunds record a tombstone (`paidAt: null`), reused order IDs with conflicting buyer facts return `409 E_ORDER_CONFLICT` with a PII-free operator log, and `markEvent` runs last. Verified across 28 fault-injection, isolation and order-safety tests.

### Post 3 — Receipt (Catching a buyer-ZIP failure that git checkouts hide)
A test suite that passes in your git checkout can still fail for every person who downloads your release ZIP.

During release verification of Creator Launch OS, `21/21` packaging tests passed in the repository. When an independent checker extracted the built buyer ZIP into `/tmp` outside the git tree, `pnpm test` failed with `ENOENT`: a shipped test read an internal research file that the release allowlist intentionally excluded.

We separated repository-only policy tests from shipped buyer tests and added a clean-ZIP verification gate: extract the built archive into `/tmp`, run `pnpm install --frozen-lockfile && pnpm verify`, and run the browser suite against the extracted build. All 121 shipped tests now pass from the extracted ZIP.

### Post 4 — Calibration (Why pre-launch pages should run a waitlist, not a guess price)
Most digital products launch with a guessed price and a checkout link that has never been tested through a real refund.

On Creator Launch OS `/kit`, `COMMERCE_MODE` defaults to `off`. Until a live merchant adapter, delivery link and refund revocation pass a full gate receipt, the page renders no buy button and no unverified price. Instead, it runs a two-step waitlist: step 1 claims a real queue position by email; step 2 asks three optional questions—your role, what you are trying to ship, and the price band you expect. Counts below 50 are withheld rather than rounded or seeded.

### Post 5 — Escalation ladder (From local markdown to a full release studio)
One release workflow, four levels of depth depending on what you need today:
1. **Free worksheet & Decision Desk (`/architecture-decision-desk/index.html`):** Plan an architecture decision, trust boundaries, failure tests and all-attempts cost in the browser with `connect-src 'none'`.
2. **Free MIT storefront & studio (`/`, `/products`, `/studio`):** Deploy a Next.js 16 catalog with an honest demo checkout fallback and zero required secrets.
3. **Standalone composition exporter (`pnpm template:projects`):** Export any of the six template studies into its own Next.js repository.
4. **Commercial kit waitlist (`/kit`):** Join the founding cohort for the launch playbook, manifest pack, policy templates and merchant integration guide.

---

## 3. Staged launch / welcome email draft (first-run gift + honest status, draft only)

**Subject:** Your Creator Launch OS starter and founding waitlist position (`#{position}`)
**From:** GenCreator (`noreply@gencreator.ai` — draft only, not sent)

Hello,

You are on the founding waitlist for the Creator Launch OS commercial kit at position `#{position}`.

While the commercial kit completes its release gate, the complete MIT storefront, Monograph editor and standalone project exporter are ready for you to use right now on your own machine or Vercel account—with no API keys or secrets required:

1. **Run locally in four commands (Node.js 24 + pnpm 10.28.0):**
   ```bash
   git clone https://github.com/frankxai/creator-launch-os.git
   cd creator-launch-os
   pnpm install --frozen-lockfile
   pnpm dev
   ```
2. **Edit and export your own Monograph site:**
   Open `http://localhost:3000/studio/templates/portfolio/edit`, replace the sample case studies, download your project JSON, and run `pnpm template:projects --project your-saved-project.json` to generate a standalone Next.js repository.

**What your founding spot locks in:**
- First 100 keep launch pricing for life once pricing is ratified.
- Named credit in the release notes (optional—your choice).
- One email when the commercial kit passes its release gate and opens. Nothing else.

If you skipped the three optional questions on `/kit`, you can reply to this email with one line on what you are launching this quarter and what you use today. Every reply is read.

To leave this list at any time, use the unsubscribe link below.

— Frank / GenCreator

---

## 4. Staged Whop product draft (unpublished, no price set)

Stored as machine-readable payload at `commercial/whop-product-draft.json` for review only. **Not submitted or published to Whop.**
