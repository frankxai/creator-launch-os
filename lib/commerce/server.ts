import { createMemoryStore, type CommerceStore } from "@/lib/commerce/engine"
import { readCommerceRuntime } from "@/lib/commerce/config"

/**
 * Store wiring for route handlers. Test mode uses process memory, which is enough
 * for a single-process rehearsal and is explicitly not durable. Live mode needs a
 * durable store chosen with the merchant; until then it has none and the routes
 * refuse to run.
 */
let testStore: CommerceStore | undefined

export function commerceContext() {
  const runtime = readCommerceRuntime()
  if (runtime.blockers.length) return { runtime, store: null }
  if (runtime.mode === "test") {
    testStore ??= createMemoryStore()
    return { runtime, store: testStore }
  }
  return { runtime, store: null }
}

export const noStore = { "Cache-Control": "no-store" } as const

export function unavailable() {
  return Response.json(
    { ok: false, state: "available_soon", detail: "Commerce is not configured on this deployment." },
    { status: 503, headers: noStore },
  )
}
