import type { DemandSignal } from "./types"

/**
 * Shared starlight-estate demand-capture store: talks to Vercel KV / Upstash
 * Redis and Resend over plain REST. Fails closed when KV is not configured so
 * a production deployment never silently loses signups in process memory.
 */

export class KvNotConfiguredError extends Error {
  readonly code = "E_KV_NOT_CONFIGURED"
  constructor(message = "KV not configured") {
    super(message)
    this.name = "KvNotConfiguredError"
  }
}

const kvUrl = () => process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim()
const kvToken = () => process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

const audienceFor = (productId: string) =>
  process.env["RESEND_AUDIENCE_ID__" + productId.toUpperCase().replace(/-/g, "_")] ?? process.env.RESEND_AUDIENCE_ID

const key = (productId: string, suffix: string) => `waitlist:${productId}:${suffix}`

async function kv(command: unknown[]): Promise<unknown> {
  const url = kvUrl()
  const token = kvToken()
  if (!url || !token) throw new KvNotConfiguredError()
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`KV ${res.status}`)
  return (await res.json()).result
}

/**
 * Atomic claim via HSETNX so concurrent signups with the same email never
 * double-increment the counter. Returns { position, created }.
 */
export async function claimPosition(productId: string, email: string): Promise<{ position: number; created: boolean }> {
  const claimed = Number(await kv(["hsetnx", key(productId, "positions"), email, "pending"]))
  if (claimed === 1) {
    const position = Number(await kv(["incr", key(productId, "count")]))
    await kv(["hset", key(productId, "positions"), email, String(position)])
    return { position, created: true }
  }
  const existing = await kv(["hget", key(productId, "positions"), email])
  return { position: Number(existing) || 1, created: false }
}

export async function getCount(productId: string): Promise<number> {
  const raw = await kv(["get", key(productId, "count")])
  return raw ? Number(raw) : 0
}

/** Count only verified subscribers toward public scarcity and foundingSeatsLeft. */
export async function getVerifiedCount(productId: string): Promise<number> {
  const raw = await kv(["get", key(productId, "verified_count")])
  return raw ? Number(raw) : 0
}

/** Atomically mark an email verified via HSETNX so verified_count increments at most once per subscriber. */
export async function markVerified(productId: string, email: string): Promise<boolean> {
  const newlyVerified = Number(await kv(["hsetnx", key(productId, "verified"), email, "1"]))
  if (newlyVerified === 1) {
    await kv(["incr", key(productId, "verified_count")])
    return true
  }
  return false
}

export async function getSignal(productId: string, email: string): Promise<DemandSignal | null> {
  const raw = await kv(["hget", key(productId, "signals"), email])
  return typeof raw === "string" && raw ? (JSON.parse(raw) as DemandSignal) : null
}

export async function saveSignal(signal: DemandSignal): Promise<void> {
  await kv(["hset", key(signal.productId, "signals"), signal.email, JSON.stringify(signal)])
}

export async function allSignals(productId: string): Promise<DemandSignal[]> {
  const raw = (await kv(["hgetall", key(productId, "signals")])) as unknown[] | null
  if (!raw) return []
  const values = Array.isArray(raw) ? raw.filter((_, i) => i % 2 === 1) : Object.values(raw)
  return values.map((v) => JSON.parse(String(v)) as DemandSignal)
}

/**
 * Send the double-opt-in verification email when RESEND_API_KEY is configured.
 * Opening verifyUrl calls GET /api/waitlist?productId=...&email=...&verify=...
 */
export async function sendVerificationEmail(email: string, productId: string, position: number, verifyUrl: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "GenCreator <noreply@gencreator.ai>"
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Confirm your ${productId} waitlist spot (#${position})`,
        text: `Confirm your ${productId} waitlist spot (#${position}) by opening this link:\n\n${verifyUrl}\n\nIf you did not request this, you can ignore this email.`,
      }),
    })
    if (!res.ok) {
      console.error(`demand-capture: verification email ${res.status} for ${productId}`)
    }
  } catch (err) {
    console.error(`demand-capture: verification email failed for ${productId}`, err)
  }
}

/** Called only after email verification to prevent unverified audience spam. */
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
