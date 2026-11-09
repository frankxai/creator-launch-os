import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Merchant-agnostic commerce loop: order → entitlement → delivery → refund.
 *
 * Self-contained on purpose (only node:crypto) so the contract tests can run the
 * whole loop against fixtures without a framework, a network or a merchant
 * account. A merchant adapter's only job is to verify its webhook and translate
 * the payload into a `CommerceEvent`; everything after that is shared.
 */

export type CommerceMode = "off" | "test" | "live"

export type CommerceEventType = "order.paid" | "order.refunded"

export interface CommerceEvent {
  /** Merchant event id. Replays of the same id are ignored. */
  id: string
  type: CommerceEventType
  merchant: string
  orderId: string
  sku: string
  /** Smallest currency unit, as the merchant reports it. */
  amount: number
  currency: string
  email: string
  occurredAt: string
  /** True for fixture and merchant test-mode events. Never mixed with live totals. */
  test: boolean
}

export type OrderStatus = "paid" | "refunded"
export type EntitlementStatus = "active" | "revoked"

export interface Order {
  orderId: string
  merchant: string
  sku: string
  amount: number
  currency: string
  email: string
  status: OrderStatus
  /** Null when a signed refund arrived before its payment; that order can never grant access. */
  paidAt: string | null
  refundedAt: string | null
  test: boolean
}

export interface Entitlement {
  entitlementId: string
  orderId: string
  sku: string
  email: string
  status: EntitlementStatus
  grantedAt: string
  revokedAt: string | null
}

export type ActivityName = "order_paid" | "entitlement_granted" | "delivery_opened" | "order_refunded" | "entitlement_revoked"

export interface Activity {
  name: ActivityName
  orderId: string
  at: string
}

/**
 * Durable storage is a deployment decision; the loop only needs these calls.
 * applyEvent writes state before markEvent, so every put must be an idempotent
 * upsert and markEvent must only run after the writes it guards succeed.
 */
export interface CommerceStore {
  hasEvent(id: string): boolean
  markEvent(id: string): void
  getOrder(orderId: string): Order | undefined
  putOrder(order: Order): void
  getEntitlement(entitlementId: string): Entitlement | undefined
  putEntitlement(entitlement: Entitlement): void
  record(activity: Activity): void
  orders(): Order[]
  entitlements(): Entitlement[]
  activity(): Activity[]
}

export function createMemoryStore(): CommerceStore {
  const events = new Set<string>()
  const orders = new Map<string, Order>()
  const entitlements = new Map<string, Entitlement>()
  const log: Activity[] = []
  return {
    hasEvent: (id) => events.has(id),
    markEvent: (id) => void events.add(id),
    getOrder: (id) => orders.get(id),
    putOrder: (order) => void orders.set(order.orderId, { ...order }),
    getEntitlement: (id) => entitlements.get(id),
    putEntitlement: (entitlement) => void entitlements.set(entitlement.entitlementId, { ...entitlement }),
    record: (activity) => void log.push({ ...activity }),
    orders: () => [...orders.values()].map((order) => ({ ...order })),
    entitlements: () => [...entitlements.values()].map((entitlement) => ({ ...entitlement })),
    activity: () => log.map((activity) => ({ ...activity })),
  }
}

export class CommerceError extends Error {
  constructor(
    readonly code:
      | "E_SIGNATURE"
      | "E_EVENT_SHAPE"
      | "E_UNKNOWN_SKU"
      | "E_UNKNOWN_ORDER"
      | "E_ORDER_CONFLICT"
      | "E_MODE_MISMATCH"
      | "E_TOKEN"
      | "E_TOKEN_EXPIRED"
      | "E_REVOKED"
      | "E_ADAPTER_MISSING",
    message: string,
  ) {
    super(message)
    this.name = "CommerceError"
  }
}

const SIGNATURE_PREFIX = "sha256="

/** Signs `timestamp.rawBody` so a captured payload cannot be replayed with a fresh timestamp header. */
export function signPayload(rawBody: string, secret: string, timestamp: string) {
  return SIGNATURE_PREFIX + createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex")
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a, "utf8")
  const right = Buffer.from(b, "utf8")
  return left.length === right.length && timingSafeEqual(left, right)
}

/** Requires `x-commerce-timestamp` and rejects deliveries outside the allowed clock-skew window (default 300s). */
export function verifyWebhookTimestamp(timestampHeader: string | null, now = new Date(), maxSkewSeconds = 300): string {
  if (timestampHeader === null || !timestampHeader.trim()) {
    throw new CommerceError("E_SIGNATURE", "Webhook timestamp header is required")
  }
  const trimmed = timestampHeader.trim()
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || Math.abs(Math.floor(now.getTime() / 1000) - parsed) > maxSkewSeconds) {
    throw new CommerceError("E_SIGNATURE", "Webhook timestamp is malformed or outside the freshness window")
  }
  return trimmed
}

