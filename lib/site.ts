export const siteConfig = {
  name: "Edition Zero",
  productName: "Creator Launch OS",
  description:
    "A free, deployable storefront and release studio for independent creators.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://creator-launch-os.vercel.app",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "studio@example.com",
  navigation: [
    { label: "Releases", href: "/products" },
    { label: "Studio", href: "/studio" },
    { label: "Source", href: "https://github.com/frankxai/creator-launch-os" },
  ],
} as const
