import offer from "@/offer.facts.json"

import { CommerceError, parseEvent, verifySignature, verifyWebhookTimestamp, type CommerceEvent, type CommerceMode } from "@/lib/commerce/engine"

/**
 * Environment contract for selling the Commercial Kit. Every value is optional:
 * a fresh clone with nothing set renders "available soon" and accepts no events.
 *
 *   COMMERCE_MODE              off (default) | test | live
 *   COMMERCE_MERCHANT          fixture in test mode; the chosen merchant in live mode
 *   COMMERCE_WEBHOOK_SECRET    ≥ 32 characters, server-only
 *   COMMERCE_DELIVERY_SECRET   ≥ 32 characters, server-only, signs delivery links
 *   NEXT_PUBLIC_KIT_CHECKOUT_URL  hosted HTTPS checkout, live mode only
 */

export type Env = Record<string, string | undefined>

/** A merchant adapter verifies its own webhook scheme and returns one normalized event. */
export type MerchantAdapter = (rawBody: string, headers: Headers, secret: string) => CommerceEvent

const adapters: Record<string, { mode: Exclude<CommerceMode, "off">; adapter: MerchantAdapter }> = {
  fixture: {
    mode: "test",
    adapter(rawBody, headers, secret) {
      verifyWebhookTimestamp(headers.get("x-commerce-timestamp"))
      verifySignature(rawBody, headers.get("x-commerce-signature"), secret)
      let payload: unknown
      try {
        payload = JSON.parse(rawBody)
      } catch {
        throw new CommerceError("E_EVENT_SHAPE", "Body is not JSON")
      }
      const event = parseEvent(payload)
      if (event.merchant !== "fixture" || !event.test) {
        throw new CommerceError("E_EVENT_SHAPE", "The fixture adapter only accepts fixture test events")
      }
      return event
    },
  },
  // A live merchant adapter is added here once the owner chooses one merchant
  // and its webhook scheme is verified against that merchant's current docs.
}

export const fulfilledSkus = [offer.sku_id] as const

function httpsUrl(value: string | undefined) {
  const candidate = value?.trim()
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null
  } catch {
    return null
  }
}

const secret = (value: string | undefined) => (value && value.trim().length >= 32 ? value.trim() : null)

export interface CommerceRuntime {
  mode: CommerceMode
  merchant: string | null
  adapter: MerchantAdapter | null
  webhookSecret: string | null
  deliverySecret: string | null
  checkoutUrl: string | null
  /** Operator-facing reasons the kit cannot be bought yet. Never rendered to buyers. */
  blockers: string[]
}

export function readCommerceRuntime(env: Env = process.env): CommerceRuntime {
  const requested = env.COMMERCE_MODE?.trim().toLowerCase()
  const mode: CommerceMode = requested === "test" || requested === "live" ? requested : "off"
  const merchant = env.COMMERCE_MERCHANT?.trim().toLowerCase() || null
  const entry = merchant ? adapters[merchant] : undefined
  const runtime: CommerceRuntime = {
    mode,
    merchant,
    adapter: entry && entry.mode === mode ? entry.adapter : null,
    webhookSecret: secret(env.COMMERCE_WEBHOOK_SECRET),
    deliverySecret: secret(env.COMMERCE_DELIVERY_SECRET),
    checkoutUrl: httpsUrl(env.NEXT_PUBLIC_KIT_CHECKOUT_URL),
    blockers: [],
  }

  if (mode === "off") runtime.blockers.push("COMMERCE_MODE is off")
  if (mode === "test" && (env.VERCEL_ENV === "production" || env.COMMERCE_ENV === "production")) {
    runtime.blockers.push("test mode is refused on a production deployment")
  }
  if (mode !== "off" && !runtime.adapter) runtime.blockers.push(`no ${mode} adapter for merchant "${merchant ?? "unset"}"`)
  if (mode !== "off" && !runtime.webhookSecret) runtime.blockers.push("COMMERCE_WEBHOOK_SECRET missing or shorter than 32 characters")
  if (mode !== "off" && !runtime.deliverySecret) runtime.blockers.push("COMMERCE_DELIVERY_SECRET missing or shorter than 32 characters")
  if (mode === "live") {
    if (offer.price.state !== "locked" || offer.price.amount === null) runtime.blockers.push("price is not locked in offer.facts.json")
    if (!runtime.checkoutUrl) runtime.blockers.push("NEXT_PUBLIC_KIT_CHECKOUT_URL missing or not HTTPS")
  }
  return runtime
}

/**
 * The single buyer-facing rule, in the spirit of Storefront.v1's commerceState:
 * a buy control exists only when price, merchant, webhook and delivery are all
 * in place. Test mode is a rehearsal and never shows a buy control.
 */
export type KitAvailability =
  | { state: "available"; checkoutUrl: string }
  | { state: "test-rehearsal" }
  | { state: "available-soon" }

export function kitAvailability(runtime: CommerceRuntime): KitAvailability {
  if (runtime.blockers.length) return { state: "available-soon" }
  if (runtime.mode === "test") return { state: "test-rehearsal" }
  return runtime.checkoutUrl ? { state: "available", checkoutUrl: runtime.checkoutUrl } : { state: "available-soon" }
}

export { offer }
