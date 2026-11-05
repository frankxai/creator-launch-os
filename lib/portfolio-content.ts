export type PortfolioCase = {
  title: string
  category: string
  role: string
  poster: string
  summary: string
  context: string
  decision: string
  evidence: string
  evidenceUrl: string | null
  illustrative: boolean
}

export type PortfolioContent = {
  schemaVersion: "1.0.0"
  navigation: string
  practice: string
  disciplines: string
  introduction: string
  cases: PortfolioCase[]
  contact: { title: string; description: string; label: string; href: string | null }
}

export const examplePortfolio: PortfolioContent = {
  schemaVersion: "1.0.0",
  navigation: "Independent designer / Selected work",
  practice: "A considered practice",
  disciplines: "Design / Systems / Stories",
  introduction: "A short introduction",
  cases: [{
    title: "A publication that makes space for reading.",
    category: "Editorial design",
    role: "Example role: design and typography",
    poster: "Space for reading.",
    summary: "An illustrative case-study structure. Replace it with your own work, responsibilities and permission-cleared evidence.",
    context: "The brief: help readers distinguish a short note from a deep essay without making the archive feel like a software dashboard.",
    decision: "Use one strong reading column, an index that shows the shape of the archive, and typography that separates navigation from the author's voice.",
    evidence: "Add real before-and-after captures, your role and constraints, and permission to show the work. Claim an outcome only when it has evidence.",
    evidenceUrl: null,
    illustrative: true,
  }],
  contact: {
    title: "Start a conversation",
    description: "Add your own email address or contact page in content/portfolio.json before publishing.",
    label: "Discuss a project",
    href: null,
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function text(record: Record<string, unknown>, key: string, maximum: number): string {
  const value = record[key]
  if (typeof value !== "string" || !value.trim() || value.length > maximum ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    throw new Error(`Portfolio ${key} must be nonempty text of at most ${maximum} characters.`)
  }
  return value.trim()
}

/** Navigation only: no request, script, credential or form configuration crosses this boundary. */
function navigationUrl(value: unknown, allowEmail: boolean): string | null {
  if (value === null) return null
  if (typeof value !== "string" || value.length > 2048 || /\s|%0[ad]/i.test(value)) {
    throw new Error("Portfolio links must be HTTPS URLs or a plain contact email; use null to omit.")
  }
  if (allowEmail && /^mailto:[a-z0-9._+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(value)) {
    return value
  }
  let url: URL
  try { url = new URL(value) } catch { throw new Error("Portfolio link is not a valid URL.") }
  if (!value.startsWith("https://") || url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new Error("Portfolio links must use HTTPS without credentials.")
  }
  return url.href
}

/** Parse bounded buyer JSON as display data. Unknown properties are discarded. */
export function parsePortfolioContent(source: string): PortfolioContent {
  if (new TextEncoder().encode(source).byteLength > 64 * 1024) {
    throw new Error("Portfolio content must be no larger than 64 KiB.")
  }
  let value: unknown
  try { value = JSON.parse(source) } catch { throw new Error("Portfolio content is not valid JSON.") }
  if (!isRecord(value) || value.schemaVersion !== "1.0.0") {
    throw new Error("Portfolio content requires schemaVersion 1.0.0.")
  }
  if (!Array.isArray(value.cases) || value.cases.length < 1 || value.cases.length > 6) {
    throw new Error("Portfolio content requires one to six case studies.")
  }
  const cases = value.cases.map((entry): PortfolioCase => {
    if (!isRecord(entry) || typeof entry.illustrative !== "boolean") {
      throw new Error("Each portfolio case requires an explicit illustrative boolean.")
    }
    return {
      title: text(entry, "title", 160), category: text(entry, "category", 80),
      role: text(entry, "role", 160), poster: text(entry, "poster", 100),
      summary: text(entry, "summary", 600), context: text(entry, "context", 2000),
      decision: text(entry, "decision", 2000), evidence: text(entry, "evidence", 2000),
      evidenceUrl: navigationUrl(entry.evidenceUrl, false), illustrative: entry.illustrative,
    }
  })
  if (!isRecord(value.contact)) throw new Error("Portfolio contact content is required.")
  return {
    schemaVersion: "1.0.0", navigation: text(value, "navigation", 100),
    practice: text(value, "practice", 100), disciplines: text(value, "disciplines", 160),
    introduction: text(value, "introduction", 100), cases,
    contact: {
      title: text(value.contact, "title", 160), description: text(value.contact, "description", 600),
      label: text(value.contact, "label", 80), href: navigationUrl(value.contact.href, true),
    },
  }
}
