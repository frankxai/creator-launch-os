import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import ts from "typescript"
import { examplePortfolio } from "../lib/portfolio-content.ts"
import { exportTemplateProjects, parseArguments, projectSourceFiles, verifyTemplateProject } from "../scripts/export-template-project.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))
const digest = (value) => createHash("sha256").update(value).digest("hex")

function temporary(t) {
  const directory = mkdtempSync(join(tmpdir(), "atelier-project-test-"))
  // The resolved target is exactly the dedicated directory created by this test.
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  return directory
}

test("all six exports include independent source, compatible manifests and verifiable bytes", async (t) => {
  const outputRoot = temporary(t)
  const { directory, index } = await exportTemplateProjects({ outputRoot })
  assert.deepEqual(index.projects.map((p) => p.templateId), ["music", "lab", "tool", "portfolio", "creator", "challenge"])
  const original = readJson(join(root, "package.json"))
  for (const entry of index.projects) {
    const project = join(directory, entry.directory)
    const receipt = readJson(join(project, "project-receipt.json"))
    assert.equal(digest(readFileSync(join(project, "project-receipt.json"))), entry.receiptSha256)
    assert.equal(verifyTemplateProject(project).status, "LISTED_BYTES_VERIFIED")
    assert.equal(receipt.verification.productionBuild, "pending")
    assert.equal(receipt.verification.independentReview, "pending")
    const manifest = readJson(join(project, "package.json"))
    assert.deepEqual(manifest.dependencies, original.dependencies)
    assert.deepEqual(manifest.devDependencies, original.devDependencies)
    assert.equal(manifest.license, "MIT")
    assert.equal(readJson(join(project, "content/site.json")).templateId, entry.templateId)
    assert.match(readFileSync(join(project, "README.md"), "utf8"), /pnpm install --frozen-lockfile/)
    assert.ok(!existsSync(join(project, ".env.local")))
    assert.ok(!existsSync(join(project, ".vercel")))
    assert.ok(!existsSync(join(project, "node_modules")))
    assert.ok(!existsSync(join(project, "app/studio")))
    for (const name of projectSourceFiles) assert.deepEqual(readFileSync(join(project, name)), readFileSync(join(root, name)))

    // Resolve every source import against the exported tree, never the parent checkout.
    for (const file of receipt.files.filter((f) => /\.(ts|tsx)$/.test(f.name) && !f.name.endsWith(".d.ts"))) {
      const source = readFileSync(join(project, file.name), "utf8")
      const compiled = ts.transpileModule(source, {
        fileName: file.name, reportDiagnostics: true,
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      })
      assert.deepEqual(compiled.diagnostics, [], file.name)
      for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
        const spec = imported.fileName
        if (spec.startsWith(".") || spec.startsWith("@/")) {
          const target = spec.startsWith("@/") ? join(project, spec.slice(2)) : resolve(project, dirname(file.name), spec)
          assert.ok(["", ".ts", ".tsx", ".json"].some((ext) => existsSync(target + ext)), `${file.name}: ${spec}`)
        } else {
          const packageName = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]
          assert.ok(manifest.dependencies[packageName] || manifest.devDependencies[packageName], spec)
        }
      }
    }
  }
})

test("saved copy remains JSON data, cannot change runtime scripts and does not overwrite earlier exports", async (t) => {
  const outputRoot = temporary(t)
  const copy = { brand: "A & B </script>", headline: "Use `quotes` and ${variables} as text", description: "$(do-not-run) <img src=x onerror=alert(1)>" }
  const inputText = JSON.stringify({ schemaVersion: "1.0.0", templateId: "tool", copy,
    scripts: { postinstall: "never execute" }, integrations: ["pretend-payment"], maturity: "released" })
  const first = await exportTemplateProjects({ outputRoot, inputText })
  const location = join(first.directory, "tool")
  assert.deepEqual(readJson(join(location, "content/site.json")), { schemaVersion: "1.0.0", templateId: "tool", copy })
  assert.ok(!readFileSync(join(location, "package.json"), "utf8").includes("never execute"))
  assert.ok(!readFileSync(join(location, "app/page.tsx"), "utf8").includes(copy.headline))
  writeFileSync(join(location, "README.md"), "Buyer edits to preserve")
  const second = await exportTemplateProjects({ outputRoot, templateId: "tool" })
  assert.notEqual(first.directory, second.directory)
  assert.equal(readFileSync(join(location, "README.md"), "utf8"), "Buyer edits to preserve")
  assert.throws(() => verifyTemplateProject(location), /Changed project file: README/)
})

