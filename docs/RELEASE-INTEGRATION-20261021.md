# Installation and Monograph integration candidate

State: IN_PROGRESS; integration draft, no paid release or customer outcome.

Owning work: Creator Launch OS issue #3 and portfolio Foundry #35. Product identity, sample catalog, price decisions, free MIT boundary and checkout behavior remain at their existing owners.

## Source inputs

- Reviewed main: 1db20333e78bdb399b43e1492ddefdfe99a7d938.
- Installation PR #8: 4f1f39383cc269d8686412c1139f42f4f7e8f363.
- Stacked Monograph PR #11: 1adfa5c6bcb9b478e2d962b31b1ab8cf7e070aa0.
- Studio/design source: starlight-design-intelligence@212db86fa4582616378e4a9ecf7743d3ba6d1747.

The integrator performed a three-way content reconciliation of each candidate change against its declared base. Current main's Next.js 16.3.8 and patched image dependency remain intact. Runtime instructions now name the tested Node.js 24 target. Historical verification declarations are preserved separately; an owner-domain HTTP response no longer substitutes for a fresh-customer account deployment.

## Acceptance

A user can reach /start, inspect setup commands, edit a Monograph, save incomplete work, reject or apply a local import, restore a saved project, and export independent source that preserves their edits. Invalid navigation/publication data cannot enter validated exported site files. Existing exports are never overwritten.

Save requests download JSON locally. The tool does not manage hosted persistence, deploy a user's site, process payments or establish rights. The standalone /edit route is public with noindex; no authentication is claimed.

## Evidence

The exact candidate, test logs, immutable archive hashes, browser viewports, deployment ID/URL and independent review belong in the post-build receipt. This source file does not embed its own future commit SHA or claim production. Fresh customer-account deployment and real external usefulness remain NOT_RUN until actual receipts exist.

Local integration checks on 21 October: typecheck, lint, 74 contract tests and production build passed. Seven Playwright journeys passed using test-only Chromium 147.0.7727.0, covering the atelier and installation path. A fresh standalone Monograph installed and built; its browser editor saved incomplete work, reviewed/cancelled imports, undid removals and exported validated files. A browser-saved project then generated a second fresh standalone source folder, installed, built and rendered the exact edits in a separate browser run. These synthetic local checks establish the exercised source behavior; they do not establish deployment in a buyer's account.

## Field Guide consumer projection

`public/architecture-decision-desk/` delivers the free MIT browser decision tool. Its canonical editable source belongs to the Field Guide. The upstream base commit, candidate patch and exact delivery hashes are recorded in `projection.json`; the source patch is included under `vendor/architecture-decision-desk/` so the candidate is reproducible without this machine. `node scripts/check-decision-desk.mjs` checks the delivery bytes and patch. The Field Guide candidate passed 26 report/projection tests and a separate synthetic browser journey at 320, 390, 768 and 1440 CSS pixels.

The GitHub integration returned 403 on the transferred Field Guide repository, so that candidate has not been written or merged upstream. This consumer copy does not claim an upstream release. Reconstruct edits by applying the patch to the pinned base in the Field Guide; reconcile the projection with its eventual reviewed upstream commit before claiming a canonical release. No paid manuscript, private registry or credentials are included.

## Recovery and next gate

Preserve the prior immutable source package and download the current project before replacing edits. Roll back a source change by reverting this integration commit through review. No production alias is promoted here. Independent review plus applicable required checks precede a merge; merchant, offer, fulfillment and buyer activation remain separate commercial gates.
