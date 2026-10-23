# Commercial operations

Everything in this folder is separate from the free MIT core.

| Path | What it is | State |
| --- | --- | --- |
| `kit/` | Contents of the paid Commercial Kit, packaged by `pnpm package:kit` | Draft, not for sale |
| `policies/` | Refund and support policy for Commercial Kit buyers | Draft, owner approval required |
| `LICENSE-DRAFT.md` | Proposed commercial terms for `kit/` | Draft, owner and legal review required |

The free core never imports from this folder, and `pnpm package:release` never packages it. `offer.facts.json` at the repository root holds the facts both sides share: title, version, price state, merchant state, refund window and support channels.

## Before the first sale

The kit sits in a public repository today, so anyone can read it. Before checkout opens, the owner picks one:

1. Move `commercial/kit/` to a private delivery repository and keep only `kit.manifest.json` here, or
2. Sell the kit as an open-core bundle: buyers pay for the packaged, versioned, supported edition and the commercial license, while the source stays readable.

Both are workable. Pick one and record it in `docs/release/READINESS.md`.
