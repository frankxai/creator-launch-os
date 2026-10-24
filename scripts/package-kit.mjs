import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MANIFEST = "commercial/kit/kit.manifest.json"

const git = (root, args) =>
  execFileSync("git", args, { cwd: root, env: { ...process.env, GIT_LITERAL_PATHSPECS: "1" }, maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")

/** Package the Commercial Kit from one clean commit. Never asserts a sale or a release. */
export function buildKit({ root = ROOT, output = join(root, "dist", "kit") } = {}) {
  const revision = git(root, ["rev-parse", "--verify", "HEAD"]).toString().trim()
  if (git(root, ["status", "--porcelain", "--untracked-files=all"]).length) {
    throw new Error("Commit or isolate working changes before packaging")
  }
  const source = (path) => git(root, ["show", revision + ":" + path])
  const manifest = JSON.parse(source(MANIFEST).toString())
  const facts = JSON.parse(source("offer.facts.json").toString())
  if (manifest.sku_id !== facts.sku_id) throw new Error("Kit manifest SKU must match offer.facts.json")
  if (manifest.license !== facts.kit.license) throw new Error("Kit manifest license must match offer.facts.json")
  const files = [...manifest.files].sort()
  if (new Set(files).size !== files.length) throw new Error("Duplicate kit paths")
  if (!files.includes(MANIFEST)) throw new Error("The kit manifest must ship inside the kit")
  for (const path of files) {
    if (!path.startsWith("commercial/") || path.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new Error("Kit files must live under commercial/: " + path)
    }
  }
  const tracked = git(root, ["ls-tree", "-r", "--name-only", "--full-tree", revision, "--", "commercial/kit"])
    .toString().split("\n").filter(Boolean)
  const unlisted = tracked.filter((path) => !files.includes(path))
  if (unlisted.length) throw new Error("Kit files missing from the manifest: " + unlisted.join(", "))
  const inventory = files.map((path) => {
    const bytes = source(path)
    return { path, bytes: bytes.length, sha256: digest(bytes) }
  })
  const stem = manifest.name + "-" + facts.version + "-" + revision.slice(0, 12)
  const archiveName = stem + ".zip"
  const archive = git(root, ["archive", "--format=zip", "--prefix=" + manifest.name + "/", revision, "--", ...files])
  const receipt = {
    schema_version: "1.0.0",
    state: "PACKAGED_NOT_RELEASED",
    sku_id: manifest.sku_id,
    version: facts.version,
    license: manifest.license,
    price_state: facts.price.state,
    source: { revision },
    artifact: { filename: archiveName, bytes: archive.length, sha256: digest(archive) },
    files: inventory,
    verification: { immutable_source: "passed", manifest_complete: "passed", sale: "not_performed", delivery_storage: "not_configured" },
  }
  const outputRoot = resolve(output)
  mkdirSync(outputRoot, { recursive: true })
  const temporary = mkdtempSync(join(outputRoot, ".packaging-"))
  const destination = join(outputRoot, stem)
  try {
    writeFileSync(join(temporary, archiveName), archive, { flag: "wx" })
    writeFileSync(join(temporary, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" })
    writeFileSync(join(temporary, "SHA256SUMS"), receipt.artifact.sha256 + "  " + archiveName + "\n", { flag: "wx" })
    renameSync(temporary, destination)
  } catch (error) {
    rmSync(temporary, { recursive: true, force: true })
    throw error
  }
  return { directory: destination, receipt }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    if (args.length && !(args.length === 2 && args[0] === "--out" && args[1])) {
      throw new Error("Usage: node scripts/package-kit.mjs [--out directory]")
    }
    const result = buildKit(args.length ? { output: args[1] } : {})
    console.log("Packaged " + result.receipt.files.length + " kit files from " + result.receipt.source.revision)
    console.log(result.directory)
    console.log("PACKAGED_NOT_RELEASED — the kit is not for sale until checkout and delivery are proven")
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
