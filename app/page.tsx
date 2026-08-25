import { ArrowRight, CheckCircle2, Github, MoveRight } from "lucide-react"
import Link from "next/link"

import { LaunchConsole } from "@/components/launch-console"
import { ProductExplorer } from "@/components/product-explorer"
import { products } from "@/lib/products"

const operatingLayers = [
  {
    number: "01",
    title: "Publish a clear offer",
    detail: "Editorial product pages, meaningful sample content, and one decisive conversion path.",
  },
  {
    number: "02",
    title: "Deliver without mystery",
    detail: "An honest demo state, configurable checkout links, and explicit delivery expectations.",
  },
  {
    number: "03",
    title: "Run the next release",
    detail: "A compact studio view for readiness, channel work, customer signals, and follow-through.",
  },
] as const

const templateProof = [
  "Deploys with no required secrets",
  "Server-first Next.js App Router",
  "Keyboard and reduced-motion ready",
  "Real loading, empty, error, and demo states",
] as const

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="border-b border-line">
        <div className="shell grid gap-14 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div>
            <p className="eyebrow text-muted">A free, deployable creator storefront</p>
            <h1 className="text-balance mt-6 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-7xl lg:text-[5.4rem]">
              Make the work easy to trust—and easier to <span className="font-serif font-normal italic">buy.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/65 sm:text-xl">
              Creator Launch OS combines a focused storefront with the operating view behind it. Replace the sample releases, connect your checkout, and publish on your own domain.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="/products" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5">
                Browse the releases
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/studio" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 hover:text-ink">
                See the operating view
                <MoveRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-5 font-mono text-[10px] uppercase tracking-[0.13em] text-muted">
              <span>Next.js 16</span>
              <span>Zero-secret demo</span>
              <span>MIT licensed</span>
              <span>v0-ready</span>
            </div>
          </div>
          <LaunchConsole />
        </div>
      </section>

      <section className="border-b border-line bg-paper-bright py-20 sm:py-28">
        <div className="shell">
          <div className="max-w-3xl">
            <p className="eyebrow text-muted">One system, both sides of the release</p>
            <h2 className="text-balance mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              A calm storefront with an operating room behind it.
            </h2>
          </div>
          <div className="mt-14 border-t border-ink/20">
            {operatingLayers.map((layer) => (
              <div key={layer.number} className="grid gap-4 border-b border-line py-7 sm:grid-cols-[72px_0.7fr_1fr] sm:items-start">
                <span className="font-mono text-xs text-muted">{layer.number}</span>
                <h3 className="text-xl font-semibold tracking-tight">{layer.title}</h3>
                <p className="max-w-xl text-[15px] leading-7 text-ink/62">{layer.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="releases" className="py-20 sm:py-28">
        <div className="shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-muted">Sample catalog</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Three useful shapes of digital work.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted">
              The copy is intentionally specific so you can judge the design with real density. Every item is sample content and safe to replace.
            </p>
          </div>
          <div className="mt-10">
            <ProductExplorer products={products} />
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-paper sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow text-white/45">The template contract</p>
            <h2 className="text-balance mt-5 font-serif text-5xl leading-[1.02] sm:text-6xl">
              Free should still mean complete.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/58">
              This starter does not hide a broken product behind an attractive homepage. It includes the routes, states, content model, setup notes, and verification hooks needed to make a real first release.
            </p>
            <a
              href="https://github.com/frankxai/creator-launch-os"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              <Github className="size-4" aria-hidden="true" />
              Read the source
            </a>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {templateProof.map((item) => (
              <div key={item} className="flex items-center gap-4 py-5">
                <CheckCircle2 className="size-5 shrink-0 text-acid" aria-hidden="true" />
                <span className="text-base text-white/78">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-coral py-16 sm:py-20">
        <div className="shell flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-ink/60">Your first edition</p>
            <h2 className="text-balance mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Replace three files. Ship the first useful version.
            </h2>
          </div>
          <Link href="/products/systems-field-guide" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper">
            Inspect the product flow
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  )
}
