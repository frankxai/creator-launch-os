import { test, expect } from "@playwright/test"
import { readFile } from "node:fs/promises"

const directions = ["music", "lab", "tool", "portfolio", "creator", "challenge"]

test("all studies and editors render at desktop, tablet and phone widths", async ({
  page,
}, info) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 })
    for (const id of directions) {
      const response = await page.goto(`/studio/templates/${id}`)
      expect(response.status()).toBe(200)
      await expect(page.locator("h1")).toHaveCount(1)
      await expect(page.locator(`[data-template="${id}"]`)).toBeVisible()
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex.*nofollow/,
      )
      await page.evaluate(() => document.fonts.ready)
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      ).toBe(true)
      await page.screenshot({
        path: info.outputPath(`${id}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      })
    }
    await page.goto("/studio/templates")
    await expect(
      page.getByRole("heading", { name: "Template atelier." }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    ).toBe(true)
    await page.screenshot({
      path: info.outputPath(`editor-${width}.png`),
      fullPage: true,
      animations: "disabled",
    })
  }
  for (const id of directions) {
    expect((await page.goto(`/studio/templates/${id}/edit`)).status()).toBe(200)
    await expect(page.locator(`[data-template="${id}"]`)).toBeVisible()
  }
  expect((await page.goto("/studio/templates/unknown-study")).status()).toBe(
    404,
  )
  expect(
    (await page.goto("/studio/templates/unknown-study/edit")).status(),
  ).toBe(404)
  expect(errors).toEqual([])
})

test("configuration round trips preserve other directions and restore keyboard focus", async ({
  page,
}) => {
  await page.goto("/studio/templates")
  const brand = page.locator("#template-brand")
  await brand.fill("Music edit to keep")
  await page.getByRole("button", { name: /02 Fieldwork/ }).click()
  await brand.fill("Research edit to keep")
  await page.getByRole("button", { name: /01 Afterhours/ }).click()
  await expect(brand).toHaveValue("Music edit to keep")

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export configuration" }).click()
  const download = await downloadPromise
  const packet = JSON.parse(await readFile(await download.path(), "utf8"))
  expect(download.suggestedFilename()).toBe("music-template.json")
  expect(packet.copy.brand).toBe("Music edit to keep")
  const incoming = {
    ...packet,
    copy: { ...packet.copy, brand: "Restored music" },
  }
  const fixture = {
    name: "music.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(incoming)),
  }
  const input = page.getByLabel("Choose an atelier configuration")
  await input.setInputFiles(fixture)
  await expect(
    page.getByRole("heading", { name: "Review Afterhours" }),
  ).toBeVisible()
  await expect(brand).toHaveValue("Music edit to keep")
  await page.getByRole("button", { name: "Cancel", exact: true }).press("Enter")
  await expect(input).toBeFocused()
  await expect(brand).toHaveValue("Music edit to keep")
  await input.setInputFiles(fixture)
  await page.getByRole("button", { name: "Apply this copy" }).press("Enter")
  await expect(brand).toBeFocused()
  await expect(brand).toHaveValue("Restored music")
  await page.getByRole("button", { name: /02 Fieldwork/ }).click()
  await expect(brand).toHaveValue("Research edit to keep")
  await input.setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  })
  await expect(page.locator("#import-status")).not.toContainText("Reading")
  await expect(
    page.getByRole("button", { name: "Apply this copy" }),
  ).toHaveCount(0)
  await expect(brand).toHaveValue("Research edit to keep")
})

test("selected audio plays from a local blob and can be removed without a network upload", async ({
  page,
}) => {
  await page.goto("/studio/templates/music")
  const outbound = []
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH"].includes(request.method()))
      outbound.push(request.url())
  })
  // A short, original PCM tone fixture; no private or third-party media.
  const samples = 8000
  const wav = Buffer.alloc(44 + samples * 2)
  wav.write("RIFF")
  wav.writeUInt32LE(wav.length - 8, 4)
  wav.write("WAVEfmt ", 8)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(8000, 24)
  wav.writeUInt32LE(16000, 28)
  wav.writeUInt16LE(2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write("data", 36)
  wav.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < samples; i++)
    wav.writeInt16LE(
      Math.round(Math.sin((i * 2 * Math.PI * 220) / 8000) * 1000),
      44 + i * 2,
    )
  await page
    .getByLabel("Choose an audio file")
    .setInputFiles({
      name: "local-tone.wav",
      mimeType: "audio/wav",
      buffer: wav,
    })
  const audio = page.locator("audio")
  await expect(audio).toHaveAttribute(
    "src",
    /^blob:http:\/\/127\.0\.0\.1:3106\//,
  )
  await expect
    .poll(() => audio.evaluate((element) => element.readyState))
    .toBeGreaterThan(0)
  await audio.evaluate(async (element) => {
    element.muted = true
    await element.play()
  })
  await expect
    .poll(() => audio.evaluate((element) => element.currentTime))
    .toBeGreaterThan(0)
  await page.getByRole("button", { name: "Remove audio file" }).click()
  await expect(audio).toHaveCount(0)
  expect(outbound).toEqual([])
})

test("reduced motion leaves the research content and keyboard disclosures usable", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/studio/templates/lab")
  const row = page.locator("details").first()
  await row.locator("summary").press("Enter")
  await expect(row).toHaveAttribute("open", "")
  await expect(row.locator("p")).toBeVisible()
  await expect(page.locator("[data-motion-item]").first()).toBeVisible()
  await page.screenshot({
    path: info.outputPath("lab-reduced-motion.png"),
    fullPage: true,
    animations: "disabled",
  })
})
