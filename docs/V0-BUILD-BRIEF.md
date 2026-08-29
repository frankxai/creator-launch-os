# v0 build brief

Use this brief after importing the repository into v0. It is designed for structural iteration; use v0 Design Mode for spacing, type, and color adjustments after the flow works.

## Product

Creator Launch OS is a Next.js 16 App Router storefront and release studio for digital-product creators, authors, educators, and independent communities.

## Design direction

- Editorial operating system, not generic SaaS
- Warm paper background, near-black ink, one coral signal, one acid readiness color, and one blue focus color
- Geist for interface and mono labels; Newsreader only for editorial emphasis
- Strong ruled layouts and publication covers instead of walls of identical glass cards
- One primary action per surface
- No decorative dashboard charts, fake customer logos, fabricated revenue, emojis in UI chrome, or purple-gradient AI styling
- v0 owns static composition and stable `data-*` interaction hooks; the canonical repository owns final GSAP movement
- Motion remains understandable when removed and is fully bypassed under `prefers-reduced-motion`

## Technical boundaries

- Keep pages as Server Components unless interaction requires a Client Component
- Keep the catalog in `lib/products.ts`
- Preserve strict TypeScript and the zero-secret default deployment path
- Never expose provider secrets through `NEXT_PUBLIC_*`
- Hosted checkout URLs are optional; absent URLs must continue to show the explicit demo checkout
- Keep loading, empty, error, not-found, metadata, sitemap, robots, and health states working
- Use Lucide icons and the existing Tailwind token names
- Preserve the reviewed `HomeMotion` GSAP boundary; do not add a second animation library or move the whole page into a Client Component
- Do not introduce a database, auth provider, or payment SDK without a separately reviewed requirement

## First v0 iteration prompt

> Review this imported repository as a senior product designer and Next.js engineer. Preserve the product contract, editorial design system, `HomeMotion` boundary, and existing `data-*` motion hooks. Improve only static hierarchy, responsive composition, component variants, and interaction affordances. Verify home → products → product detail → demo checkout and home → studio on mobile and desktop. Do not author or replace GSAP code. Do not add features, dependencies, gradients, fake metrics, testimonials, generic glass-card grids, or decorative bubble fields. Return a concise change log and call out any production claim that is not backed by code.

## Canonical motion handoff

After selecting a v0 composition, pull the branch into the canonical repository and review the semantic HTML before adapting selectors. Final movement is authored locally against [`GSAP-SCENE-BRIEF.md`](GSAP-SCENE-BRIEF.md): one signature hero timeline, at most one operating narrative, transforms and opacity only, bounded fine-pointer response, `gsap.matchMedia()` routes, and cleanup through `useGSAP()`.
