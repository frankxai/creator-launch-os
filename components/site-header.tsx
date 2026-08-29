import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { siteConfig } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="shell flex min-h-18 items-center justify-between gap-6 py-4">
        <Link href="/" className="group inline-flex items-center gap-3" aria-label="Edition Zero home">
          <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-bold text-paper transition-transform group-hover:-rotate-6">
            0
          </span>
          <span>
            <span className="block text-sm font-semibold leading-none">{siteConfig.name}</span>
            <span className="mt-1 block font-mono text-[10px] tracking-[0.16em] text-muted">
              Independent releases
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-4 sm:gap-7">
          {siteConfig.navigation.map((item) => {
            const isExternal = item.href.startsWith("http")
            return (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink/65 transition-colors hover:text-ink"
                {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {item.label}
                {isExternal ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : null}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
