import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { readFile } from "node:fs/promises"
import path from "node:path"

const examples = path.resolve("public/delivery-proof/example")
for (const width of [320, 390, 1280]) {
  test("delivery proof at " + width + "px", async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/delivery-proof/index.html")
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.keyboard.press("Tab")
    await expect(page.locator(":focus")).toHaveText("Skip to file check")
    await page.keyboard.press("Enter")
    const audit = await new AxeBuilder({ page }).analyze()
    expect(audit.violations).toEqual([])
    await page.locator("#receipt").setInputFiles(path.join(examples, "receipt.json"))
    await page.locator("#file").setInputFiles(path.join(examples, "PRODUCT-CONTRACT.md"))
    await page.locator("#path").fill("docs/PRODUCT-CONTRACT.md")
    await page.getByRole("button", { name: "Compare files" }).click()
    await expect(page.getByRole("status")).toContainText("Match.")
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: "Save comparison record" }).click()
    const output = info.outputPath("comparison.json")
    await (await download).saveAs(output)
    const result = JSON.parse(await readFile(output, "utf8"))
    expect(result.matches).toBe(true)
    expect(result.actual_sha256).toBe(result.expected_sha256)
    await page.locator("#file").setInputFiles({ name: "modified.md", mimeType: "text/plain", buffer: Buffer.from("changed") })
    await expect(page.locator("#save")).toBeHidden()
    await page.getByRole("button", { name: "Compare files" }).click()
    await expect(page.getByRole("status")).toContainText("Mismatch.")
  })
}

test("accepts the commercial kit receipt format and rejects a different SKU", async ({ page }) => {
  const { createHash } = await import("node:crypto")
  const file = Buffer.from("operator fixture, no commercial content")
  const revision = "a".repeat(40)
  const kit = {
    schema_version:"1.0.0", sku_id:"sku_creator_launch_os_v1", version:"1.1.0", source:{revision}, files:[],
    artifact:{filename:"creator-launch-os-commercial-kit-1.1.0-aaaaaaaaaaaa.zip", bytes:file.length,
      sha256:createHash("sha256").update(file).digest("hex")}
  }
  await page.goto("/delivery-proof/index.html")
  await page.locator("#file").setInputFiles({name:"received.zip", mimeType:"application/zip", buffer:file})
  for (const [sku, output] of [["sku_creator_launch_os_v1","Match."], ["unrelated","Unable to compare."]]) {
    await page.locator("#receipt").setInputFiles({name:"receipt.json", mimeType:"application/json",
      buffer:Buffer.from(JSON.stringify({...kit, sku_id:sku}))})
    await page.getByRole("button", {name:"Compare files"}).click()
    await expect(page.getByRole("status")).toContainText(output)
  }
})
