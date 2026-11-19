import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import offer from "@/offer.facts.json"

// Operator-selected immutable fixture only. The request cannot choose a file.
export async function readTestKit(sku: string) {
  const revision = process.env.COMMERCE_TEST_KIT_REVISION
  const expectedHash = process.env.COMMERCE_TEST_KIT_SHA256
  if (process.env.COMMERCE_MODE !== "test" || process.env.VERCEL_ENV === "production" ||
      sku !== offer.sku_id || !revision || !/^[a-f0-9]{40}$/.test(revision) ||
      !expectedHash || !/^[a-f0-9]{64}$/.test(expectedHash)) return null
  const stem = "creator-launch-os-commercial-kit-" + offer.version + "-" + revision.slice(0, 12)
  const directory = join(process.cwd(), "dist", "kit", stem)
  const filename = stem + ".zip"
  try {
    const receipt = JSON.parse(await readFile(join(directory, "receipt.json"), "utf8"))
    if (receipt.sku_id !== sku || receipt.version !== offer.version || receipt.source?.revision !== revision ||
        receipt.artifact?.filename !== filename || receipt.artifact.sha256 !== expectedHash) return null
    const bytes = await readFile(join(directory, filename))
    if (receipt.artifact.bytes !== bytes.length || createHash("sha256").update(bytes).digest("hex") !== expectedHash) return null
    return { bytes: new Uint8Array(bytes), filename }
  } catch {
    return null
  }
}
