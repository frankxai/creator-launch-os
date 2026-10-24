import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"

const root = new URL("../../", import.meta.url)
const offerUrl = new URL("offer.facts.json", root).href

/** Transpile the commerce modules into a throwaway directory and import them. */
export async function loadCommerce() {
  const dir = mkdtempSync(join(tmpdir(), "creator-commerce-"))
  process.once("exit", () => rmSync(dir, { recursive: true, force: true }))
  for (const name of ["engine", "config"]) {
    const source = readFileSync(new URL(`lib/commerce/${name}.ts`, root), "utf8")
    const output = ts
      .transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
      .outputText.replace('"@/lib/commerce/engine"', '"./engine.mjs"')
      .replace(/from "@\/offer\.facts\.json";?/, `from ${JSON.stringify(offerUrl)} with { type: "json" };`)
    writeFileSync(join(dir, `${name}.mjs`), output)
  }
  const engine = await import(pathToFileURL(join(dir, "engine.mjs")).href)
  const config = await import(pathToFileURL(join(dir, "config.mjs")).href)
  return { engine, config }
}
