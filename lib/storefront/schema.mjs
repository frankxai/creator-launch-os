/**
 * Storefront.v1 — the contract a Creator Launch OS storefront is built from.
 *
 * Eight node types: Release, Product, Price, CheckoutHandoff, Delivery, Proof,
 * Campaign, StudioMetric. Every node carries a `meta` block (owner, provenance,
 * version, visibility, evaluation) so a reader can tell an authored claim from a
 * measured one without leaving the file.
 *
 * Written as plain ESM with no dependencies so the same module validates the
 * config in the CLI, in `node --test`, and at render time.
 */

export const SCHEMA_ID = "storefront.v1"

export const NODE_TYPES = /** @type {const} */ ([
  "Release",
  "Product",
  "Price",
  "CheckoutHandoff",
  "Delivery",
  "Proof",
  "Campaign",
  "StudioMetric",
])

export const PROVENANCE = ["authored", "measured", "sample", "third-party"]
export const VISIBILITY = ["public", "private"]
export const RELEASE_STATUS = ["draft", "published", "retired"]
export const PRICE_KINDS = ["one-time", "subscription", "pay-what-you-want"]
export const CHECKOUT_RAILS = ["none", "polar", "whop", "gumroad", "etsy", "stripe", "lemonsqueezy", "other"]
export const PROOF_KINDS = ["sample", "source", "measurement", "attestation"]
export const ACCENTS = ["coral", "acid", "blue"]

const META_KEYS = ["owner", "provenance", "version", "visibility", "evaluation"]

const DISCLOSURE_MIN_LENGTH = 24

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

class Report {
  constructor() {
    /** @type {{code: string, path: string, message: string}[]} */
    this.errors = []
    /** @type {{code: string, path: string, message: string}[]} */
    this.warnings = []
  }

  error(code, path, message) {
    this.errors.push({ code, path, message })
  }

