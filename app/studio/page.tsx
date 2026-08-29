import type { Metadata } from "next"
import { ArrowRight, Check, Circle, Radio, TrendingUp } from "lucide-react"
import Link from "next/link"

import { products } from "@/lib/products"

export const metadata: Metadata = {
  title: "Release Studio",
  description: "The sample operations view included with Creator Launch OS.",
}

const readiness = [
  { label: "Product page", state: "Ready" },
  { label: "Delivery test", state: "Ready" },
  { label: "Checkout", state: "Demo" },
  { label: "Launch note", state: "Draft" },
] as const

const tasks = [
  "Connect the production checkout URL",
  "Replace sample customer questions",
  "Send the clean-account delivery test",
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
          {[
            { value: "3", label: "Sample releases" },
            { value: "92%", label: "Demo readiness" },
            { value: "0", label: "Live transactions" },
          ].map((metric) => (
            <div key={metric.label} className="border-l border-white/15 pl-5">
              <p className="font-mono text-4xl text-acid">{metric.value}</p>
              <p className="mt-2 text-xs tracking-[0.14em] text-white/55">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="eyebrow text-white/55">Current release</p>
                <h2 className="mt-3 font-serif text-3xl">The Systems Field Guide</h2>
              </div>
              <span className="rounded-full bg-acid px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-ink">Demo</span>
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
              {products.map((product) => (
                <Link key={product.slug} href={`/products/${product.slug}`} className="rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5">
                  <p className="font-mono text-[10px] text-white/55">Edition {product.edition}</p>
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
