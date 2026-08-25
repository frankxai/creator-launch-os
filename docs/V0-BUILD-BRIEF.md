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
- Motion is CSS-only, subtle, and fully removed under `prefers-reduced-motion`

## Technical boundaries

- Keep pages as Server Components unless interaction requires a Client Component
- Keep the catalog in `lib/products.ts`
- Preserve strict TypeScript and the zero-secret default deployment path
- Never expose provider secrets through `NEXT_PUBLIC_*`
- Hosted checkout URLs are optional; absent URLs must continue to show the explicit demo checkout
- Keep loading, empty, error, not-found, metadata, sitemap, robots, and health states working
- Use Lucide icons and the existing Tailwind token names
- Do not introduce a database, auth provider, payment SDK, or animation library without a separately reviewed requirement

## First v0 iteration prompt

> Review this imported repository as a senior product designer and Next.js engineer. Preserve the product contract and existing editorial design system. Improve only the weakest hierarchy, responsive behavior, and interaction details. Verify home → products → product detail → demo checkout and home → studio on mobile and desktop. Do not add features, dependencies, gradients, fake metrics, testimonials, or generic card grids. Return a concise change log and call out any production claim that is not backed by code.
