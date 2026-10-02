import { exportTemplateProjects } from "./export-template-project.mjs"
import { examplePortfolio } from "../lib/portfolio-content.ts"
import { writeFileSync } from "node:fs"
import { join } from "node:path"

if (process.argv.slice(2).some((argument) => !["--buyer", "--published"].includes(argument)) || process.argv.slice(2).length > 1) {
  throw new Error("Use no arguments for adversarial preview, --published for its publication fixture, or --buyer for the default delivery")
}
if (process.argv[2] === "--buyer") {
  const result = await exportTemplateProjects({ outputRoot: process.env.PORTFOLIO_EXPORT_ROOT, templateId: "portfolio" })
  process.stdout.write(`directory=${result.directory}/portfolio\n`)
} else {
const portfolio = structuredClone(examplePortfolio)
if (process.argv[2] === "--published") {
  // Synthetic test declarations only. Never archive this fixture as a buyer delivery.
  portfolio.cases[0].illustrative = false
}
portfolio.navigation = "N".repeat(100)
portfolio.practice = "P".repeat(100)
portfolio.disciplines = "D".repeat(160)
portfolio.contact.description = "C".repeat(600)
portfolio.contact.href = "mailto:designer+projects@example.com"
portfolio.cases[0].title = '<img src=x onerror="window.portfolioInjected=true">'
portfolio.cases[0].evidenceUrl = "https://example.com/evidence"
portfolio.cases.push({ ...portfolio.cases[0], title: "T".repeat(160), poster: "W".repeat(100) })
const inputText = JSON.stringify({ schemaVersion: "1.0.0", templateId: "portfolio", copy: {
  brand: "B".repeat(48), headline: "H".repeat(110), description: "D".repeat(280),
} })
const result = await exportTemplateProjects({ outputRoot: process.env.PORTFOLIO_EXPORT_ROOT, inputText, portfolioText: JSON.stringify(portfolio) })
if (process.argv[2] === "--published") {
  // Exercise the same file edit a buyer performs; original receipt describes pre-edit bytes.
  writeFileSync(join(result.directory, "portfolio", "content", "publication.json"), JSON.stringify({
    schemaVersion: "1.0.0", mode: "published", canonicalUrl: "https://example.com/portfolio", indexable: true,
  }, null, 2) + "\n")
}
process.stdout.write(`directory=${result.directory}/portfolio\n`)
}
