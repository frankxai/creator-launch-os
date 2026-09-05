import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CONFIG = "release/package-manifest.json"
const REQUIRED = [
  ".env.example", ".gitignore", "LICENSE", "README.md", "package.json",
  "pnpm-lock.yaml", "pnpm-workspace.yaml", "template.manifest.json",
  "product.manifest.yaml", "marketplace.listing.yaml", CONFIG,
  "scripts/package-release.mjs",
]

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    env: { ...process.env, GIT_LITERAL_PATHSPECS: "1" },
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  })
}

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex")

function safePath(path) {
  if (typeof path !== "string" || !path || path.startsWith("/") || path.includes("\\") ||
      path.split("/").some((part) => !part || part === "." || part === "..") ||
      [...path].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
    throw new Error("Invalid package path: " + path)
  }
  const parts = path.toLowerCase().split("/")
  if (parts.some((part) => [".git", ".next", ".vercel", "node_modules"].includes(part)) ||
      parts.some((part) => part.startsWith(".env") && part !== ".env.example") ||
      /\.(?:pem|key|p12|pfx|keystore)$/i.test(path)) {
    throw new Error("Private or generated path cannot be packaged: " + path)
  }
}

/** Package immutable Git blobs. Passing this check never asserts a product release. */
export function buildRelease({ root = ROOT, output = join(root, "dist", "releases") } = {}) {
  const revision = git(root, ["rev-parse", "--verify", "HEAD"]).toString().trim()
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("A full Git commit is required")
  if (git(root, ["status", "--porcelain", "--untracked-files=all"]).length) {
    throw new Error("Commit or isolate working changes before packaging")
  }
  const source = (path) => git(root, ["show", revision + ":" + path])
  const config = JSON.parse(source(CONFIG).toString())
  const pkg = JSON.parse(source("package.json").toString())
  const template = JSON.parse(source("template.manifest.json").toString())
  if (config.schemaVersion !== "1.0.0" || !Array.isArray(config.files) || !config.files.length) {
    throw new Error("A versioned, non-empty file allowlist is required")
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pkg.name) ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version)) {
    throw new Error("Package name and version must be safe release identifiers")
  }
  if (template.version !== pkg.version || template.id !== pkg.name ||
      template.license !== "MIT" || pkg.license !== "MIT") {
    throw new Error("Package and template identity, version and MIT license must agree")
  }
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(template.sourceRepository)) {
    throw new Error("A canonical GitHub source repository is required")
  }
  const files = [...config.files].sort()
  files.forEach(safePath)
  if (new Set(files).size !== files.length) throw new Error("Duplicate package paths")
  for (const path of REQUIRED) {
    if (!files.includes(path)) throw new Error("Required delivery file is missing: " + path)
  }
  const tree = new Map(
    git(root, ["ls-tree", "-rz", "--full-tree", revision]).toString().split("\0").filter(Boolean)
      .map((entry) => {
        const [header, path] = entry.split("\t")
        return [path, header.split(" ")]
      }),
  )
  for (const [path] of tree) {
    if (/(^|\/)\.gitattributes$/.test(path) && /export-(ignore|subst)/.test(source(path).toString())) {
      throw new Error("Archive export transforms would invalidate file receipts: " + path)
    }
    if (/^(app|components|lib|public|scripts|tests|release)\//.test(path) && !files.includes(path)) {
      throw new Error("Update the allowlist for tracked product source: " + path)
    }
  }
  const inventory = files.map((path) => {
    const [mode, type] = tree.get(path) ?? []
    if (type !== "blob" || !["100644", "100755"].includes(mode)) {
      throw new Error("Delivery files must be tracked regular files: " + path)
    }
    const bytes = source(path)
    return { path, bytes: bytes.length, sha256: digest(bytes) }
  })
  const stem = pkg.name + "-" + pkg.version + "-" + revision.slice(0, 12)
  const archiveName = stem + ".zip"
  const archive = git(root, [
    "archive", "--format=zip", "--prefix=" + pkg.name + "/", revision, "--", ...files,
  ])
  const receipt = {
    schema_version: "1.0.0",
    state: "PACKAGED_NOT_RELEASED",
    name: pkg.name,
    version: pkg.version,
    license: pkg.license,
    source: { repository: template.sourceRepository, revision },
    artifact: { filename: archiveName, bytes: archive.length, sha256: digest(archive) },
    files: inventory,
    verification: {
      immutable_source: "passed",
      allowlist: "passed",
      application_checks: "not_asserted_by_packager",
      checkout_and_delivery: "not_verified",
      marketplace_submission: "not_performed",
      production: "not_verified",
    },
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
      throw new Error("Usage: node scripts/package-release.mjs [--out directory]")
    }
    const result = buildRelease(args.length ? { output: args[1] } : {})
    console.log("Packaged " + result.receipt.files.length + " files from " + result.receipt.source.revision)
    console.log(result.directory)
    console.log("PACKAGED_NOT_RELEASED — application and launch evidence remain separate")
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
