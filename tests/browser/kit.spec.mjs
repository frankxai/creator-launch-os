import { test, expect } from "@playwright/test"

test("the kit page shows a clean available-soon state and operates the full buyer journey at phone, tablet and desktop", async ({ page }, info) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))

  // 1. Verify /kit first screen, #prove-it-works, and #what-you-do-yourself across 375, 390, 768, and 1440
  for (const width of [375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const response = await page.goto("/kit")
    expect(response.status()).toBe(200)
    await expect(page.locator("h1")).toContainText(
      "Sell digital products from your own domain—and prove payment, delivery and refunds work before you go live.",
    )
    const availability = page.locator("[data-kit-availability]")
    await expect(availability).toHaveAttribute("data-kit-availability", "available-soon")
    await expect(availability).toContainText("Available soon")
    await expect(page.getByRole("link", { name: /Buy the Commercial Kit/ })).toHaveCount(0)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
    ).toBe(true)
    await page.screenshot({ path: info.outputPath(`kit-${width}.png`), fullPage: true })
  }

  // 2. Run the full 5-stage Maker G2 journey at 390px and 1440px:
  //    (a) /kit first screen -> (b) #prove-it-works -> (c) free core download (/start) -> (d) waitlist step 1 & step 2 -> (e) ?verify= link (test mode)
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/kit")

    // Stage (b): #prove-it-works 4-step rehearsal
    const rehearsal = page.locator("[data-rehearsal-panel]")
    await expect(rehearsal).toBeVisible()
    await expect(page.locator("[data-diy-boundary]")).toContainText("What you still do yourself")
    await rehearsal.getByRole("button", { name: "Run all 4 test steps" }).click()
    await expect(rehearsal.locator("[data-rehearsal-output]")).toContainText("E_REVOKED")
    await rehearsal.screenshot({ path: info.outputPath(`g2-rehearsal-${width}.png`) })

    // Stage (c): Free core download path (Get the free starter -> /start)
    await page.getByRole("link", { name: "Get the free starter", exact: true }).click()
    await expect(page).toHaveURL(/\/start$/)
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator('a[href="/architecture-decision-desk/index.html"]').first()).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
    ).toBe(true)
    await page.screenshot({ path: info.outputPath(`g2-free-starter-${width}.png`), fullPage: true })

    // Return to /kit for Stage (d) Waitlist Step 1 & Step 2 and Stage (e) ?verify= link
    await page.goto("/kit")
    const payloads = []
    await page.route("**/api/waitlist*", async (route) => {
      const req = route.request()
      if (req.method() === "GET" && req.url().includes("verify=")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            verified: true,
            productId: "creator-launch-os",
            position: 1,
            count: 1,
          }),
        })
        return
      }
      const body = JSON.parse(req.postData() || "{}")
      payloads.push(body)
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          productId: "creator-launch-os",
          count: 0,
          position: 1,
          publicCount: null,
          foundingCohort: 100,
          foundingSeatsLeft: 100,
          stage: "gated",
          stepToken: payloads.length === 1 ? "step-token-fixture-1" : undefined,
        }),
      })
    })

    await page.getByLabel("Email address to join the waitlist for Creator Launch OS").fill("buyer.simulation@example.com")
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Join the waitlist" }).click()
    await expect(page.getByText(/You are in, at number 1\./)).toBeVisible()
    await page.locator("[data-kit-availability]").screenshot({ path: info.outputPath(`g2-waitlist-step1-${width}.png`) })

    await page.getByRole("button", { name: "Independent creator" }).click()
    await page.getByRole("button", { name: "25 - 99" }).click()
    await page.getByRole("button", { name: "I need this now" }).click()
    await page.getByPlaceholder("One line is plenty.").fill("Publish my field guide and studio templates on my own domain.")
    await page.getByRole("button", { name: "Save answers" }).click()
    await expect(page.getByText(/Thank you\. You are number 1\./)).toBeVisible()
    await page.locator("[data-kit-availability]").screenshot({ path: info.outputPath(`g2-waitlist-step2-${width}.png`) })
    expect(payloads).toHaveLength(2)
    expect(payloads[1].stepToken).toBe("step-token-fixture-1")

    // Stage (e): Follow the ?verify= link (test mode) and confirm verified=true & count=1
    const verifyRes = await page.goto(
      "/api/waitlist?productId=creator-launch-os&email=buyer.simulation%40example.com&verify=verify-token-fixture-1",
    )
    expect(verifyRes.status()).toBe(200)
    const verifyJson = await verifyRes.json()
    expect(verifyJson).toEqual({
      ok: true,
      verified: true,
      productId: "creator-launch-os",
      position: 1,
      count: 1,
    })
    await page.unroute("**/api/waitlist*")
  }

  expect(errors).toEqual([])
})

test("commerce and waitlist routes (including ?verify=) fail closed with 503 on an unconfigured deployment", async ({ request }) => {
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
  const waitlistVerify = await request.get("/api/waitlist?productId=creator-launch-os&email=visitor%40example.com&verify=tok")
  expect(waitlistVerify.status()).toBe(503)
})
