import { siteConfig } from "@/lib/site"

export function GET() {
  return Response.json(
    {
      ok: true,
      service: siteConfig.productName,
      checkout: "optional",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
