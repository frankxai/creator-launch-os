"use client"

import { RotateCcw } from "lucide-react"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="grid min-h-[68vh] place-items-center px-4 py-20">
      <div className="max-w-xl text-center">
        <p className="eyebrow text-muted">Release interrupted</p>
        <h1 className="mt-5 font-serif text-5xl leading-tight">This page did not finish loading.</h1>
        <p className="mt-5 text-base leading-7 text-ink/62">Try the request once more. If it repeats, check the deployment logs before changing the interface.</p>
        <button type="button" onClick={reset} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper">
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </main>
  )
}
