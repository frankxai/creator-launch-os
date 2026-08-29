const sourceUrl = "https://github.com/frankxai/creator-launch-os"
const fallbackSiteUrl = "https://creator-launch-os-starlight-intelligence.vercel.app"

function resolveSiteUrl() {
  const vercelProjectUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (vercelProjectUrl ? `https://${vercelProjectUrl}` : fallbackSiteUrl)

  try {
    const url = new URL(candidate)
    return url.protocol === "https:" && !url.username && !url.password
      ? url.origin
      : fallbackSiteUrl
  } catch {
    return fallbackSiteUrl
  }
}

function resolveContactEmail() {
  const candidate = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()
  return candidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)
    ? candidate
    : null
}

export const siteConfig = {
  name: "Edition Zero",
  productName: "Creator Launch OS",
  description:
    "A free, deployable storefront and release studio for independent creators.",
  url: resolveSiteUrl(),
  email: resolveContactEmail(),
  sourceUrl,
  navigation: [
    { label: "Releases", href: "/products" },
    { label: "Studio", href: "/studio" },
    { label: "Source", href: sourceUrl },
  ],
} as const
