# G5 Price Evidence Pack — Creator Launch OS (`sku_creator_launch_os_v1`)

- **Gate:** `PRODUCT-RELEASE-GATE.md` G5 (Price integrity — sovereign gate; prepared by agent, decided and signed by Frank Riemer)
- **Status:** `PREPARED_FOR_OWNER_DECISION` (`offer.facts.json` retains `price.state: "decision_required", amount: null`; checkout remains off)
- **Date prepared:** `2026-10-24`

---

## 1. Competitive Price Benchmark (Checked `2026-10-23`)

| Paid Alternative | URL | Price | What the Buyer Gets | Where Creator Launch OS Delivers Higher Value |
| :--- | :--- | :--- | :--- | :--- |
| **1. Supply** (VirtualBacon / Framer) | `https://virtualbacon.com/products/supply` | **$99.00** | Framer storefront template with 4 CMS collections and outbound Lemon Squeezy links. | Saves the buyer a recurring Framer hosting subscription ($15–$30/mo); delivers owned Next.js 16 source (`package.json:27`), a standalone Monograph exporter (`scripts/export-template-project.mjs:179`), a two-step waitlist (`app/kit/page.tsx:118`), and a server-side webhook/entitlement/refund loop (`lib/commerce/engine.ts:200`). |
| **2. Supplier** (gustavwf / Framer) | `https://www.framer.com/marketplace/templates/supplier/` | **$79.00** | Framer landing page and catalog with external checkout links and waitlist form. | Gives the buyer portable code (`LICENSE:1`), an interactive browser editor with multi-step undo (`components/portfolio-workspace.tsx:45`), and signed delivery links that revoke on refund (`lib/commerce/engine.ts:335`). |
| **3. Creator OS Full Stack** (Built by Josh Studio / Notion) | `https://builtbyjoshstudio.com/products/creator-os-full-stack.html` | **$68.99** | Five internal Notion workspaces (Content, Business, Finance, Launch, Product). | Notion workspaces have no public web storefront or fulfillment endpoints. Creator Launch OS provides the public Next.js storefront (`app/page.tsx`), release studio (`app/studio/page.tsx`), and webhook/delivery routes (`app/api/commerce/webhook/route.ts:10`). |
| **4. TemplateShop** (Darinka / Framplates) | `https://framplates.com/templateshop` | **$59.00** | Framer template with category filters and outbound payment links. | Eliminates Framer platform lock-in and includes 6 editable composition studies (`lib/template-catalog.ts:18`) plus the launch playbook, manifest pack, and policy templates (`offer.facts.json`). |
| **5. Digital Product OS + Creator OS** (ThatVibeCoder / Notion) | `https://www.thatvibecoder.io/products` | **$54.00** | Two Notion trackers with built-in AI prompts for hooks and manual sales logging. | Replaces manual row pasting with HMAC-verified webhook ingestion, convergent retry recovery (`lib/commerce/engine.ts:200`), and automated buyer data export (`lib/commerce/engine.ts`). |

---

## 2. Three Proposed Price Points for Frank's G5 Decision

Until Frank signs off and locks `offer.facts.json`, `/kit` shows no price and no buy button (`app/kit/page.tsx:118`).

