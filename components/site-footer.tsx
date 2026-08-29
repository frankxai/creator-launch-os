import Link from "next/link"

import { siteConfig } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-bright">
      <div className="shell grid gap-10 py-12 sm:grid-cols-[1.5fr_1fr] sm:items-end">
        <div>
          <p className="eyebrow text-muted">Creator Launch OS</p>
          <p className="mt-4 max-w-lg font-serif text-3xl leading-tight">
            Make the work clear. Keep the relationship.
          </p>
        </div>
        <div className="sm:text-right">
          {siteConfig.email ? (
            <a className="text-sm font-semibold underline decoration-line underline-offset-4" href={`mailto:${siteConfig.email}`}>
              {siteConfig.email}
            </a>
          ) : (
            <a
              className="text-sm font-semibold underline decoration-line underline-offset-4"
              href={siteConfig.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Remix the source
            </a>
          )}
          <p className="mt-3 text-xs leading-5 text-muted">
            Free and open source. Replace the sample products, connect your checkout, and publish.
          </p>
          <Link href="/studio" className="mt-3 inline-block text-xs font-semibold text-ink/70 hover:text-ink">
            Open the sample studio →
          </Link>
        </div>
      </div>
    </footer>
  )
}
