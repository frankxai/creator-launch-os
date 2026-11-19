import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { loadCommerce } from "./support/load-commerce.mjs"

const { testKit: { readTestKit } } = await loadCommerce()
test("only the pinned test kit and entitlement SKU can select delivery bytes", async t => {
  const root = await mkdtemp(join(tmpdir(), "creator-private-file-"))
  const original = process.cwd()
  t.after(async () => { process.chdir(original); await rm(root, { recursive: true, force: true }) })
  process.chdir(root)
  const env = { COMMERCE_MODE:"test", VERCEL_ENV:"preview", COMMERCE_TEST_KIT_REVISION:"a".repeat(40) }
  const bytes = Buffer.from("versioned kit fixture")
  env.COMMERCE_TEST_KIT_SHA256 = createHash("sha256").update(bytes).digest("hex")
  for (const [key, value] of Object.entries(env)) {
    const old = process.env[key]
    t.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old })
    process.env[key] = value
  }
  const sku = "sku_creator_launch_os_v1"
  const stem = "creator-launch-os-commercial-kit-1.1.0-aaaaaaaaaaaa"
  const dir = join(root, "dist", "kit", stem)
  const filename = stem + ".zip"
  const receipt = { sku_id: sku, version:"1.1.0", source:{revision:env.COMMERCE_TEST_KIT_REVISION},
    artifact:{filename,bytes:bytes.length,sha256:env.COMMERCE_TEST_KIT_SHA256} }
  await mkdir(dir, {recursive:true})
  assert.equal(await readTestKit(sku), null)
  await writeFile(join(dir, "receipt.json"), JSON.stringify(receipt))
  await writeFile(join(dir, filename), bytes)
  assert.deepEqual(Buffer.from((await readTestKit(sku)).bytes), bytes)
  assert.equal(await readTestKit("other"), null)
  process.env.VERCEL_ENV = "production"
  assert.equal(await readTestKit(sku), null)
  process.env.VERCEL_ENV = "preview"
  process.env.COMMERCE_MODE = "live"
  assert.equal(await readTestKit(sku), null)
  process.env.COMMERCE_MODE = "test"
  await writeFile(join(dir, filename), Buffer.alloc(bytes.length))
  assert.equal(await readTestKit(sku), null)
  await writeFile(join(dir, filename), bytes)
  receipt.sku_id = "other"
  await writeFile(join(dir, "receipt.json"), JSON.stringify(receipt))
  assert.equal(await readTestKit(sku), null)
})
