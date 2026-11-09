import { handleJoin, handleState, handleVerify, type ProductConfig } from "@/lib/demand-capture/handler"
import { KvNotConfiguredError } from "@/lib/demand-capture/store"
import registry from "@/data/products.graph.json"

const noStore = { "Cache-Control": "no-store" } as const

function findProduct(id: unknown): ProductConfig | undefined {
  const entry = registry.products.find((product) => product.id === id)
  return entry as ProductConfig | undefined
}

function unavailable() {
  return Response.json(
    { ok: false, state: "waitlist_unconfigured", error: "Waitlist storage is not configured on this deployment." },
    { status: 503, headers: noStore },
  )
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: noStore })
  }
  const product = findProduct(body?.productId)
  if (!product) return Response.json({ error: "Unknown product" }, { status: 404, headers: noStore })
  try {
    const { status, body: out } = await handleJoin(product, body, req)
    return Response.json(out, { status, headers: noStore })
  } catch (error) {
    if (error instanceof KvNotConfiguredError) return unavailable()
    throw error
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const product = findProduct(url.searchParams.get("productId"))
  if (!product) return Response.json({ error: "Unknown product" }, { status: 404, headers: noStore })
  try {
    const verifyToken = url.searchParams.get("verify")
    if (verifyToken) {
      const { status, body: out } = await handleVerify(product, url.searchParams.get("email"), verifyToken)
      return Response.json(out, { status, headers: noStore })
    }
    const { status, body: out } = await handleState(product)
    return Response.json(out, { status, headers: noStore })
  } catch (error) {
    if (error instanceof KvNotConfiguredError) return unavailable()
    throw error
  }
}
