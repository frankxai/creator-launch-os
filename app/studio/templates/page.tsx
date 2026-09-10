import type { Metadata } from "next"
import { TemplateAtelier } from "@/components/template-atelier"

export const metadata: Metadata = {
  title: "Template atelier",
  description:
    "Six interactive composition studies for independent creators, music producers and technical teams.",
  robots: { index: false, follow: false },
}

export default function TemplatesPage() {
  return <TemplateAtelier />
}
