export type Stage = "concept" | "building" | "gated" | "live"

export type PriceBand =
  | "free-only"
  | "under-25"
  | "25-99"
  | "100-299"
  | "300-999"
  | "over-1000"
  | "company-pays"

export type Urgency = "now" | "this-quarter" | "exploring"

export interface DemandSignal {
  productId: string
  email: string
  name?: string

  role?: string
  pain?: string
  urgency?: Urgency
  priceBand?: PriceBand
  alternative?: string

  source: string
  referrer?: string
  utm?: Record<string, string>
  position: number
  createdAt: string
  consent: true
  verified?: boolean
  stepTokenHash?: string
  verifyTokenHash?: string
}

export interface WaitlistState {
  productId: string
  count: number
  position?: number
  /** Withheld below the product's publicCountThreshold. Never estimate it. */
  publicCount: number | null
  foundingCohort: number
  foundingSeatsLeft: number | null
  stage: Stage
  /** Returned only on initial Step-1 claim so Step-2 answers cannot be overwritten by email alone. */
  stepToken?: string
}