  warn(code, path, message) {
    this.warnings.push({ code, path, message })
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function requireKeys(report, node, path, required, optional = []) {
  if (!isPlainObject(node)) {
    report.error("E_NOT_AN_OBJECT", path, "expected an object")
    return false
  }

  const allowed = new Set([...required, ...optional])

  for (const key of required) {
    if (!(key in node)) {
      report.error("E_MISSING_KEY", `${path}.${key}`, `required key "${key}" is missing`)
    }
  }

  for (const key of Object.keys(node)) {
    if (!allowed.has(key)) {
      report.error(
        "E_UNKNOWN_KEY",
        `${path}.${key}`,
        `unknown key "${key}" — Storefront.v1 is closed, add it to the schema before using it`,
      )
    }
  }

  return true
}

function requireString(report, value, path, { min = 1, max = 4000 } = {}) {
  if (typeof value !== "string") {
    report.error("E_NOT_A_STRING", path, "expected a string")
    return false
  }
  if (value.trim().length < min) {
    report.error("E_STRING_TOO_SHORT", path, `expected at least ${min} characters of content`)
    return false
  }
  if (value.length > max) {
    report.error("E_STRING_TOO_LONG", path, `expected at most ${max} characters`)
    return false
  }
  return true
}

function requireEnum(report, value, path, allowed) {
  if (!allowed.includes(value)) {
    report.error("E_NOT_IN_ENUM", path, `expected one of ${allowed.join(", ")}`)
    return false
  }
  return true
}

function requireIsoDate(report, value, path) {
  if (typeof value !== "string" || !ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) {
    report.error("E_NOT_A_DATE", path, "expected a YYYY-MM-DD date")
    return false
  }
  return true
}

/**
 * A public URL a stranger's browser will follow. HTTPS only, no embedded
 * credentials — a rail URL with a username or password in it is a leaked secret
 * on a public page.
 */
function requirePublicHttpsUrl(report, value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    report.error("E_NOT_A_URL", path, "expected an https URL")
    return false
  }
  let url
  try {
    url = new URL(value)
  } catch {
    report.error("E_NOT_A_URL", path, "expected a parseable absolute URL")
    return false
  }
  if (url.protocol !== "https:") {
    report.error("E_INSECURE_URL", path, "expected https, a payment or evidence link may not be plain http")
    return false
  }
  if (url.username || url.password) {
    report.error("E_CREDENTIALS_IN_URL", path, "this URL carries credentials and must never ship to a public page")
    return false
  }
  return true
}

function validateMeta(report, meta, path) {
  if (!requireKeys(report, meta, path, META_KEYS)) return
  requireString(report, meta.owner, `${path}.owner`, { min: 2 })
  requireEnum(report, meta.provenance, `${path}.provenance`, PROVENANCE)
  requireString(report, meta.version, `${path}.version`, { min: 1 })
  requireEnum(report, meta.visibility, `${path}.visibility`, VISIBILITY)
  requireString(report, meta.evaluation, `${path}.evaluation`, { min: 12 })
}

function validatePrice(report, price, path) {
  if (!requireKeys(report, price, path, ["amount", "currency", "kind", "meta"])) return
  if (typeof price.amount !== "number" || !Number.isFinite(price.amount) || price.amount < 0) {
    report.error("E_NOT_A_PRICE", `${path}.amount`, "expected a non-negative number")
  }
  if (typeof price.currency !== "string" || !/^[A-Z]{3}$/.test(price.currency)) {
    report.error("E_NOT_A_CURRENCY", `${path}.currency`, "expected a three-letter ISO 4217 code, e.g. USD")
  }
  requireEnum(report, price.kind, `${path}.kind`, PRICE_KINDS)
  validateMeta(report, price.meta, `${path}.meta`)
}

function validateCheckoutHandoff(report, handoff, path) {
  if (!requireKeys(report, handoff, path, ["rail", "url", "note", "meta"])) return
  requireEnum(report, handoff.rail, `${path}.rail`, CHECKOUT_RAILS)
  requireString(report, handoff.note, `${path}.note`, { min: 8 })
  validateMeta(report, handoff.meta, `${path}.meta`)

  if (handoff.rail === "none") {
    if (handoff.url !== null) {
      report.error(
        "E_ORPHAN_HANDOFF_URL",
        `${path}.url`,
        'rail is "none" so url must be null — a URL with no rail is a checkout that goes nowhere',
      )
    }
    return
  }

  requirePublicHttpsUrl(report, handoff.url, `${path}.url`)
}

function validateDelivery(report, delivery, path) {
  if (!requireKeys(report, delivery, path, ["method", "timing", "whatArrives", "meta"])) return
  requireString(report, delivery.method, `${path}.method`, { min: 3 })
  requireString(report, delivery.timing, `${path}.timing`, { min: 3 })
  requireString(report, delivery.whatArrives, `${path}.whatArrives`, { min: 8 })
  validateMeta(report, delivery.meta, `${path}.meta`)
}

function validateProof(report, proof, path) {
  if (!requireKeys(report, proof, path, ["kind", "statement", "evidenceUrl", "verifiedAt", "meta"])) return
  requireEnum(report, proof.kind, `${path}.kind`, PROOF_KINDS)
  requireString(report, proof.statement, `${path}.statement`, { min: 12 })
  requireIsoDate(report, proof.verifiedAt, `${path}.verifiedAt`)
  validateMeta(report, proof.meta, `${path}.meta`)

  // A Proof without a link a reader can open is a testimonial, and this template
  // does not carry testimonials.
  requirePublicHttpsUrl(report, proof.evidenceUrl, `${path}.evidenceUrl`)
}

function validateAffiliate(report, affiliate, path) {
  if (!requireKeys(report, affiliate, path, ["network", "url", "disclosure", "meta"])) return
  requireString(report, affiliate.network, `${path}.network`, { min: 2 })
  requirePublicHttpsUrl(report, affiliate.url, `${path}.url`)
  validateMeta(report, affiliate.meta, `${path}.meta`)

  if (
    typeof affiliate.disclosure !== "string" ||
    affiliate.disclosure.trim().length < DISCLOSURE_MIN_LENGTH
  ) {
    report.error(
      "E_AFFILIATE_WITHOUT_DISCLOSURE",
      `${path}.disclosure`,
      `an affiliate link needs a disclosure of at least ${DISCLOSURE_MIN_LENGTH} characters that a reader will actually understand`,
    )
  }
}

function validateProduct(report, product, path, seenSlugs) {
  const required = [
    "slug",
    "title",
    "eyebrow",
    "description",
    "longDescription",
    "category",
    "format",
    "accent",
    "featured",
    "includes",
    "outcomes",
    "price",
    "checkoutHandoff",
    "delivery",
    "proofs",
    "affiliate",
    "meta",
  ]
  if (!requireKeys(report, product, path, required)) return

  if (requireString(report, product.slug, `${path}.slug`, { min: 2, max: 80 })) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) {
      report.error("E_NOT_A_SLUG", `${path}.slug`, "expected lowercase kebab-case")
    }
    if (seenSlugs.has(product.slug)) {
      report.error("E_DUPLICATE_ID", `${path}.slug`, `slug "${product.slug}" is already used`)
    }
    seenSlugs.add(product.slug)
  }

  requireString(report, product.title, `${path}.title`, { min: 3, max: 90 })
  requireString(report, product.eyebrow, `${path}.eyebrow`, { min: 3, max: 48 })
  requireString(report, product.description, `${path}.description`, { min: 24, max: 300 })
  requireString(report, product.longDescription, `${path}.longDescription`, { min: 40 })
  requireString(report, product.category, `${path}.category`, { min: 2, max: 24 })
  requireString(report, product.format, `${path}.format`, { min: 3, max: 60 })
  requireEnum(report, product.accent, `${path}.accent`, ACCENTS)

  if (typeof product.featured !== "boolean") {
    report.error("E_NOT_A_BOOLEAN", `${path}.featured`, "expected true or false")
  }

  for (const listKey of ["includes", "outcomes"]) {
    const list = product[listKey]
    if (!Array.isArray(list) || list.length === 0) {
      report.error("E_EMPTY_LIST", `${path}.${listKey}`, "expected at least one entry")
      continue
    }
    list.forEach((entry, index) => requireString(report, entry, `${path}.${listKey}[${index}]`, { min: 4 }))
  }

  if (product.price !== null) validatePrice(report, product.price, `${path}.price`)
  validateCheckoutHandoff(report, product.checkoutHandoff, `${path}.checkoutHandoff`)
  validateDelivery(report, product.delivery, `${path}.delivery`)

  if (!Array.isArray(product.proofs)) {
    report.error("E_NOT_A_LIST", `${path}.proofs`, "expected an array (use [] when there is no proof yet)")
  } else {
    product.proofs.forEach((proof, index) => validateProof(report, proof, `${path}.proofs[${index}]`))
  }

  if (product.affiliate !== null) validateAffiliate(report, product.affiliate, `${path}.affiliate`)

  validateMeta(report, product.meta, `${path}.meta`)

  // The two rules that keep the storefront honest, checked after both nodes are
  // individually valid.
  const rail = isPlainObject(product.checkoutHandoff) ? product.checkoutHandoff.rail : undefined

  if (product.price !== null && rail === "none") {
    report.error(
      "E_PRICE_WITHOUT_RAIL",
      `${path}.price`,
      "a price with no checkout rail is a promise the storefront cannot keep — set the rail, or set price to null and let the page say it is not for sale yet",
    )
  }

  if (product.price === null && rail !== "none" && CHECKOUT_RAILS.includes(rail)) {
    report.error(
      "E_RAIL_WITHOUT_PRICE",
      `${path}.checkoutHandoff.rail`,
      "a live rail with no price sends the buyer to a number they never saw",
    )
  }

  if (product.price === null && (!Array.isArray(product.proofs) || product.proofs.length === 0)) {
    report.warn(
      "W_NO_PROOF_YET",
      `${path}.proofs`,
      "this product is not for sale and carries no proof — a reader has nothing to evaluate",
    )
  }
}

