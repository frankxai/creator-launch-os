import { createHash } from "node:crypto"
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const scriptPath = fileURLToPath(import.meta.url)
const root = resolve(dirname(scriptPath), "..")
const hash = (value) => createHash("sha256").update(value).digest("hex")
const json = (value) => JSON.stringify(value, null, 2) + "\n"
const status = "SOURCE_EXPORTED_VERIFICATION_PENDING"

// Explicit sources only: never copy a checkout, environment, dependency tree or deployment link.
export const projectSourceFiles = Object.freeze([
  ".gitignore", "LICENSE", "app/globals.css", "components/template-preview.tsx",
  "components/template-atelier.module.css", "lib/template-catalog.ts", "lib/local-audio.ts",
  "eslint.config.mjs", "next.config.ts", "pnpm-lock.yaml", "pnpm-workspace.yaml",
  "postcss.config.mjs", "tsconfig.json",
])

function safeRead(directory, name, limit = 4 * 1024 * 1024) {
  if (typeof name !== "string" || !name || name.includes("\\") || name.includes(":") ||
    isAbsolute(name) || name.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Unsafe project file path")
  }
  const base = realpathSync(directory)
  let target = base
  for (const part of name.split("/")) {
    target = join(target, part)
    if (lstatSync(target).isSymbolicLink()) throw new Error(`Linked project file: ${name}`)
  }
  const distance = relative(base, realpathSync(target))
  if (distance === ".." || distance.startsWith(`..${sep}`) || isAbsolute(distance)) {
    throw new Error("Project file escapes its directory")
  }
  const info = lstatSync(target)
  if (!info.isFile() || info.size > limit) throw new Error(`Invalid or oversized file: ${name}`)
  return readFileSync(target)
}

async function loadCatalog(source) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  // Only this repository's fixed, trusted catalog is executable. Buyer JSON is parsed separately.
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
}

const siteModule = `import content from "@/content/site.json"
import { findTemplate, parseTemplateImport } from "@/lib/template-catalog"

const parsed = parseTemplateImport(JSON.stringify(content))
const selected = findTemplate(parsed.templateId)
if (!selected) throw new Error("Choose a supported template in content/site.json")
export const template = selected
export const copy = parsed.copy
`

const page = `import { TemplatePreview } from "@/components/template-preview"
import { copy, template } from "@/lib/site-content"
import styles from "@/components/template-atelier.module.css"

export default function Page() {
  return (
    <main id="main-content" className={\`\${styles.atelier} \${styles.studyPage}\`}>
      <header className={styles.studyToolbar}>
        <div>
          <h1>{copy.brand} / {template.audience}</h1>
          <p>Composition study · Illustrative content · Local interactions</p>
        </div>
        <a href="#source-notes">About this example</a>
      </header>
      <div className={styles.previewCanvas}>
        <TemplatePreview template={template} copy={copy} />
      </div>
      <footer id="source-notes" className={styles.studyToolbar}>
        <p>An interactive example. Signup, payment and hosted delivery are not connected.</p>
        <a href="https://github.com/frankxai/creator-launch-os">Creator Launch OS source</a>
      </footer>
    </main>
  )
}
`

const layout = `import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Newsreader } from "next/font/google"
import { copy } from "@/lib/site-content"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })
const serif = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", style: ["normal", "italic"] })

export const metadata: Metadata = {
  title: copy.brand,
  description: copy.description,
  robots: { index: false, follow: false },
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f2efe6" }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={\`\${geist.variable} \${mono.variable} \${serif.variable}\`}>
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-transform focus:translate-y-0">Skip to content</a>
        {children}
      </body>
    </html>
  )
}
`

