# Standalone composition projects

The atelier previously delivered editable JSON and v0 briefs. This exporter delivers an independent Next.js source project, including the existing components, styles, local interactions, content, lockfile and setup instructions. A buyer can develop it without the Creator Launch OS checkout.

## Run

From the repository after its dependencies are installed:

```sh
pnpm template:projects
pnpm template:projects --template music
pnpm template:projects --input "saved-template.json"
pnpm template:projects --template portfolio --output "my exports"
pnpm template:projects --verify "dist/template-projects/projects-EXAMPLE/music"
```

The default exports all six directions: music, lab, tool, portfolio, creator and challenge. Choose one selection mode; unknown flags, duplicate flags, invalid IDs and oversized inputs fail. Replace EXAMPLE with the actual directory printed by the command. Paths with spaces work when quoted.

Each run creates a new directory. Earlier exports and buyer edits are preserved. A root index links each project to its receipt hash. Every project contains:

- A root page and layout without dependencies on the parent's storefront or atelier routes.
- `content/site.json`, using the atelier import schema for three editable copy fields and template ID.
- Portfolio exports also include `content/portfolio.json` for validated case studies and a contact destination. See [Portfolio content](PORTFOLIO-CONTENT.md) for the schema and `--portfolio` option.
- Original preview component, CSS, catalog and local audio guard, copied byte for byte.
- Next.js configuration, TypeScript configuration, lint configuration, dependencies and unchanged pnpm lockfile.
- A tailored README, MIT license and `project-receipt.json`.

The source retains all six renderers; the JSON selects the visible direction. This first version does not prune the other renderers or provide a browser editor inside the exported app. Extra development dependencies are preserved to keep the copied lockfile consistent. No dependencies are installed during export.

## Buyer journey and page specification

Audience: a developer or technically comfortable creator who wants to own and modify a working composition. A nontechnical Framer buyer needs a native Framer product and must not receive this package under that label.

Activation for this increment: export saved copy, open the independent project, verify the selected composition and operate its existing interaction. This is separate from the eventual commercial activation of payment and delivery.

Scene: preserve the selected composition's static hierarchy and original typography; retain the sample disclosure above it and integration disclosure below it. The header uses the buyer's brand. Replace links back into the absent parent atelier with a working in-page explanation. Keep the skip link and the original reduced-motion behavior. No new imagery or decorative motion is introduced.

Asset tier: the real interactive source is product proof. Illustrative content remains labeled; no new rights claim, screenshot approval or inherited visual PASS is asserted. The original source's visual evidence does not certify a newly generated deployment. Desktop/mobile inspection and independent review of the exported project remain required.

## Content and integration boundaries

Only the known JSON schema crosses the import boundary. Brand, headline and description are normalized using the same parser as the atelier. Limits are 48, 110 and 280 characters; configuration files are capped at 64 KiB. JSON stays data and is not interpolated into executable code. Other packet fields cannot change scripts, dependencies, provider configuration or verification state.

The three copy fields are not a complete CMS. Additional essay, project and research examples remain in the components and catalog. Replace them before publishing. Existing interactions have these limits:

| Direction | Included behavior | Missing production work |
| --- | --- | --- |
| Music | Visitor-selected local audio playback | Rights-cleared hosted tracks, release capture, license delivery |
| Lab | Expandable sample methods and limitations | Verified publications, author metadata, accessible archive |
| Tool | Deterministic brief checklist | Actual server-side model integration, rate and spend limits, evaluations |
| Portfolio | Editable case studies and HTTPS/mail contact links | Approved identity, real projects, evidence and a verified contact destination |
| Creator | Complete sample essay | Versioned real publication and opt-in subscription integration |
| Challenge | Operable seven-day plan with session progress | Durable private progress and opt-in reminders |

No signup, payment, customer database, analytics, external model, deployment or marketplace submission is implemented by this command. Local audio and browser state are not exported. No credential, environment file, Git directory, dependency tree or Vercel account configuration is copied.

## Verification and release

Checksums verify listed bytes against an unsigned inventory. They do not prove authorship, security, marketplace acceptance, demand or revenue. Unlisted files are outside the inventory; audit the complete delivery directory before distributing it. After deliberate edits, keep the original receipt as provenance and generate new release evidence.

Tests cover all six project trees, source-import closure, manifest/lockfile pairing, syntax, copy isolation, unsafe receipt paths, tampering, CLI behavior, invalid configuration and non-overwriting exports. These checks do not replace an isolated dependency installation, full TypeScript analysis, a production build or browser execution.

Before release:

1. In a fresh exported directory, run `pnpm install --frozen-lockfile` and `pnpm verify`. Node.js 24 is the specified runtime. Package installation and Google-font fetching require network access.
2. Inspect the actual output at mobile and desktop sizes; exercise every direction being sold, keyboard navigation and reduced motion. Test content limits and error states. Refine once for quality and obtain an independent critique.
3. Replace illustrative content and supply the integrations promised by the listing. Do not remove sample labels before the corresponding content is real.
4. The default metadata is noindex. It is not access control. Configure canonical metadata, crawl settings, sitemap and truthful structured data for the real site; verify them on the deployment.
5. Record the exact source revision, export hashes, preview revision, cold buyer results, support and delivery evidence. Apply the existing product release gate before pricing or submission.

## Decisions and open work

- Reuse existing compositions; no new design system or hosted service.
- Export to `dist/`, which the parent TypeScript and lint configurations exclude. Generated projects are not imported into the parent application.
- Retain the root MIT license. A future paid extension needs a distinct, tested deliverable and clear terms; charging for a bundle does not revoke recipients' MIT rights.
- Native Framer, Webflow and WordPress formats remain separate adapter work. A generated Next.js directory is not a native template for those marketplaces.
- Install/build, actual browser export inspection and a different-provider reviewer are still pending for the new exporter. Do not change the product's maturity label based on export success.

## Implementation verification — 2026-09-14

All 55 repository Node tests passed with test concurrency set to one. Targeted ESLint passed for the exporter and its tests. All six export trees passed syntax/import-closure and file-integrity checks. A generated music project also passed TypeScript semantic analysis using the existing parent dependency installation, without incrementality. That is useful type evidence, not a cold install or production build.

The requested additional agents remain unstarted: the latest swarm preflight returned HOLD with 6,027 MB free against 10,240 MB required, and 18 task runtimes against its budget of eight. A prior build preflight also held. No independent-provider, browser or fresh production-build PASS is asserted; no public deployment or marketplace submission was made. Existing preview evidence in TEMPLATE-ATELIER.md predates this exporter.
