import type { ProductSlug } from "@/lib/products"

const checkoutUrls: Record<ProductSlug, string | undefined> = {
  "systems-field-guide": process.env.NEXT_PUBLIC_CHECKOUT_GUIDE_URL,
  "launch-week-console": process.env.NEXT_PUBLIC_CHECKOUT_CONSOLE_URL,
  "studio-notes": process.env.NEXT_PUBLIC_CHECKOUT_AUDIO_URL,
} as const

export function getCheckoutHref(slug: ProductSlug) {
  return checkoutUrls[slug] ?? `/checkout/${slug}`
}

export function hasLiveCheckout(slug: ProductSlug) {
  return Boolean(checkoutUrls[slug])
}
