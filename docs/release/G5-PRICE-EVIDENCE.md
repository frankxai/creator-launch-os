# G5 Price Evidence Pack — Creator Launch OS (`sku_creator_launch_os_v1`)

- **Gate:** `PRODUCT-RELEASE-GATE.md` G5 (Price integrity — sovereign gate; prepared by agent, decided and signed by Frank Riemer)
- **Status:** `PREPARED_FOR_OWNER_DECISION` (`offer.facts.json` retains `price.state: "decision_required", amount: null`; checkout remains off; no price or price-lock promise is shown on buyer surfaces until Frank rules)
- **Date prepared:** `2026-10-24`

---

## 1. Competitive Price Benchmark (Verified HTTP 200 on `2026-10-24`)

| Paid Alternative | URL | Price | What the Buyer Gets | Where Creator Launch OS Delivers Higher Value |
| :--- | :--- | :--- | :--- | :--- |
| **1. Supplier** (gustavwf / Framer — **Must-Beat**) | `https://www.framer.com/marketplace/templates/supplier/` | **$79.00** | Framer landing page and catalog with external checkout links and waitlist form. | Saves the buyer a recurring Framer hosting subscription ($15–$30/mo); delivers owned Next.js 16 source (`package.json:27`), a standalone Monograph exporter (`scripts/export-template-project.mjs:179`), a fail-closed two-step waitlist (`app/kit/page.tsx:332`), and a server-side webhook/entitlement/refund loop (`lib/commerce/engine.ts:219-250`). |
| **2. Creator OS Full Stack** (Built by Josh Studio / Notion) | `https://builtbyjoshstudio.com/products/creator-os-full-stack.html` | **$68.99** | Five internal Notion workspaces (Content, Business, Finance, Launch, Product). | Notion workspaces have no public web storefront or fulfillment endpoints. Creator Launch OS provides the public Next.js storefront (`app/page.tsx`), release studio (`app/studio/page.tsx`), and webhook/delivery routes (`app/api/commerce/webhook/route.ts:10,45`). |
| **3. Digital Product OS + Creator OS** (ThatVibeCoder / Notion) | `https://www.thatvibecoder.io/products` | **$54.00** | Two Notion trackers with built-in AI prompts for hooks and manual sales logging. | Replaces manual row pasting with HMAC-verified webhook ingestion, convergent retry recovery (`lib/commerce/engine.ts:219-250`), and automated buyer data export. |
| **4. Mention** (Menphine / Framer) | `https://www.framer.com/marketplace/templates/mention/` | **$39.00** | Framer storefront template for Notion creators with CMS collections and blog. | Eliminates Framer lock-in and no-refund restriction; includes 6 editable Next.js composition studies (`lib/template-catalog.ts:18`) plus the launch playbook, manifest pack, and policy templates (`offer.facts.json`). |
| **5. Notion Creator OS** (Menphine / Notion) | `https://www.menphine.com/notion-templates/notion-creator-os` | **$29.00** ($89.00 bundle) | Notion tracker for digital products, store discounts, posts, and revenue. | Delivers the actual deployable web storefront, Monograph browser editor (`components/portfolio-workspace.tsx:45`), and signed delivery links (`lib/commerce/engine.ts:344`). |

---

## 2. Three Proposed Price Points for Frank's G5 Decision

Until Frank signs off and locks `offer.facts.json`, `/kit` shows no price, no price-lock promise, and no buy button (`app/kit/page.tsx:324-337`).

