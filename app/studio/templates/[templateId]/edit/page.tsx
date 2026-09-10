import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TemplateAtelier } from "@/components/template-atelier"
import { findTemplate, templates } from "@/lib/template-catalog"

export const dynamicParams = false

export function generateStaticParams() {
  return templates.map(({ id }) => ({ templateId: id }))
}

export async function generateMetadata({
  params,
}: PageProps<"/studio/templates/[templateId]/edit">): Promise<Metadata> {
  const template = findTemplate((await params).templateId)
  if (!template) notFound()
  return {
    title: `Personalize ${template.name}`,
    description: `Edit the ${template.audience.toLowerCase()} composition and export a reusable v0 brief.`,
    robots: { index: false, follow: false },
  }
}

export default async function TemplateEditorPage({
  params,
}: PageProps<"/studio/templates/[templateId]/edit">) {
  const template = findTemplate((await params).templateId)
  if (!template) notFound()
  return <TemplateAtelier key={template.id} initialTemplate={template.id} />
}