test("invalid or oversized inputs leave no output", async (t) => {
  const outputRoot = join(temporary(t), "not-created")
  for (const options of [
    { templateId: "../../escape" }, { inputText: "{" },
    { inputText: JSON.stringify({ schemaVersion: "1.0.0", templateId: "music", copy: { brand: "x".repeat(49), headline: "h", description: "d" } }) },
    { inputText: " ".repeat(65537) }, { templateId: "music", inputText: "{}" },
    { templateId: "portfolio", portfolioText: "{" },
    { templateId: "music", portfolioText: JSON.stringify(examplePortfolio) },
    { portfolioText: JSON.stringify(examplePortfolio) },
  ]) await assert.rejects(exportTemplateProjects({ outputRoot, ...options }))
  assert.ok(!existsSync(outputRoot))
})

test("portfolio exports carry complete buyer content and discard unrelated properties", async (t) => {
  const value = structuredClone(examplePortfolio)
  value.contact.href = "mailto:designer@example.com"
  value.cases[0].title = "My project <literal>"
  value.scripts = { postinstall: "do not execute" }
  const { directory } = await exportTemplateProjects({ outputRoot: temporary(t), templateId: "portfolio", portfolioText: JSON.stringify(value) })
  const location = join(directory, "portfolio")
  const content = readJson(join(location, "content/portfolio.json"))
  assert.equal(content.contact.href, value.contact.href)
  assert.equal(content.cases[0].title, value.cases[0].title)
  assert.ok(!("scripts" in content))
  assert.ok(!readFileSync(join(location, "app/page.tsx"), "utf8").includes(value.cases[0].title))
  assert.match(readFileSync(join(location, "lib/site-content.ts"), "utf8"), /parsePortfolioContent/)
  assert.equal(verifyTemplateProject(location).status, "LISTED_BYTES_VERIFIED")
})

test("receipt traversal, duplicates and omitted required files fail closed", async (t) => {
  const outputRoot = temporary(t)
  const { directory } = await exportTemplateProjects({ outputRoot, templateId: "music" })
  const location = join(directory, "music")
  const path = join(location, "project-receipt.json")
  const original = readJson(path)
  for (const name of ["../outside", "C:/outside", "app/../../outside", "app\\page.tsx", "/outside"]) {
    const changed = structuredClone(original)
    changed.files[0].name = name
    writeFileSync(path, JSON.stringify(changed))
    assert.throws(() => verifyTemplateProject(location), /Unsafe project file path/)
  }
  const duplicate = structuredClone(original)
  duplicate.files.push(duplicate.files[0])
  writeFileSync(path, JSON.stringify(duplicate))
  assert.throws(() => verifyTemplateProject(location), /Invalid file inventory/)
  const missing = structuredClone(original)
  missing.files = missing.files.filter((file) => file.name !== "LICENSE")
  writeFileSync(path, JSON.stringify(missing))
  assert.throws(() => verifyTemplateProject(location), /Missing required inventory/)
})

test("CLI uses paths with spaces and returns failure for invalid flags or byte tampering", (t) => {
  const outputRoot = temporary(t)
  const source = join(outputRoot, "saved copy.json")
  writeFileSync(source, JSON.stringify({ schemaVersion: "1.0.0", templateId: "portfolio", copy: { brand: "My name", headline: "My work", description: "My story" } }))
  const script = join(root, "scripts/export-template-project.mjs")
  const result = execFileSync(process.execPath, [script, "--input", source, "--output", join(outputRoot, "buyer projects")], { encoding: "utf8" })
  assert.match(result, /Exported 1 standalone source projects/)
  const parent = join(outputRoot, "buyer projects")
  const project = join(parent, readdirSync(parent)[0], "portfolio")
  assert.match(execFileSync(process.execPath, [script, "--verify", project], { encoding: "utf8" }), /LISTED_BYTES_VERIFIED/)
  writeFileSync(join(project, "content/site.json"), "{}")
  assert.equal(spawnSync(process.execPath, [script, "--verify", project]).status, 1)
  assert.equal(spawnSync(process.execPath, [script, "--mystery"]).status, 1)
  for (const args of [["--template"], ["--template", "music", "--all"], ["--verify", "x", "--input", "y"], ["--all", "--all"]]) {
    assert.throws(() => parseArguments(args))
  }
  assert.deepEqual(parseArguments([]), {})
})

test("the parent TypeScript project excludes generated projects and release packaging includes exporter dependencies", () => {
  assert.ok(readJson(join(root, "tsconfig.json")).exclude.includes("dist"))
  const files = new Set(readJson(join(root, "release/package-manifest.json")).files)
  for (const path of [...projectSourceFiles, "scripts/export-template-project.mjs", "tests/template-project-export.test.mjs", "docs/TEMPLATE-PROJECT-EXPORT.md"]) assert.ok(files.has(path), path)
})
