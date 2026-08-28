import type { Metadata } from "next"
import { ArrowLeft, ArrowRight, Check, Clock3, PackageCheck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getCheckoutHref, hasLiveCheckout } from "@/lib/checkout"
import { formatPrice, getProduct, products } from "@/lib/products"
import { cn } from "@/lib/utils"

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

const accentStyles = {
  coral: "bg-coral text-ink",
  acid: "bg-acid text-ink",
  blue: "bg-blue text-white",
} as const

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)

  if (!product) {
    return { title: "Release not found" }
  }

  return {
    title: product.title,
    description: product.description,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = getProduct(slug)

  if (!product) {
    notFound()
  }

  const checkoutHref = getCheckoutHref(product.slug)
  const isLiveCheckout = hasLiveCheckout(product.slug)

  return (
    <main id="main-content">
      <section className="border-b border-line py-8">
        <div className="shell">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All releases
          </Link>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="shell grid gap-10 py-12 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <div className={cn("relative flex min-h-[430px] flex-col justify-between overflow-hidden rounded-[2rem] p-7 sm:p-9", accentStyles[product.accent])}>
            <div className="flex items-start justify-between gap-5">
              <span className="eyebrow opacity-65">Edition {product.edition}</span>
              <span className="rounded-full border border-current/20 px-3 py-1 font-mono text-[10px] tracking-wider">{product.category}</span>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] opacity-60">{product.format}</p>
              <h1 className="text-balance mt-3 max-w-xl font-serif text-6xl leading-[0.92] sm:text-7xl">{product.title}</h1>
            </div>
            <span aria-hidden="true" className="absolute -bottom-16 -right-10 font-serif text-[15rem] leading-none opacity-[0.08]">{product.edition}</span>
          </div>

          <div className="flex flex-col justify-between py-2 lg:py-5">
            <div>
              <p className="eyebrow text-muted">{product.eyebrow}</p>
              <p className="text-balance mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">{product.description}</p>
              <p className="mt-6 max-w-2xl text-base leading-8 text-ink/62">{product.longDescription}</p>
            </div>

            <div className="mt-10 border-t border-line pt-6">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.15em] text-muted">One-time purchase</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight">{formatPrice(product.price)}</p>
                </div>
                <Link
                  href={checkoutHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
                >
                  {isLiveCheckout ? "Buy this release" : "Preview checkout"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              {!isLiveCheckout ? (
                <p className="mt-4 text-xs leading-5 text-muted">
                  Demo mode is active. No payment is collected until a checkout URL is configured.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper-bright py-16 sm:py-24">
        <div className="shell grid gap-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-muted">Inside the release</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Everything listed. Nothing implied.</h2>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {product.includes.map((item) => (
                <li key={item} className="flex items-center gap-3 py-4 text-[15px]">
                  <Check className="size-4 shrink-0 text-blue" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow text-muted">Designed outcome</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">The work this should change.</h2>
            <ol className="mt-8 space-y-5">
              {product.outcomes.map((outcome, index) => (
                <li key={outcome} className="grid grid-cols-[36px_1fr] gap-4 border-b border-line pb-5">
                  <span className="font-mono text-xs text-muted">0{index + 1}</span>
                  <span className="text-[15px] leading-7 text-ink/72">{outcome}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-line py-12">
        <div className="shell grid gap-6 sm:grid-cols-3">
          <div className="flex gap-3">
            <PackageCheck className="size-5 text-coral" aria-hidden="true" />
            <div><p className="text-sm font-semibold">Delivery</p><p className="mt-1 text-sm text-muted">{product.delivery}</p></div>
          </div>
          <div className="flex gap-3">
            <Clock3 className="size-5 text-coral" aria-hidden="true" />
            <div><p className="text-sm font-semibold">Last updated</p><p className="mt-1 text-sm text-muted">{product.updatedAt}</p></div>
          </div>
          <div>
            <p className="text-sm font-semibold">License</p>
            <p className="mt-1 text-sm text-muted">Personal use · sample policy</p>
          </div>
        </div>
      </section>
    </main>
  )
}
