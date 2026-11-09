# Merchant integration guide

The storefront's commerce adapter is merchant-agnostic. A merchant adapter does two things only: verify the merchant's webhook signature, and translate the merchant's payload into one normalized event. Orders, entitlements, delivery links, refunds and reconciliation are shared code in `lib/commerce/engine.ts`.

## The normalized event

```json
{
  "id": "merchant event id",
  "type": "order.paid | order.refunded",
  "merchant": "your-merchant-id",
  "orderId": "merchant order id",
  "sku": "your sku_id from offer.facts.json",
  "amount": 0,
  "currency": "USD",
  "email": "buyer@example.com",
  "occurredAt": "ISO 8601 timestamp",
  "test": false
}
```

`amount` is in the currency's smallest unit, exactly as the merchant reports it.

## Environment

| Variable | Where | Notes |
| --- | --- | --- |
| `COMMERCE_MODE` | server | `off` (default), `test` or `live` |
| `COMMERCE_MERCHANT` | server | `fixture` in test mode; your merchant id in live mode |
| `COMMERCE_WEBHOOK_SECRET` | server | 32+ characters; the merchant's signing secret in live mode |
| `COMMERCE_DELIVERY_SECRET` | server | 32+ characters; signs delivery links; generate it yourself |
| `NEXT_PUBLIC_KIT_CHECKOUT_URL` | public | Hosted HTTPS checkout link; live mode only |

Secrets live in your host's encrypted environment settings, never in the repository and never in a `NEXT_PUBLIC_` variable.

## Rehearsal

1. `pnpm build`
2. Start with test settings: `COMMERCE_MODE=test COMMERCE_MERCHANT=fixture COMMERCE_WEBHOOK_SECRET=<32+ chars> COMMERCE_DELIVERY_SECRET=<32+ chars> pnpm start`
3. In another terminal: `COMMERCE_WEBHOOK_SECRET=<same> node scripts/commerce-rehearsal.mjs http://localhost:3000`
4. The script posts the paid fixture, opens the delivery link, posts the refund and confirms the link is revoked. It prints a receipt.

Test mode is refused on a production deployment.

## Adding a live adapter

1. Read the merchant's current webhook documentation. Do not work from memory: signature headers and payload shapes change.
2. Add an entry to `adapters` in `lib/commerce/config.ts` with `mode: "live"`.
3. Verify the signature exactly as the merchant documents it, over the raw request body.
4. Map the merchant's paid and refunded events to the normalized event. Ignore everything else with a 200 response so the merchant stops retrying.
5. Add a contract test with a recorded, redacted merchant payload for each event type.
6. Replace the in-memory store with durable storage before live mode handles a real order. The durable store must make every put an idempotent upsert, record each (activity name, order) at most once under a unique key, and persist `markEvent` only after the writes it guards. The engine marks events last so a retry after a failed write finishes the job; a store that reorders or batches these writes reintroduces lost or retained access. `tests/commerce-recovery.test.mjs` exercises the in-memory store only; port its failure-injection cases (fail each write once, then retry the same event) to your durable store adapter and pass them before going live.

## What a merchant of record changes

A merchant of record collects tax and handles disputes, and some also host the file delivery. If yours hosts delivery, the storefront's delivery link becomes a second path; keep entitlement records anyway so refunds and reconciliation stay checkable.

Out-of-order and conflicting events: the engine records a refund that arrives before its payment so that payment never grants access, and rejects a payment that reuses an order id with a different buyer, SKU, amount or currency (HTTP 409). Confirm how the chosen merchant retries 4xx responses and route a 409 to a human.
