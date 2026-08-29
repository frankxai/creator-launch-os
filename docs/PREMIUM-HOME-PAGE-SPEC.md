# Creator Launch OS — premium home page specification

## Outcome

Turn the free flagship into an acquisition-grade proof of the Starlight template system without weakening its zero-secret, server-first product contract.

The first read is:

> Your work can feel singular, remain yours, and still be simple to buy.

The page should make an independent creator want to inspect the live release path, then trust the source enough to deploy or commission an implementation.

## Product truth

- The primary product artifact is the existing release console, not a fabricated analytics dashboard.
- All catalog, readiness, checkout, and transaction values remain explicitly labeled sample or demo data.
- The free repository continues to work without authentication, a database, checkout credentials, analytics, or proprietary media.
- The activation event remains `delivery_opened`; page views and checkout clicks are supporting signals.
- Hosted checkout URLs remain optional and public. Provider secrets stay outside the starter.

## Audience and conversion

Primary audience: independent creators, authors, educators, and small studios with valuable work but an undifferentiated selling surface.

Primary action: browse the sample releases.

Secondary action: inspect the operating view.

Trust action: read or deploy the public source.

Commercial bridge: the free flagship demonstrates the visual and operating quality behind paid implementation sprints and commercial template systems. It does not insert sales claims or fake social proof into the open-source product.

## Visual direction

The direction is editorial kinetic publishing: warm paper, deep mineral ink, acid readiness, coral action, and cool blue focus. Newsreader supplies human editorial contrast; Geist and Geist Mono carry the operating system.

The signature composition combines:

1. A spacious editorial headline with one italic human phrase.
2. A real release-console artifact mounted inside a dark, depth-aware stage.
3. Three semantic liquid lenses—proof, delivery, and ownership—that respond to a fine pointer without becoming a custom cursor.
4. Ruled publication layouts and oversized edition typography instead of a generic card grid.
5. Fine grain, specular borders, and controlled light falloff instead of flat gradient containers.

Liquid glass is supporting material. It may frame a real signal, control, or artifact; it must never become the product proof by itself.

## Page sequence

### 1. Signature hero

- Dark mineral stage with the value proposition and two clear actions.
- Existing release console is the hero proof asset.
- Semantic lenses identify proof, delivery, and ownership.
- A concise trust rail states zero-secret demo, MIT license, v0-ready structure, and local GSAP finish.
- No fake logos, revenue, testimonials, orbit graphics, or node networks.

### 2. Release operating narrative

- One scroll narrative explains offer → delivery → next release.
- Desktop uses a sticky proof stage and three editorial steps.
- Mobile and coarse-pointer routes become a normal document flow.
- Every step is understandable with JavaScript disabled and with motion removed.

### 3. Catalog proof

- Keep the searchable product catalog and real content density.
- Feature the first product without turning all products into identical glass cards.
- Product hover motion is restrained and never required to discover the link.

### 4. Open-source contract

- Preserve the dark template-contract section.
- Show the deployable states, transparent demo boundary, and source link.
- Do not imply production checkout, analytics, or fulfillment that the repository does not provide.

### 5. First-edition close

- End with a coral editorial action field.
- Route to the existing product-decision flow.
- Add the commercial implementation bridge only in documentation until the paid offer and fulfillment path are real.

## Asset contract

- Hero artifact: Tier C exact interface using owned code and synthetic demo data.
- Ambient lenses and grain: Tier C system treatment, subordinate to the interface.
- Optional motion-source video: Tier B owned export only after provenance, poster, compression, crop, and actual desktop/mobile inspection are recorded.
- The page must ship without external media. A missing or unsupported video must not create an empty hero.
- Do not add inline decorative SVG hero art, generic 3D primitives, stock imagery, or uninspected generated visuals.

## Responsive behavior

### Wide desktop

- Two-column hero with editorial copy and a dimensional console stage.
- Pointer lenses can translate within a tightly bounded range.
- Operating narrative may pin the artifact while the three steps advance.

### Tablet

- Preserve the two-part composition when readable; otherwise stack copy above the artifact.
- Remove pointer parallax on coarse pointers.
- Avoid edge-to-edge glass blur that creates scroll or paint cost.

### Mobile

- Single-column document flow.
- Headline remains below six short lines on a 390 px viewport.
- Lenses become static, legible signal chips around the artifact.
- No pinning, horizontal scroll, hover-only labels, or viewport-height traps.

### Reduced motion

- All content renders at its final readable state.
- Disable timelines, pinning, scrub, pointer response, animated grain, and scanning lights.
- Retain hierarchy, focus state, contrast, and semantic grouping.

## Performance and accessibility budgets

- Animate transforms and opacity only.
- One hero timeline and at most one ScrollTrigger narrative.
- GSAP code is isolated in one client boundary and cleaned up through `useGSAP()` plus `gsap.matchMedia()`.
- No layout reads inside continuous pointer handlers; use `gsap.quickTo()` and precomputed bounds.
- No custom cursor replacement.
- Maintain keyboard-visible actions, a working skip link, sentence-case interface copy, and 44 px minimum interactive targets.
- Keep the page server-rendered; only the motion wrapper hydrates.
- Any future video is muted, inline, non-essential, poster-backed, and paused for reduced motion.

## Acceptance gate

- Static composition is coherent with JavaScript disabled.
- Desktop, mobile, coarse-pointer, keyboard, and reduced-motion exports are inspected.
- Hero timeline and scroll narrative clean up on unmount and route transitions.
- No horizontal overflow at 390, 768, 1280, and 1440 px.
- Anti-slop verifier, type-check, lint, tests, production build, accessibility review, and performance review pass.
- `design-loop-evidence.json` records asset tier, provenance, screenshots, QA results, score, and final decision.
- The public Vercel URL resolves without team SSO before the manifest can claim deployment completion.
