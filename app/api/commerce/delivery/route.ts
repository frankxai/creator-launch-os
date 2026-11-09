import { CommerceError, redeemDeliveryToken } from "@/lib/commerce/engine"
import { offer } from "@/lib/commerce/config"
import { commerceContext, noStore, unavailable } from "@/lib/commerce/server"

export async function GET(request: Request) {
  const { runtime, store } = commerceContext()
  if (!store || !runtime.deliverySecret) {
    return unavailable()
  }

  const token = new URL(request.url).searchParams.get("token") ?? ""
  try {
    const grant = redeemDeliveryToken(store, token, runtime.deliverySecret, new Date())
    return Response.json(
      {
        ok: true,
        sku: grant.sku,
        entitlementId: grant.entitlement.entitlementId,
        // Test mode proves the gate, not the file. Live delivery serves the
        // packaged kit from private storage chosen with the merchant.
        delivery: runtime.mode === "test" ? "test_fixture_no_files" : "live",
        contents: offer.kit.includes,
      },
      { headers: noStore },
    )
  } catch (error) {
    if (error instanceof CommerceError) {
      const status = error.code === "E_REVOKED" || error.code === "E_TOKEN_EXPIRED" ? 410 : 403
      return Response.json({ ok: false, code: error.code, detail: error.message }, { status, headers: noStore })
    }
    throw error
  }
}
