import type { PortfolioContent } from "./portfolio-content"

export type SitePublication = {
  schemaVersion: "1.0.0"
  mode: "preview" | "published"
  canonicalUrl: string | null
  indexable: boolean
}

export const examplePublication: SitePublication = {
  schemaVersion: "1.0.0", mode: "preview", canonicalUrl: null, indexable: false,
}

/** Local presentation settings, never payment, rights or release approval. */
export function parseSitePublication(source: string, templateId: string, portfolio?: PortfolioContent): SitePublication {
  if (new TextEncoder().encode(source).byteLength > 4096) throw new Error("Publication settings must be no larger than 4 KiB.")
  let value: unknown
  try { value = JSON.parse(source) } catch { throw new Error("Publication settings must be valid JSON.") }
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Publication settings must be an object.")
  const settings = value as Record<string, unknown>
  if (settings.schemaVersion !== "1.0.0" || !["preview", "published"].includes(settings.mode as string) || typeof settings.indexable !== "boolean") {
    throw new Error("Publication settings require schemaVersion 1.0.0, mode preview or published, and an explicit indexable boolean.")
  }
  let canonicalUrl: string | null = null
  if (settings.canonicalUrl !== null) {
    const input = settings.canonicalUrl
    if (typeof input !== "string" || input.length > 2048 || /\s|%0[ad]/i.test(input)) throw new Error("Canonical URL must be HTTPS without credentials, query or fragment; use null for previews.")
    let url: URL
    try { url = new URL(input) } catch { throw new Error("Canonical URL must be a valid HTTPS URL.") }
    if (!input.startsWith("https://") || url.protocol !== "https:" || !url.hostname || url.username || url.password || url.search || url.hash) {
      throw new Error("Canonical URL must be HTTPS without credentials, query or fragment.")
    }
    canonicalUrl = url.href
  }
  if (settings.mode === "preview" && settings.indexable) throw new Error("Preview pages must remain noindex.")
  if (settings.mode === "published") {
    if (templateId !== "portfolio" || !portfolio) throw new Error("Published presentation is currently supported only for Monograph portfolios.")
    if (!canonicalUrl) throw new Error("Set the real canonical URL before selecting published presentation.")
    if (!portfolio.contact.href || portfolio.cases.some((entry) => entry.illustrative)) {
      throw new Error("Replace illustrative cases and configure the contact destination before selecting published presentation.")
    }
  }
  return { schemaVersion: "1.0.0", mode: settings.mode as SitePublication["mode"], canonicalUrl, indexable: settings.indexable }
}
