# Rights and provenance record — Creator Launch OS

State: **review_required**. This record lists what ships and where it came from. It does not assert any right on the owner's behalf; items marked *owner* need an explicit decision before the Commercial Kit is sold.

Checked on 2026-10-21 against the lockfile on this branch.

## Source and content

| Asset | Origin | Rights state | Ships in |
| --- | --- | --- | --- |
| Application source (`app/`, `components/`, `lib/`, `scripts/`, `tests/`) | Authored in this repository | MIT, repository `LICENSE` | Free core |
| Sample catalog (`lib/products.ts`): three fictional releases | Authored as samples | MIT; labeled "sample content" on `/products` | Free core |
| Six template studies (`lib/template-catalog.ts`) | Authored as studies | MIT; studies carry sample copy and say so | Free core |
| Commercial Kit (`commercial/kit/`) | Authored in this repository | Draft commercial terms, not in force (*owner*) | Commercial Kit |
| Policies (`commercial/policies/`) | Authored in this repository | Draft (*owner*) | Kit buyers, `/kit` summary |
| Commerce fixtures (`tests/fixtures/commerce/`) | Synthetic; `.invalid` email domain; placeholder amount | MIT; not customer data | Free core tests |
| `app/icon.svg`, generated Open Graph image | Authored in this repository | MIT | Free core |

No photographs, video, audio, partner marks or third-party screenshots are tracked in the repository.

## Dependencies with terms to review

| Dependency | Version | License as declared in its package | Note |
| --- | --- | --- | --- |
| next, react, react-dom, tailwindcss | 16.4.3, 19.2.8, 19.2.8, 4.3.3 | MIT | — |
| lucide-react | 1.34.0 | ISC | — |
| gsap, @gsap/react | 3.15.0, 2.1.2 | GSAP Standard "no charge" license, https://gsap.com/standard-license | *Owner:* read the current terms before selling; the free core depends on GSAP and the kit references it. Not assessed here from memory. |
| Geist, Geist Mono, Newsreader | via `next/font/google` | Fonts are fetched from Google Fonts at build time | *Owner:* confirm each family's license on its Google Fonts page before listing assets are captured. |

## Evidence assets

Screenshots attached to the readiness pull request are real renders of this branch at 375, 768 and 1440 pixels, with no sample metric presented as real. Per `docs/media/media-policy.md` they are review evidence, not approved listing renditions; listing media needs asset IDs, checksums and an approval state in the shared control plane.

## Owner decisions

1. Licensor entity and governing law for the Commercial Kit terms.
2. GSAP Standard license fit for a paid product built on the free core.
3. Whether `commercial/kit/` stays public (open-core bundle) or moves to a private delivery repository.
