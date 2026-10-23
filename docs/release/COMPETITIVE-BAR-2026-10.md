# Buyer, competitive bar and PR convergence — Creator Launch OS

**Checked on:** `2026-10-23`

## Buyer and transformation (one sentence)

An independent creator with working material in scattered folders turns their source into an owned Next.js storefront and signed release edition with a working pre-launch waitlist, inspected export, and fail-closed delivery loop in one afternoon—without paying a monthly builder tax or wiring fragile webhooks by hand.

## Five closest paid alternatives (checked 2026-10-23 via ExaSearch)

| Product | URL | Price | Date checked | What reviews and buyers praise | What buyers complain about / where it stops |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Supply — Digital store template** (VirtualBacon / Framer) | `https://virtualbacon.com/products/supply` | **$99.00** | `2026-10-23` | Clean light/dark storefront layout, 99 Lighthouse score, 4 CMS collections, and Lemon Squeezy checkout links. | Locked to a paid Framer hosting subscription and outbound links; zero code ownership, no server-side entitlement or refund revocation engine, no standalone project exporter, and no two-step demand-capture waitlist. |
| **2. Supplier — Storefront template** (gustavwf / Framer) | `https://www.framer.com/marketplace/templates/supplier/` | **$79.00** | `2026-10-23` | Editorial landing page, dynamic category filtering, and built-in waitlist/contact forms. | Requires ongoing Framer subscription; external checkout handoff only; cannot export an independent Next.js codebase or verify delivery tokens after a refund. |
| **3. Creator OS Full Stack** (Built by Josh Studio / Notion) | `https://builtbyjoshstudio.com/products/creator-os-full-stack.html` | **$68.99** ($19.99/module) | `2026-10-23` | Five connected Notion workspaces (Content, Business, Finance, Launch, Product) that work on free Notion with zero monthly software fees. | Internal Notion databases only—gives the creator zero public storefront, zero deployable website, zero waitlist capture endpoint, and zero webhook or delivery code. |
| **4. TemplateShop** (Darinka / Framplates) | `https://framplates.com/templateshop` | **$59.00** | `2026-10-23` | Fast setup for selling templates and digital goods with pre-written copy and category filters. | Framer-only lock-in, static outbound links to Stripe/Polar/Lemon Squeezy, no post-purchase entitlement store, no buyer data export, and no multi-direction studio editor. |
| **5. Digital Product OS + Creator OS** (ThatVibeCoder / Notion) | `https://www.thatvibecoder.io/products` | **$54.00** ($27 + $27) | `2026-10-23` | Built-in Notion AI prompts for drafting hooks and logging sales rows. | Requires pasting sales into Notion rows by hand; no live web storefront, no automated webhook signature verification, and no portable code artifact. |

## The one product we must beat and the dimension we beat it on

- **Product to beat:** **Supply (`https://virtualbacon.com/products/supply`, $99)**.
- **Dimension we beat it on:** **Owned, portable Next.js 16 code + verified fulfillment and demand-capture vs. platform-locked Framer shells.** Where Supply charges $99 for a Framer template that still requires a monthly Framer subscription and relies on unverified outbound checkout links, **Creator Launch OS** gives the creator an owned MIT Next.js 16 storefront, a browser Monograph editor that exports standalone Next.js projects, the shared `@starlight/demand-capture` two-step waitlist, and a convergent webhook-to-entitlement-to-refund engine verified by deterministic contract tests.

## PR convergence plan (#8, #11, #15, #16, #17, #18)

| PR | Branch | Action | Reason |
| :--- | :--- | :--- | :--- |
| **#8** | `codex/install-experience-20260924` | **Close** | Superseded: its `/start` guided installation work was three-way reconciled into `#16`. |
| **#11** | `agent/codex/portfolio-content-20261001` | **Close** | Superseded: its Monograph `/edit` workspace and standalone exporter were three-way reconciled into `#16`. |
| **#15** | `claude/release-readiness-first-order` | **Fold into #18 & close** | Branched off `main` in parallel with `#16` and conflicted on 6 files (`README.md`, `app/sitemap.ts`, `components/site-footer.tsx`, `package.json`, `release/package-manifest.json`, `template.manifest.json`). Its single commit (`ed36b84`) is now folded cleanly into `#18` on top of `#17`. |
| **#16** | `agent/codex/release-integration-20261021` | **Merge (Stack base -> `main`)** | Base integration of `/start`, Monograph `/edit`, standalone exporter, and Decision Desk projection. |
| **#17** | `agent/hyperagent/sl-ha-20261023-h01` | **Merge into #16 (Stack layer 2)** | Fixes `#16`'s Decision Desk 404 link, excludes internal research from the buyer ZIP, and adds the undo stack + `beforeunload` guard. (Requires applying `creator-launch-os-h01-workflows-only.patch` from an account with `.github/workflows` permission.) |
| **#18** | `agent/hyperagent/sl-ha-20261023-h04` | **Merge into #17 (Stack top — converged RC)** | Re-targeted onto `#17`. Folds `#15` + all `#18` webhook retry/tombstone/409/isolation fixes + the shared `packages/demand-capture` waitlist on `/kit` and `/api/waitlist` + GenCreator sentence-case copy and `.vis.provenance.json` image sidecars. |
