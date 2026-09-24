# Starter installation experience

## Page spec and scene brief — 2026-09-24

Owner: Codex task `01a047b9-f0ba-7a62-87f3-0e88fe16d785`, branch
`codex/install-experience-20260924`. The clean exporter checkpoint at `4c2063d`
is preserved on `codex/template-project-export-20260914`; no other live task
was found for this checkout in the available task inventory. No writer lock
or other task process was removed.

Audience: a creator who likes the demo and wants a usable copy, without having
to discover installation instructions on GitHub first.

First read: Creator Launch OS is a free MIT starter. Start setup on Vercel,
inspect a template direction, or run it locally. The product is source code,
not a managed commerce or membership service.

Surface: `/start`, linked from the homepage and primary navigation. Existing
storefront browsing and studio routes remain available.

Direction: an editorial setup sheet in Edition Zero's existing paper, ink and
coral palette. Keep Geist / Newsreader / Geist Mono; the curated typography
matrix is reference material, not permission to rebrand the existing product.
No GenCreator brand pack exists in the installed brand-pack directory.
Use the exact working setup controls as the Tier C focal object, not mock
screens, decorative bubbles, generated imagery or new motion dependencies.

Scene 1: literal product name and concise offer; an unmistakable deployment
handoff with account/hosting expectations beside it. Scene 2: the six existing
audience studies as a readable directory. Scene 3: selectable local commands
and a short, honest post-install checklist.

Interaction: ordinary links work without JavaScript. Copying commands is the
only client island. Its label stays stable, status is announced, failure
preserves a manually selectable command field, and repeat clicks cannot race.
No entrance sequence, scroll pinning, layout animation or delayed navigation.
Pointer-only emphasis uses short interruptible CSS; reduced motion removes it.
All primary controls have at least 44px targets and visible keyboard focus.

Reference: [Vercel Deploy Button](https://vercel.com/docs/deploy-button), checked
2026-09-24. A click opens the provider's clone/project flow; it does not silently
install, approve a plan, configure a domain, or guarantee free hosting. No
redirect callbacks, credentials, deploy hooks or paid integrations are added.

## Release boundaries

- The deploy link clones the public repository's default branch, not this
  candidate branch and not customized atelier copy.
- Audience studies remain examples. They do not include production payments,
  memberships, email capture or model inference.
- The existing standalone project exporter remains a separate local workflow.
- Source-code price remains free MIT. Hosting/provider costs are separate.
- No production promotion or Vercel project creation is part of this change.

## Review ledger

| Before | After | Why |
| --- | --- | --- |
| Deployment button only in README | First-class setup route and visible entry points | Visitors can act without searching a repository |
| Source link competes with the primary task | Setup action; source remains in setup/footer | Distinguish using the product from inspecting its code |
| Local install is a prose/code snippet | Selectable commands, copy feedback and manual fallback | Recover gracefully when clipboard permission is denied |
| Template studies are discoverable only inside studio | Six named audience links in the setup flow | Keep selection concrete without pretending each is a wired commercial app |

Verification and release decision live in `install-design-loop-evidence.json`.
Independent review, cloud checks and visual QA must be understood before merge.

## Verification receipt

- 60 contract tests passed after integrating the security patch, including
  six-project export/import closure checks and the actual Next.js native codec.
- Targeted ESLint, Next route type generation, TypeScript and production build
  passed. The built app includes `/start`; final copy subsequently gained the
  repository-name collision instruction from a separate read-only live check.
- The static anti-slop scanner reports 100/100; this is not visual QA evidence.
- Playwright was declared but absent from the local dependency tree. A frozen
  lockfile install restored it without changing dependency versions or executing
  install scripts. The subsequent combined rebuild/server/browser-test invocation
  was rejected by execution policy. It was not retried through another tool.
- The session-owned server on port 3106 was stopped. No other server or task was
  stopped. The three new browser tests remain unexecuted and the candidate stays
  draft until actual screenshots, flows and independent review pass.
- `PLAYWRIGHT_BASE_URL` can point the existing test harness at a separately
  supervised local server. CI still starts and stops its own production server.
- PR #7 remains a separate reconciliation lane: its public projection omits
  visibility filtering and the historical branch conflicts with current main.
  Do not merge that old tree or replace the immutable packaging allowlist.
- Security PR #9 pins sharp 0.35.4 and its patched native prebuilt dependencies
  for GHSA-rgj7-g3m4-5g8c. It is based independently on main and should be reviewed
  first. The installation candidate also incorporates the patch so future source
  exports carry the fixed workspace override and lockfile. Native codec tests
  and a production dependency audit pass locally; the default-branch alert is
  still open until the patch is integrated. The earlier UI build does not prove
  this final dependency revision. No alert was dismissed.
  PR #9's full Linux build/browser/packaging workflow passed in
  [run 35946751952](https://github.com/frankxai/creator-launch-os/actions/runs/35946751952).
  That run tests the security branch without the new installation UI; it is not
  evidence for `/start`. Independent review remains outstanding.

Emil guidance was selected, read and applied to stable labels, interruptible
pointer-only emphasis, focus styles, 44px controls and reduced-motion CSS. Source
and build checks are verified; experiential keyboard/touch/motion checks are
specified in browser tests but not yet verified.
