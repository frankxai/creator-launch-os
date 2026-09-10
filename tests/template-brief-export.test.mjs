import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { exportTemplateBriefs } from "../scripts/export-template-briefs.mjs"

test("offline brief export contains all six directions and verifiable file receipts", async (t) => {
  const outputRoot = mkdtempSync(join(tmpdir(), "creator-brief-export-test-"))
  t.after(() => rmSync(outputRoot, { recursive: true, force: true }))
  const first = await exportTemplateBriefs({ outputRoot })
  assert.equal(first.receipt.status, "BRIEFS_NOT_GENERATED_APPS")
  assert.equal(first.receipt.files.length, 13)
  for (const file of first.receipt.files) {
    const bytes = readFileSync(join(first.directory, file.name))
    assert.equal(bytes.length, file.bytes)
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256)
  }
  for (const id of ["music", "lab", "tool", "portfolio", "creator", "challenge"]) {
    const packet = JSON.parse(readFileSync(join(first.directory, `${id}-template.json`), "utf8"))
    assert.equal(packet.templateId, id)
    assert.equal(packet.generatedByV0, false)
    assert.ok(
      readFileSync(join(first.directory, `${id}-v0-brief.md`), "utf8").includes(
        packet.copy.headline,
      ),
    )
  }
  const readme = join(first.directory, "README.md")
  writeFileSync(readme, "A user-edited export")
  const second = await exportTemplateBriefs({ outputRoot })
  assert.notEqual(first.directory, second.directory)
  assert.equal(readFileSync(readme, "utf8"), "A user-edited export")
  assert.deepEqual(first.receipt, second.receipt)
})

test("the offline exporter and its test travel with the template package", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../release/package-manifest.json", import.meta.url), "utf8"),
  )
  for (const path of [
    "scripts/export-template-briefs.mjs",
    "tests/template-brief-export.test.mjs",
  ]) {
    assert.ok(manifest.files.includes(path))
  }
})
