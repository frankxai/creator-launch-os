import { readTestKit } from "@/lib/commerce/test-kit"
import { CommerceError, inspectDeliveryToken, redeemDeliveryToken } from "@/lib/commerce/engine"
import { offer } from "@/lib/commerce/config"
import { commerceContext, noStore, unavailable } from "@/lib/commerce/server"

export async function GET(request: Request) {
  const { runtime, store } = commerceContext()
  if (!store || !runtime.deliverySecret) {
    return unavailable()
  }

  const token = new URL(request.url).searchParams.get("token") ?? ""
  try {
    if (new URL(request.url).searchParams.get("download") === "1") {
      const candidate = inspectDeliveryToken(store, token, runtime.deliverySecret, new Date())
      const kit = await readTestKit(candidate.sku)
      if (!kit) return unavailable()
      // Recheck after I/O so a refund during the read takes effect.
      redeemDeliveryToken(store, token, runtime.deliverySecret, new Date())
      return new Response(kit.bytes, { headers: {
        ...noStore, "Content-Type": "application/zip", "X-Content-Type-Options": "nosniff",
        "Content-Disposition": 'attachment; filename="' + kit.filename + '"',
      } })
    }
    const grant = inspectDeliveryToken(store, token, runtime.deliverySecret, new Date())
    return Response.json(
      {
        ok: true,
        sku: grant.sku,
        entitlementId: grant.entitlement.entitlementId,
        // Test mode proves the gate, not the file. Live delivery serves the
        // packaged kit from private storage chosen with the merchant.
        delivery: "entitlement_metadata",
        fileRequest: "Use the same authorized URL with download=1 for the pinned test kit.",
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
