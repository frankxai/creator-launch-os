import type { Metadata } from "next"
import { ArrowRight, ArrowUpRight, Check, Clock3, FlaskConical, LifeBuoy, Minus, RotateCcw, Wrench } from "lucide-react"
import Link from "next/link"

import { FirstSaleRehearsal, type RehearsalStep } from "@/components/first-sale-rehearsal"
import { fulfilledSkus, kitAvailability, offer, readCommerceRuntime } from "@/lib/commerce/config"
import {
  applyEvent,
  createMemoryStore,
  exportBuyerData,
  issueDeliveryToken,
  reconcile,
  redeemDeliveryToken,
  signPayload,
  verifySignature,
  verifyWebhookTimestamp,
} from "@/lib/commerce/engine"
import { WaitlistForm } from "@/lib/demand-capture/WaitlistForm"
import { siteConfig } from "@/lib/site"

export const metadata: Metadata = {
  title: "Commercial kit",
  description: "Sell digital products from your own domain and verify payment, delivery and refund revocation before going live.",
}

function buildVerifiedRehearsalSteps(): RehearsalStep[] {
  const secret = "fixture-webhook-secret-0123456789abcdef"
  const deliverySecret = "fixture-delivery-secret-0123456789abcdef"
  const now = new Date("2026-10-24T01:00:00.000Z")
  const timestampHeader = String(Math.floor(now.getTime() / 1000))
  const store = createMemoryStore()
  const options = { skus: fulfilledSkus, mode: "test" as const }

  const paidEvent = {
    id: "evt_fixture_paid_01",
    type: "order.paid" as const,
    merchant: "fixture",
    orderId: "ord_fixture_01",
    sku: offer.sku_id,
    amount: 100,
    currency: "USD",
    email: "rehearsal.buyer@example.invalid",
    occurredAt: "2026-10-24T01:00:00.000Z",
    test: true,
  }
  const paidRaw = JSON.stringify(paidEvent)
  const verifiedTimestamp = verifyWebhookTimestamp(timestampHeader, now)
  const signature = signPayload(paidRaw, secret, verifiedTimestamp)
  verifySignature(paidRaw, signature, secret, verifiedTimestamp)

  const granted = applyEvent(store, paidEvent, options)
  const duplicateReplay = applyEvent(store, paidEvent, options)
  if (granted.outcome !== "granted") throw new Error("Rehearsal grant failed")

  const token = issueDeliveryToken(granted.entitlement, deliverySecret, now)
  const delivery = redeemDeliveryToken(store, token, deliverySecret, now)

  const refundEvent = {
    ...paidEvent,
    id: "evt_fixture_refund_01",
    type: "order.refunded" as const,
    occurredAt: "2026-10-24T01:04:00.000Z",
  }
  const revoked = applyEvent(store, refundEvent, options)
  let postRefundCode = "OK"
  try {
    redeemDeliveryToken(store, token, deliverySecret, now)
  } catch (err) {
    postRefundCode = (err as { code?: string }).code ?? "ERROR"
  }
  const summary = reconcile(store, true)
  const buyerExport = exportBuyerData(store, paidEvent.email)

  return [
    {
      number: "01",
      title: "Connect merchant in test mode",
      summary: "Require x-commerce-timestamp within 300s and verify the HMAC-SHA256 signature over timestamp.rawBody.",
      badge: "HMAC verified",
      outcomeLabel: "Timestamp & signature verified",
      commandOrInput: [
        "COMMERCE_MODE=test",
        "COMMERCE_MERCHANT=fixture",
        `x-commerce-timestamp: ${verifiedTimestamp}`,
        `x-commerce-signature: ${signature.slice(0, 31)}...`,
      ].join("\n"),
      verifiedOutput: JSON.stringify(
        {
          mode: "test",
          merchant: "fixture",
          signedPayloadFormat: "timestamp.rawBody",
          timestampFreshnessWindowSeconds: 300,
          signatureVerified: true,
          liveCheckoutExposed: false,
        },
        null,
        2,
      ),
    },
    {
      number: "02",
      title: "Send a test order & replay it",
      summary: "Apply order.paid to grant the entitlement, then replay the same event ID to prove retries never double-grant.",
      badge: "Outcome: granted",
      outcomeLabel: `Order ${granted.order.orderId} -> ${granted.entitlement.entitlementId} (${duplicateReplay.outcome} on replay)`,
      commandOrInput: JSON.stringify(
        {
          id: paidEvent.id,
          type: paidEvent.type,
          orderId: paidEvent.orderId,
          sku: paidEvent.sku,
          email: paidEvent.email,
        },
        null,
        2,
      ),
      verifiedOutput: JSON.stringify(
        {
          firstDeliveryOutcome: granted.outcome,
          entitlementId: granted.entitlement.entitlementId,
          entitlementStatus: granted.entitlement.status,
          secondDeliveryReplayOutcome: duplicateReplay.outcome,
        },
        null,
        2,
      ),
    },
    {
      number: "03",
      title: "Open delivery email & signed link",
      summary: "Issue the 7-day signed delivery link for the buyer's receipt email and redeem it to record delivery_opened.",
      badge: "Token redeemed",
      outcomeLabel: `Signed link opens ${delivery.sku}`,
      commandOrInput: [
        `To: ${paidEvent.email}`,
        `Subject: Your ${offer.title} download link`,
        `GET /api/commerce/delivery?token=${token.slice(0, 28)}...`,
      ].join("\n"),
      verifiedOutput: JSON.stringify(
        {
          redeemedSku: delivery.sku,
          entitlementStatus: delivery.entitlement.status,
          tokenTtlDays: 7,
          recordedActivity: buyerExport.activity.map((entry) => entry.name),
        },
        null,
        2,
      ),
    },
    {
      number: "04",
      title: "Refund order & revoke access",
      summary: "Apply order.refunded and confirm the previously issued delivery link immediately returns 410 E_REVOKED.",
      badge: `Throws ${postRefundCode}`,
      outcomeLabel: "Entitlement revoked & link blocked",
      commandOrInput: JSON.stringify(
        {
          id: refundEvent.id,
          type: refundEvent.type,
          orderId: refundEvent.orderId,
          reopenTokenAttempt: `/api/commerce/delivery?token=${token.slice(0, 20)}...`,
        },
        null,
        2,
      ),
      verifiedOutput: JSON.stringify(
        {
          refundOutcome: revoked.outcome,
          entitlementStatusAfterRefund: revoked.outcome === "revoked" ? revoked.entitlement?.status : undefined,
          reopenDeliveryLinkCode: postRefundCode,
          reconciledTestTotals: summary,
        },
        null,
        2,
      ),
    },
  ]
}

