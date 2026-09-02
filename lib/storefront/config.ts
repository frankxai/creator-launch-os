import rawConfig from "@/storefront.config.json"

/**
 * Storefront.v1 — TypeScript view of the config validated by
 * `node bin/validate-storefront.mjs`. The JSON file is the source of truth; this
 * module only types it and derives the few states the UI needs.
 */

export type Provenance = "authored" | "measured" | "sample" | "third-party"
export type Visibility = "public" | "private"

export interface NodeMeta {
  owner: string
  provenance: Provenance
  version: string
  visibility: Visibility
  evaluation: string
}

export type CheckoutRail =
  | "none"
  | "polar"
  | "whop"
  | "gumroad"
  | "etsy"
  | "stripe"
  | "lemonsqueezy"
  | "other"

export interface Price {
  amount: number
  currency: string
  kind: "one-time" | "subscription" | "pay-what-you-want"
  meta: NodeMeta
}

export interface CheckoutHandoff {
  rail: CheckoutRail
  url: string | null
  note: string
  meta: NodeMeta
}

export interface Delivery {
  method: string
  timing: string
  whatArrives: string
  meta: NodeMeta
}

export interface Proof {
  kind: "sample" | "source" | "measurement" | "attestation"
  statement: string
  evidenceUrl: string
  verifiedAt: string
  meta: NodeMeta
}

export interface Affiliate {
  network: string
  url: string
  disclosure: string
  meta: NodeMeta
}

export interface StorefrontProduct {
  slug: string
  eyebrow: string
  title: string
  description: string
  longDescription: string
  category: string
  format: string
  accent: "coral" | "acid" | "blue"
  featured: boolean
  includes: string[]
  outcomes: string[]
  price: Price | null
  checkoutHandoff: CheckoutHandoff
  delivery: Delivery
  proofs: Proof[]
  affiliate: Affiliate | null
  meta: NodeMeta
}

export interface Release {
  id: string
  edition: string
  title: string
  summary: string
  status: "draft" | "published" | "retired"
  publishedAt: string
  products: StorefrontProduct[]
  meta: NodeMeta
}

export interface Campaign {
  id: string
  name: string
  releaseId: string
  channel: string
  startsAt: string
  endsAt: string | null
  goal: string
  meta: NodeMeta
}

export interface StudioMetric {
  id: string
  label: string
  value: string
  unit: string | null
  source: string | null
  measuredAt: string
  meta: NodeMeta
}

export interface StorefrontConfig {
  schema: "storefront.v1"
  brand: {
    name: string
    tagline: string
    contactEmail: string | null
    meta: NodeMeta
  }
  releases: Release[]
  campaigns: Campaign[]
  studioMetrics: StudioMetric[]
}

export const storefront = rawConfig as unknown as StorefrontConfig

export const releases = storefront.releases.filter((release) => release.status !== "draft")

/**
 * A product plus the release it belongs to, flattened for the storefront views.
 * Derived — the release node stays the owner of the edition and the date.
 */
export type CatalogEntry = StorefrontProduct & {
  releaseId: string
  edition: string
  publishedAt: string
}

export const catalog: CatalogEntry[] = releases.flatMap((release) =>
  release.products.map((product) => ({
    ...product,
    releaseId: release.id,
    edition: release.edition,
    publishedAt: release.publishedAt,
  })),
)

export function getStorefrontProduct(slug: string) {
  return catalog.find((product) => product.slug === slug)
}

export function releaseForProduct(slug: string) {
  return releases.find((release) => release.products.some((product) => product.slug === slug))
}

/**
 * The single commerce rule for the whole template: a product may show a price and
 * a buy control only when the creator supplied both a price and a rail. Anything
 * else renders as "not for sale yet" — never a button that leads nowhere.
 */
export type CommerceState = "for-sale" | "not-for-sale"

export function commerceState(product: StorefrontProduct): CommerceState {
  return product.price && product.checkoutHandoff.rail !== "none" ? "for-sale" : "not-for-sale"
}

export function checkoutHandoffHref(product: StorefrontProduct) {
  return commerceState(product) === "for-sale" ? product.checkoutHandoff.url : null
}

export function formatPrice(price: Price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: Number.isInteger(price.amount) ? 0 : 2,
  }).format(price.amount)
}

export const categories: string[] = ["All", ...new Set(catalog.map((product) => product.category))]
