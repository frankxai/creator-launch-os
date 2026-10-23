import type { Metadata } from "next"
import { ArrowUpRight, Check, Clock3, FlaskConical, LifeBuoy, Minus, RotateCcw } from "lucide-react"
import Link from "next/link"

import { kitAvailability, offer, readCommerceRuntime } from "@/lib/commerce/config"
import { WaitlistForm } from "@/lib/demand-capture/WaitlistForm"
import { siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  title: "Commercial kit",
  description: "What the free MIT core includes, what the commercial kit adds, and the pre-launch waitlist.",
}

export default function KitPage() {
  const availability = kitAvailability(readCommerceRuntime())

  return (
    <main id="main-content">
      <section className="border-b border-line py-16 sm:py-24">
        <div className="shell max-w-4xl">
          <p className="eyebrow text-muted">{offer.title} · v{offer.version}</p>
          <h1 className="text-balance mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">
            Your source is the beginning. Your choices make the edition.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/62">{offer.promise}</p>
        </div>
      </section>

      <section className="bg-paper-bright py-16 sm:py-24">
        <div className="shell grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-[2rem] border border-line bg-paper p-7 sm:p-9" aria-labelledby="core-title">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <h2 id="core-title" className="text-3xl font-semibold tracking-[-0.04em]">{offer.core.name}</h2>
              <span className="shrink-0 whitespace-nowrap rounded-full border border-ink/15 px-3 py-1 font-mono text-[10px] tracking-wider">{offer.core.license}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">Yours to clone, review, edit and export. No account or secret required.</p>
            <ul className="mt-7 divide-y divide-line border-y border-line">
              {offer.core.includes.map((item) => (
                <li key={item} className="flex gap-3 py-3.5 text-[15px] leading-6">
                  <Check className="mt-1 size-4 shrink-0 text-blue" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/start"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-ink/90"
              >
                Get the free starter
              </Link>
              <a
                href={siteConfig.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink px-6 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
              >
                Inspect the source
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </article>

          <article className="flex flex-col rounded-[2rem] bg-ink p-7 text-paper sm:p-9" aria-labelledby="kit-title">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <h2 id="kit-title" className="text-3xl font-semibold tracking-[-0.04em]">{offer.kit.name}</h2>
              <span className="shrink-0 whitespace-nowrap rounded-full border border-white/20 px-3 py-1 font-mono text-[10px] tracking-wider text-white/70">Commercial terms</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/65">For creators who want the release playbook, manifest pack, policies and commerce wiring guide.</p>
            <ul className="mt-7 divide-y divide-white/12 border-y border-white/12">
              {offer.kit.includes.map((item) => (
                <li key={item} className="flex gap-3 py-3.5 text-[15px] leading-6">
                  <Check className="mt-1 size-4 shrink-0 text-acid" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 font-mono text-[10px] tracking-[0.15em] text-white/55">Not included</p>
            <ul className="mt-2 space-y-2">
              {offer.kit.excludes.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-white/65">
                  <Minus className="mt-1 size-4 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-[1.25rem] border border-white/15 p-5" data-kit-availability={availability.state}>
              {availability.state === "available" ? (
                <a
                  href={availability.checkoutUrl}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-acid px-6 text-sm font-semibold text-ink"
                >
                  Buy the Commercial Kit
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              ) : availability.state === "test-rehearsal" ? (
                <div className="flex gap-3">
                  <FlaskConical className="mt-0.5 size-5 shrink-0 text-acid" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Test rehearsal</p>
                    <p className="mt-1 text-sm leading-6 text-white/65">
                      This deployment only accepts fixture orders. No payment is collected and nothing is sold here.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 size-5 shrink-0 text-acid" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">Available soon</p>
                      <p className="mt-1 text-sm leading-6 text-white/65">
                        Checkout stays off until payment, delivery and refunds pass an end-to-end gate. Join the per-product waitlist below to record your use case and lock founding terms.
                      </p>
                    </div>
                  </div>
                  <WaitlistForm
                    productId="creator-launch-os"
                    productName="Creator Launch OS"
                    foundingBenefit="First 100 keep launch pricing for life and are named in the release credits."
                    placeholder="you@domain.com"
                  />
                </div>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-line py-12">
        <div className="shell grid gap-8 sm:grid-cols-2">
          <div className="flex gap-3">
            <RotateCcw className="size-5 shrink-0 text-coral" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Refunds</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                When the kit opens, a refund within {offer.refund.window_days} days of purchase needs no reason. A refund revokes the entitlement and ends access to future kit updates.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <LifeBuoy className="size-5 shrink-0 text-coral" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Support</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Free core questions go to{" "}
                <a className="underline decoration-line underline-offset-4" href={offer.support.free_core_channel} target="_blank" rel="noreferrer">
                  GitHub issues
                </a>
                . Kit buyers receive written answers about the kit&apos;s contents; custom engineering is out of scope.
              </p>
            </div>
          </div>
        </div>
        <div className="shell mt-8">
          <Link href="/products" className="text-sm font-semibold text-ink/70 hover:text-ink">
            See the storefront in action →
          </Link>
        </div>
      </section>
    </main>
  )
}
