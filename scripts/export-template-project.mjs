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
  "lib/portfolio-content.ts", "lib/site-publication.ts",
  "lib/portfolio-project.ts", "components/portfolio-workspace.tsx", "components/portfolio-workspace.module.css",
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

async function trustedModuleUrl(source, dependencies = {}) {
  let compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  for (const [specifier, url] of Object.entries(dependencies)) {
    compiled = compiled.replaceAll(JSON.stringify(specifier), JSON.stringify(url))
  }
  // Sources and dependency specifiers come only from the fixed repository allowlist, never buyer JSON.
  return `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
}

async function loadCatalog(source, dependencies) {
  return import(await trustedModuleUrl(source, dependencies))
}

const siteModule = `import content from "@/content/site.json"
import { findTemplate, parseTemplateImport } from "@/lib/template-catalog"
import publicationContent from "@/content/publication.json"
import { parseSitePublication } from "@/lib/site-publication"

const parsed = parseTemplateImport(JSON.stringify(content))
const selected = findTemplate(parsed.templateId)
if (!selected) throw new Error("Choose a supported template in content/site.json")
export const template = selected
export const copy = parsed.copy
export const portfolio = undefined
export const publication = parseSitePublication(JSON.stringify(publicationContent), template.id, portfolio)
`

const page = `import { TemplatePreview } from "@/components/template-preview"
import { copy, template, portfolio, publication } from "@/lib/site-content"
import styles from "@/components/template-atelier.module.css"

export default function Page() {
  return (
    <main id="main-content" className={\`\${styles.atelier} \${styles.studyPage}\`}>
      {publication.mode === "preview" && <header className={styles.studyToolbar}>
        <div>
          <h1>{copy.brand} / {template.audience}</h1>
          <p>Composition study · Illustrative content · Local interactions</p>
        </div>
        <a href="#source-notes">About this example</a>
      </header>}
      <div className={styles.previewCanvas}>
        <TemplatePreview template={template} copy={copy} portfolio={portfolio} standalone={publication.mode === "published"} />
      </div>
      {publication.mode === "preview" && <footer id="source-notes" className={styles.studyToolbar}>
        <p>An interactive example. Signup, payment and hosted delivery are not connected.</p>
        <a href="https://github.com/frankxai/creator-launch-os">Creator Launch OS source</a>
      </footer>}
    </main>
  )
}
`

const layout = `import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Newsreader } from "next/font/google"
import { copy, publication } from "@/lib/site-content"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })
const serif = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", style: ["normal", "italic"] })

export const metadata: Metadata = {
  title: copy.brand,
  description: copy.description,
  robots: { index: publication.indexable, follow: publication.indexable },
  ...(publication.canonicalUrl ? { alternates: { canonical: publication.canonicalUrl } } : {}),
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

const editorPage = `import type { Metadata } from "next"
import { PortfolioWorkspace } from "@/components/portfolio-workspace"
import { copy, portfolio, publication } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "Edit your portfolio", robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default function EditPage() {
  return <PortfolioWorkspace standalone initialProject={{
    schemaVersion: "1.0.0", format: "monograph-project", copy, portfolio, publication,
  }} />
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
    ...(template.id === "portfolio" ? [
      "Open /edit to work on identity, cases, contact and publication settings together. Save project downloads monograph-project.json, including incomplete drafts. Resume asks you to review the file before replacing your current edits. Refreshing loses unsaved changes; there is no account or automatic backup. The editor stays noindex even when the saved homepage requests indexing. Noindex is not access control: the editor is public if this source project is deployed.", "",
      "For a complete validated project, export new standalone source from the Creator Launch OS checkout with pnpm template:projects --project /path/to/monograph-project.json --output /path/to/exports. It creates a fresh folder and preserves existing exports. The standalone editor can instead download the three validated site files for you to copy into content/. Neither download updates a running deployment. Keep backups and verify your edited source before deploying it.", "",
      "Edit content/portfolio.json for the practice description, one to six case studies and contact link. Each case includes your role, summary, context, decision and evidence. Keep illustrative: true for examples. Set it to false only for your own permission-cleared work with supported claims. This declaration is not verification of rights or results.", "",
      "Contact href accepts an HTTPS contact page or a plain mailto: address without query headers. Set it to null to show the unconfigured state. Email links open the visitor's mail application; HTTPS links navigate to your contact page. No form or delivery service is included. Evidence links accept HTTPS URLs without credentials, or null.", "",
      "Portfolio limits (JavaScript string lengths): navigation, practice, introduction and case poster 100; disciplines, case title/role and contact title 160; category and contact label 80; case summary and contact description 600; case context/decision/evidence 2,000 each; link URLs 2,048. All text is required and nonempty; one to six cases; entire portfolio file at most 64 KiB UTF-8.", "",
      "Edit content/publication.json when your real content is ready: keep schemaVersion 1.0.0, set mode to published and canonicalUrl to your actual HTTPS page URL (no credentials, query or fragment). Published presentation removes the example toolbar/footer. It requires a configured contact and all cases declared illustrative: false. Confirm their rights and claims yourself before changing those declarations. These settings do not verify rights, destinations or release readiness. Keep indexable: false until your actual preview is checked; true requests search indexing. Preview mode always requires false. No source editing is needed for these settings.", "",
    ] : ["The rest of the illustrative content is in components/template-preview.tsx and lib/template-catalog.ts. Replace it with your own material before publishing. Editing three copy fields does not personalize every essay or track note.", ""]),
    template.id === "portfolio" ? "Monograph includes its dedicated local editor. Other parent studio routes are not included." : "The parent atelier editor is not included.", "",
    `Art direction: ${template.composition}`, "",
    "## What works and what remains", "",
    "The original components, styles, scoped GSAP and reduced-motion behavior are included. All six renderers share the source; content/site.json selects one. Interactive audio uses a visitor-selected local file; no music file is bundled or hosted. Challenge progress lasts for the current page session. The brief builder is deterministic, not a model call. Essays and research entries are illustrative, not verified publications.", "",
    "This folder is a source starter, not a connected business or a native Framer, Webflow or WordPress product. No signup, email, payment, authentication, database, analytics, model provider or delivery integration is included. No deployment is performed by the exporter.", "",
    "Required work for this direction:", "",
    ...template.integrations.map((item) => `- ${item}`), "",
    "## Verify before deployment", "",
    "Run pnpm verify for type generation, TypeScript, lint and production build. Then inspect a preview at narrow and wide widths, keyboard-only navigation, reduced motion, each local interaction and invalid content. A successful export receipt does not mean these checks ran. Use an independent reviewer and real buyer trial before describing it as production-ready.", "",
    "The layout defaults to noindex; this is an indexing preference, not access control. Metadata title and description use content/site.json. Monograph's canonical URL, indexing and example presentation use content/publication.json; other directions remain preview-only until their source content and integrations are completed. Never promise search ranking or AI citation.", "",
    "No icon is bundled. Add your own permission-cleared app/favicon.ico or app/icon.png to configure the browser tab icon using Next.js file conventions. Until then a browser may request /favicon.ico and receive 404; the page itself still works.", "",
    "For Vercel, import this folder into your own repository and preview project after local checks. This export contains no Vercel project ID, domain, token or deployment hook. Verify the actual preview revision and complete platform-native review before any marketplace submission.", "",
    "## Provenance and license", "",
    "project-receipt.json lists SHA-256 checksums, source hashes, and verification that remains pending. It is an integrity inventory, not a signature or security audit. Editing a file deliberately makes the original receipt stale. Keep it as provenance and generate fresh release evidence for your edited project.", "",
    "The source is MIT; retain LICENSE and its copyright/permission notice. Third-party packages and fonts keep their own licenses. Do not include assets without redistribution rights. Commercial use is permitted by the included MIT license; no exclusive ownership is implied.", "",
  ].join("\n")
}

/** Pack standalone source projects without installs, API calls, writes to existing exports or deployment. */
export async function exportTemplateProjects({
  outputRoot = join(root, "dist", "template-projects"), templateId, inputText, portfolioText, projectText,
} = {}) {
  if (templateId !== undefined && inputText !== undefined) throw new Error("Choose a template or an input file, not both")
  if (projectText !== undefined && [templateId, inputText, portfolioText].some((value) => value !== undefined)) {
    throw new Error("A saved Monograph project is a complete export mode; do not combine it with other content options")
  }
  const sources = new Map(projectSourceFiles.map((name) => [name, safeRead(root, name)]))
  const catalog = await loadCatalog(sources.get("lib/template-catalog.ts").toString("utf8"))
  const imported = inputText === undefined ? undefined : catalog.parseTemplateImport(inputText)
  const publicationSource = sources.get("lib/site-publication.ts").toString("utf8")
  const projectModule = projectText === undefined ? undefined : await loadCatalog(sources.get("lib/portfolio-project.ts").toString("utf8"), {
    "./template-catalog.ts": await trustedModuleUrl(sources.get("lib/template-catalog.ts").toString("utf8")),
    "./portfolio-content.ts": await trustedModuleUrl(sources.get("lib/portfolio-content.ts").toString("utf8")),
    "./site-publication.ts": await trustedModuleUrl(publicationSource),
  })
  const saved = projectModule?.portfolioProjectFiles(projectModule.parsePortfolioProject(projectText))
  const chosenId = saved ? "portfolio" : imported?.templateId ?? templateId
  const selected = chosenId === undefined ? catalog.templates : [catalog.findTemplate(chosenId)]
  if (selected.some((item) => !item)) throw new Error("Unknown template ID")
  if (portfolioText !== undefined && chosenId !== "portfolio") {
    throw new Error("Custom portfolio content requires a single portfolio export")
  }
  const portfolioModule = await loadCatalog(sources.get("lib/portfolio-content.ts").toString("utf8"))
  const portfolio = saved?.["content/portfolio.json"] ?? portfolioModule.parsePortfolioContent(portfolioText ?? json(portfolioModule.examplePortfolio))
  const packageBytes = safeRead(root, "package.json")
  const originalPackage = JSON.parse(packageBytes)
  if (originalPackage.license !== "MIT") throw new Error("Review source licensing before export")
  const packages = selected.map((template) => {
    if (!/^[a-z]+$/.test(template.id)) throw new Error("Unsafe template ID")
    const copy = saved?.["content/site.json"].copy ?? imported?.copy ?? template.copy
    const files = new Map(sources)
    files.set("content/site.json", json({ schemaVersion: "1.0.0", templateId: template.id, copy }))
    files.set("content/publication.json", json(saved?.["content/publication.json"] ?? { schemaVersion: "1.0.0", mode: "preview", canonicalUrl: null, indexable: false }))
    files.set("lib/site-content.ts", siteModule)
    if (template.id === "portfolio") {
      files.set("app/edit/page.tsx", editorPage)
      files.set("content/portfolio.json", json(portfolio))
      files.set("lib/site-content.ts", siteModule.replace("export const portfolio = undefined", [
        'import portfolioContent from "@/content/portfolio.json"',
        'import { parsePortfolioContent } from "@/lib/portfolio-content"',
        "export const portfolio = parsePortfolioContent(JSON.stringify(portfolioContent))",
      ].join("\n")))
    }
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
    const key = { "--template": "templateId", "--input": "input", "--project": "projectInput", "--portfolio": "portfolioInput", "--output": "outputRoot", "--verify": "verify" }[flag]
    if (!key || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Invalid option: ${flag}`)
    options[key] = args[++index]
  }
  if ([options.all, options.templateId, options.input, options.projectInput, options.verify].filter(Boolean).length > 1 ||
    ((options.verify || options.projectInput) && options.portfolioInput) ||
    (options.verify && options.outputRoot)) throw new Error("Choose one export mode or verification")
  return options
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2))
    if (options.help) {
      process.stdout.write("Export: pnpm template:projects [--all | --template music | --input saved.json | --project monograph-project.json] [--output directory]\nPortfolio: pnpm template:projects --template portfolio --portfolio portfolio.json\nVerify: pnpm template:projects --verify exported-project-directory\n")
    } else if (options.verify) {
      process.stdout.write(json(verifyTemplateProject(options.verify)))
    } else {
      if (options.input) {
        const input = resolve(options.input)
        options.inputText = safeRead(dirname(input), basename(input), 64 * 1024).toString("utf8")
      }
      if (options.portfolioInput) {
        const input = resolve(options.portfolioInput)
        options.portfolioText = safeRead(dirname(input), basename(input), 64 * 1024).toString("utf8")
      }
      if (options.projectInput) {
        const input = resolve(options.projectInput)
        options.projectText = safeRead(dirname(input), basename(input), 256 * 1024).toString("utf8")
      }
      const result = await exportTemplateProjects(options)
      process.stdout.write(`Exported ${result.index.projects.length} standalone source projects.\n${result.directory}\n${status}\n`)
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
