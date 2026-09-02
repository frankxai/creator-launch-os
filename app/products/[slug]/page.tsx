import type { Metadata } from "next"
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Clock3, PackageCheck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  catalog,
  checkoutHandoffHref,
  commerceState,
  formatPrice,
  getStorefrontProduct,
  releaseForProduct,
} from "@/lib/storefront/config"
import { cn } from "@/lib/utils"

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

const accentStyles = {
  coral: "bg-coral text-ink",
  acid: "bg-acid text-ink",
  blue: "bg-blue text-ink",
} as const

export function generateStaticParams() {
  return catalog.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = getStorefrontProduct(slug)

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
  const product = getStorefrontProduct(slug)
  const release = releaseForProduct(slug)

  if (!product || !release) {
    notFound()
  }

  const forSale = commerceState(product) === "for-sale"
  const handoffHref = checkoutHandoffHref(product)

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
              <span className="eyebrow">Edition {release.edition}</span>
              <span className="rounded-full border border-current/20 px-3 py-1 font-mono text-[10px] tracking-wider">{product.category}</span>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em]">{product.format}</p>
              <h1 className="text-balance mt-3 max-w-xl font-serif text-6xl leading-[0.92] sm:text-7xl">{product.title}</h1>
            </div>
            <span aria-hidden="true" className="absolute -bottom-16 -right-10 font-serif text-[15rem] leading-none opacity-[0.08]">{release.edition}</span>
          </div>

          <div className="flex flex-col justify-between py-2 lg:py-5">
            <div>
              <p className="eyebrow text-muted">{product.eyebrow}</p>
              <p className="text-balance mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">{product.description}</p>
              <p className="mt-6 max-w-2xl text-base leading-8 text-ink/62">{product.longDescription}</p>
            </div>

            <div className="mt-10 border-t border-line pt-6">
              {forSale && product.price && handoffHref ? (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.15em] text-muted">{product.price.kind}</p>
                      <p className="mt-1 text-4xl font-semibold tracking-tight">{formatPrice(product.price)}</p>
                    </div>
                    <a
                      href={handoffHref}
                      rel="noopener"
                      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
                    >
                      Buy on {product.checkoutHandoff.rail}
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-muted">
                    Payment is handled entirely by {product.checkoutHandoff.rail}. This storefront never sees a card.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.15em] text-muted">Status</p>
                      <p className="mt-1 text-4xl font-semibold tracking-tight">Not for sale yet</p>
                    </div>
                    <Link
                      href={`/checkout/${product.slug}`}
                      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/20 px-6 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
                    >
                      Why not
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                  <p className="mt-4 max-w-xl text-xs leading-5 text-muted">{product.checkoutHandoff.note}</p>
                </>
              )}

              {product.affiliate ? (
                <div className="mt-6 rounded-xl border border-ink/15 p-4">
                  <a
                    href={product.affiliate.url}
                    rel="noopener sponsored nofollow"
                    className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  >
                    {product.affiliate.network}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                  <p className="mt-2 text-xs leading-5 text-muted">{product.affiliate.disclosure}</p>
                </div>
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

      {product.proofs.length > 0 ? (
        <section className="border-t border-line py-16">
          <div className="shell">
            <p className="eyebrow text-muted">Proof</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em]">
              Every claim below links to something you can open.
            </h2>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {product.proofs.map((proof) => (
                <li key={proof.evidenceUrl} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-[15px] leading-7 text-ink/72">{proof.statement}</p>
                    <p className="mt-1 font-mono text-[10px] tracking-wider text-muted">
                      {proof.kind} · verified {proof.verifiedAt}
                    </p>
                  </div>
                  <a
                    href={proof.evidenceUrl}
                    rel="noopener"
                    className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  >
                    Open the evidence
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="border-y border-line py-12">
        <div className="shell grid gap-6 sm:grid-cols-3">
          <div className="flex gap-3">
            <PackageCheck className="size-5 text-coral" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Delivery</p>
              <p className="mt-1 text-sm text-muted">{product.delivery.method}</p>
              <p className="mt-1 text-sm text-muted">{product.delivery.whatArrives}</p>
              <p className="mt-1 text-sm text-muted">{product.delivery.timing}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock3 className="size-5 text-coral" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Release</p>
              <p className="mt-1 text-sm text-muted">
                {release.title} · published {release.publishedAt}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Provenance</p>
            <p className="mt-1 text-sm text-muted">
              {product.meta.provenance} · owned by {product.meta.owner} · v{product.meta.version}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
