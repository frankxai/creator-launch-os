# Buyer, competitive bar and PR convergence — Creator Launch OS

**Checked on:** `2026-10-24` (live HTTP 200 verification)

## Buyer and transformation (one sentence)

An independent creator with working material in scattered folders turns their source into an owned Next.js storefront and signed release edition with a working pre-launch waitlist, inspected export, and fail-closed delivery loop in one afternoon—without paying a monthly builder tax or wiring fragile webhooks by hand.

## Five closest paid alternatives (verified HTTP 200 on 2026-10-24)

*(Correction note from G3 check: an earlier search result cited `virtualbacon.com/products/supply` at $99 with a 99 Lighthouse score; live verification showed that URL returns HTTP 404, while `canvas.supply/templates/supply` is labelled Free / $79 on index and its 99 figure is an SEO score. It is replaced below by five live, HTTP-200 verified paid products.)*

| Product | URL | Price | Date checked | What reviews and buyers praise | What buyers complain about / where it stops |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Supplier — Storefront template** (gustavwf / Framer) | `https://www.framer.com/marketplace/templates/supplier/` | **$79.00** | `2026-10-24` | Editorial landing page, dynamic category filtering, and built-in waitlist and contact forms. | Requires an ongoing paid Framer hosting subscription; external checkout links only; cannot export an independent Next.js codebase or revoke delivery tokens on refund. |
| **2. Creator OS Full Stack** (Built by Josh Studio / Notion) | `https://builtbyjoshstudio.com/products/creator-os-full-stack.html` | **$68.99** ($19.99/workspace) | `2026-10-24` | Five connected Notion workspaces (Content, Business, Finance, Launch, Product) that run on free Notion with zero monthly software fees. | Internal Notion databases only—gives the creator zero public storefront, zero deployable website, zero waitlist capture endpoint, and zero webhook or delivery code. |
| **3. Digital Product OS + Creator OS** (ThatVibeCoder / Notion) | `https://www.thatvibecoder.io/products` | **$54.00** ($27 + $27) | `2026-10-24` | Built-in Notion AI prompts for drafting hooks and logging sales rows. | Requires pasting sales into Notion rows by hand; no live web storefront, no automated webhook signature verification, and no portable code artifact. |
| **4. Mention — Storefront for Notion creators** (Menphine / Framer) | `https://www.framer.com/marketplace/templates/mention/` | **$39.00** | `2026-10-24` | Clean CMS-powered template collection, bundle layouts, and blog pages for selling digital products. | Locked exclusively to Framer ("not compatible with HTML, Webflow, WordPress, or other platforms"), no refunds offered, and no server-side entitlement or delivery engine. |
| **5. Notion Creator OS** (Menphine / Notion) | `https://www.menphine.com/notion-templates/notion-creator-os` | **$29.00** ($89.00 bundle) | `2026-10-24` | Structured Notion workspace for tracking digital products, store discounts, posts, and revenue. | Back-office tracker only; includes no public storefront, no deployable code, and no customer checkout or delivery loop. |

## The one product we must beat and the dimension we beat it on

- **Product to beat:** **Supplier (`https://www.framer.com/marketplace/templates/supplier/`, $79.00)**.
- **Dimension we beat it on:** **Owned, portable Next.js 16 code + verified fulfillment and fail-closed demand capture vs. platform-locked Framer shells.** Where Supplier charges $79 for a Framer template that still requires a monthly Framer hosting plan and relies on outbound checkout links, **Creator Launch OS** gives the creator an owned MIT Next.js 16 storefront (`LICENSE:1`, `package.json:27`), a browser Monograph editor that exports standalone Next.js projects (`scripts/export-template-project.mjs:179`), the shared `@starlight/demand-capture` two-step waitlist (`app/kit/page.tsx:118`), and a convergent webhook-to-entitlement-to-refund engine (`lib/commerce/engine.ts:207-240`).

## PR convergence state (#8, #11, #15, #16, #17, #18, #19)

| PR | Branch | Action | Reason |
| :--- | :--- | :--- | :--- |
| **#8** | `codex/install-experience-20260924` | **Close** | Superseded: `/start` guided installation was reconciled into `#16`. |
| **#11** | `agent/codex/portfolio-content-20261001` | **Close** | Superseded: Monograph `/edit` workspace and standalone exporter were reconciled into `#16`. |
| **#15** | `claude/release-readiness-first-order` | **Folded into #17 & close** | Its single commit (`ed36b84`) is folded into `#17`. |
| **#16** | `agent/codex/release-integration-20261021` | **Merge (Stack base -> `main`)** | Base integration of `/start`, Monograph `/edit`, standalone exporter, and Decision Desk projection. |
| **#17** | `agent/hyperagent/sl-ha-20261023-h01` | **Merge into #16 (Converged RC)** | Contains all `#17` fixes (including `.github/workflows/*` from `849799d`), folded `#15`, `#18` and `#19`, G3 revision fixes (P1-1..P1-4, P2-1..P2-5), fail-closed waitlist, and G0–G5 documentation. |
| **#18** | `agent/hyperagent/sl-ha-20261023-h04` | **Closed as folded into #17** | All commerce and waitlist commits are folded into `#17`. |
| **#19** | `agent/hyperagent/sl-ha-20261024-g5-and-copy` | **Closed as folded into #17** | G5 evidence pack and final launch copy are folded into `#17` after the G3 push hold lifted. |
