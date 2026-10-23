# Fulfillment and reconciliation runbook

## The loop

| Step | Trigger | Storefront record | Buyer sees |
| --- | --- | --- | --- |
| Order | Merchant `paid` webhook | order `paid`, entitlement `active` | Merchant receipt |
| Delivery | Buyer opens signed link | activity `delivery_opened` | Kit download |
| Refund | Merchant `refunded` webhook | order `refunded`, entitlement `revoked` | Refund confirmation; link stops working |

Replayed webhooks are ignored by event id. A late payment for a refunded order never restores access.

## Daily (while launching)

- Compare the merchant's order count with the storefront's paid orders.
- Any paid order without `delivery_opened` after 48 hours: send the buyer a fresh delivery link.

## Monthly

1. Export merchant payouts for the month.
2. Run reconciliation for live orders only. Test orders are never included in live totals.
3. Net per currency must match the merchant's gross sales minus refunds. Fees are reconciled separately against the payout.
4. Record: visitors, activations (`delivery_opened`), paid orders, refunds, repeat buyers, net revenue.

## Buyer data requests

`exportBuyerData(store, email)` returns every order, entitlement and activity held for one email. Send it within 30 days of a request. Deletion requests remove the storefront records; the merchant keeps its own records under its own policy.

## Incidents

- **Webhook signature failures spike:** the secret was rotated or a request is forged. Do not disable verification. Rotate the secret on both sides.
- **Delivery storage down:** pause checkout; the stop rule applies.
- **Refund webhook missed:** refund in the merchant, then replay the merchant's event from its dashboard.
