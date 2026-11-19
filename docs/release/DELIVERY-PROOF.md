# The delivery proof · Operator edition 01

Release candidate 0.1.0-rc.1 extends the Creator Launch OS free core. Product and SKU identity stay in product.manifest.yaml. The sample receipt comes from the prior fixed packaging head so it can travel inside the next release without referencing its own hash.

## Distribution copy for review

**Owned product page** — The delivery proof. Check a release ZIP or an individual file against its source receipt. The free field edition includes a four-page PDF, local workbench, worked example and verification skill.

**FrankX teaching post** — Our release ZIP had the same 86 files in Amsterdam and UTC. Its outer fingerprint changed. Git was writing local timestamps into the archive. We pinned the packaging timezone and built a workbook so a recipient can test what actually arrived. Try the example, change one byte and keep both comparison records.

**GenCreator carousel** — Use the editable cover, a screenshot of the matching sample, and the same sample after one changed byte. Caption the last frame “A file match answers which edition arrived. Ask the reader what they made with it.” Link to the approval-bound release candidate. Keep visible outcomes labeled as examples.

## Reproduce

Open public/delivery-proof/index.html directly or visit /delivery-proof/index.html on the app. Run python3 scripts/package-delivery-skill.py to rebuild the skill archive. To render the PDF, use Chromium with print backgrounds, CSS page size, and document.fonts.ready. Expected output is four A5 pages. The source ZIP uses committed PDF bytes; a new print export is a new binary requiring a fresh receipt. The checked-in regular Latin font files come from Fontsource 5.3.0 with complete OFL notices. Exercise content and code inherit the MIT notice. Owner review covers public listing, mark placement and screenshots.

Review materials: [GenCreator direction](https://www.figma.com/design/oRqlKKNwWyaNwUqdAGSymq?node-id=11-2), [desktop](https://www.figma.com/design/oRqlKKNwWyaNwUqdAGSymq?node-id=28-3), [mobile](https://www.figma.com/design/oRqlKKNwWyaNwUqdAGSymq?node-id=28-15). The file comparison tool does not confer entitlements. Keep the release sheet distinct from the private commercial SKU workbook.
