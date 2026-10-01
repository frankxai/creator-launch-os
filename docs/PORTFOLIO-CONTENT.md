# Portfolio content

The Monograph source project supports one to six case studies and a contact destination through `content/portfolio.json`. Brand, headline and description stay in `content/site.json`. The parent atelier editor still edits only those three fields.

Export the default illustrative version first:

```sh
pnpm template:projects --template portfolio
```

Edit its `content/portfolio.json` directly, or copy that file and pass it to a subsequent export:

```sh
pnpm template:projects --template portfolio --portfolio "my portfolio.json"
pnpm template:projects --input "saved copy.json" --portfolio "my portfolio.json"
```

The second command requires a saved copy packet with `templateId: "portfolio"`. Custom portfolio content cannot accompany another direction or an all-directions export. Validation finishes before export files are created. Each export uses a new directory and preserves earlier edits.

Keep `schemaVersion: "1.0.0"`. All text fields are required and nonempty. The file is limited to 64 KiB in UTF-8. Limits are JavaScript string lengths:

| Field | Maximum |
| --- | --- |
| navigation, practice, introduction | 100 |
| disciplines | 160 |
| Case title, role | 160 |
| Case category | 80 |
| Case poster | 100 |
| Case summary | 600 |
| Case context, decision, evidence | 2,000 each |
| Contact title | 160 |
| Contact description | 600 |
| Contact label | 80 |
| Contact href, case evidenceUrl | 2,048 |

Every case requires `illustrative: true` or `false`. Keep `true` for sample work. Set `false` only after supplying real responsibilities, permission-cleared work and evidence for any claimed result. The flag controls a display label; it is the author's declaration and does not verify rights or outcomes.

`evidenceUrl` accepts an HTTPS URL without credentials, or `null`. `contact.href` accepts the same, a plain email link such as `mailto:designer+projects@example.com`, or `null`. Email links support ordinary letters, numbers, dot, underscore, plus and hyphen in the local part, with a dotted domain. Query headers, fragments, whitespace and encoded line breaks are rejected. HTTPS links navigate to the supplied page; mail links open the visitor's mail application. There is no embedded contact form or email delivery service. With `null`, the page displays an explicit unconfigured state.

Unknown properties are discarded. Content stays JSON and React text; it cannot add executable scripts, raw HTML, dependencies, secrets or verification status. Imported data is not proof of a working external contact endpoint. Test the destination on the real preview.

Before publication, inspect every case on mobile and desktop, open each disclosure with the keyboard, check evidence links and the contact destination, and test reduced motion. This increment does not establish marketplace acceptance, paid delivery, buyer demand or release readiness.

## Publication settings

The exported project includes `content/publication.json`, initially:

```json
{ "schemaVersion": "1.0.0", "mode": "preview", "canonicalUrl": null, "indexable": false }
```

After replacing the examples with your own permission-cleared cases and configuring contact, set `mode` to `published` and `canonicalUrl` to your real HTTPS page URL. This removes the example toolbar and footer without changing source code. The URL must have no credentials, query or fragment. Title and description still come from `content/site.json`.

Published presentation requires every case to declare `illustrative: false` and a configured contact destination. The declarations do not verify rights, outcomes or external endpoints. Inspect the actual preview before setting `indexable: true`; this requests indexing and does not guarantee search visibility. Preview mode always requires `indexable: false`. Neither mode is access control or paid release approval. Other directions remain preview-only.

The publication file is limited to 4 KiB UTF-8 and its URL to 2,048 JavaScript string characters. Unknown settings are discarded; invalid settings fail the build. No browser icon is bundled: add your own permission-cleared `app/favicon.ico` or `app/icon.png` using Next.js file conventions. Until then a browser may request `/favicon.ico` and receive 404.

## Implementation evidence, 1 October 2026

[Cloud run 36860469045](https://github.com/frankxai/creator-launch-os/actions/runs/36860469045) passed on source revision `6219a91de01375591e8e7b07748d8ce58c8b650d`: parent type checking, lint and all 64 Node tests; a fresh standalone export outside the parent dependency tree; its own frozen-lockfile install on Node 24; standalone type checking, lint and production build; and Chromium checks at 375, 768 and 1,440px with both motion preferences.

The browser fixture checks two cases, a title containing literal HTML-shaped text, maximum-length unbroken content, disclosure keyboard use, contact focus indication, minimum target height and document overflow. An earlier run caught header overflow, repaired in that revision. External email delivery and evidence destinations were not exercised. This is automated engineering evidence; visual craft inspection, a cold buyer trial, independent review reconciliation and the paid release gate remain separate requirements.
