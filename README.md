# Creator Launch OS

[![Template CI](https://github.com/frankxai/creator-launch-os/actions/workflows/ci.yml/badge.svg)](https://github.com/frankxai/creator-launch-os/actions/workflows/ci.yml)

A free, deployable storefront and release studio for independent creators. Built with Next.js 16, TypeScript, Tailwind CSS 4, GSAP, and the App Router.

Creator Launch OS is designed around one complete customer path:

`Discover → Understand → Choose → Checkout handoff → Delivery`

The repository also includes a sample `/studio` route so the public storefront and the operating work behind it stay connected.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrankxai%2Fcreator-launch-os&project-name=creator-launch-os&repository-name=creator-launch-os)

No environment variables are required. Vercel supplies the project production domain automatically. Without checkout URLs, the template uses an explicit demo checkout and never pretends to take payment.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Make it yours

1. Replace the releases in `lib/products.ts`.
2. Update the brand in `lib/site.ts`; set `NEXT_PUBLIC_SITE_URL` only for a custom canonical domain and `NEXT_PUBLIC_CONTACT_EMAIL` only for a real public inbox.
3. Add HTTPS hosted checkout URLs using `.env.example` as the contract.
4. Replace the sample studio metrics with your real, privacy-safe operating data.
5. Run `pnpm verify` before publishing.

HTTPS checkout URLs without embedded credentials may be used in `NEXT_PUBLIC_CHECKOUT_*_URL`. Invalid values fall back to the no-payment preview. Provider API keys, webhook secrets, customer records, and fulfillment credentials must remain server-side and are intentionally outside this free starter.

## Work with v0

Import the GitHub repository using v0 Git Import, which creates its own branch for changes. Then paste the reviewed prompt from [`docs/V0-BUILD-BRIEF.md`](docs/V0-BUILD-BRIEF.md). Use prompts for structural changes and Design Mode for visual adjustments.

The repository includes `components.json`, explicit design tokens, real sample density, and small Client Component boundaries so v0 can iterate without replacing the product architecture. v0 owns static hierarchy, responsive composition, component variants, and interaction hooks. Final movement stays in the canonical repository through `HomeMotion`, one hero timeline, and one operating narrative.

Read [`docs/PREMIUM-HOME-PAGE-SPEC.md`](docs/PREMIUM-HOME-PAGE-SPEC.md) before changing the composition and [`docs/GSAP-SCENE-BRIEF.md`](docs/GSAP-SCENE-BRIEF.md) before changing motion. Both mobile and `prefers-reduced-motion` routes are product requirements.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Editorial storefront and template explanation |
| `/products` | Searchable product catalog |
| `/products/[slug]` | Product decision page |
| `/checkout/[slug]` | Safe no-payment fallback when checkout is not configured |
| `/studio` | Clearly labeled sample operating view |
| `/api/health` | Deployment health response |

## Verification

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

The release receipt is tracked in `template.manifest.json`. A maturity label is a claim: update it only when the corresponding checks have passed.

## Delivery package

Run `pnpm package:release` from a clean commit to create a versioned source ZIP, SHA-256 checksums and an exact-commit receipt. See [release packaging](docs/RELEASE-PACKAGING.md) for reproduction and review. Template CI also makes this package available as a downloadable workflow artifact.

## License

MIT. Use it for personal or commercial projects. Attribution is appreciated but not required.
