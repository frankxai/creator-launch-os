# Creator Launch OS — GSAP scene brief

## Division of labor

v0 may explore information architecture, static composition, responsive structure, component variants, and stable interaction hooks. The canonical repository owns final motion. Generated configuration that ignores TypeScript errors, disables image optimization, expands the dependency graph without purpose, or obscures the zero-secret path must not be imported.

The motion budget is one signature hero timeline and one ScrollTrigger narrative.

## Runtime boundary

`HomeMotion` is the only home-page motion client boundary. The page remains a Server Component and passes rendered children through the boundary. GSAP, `@gsap/react`, and ScrollTrigger are imported only there.

The component must:

- register `useGSAP` and ScrollTrigger once;
- scope selectors to its root element;
- use `gsap.matchMedia()` for desktop, mobile/coarse-pointer, and reduced-motion routes;
- remove pointer listeners and revert media-query contexts during cleanup;
- leave all content visible when JavaScript is unavailable.

## Scene 01 — signature hero timeline

Purpose: move the visitor from editorial promise to tangible proof in one controlled reveal.

Sequence:

1. Eyebrow and headline lines resolve from `yPercent: 22` and opacity 0.
2. Supporting copy and actions follow with a short overlap.
3. The release-console stage settles from a small `y`, rotation, and scale offset.
4. Proof, delivery, and ownership lenses enter from their nearest stage edges.
5. The trust rail completes the sequence.

Constraints:

- transforms and opacity only;
- no looping timeline;
- approximately 1.4 seconds total on desktop and 0.8 seconds on mobile;
- final state is the CSS default, so motion enhancement cannot hide content permanently;
- reduced motion skips the timeline and clears transform/opacity props.

## Fine-pointer response

The hero stage listens for pointer movement only when both `pointer: fine` and `prefers-reduced-motion: no-preference` match.

- Use `gsap.quickTo()` for bounded x/y translation of the three semantic lenses.
- Keep translation within 6–18 px depending on lens depth.
- Do not hide the operating-system cursor or attach movement to the document body.
- Reset the lenses to zero on pointer leave.
- The response conveys optical depth; it does not unlock information.

## Scene 02 — release operating narrative

Purpose: explain how a clear offer becomes trusted delivery and then a repeatable release.

Desktop route:

- Pin only the narrative proof stage inside its section.
- Scrub through three named steps: offer, delivery, next release.
- Fade/translate the active proof layer while progress moves vertically.
- Use one ScrollTrigger timeline for the whole narrative.

Mobile, coarse-pointer, and reduced-motion routes:

- No pinning or scrubbing.
- Render all steps in normal flow.
- Optional one-time entrance is allowed on mobile only if it does not affect reading or scrolling.

## Media route

No video is required for the first premium implementation. If an owned Tier B loop is later approved, it belongs behind the release console as atmosphere, not in place of product proof.

Required video behavior:

- WebM plus MP4 fallback where justified;
- inspected poster image;
- muted, inline, non-essential, and excluded from the accessibility tree when purely atmospheric;
- paused or omitted under reduced motion, save-data, and constrained mobile routes;
- no autoplay promise until the real export has been tested in production-like browsers.

## QA matrix

| Route | Expected behavior |
| --- | --- |
| Desktop / fine pointer | Hero timeline, bounded lens response, one pinned narrative |
| Desktop / reduced motion | Final static composition, no pointer response or pinning |
| Mobile / coarse pointer | Short entrance or static composition, normal-flow narrative |
| Mobile / reduced motion | Fully static document flow |
| JavaScript unavailable | All copy, actions, console, and narrative remain visible |

Validation requires actual 1440 px desktop, 390 px mobile, keyboard-only, and reduced-motion inspection before release.
