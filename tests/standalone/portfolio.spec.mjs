import { test, expect } from "@playwright/test"

test("exported buyer content renders as text, fits each viewport and supports keyboard interaction", async ({ page }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const reducedMotion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion })
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect((await page.goto("/")).status()).toBe(200)
      const published = process.env.PORTFOLIO_PUBLICATION === "published"
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", published ? "index, follow" : "noindex, nofollow")
      if (published) {
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://example.com/portfolio")
        await expect(page.getByRole("link", { name: "About this example" })).toHaveCount(0)
        await expect(page.locator("#source-notes")).toHaveCount(0)
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("H".repeat(110))
      } else {
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
        await expect(page.getByRole("link", { name: "About this example" })).toBeVisible()
        await expect(page.locator("#source-notes")).toBeVisible()
      }
      await page.evaluate(() => document.fonts.ready)
      for (const item of await page.locator("[data-motion-item]").all()) await expect(item).toHaveCSS("opacity", "1")
      await expect(page.locator("#case-title-0")).toHaveText('<img src=x onerror="window.portfolioInjected=true">')
      await expect(page.locator("#case-title-0 img")).toHaveCount(0)
      expect(await page.evaluate(() => window.portfolioInjected)).toBeUndefined()
      await expect(page.locator("#case-title-1")).toHaveText("T".repeat(160))
      const summary = page.locator('section[aria-labelledby="case-title-0"] summary').first()
      await summary.focus()
      await summary.press("Enter")
      await expect(summary.locator("..")).toHaveAttribute("open", "")
      const contact = page.getByRole("link", { name: "Discuss a project" })
      await expect(contact).toHaveAttribute("href", "mailto:designer+projects@example.com")
      await contact.focus()
      await expect(contact).toBeFocused()
      expect(await contact.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid")
      expect((await contact.boundingBox()).height).toBeGreaterThanOrEqual(44)
      const overflow = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll("body *")].filter((node) => {
          const rect = node.getBoundingClientRect()
          return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1
        }).slice(0, 10).map((node) => ({ tag: node.tagName, className: node.className })),
      }))
      expect(overflow.scroll, JSON.stringify({ reducedMotion, width, overflow })).toBeLessThanOrEqual(overflow.width + 1)
    }
  }
  expect(errors).toEqual([])
})