| Tier | Proposed Price | Target Buyer & Value Logic | Refund Policy & Revocation |
| :--- | :--- | :--- | :--- |
| **1. Launch (Founding Cohort — First 100 on Waitlist)** | **$49 USD** one-time | **Solo creator launching their first owned product page.** Priced below all five paid alternatives ($54–$99) while delivering the 6-part commercial kit (`commercial/kit/kit.manifest.json`): launch playbook, manifest pack, merchant integration guide, fulfillment runbook, refund/support policy templates, and telemetry schema. Rewards the first 100 waitlist signups (`data/products.graph.json`) with a real founding price lock rather than a discount code. | **14-day no-reason refund** (`offer.facts.json`, `commercial/policies/REFUND-POLICY.md`). When `order.refunded` arrives, `applyEvent` marks the order `refunded`, sets the entitlement to `revoked` (`lib/commerce/engine.ts:245-252`), and causes the delivery link to return `410 E_REVOKED` (`lib/commerce/engine.ts:335`). |
| **2. Standard (Post-Founding Individual Creator License)** | **$69 USD** one-time | **Independent creator operating a multi-release catalog.** Priced at parity with `Creator OS Full Stack` ($68.99 Notion-only bundle) and $10–$30 below `Supplier` ($79) and `Supply` ($99) Framer templates. Because the free Next.js 16 core deploys on Vercel's hobby tier with zero required secrets (`template.manifest.json:39`), the buyer avoids $180–$360/year in Framer hosting fees in year one alone. | **14-day no-reason refund** (`offer.facts.json`). A refund revokes the entitlement and delivery token (`410 E_REVOKED`) and ends access to future commercial kit updates (`app/kit/page.tsx:136`). |
| **3. Team / Studio (Up to 5 Seats & Client Reuse License)** | **$149 USD** one-time | **Small product studio or agency shipping repeatable client or multi-brand storefronts.** Uses the 6 composition studies (`lib/template-catalog.ts:18`) and standalone project exporter (`scripts/export-template-project.mjs:179`) across multiple client or internal releases. Priced $50 below SoloFoundry's `$199` all-access Framer pass (`https://www.framer.com/marketplace/templates/creator-store/`) while giving full Next.js source ownership. | **14-day no-reason refund** provided the studio has not published a commercial client deployment using the kit's policies or manifests. Refund revokes the studio entitlement and delivery token (`410 E_REVOKED`). |

---

## 3. Waitlist Price-Band Wording & G5 Sign-Off Rule

On `/kit` (`app/kit/page.tsx:118`), Step 2 of `WaitlistForm` (`lib/demand-capture/WaitlistForm.tsx:182`) asks the exact question from `lib/demand-capture/questions.ts:26`:

- **Prompt:** `"What would you expect something like this to cost?"`
- **Selectable bands (`lib/demand-capture/questions.ts:14-22`):**
  - `Only if free` (`free-only`)
  - `Under 25` (`under-25`)
  - `25 - 99` (`25-99` — validates the `$49` Launch and `$69` Standard tiers)
  - `100 - 299` (`100-299` — validates the `$149` Team / Studio tier)
  - `300 - 999` (`300-999`)
  - `1000+` (`over-1000`)
  - `My company would pay` (`company-pays`)
- **G5 ratification rule:** Run `node packages/demand-capture/report.mjs creator-launch-os` once the waitlist collects initial signals. When `25-99` and `100-299` account for the majority of non-free responses from `Independent creator`, `Founder / solo operator`, and `Small studio` signups, Frank signs the G5 paragraph below and sets `price.state: "locked"` in `offer.facts.json`.

---

## 4. Motion Starter Evaluation (`frankxai/awesome-motion-design-agent-skills`) — Decision: Do Not Bundle

Inspecting all five `SKILL.md` files in `frankxai/awesome-motion-design-agent-skills` at commit `b45d60fa5b0f7b7d07331572416b80e17dcfd203` (`motion-director`, `site-motion-excellence-director`, `remotion-video-agent`, `generative-media-director`, and `web-motion-auditor`) shows that bundling them into the Creator Launch OS commercial kit would reduce buyer value rather than increase it: three of the skills (`motion-director`, `remotion-video-agent`, `web-motion-auditor`) are 33-to-38-line generic checklists with no evaluation suite or code, while the other two (`site-motion-excellence-director` and `generative-media-director`) explicitly route users to `Higgsfield` (violating the estate-wide Higgsfield ban in `TRUTH.md` §4) and reference external template/rubric paths not contained in the skill folders. Creator Launch OS already ships a working, self-cleaning GSAP and `ScrollTrigger` implementation with `prefers-reduced-motion` support (`components/home-motion.tsx`, `components/template-preview.tsx`) and two repo-specific motion specifications (`docs/GSAP-SCENE-BRIEF.md`, `docs/PREMIUM-HOME-PAGE-SPEC.md`); keeping the CC0 motion skills in their own public repository avoids diluting a focused storefront-and-fulfillment kit with unevaluated prompt checklists.
