# Template atelier

## Intent and ownership

Source: Codex task `01a047b9-f0ba-7a62-87f3-0e88fe16d785`, Frank's 2026-09-10 request for better music-producer, AI-lab, AI-tool, portfolio, creator and challenge templates.
Implementation lane: `codex/template-atelier-20260910`, Creator Launch OS. One writer. The existing storefront, checkout boundary and marketplace version remain unchanged.

This is a free, noindex studio workbench at `/studio/templates`, not six new commercial products or a claim that v0 generated these files. The rejected legacy v0 connection was replaced with the official OAuth endpoint on 2026-09-10; OAuth login is now saved, while this running task still needs refreshed tools. Billing is unknown and paid-generation allowance is zero. No public launch, payment service, new domain or production promotion is part of this increment. A protected preview in the existing Vercel project is the visual inspection target.

## Page spec

Audience: independent creators and small studios choosing a useful starting point, not browsing cosmetic reskins.
First read: choose an audience, try the composition, personalize the message, take the brief into v0.
Must beat: the generic free shadcn landing-page starting point on audience specificity and useful interactions. Music's listening-first information order is informed by Bandcamp; the lab's publication-first structure by Anthropic Research. These are structural references, not copied identities.

| Direction | First visitor task | Real workbench interaction | Production boundary |
| --- | --- | --- | --- |
| Afterhours / music | Hear the artist's work | Local audio selection with native playback | Rights-cleared tracks, licensing, delivery and demand capture |
| Fieldwork / lab | Inspect the question and method | Research-note disclosure | Real papers, authors, evaluations and citations |
| Operand / tool | Understand input and output | Deterministic brief checklist | Provider adapter, auth, rate limits and measured evaluations |
| Monograph / portfolio | Understand a person's decisions | Expand an editorial case study | Approved identity, real work and inquiry integration |
| Common room / creator | Read something worth returning for | Open a sample essay | Real publications, subscription and entitlements |
| Momentum / challenge | Take the first useful step | Select days and track session progress | Consent, reminders, member access and timezone-aware scheduling |

All names and editorial content are illustrative. None are registered brand identities. The workbench does not collect contact information. Any later standalone product needs its own products-graph row, the shared demand-capture integration and a fresh release gate before checkout.

## Art direction and asset brief

One signature idea: an editorial specimen desk with a working miniature product, not a screenshot of fictional analytics. Tier C is correct: exact interactive UI is the artifact. No generated imagery or uploaded commercial masters are required.

Preserve the repository's Geist / Newsreader / Geist Mono typography. The curated matrix's expressive-developer and luxury-editorial categories inform a deliberate sans-versus-serif contrast; this is an existing-template exception, not adoption of the deprecated FrankX identity pack. No additional global fonts or global palette changes. Six locally scoped materials: plum/citron record sleeve, ivory/vermillion research sheet, cobalt technical workspace, warm editorial paper, forest reading room, and coral challenge calendar. Fine grain is subordinate to readable solid surfaces. No all-caps UI, fake customer logos, revenue counters, artificial scarcity, or decorative orbit scenes.

## Scene brief

Static hierarchy first. One short GSAP entrance on a newly selected specimen: headline and meaningful content move 12px while becoming visible. At most 0.55s total; no looping, scroll capture, layout-property animation, custom cursor or camera effects. `useGSAP` and `gsap.matchMedia` own cleanup. Reduced motion has an immediately visible static composition. Native scrolling and keyboard interactions always work. Glass is limited to the preview's utility chrome; no expensive blur over body copy.

## Acceptance and continuation

- [ ] All six directions have distinct compositions and an operable local interaction.
- [ ] Edits survive switching directions during this visit; refresh resets them, as disclosed.
- [ ] Prompt and JSON exports include the selected direction and current copy, never local file data.
- [ ] An invalid audio file fails visibly; object URLs are revoked on removal/unmount. No automatic playback or upload.
- [ ] Desktop, narrow mobile, keyboard, zoom and reduced-motion inspection complete.
- [ ] Type checking, lint, tests, production build, anti-slop scan and evidence-schema validation recorded.
- [ ] Independent second-provider buyer critique before any release. Machine preflight currently pauses new swarms; do not disguise self-review as independent review.

Next product lanes, preserved rather than silently dropped: coach knowledge graph and private member experience; service-business kit; artist galleries; commerce; authenticated publishing; liquid-glass/video variants with rights-approved media. Build provider wiring and product-specific waitlists only in verified canonical lanes. Treat health/member information as sensitive; use synthetic examples, explicit consent, role boundaries and non-clinical copy.

## References

- [Bandcamp](https://bandcamp.com/): release discovery and listening before purchase.
- [Anthropic Research](https://www.anthropic.com/research): research questions, disciplines and publications before promotional claims.
- Installed Next.js 16.3.3 documentation: CSS modules, route-local font scope and App Router pages.
- Installed GSAP core skill: responsive contexts, reduced motion and cleanup.

## Verification checkpoint — 2026-09-10

Production build passed after machine admission improved to BOUNDED. The workbench is statically prerendered. Lint and all 39 unit/contract/archive tests passed; the 22 template/contract checks were rerun after formatting. The source was formatted with pinned Prettier 3.6.2 without adding a project dependency.

Browser admission permits one 30-minute loop. Port 4321 is another app, so it is left untouched. The existing Vercel project has `all_except_custom_domains` authentication protection and no current native Git link; use one CLI preview deployment, never a production promotion or duplicate Git build. Visual evidence must describe the exact resulting candidate, not the unchanged production alias.
