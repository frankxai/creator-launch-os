# Launch playbook: fresh clone to first paid order

Each step ends with evidence you can point to. Do not start the next step without it.

## 1. Deploy the free core untouched

- Clone, `pnpm install --frozen-lockfile`, `pnpm verify`.
- Deploy to a preview with no environment variables.
- **Evidence:** the preview URL loads `/`, `/products`, `/kit` and `/api/health`, and `/kit` says "Available soon".

## 2. Write one set of facts

- Fill `offer.facts.json`: title, promise, version, what is included and excluded, refund window, support channels.
- Leave `price.state` as `decision_required` and `price.amount` as `null`.
- Run `node scripts/check-offer-facts.mjs`. It fails when a manifest or listing disagrees with the facts.
- **Evidence:** the check passes.

## 3. Replace the sample catalog

- Replace the sample products with your own. Keep every "sample" label until the content is real.
- **Evidence:** no sample product remains, or each one is visibly labeled.

## 4. Decide four things in one sitting

| Decision | Why it blocks |
| --- | --- |
| Price | Nothing can be shown or charged without it |
| Merchant (one) | The live adapter, fees, tax handling and refunds depend on it |
| Delivery storage | Paid files need private storage that only signed links can open |
| Support inbox | The receipt must name where a buyer asks for help |

Record each decision with a date. Then set `price.state` to `locked` and fill `price.amount`.

## 5. Rehearse in test mode

- Follow `03-merchant-integration-guide.md`, section "Rehearsal".
- **Evidence:** a rehearsal receipt that says `TEST_REHEARSAL_PASSED_NOT_A_SALE`, with paid → delivered → refunded → revoked.

## 6. One authorized real order

- Switch to live mode on a preview, buy your own product with a real card, open the delivery, refund it.
- **Evidence:** merchant receipt, delivery opened, refund confirmation, reconciliation showing net zero.

## 7. Open checkout

- Promote to production only after step 6 passes on the same commit.
- **Evidence:** the commit, the deployment and a smoke check of `/kit` showing the buy control.

## Stop rule

If checkout, delivery, refund or support cannot be shown end to end, close checkout and fix the loop before selling again.
