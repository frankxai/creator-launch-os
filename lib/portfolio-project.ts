import { copyLimits, parseTemplateImport, type TemplateCopy } from "./template-catalog.ts"
import { parsePortfolioContent, type PortfolioContent } from "./portfolio-content.ts"
import { parseSitePublication, type SitePublication } from "./site-publication.ts"

export type PortfolioProject = {
  schemaVersion: "1.0.0"
  format: "monograph-project"
  copy: TemplateCopy
  portfolio: PortfolioContent
  publication: SitePublication
}

export const portfolioProjectByteLimit = 256 * 1024
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

// Saved drafts may be incomplete. Only bounded display fields cross the import boundary.
function draftText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || value.length > maximum ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    throw new Error(`${label} must be text of at most ${maximum} characters.`)
  }
  return value
}

function draftLink(value: unknown, label: string): string | null {
  return value === null ? null : draftText(value, label, 2048)
}

/** Draft import is separate from publication validation; incomplete work can be saved safely. */
export function parsePortfolioProject(source: string): PortfolioProject {
  if (new TextEncoder().encode(source).byteLength > portfolioProjectByteLimit) {
    throw new Error("Choose a Monograph project no larger than 256 KiB.")
  }
  let value: unknown
  try { value = JSON.parse(source) } catch { throw new Error("Monograph project must be valid JSON.") }
  if (!record(value) || value.schemaVersion !== "1.0.0" || value.format !== "monograph-project" ||
      !record(value.copy) || !record(value.portfolio) || !record(value.publication)) {
    throw new Error("Choose a version 1.0.0 Monograph project.")
  }
  const copy = value.copy
  const portfolio = value.portfolio
  const publication = value.publication
  if (portfolio.schemaVersion !== "1.0.0" || !record(portfolio.contact) ||
      !Array.isArray(portfolio.cases) || portfolio.cases.length < 1 || portfolio.cases.length > 6) {
    throw new Error("A project requires one to six cases and contact content.")
  }
  if (publication.schemaVersion !== "1.0.0" ||
      !["preview", "published"].includes(publication.mode as string) || typeof publication.indexable !== "boolean") {
    throw new Error("Publication requires a supported mode and explicit indexing choice.")
  }
  const contact = portfolio.contact
  return {
    schemaVersion: "1.0.0", format: "monograph-project",
    copy: {
      brand: draftText(copy.brand, "Name", copyLimits.brand),
      headline: draftText(copy.headline, "Headline", copyLimits.headline),
      description: draftText(copy.description, "Description", copyLimits.description),
    },
    portfolio: {
      schemaVersion: "1.0.0",
      navigation: draftText(portfolio.navigation, "Navigation", 100),
      practice: draftText(portfolio.practice, "Practice", 100),
      disciplines: draftText(portfolio.disciplines, "Disciplines", 160),
      introduction: draftText(portfolio.introduction, "Introduction", 100),
      cases: portfolio.cases.map((entry) => {
        if (!record(entry) || typeof entry.illustrative !== "boolean") {
          throw new Error("Each case needs an explicit example declaration.")
        }
        return {
          title: draftText(entry.title, "Case title", 160),
          category: draftText(entry.category, "Category", 80),
          role: draftText(entry.role, "Role", 160),
          poster: draftText(entry.poster, "Poster", 100),
          summary: draftText(entry.summary, "Summary", 600),
          context: draftText(entry.context, "Context", 2000),
          decision: draftText(entry.decision, "Decision", 2000),
          evidence: draftText(entry.evidence, "Evidence", 2000),
          evidenceUrl: draftLink(entry.evidenceUrl, "Evidence URL"),
          illustrative: entry.illustrative,
        }
      }),
      contact: {
        title: draftText(contact.title, "Contact title", 160),
        description: draftText(contact.description, "Contact description", 600),
        label: draftText(contact.label, "Contact label", 80),
        href: draftLink(contact.href, "Contact destination"),
      },
    },
    publication: {
      schemaVersion: "1.0.0", mode: publication.mode as SitePublication["mode"],
      canonicalUrl: draftLink(publication.canonicalUrl, "Canonical URL"), indexable: publication.indexable,
    },
  }
}

/** Generate only fixed content paths after the same checks used by the built site. */
export function portfolioProjectFiles(draft: PortfolioProject) {
  const clean = parsePortfolioProject(JSON.stringify(draft))
  for (const [name, value] of Object.entries(clean.copy)) {
    if (!value.trim()) throw new Error(`Complete the ${name} before exporting site files.`)
  }
  const site = parseTemplateImport(JSON.stringify({ schemaVersion: "1.0.0", templateId: "portfolio", copy: clean.copy }))
  const portfolio = parsePortfolioContent(JSON.stringify(clean.portfolio))
  const publication = parseSitePublication(JSON.stringify(clean.publication), "portfolio", portfolio)
  return {
    "content/site.json": { schemaVersion: "1.0.0", templateId: "portfolio", copy: site.copy },
    "content/portfolio.json": portfolio,
    "content/publication.json": publication,
  }
}