/** Generic HMAC check used by the fixture adapter over `timestamp.rawBody`. Live adapters bring their merchant's scheme. */
export function verifySignature(rawBody: string, signature: string | null, secret: string, timestamp: string) {
  if (!signature || !safeEqual(signature, signPayload(rawBody, secret, timestamp))) {
    throw new CommerceError("E_SIGNATURE", "Webhook signature does not match")
  }
}

const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0

/** Shape check for an already-normalized event; adapters call it after translating. */
export function parseEvent(value: unknown): CommerceEvent {
  const event = value as Partial<CommerceEvent> | null
  if (
    !event ||
    !isText(event.id) ||
    (event.type !== "order.paid" && event.type !== "order.refunded") ||
    !isText(event.merchant) ||
    !isText(event.orderId) ||
    !isText(event.sku) ||
    !Number.isInteger(event.amount) ||
    (event.amount as number) < 0 ||
    !isText(event.currency) ||
    !/^[A-Z]{3}$/.test(event.currency) ||
    !isText(event.email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.email) ||
    !isText(event.occurredAt) ||
    Number.isNaN(Date.parse(event.occurredAt)) ||
    typeof event.test !== "boolean"
  ) {
    throw new CommerceError("E_EVENT_SHAPE", "Event is missing a required field or has an invalid value")
  }
  return event as CommerceEvent
}

export interface ApplyOptions {
  /** SKUs this storefront fulfils. Anything else is rejected, never silently granted. */
  skus: readonly string[]
  /** A test-mode deployment only accepts test events and a live one only live events. */
  mode: Exclude<CommerceMode, "off">
}

export type ApplyResult =
  | { outcome: "duplicate"; eventId: string }
  | { outcome: "granted"; order: Order; entitlement: Entitlement }
  | { outcome: "revoked"; order: Order; entitlement: Entitlement | undefined }

const entitlementIdFor = (orderId: string) => "ent_" + orderId

/** Apply one verified event. Idempotent per event id; retries after a partial failure converge. */
export function applyEvent(store: CommerceStore, event: CommerceEvent, options: ApplyOptions): ApplyResult {
  if (event.test !== (options.mode === "test")) {
    throw new CommerceError("E_MODE_MISMATCH", `A ${options.mode}-mode store refuses ${event.test ? "test" : "live"} events`)
  }
  if (!options.skus.includes(event.sku)) {
    throw new CommerceError("E_UNKNOWN_SKU", "Event names a SKU this storefront does not fulfil")
  }
  if (store.hasEvent(event.id)) {
    return { outcome: "duplicate", eventId: event.id }
  }

  if (event.type === "order.paid") {
    const existing = store.getOrder(event.orderId)
    if (existing?.status === "refunded") {
      // A late or replayed payment never resurrects a refunded order's access.
      store.markEvent(event.id)
      return { outcome: "duplicate", eventId: event.id }
    }
    if (existing && conflicts(existing, event)) {
      // Same merchant order id, different buyer or purchase: never grant on it silently.
      throw new CommerceError("E_ORDER_CONFLICT", "A payment reuses an order id with a different buyer, SKU, amount or currency")
    }
    // Write state first and mark the event last. Each step converges, so a
    // merchant retry after a partial failure completes only what is missing.
    let order = existing
    if (!order) {
      order = {
        orderId: event.orderId,
        merchant: event.merchant,
        sku: event.sku,
        amount: event.amount,
        currency: event.currency,
        email: event.email.toLowerCase(),
        status: "paid",
        paidAt: event.occurredAt,
        refundedAt: null,
        test: event.test,
      }
      store.putOrder(order)
    }
    recordOnce(store, { name: "order_paid", orderId: order.orderId, at: order.paidAt ?? event.occurredAt })
    let entitlement = store.getEntitlement(entitlementIdFor(order.orderId))
    if (!entitlement) {
      entitlement = {
        entitlementId: entitlementIdFor(order.orderId),
        orderId: order.orderId,
        sku: order.sku,
        email: order.email,
        status: "active",
        grantedAt: event.occurredAt,
        revokedAt: null,
      }
      store.putEntitlement(entitlement)
    }
    recordOnce(store, { name: "entitlement_granted", orderId: order.orderId, at: entitlement.grantedAt })
    store.markEvent(event.id)
    return { outcome: "granted", order, entitlement }
  }

  let order = store.getOrder(event.orderId)
  if (!order) {
    // Merchants may deliver a refund before its payment. Record the signed
    // refund as a refunded order so the later payment can never grant access.
    order = {
      orderId: event.orderId,
      merchant: event.merchant,
      sku: event.sku,
      amount: event.amount,
      currency: event.currency,
      email: event.email.toLowerCase(),
      status: "refunded",
      paidAt: null,
      refundedAt: event.occurredAt,
      test: event.test,
    }
    store.putOrder(order)
  }
  // Same order of operations: a refund retried after any partial failure must
  // still revoke access. A refunded order can never keep an active entitlement.
  const refunded: Order = order.status === "refunded" ? order : { ...order, status: "refunded", refundedAt: event.occurredAt }
  if (order.status !== "refunded") store.putOrder(refunded)
  recordOnce(store, { name: "order_refunded", orderId: order.orderId, at: refunded.refundedAt ?? event.occurredAt })
  let entitlement = store.getEntitlement(entitlementIdFor(order.orderId))
  if (entitlement?.status === "active") {
    entitlement = { ...entitlement, status: "revoked", revokedAt: refunded.refundedAt ?? event.occurredAt }
    store.putEntitlement(entitlement)
  }
  if (entitlement) recordOnce(store, { name: "entitlement_revoked", orderId: order.orderId, at: entitlement.revokedAt ?? event.occurredAt })
  store.markEvent(event.id)
  return { outcome: "revoked", order: refunded, entitlement }
}

