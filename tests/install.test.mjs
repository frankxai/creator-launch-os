import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const compiled = ts.transpileModule(read("lib/install.ts"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { starterSourceUrl, starterDeployUrl, localInstallCommands } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
)

test("deployment handoff exactly matches the canonical manifest and README", () => {
  const manifest = JSON.parse(read("template.manifest.json"))
  assert.equal(starterSourceUrl, manifest.sourceRepository)
  assert.equal(starterDeployUrl, manifest.deployUrl)
  assert.ok(read("README.md").includes(`](${starterDeployUrl})`))
  const url = new URL(starterDeployUrl)
  assert.equal(url.origin, "https://vercel.com")
  assert.equal(url.pathname, "/new/clone")
  assert.deepEqual([...url.searchParams.keys()].sort(), ["project-name", "repository-name", "repository-url"])
  assert.equal(url.searchParams.get("repository-url"), starterSourceUrl)
  assert.equal(url.searchParams.get("project-name"), "creator-launch-os")
  assert.equal(url.searchParams.get("repository-name"), "creator-launch-os")
})

test("local commands are inspectable, pinned-lockfile and non-destructive", () => {
  assert.equal(localInstallCommands, [
    "git clone https://github.com/frankxai/creator-launch-os.git",
    "cd creator-launch-os",
    "pnpm install --frozen-lockfile",
    "pnpm dev",
  ].join("\n"))
  assert.ok(read("README.md").includes(localInstallCommands))
})

test("installation is reachable, honest and server-rendered", () => {
  const page = read("app/start/page.tsx")
  assert.doesNotMatch(page, /["']use client["']/)
  assert.match(page, /href=\{starterDeployUrl\}/)
  assert.match(page, /Hosting terms and costs are separate/)
  assert.match(page, /does not carry edits/)
  assert.match(page, /Nothing here runs automatically/)
  assert.match(page, /templates\.map/)
  assert.match(read("lib/site.ts"), /href: "\/start"/)
  assert.match(read("app/page.tsx"), /Get the free starter/)
  assert.match(read("app/sitemap.ts"), /"\/start"/)
})

test("immutable delivery package includes the installation route and its dependency closure", () => {
  const files = JSON.parse(read("release/package-manifest.json")).files
  for (const file of [
    "app/start/page.tsx", "app/start/start.module.css", "lib/install.ts",
    "components/copy-install-command.tsx", "tests/install.test.mjs",
    "tests/browser/install.spec.mjs", "docs/INSTALL-EXPERIENCE.md",
    "docs/install-design-loop-evidence.json",
  ]) assert.ok(files.includes(file), `delivery must include ${file}`)
})
