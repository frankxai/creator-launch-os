import type { Metadata } from "next"

import { ProductExplorer } from "@/components/product-explorer"
import { products } from "@/lib/products"

export const metadata: Metadata = {
  title: "Releases",
  description: "Browse the sample digital releases included with Creator Launch OS.",
}

export default function ProductsPage() {
  return (
    <main id="main-content" className="py-16 sm:py-24">
      <div className="shell">
        <div className="max-w-4xl">
          <p className="eyebrow text-muted">Release library / sample content</p>
          <h1 className="text-balance mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">
            Products with enough detail to make a decision.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/62">
            Each release explains its format, delivery, contents, outcomes, and update date before asking for a purchase.
          </p>
        </div>
        <div className="mt-12">
          <ProductExplorer products={products} />
        </div>
      </div>
    </main>
  )
}
