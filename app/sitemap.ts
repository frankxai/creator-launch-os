import type { MetadataRoute } from "next"

import { products } from "@/lib/products"
import { siteConfig } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/products", "/studio"]

  return [
    ...routes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date("2026-08-25"),
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.8,
    })),
    ...products.map((product) => ({
      url: `${siteConfig.url}/products/${product.slug}`,
      lastModified: new Date("2026-08-25"),
      changeFrequency: "monthly" as const,
      priority: product.featured ? 0.9 : 0.7,
    })),
  ]
}