function projectReadme(template) {
  return [
    `# ${template.name} starter`, "",
    `An editable Next.js composition for ${template.audience.toLowerCase()}, extracted from Creator Launch OS. Source is included; it does not call back to the parent checkout.`, "",
    "## Start", "", "Use Node.js 24 and the pnpm version in package.json. From this folder:", "",
    "```sh", "pnpm install --frozen-lockfile", "pnpm dev", "```", "",
    "Open http://localhost:3000. Stop the server with Ctrl+C when finished. Installation needs package-registry access; builds fetch the configured Google fonts. No API keys or paid services are needed for the included local interactions.", "",
    "## Personalize", "",
    "Edit content/site.json: brand (48 characters), headline (110), description (280). It is the same schema as the atelier's saved JSON; only display copy and templateId configure this project. Other packet fields cannot add scripts, credentials or integrations. Invalid configurations fail explicitly.", "",
    "The rest of the illustrative content is in components/template-preview.tsx and lib/template-catalog.ts. Replace it with your own material before publishing. Editing three copy fields does not personalize every case study, essay or track note. The parent atelier editor is not included.", "",
    `Art direction: ${template.composition}`, "",
    "## What works and what remains", "",
    "The original components, styles, scoped GSAP and reduced-motion behavior are included. All six renderers share the source; content/site.json selects one. Interactive audio uses a visitor-selected local file; no music file is bundled or hosted. Challenge progress lasts for the current page session. The brief builder is deterministic, not a model call. Essays and research entries are illustrative, not verified publications.", "",
    "This folder is a source starter, not a connected business or a native Framer, Webflow or WordPress product. No signup, email, payment, authentication, database, analytics, model provider or delivery integration is included. No deployment is performed by the exporter.", "",
    "Required work for this direction:", "",
    ...template.integrations.map((item) => `- ${item}`), "",
    "## Verify before deployment", "",
    "Run pnpm verify for type generation, TypeScript, lint and production build. Then inspect a preview at narrow and wide widths, keyboard-only navigation, reduced motion, each local interaction and invalid content. A successful export receipt does not mean these checks ran. Use an independent reviewer and real buyer trial before describing it as production-ready.", "",
    "Keep the sample labels while illustrative content remains. The layout defaults to noindex; this is an indexing preference, not access control. Set your real metadata, canonical URL, crawl settings and honest structured data only after replacing samples and completing the required integrations. Never promise search ranking or AI citation.", "",
    "For Vercel, import this folder into your own repository and preview project after local checks. This export contains no Vercel project ID, domain, token or deployment hook. Verify the actual preview revision and complete platform-native review before any marketplace submission.", "",
    "## Provenance and license", "",
    "project-receipt.json lists SHA-256 checksums, source hashes, and verification that remains pending. It is an integrity inventory, not a signature or security audit. Editing a file deliberately makes the original receipt stale. Keep it as provenance and generate fresh release evidence for your edited project.", "",
    "The source is MIT; retain LICENSE and its copyright/permission notice. Third-party packages and fonts keep their own licenses. Do not include assets without redistribution rights. Commercial use is permitted by the included MIT license; no exclusive ownership is implied.", "",
  ].join("\n")
}

/** Pack standalone source projects without installs, API calls, writes to existing exports or deployment. */
export async function exportTemplateProjects({
  outputRoot = join(root, "dist", "template-projects"), templateId, inputText,
} = {}) {
  if (templateId !== undefined && inputText !== undefined) throw new Error("Choose a template or an input file, not both")
  const sources = new Map(projectSourceFiles.map((name) => [name, safeRead(root, name)]))
  const catalog = await loadCatalog(sources.get("lib/template-catalog.ts").toString("utf8"))
  const imported = inputText === undefined ? undefined : catalog.parseTemplateImport(inputText)
  const chosenId = imported?.templateId ?? templateId
  const selected = chosenId === undefined ? catalog.templates : [catalog.findTemplate(chosenId)]
  if (selected.some((item) => !item)) throw new Error("Unknown template ID")
  const packageBytes = safeRead(root, "package.json")
  const originalPackage = JSON.parse(packageBytes)
  if (originalPackage.license !== "MIT") throw new Error("Review source licensing before export")
  const packages = selected.map((template) => {
    if (!/^[a-z]+$/.test(template.id)) throw new Error("Unsafe template ID")
    const copy = imported?.copy ?? template.copy
    const files = new Map(sources)
    files.set("content/site.json", json({ schemaVersion: "1.0.0", templateId: template.id, copy }))
    files.set("lib/site-content.ts", siteModule)
    files.set("app/page.tsx", page)
    files.set("app/layout.tsx", layout)
    files.set("next-env.d.ts", '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n')
    files.set("package.json", json({
      name: `atelier-${template.id}`, version: "0.1.0", private: true, license: "MIT",
      packageManager: originalPackage.packageManager, engines: { node: "24.x" },
      scripts: { dev: "next dev", build: "next build", start: "next start", lint: "eslint .",
        "type-check": "next typegen && tsc --noEmit", verify: "pnpm run type-check && pnpm run lint && pnpm run build" },
      dependencies: originalPackage.dependencies, devDependencies: originalPackage.devDependencies,
    }))
    files.set("README.md", projectReadme(template))
    const receipt = {
      schemaVersion: "1.0.0", templateId: template.id, status, format: "nextjs-source-project",
      sourceRepository: "https://github.com/frankxai/creator-launch-os",
      sourcePackageSha256: hash(packageBytes), exporterSha256: hash(safeRead(root, "scripts/export-template-project.mjs")),
      sourceFiles: [...sources].map(([name, bytes]) => ({ name, sha256: hash(bytes) })),
      verification: { sourceExport: "pass", cleanInstall: "pending", productionBuild: "pending",
        browserDesktopMobile: "pending", accessibility: "pending", independentReview: "pending",
        buyerTrial: "pending", marketplaceSubmission: "not-submitted" },
      files: [...files].map(([name, bytes]) => ({ name, bytes: Buffer.byteLength(bytes), sha256: hash(bytes) })),
    }
    files.set("project-receipt.json", json(receipt))
    return { templateId: template.id, files, receipt }
  })

  // Validate and assemble all projects before creating any output. Every invocation gets a fresh folder.
  mkdirSync(outputRoot, { recursive: true })
  const directory = mkdtempSync(join(resolve(outputRoot), "projects-"))
  for (const project of packages) {
    const destination = join(directory, project.templateId)
    for (const [name, bytes] of project.files) {
      const target = join(destination, name)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, bytes, { flag: "wx" })
    }
    verifyTemplateProject(destination)
  }
  const index = { schemaVersion: "1.0.0", status, projects: packages.map(({ templateId, receipt }) => ({
    templateId, directory: templateId, fileCount: receipt.files.length,
    receiptSha256: hash(json(receipt)),
  })) }
  writeFileSync(join(directory, "index.json"), json(index), { flag: "wx" })
  return { directory, index }
}

