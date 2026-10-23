import type { DemandSignal } from "./types"

/**
 * Shared starlight-estate demand-capture store: talks to Vercel KV and Resend
 * over plain REST when configured, and falls back to process memory on a
 * zero-secret local checkout so the waitlist works out of the box in dev/test.
 */

const key = (productId: string, suffix: string) => `waitlist:${productId}:${suffix}`

const memoryPositions = new Map<string, Map<string, number>>()
const memorySignals = new Map<string, Map<string, DemandSignal>>()

export function resetMemoryWaitlistStore() {
  memoryPositions.clear()
  memorySignals.clear()
}

function hasKvEnv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function kv(command: unknown[]): Promise<unknown> {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error("KV not configured")
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`KV ${res.status}`)
  return (await res.json()).result
}

const audienceFor = (productId: string) =>
  process.env["RESEND_AUDIENCE_ID__" + productId.toUpperCase().replace(/-/g, "_")] ?? process.env.RESEND_AUDIENCE_ID

/** Email is the identity, so a re-submit updates in place instead of double-counting. */
export async function claimPosition(productId: string, email: string): Promise<number> {
  if (!hasKvEnv()) {
    let positions = memoryPositions.get(productId)
    if (!positions) {
      positions = new Map()
      memoryPositions.set(productId, positions)
    }
    const existing = positions.get(email)
    if (existing) return existing
    const next = positions.size + 1
    positions.set(email, next)
    return next
  }
  const existing = await kv(["hget", key(productId, "positions"), email])
  if (existing) return Number(existing)
  const position = Number(await kv(["incr", key(productId, "count")]))
  await kv(["hset", key(productId, "positions"), email, String(position)])
  return position
}

export async function getCount(productId: string): Promise<number> {
  if (!hasKvEnv()) {
    return memoryPositions.get(productId)?.size ?? 0
  }
  const raw = await kv(["get", key(productId, "count")])
  return raw ? Number(raw) : 0
}

export async function saveSignal(signal: DemandSignal): Promise<void> {
  if (!hasKvEnv()) {
    let signals = memorySignals.get(signal.productId)
    if (!signals) {
      signals = new Map()
      memorySignals.set(signal.productId, signals)
    }
    signals.set(signal.email, { ...signal })
    return
  }
  await kv(["hset", key(signal.productId, "signals"), signal.email, JSON.stringify(signal)])
}

export async function allSignals(productId: string): Promise<DemandSignal[]> {
  if (!hasKvEnv()) {
    return [...(memorySignals.get(productId)?.values() ?? [])]
  }
  const raw = (await kv(["hgetall", key(productId, "signals")])) as unknown[] | null
  if (!raw) return []
  const values = Array.isArray(raw) ? raw.filter((_, i) => i % 2 === 1) : Object.values(raw)
  return values.map((v) => JSON.parse(String(v)) as DemandSignal)
}

/** Non-fatal: a Resend outage must not cost us the signal we already stored. */
export async function addToAudience(email: string, name: string | undefined, productId: string) {
  const resendKey = process.env.RESEND_API_KEY
  const audience = audienceFor(productId)
  if (!resendKey || !audience) return
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        first_name: name?.split(" ")[0],
        unsubscribed: false,
        properties: { waitlist: productId },
      }),
    })
    if (!res.ok) {
      console.error(`demand-capture: audience sync ${res.status} for ${productId}`)
    }
  } catch (err) {
    console.error(`demand-capture: audience sync failed for ${productId}`, err)
  }
}
