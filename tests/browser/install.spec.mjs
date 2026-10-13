import { test, expect } from "@playwright/test"

test("setup stays usable across desktop, phone, keyboard and reduced motion", async ({ page }, info) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 900 })
    expect((await page.goto("/start")).status()).toBe(200)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Make it your own.")
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
    const deploy = page.getByRole("link", { name: "Deploy with Vercel" })
    const target = new URL(await deploy.getAttribute("href"))
    expect(target.origin).toBe("https://vercel.com")
    expect(target.searchParams.get("repository-url")).toBe("https://github.com/frankxai/creator-launch-os")
    expect((await deploy.boundingBox()).height).toBeGreaterThanOrEqual(44)
    expect((await page.getByRole("button", { name: "Copy commands" }).boundingBox()).height).toBeGreaterThanOrEqual(44)
    await page.screenshot({ path: info.outputPath(`install-${width}.png`), fullPage: true })
  }
  await page.emulateMedia({ reducedMotion: "reduce" })
  const deploy = page.getByRole("link", { name: "Deploy with Vercel" })
  await deploy.focus()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("link", { name: "Run locally instead" })).toBeFocused()
  await expect(deploy).toHaveCSS("transition-duration", "0s")
  expect(await page.getByRole("link", { name: "Run locally instead" }).evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none")
  await page.getByRole("link", { name: "Run locally instead" }).press("Enter")
  await expect(page).toHaveURL(/\/start#local$/)
  await page.screenshot({ path: info.outputPath("install-reduced-motion-local.png"), fullPage: true })
  expect(errors).toEqual([])
})

test("copy success, repeated requests and denied clipboard preserve focus and fallback", async ({ page }) => {
  await page.addInitScript(() => {
    window.installCopyCalls = []
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: (text) => {
        window.installCopyCalls.push(text)
        return new Promise((resolve, reject) => { window.finishInstallCopy = { resolve, reject } })
      },
    } })
  })
  await page.goto("/start#local")
  const copy = page.getByRole("button", { name: "Copy commands" })
  const commands = page.getByLabel("Local installation commands")
  await copy.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("status")).toHaveText("Copying…")
  // Rapid activation during the pending request must not start another write.
  await page.keyboard.press("Enter")
  expect(await page.evaluate(() => window.installCopyCalls.length)).toBe(1)
  expect(await page.evaluate(() => window.installCopyCalls[0])).toBe(await commands.inputValue())
  await page.evaluate(() => window.finishInstallCopy.resolve())
  await expect(page.getByRole("status")).toHaveText("Copied. Paste into your terminal when ready.")
  await expect(copy).toBeFocused()
  await page.keyboard.press("Enter")
  await page.evaluate(() => window.finishInstallCopy.reject(new Error("Permission denied")))
  await expect(page.getByRole("status")).toContainText("Select the commands above")
  await expect(copy).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(commands).toBeFocused()
  await expect(commands).toHaveAttribute("readonly", "")
  await commands.press("ControlOrMeta+A")
  expect(await commands.evaluate((el) => el.selectionEnd - el.selectionStart)).toBe((await commands.inputValue()).length)
})

test("setup links and local commands work with JavaScript disabled", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()
  try {
    expect((await page.goto("/start")).status()).toBe(200)
    await expect(page.getByRole("link", { name: "Deploy with Vercel" })).toBeVisible()
    await expect(page.getByLabel("Local installation commands")).toHaveValue(/pnpm install --frozen-lockfile/)
    for (const id of ["music", "lab", "tool", "portfolio", "creator", "challenge"]) {
      await expect(page.locator(`a[href="/studio/templates/${id}"]`)).toHaveCount(1)
    }
    await page.getByRole("link", { name: "Run locally instead" }).click()
    await expect(page).toHaveURL(/\/start#local$/)
  } finally {
    await context.close()
  }
})
