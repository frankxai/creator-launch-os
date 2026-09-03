<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Product studio contract

- Treat this as a multi-product storefront and operating template, not a one-off single-product site.
- Read product.manifest.yaml, marketplace.listing.yaml, docs/PRODUCT-CONTRACT.md and docs/DISTRIBUTION-AND-MONETIZATION.md before release work.
- Keep the free MIT boundary honest. Do not imply payments, entitlements, customer data, automation or platform publication that has not been implemented and verified.
- One canonical listing manifest may produce channel-specific copy; title, promise, version, price state, license and evidence may not drift.
- Follow docs/media/media-policy.md. Use immutable approved renditions, real screenshots and explicit sample labels.
- Public listing submission, price changes, spend, production promotion and rights assertions require explicit authorization.