const diyResponsibilities = [
  {
    title: "Put in your own products and copy",
    detail: "Edit lib/products.ts and lib/site.ts for the storefront, or edit your Monograph portfolio in /studio/templates/portfolio/edit, click Save project, and run pnpm template:projects --project your-saved.json to export a standalone repository.",
  },
  {
    title: "Bring your own Vercel, KV, Resend and merchant accounts",
    detail: "You deploy to your own Vercel account and supply your own environment variables (.env.example). Hosting, Redis KV, email and payment-processor fees are billed directly by those providers.",
  },
  {
    title: "Add the webhook translator for the live merchant you choose",
    detail: "The kit ships the shared post-webhook engine (orders, entitlements, signed links, refund revocation and 32 commerce contract tests) plus the integration guide (commercial/kit/03-merchant-integration-guide.md). Because no single live merchant is locked yet, you wire the webhook signature translator and durable table for your chosen merchant before enabling live mode.",
  },
  {
    title: "Review and approve your own legal terms",
    detail: "The license, refund and support files in commercial/policies/ are editable markdown templates, not legal advice.",
  },
] as const

export default function KitPage() {
  const availability = kitAvailability(readCommerceRuntime())
  const rehearsalSteps = buildVerifiedRehearsalSteps()

  return (
    <main id="main-content">
      <section className="border-b border-line py-14 sm:py-20">
        <div className="shell max-w-4xl">
          <p className="eyebrow text-muted">{offer.title} · v{offer.version} · Storefront and fulfillment kit</p>
          <h1 className="text-balance mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Sell digital products from your own domain—and prove payment, delivery and refunds work before you go live.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/68">
            Start with the free MIT Next.js 16 storefront and browser Monograph editor. When you are ready to take orders, the commercial kit adds the webhook fulfillment loop, signed download links, refund revocation and a four-step test rehearsal on this page showing verified results from the real engine, computed at build time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#prove-it-works"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-ink/90"
            >
              Prove the 4-step sale loop below
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              See the storefront in action
            </Link>
            <Link
              href="/studio/templates/portfolio/edit"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink/78 transition-colors hover:border-ink hover:text-ink"
            >
              Open the Monograph editor
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-paper-bright py-14 sm:py-20">
        <div className="shell">
          <FirstSaleRehearsal steps={rehearsalSteps} />
        </div>
      </section>

      <section className="bg-paper-bright py-14 sm:py-20">
        <div className="shell grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-[2rem] border border-line bg-paper p-7 sm:p-9" aria-labelledby="core-title">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <h2 id="core-title" className="text-3xl font-semibold tracking-[-0.04em]">{offer.core.name}</h2>
              <span className="shrink-0 whitespace-nowrap rounded-full border border-ink/15 px-3 py-1 font-mono text-[10px] tracking-wider">{offer.core.license}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">Yours to clone, review, edit and export today. No account or secret required.</p>
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
            <p className="mt-3 text-sm leading-6 text-white/65">For creators and developer-operators who want the launch runbook, manifest pack, policy templates and merchant integration guide.</p>
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
                        Checkout stays off until payment, delivery and refunds pass an end-to-end gate. Join the per-product waitlist below to record your use case and get one email when this edition opens.
                      </p>
                    </div>
                  </div>
                  <WaitlistForm
                    productId="creator-launch-os"
                    productName="Creator Launch OS"
                    foundingBenefit="First 100 are named in the release credits (optional) and help choose which merchant adapter ships first."
                    placeholder="you@domain.com"
                  />
                </div>
              )}
            </div>
          </article>
        </div>
      </section>

      <section id="what-you-do-yourself" data-diy-boundary className="border-t border-line bg-paper py-14 sm:py-20">
        <div className="shell">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-coral" aria-hidden="true" />
              <p className="eyebrow text-muted">Honest boundary</p>
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              What you still do yourself
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Creator Launch OS is a self-hosted Next.js codebase and release kit, not a hosted marketplace. Before you join the waitlist or deploy, make sure this division of work fits how you operate.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {diyResponsibilities.map((item, idx) => (
              <div key={item.title} className="rounded-2xl border border-line bg-paper-bright p-6">
                <p className="font-mono text-xs text-muted">0{idx + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line py-12">
        <div className="shell grid gap-8 sm:grid-cols-2">
          <div className="flex gap-3">
            <RotateCcw className="size-5 shrink-0 text-coral" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Refunds (draft terms)</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Draft policy ({offer.refund.state}, pending owner ratification): when the kit opens, the proposed refund window is {offer.refund.window_days} days. Processing a refund revokes the entitlement and ends access to future kit updates.
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
      </section>
    </main>
  )
}
