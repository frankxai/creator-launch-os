"use client"

import { useEffect, useRef, useState } from "react"
import { PAIN_PROMPT, PRICE_BANDS, PRICE_PROMPT, URGENCY, rolesFor } from "./questions"
import type { WaitlistState } from "./types"

export type WaitlistCopy = {
  join: string
  joining: string
  quiet: string
  waiting: string
  entered: string
  enteredNoPosition: string
  seats: string
  intro: string
  roleLabel: string
  pricePrompt: string
  urgencyLabel: string
  painPrompt: string
  painPlaceholder: string
  send: string
  saving: string
  skip: string
  done: string
  doneNoPosition: string
  doneText: string
  consent: string
}

export const DEFAULT_COPY: WaitlistCopy = {
  join: "Join the waitlist",
  joining: "Joining...",
  quiet: "One email when this edition opens. Nothing else.",
  waiting: "{count} people waiting.",
  entered: "You are in, at number {n}.",
  enteredNoPosition: "You are in.",
  seats: "{n} founding places left. {benefit}",
  intro: "Three optional questions. They decide what gets built first, and what it costs.",
  roleLabel: "You are",
  pricePrompt: PRICE_PROMPT,
  urgencyLabel: "How soon",
  painPrompt: PAIN_PROMPT,
  painPlaceholder: "One line is plenty.",
  send: "Save answers",
  saving: "Saving...",
  skip: "Skip",
  done: "Thank you. You are number {n}.",
  doneNoPosition: "Thank you.",
  doneText: "You will hear from us when {product} is ready, and not before.",
  consent: "Email me about {product}. Your address and your answers stay with this list. Unsubscribe in any email.",
}

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""))

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Props = {
  productId: string
  productName: string
  foundingBenefit?: string
  initialState?: WaitlistState
  endpoint?: string
  placeholder?: string
  copy?: Partial<WaitlistCopy>
}

