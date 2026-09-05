import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { test } from "node:test"
import { inflateRawSync } from "node:zlib"
import { buildRelease } from "../scripts/package-release.mjs"

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex")
const git = (root, args) => execFileSync("git", args, { cwd: root, stdio: "pipe" })
const write = (root, path, content) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), content)
}
const commit = (root) => {
  git(root, ["add", "."])
  git(root, ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Fixture"])
}
function fixture(t, change = () => {}) {
  const root = mkdtempSync(join(tmpdir(), "creator-package-test-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  git(root, ["init", "-q"])
  const files = {
    ".env.example": "NEXT_PUBLIC_SITE_URL=\n",
    ".gitignore": ".env*\n!.env.example\ndist/\n",
    LICENSE: "MIT fixture\n",
    "README.md": "Fixture storefront\n",
    "package.json": JSON.stringify({ name: "creator-launch-os", version: "1.1.0", license: "MIT" }),
    "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
    "pnpm-workspace.yaml": "packages: []\n",
    "template.manifest.json": JSON.stringify({
      id: "creator-launch-os", version: "1.1.0", license: "MIT",
      sourceRepository: "https://github.com/frankxai/creator-launch-os",
    }),
    "product.manifest.yaml": "product_id: product_creator_launch_os\n",
    "marketplace.listing.yaml": "state: draft\n",
    "scripts/package-release.mjs": "// fixture\n",
    "app/products/[slug]/page.tsx": "export default function Page() { return 'fixture' }\n",
  }
  const config = { schemaVersion: "1.0.0", files: [...Object.keys(files), "release/package-manifest.json"] }
  for (const [path, content] of Object.entries(files)) write(root, path, content)
  change({ root, config, files })
  write(root, "release/package-manifest.json", JSON.stringify(config))
  commit(root)
  return root
}

// Read the ZIP central directory independently of Git and the packager.
function unzip(bytes) {
  let end = bytes.length - 22
  while (end >= 0 && bytes.readUInt32LE(end) !== 0x06054b50) end--
  assert.ok(end >= 0, "ZIP end record must exist")
  const count = bytes.readUInt16LE(end + 10)
  let cursor = bytes.readUInt32LE(end + 16)
  const entries = new Map()
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50)
    const method = bytes.readUInt16LE(cursor + 10)
    const size = bytes.readUInt32LE(cursor + 20)
    const nameSize = bytes.readUInt16LE(cursor + 28)
    const extraSize = bytes.readUInt16LE(cursor + 30)
    const commentSize = bytes.readUInt16LE(cursor + 32)
    const local = bytes.readUInt32LE(cursor + 42)
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameSize).toString()
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28)
    const compressed = bytes.subarray(start, start + size)
    assert.ok([0, 8].includes(method))
    if (!name.endsWith("/")) entries.set(name, method === 8 ? inflateRawSync(compressed) : compressed)
    cursor += 46 + nameSize + extraSize + commentSize
  }
  return entries
}

test("delivery ZIP is repeatable and every extracted byte matches its receipt", (t) => {
  const root = fixture(t)
  const first = buildRelease({ root, output: join(root, "dist", "first") })
  const second = buildRelease({ root, output: join(root, "dist", "second") })
  const bytes = readFileSync(join(first.directory, first.receipt.artifact.filename))
  assert.deepEqual(bytes, readFileSync(join(second.directory, second.receipt.artifact.filename)))
  assert.deepEqual(first.receipt, second.receipt)
  assert.equal(hash(bytes), first.receipt.artifact.sha256)
  assert.equal(first.receipt.source.revision, git(root, ["rev-parse", "HEAD"]).toString().trim())
  const entries = unzip(bytes)
  assert.equal(entries.size, first.receipt.files.length)
  for (const file of first.receipt.files) {
    const value = entries.get("creator-launch-os/" + file.path)
    assert.ok(value, "Every allowed file, including literal [slug] paths, must arrive")
    assert.equal(value.length, file.bytes)
    assert.equal(hash(value), file.sha256)
  }
  assert.equal(first.receipt.state, "PACKAGED_NOT_RELEASED")
  assert.equal(first.receipt.verification.production, "not_verified")
})

test("ignored local credentials and generated files never enter the ZIP", (t) => {
  const root = fixture(t)
  write(root, ".env.local", "PRIVATE_FIXTURE=do-not-package\n")
  write(root, "dist/private.txt", "not a delivery file\n")
  const result = buildRelease({ root })
  const entries = unzip(readFileSync(join(result.directory, result.receipt.artifact.filename)))
  assert.ok(entries.has("creator-launch-os/.env.example"))
  assert.ok(![...entries.keys()].some((name) => name.includes(".env.local") || name.includes("private.txt")))
})

test("dirty or untracked source cannot silently masquerade as the committed package", (t) => {
  const root = fixture(t)
  write(root, "README.md", "uncommitted content")
  assert.throws(() => buildRelease({ root }), /Commit or isolate/)
  git(root, ["checkout", "--", "README.md"])
  write(root, "app/new.tsx", "untracked source")
  assert.throws(() => buildRelease({ root }), /Commit or isolate/)
})

for (const path of ["../private.txt", "/tmp/private.txt", ".env.production", "private.key", "node_modules/secret.js"]) {
  test("unsafe delivery path is rejected: " + path, (t) => {
    const root = fixture(t, ({ config }) => config.files.push(path))
    assert.throws(() => buildRelease({ root }), /Invalid package path|cannot be packaged/)
  })
}

test("a missing license or duplicated path blocks packaging", (t) => {
  const missing = fixture(t, ({ config }) => { config.files = config.files.filter((path) => path !== "LICENSE") })
  assert.throws(() => buildRelease({ root: missing }), /Required delivery file/)
  const duplicate = fixture(t, ({ config }) => config.files.push("README.md"))
  assert.throws(() => buildRelease({ root: duplicate }), /Duplicate package/)
})

test("symlinks cannot turn an allowed file into an external read", (t) => {
  const root = fixture(t, ({ root, config }) => {
    symlinkSync("/etc/hosts", join(root, "symlink.txt"))
    config.files.push("symlink.txt")
  })
  assert.throws(() => buildRelease({ root }), /tracked regular files/)
})

test("version drift blocks a misleading archive label", (t) => {
  const root = fixture(t, ({ root }) => write(root, "package.json",
    JSON.stringify({ name: "creator-launch-os", version: "1.0.0", license: "MIT" })))
  assert.throws(() => buildRelease({ root }), /identity, version and MIT license/)
})

test("new tracked application files require a deliberate allowlist update", (t) => {
  const root = fixture(t, ({ root }) => write(root, "app/new.tsx", "new source"))
  assert.throws(() => buildRelease({ root }), /Update the allowlist/)
})

test("Git export transforms cannot remove or rewrite receipted bytes", (t) => {
  const root = fixture(t, ({ root }) => write(root, ".gitattributes", "README.md export-ignore\n"))
  assert.throws(() => buildRelease({ root }), /export transforms/)
})

test("a prior delivery package is preserved on a duplicate build", (t) => {
  const root = fixture(t)
  const result = buildRelease({ root })
  const receipt = readFileSync(join(result.directory, "receipt.json"))
  assert.throws(() => buildRelease({ root }))
  assert.deepEqual(readFileSync(join(result.directory, "receipt.json")), receipt)
})