function validateRelease(report, release, path, seenIds, seenSlugs) {
  const required = ["id", "edition", "title", "summary", "status", "publishedAt", "products", "meta"]
  if (!requireKeys(report, release, path, required)) return

  if (requireString(report, release.id, `${path}.id`, { min: 2, max: 80 })) {
    if (seenIds.has(release.id)) {
      report.error("E_DUPLICATE_ID", `${path}.id`, `release id "${release.id}" is already used`)
    }
    seenIds.add(release.id)
  }

  requireString(report, release.edition, `${path}.edition`, { min: 1, max: 8 })
  requireString(report, release.title, `${path}.title`, { min: 3, max: 90 })
  requireString(report, release.summary, `${path}.summary`, { min: 24 })
  requireEnum(report, release.status, `${path}.status`, RELEASE_STATUS)
  requireIsoDate(report, release.publishedAt, `${path}.publishedAt`)
  validateMeta(report, release.meta, `${path}.meta`)

  if (!Array.isArray(release.products) || release.products.length === 0) {
    report.error("E_EMPTY_LIST", `${path}.products`, "a release with no product is not a release")
    return
  }

  release.products.forEach((product, index) =>
    validateProduct(report, product, `${path}.products[${index}]`, seenSlugs),
  )
}

function validateCampaign(report, campaign, path, releaseIds, seenIds) {
  const required = ["id", "name", "releaseId", "channel", "startsAt", "endsAt", "goal", "meta"]
  if (!requireKeys(report, campaign, path, required)) return

  if (requireString(report, campaign.id, `${path}.id`, { min: 2, max: 80 })) {
    if (seenIds.has(campaign.id)) {
      report.error("E_DUPLICATE_ID", `${path}.id`, `campaign id "${campaign.id}" is already used`)
    }
    seenIds.add(campaign.id)
  }

  requireString(report, campaign.name, `${path}.name`, { min: 3, max: 90 })
  requireString(report, campaign.channel, `${path}.channel`, { min: 2, max: 48 })
  requireString(report, campaign.goal, `${path}.goal`, { min: 12 })
  requireIsoDate(report, campaign.startsAt, `${path}.startsAt`)
  if (campaign.endsAt !== null) requireIsoDate(report, campaign.endsAt, `${path}.endsAt`)
  validateMeta(report, campaign.meta, `${path}.meta`)

  if (!releaseIds.has(campaign.releaseId)) {
    report.error(
      "E_DANGLING_EDGE",
      `${path}.releaseId`,
      `no release with id "${campaign.releaseId}" — every campaign edge must land on a release node`,
    )
  }
}

