import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { formatPrice, type Product } from "@/lib/products"

const accentStyles = {
  coral: "bg-coral text-ink",
  acid: "bg-acid text-ink",
  blue: "bg-blue text-white",
} as const

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <article
      className={cn(
        "group grid overflow-hidden rounded-[1.5rem] border border-ink/15 bg-paper-bright transition-transform duration-300 hover:-translate-y-1",
        priority ? "lg:col-span-2 md:grid-cols-[0.9fr_1.1fr]" : "grid-rows-[auto_1fr]",
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        aria-label={`Open ${product.title}`}
        className={cn(
          "relative flex min-h-64 flex-col justify-between overflow-hidden p-5 sm:p-6",
          accentStyles[product.accent],
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="eyebrow opacity-70">Edition {product.edition}</span>
          <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
        </div>
        <div>
          <span className="font-mono text-[10px] tracking-[0.16em] opacity-65">{product.format}</span>
          <p className="mt-2 max-w-sm font-serif text-4xl leading-[0.98] sm:text-5xl">{product.title}</p>
        </div>
        <span aria-hidden="true" className="absolute -bottom-12 -right-8 font-serif text-[10rem] leading-none opacity-[0.08]">
          {product.edition}
        </span>
      </Link>

      <div className="flex flex-col justify-between p-5 sm:p-6">
        <div>
          <p className="eyebrow text-muted">{product.eyebrow}</p>
          <p className="mt-4 text-[15px] leading-7 text-ink/68">{product.description}</p>
        </div>
        <div className="mt-8 flex items-end justify-between gap-4 border-t border-line pt-4">
          <div>
            <p className="font-mono text-[10px] tracking-wider text-muted">One-time</p>
            <p className="mt-1 text-xl font-semibold">{formatPrice(product.price)}</p>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
          >
            Inspect release
          </Link>
        </div>
      </div>
    </article>
  )
}
