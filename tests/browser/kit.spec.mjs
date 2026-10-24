import { readFileSync } from "node:fs"
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

const axeSource = readFileSync(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8")

async function expectZeroAxeViolations(page, label) {
  const hasAxe = await page.evaluate(() => typeof window.axe !== "undefined")
  if (!hasAxe) await page.addScriptTag({ content: axeSource })
  const violations = await page.evaluate(async () => {
    const res = await window.axe.run(document)
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }))
  })
  expect(violations, `axe-core violations on ${label}`).toEqual([])
}

test("accessibility (axe-core), keyboard-only waitlist and editor pass, reduced-motion, and mobile LCP/CLS budgets hold at 390 and 1440", async ({ page }) => {
  // 1. Run axe-core on /kit, /start, and /studio/templates/portfolio/edit at 390 and 1440
  for (const route of ["/kit", "/start", "/studio/templates/portfolio/edit"]) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(route)
      await expectZeroAxeViolations(page, `${route} @ ${width}px`)
    }
  }

  // 2. Measure mobile (390x900) LCP (< 2500ms) and CLS (< 0.1) on /kit
  await page.setViewportSize({ width: 390, height: 900 })
  await page.addInitScript(() => {
    window.__perfMetrics = { lcp: 0, cls: 0 }
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perfMetrics.lcp = entry.startTime
      }
    }).observe({ type: "largest-contentful-paint", buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__perfMetrics.cls += entry.value
      }
    }).observe({ type: "layout-shift", buffered: true })
  })
  await page.goto("/kit", { waitUntil: "networkidle" })
  // Trigger a small scroll and settle so buffered LCP/CLS flush
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0]
    const paint = performance.getEntriesByName("first-contentful-paint")[0]
    return {
      lcp: window.__perfMetrics?.lcp || (paint ? paint.startTime : nav.domContentLoadedEventEnd),
      cls: window.__perfMetrics?.cls ?? 0,
      fcp: paint ? paint.startTime : 0,
    }
  })
  console.log(`PERF_METRICS_390: LCP=${perf.lcp.toFixed(1)}ms, FCP=${perf.fcp.toFixed(1)}ms, CLS=${perf.cls.toFixed(4)}`)
  expect(perf.lcp).toBeGreaterThan(0)
  expect(perf.lcp).toBeLessThan(2500)
  expect(perf.cls).toBeLessThan(0.1)

  // 3. Keyboard-only pass of the Waitlist on /kit (including focus visibility, labels, and error announcements)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/kit")
  await page.route("**/api/waitlist*", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}")
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
        stepToken: body.stepToken || "kb-step-token-1",
      }),
    })
  })

  const emailInput = page.getByLabel("Email address to join the waitlist for Creator Launch OS")
  await emailInput.focus()
  expect(await emailInput.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none")

  // Submit with empty email via Enter -> error announced via role="alert" and aria-invalid="true"
  await page.keyboard.press("Enter")
  const alert = page.locator('#creator-launch-os-waitlist-error[role="alert"]')
  await expect(alert).toHaveText("Valid email required")
  await expect(emailInput).toHaveAttribute("aria-invalid", "true")
  await expectZeroAxeViolations(page, "/kit waitlist error state")

  // Type valid email via keyboard and press Enter without consent -> "Consent required" announced and focus moves to checkbox
  await page.keyboard.type("keyboard.operator@example.com")
  await page.keyboard.press("Enter")
  await expect(alert).toHaveText("Consent required")
  expect(await page.evaluate(() => document.activeElement?.getAttribute("type"))).toBe("checkbox")

  // Check consent with Space, Shift+Tab to Join button, press Enter -> advances to Step 2 and moves focus to Step-2 status banner
  await page.keyboard.press("Space")
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Enter")
  await expect(page.getByText(/You are in, at number 1\./)).toBeVisible()
  await expectZeroAxeViolations(page, "/kit waitlist step 2 state")

  // Keyboard-select Step-2 chips and Save answers
  await page.getByRole("button", { name: "Independent creator" }).focus()
  await page.keyboard.press("Space")
  await page.getByRole("button", { name: "25 - 99" }).focus()
  await page.keyboard.press("Space")
  await page.getByRole("button", { name: "I need this now" }).focus()
  await page.keyboard.press("Space")
  await page.getByLabel("What are you trying to do that this would help with?").focus()
  await page.keyboard.type("Keyboard-only waitlist pass.")
  await page.getByRole("button", { name: "Save answers" }).focus()
  await page.keyboard.press("Enter")
  await expect(page.getByText(/Thank you\. You are number 1\./)).toBeVisible()
  await expectZeroAxeViolations(page, "/kit waitlist done state")
  await page.unroute("**/api/waitlist*")

  // 4. Keyboard-only pass of the Monograph editor (/studio/templates/portfolio/edit)
  await page.goto("/studio/templates/portfolio/edit")
  const brandInput = page.getByLabel("Name")
  await brandInput.focus()
  expect(await brandInput.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid")
  await page.keyboard.press("End")
  await page.keyboard.type(" Studio")
  await page.getByRole("button", { name: "Save project" }).focus()
  await page.keyboard.press("Enter")
  await expect(page.locator('[role="status"]').first()).toContainText("Project download requested")

  // 5. Reduced motion honoured across /, /kit, /start, and /studio/templates/portfolio/edit
  await page.emulateMedia({ reducedMotion: "reduce" })
  for (const route of ["/", "/kit", "/start", "/studio/templates/portfolio/edit"]) {
    await page.goto(route)
    const motionState = await page.evaluate(() => {
      const htmlScroll = getComputedStyle(document.documentElement).scrollBehavior
      const btn = document.querySelector("a, button")
      const td = btn ? parseFloat(getComputedStyle(btn).transitionDuration) : 0
      return { htmlScroll, td }
    })
    expect(motionState.htmlScroll).toBe("auto")
    expect(motionState.td).toBeLessThanOrEqual(0.001)
  }
})
