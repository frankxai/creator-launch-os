import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { TemplatePreview } from "@/components/template-preview"
import { findTemplate, templates } from "@/lib/template-catalog"
import styles from "@/components/template-atelier.module.css"

export const dynamicParams = false

export function generateStaticParams() {
  return templates.map(({ id }) => ({ templateId: id }))
}

export async function generateMetadata({
  params,
}: PageProps<"/studio/templates/[templateId]">): Promise<Metadata> {
  const template = findTemplate((await params).templateId)
  if (!template) notFound()
  return {
    title: `${template.name} — Composition study`,
    description: template.note,
    robots: { index: false, follow: false },
  }
}

export default async function TemplateStudyPage({
  params,
}: PageProps<"/studio/templates/[templateId]">) {
  const template = findTemplate((await params).templateId)
  if (!template) notFound()
  return (
    <main id="main-content" className={`${styles.atelier} ${styles.studyPage}`}>
      <header className={styles.studyToolbar}>
        <div>
          <h1>
            {template.name} / {template.audience}
          </h1>
          <p>Composition study · Illustrative content · Local interactions</p>
        </div>
        <Link href={`/studio/templates/${template.id}/edit`}>Personalize this direction →</Link>
      </header>
      <div className={styles.previewCanvas}>
        <TemplatePreview template={template} copy={template.copy} />
      </div>
      <footer className={styles.studyToolbar}>
        <p>An interactive example, not a connected business. No signup, payment or upload.</p>
        <Link href="/studio/templates">Explore all six directions →</Link>
      </footer>
    </main>
  )
}