/** Payment facts that must match when a merchant repeats an order id. */
function conflicts(order: Order, event: CommerceEvent) {
  return order.merchant !== event.merchant || order.sku !== event.sku || order.email !== event.email.toLowerCase() ||
    order.amount !== event.amount || order.currency !== event.currency
}

/**
 * One ledger entry per order transition, so a retry neither duplicates nor
 * drops it. A durable store should back this with a unique (name, orderId) key.
 */
function recordOnce(store: CommerceStore, activity: Activity) {
  if (!store.activity().some((entry) => entry.name === activity.name && entry.orderId === activity.orderId)) {
    store.record(activity)
  }
}

const base64url = (value: string) => Buffer.from(value, "utf8").toString("base64url")

interface TokenClaims {
  e: string
  s: string
  x: number
}

/** A stateless, signed link the buyer can open; revocation is still checked against the store. */
export function issueDeliveryToken(entitlement: Entitlement, secret: string, now: Date, ttlSeconds = 60 * 60 * 24 * 7) {
  const claims: TokenClaims = { e: entitlement.entitlementId, s: entitlement.sku, x: Math.floor(now.getTime() / 1000) + ttlSeconds }
  const body = base64url(JSON.stringify(claims))
  return body + "." + createHmac("sha256", secret).update(body).digest("base64url")
}

export interface DeliveryGrant {
  entitlement: Entitlement
  sku: string
}

export function redeemDeliveryToken(store: CommerceStore, token: string, secret: string, now: Date): DeliveryGrant {
  const [body, signature, extra] = token.split(".")
  if (!body || !signature || extra !== undefined) {
    throw new CommerceError("E_TOKEN", "Delivery link is malformed")
  }
  if (!safeEqual(signature, createHmac("sha256", secret).update(body).digest("base64url"))) {
    throw new CommerceError("E_TOKEN", "Delivery link signature does not match")
  }
  let claims: TokenClaims
  try {
    claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
  } catch {
    throw new CommerceError("E_TOKEN", "Delivery link is malformed")
  }
  if (!Number.isInteger(claims.x) || claims.x * 1000 <= now.getTime()) {
    throw new CommerceError("E_TOKEN_EXPIRED", "Delivery link has expired; request a fresh one from support")
  }
  const entitlement = store.getEntitlement(claims.e)
  if (!entitlement || entitlement.sku !== claims.s) {
    throw new CommerceError("E_TOKEN", "Delivery link does not match an entitlement")
  }
  if (entitlement.status !== "active") {
    throw new CommerceError("E_REVOKED", "This entitlement was refunded and no longer grants delivery")
  }
  store.record({ name: "delivery_opened", orderId: entitlement.orderId, at: now.toISOString() })
  return { entitlement, sku: entitlement.sku }
}

export interface Reconciliation {
  orders: number
  paid: number
  refunded: number
  activated: number
  /** Net per currency in the smallest unit. Test and live are never summed together. */
  net: Record<string, number>
  test: boolean
}

export function reconcile(store: CommerceStore, test: boolean): Reconciliation {
  const orders = store.orders().filter((order) => order.test === test)
  const ids = new Set(orders.map((order) => order.orderId))
  const activated = new Set(
    store
      .activity()
      .filter((activity) => activity.name === "delivery_opened" && ids.has(activity.orderId))
      .map((activity) => activity.orderId),
  )
  const net: Record<string, number> = {}
  for (const order of orders) {
    net[order.currency] = (net[order.currency] ?? 0) + (order.status === "paid" ? order.amount : 0)
  }
  return {
    orders: orders.length,
    paid: orders.filter((order) => order.status === "paid").length,
    refunded: orders.filter((order) => order.status === "refunded").length,
    activated: activated.size,
    net,
    test,
  }
}

/** Everything held about one buyer, for an access or export request. */
export function exportBuyerData(store: CommerceStore, email: string) {
  const key = email.trim().toLowerCase()
  const orders = store.orders().filter((order) => order.email === key)
  const ids = new Set(orders.map((order) => order.orderId))
  return {
    email: key,
    orders,
    entitlements: store.entitlements().filter((entitlement) => ids.has(entitlement.orderId)),
    activity: store.activity().filter((activity) => ids.has(activity.orderId)),
  }
}