export function WaitlistForm({
  productId,
  productName,
  foundingBenefit,
  initialState,
  endpoint = "/api/waitlist",
  placeholder = "you@domain.com",
  copy: copyOverrides,
}: Props) {
  const copy = { ...DEFAULT_COPY, ...copyOverrides }
  const [step, setStep] = useState<"join" | "refine" | "done">("join")
  const [state, setState] = useState<WaitlistState | undefined>(initialState)
  const [stepToken, setStepToken] = useState<string | undefined>(undefined)
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const emailInputRef = useRef<HTMLInputElement>(null)
  const consentInputRef = useRef<HTMLInputElement>(null)
  const refineStatusRef = useRef<HTMLParagraphElement>(null)
  const doneStatusRef = useRef<HTMLDivElement>(null)

  const emailId = `${productId}-waitlist-email`
  const errorId = `${productId}-waitlist-error`
  const noteId = `${productId}-waitlist-note`

  useEffect(() => {
    if (step === "refine") refineStatusRef.current?.focus()
    if (step === "done") doneStatusRef.current?.focus()
  }, [step])

  async function post(payload: Record<string, unknown>) {
    setBusy(true)
    setError("")
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email, consent, stepToken, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Something went wrong")
      setState(data)
      if (typeof data.stepToken === "string") setStepToken(data.stepToken)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      return false
    } finally {
      setBusy(false)
    }
  }

  const seats = state?.foundingSeatsLeft ?? initialState?.foundingSeatsLeft ?? null
  const shownCount = state?.publicCount ?? initialState?.publicCount ?? null

  if (step === "join") {
    return (
      <form
        noValidate
        className="mt-4 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          const trimmedEmail = email.trim()
          if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
            setError("Valid email required")
            emailInputRef.current?.focus()
            return
          }
          if (!consent) {
            setError("Consent required")
            consentInputRef.current?.focus()
            return
          }
          const source = typeof window === "undefined" ? "" : window.location.pathname
          if (await post({ source })) setStep("refine")
        }}
      >
        <div className="space-y-2">
          <label htmlFor={emailId} className="wl-label">
            {"Email address to join the waitlist for " + productName}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              ref={emailInputRef}
              id={emailId}
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (error) setError("")
              }}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${errorId} ${noteId}` : noteId}
              className="wl-input flex-1"
            />
            <button type="submit" disabled={busy} className="wl-btn">
              {busy ? copy.joining : copy.join}
            </button>
          </div>
        </div>

        <label className="wl-note flex items-start gap-2.5">
          <input
            ref={consentInputRef}
            type="checkbox"
            required
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked)
              if (error) setError("")
            }}
            aria-invalid={Boolean(error && !consent)}
            aria-describedby={error ? errorId : undefined}
            className="wl-check mt-1"
          />
          <span>{fill(copy.consent, { product: productName })}</span>
        </label>

        {error ? (
          <p id={errorId} className="wl-error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <p id={noteId} className="wl-note">
          {shownCount !== null ? fill(copy.waiting, { count: shownCount.toLocaleString() }) + " " : ""}
          {foundingBenefit && seats !== 0 ? foundingBenefit : copy.quiet}
        </p>
      </form>
    )
  }

  if (step === "refine") {
    return (
      <div className="mt-4 space-y-5">
        <div className="wl-panel">
          <p ref={refineStatusRef} tabIndex={-1} className="wl-panel-title" role="status" aria-live="polite">
            {state?.position ? fill(copy.entered, { n: state.position }) : copy.enteredNoPosition}
          </p>
          {foundingBenefit && seats !== null && seats > 0 ? (
            <p className="wl-panel-text">{fill(copy.seats, { n: seats, benefit: foundingBenefit })}</p>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="wl-note">{copy.intro}</p>

          <Choice
            label={copy.roleLabel}
            options={rolesFor(productId)}
            value={answers.role}
            onPick={(value) => setAnswers({ ...answers, role: value })}
          />
          <Choice
            label={copy.pricePrompt}
            options={PRICE_BANDS.map((band) => band.label)}
            values={PRICE_BANDS.map((band) => band.value)}
            value={answers.priceBand}
            onPick={(value) => setAnswers({ ...answers, priceBand: value })}
          />
          <Choice
            label={copy.urgencyLabel}
            options={URGENCY.map((item) => item.label)}
            values={URGENCY.map((item) => item.value)}
            value={answers.urgency}
            onPick={(value) => setAnswers({ ...answers, urgency: value })}
          />

          <label className="block space-y-2">
            <span className="wl-label">{copy.painPrompt}</span>
            <textarea
              rows={2}
              maxLength={400}
              value={answers.pain ?? ""}
              onChange={(event) => setAnswers({ ...answers, pain: event.target.value })}
              className="wl-input w-full"
              placeholder={copy.painPlaceholder}
            />
          </label>
        </div>

        {error ? (
          <p id={errorId} className="wl-error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={async () => {
              if (await post(answers)) setStep("done")
            }}
            disabled={busy}
            className="wl-btn wl-btn-quiet"
          >
            {busy ? copy.saving : copy.send}
          </button>
          <button type="button" onClick={() => setStep("done")} className="wl-link">
            {copy.skip}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={doneStatusRef} tabIndex={-1} className="mt-4 wl-panel" role="status" aria-live="polite">
      <p className="wl-panel-title">{state?.position ? fill(copy.done, { n: state.position }) : copy.doneNoPosition}</p>
      <p className="wl-panel-text">{fill(copy.doneText, { product: productName })}</p>
    </div>
  )
}

function Choice({
  label,
  options,
  values,
  value,
  onPick,
}: {
  label: string
  options: string[]
  values?: string[]
  value?: string
  onPick: (value: string) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="wl-label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const optionValue = values?.[index] ?? option
          const active = value === optionValue
          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onPick(optionValue)}
              aria-pressed={active}
              className={"wl-chip" + (active ? " wl-chip-active" : "")}
            >
              {option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
