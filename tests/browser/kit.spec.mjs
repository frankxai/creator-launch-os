import { test, expect } from "@playwright/test"

test("the kit page shows a clean available-soon state at phone, tablet and desktop", async ({ page }, info) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const response = await page.goto("/kit")
    expect(response.status()).toBe(200)
    await expect(page.locator("h1")).toHaveCount(1)
    const availability = page.locator("[data-kit-availability]")
    await expect(availability).toHaveAttribute("data-kit-availability", "available-soon")
    await expect(availability).toContainText("Available soon")
    await expect(page.getByRole("link", { name: /Buy the Commercial Kit/ })).toHaveCount(0)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
    ).toBe(true)
    await page.screenshot({ path: info.outputPath(`kit-${width}.png`), fullPage: true })
  }
  expect(errors).toEqual([])
})

test("commerce routes refuse every request on an unconfigured deployment", async ({ request }) => {
  const webhook = await request.post("/api/commerce/webhook", { data: {} })
  expect(webhook.status()).toBe(503)
  expect(await webhook.json()).toMatchObject({ state: "available_soon" })
  const delivery = await request.get("/api/commerce/delivery?token=x")
  expect(delivery.status()).toBe(503)
})
