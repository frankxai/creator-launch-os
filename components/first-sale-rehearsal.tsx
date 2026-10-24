"use client"

import { useState } from "react"
import { Check, Play, RotateCcw } from "lucide-react"

export interface RehearsalStep {
  number: string
  title: string
  summary: string
  badge: string
  outcomeLabel: string
  commandOrInput: string
  verifiedOutput: string
}

export function FirstSaleRehearsal({ steps }: { steps: readonly RehearsalStep[] }) {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [completedUpTo, setCompletedUpTo] = useState<number>(0)

  function runAllSteps() {
    setCompletedUpTo(steps.length - 1)
    setActiveStep(steps.length - 1)
  }

  function selectStep(index: number) {
    setActiveStep(index)
    if (index > completedUpTo) setCompletedUpTo(index)
  }

  function resetRehearsal() {
    setActiveStep(0)
    setCompletedUpTo(0)
  }

  const current = steps[activeStep] ?? steps[0]

  return (
    <div
      id="prove-it-works"
      data-rehearsal-panel
      className="overflow-hidden rounded-[2rem] border border-line bg-paper p-5 sm:p-9"
    >
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-muted">Prove it works before you go live</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Walk one test order from webhook to delivery email and refund revocation.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Every step below shows results from the real commerce engine in <code className="font-mono text-xs text-ink">lib/commerce/engine.ts</code>, computed at build time against fixture events. No live merchant account or network request is needed to inspect the loop.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runAllSteps}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-ink/90"
          >
            <Play className="size-3.5" aria-hidden="true" />
            Run all 4 test steps
          </button>
          {completedUpTo > 0 ? (
            <button
              type="button"
              onClick={resetRehearsal}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/20 px-4 text-xs font-semibold text-ink/75 hover:border-ink"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="tablist" aria-label="First-sale rehearsal steps">
        {steps.map((step, index) => {
          const isCurrent = index === activeStep
          const isDone = index <= completedUpTo
          return (
            <button
              key={step.number}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => selectStep(index)}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-colors ${
                isCurrent
                  ? "border-ink bg-ink text-paper"
                  : isDone
                    ? "border-ink/25 bg-paper-bright text-ink"
                    : "border-line bg-paper text-ink/70 hover:border-ink/35"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">Step {step.number}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] ${
                    isCurrent ? "bg-acid text-ink font-semibold" : "border border-current/20"
                  }`}
                >
                  {isDone ? <Check className="size-3" aria-hidden="true" /> : null}
                  {step.badge}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-5">{step.title}</p>
              <p className={`mt-1 text-xs leading-5 ${isCurrent ? "text-white/72" : "text-muted"}`}>
                {step.outcomeLabel}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 rounded-2xl border border-line bg-paper-bright p-4 sm:p-7 lg:grid-cols-2" role="tabpanel">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">
            Step {current.number} input · {current.badge}
          </p>
          <h3 className="mt-2 text-xl font-semibold">{current.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{current.summary}</p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-xs leading-6 text-paper">
            <code>{current.commandOrInput}</code>
          </pre>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">Verified engine output (computed at build)</p>
          <p className="mt-2 text-sm font-semibold text-ink">{current.outcomeLabel}</p>
          <pre
            data-rehearsal-output
            className="mt-4 overflow-x-auto rounded-xl border border-line bg-paper p-4 font-mono text-xs leading-6 text-ink"
          >
            <code>{current.verifiedOutput}</code>
          </pre>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted">
              Run the HTTP rehearsal against a local server:{" "}
              <code className="font-mono text-ink">pnpm commerce:rehearse http://localhost:3000</code>
            </span>
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => selectStep(activeStep + 1)}
                className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper"
              >
                Next step →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
