# Refund policy — Commercial Kit (DRAFT)

> State: draft. The window below matches `offer.facts.json` (`refund.window_days`).
> The owner approves the final wording and window before checkout opens.

- **Window.** Ask within 14 days of purchase for a full refund. No reason required.
- **How.** Reply to the purchase receipt or write to the support channel named on the receipt. Include the order number.
- **Speed.** The refund is issued through the same merchant that took the payment, within 3 business days of the request. The merchant decides when the money reaches the card or account.
- **What happens to access.** The refund revokes the order's entitlement. Delivery links stop working and future kit updates stop. Files already downloaded are covered by the license's refund clause.
- **After 14 days.** Refunds are case by case; a duplicate charge or a delivery we could not complete is always refunded.
- **Chargebacks.** Please ask us first. A refund is faster for you than a dispute.

## Operator steps

1. Find the order in the merchant dashboard by order number or email.
2. Issue the refund in the merchant dashboard. Never refund outside the merchant.
3. Confirm the merchant's refund webhook reached the storefront: the order shows `refunded` and the entitlement shows `revoked` (see `commercial/kit/04-fulfillment-runbook.md`).
4. Reply to the buyer with the refund confirmation. Log the reason, if the buyer gave one, for the monthly review.
