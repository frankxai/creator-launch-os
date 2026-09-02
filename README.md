# Creator Launch OS

[![Template CI](https://github.com/frankxai/creator-launch-os/actions/workflows/ci.yml/badge.svg)](https://github.com/frankxai/creator-launch-os/actions/workflows/ci.yml)

A free, deployable storefront and release studio for independent creators. Built with Next.js 16, TypeScript, Tailwind CSS 4, GSAP, and the App Router.

Creator Launch OS is designed around one complete customer path:

`Discover → Understand → Choose → Checkout handoff → Delivery`

The repository also includes a sample `/studio` route so the public storefront and the operating work behind it stay connected.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrankxai%2Fcreator-launch-os&project-name=creator-launch-os&repository-name=creator-launch-os)

No environment variables are required. Vercel supplies the project production domain automatically. Until you supply a price and a hosted checkout URL, every product renders as "not for sale yet" — the template never draws a buy button that leads nowhere.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Make it yours

The whole storefront is one file: [`storefront.config.json`](storefront.config.json), validated against **Storefront.v1**.

1. Replace the releases, products, delivery, and proofs in `storefront.config.json`.
2. Update the brand in `lib/site.ts`; set `NEXT_PUBLIC_SITE_URL` only for a custom canonical domain and `NEXT_PUBLIC_CONTACT_EMAIL` only for a real public inbox.
3. Replace the sample studio metrics with numbers you can point at an instrument for.
4. Validate, then deploy:

```bash
node bin/validate-storefront.mjs      # or: pnpm validate:storefront
pnpm verify
```

### Storefront.v1

Eight node types — **Release, Product, Price, CheckoutHandoff, Delivery, Proof, Campaign, StudioMetric**. Every node carries a `meta` block: `owner`, `provenance`, `version`, `visibility`, `evaluation`. Provenance is the difference between a number you measured and a number you wrote, and the storefront prints it.

The validator refuses the four ways a template like this usually starts lying:

| Rule | Why |
| --- | --- |
| `E_PRICE_WITHOUT_RAIL` | A price with no checkout rail is a promise the page cannot keep. Leave `price: null` and the page says "not for sale yet". |
| `E_RAIL_WITHOUT_PRICE` | A live rail with no price sends the buyer to a number they never saw. |
| `E_AFFILIATE_WITHOUT_DISCLOSURE` | An affiliate link must ship with a disclosure a reader will understand. The schema will not accept "ad". |
| `E_UNEVIDENCED_PROOF` / `E_SAMPLE_METRIC_UNLABELED` | A proof needs an https link anyone can open; a sample metric must say so in the label a reader sees. |

Checkout URLs must be https and must not carry credentials. Provider API keys, webhook secrets, customer records, and fulfillment credentials belong nowhere in this repository — `storefront.config.json` is a public file.

### Preview without installing anything

`pnpm install && pnpm dev` is the normal path. To check a config without a toolchain:

```bash
node bin/validate-storefront.mjs storefront.config.json
```

That runs on plain Node with zero dependencies and tells you exactly which node is wrong.

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
| `/checkout/[slug]` | Checkout handoff: the rail a buyer leaves through, or why the product is not for sale yet |
| `/studio` | Clearly labeled sample operating view |
| `/api/health` | Deployment health response |

## Verification

```bash
pnpm validate:storefront
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

The release receipt is tracked in `template.manifest.json`. A maturity label is a claim: update it only when the corresponding checks have passed.

## License

MIT. Use it for personal or commercial projects. Attribution is appreciated but not required.
