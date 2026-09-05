# Release packaging

Build a reviewable delivery ZIP of the free MIT template from one clean Git commit:

```bash
pnpm test
pnpm package:release
```

The packager requires Node.js 22 or newer and Git. It uses only Node built-ins and Git; it does not install dependencies, call a model, deploy, submit a listing or contact a payment provider.

Commit source changes first. Ignored local environment files and build output stay outside the package. Uncommitted source changes block packaging so the archive cannot silently omit work you intended to deliver.

## What you receive

Each commit produces a directory under `dist/releases/` containing:

- A versioned source ZIP with the full commit bound in `receipt.json`.
- `SHA256SUMS` for the archive.
- A per-file byte count and SHA-256 inventory, including the product and listing manifests.

The receipt says `PACKAGED_NOT_RELEASED`. Application CI, visual review, fresh-account deployment, asset rights, payment/delivery and marketplace visibility need their own evidence. Existing historical checks in the template manifest are not promoted to current verification by this script.

## Review and reproduce

```bash
pnpm package:release --out dist/reproduction
# Compare SHA256SUMS and receipt.json with the first build.
```

Builds of the same commit with the same Git toolchain produce matching bytes. The packager refuses to replace an existing non-empty package directory. Use a separate output directory for a repeat build.

Unzip into an empty directory, open the included README, install with `pnpm install --frozen-lockfile`, and run `pnpm verify`. Configure real catalog content and approved hosted checkout URLs before inspecting the customer path.

## Maintain the file list

`release/package-manifest.json` is the explicit delivery allowlist. Include each new source, documentation or test file intentionally. New tracked files under app, components, lib, public, scripts, tests or release block packaging until listed. Private environment files, private-key file extensions, symlinks, submodules and archive export transforms are rejected.

This path policy is not a comprehensive secret or rights scanner. Review source contents, dependencies and asset rights before publishing. The archive contains only the existing free MIT core; commercial extensions remain governed by their own product and fulfillment decisions.

## CI evidence

Template CI runs the application checks and packaging tests, builds the ZIP, and uploads the ZIP plus receipts as a workflow artifact. Pull-request runs may test a GitHub merge commit; the receipt names the actual packaged commit. A downloaded CI artifact is a review package, not a GitHub Release or a marketplace listing.

## Version correction

The template manifest already declared 1.1.0 while package.json still declared 1.0.0. Packaging now requires those versions and the product identity/license to agree. No public release tag is created by this correction.
