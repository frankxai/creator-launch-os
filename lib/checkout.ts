import type { ProductSlug } from "@/lib/products"

function resolveCheckoutUrl(value: string | undefined) {
  const candidate = value?.trim()

  if (!candidate) {
    return undefined
  }

  try {
    const url = new URL(candidate)
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

const checkoutUrls: Record<ProductSlug, string | undefined> = {
  "systems-field-guide": resolveCheckoutUrl(process.env.NEXT_PUBLIC_CHECKOUT_GUIDE_URL),
  "launch-week-console": resolveCheckoutUrl(process.env.NEXT_PUBLIC_CHECKOUT_CONSOLE_URL),
  "studio-notes": resolveCheckoutUrl(process.env.NEXT_PUBLIC_CHECKOUT_AUDIO_URL),
} as const

export function getCheckoutHref(slug: ProductSlug) {
  return checkoutUrls[slug] ?? `/checkout/${slug}`
}

export function hasLiveCheckout(slug: ProductSlug) {
  return Boolean(checkoutUrls[slug])
}
