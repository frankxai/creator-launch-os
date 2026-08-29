import { ArrowRight, CheckCircle2, MoveRight } from "lucide-react"
import Link from "next/link"

import { HomeMotion } from "@/components/home-motion"
import { LaunchConsole } from "@/components/launch-console"
import { ProductExplorer } from "@/components/product-explorer"
import { products } from "@/lib/products"

const operatingLayers = [
  {
    number: "01",
    title: "Publish a clear offer",
    detail: "Editorial product pages, meaningful sample content, and one decisive conversion path.",
    signal: "Offer clarity",
    value: "One audience · one outcome",
    proof: ["Specific promise", "Visible format", "Complete contents"],
  },
  {
    number: "02",
    title: "Deliver without mystery",
    detail: "An honest demo state, configurable checkout links, and explicit delivery expectations.",
    signal: "Delivery proof",
    value: "Clean-account path verified",
    proof: ["Hosted checkout", "No-secret fallback", "Delivery named"],
  },
  {
    number: "03",
    title: "Run the next release",
    detail: "A compact studio view for readiness, customer signals, and the next consequential work.",
    signal: "Release rhythm",
    value: "The second release starts now",
    proof: ["Readiness visible", "Signals preserved", "Next action chosen"],
  },
] as const

const templateProof = [
  "Deploys with no required secrets",
  "Server-first Next.js App Router",
  "Keyboard and reduced-motion ready",
  "Real loading, empty, error, and demo states",
] as const

const trustSignals = ["Next.js 16", "Zero-secret demo", "MIT licensed", "v0 structure · local GSAP"] as const

export default function HomePage() {
  return (
    <HomeMotion>
      <main id="main-content">
        <section className="premium-hero premium-grain overflow-hidden border-b border-white/10 bg-ink text-paper">
          <div className="hero-aurora" aria-hidden="true" />
          <div className="shell relative grid gap-16 py-16 sm:py-20 lg:min-h-[760px] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
            <div className="relative z-10">
              <p data-hero-follow className="eyebrow text-white/48">
                The free operating system for independent releases
              </p>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.058em] sm:text-7xl lg:text-[5.6rem]">
                <span data-hero-line className="block">Make the work</span>
                <span data-hero-line className="block">
                  feel <span className="font-serif font-normal italic text-coral">singular.</span>
                </span>
                <span data-hero-line className="block text-white/62">Keep the relationship.</span>
              </h1>
              <p data-hero-follow className="mt-7 max-w-xl text-lg leading-8 text-white/62 sm:text-xl">
                A focused storefront and release studio for creators who want the clarity of a product company without surrendering their voice, audience, or domain.
              </p>
              <div data-hero-follow className="mt-9 flex flex-wrap items-center gap-5">
                <Link
                  href="/products"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
                >
                  Browse the releases
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/studio" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-white/68 hover:text-white">
                  See the operating view
                  <MoveRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <div data-hero-follow className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/12 pt-5 sm:flex sm:flex-wrap">
                {trustSignals.map((signal) => (
                  <span key={signal} className="font-mono text-[10px] tracking-[0.13em] text-white/38">
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div data-hero-stage className="hero-proof-stage relative mx-auto w-full max-w-[620px] lg:mx-0">
              <div className="hero-proof-halo" aria-hidden="true" />
              <div className="relative z-10 rotate-[-1.2deg] sm:px-8 lg:px-0">
                <LaunchConsole />
              </div>
              <div data-depth="15" className="liquid-lens lens-proof" aria-hidden="true">
                <span className="liquid-lens-index">01</span>
                <span><strong>Proof</strong> attached</span>
              </div>
              <div data-depth="9" className="liquid-lens lens-delivery" aria-hidden="true">
                <span className="liquid-lens-index">02</span>
                <span><strong>Delivery</strong> named</span>
              </div>
              <div data-depth="18" className="liquid-lens lens-ownership" aria-hidden="true">
                <span className="liquid-lens-index">03</span>
                <span><strong>Ownership</strong> retained</span>
              </div>
            </div>
          </div>
        </section>

        <section data-release-story className="border-b border-line bg-paper-bright">
          <div className="shell grid gap-14 py-20 sm:py-28 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24 lg:py-0">
            <div className="lg:py-28">
              <p className="eyebrow text-muted">One system, both sides of the release</p>
              <h2 className="text-balance mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                A calm storefront with an operating room behind it.
              </h2>
              <div className="mt-14 border-t border-ink/20">
                {operatingLayers.map((layer) => (
                  <article key={layer.number} data-story-step className="story-step grid gap-4 border-b border-line py-8 lg:content-center lg:py-14">
                    <span className="font-mono text-xs text-muted">{layer.number}</span>
                    <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{layer.title}</h3>
                    <p className="max-w-xl text-[15px] leading-7 text-ink/62">{layer.detail}</p>
                    <p className="font-mono text-[10px] tracking-[0.14em] text-ink/42">{layer.value}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="sticky top-24 flex min-h-[calc(100vh-6rem)] items-center py-14">
                <div className="story-stage premium-grain relative w-full overflow-hidden rounded-[2rem] bg-ink p-8 text-paper shadow-[0_34px_100px_rgba(20,21,17,0.18)]">
                  <div className="absolute bottom-8 left-8 top-8 w-px bg-white/10" aria-hidden="true">
                    <div data-story-progress className="h-full w-px bg-acid" />
                  </div>
                  <div className="relative min-h-[450px] pl-10" aria-hidden="true">
                    {operatingLayers.map((layer, index) => (
                      <div key={layer.number} data-story-panel className={`story-panel ${index === 0 ? "is-first" : ""}`}>
                        <div className="flex items-start justify-between gap-5">
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.16em] text-white/38">Signal {layer.number}</p>
                            <p className="mt-4 font-serif text-5xl leading-none">{layer.signal}</p>
                          </div>
                          <span className="rounded-full border border-white/12 px-3 py-1.5 font-mono text-[10px] text-acid">Verified shape</span>
                        </div>
                        <div className="mt-14 border-y border-white/10">
                          {layer.proof.map((item, proofIndex) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_auto] items-center gap-4 border-b border-white/10 py-5 last:border-b-0">
                              <span className="font-mono text-[10px] text-white/28">0{proofIndex + 1}</span>
                              <span className="text-sm text-white/72">{item}</span>
                              <CheckCircle2 className="size-4 text-acid" aria-hidden="true" />
                            </div>
                          ))}
                        </div>
                        <p className="mt-9 max-w-md text-sm leading-7 text-white/46">{layer.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
              <h2 className="text-balance mt-5 font-serif text-5xl leading-[1.02] sm:text-6xl">Free should still mean complete.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/58">
                This starter does not hide a broken product behind an attractive homepage. It includes the routes, states, content model, setup notes, and verification hooks needed to make a real first release.
              </p>
              <a
                href="https://github.com/frankxai/creator-launch-os"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
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
    </HomeMotion>
  )
}
