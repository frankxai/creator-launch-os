import { test, expect } from "@playwright/test"

test("the kit page shows a clean available-soon state and operates the two-step waitlist at phone, tablet and desktop", async ({ page }, info) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const width of [375, 390, 768, 1440]) {
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

  // Intercept /api/waitlist to verify the client-side two-step flow and stepToken roundtrip
  const payloads = []
  await page.route("/api/waitlist", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}")
    payloads.push(body)
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        productId: "creator-launch-os",
        count: 1,
        position: 1,
        publicCount: null,
        foundingCohort: 100,
        foundingSeatsLeft: 99,
        stage: "gated",
        stepToken: payloads.length === 1 ? "step-token-fixture-1" : undefined,
      }),
    })
  })

  await page.getByLabel("Email address to join the waitlist for Creator Launch OS").fill("buyer.simulation@example.com")
  await page.getByRole("checkbox").check()
  await page.getByRole("button", { name: "Join the waitlist" }).click()
  await expect(page.getByText(/You are in, at number 1\./)).toBeVisible()
  await page.getByRole("button", { name: "Independent creator" }).click()
  await page.getByRole("button", { name: "25 - 99" }).click()
  await page.getByRole("button", { name: "I need this now" }).click()
  await page.getByPlaceholder("One line is plenty.").fill("Publish my field guide and studio templates on my own domain.")
  await page.getByRole("button", { name: "Save answers" }).click()
  await expect(page.getByText(/Thank you\. You are number 1\./)).toBeVisible()
  expect(payloads).toHaveLength(2)
  expect(payloads[1].stepToken).toBe("step-token-fixture-1")

  expect(errors).toEqual([])
})

test("commerce and waitlist routes fail closed with 503 on an unconfigured deployment", async ({ request }) => {
  const webhook = await request.post("/api/commerce/webhook", { data: {} })
  expect(webhook.status()).toBe(503)
  expect(await webhook.json()).toMatchObject({ state: "available_soon" })
  const delivery = await request.get("/api/commerce/delivery?token=x")
  expect(delivery.status()).toBe(503)
  const waitlistPost = await request.post("/api/waitlist", {
    data: { productId: "creator-launch-os", email: "visitor@example.com", consent: true },
  })
  expect(waitlistPost.status()).toBe(503)
  expect(await waitlistPost.json()).toMatchObject({ state: "waitlist_unconfigured" })
  const waitlistGet = await request.get("/api/waitlist?productId=creator-launch-os")
  expect(waitlistGet.status()).toBe(503)
})
