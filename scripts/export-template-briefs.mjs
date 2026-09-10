import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const scriptPath = fileURLToPath(import.meta.url)
const root = resolve(dirname(scriptPath), "..")
const hash = (value) => createHash("sha256").update(value).digest("hex")

/** Export the same catalog and prompt builder used by the workbench. No API calls. */
export async function exportTemplateBriefs({
  outputRoot = join(root, "dist", "template-briefs"),
} = {}) {
  const source = readFileSync(join(root, "lib", "template-catalog.ts"), "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const { templates, createV0Brief, createTemplatePacket } = await import(
    `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
  )
  const contents = new Map()
  for (const template of templates) {
    if (!/^[a-z]+$/.test(template.id)) throw new Error("Template IDs must be safe filenames")
    for (const [name, content] of [
      [`${template.id}-v0-brief.md`, createV0Brief(template, template.copy) + "\n"],
      [
        `${template.id}-template.json`,
        JSON.stringify(createTemplatePacket(template, template.copy), null, 2) + "\n",
      ],
    ]) {
      if (contents.has(name)) throw new Error("Duplicate template export")
      contents.set(name, content)
    }
  }
  contents.set(
    "README.md",
    [
      "# Six composition briefs for v0",
      "",
      "These are original local prompt packets, not v0-generated applications or approved commercial releases. Exporting them makes no network request and spends no credits.",
      "",
      ...templates.map(
        (template) =>
          `- **${template.name} / ${template.audience}:** [v0 brief](${template.id}-v0-brief.md) · [configuration](${template.id}-template.json)`,
      ),
      "",
      "Choose one brief and replace illustrative copy with truthful, approved content. Paste it into an authenticated v0 account only after checking that account's billing and your spend cap. Review automatic Git/deployment behavior first. Do not paste credentials or private client data.",
      "",
      "v0 owns composition; the canonical repository owns integrations and final GSAP motion. Inspect desktop/mobile exports, reduced motion, keyboard behavior and each primary journey before release. Registration and shared demand capture precede a product launch; checkout requires a fresh release PASS.",
      "",
      "The working local examples live at /studio/templates in Creator Launch OS. Audio, progress and editor state are browser-local and are not included in these baseline packets.",
      "",
    ].join("\n"),
  )

  const receipt = {
    schemaVersion: "1.0.0",
    status: "BRIEFS_NOT_GENERATED_APPS",
    catalogSha256: hash(source),
    exporterSha256: hash(readFileSync(scriptPath)),
    files: [...contents].map(([name, content]) => ({
      name,
      bytes: Buffer.byteLength(content),
      sha256: hash(content),
    })),
  }
  mkdirSync(outputRoot, { recursive: true })
  // A new directory per run preserves any earlier user-edited exports.
  const directory = mkdtempSync(join(resolve(outputRoot), "atelier-"))
  for (const [name, content] of contents)
    writeFileSync(join(directory, name), content, { flag: "wx" })
  writeFileSync(join(directory, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n", {
    flag: "wx",
  })
  return { directory, receipt }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const { directory, receipt } = await exportTemplateBriefs()
  process.stdout.write(
    `Exported six v0 briefs, six configurations and an index.\n${directory}\n${receipt.status}\n`,
  )
}
