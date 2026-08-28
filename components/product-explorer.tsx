"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import { ProductCard } from "@/components/product-card"
import { productCategories, type Product } from "@/lib/products"

export function ProductExplorer({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<(typeof productCategories)[number]>("All")
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  const filteredProducts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return products.filter((product) => {
      const categoryMatches = category === "All" || product.category === category
      const queryMatches =
        normalizedQuery.length === 0 ||
        `${product.title} ${product.description} ${product.format} ${product.category}`
          .toLowerCase()
          .includes(normalizedQuery)

      return categoryMatches && queryMatches
    })
  }, [category, deferredQuery, products])

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-line py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter releases by format">
          {productCategories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === item
                  ? "bg-ink text-paper"
                  : "border border-ink/15 bg-transparent text-ink/65 hover:border-ink/35 hover:text-ink"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search releases</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search releases"
            className="min-h-11 w-full rounded-full border border-ink/15 bg-paper-bright py-2 pl-11 pr-11 text-sm outline-none transition-colors placeholder:text-muted focus:border-blue"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </label>
      </div>

      <p className="mt-5 font-mono text-[11px] tracking-[0.14em] text-muted" aria-live="polite">
        {filteredProducts.length} {filteredProducts.length === 1 ? "release" : "releases"}
      </p>

      {filteredProducts.length > 0 ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.slug} product={product} priority={index === 0 && filteredProducts.length > 1} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-ink/25 p-10 text-center">
          <p className="font-serif text-3xl">No release matches that signal.</p>
          <button
            type="button"
            onClick={() => {
              setCategory("All")
              setQuery("")
            }}
            className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper"
          >
            Reset the collection
          </button>
        </div>
      )}
    </div>
  )
}
