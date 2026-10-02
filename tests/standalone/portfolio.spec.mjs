import { test, expect } from "@playwright/test"
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"

test("exported buyer content renders as text, fits each viewport and supports keyboard interaction", async ({ page }) => {
  test.skip(process.env.PORTFOLIO_ROUNDTRIP_CHECK === "1", "This check uses the original adversarial fixture")
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
        await expect(page.getByRole("heading", { level: 2 })).toHaveCount(3)
        await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0)
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

async function saveProject(page) {
  const pending = page.waitForEvent("download")
  await page.getByRole("button", { name: "Save project", exact: true }).click()
  const download = await pending
  expect(await download.failure()).toBeNull()
  return { bytes: readFileSync(await download.path()), download }
}

test("workspace saves incomplete drafts, reviews imports, preserves removals and exports the completed project", async ({ page }) => {
  test.skip(process.env.PORTFOLIO_ROUNDTRIP_CHECK === "1", "Already exercised before the exported site rebuild")
  page.setDefaultTimeout(10000)
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  expect((await page.goto("/edit")).status()).toBe(200)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build your portfolio.")
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow")
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
  expect(await page.locator("[id]").evaluateAll((nodes) => {
    const ids = nodes.map((node) => node.id)
    return ids.filter((id, index) => ids.indexOf(id) !== index)
  })).toEqual([])
  if (process.env.PORTFOLIO_CAPTURE_DIR) {
    const directory = process.env.PORTFOLIO_CAPTURE_DIR
    mkdirSync(directory, { recursive: true })
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.evaluate(() => document.fonts.ready)
      const name = `monograph-workspace-${width}.png`
      const bytes = await page.screenshot({ path: join(directory, name), animations: "disabled" })
      const provenance = {
        $schema: "https://frankx.ai/schemas/vis-provenance-sidecar.schema.json",
        timestamp: new Date().toISOString(), asset_id: `monograph-workspace-${width}`, version_id: process.env.GITHUB_SHA,
        agent: "Codex", agent_session: "01a0f725-83df-7ef1-8bc0-2979b9f33cd6",
        provider: "Playwright", model: `Chromium ${page.context().browser().version()}`, seed: null,
        prompt: `Capture the actual standalone Monograph /edit route at ${width}x1000 with reduced motion. Use the versioned adversarial QA fixture; no generated imagery or marketing claims. Capture the initial editor before edits.`,
        source_method: "product-capture", source_path: "/edit", viewport: { width, height: 1000 },
        sha256: createHash("sha256").update(bytes).digest("hex"), image_path: name, sidecar_path: `${name}.vis.provenance.json`,
        rights: "Owned MIT product UI and synthetic test content", alt: `Monograph editor with identity fields and a portfolio preview at ${width}px`,
        review: "Unreviewed private QA capture; synthetic data, not customer evidence", placement: "private-release-review", public_release: false,
        schema_validation: "Unavailable: referenced public schema returned 404 on 2026-10-02",
      }
      writeFileSync(join(directory, provenance.sidecar_path), JSON.stringify(provenance, null, 2) + "\n", { flag: "wx" })
      appendFileSync(join(directory, "image-generation-ledger.jsonl"), JSON.stringify(provenance) + "\n")
    }
    await page.setViewportSize({ width: 1280, height: 900 })
  }
  await page.getByLabel("Name", { exact: true }).fill("Workspace buyer <literal>")
  await page.getByLabel("Headline", { exact: true }).fill("Thoughtful work, clearly explained.")
  await page.getByLabel("Description", { exact: true }).fill("A buyer-edited portfolio with supported case evidence.")
  await page.getByLabel("Navigation", { exact: true }).fill("My selected work")
  await page.getByLabel("Practice heading").fill("Design practice")
  await page.getByLabel("Disciplines", { exact: true }).fill("Research / Design / Delivery")
  await page.getByLabel("Introduction heading").fill("The work and the reasoning")
  const cases = page.locator('section[aria-labelledby="cases-title"]')
  await cases.locator("details").first().getByLabel("Title", { exact: true }).fill("")
  const incomplete = await saveProject(page)
  const incompleteJson = JSON.parse(incomplete.bytes)
  expect(incompleteJson.portfolio.cases[0].title).toBe("")
  await expect(page.getByText("Download validated site files", { exact: true })).toHaveCount(0)
  await page.getByLabel("Name", { exact: true }).fill("Current edits to preserve")
  await page.getByLabel("Choose a Monograph project").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from("{") })
  await expect(page.getByText("Monograph project must be valid JSON.", { exact: true })).toBeVisible()
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Current edits to preserve")
  await page.getByLabel("Choose a Monograph project").setInputFiles({ name: "saved.json", mimeType: "application/json", buffer: incomplete.bytes })
  await expect(page.getByRole("heading", { name: "Review incoming project" })).toBeVisible()
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Current edits to preserve")
  await page.getByRole("button", { name: "Cancel import" }).click()
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Current edits to preserve")
  await page.getByLabel("Choose a Monograph project").setInputFiles({ name: "saved.json", mimeType: "application/json", buffer: incomplete.bytes })
  await page.getByRole("button", { name: "Apply project" }).click()
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Workspace buyer <literal>")
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused()

  const first = cases.locator("details").first()
  for (const [label, value] of Object.entries({ Title: "A complete buyer case <literal>", Category: "Product design", "Your role": "Research and interface design",
    "Poster text": "Selected work", Summary: "A clear summary of the buyer's actual project.", Context: "Line one\nLine two", Decision: "A decision with a specific reason.", Evidence: "A permission-cleared reference and a measured result." })) {
    await first.getByLabel(label, { exact: true }).fill(value)
  }
  await first.getByLabel("Evidence URL (optional HTTPS)").fill("https://example.com/evidence")
  await page.getByRole("button", { name: "Add a case", exact: true }).click()
  await expect(cases.locator("details")).toHaveCount(3)
  await cases.locator("details").last().locator("summary").click()
  await cases.getByRole("button", { name: "Remove case 3", exact: true }).click()
  await expect(cases.locator("details")).toHaveCount(2)
  await page.getByRole("button", { name: "Undo removal" }).click()
  await expect(cases.locator("details")).toHaveCount(3)
  const third = cases.locator("details").last()
  if (await third.getAttribute("open") === null) await third.locator("summary").click()
  await cases.getByRole("button", { name: "Remove case 3", exact: true }).click()
  await expect(first.getByLabel("Title", { exact: true })).toHaveValue("A complete buyer case <literal>")
  await page.getByLabel("Contact heading").fill("Discuss your project")
  await page.getByLabel("Contact description").fill("Send a short brief to begin.")
  await page.getByLabel("Contact link label").fill("Email the practice")
  await page.getByLabel("Contact destination (HTTPS or plain mailto:)").fill("javascript:alert(1)")
  await expect(page.getByText("Download validated site files", { exact: true })).toHaveCount(0)
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0)
  await page.getByLabel("Contact destination (HTTPS or plain mailto:)").fill("mailto:roundtrip@example.com")
  await page.getByLabel("Presentation", { exact: true }).selectOption("published")
  await page.getByLabel("Your canonical HTTPS URL").fill("https://example.com/edited")
  for (const entry of await cases.locator("details").all()) {
    if (await entry.getAttribute("open") === null) await entry.locator("summary").click()
    await entry.getByLabel("This is an illustrative example").uncheck()
  }
  await page.getByLabel("Request search indexing").check()
  await expect(page.getByText("Download validated site files", { exact: true })).toBeVisible()
  const complete = await saveProject(page)
  const value = JSON.parse(complete.bytes)
  expect(value.copy.brand).toBe("Workspace buyer <literal>")
  expect(value.portfolio.cases).toHaveLength(2)
  expect(value.portfolio.cases[0].context).toBe("Line one\nLine two")
  expect(value.portfolio.contact.href).toBe("mailto:roundtrip@example.com")
  expect(value.publication).toEqual({ schemaVersion: "1.0.0", mode: "published", canonicalUrl: "https://example.com/edited", indexable: true })
  if (process.env.PORTFOLIO_ROUNDTRIP_FILE) writeFileSync(process.env.PORTFOLIO_ROUNDTRIP_FILE, complete.bytes, { flag: "wx" })
  await page.getByText("Download validated site files", { exact: true }).click()
  const siteDownload = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download content/site.json", exact: true }).click()
  expect(JSON.parse(readFileSync(await (await siteDownload).path(), "utf8")).copy).toEqual(value.copy)
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
  }
  expect(errors).toEqual([])
})

test("the site rebuilt from the browser's saved project renders the exact buyer edits", async ({ page }) => {
  test.skip(process.env.PORTFOLIO_ROUNDTRIP_CHECK !== "1", "Requires the browser download to be exported and built first")
  expect((await page.goto("/")).status()).toBe(200)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thoughtful work, clearly explained.")
  await expect(page.locator("#case-title-0")).toHaveText("A complete buyer case <literal>")
  await expect(page.getByRole("link", { name: "Email the practice" })).toHaveAttribute("href", "mailto:roundtrip@example.com")
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow")
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://example.com/edited")
  expect((await page.goto("/edit")).status()).toBe(200)
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Workspace buyer <literal>")
  await expect(page.getByLabel("Presentation", { exact: true })).toHaveValue("published")
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow")
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
})
