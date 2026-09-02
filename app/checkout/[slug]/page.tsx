import type { Metadata } from "next"
import { ArrowLeft, ArrowUpRight, LockKeyhole, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { catalog, checkoutHandoffHref, commerceState, formatPrice, getStorefrontProduct } from "@/lib/storefront/config"

export const metadata: Metadata = {
  title: "Checkout handoff",
  description: "How Creator Launch OS hands a buyer to a hosted checkout, and what it does when there is none.",
}

type CheckoutPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return catalog.map((product) => ({ slug: product.slug }))
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params
  const product = getStorefrontProduct(slug)

  if (!product) {
    notFound()
  }

  const forSale = commerceState(product) === "for-sale"
  const handoffHref = checkoutHandoffHref(product)

  return (
    <main id="main-content" className="py-12 sm:py-20">
      <div className="shell">
        <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to release
        </Link>

        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[2rem] border border-ink/15 bg-paper-bright">
          <div className="bg-ink px-6 py-5 text-paper sm:px-8">
            <div className="flex items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <LockKeyhole className="size-5 text-acid" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Checkout handoff</p>
                  <p className="mt-1 text-xs text-white/55">No payment is collected on this screen, ever</p>
                </div>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] tracking-wider text-white/55">
                {forSale ? product.checkoutHandoff.rail : "No rail"}
              </span>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_0.72fr]">
            <div>
              <p className="eyebrow text-muted">{forSale ? "Your buyer leaves here" : "Current state"}</p>
              <h1 className="mt-4 font-serif text-4xl leading-tight">{product.title}</h1>
              <p className="mt-4 text-sm leading-7 text-ink/62">{product.description}</p>

              {forSale && product.price && handoffHref ? (
                <>
                  <div className="mt-8 flex items-center justify-between border-y border-line py-4">
                    <span className="text-sm text-muted">{product.price.kind}</span>
                    <span className="text-xl font-semibold">{formatPrice(product.price)}</span>
                  </div>
                  <a
                    href={handoffHref}
                    rel="noopener"
                    className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper"
                  >
                    Continue on {product.checkoutHandoff.rail}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </>
              ) : (
                <div className="mt-8 border-y border-line py-5">
                  <p className="text-xl font-semibold">Not for sale yet</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{product.checkoutHandoff.note}</p>
                </div>
              )}
            </div>

            <aside className="rounded-[1.25rem] bg-paper p-5">
              <ShieldCheck className="size-6 text-blue" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">Open this product for sale</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Set both a price and a checkout rail on this product in <code className="font-mono text-xs">storefront.config.json</code>, then
                run the validator. One without the other is refused.
              </p>
              <code className="mt-5 block overflow-x-auto rounded-lg bg-ink p-3 font-mono text-[10px] leading-5 text-acid">
                node bin/validate-storefront.mjs
              </code>
              <p className="mt-4 text-xs leading-5 text-muted">
                Use hosted checkout URLs only. Never expose API keys in a public config file or a public environment variable.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </main>
  )
}