function validateStudioMetric(report, metric, path, seenIds) {
  const required = ["id", "label", "value", "unit", "source", "measuredAt", "meta"]
  if (!requireKeys(report, metric, path, required)) return

  if (requireString(report, metric.id, `${path}.id`, { min: 2, max: 80 })) {
    if (seenIds.has(metric.id)) {
      report.error("E_DUPLICATE_ID", `${path}.id`, `metric id "${metric.id}" is already used`)
    }
    seenIds.add(metric.id)
  }

  requireString(report, metric.label, `${path}.label`, { min: 3, max: 60 })
  requireString(report, metric.value, `${path}.value`, { min: 1, max: 24 })
  if (metric.unit !== null) requireString(report, metric.unit, `${path}.unit`, { min: 1, max: 24 })
  requireIsoDate(report, metric.measuredAt, `${path}.measuredAt`)
  validateMeta(report, metric.meta, `${path}.meta`)

  const provenance = isPlainObject(metric.meta) ? metric.meta.provenance : undefined

  if (provenance === "measured") {
    // A measured number must name the instrument that produced it, or it is an
    // authored number wearing a lab coat.
    if (typeof metric.source !== "string" || metric.source.trim().length < 4) {
      report.error(
        "E_UNSOURCED_MEASUREMENT",
        `${path}.source`,
        'provenance is "measured" so source must name where the number came from',
      )
    }
  } else if (metric.source !== null && typeof metric.source !== "string") {
    report.error("E_NOT_A_STRING", `${path}.source`, "expected a string or null")
  }

  if (provenance === "sample" && !/sample|demo|example/i.test(metric.label)) {
    report.error(
      "E_SAMPLE_METRIC_UNLABELED",
      `${path}.label`,
      'provenance is "sample" so the visible label must say so — an unlabeled sample number reads as a real one',
    )
  }
}

/**
 * @param {unknown} config
 * @returns {{ok: boolean, errors: {code: string, path: string, message: string}[], warnings: {code: string, path: string, message: string}[]}}
 */
export function validateStorefront(config) {
  const report = new Report()

  if (!requireKeys(report, config, "config", ["schema", "brand", "releases", "campaigns", "studioMetrics"])) {
    return { ok: false, errors: report.errors, warnings: report.warnings }
  }

  if (config.schema !== SCHEMA_ID) {
    report.error("E_WRONG_SCHEMA", "config.schema", `expected "${SCHEMA_ID}"`)
  }

  if (requireKeys(report, config.brand, "config.brand", ["name", "tagline", "contactEmail", "meta"])) {
    requireString(report, config.brand.name, "config.brand.name", { min: 2, max: 60 })
    requireString(report, config.brand.tagline, "config.brand.tagline", { min: 12, max: 200 })
    if (config.brand.contactEmail !== null) {
      if (
        typeof config.brand.contactEmail !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.brand.contactEmail)
      ) {
        report.error("E_NOT_AN_EMAIL", "config.brand.contactEmail", "expected an email address or null")
      }
    }
    validateMeta(report, config.brand.meta, "config.brand.meta")
  }

  const releaseIds = new Set()
  const productSlugs = new Set()

  if (!Array.isArray(config.releases) || config.releases.length === 0) {
    report.error("E_EMPTY_LIST", "config.releases", "a storefront needs at least one release")
  } else {
    config.releases.forEach((release, index) =>
      validateRelease(report, release, `config.releases[${index}]`, releaseIds, productSlugs),
    )
  }

  const campaignIds = new Set()
  if (!Array.isArray(config.campaigns)) {
    report.error("E_NOT_A_LIST", "config.campaigns", "expected an array (use [])")
  } else {
    config.campaigns.forEach((campaign, index) =>
      validateCampaign(report, campaign, `config.campaigns[${index}]`, releaseIds, campaignIds),
    )
  }

  const metricIds = new Set()
  if (!Array.isArray(config.studioMetrics)) {
    report.error("E_NOT_A_LIST", "config.studioMetrics", "expected an array (use [])")
  } else {
    config.studioMetrics.forEach((metric, index) =>
      validateStudioMetric(report, metric, `config.studioMetrics[${index}]`, metricIds),
    )
  }

  return { ok: report.errors.length === 0, errors: report.errors, warnings: report.warnings }
}

/** True when this product may show a price and a buy control. */
export function isForSale(product) {
  return Boolean(product?.price) && product?.checkoutHandoff?.rail !== "none"
}
