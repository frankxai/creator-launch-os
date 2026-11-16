# Creator Launch OS: release candidate

A portable storefront and release workspace for independent creators.

Hosted checkout handoff only; no payment processing, entitlement service or customer database.

## Reproduce

Use Node 22/24 and the committed lockfile. `pnpm install --frozen-lockfile`; `pnpm verify`. Then `pnpm run release:check`, `pnpm run tokens:export` and `pnpm run marketplace:export`. The offline [setup guide](setup.html) travels in the ZIP.

## Sources and design handoff

The implementation here is canonical. `release/component-map.json` records real module paths and explicitly unmapped Figma nodes. Portfolio reference [First Light](https://www.figma.com/design/m2wi20fAoCgFOKGXkJJGAm?node-id=150-206) was inspected; it is not a pixel-parity claim for this template. Product-specific desktop/phone node mapping and visual approval remain required before advertising a Figma kit.

Token authority is the existing CSS scopes in `release/pipeline.json`. `tokens:export` generates source-hashed projections in `dist/design/` for Figma handoff; edit the authority, never the generated projection. Use the existing [Figma template pipeline](https://github.com/Starlight-Intelligence/starlight-design-intelligence/blob/main/playbooks/figma-template-pipeline.md). Do not replace it with another registry.

## Motion and component documentation

Existing GSAP owns the hero sequence and release story. Keep its matchMedia/revert lifecycle. Do not add Motion as a second engine to this surface.

[Component contracts](COMPONENTS.md) extend the existing documentation. A second Storybook app adds no value to this bounded release.

## Screenshots and visual regression

The release browser workflow captures real pages at 1280×720, 600×600 and 390×844, plus full desktop/phone evidence. Each artifact has commit, path, viewport, SHA-256 and bytes. No screenshot is generated imagery. Sample labels remain visible. `release/rights.json` controls listing use.

`playwright test --update-snapshots` creates candidate goldens for review. Commit approved goldens, then use `VISUAL_REGRESSION=1 pnpm exec playwright test` to compare without updating them. Without approved goldens the capture checks are useful evidence, not historical visual regression. CI reports this distinction and never auto-approves new images.

## Channel exports

`marketplace:export` derives review packets from `marketplace.listing.yaml`, package identity/version and the existing template manifest. GitHub receives the immutable source ZIP, checksums, license and changelog. Vercel requires the App Router, README deploy button and working Vercel demo. Gumroad receives a 1280×720 cover and 600×600 thumbnail candidate plus source ZIP. Envato gets English HTML help and a category/rights review blocker; this does not make a Next.js source archive a Framer/Webflow/Figma native product.

Official requirements checked 2026-11-16: [Vercel](https://vercel.com/templates/submit), [Gumroad image specifications](https://gumroad.com/help/article/60-adding-a-cover-image), [Envato themes](https://help.author.envato.com/hc/en-us/articles/360000470826-Themes-Item-Preparation-Technical-Requirements). Recheck at submission. No listing or price is changed by these commands.

## Remaining release blockers

- Current-commit browser/visual approval
- Per-asset listing rights review
- Owner publication approval
