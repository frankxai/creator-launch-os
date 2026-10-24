import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import type { DemandSignal, PriceBand, Stage, Urgency, WaitlistState } from "./types"
import { addToAudience, claimPosition, getCount, getSignal, saveSignal } from "./store"

export interface ProductConfig {
  id: string
  stage: Stage
  waitlist: { enabled: boolean; publicCountThreshold: number; foundingCohort: number }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX = { email: 320, name: 100, pain: 400, alternative: 200, source: 160 }

const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, n) : undefined)

const URGENCIES: Urgency[] = ["now", "this-quarter", "exploring"]
const BANDS: PriceBand[] = ["free-only", "under-25", "25-99", "100-299", "300-999", "over-1000", "company-pays"]
const oneOf = <T extends string>(v: unknown, allowed: T[]) =>
  typeof v === "string" && (allowed as string[]).includes(v) ? (v as T) : undefined

const hashToken = (token: string) => createHash("sha256").update(token, "utf8").digest("hex")
const safeMatch = (left: string | undefined, right: string | undefined) => {
  if (!left || !right) return false
  const a = Buffer.from(left, "utf8")
  const b = Buffer.from(right, "utf8")
  return a.length === b.length && timingSafeEqual(a, b)
}

// Per-IP sliding-window rate limiter (max 8 POSTs per 60s per client IP)
const RATE_WINDOW_MS = 60_000
const RATE_MAX_REQUESTS = 8
const ipHits = new Map<string, number[]>()

export function resetWaitlistRateLimiter() {
  ipHits.clear()
}

function checkRateLimit(req: Request, now = Date.now()): boolean {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "local"
  const recent = (ipHits.get(forwarded) ?? []).filter((ts) => now - ts < RATE_WINDOW_MS)
  if (recent.length >= RATE_MAX_REQUESTS) {
    ipHits.set(forwarded, recent)
    return false
  }
  recent.push(now)
  ipHits.set(forwarded, recent)
  return true
}

export function publicState(product: ProductConfig, count: number, position?: number, stepToken?: string): WaitlistState {
  const { publicCountThreshold, foundingCohort } = product.waitlist
  const state: WaitlistState = {
    productId: product.id,
    count,
    position,
    publicCount: count >= publicCountThreshold ? count : null,
    foundingCohort,
    foundingSeatsLeft: count < foundingCohort ? foundingCohort - count : 0,
    stage: product.stage,
  }
  if (stepToken) state.stepToken = stepToken
  return state
}

export async function handleJoin(product: ProductConfig, body: Record<string, unknown>, req: Request) {
  if (!product.waitlist.enabled) return { status: 404 as const, body: { error: "No waitlist for this product" } }
  if (!checkRateLimit(req)) {
    return { status: 429 as const, body: { error: "Too many requests. Please wait a minute and try again." } }
  }
  // Reject bot honeypot fills
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return { status: 400 as const, body: { error: "Invalid request" } }
  }

  const email = clip(body.email, MAX.email)?.toLowerCase()
  if (!email || !EMAIL_RE.test(email)) return { status: 400 as const, body: { error: "Valid email required" } }
  if (body.consent !== true) return { status: 400 as const, body: { error: "Consent required" } }

  const { position, created } = await claimPosition(product.id, email)
  const existing = created ? null : await getSignal(product.id, email)

  // If a signal already exists, updating Step-2 fields requires the stepToken issued at Step 1
  // so a third party who only knows the email address cannot overwrite their answers.
  const hasStep2Fields = Boolean(body.role || body.pain || body.urgency || body.priceBand || body.alternative)
  if (existing && hasStep2Fields) {
    const suppliedToken = typeof body.stepToken === "string" ? hashToken(body.stepToken) : undefined
    if (!safeMatch(existing.stepTokenHash, suppliedToken)) {
      return { status: 403 as const, body: { error: "Step token required to update waitlist answers" } }
    }
  }

  if (existing && !hasStep2Fields) {
    const count = await getCount(product.id)
    return { status: 200 as const, body: publicState(product, count, position) }
  }

  const rawStepToken = created || !existing ? randomBytes(18).toString("base64url") : undefined
  const rawVerifyToken = created || !existing ? randomBytes(18).toString("base64url") : undefined

  const url = new URL(req.url)
  const utm = Object.fromEntries(
    [...url.searchParams.entries()].filter(([k]) => k.startsWith("utm_")).slice(0, 8),
  )

  const signal: DemandSignal = {
    productId: product.id,
    email,
    name: clip(body.name, MAX.name) ?? existing?.name,
    role: clip(body.role, MAX.name) ?? existing?.role,
    pain: clip(body.pain, MAX.pain) ?? existing?.pain,
    urgency: oneOf(body.urgency, URGENCIES) ?? existing?.urgency,
    priceBand: oneOf(body.priceBand, BANDS) ?? existing?.priceBand,
    alternative: clip(body.alternative, MAX.alternative) ?? existing?.alternative,
    source: existing?.source ?? clip(body.source, MAX.source) ?? url.pathname,
    referrer: existing?.referrer ?? clip(req.headers.get("referer"), MAX.source),
    utm: existing?.utm ?? (Object.keys(utm).length ? utm : undefined),
    position,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    consent: true,
    verified: existing?.verified ?? false,
    stepTokenHash: existing?.stepTokenHash ?? (rawStepToken ? hashToken(rawStepToken) : undefined),
    verifyTokenHash: existing?.verifyTokenHash ?? (rawVerifyToken ? hashToken(rawVerifyToken) : undefined),
  }

  await saveSignal(signal)
  const count = await getCount(product.id)
  return { status: 200 as const, body: publicState(product, count, position, rawStepToken) }
}

export async function handleVerify(product: ProductConfig, emailRaw: string | null, tokenRaw: string | null) {
  const email = clip(emailRaw, MAX.email)?.toLowerCase()
  const token = clip(tokenRaw, 128)
  if (!email || !token) return { status: 400 as const, body: { error: "Missing verification parameters" } }
  const existing = await getSignal(product.id, email)
  if (!existing || !safeMatch(existing.verifyTokenHash, hashToken(token))) {
    return { status: 400 as const, body: { error: "Invalid verification token" } }
  }
  if (!existing.verified) {
    await saveSignal({ ...existing, verified: true })
    await addToAudience(existing.email, existing.name, product.id)
  }
  return { status: 200 as const, body: { ok: true, verified: true, productId: product.id, position: existing.position } }
}

export async function handleState(product: ProductConfig) {
  const count = await getCount(product.id)
  return { status: 200 as const, body: publicState(product, count) }
}