| Tier | Proposed Price | Target Buyer & Value Logic | Proposed Refund Policy (Draft until Ratified) |
| :--- | :--- | :--- | :--- |
| **1. Launch (Founding Cohort Option — First 100 on Waitlist)** | **$49 USD** one-time | **Solo creator launching their first owned product page.** Priced $20–$30 below `Creator OS Full Stack` ($68.99) and `Supplier` ($79.00) while delivering the 6-part commercial kit (`commercial/kit/kit.manifest.json`): launch playbook, manifest pack, merchant integration guide, fulfillment runbook, refund/support policy templates, and telemetry schema. *(Optional for Frank to approve: grant the first 100 waitlist signups a founding price lock at $49 once G5 is signed.)* | **Proposed 14-day refund window** (`offer.facts.json:50`, `commercial/policies/REFUND-POLICY.md`, draft awaiting Frank's ratification). When `order.refunded` is sent by the merchant, `applyEvent` marks the order `refunded`, sets the entitlement to `revoked` (`lib/commerce/engine.ts:254-282`), and causes the delivery link to return `410 E_REVOKED` (`lib/commerce/engine.ts:344`). |
| **2. Standard (Post-Founding Individual Creator License)** | **$69 USD** one-time | **Independent creator operating a multi-release catalog.** Priced at parity with `Creator OS Full Stack` ($68.99 Notion-only bundle) and $10 below `Supplier` ($79.00 Framer template). Because the free Next.js 16 core deploys on Vercel's hobby tier with zero required secrets (`template.manifest.json:39`), the buyer avoids $180–$360/year in Framer hosting fees in year one alone. | **Proposed 14-day refund window** (`offer.facts.json:50`, draft). Processing a refund revokes the entitlement and delivery token (`410 E_REVOKED`) and ends access to future commercial kit updates (`app/kit/page.tsx:376-380`). |
| **3. Team / Studio (Up to 5 Seats & Client Reuse License)** | **$149 USD** one-time | **Small product studio or agency shipping repeatable client or multi-brand storefronts.** Uses the 6 composition studies (`lib/template-catalog.ts:18`) and standalone project exporter (`scripts/export-template-project.mjs:179`) across multiple client or internal releases. Priced $50 below SoloFoundry's `$199` all-access Framer pass (`https://www.framer.com/marketplace/templates/creator-store/`) while giving full Next.js source ownership. | **Proposed 14-day refund window** (draft) provided the studio has not published a commercial client deployment using the kit's policies or manifests. Refund revokes the studio entitlement and delivery token (`410 E_REVOKED`). |

---

## 3. Waitlist Price-Band Wording & G5 Sign-Off Rule

On `/kit` (`app/kit/page.tsx:332`), Step 2 of `WaitlistForm` (`lib/demand-capture/WaitlistForm.tsx:182`) asks the exact question from `lib/demand-capture/questions.ts:26`:

- **Prompt:** `"What would you expect something like this to cost?"`
- **Selectable bands (`lib/demand-capture/questions.ts:14-22`):**
  - `Only if free` (`free-only`)
  - `Under 25` (`under-25`)
  - `25 - 99` (`25-99` — validates the `$49` Launch and `$69` Standard tiers)
  - `100 - 299` (`100-299` — validates the `$149` Team / Studio tier)
  - `300 - 999` (`300-999`)
  - `1000+` (`over-1000`)
  - `My company would pay` (`company-pays`)

---

## 4. Motion Starter Evaluation (`frankxai/awesome-motion-design-agent-skills`) — Decision: Do Not Bundle

Inspecting all five `SKILL.md` files in `frankxai/awesome-motion-design-agent-skills` at commit `b45d60fa5b0f7b7d07331572416b80e17dcfd203` (`motion-director`, `site-motion-excellence-director`, `remotion-video-agent`, `generative-media-director`, and `web-motion-auditor`) shows that bundling them into the Creator Launch OS commercial kit would reduce buyer value rather than increase it: three of the skills (`motion-director`, `remotion-video-agent`, `web-motion-auditor`) are 33-to-38-line generic checklists with no evaluation suite or code, while the other two (`site-motion-excellence-director` and `generative-media-director`) explicitly route users to `Higgsfield` (violating the estate-wide Higgsfield ban in `TRUTH.md` §4) and reference external template/rubric paths not contained in the skill folders. Creator Launch OS already ships a working, self-cleaning GSAP and `ScrollTrigger` implementation with `prefers-reduced-motion` support (`components/home-motion.tsx`, `components/template-preview.tsx`) and two repo-specific motion specifications (`docs/GSAP-SCENE-BRIEF.md`, `docs/PREMIUM-HOME-PAGE-SPEC.md`); keeping the CC0 motion skills in their own public repository avoids diluting a focused storefront-and-fulfillment kit with unevaluated prompt checklists.
