import { applyEvent, CommerceError, issueDeliveryToken } from "@/lib/commerce/engine"
import { fulfilledSkus } from "@/lib/commerce/config"
import { commerceContext, noStore, unavailable } from "@/lib/commerce/server"

const statusFor: Record<CommerceError["code"], number> = {
  E_SIGNATURE: 401,
  E_EVENT_SHAPE: 400,
  E_UNKNOWN_SKU: 422,
  E_UNKNOWN_ORDER: 422,
  E_ORDER_CONFLICT: 409,
  E_MODE_MISMATCH: 422,
  E_TOKEN: 400,
  E_TOKEN_EXPIRED: 410,
  E_REVOKED: 410,
  E_ADAPTER_MISSING: 503,
}

export async function POST(request: Request) {
  const { runtime, store } = commerceContext()
  if (!store || !runtime.adapter || !runtime.webhookSecret || !runtime.deliverySecret || runtime.mode === "off") {
    return unavailable()
  }

  const rawBody = await request.text()
  try {
    const event = runtime.adapter(rawBody, request.headers, runtime.webhookSecret)
    const result = applyEvent(store, event, { skus: fulfilledSkus, mode: runtime.mode })
    if (result.outcome === "granted") {
      // Test mode returns the link so a rehearsal can open it. A live adapter
      // sends it to the buyer through the merchant's receipt instead.
      const deliveryToken = issueDeliveryToken(result.entitlement, runtime.deliverySecret, new Date())
      return Response.json(
        { ok: true, outcome: result.outcome, orderId: result.order.orderId, deliveryToken: runtime.mode === "test" ? deliveryToken : undefined },
        { headers: noStore },
      )
    }
    return Response.json(
      { ok: true, outcome: result.outcome, orderId: "order" in result ? result.order.orderId : undefined },
      { headers: noStore },
    )
  } catch (error) {
    if (error instanceof CommerceError) {
      if (error.code === "E_ORDER_CONFLICT") {
        // Needs a human: merchants may retry for days. No buyer data in the log line.
        console.error(JSON.stringify({ level: "error", event: "commerce_order_conflict", code: error.code, mode: runtime.mode }))
      }
      return Response.json({ ok: false, code: error.code, detail: error.message }, { status: statusFor[error.code], headers: noStore })
    }
    throw error
  }
}