/** Verify listed bytes, not authorship or release readiness. Unlisted files are outside this inventory. */
export function verifyTemplateProject(directory) {
  const receipt = JSON.parse(safeRead(directory, "project-receipt.json", 128 * 1024))
  if (receipt.schemaVersion !== "1.0.0" || receipt.format !== "nextjs-source-project" ||
    !Array.isArray(receipt.files) || !receipt.files.length || receipt.files.length > 100) {
    throw new Error("Invalid project receipt")
  }
  const seen = new Set()
  for (const file of receipt.files) {
    if (!file || seen.has(file.name) || !Number.isSafeInteger(file.bytes) || file.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error("Invalid file inventory")
    seen.add(file.name)
    const bytes = safeRead(directory, file.name)
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`Changed project file: ${file.name}`)
  }
  for (const required of ["package.json", "pnpm-lock.yaml", "LICENSE", "app/page.tsx", "app/layout.tsx", "content/site.json"]) {
    if (!seen.has(required)) throw new Error(`Missing required inventory entry: ${required}`)
  }
  return { status: "LISTED_BYTES_VERIFIED", fileCount: seen.size }
}

export function parseArguments(args) {
  const options = {}
  const seen = new Set()
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    if (seen.has(flag)) throw new Error(`Repeated option: ${flag}`)
    seen.add(flag)
    if (flag === "--all" || flag === "--help") { options[flag.slice(2)] = true; continue }
    const key = { "--template": "templateId", "--input": "input", "--output": "outputRoot", "--verify": "verify" }[flag]
    if (!key || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Invalid option: ${flag}`)
    options[key] = args[++index]
  }
  if ([options.all, options.templateId, options.input, options.verify].filter(Boolean).length > 1 ||
    (options.verify && options.outputRoot)) throw new Error("Choose one export mode or verification")
  return options
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2))
    if (options.help) {
      process.stdout.write("Export: pnpm template:projects [--all | --template music | --input saved.json] [--output directory]\nVerify: pnpm template:projects --verify exported-project-directory\n")
    } else if (options.verify) {
      process.stdout.write(json(verifyTemplateProject(options.verify)))
    } else {
      if (options.input) {
        const input = resolve(options.input)
        options.inputText = safeRead(dirname(input), basename(input), 64 * 1024).toString("utf8")
      }
      const result = await exportTemplateProjects(options)
      process.stdout.write(`Exported ${result.index.projects.length} standalone source projects.\n${result.directory}\n${status}\n`)
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
