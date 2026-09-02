import type { Metadata } from "next"
import { ArrowRight, Check, Circle, Radio, TrendingUp } from "lucide-react"
import Link from "next/link"

import { catalog, commerceState, releases, storefront } from "@/lib/storefront/config"

export const metadata: Metadata = {
  title: "Release Studio",
  description: "The sample operations view included with Creator Launch OS.",
}

const currentRelease = releases[0]
const forSaleCount = catalog.filter((product) => commerceState(product) === "for-sale").length

// Readiness is derived from the config, not asserted. A row can only read "Ready"
// because something in storefront.config.json makes it true.
const readiness = [
  { label: "Product pages", state: catalog.length > 0 ? "Ready" : "Empty" },
  {
    label: "Delivery described",
    state: catalog.every((product) => product.delivery.whatArrives.length > 0) ? "Ready" : "Missing",
  },
  { label: "Checkout rail", state: forSaleCount > 0 ? "Live" : "None" },
  {
    label: "Proof attached",
    state: catalog.every((product) => product.proofs.length > 0) ? "Ready" : "Partial",
  },
] as const

const tasks = [
  "Replace the sample releases in storefront.config.json",
  "Add a hosted checkout URL and a price to one product",
  "Send the clean-account delivery test before announcing",
] as const

export default function StudioPage() {
  return (
    <main id="main-content" className="bg-ink py-12 text-paper sm:py-20">
      <div className="shell">
        <div className="flex flex-col gap-7 border-b border-white/10 pb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-acid" aria-hidden="true" />
              <p className="eyebrow text-white/55">Sample operations view</p>
            </div>
            <h1 className="text-balance mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">Release Studio</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">A compact view of readiness, products, signals, and the next consequential work. All values below are labeled demo data.</p>
          </div>
          <Link href="/products" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-sm font-semibold text-ink">
            Open storefront
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-5 py-8 sm:grid-cols-3">
          {storefront.studioMetrics.map((metric) => (
            <div key={metric.id} className="border-l border-white/15 pl-5">
              <p className="font-mono text-4xl text-acid">
                {metric.value}
                {metric.unit ? <span className="text-2xl text-white/72"> {metric.unit}</span> : null}
              </p>
              <p className="mt-2 text-xs tracking-[0.14em] text-white/55">{metric.label}</p>
              <p className="mt-1 font-mono text-[10px] tracking-wider text-white/55">
                {metric.meta.provenance} · {metric.source ?? "no instrument"} · {metric.measuredAt}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="eyebrow text-white/55">Current release</p>
                <h2 className="mt-3 font-serif text-3xl">{currentRelease.title}</h2>
              </div>
              <span className="rounded-full bg-acid px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-ink">
                {currentRelease.meta.provenance}
              </span>
            </div>
            <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
              {readiness.map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-4">
                  {item.state === "Ready" ? <Check className="size-4 text-acid" aria-hidden="true" /> : <Circle className="size-3.5 text-coral" aria-hidden="true" />}
                  <span className="flex-1 text-sm text-white/72">{item.label}</span>
                  <span className="font-mono text-[10px] tracking-wider text-white/55">{item.state}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {catalog.map((product) => (
                <Link key={product.slug} href={`/products/${product.slug}`} className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5">
                  <p className="font-mono text-[10px] text-white/55">
                    {commerceState(product) === "for-sale" ? "For sale" : "Not for sale yet"}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-5">{product.title}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] bg-paper p-5 text-ink sm:p-7">
              <div className="flex items-center gap-3">
                <TrendingUp className="size-5 text-blue" aria-hidden="true" />
                <h2 className="text-lg font-semibold">Next consequential work</h2>
              </div>
              <ol className="mt-5 divide-y divide-line border-y border-line">
                {tasks.map((task, index) => (
                  <li key={task} className="grid grid-cols-[28px_1fr] gap-3 py-4 text-sm leading-6">
                    <span className="font-mono text-[10px] text-muted">0{index + 1}</span>
                    {task}
                  </li>
                ))}
              </ol>
            </section>
            <section className="rounded-[1.75rem] border border-white/10 p-5 sm:p-7">
              <p className="eyebrow text-white/55">Activation event</p>
              <p className="mt-4 text-2xl font-semibold tracking-tight">A customer reaches the promised file.</p>
              <p className="mt-4 text-sm leading-6 text-white/58">Replace page views with the event that proves delivery worked. Instrument it after connecting your provider.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
