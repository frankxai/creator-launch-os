# Release readiness — Creator Launch OS, first paid order

SKU `sku_creator_launch_os_v1` · product `product_creator_launch_os` · state `release_candidate` · price `decision_required`
Proof gate: `complete_checkout_delivery_activation_receipt` · Lane: six-gate first-dollar lane for Tier 1 SKUs (agentic-ops `docs/proposals/operating-reset-2026-10.md`).

Updated 2026-10-21. **PASS** = evidence in this repository. **GAP** = was open, closed by this change. **BLOCKED** = needs the owner or an external party; nothing an agent may do.

## Gates

| # | Gate | Status | Evidence | Owner |
| --- | --- | --- | --- | --- |
| 1 | Authority | PASS | `frankxai/creator-launch-os` is canonical (`GenCreator-ai/creator-launch-os` is a read-only mirror). Brand, SKU and canonical offer URL are fixed in `offer.facts.json`; `template.manifest.json` keeps `sourceRepository` on frankxai. | FrankX |
| 1a | Go-live approval | BLOCKED | Production promotion of `/kit` with a buy control needs explicit owner approval. | FrankX |
| 2 | Customer value | GAP → closed | Free core and Commercial Kit contents defined in `offer.facts.json` and rendered on `/kit`. Kit first useful result defined in `commercial/kit/README.md` (test-mode rehearsal receipt for the buyer's own product, about 60 minutes). No buyer feedback exists yet and none is claimed. | Agent (done); FrankX for a cold read by one target buyer |
| 3 | Editorial | PASS (self-review) | `/kit`, kit docs and policies scanned for stock hype phrases and partner references: none. No price, metric or testimonial is rendered. Independent voice review has no eval suite yet. | Agent; GenCreator voice guardian optional |
| 4 | Rights and provenance | GAP → closed; terms BLOCKED | Inventory in `docs/release/RIGHTS-AND-PROVENANCE.md`. Open: licensor entity and governing law for `commercial/LICENSE-DRAFT.md`, GSAP Standard license fit for a paid product, font licenses for listing media, public vs private kit source. | FrankX (legal) |
| 5 | Commerce and fulfillment loop | Test PASS · Live BLOCKED | Merchant-agnostic adapter `lib/commerce/`. Fixture loop order → entitlement → delivery → refund → revoke, replay, forgery, mode-mismatch and expiry cases: `tests/commerce-loop.test.mjs`. Same loop over HTTP against `next start`: `scripts/commerce-rehearsal.mjs` (receipt in PR). Unconfigured deployment: `/kit` shows "Available soon" and both commerce routes return 503 (`tests/browser/kit.spec.mjs`). Live needs: price lock, one merchant, its verified webhook adapter, a durable store, private delivery storage, one authorized real order. | FrankX (decisions); agent (adapter once the merchant is named) |
| 6 | Refund path | Mechanism PASS · Policy BLOCKED | Refund revokes the entitlement and the delivery link (tested); a late payment never restores access. Policy draft `commercial/policies/REFUND-POLICY.md` (14-day window, stated once in `offer.facts.json`). Needs owner approval and a real refund through the chosen merchant. | FrankX |

## Supporting checks

| Check | Status | Evidence |
| --- | --- | --- |
| Free core deploys from a fresh clone | PASS | Fresh clone of this branch, `pnpm install --frozen-lockfile`, `pnpm verify` with no environment variables (see PR). |
| One set of facts | PASS | `offer.facts.json`; `pnpm check:offer` and `tests/offer-facts.test.mjs` fail on drift in the product, listing, template or package manifests. |
| Paid contents packaged | PASS | `commercial/kit/kit.manifest.json`; `pnpm package:kit` builds a ZIP plus receipt (`PACKAGED_NOT_RELEASED`) and refuses unlisted kit files. `tests/kit-package.test.mjs` keeps `commercial/` out of the MIT package. |
| Support boundary | Draft | `commercial/policies/SUPPORT-POLICY.md`. Kit support inbox is undecided. |
| UI evidence | PASS | `/kit` at 375, 768 and 1440 in `docs/release/evidence/`. |

## Owner decisions, in the order they unblock

1. **Lock the price** (`dec_price_creator_launch_os`): set `price.state: locked` and `price.amount` in `offer.facts.json`; manifests follow via `pnpm check:offer`.
2. **Pick one merchant**: the agent then adds its live adapter from the merchant's current webhook docs, with recorded test payloads.
3. **Pick delivery storage and the durable store** for entitlements (decided stack: Vercel Blob private, Supabase Postgres). Creating either is an account action for the owner.
4. **Kit source visibility**: public open-core bundle or private delivery repository (`commercial/README.md`).
5. **Approve terms and policies**: licensor entity, `LICENSE-DRAFT.md`, refund window, support inbox and response time.
6. **Authorize one real order** on a preview: buy, open, refund, reconcile. Its receipt satisfies the proof gate.
7. **Approve go-live**: production promotion and the first listing channel.

## Stop rule

`product.manifest.yaml`: pause the paid extension if checkout, delivery or support cannot be proven end to end.
