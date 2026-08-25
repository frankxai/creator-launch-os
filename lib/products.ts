export const productCategories = ["All", "Guide", "System", "Audio"] as const

export type ProductCategory = Exclude<(typeof productCategories)[number], "All">
export type ProductSlug = "systems-field-guide" | "launch-week-console" | "studio-notes"

export interface Product {
  slug: ProductSlug
  eyebrow: string
  title: string
  description: string
  longDescription: string
  category: ProductCategory
  format: string
  price: number
  accent: "coral" | "acid" | "blue"
  edition: string
  updatedAt: string
  delivery: string
  featured: boolean
  includes: string[]
  outcomes: string[]
}

export const products: Product[] = [
  {
    slug: "systems-field-guide",
    eyebrow: "Flagship field guide",
    title: "The Systems Field Guide",
    description:
      "A concise operating manual for turning scattered expertise into a product people can understand and use.",
    longDescription:
      "A practical release companion for independent experts. The guide moves from audience signal to offer architecture, production, launch, and the first useful feedback loop.",
    category: "Guide",
    format: "PDF + worksheets",
    price: 29,
    accent: "coral",
    edition: "01",
    updatedAt: "August 2026",
    delivery: "Instant digital delivery",
    featured: true,
    includes: [
      "72-page field guide",
      "Offer architecture worksheet",
      "Release-readiness scorecard",
      "Customer interview prompts",
    ],
    outcomes: [
      "Name the smallest valuable product you can ship",
      "Build a credible proof path before launch day",
      "Choose one activation metric that reflects real use",
    ],
  },
  {
    slug: "launch-week-console",
    eyebrow: "Release system",
    title: "Launch Week Console",
    description:
      "One operational view for assets, channels, dependencies, launch-day decisions, and the week-after review.",
    longDescription:
      "A calm control surface for small teams and solo creators. It makes dependencies visible, keeps launch content tied to evidence, and preserves decisions after the campaign ends.",
    category: "System",
    format: "Workspace + templates",
    price: 49,
    accent: "acid",
    edition: "02",
    updatedAt: "August 2026",
    delivery: "Workspace duplicate + files",
    featured: false,
    includes: [
      "Release command board",
      "Asset and channel registry",
      "Daily decision log",
      "Seven-day review template",
    ],
    outcomes: [
      "See the critical path without another meeting",
      "Separate launch signals from vanity activity",
      "Turn one release into a reusable operating loop",
    ],
  },
  {
    slug: "studio-notes",
    eyebrow: "Audio workshop",
    title: "Studio Notes: Ship With Signal",
    description:
      "A focused audio workshop on editing an ambitious product down to the version customers can actually activate.",
    longDescription:
      "Four short studio sessions about scope, proof, onboarding, and the discipline of the second release. Built for listening between work sessions, with a compact written companion.",
    category: "Audio",
    format: "4 audio sessions + notes",
    price: 19,
    accent: "blue",
    edition: "03",
    updatedAt: "August 2026",
    delivery: "Private audio feed + notes",
    featured: false,
    includes: [
      "Four studio conversations",
      "Annotated session notes",
      "Scope-cutting worksheet",
      "Second-release checklist",
    ],
    outcomes: [
      "Find the real activation moment",
      "Remove features that delay customer learning",
      "Plan the release after launch before launch day",
    ],
  },
]

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug)
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price)
}
