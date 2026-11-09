# Creator Launch OS — Commercial Kit

The free core gives you a storefront that deploys. This kit is the operating layer around it: what to decide, in what order, and how to prove a sale works before you take real money.

## Start here (about 60 minutes)

1. Read `01-launch-playbook.md` end to end.
2. Copy `02-manifest-pack/offer.facts.template.json` to your repository root as `offer.facts.json` and fill in your product.
3. Run the commerce rehearsal from `03-merchant-integration-guide.md` in test mode.

Your first useful result: a test-mode receipt showing order → entitlement → delivery → refund for your own product, with no money moved.

## Contents

| File | Use it to |
| --- | --- |
| `01-launch-playbook.md` | Go from a fresh clone to a first paid order |
| `02-manifest-pack/` | Keep one set of facts across your site, manifests and listings |
| `03-merchant-integration-guide.md` | Connect one merchant to the commerce adapter |
| `04-fulfillment-runbook.md` | Run orders, delivery, refunds and monthly reconciliation |
| `05-policy-templates/` | Publish a refund and support policy |
| `06-funnel-telemetry.schema.json` | Count visitors, activations, orders, refunds and repeat buyers |

## License

Commercial terms: see `LICENSE-DRAFT.md` in the parent folder until final terms ship with your download.
