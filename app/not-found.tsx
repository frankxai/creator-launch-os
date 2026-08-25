import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main id="main-content" className="grid min-h-[68vh] place-items-center px-4 py-20">
      <div className="max-w-xl text-center">
        <p className="eyebrow text-muted">404 / no release here</p>
        <h1 className="mt-5 font-serif text-6xl leading-none">The shelf is empty.</h1>
        <p className="mt-6 text-base leading-7 text-ink/62">The release may have moved, or the address may be incomplete.</p>
        <Link href="/products" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Return to releases
        </Link>
      </div>
    </main>
  )
}
