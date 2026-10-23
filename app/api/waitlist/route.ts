import { handleJoin, handleState, type ProductConfig } from "@/lib/demand-capture/handler"
import registry from "@/data/products.graph.json"

const noStore = { "Cache-Control": "no-store" } as const

function findProduct(id: unknown): ProductConfig | undefined {
  const entry = registry.products.find((product) => product.id === id)
  return entry as ProductConfig | undefined
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
  const { status, body: out } = await handleJoin(product, body, req)
  return Response.json(out, { status, headers: noStore })
}

export async function GET(req: Request) {
  const product = findProduct(new URL(req.url).searchParams.get("productId"))
  if (!product) return Response.json({ error: "Unknown product" }, { status: 404, headers: noStore })
  const { status, body: out } = await handleState(product)
  return Response.json(out, { status, headers: noStore })
}
