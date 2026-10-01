import { exportTemplateProjects } from "./export-template-project.mjs"
import { examplePortfolio } from "../lib/portfolio-content.ts"

const portfolio = structuredClone(examplePortfolio)
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
process.stdout.write(`directory=${result.directory}/portfolio\n`)
