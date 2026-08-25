import type { Metadata } from "next"
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { formatPrice, getProduct } from "@/lib/products"

export const metadata: Metadata = {
  title: "Checkout preview",
  description: "A safe demonstration of the Creator Launch OS checkout handoff.",
}

type CheckoutPageProps = {
  params: Promise<{ slug: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params
  const product = getProduct(slug)

  if (!product) {
    notFound()
  }

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
                  <p className="text-sm font-semibold">Checkout preview</p>
                  <p className="mt-1 text-xs text-white/45">No payment is collected on this screen</p>
                </div>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/55">Demo mode</span>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_0.72fr]">
            <div>
              <p className="eyebrow text-muted">Order summary</p>
              <h1 className="mt-4 font-serif text-4xl leading-tight">{product.title}</h1>
              <p className="mt-4 text-sm leading-7 text-ink/62">{product.description}</p>
              <div className="mt-8 flex items-center justify-between border-y border-line py-4">
                <span className="text-sm text-muted">One-time purchase</span>
                <span className="text-xl font-semibold">{formatPrice(product.price)}</span>
              </div>
            </div>

            <aside className="rounded-[1.25rem] bg-paper p-5">
              <ShieldCheck className="size-6 text-blue" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">Connect your provider</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Add the matching public checkout URL in Vercel. The product page will then hand customers directly to your hosted checkout.
              </p>
              <code className="mt-5 block overflow-x-auto rounded-lg bg-ink p-3 font-mono text-[10px] leading-5 text-acid">
                NEXT_PUBLIC_CHECKOUT_*_URL
              </code>
              <p className="mt-4 text-xs leading-5 text-muted">Use hosted checkout URLs only. Never expose API keys in a public environment variable.</p>
            </aside>
          </div>
        </div>
      </div>
    </main>
  )
}
