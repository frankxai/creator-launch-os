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

Before publication, inspect every case on mobile and desktop, open each disclosure with the keyboard, check evidence links and the contact destination, and test reduced motion. Replace the export's sample toolbar, footer and metadata only after clearing the corresponding release checks. This increment does not establish marketplace acceptance, paid delivery, buyer demand or release readiness.
