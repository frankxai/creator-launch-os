# Component contracts

The working storefront is the component catalogue. Use `/`, `/products` and `/studio/templates` to review composition; use `/studio/atelier` for the existing interactive workbench. Source modules and `lib/products.ts` own behavior and data.

| Module | Inputs and behavior | Release contract |
| --- | --- | --- |
| `components/product-card.tsx` | `product: Product`, optional `priority`; accent is coral, acid or blue. Both links open `/products/{slug}`. Priority cards span two desktop columns. | Keep the product slug, existing price formatter and named link. The large edition glyph is decorative SVG. Preserve wrapping and visible focus on phones. |
| `components/product-explorer.tsx` | `products: Product[]`; category buttons and deferred text search intersect title, description, format and category. | `aria-pressed` reflects the selected category; the count is a polite live region. A zero-result search exposes Reset the collection, which clears both filters. No request or checkout occurs here. |
| `components/home-motion.tsx` | `children`; scoped `data-hero-*`, `data-depth` and three story panels/steps drive the existing GSAP sequence. | At reduced motion, clear visibility/transform properties and expose content immediately. Fine-pointer parallax removes listeners on cleanup. Desktop story motion uses ScrollTrigger; `matchMedia().revert()` owns teardown. |

GSAP has a concrete job in the hero and scroll story. Keep this lifecycle; adding Motion to the same surface would create two owners. Adapt colors and typography through `app/globals.css`, then regenerate source-hashed token projections.

The release suite checks three routes at 1280, 390 and 320px, automated WCAG rules, first keyboard focus, page errors, reduced-motion stability and nine decoded-pixel baselines. Existing atelier tests cover its interaction paths. A technical baseline change requires inspecting the attached rendered image and recording a replacement reference. It does not approve listing imagery.

Product-specific Figma nodes remain unmapped in `release/component-map.json`. Code is canonical until those desktop/phone nodes and parity evidence are recorded.
