import { Check, Circle, Radio } from "lucide-react"

const releaseSteps = [
  { label: "Offer is specific", detail: "One audience · one outcome", done: true },
  { label: "Delivery tested", detail: "Clean-account run complete", done: true },
  { label: "Proof attached", detail: "3 field notes linked", done: true },
  { label: "Release window", detail: "Thursday · 09:00 UTC", done: false },
] as const

export function LaunchConsole() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-ink text-paper shadow-[0_28px_80px_rgba(26,27,22,0.22)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-acid" aria-hidden="true" />
          <span className="font-mono text-[11px] tracking-[0.16em] text-white/70">Release 01</span>
        </div>
        <span className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] text-white/55">
          Demo data
        </span>
      </div>

      <div className="poster-grid p-5 sm:p-7">
        <div className="border-b border-white/10 pb-6">
          <p className="font-serif text-3xl leading-none sm:text-4xl">The Systems Field Guide</p>
          <div className="mt-5 flex items-end justify-between gap-5">
            <p className="max-w-xs text-sm leading-6 text-white/55">
              A small release with a complete proof, delivery, and learning loop.
            </p>
            <span className="font-mono text-4xl text-acid">92%</span>
          </div>
        </div>

        <ol className="divide-y divide-white/10">
          {releaseSteps.map((step) => (
            <li key={step.label} className="flex items-start gap-3 py-4">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-white/20">
                {step.done ? (
                  <Check className="size-3 text-acid" aria-hidden="true" />
                ) : (
                  <Circle className="size-2.5 text-coral" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{step.label}</span>
                <span className="mt-1 block text-xs text-white/58">{step.detail}</span>
              </span>
              <span className="font-mono text-[10px] tracking-wider text-white/55">
                {step.done ? "Ready" : "Next"}
              </span>
            </li>
          ))}
        </ol>

        <div className="signal-line mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[92%] rounded-full bg-acid" />
        </div>
      </div>
    </div>
  )
}
