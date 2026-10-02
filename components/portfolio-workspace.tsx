"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { copyLimits, getTemplate } from "@/lib/template-catalog"
import { examplePortfolio, type PortfolioCase, type PortfolioContent } from "@/lib/portfolio-content"
import { examplePublication } from "@/lib/site-publication"
import { parsePortfolioProject, portfolioProjectByteLimit, portfolioProjectFiles, type PortfolioProject } from "@/lib/portfolio-project"
import { TemplatePreview } from "./template-preview"
import atelier from "./template-atelier.module.css"
import styles from "./portfolio-workspace.module.css"

function download(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Field({ id, label, value, maximum, onChange, multiline = false }: {
  id: string; label: string; value: string; maximum: number; onChange: (value: string) => void; multiline?: boolean
}) {
  const shared = { id, value, maxLength: maximum, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value) }
  return <div className={styles.field}>
    <div className={styles.fieldLabel}><label htmlFor={id}>{label}</label><span aria-hidden="true">{value.length}/{maximum}</span></div>
    {multiline ? <textarea {...shared} rows={3} /> : <input {...shared} />}
  </div>
}

export function PortfolioWorkspace({ initialProject, standalone = false }: {
  initialProject?: PortfolioProject; standalone?: boolean
}) {
  const template = getTemplate("portfolio")
  const [draft, setDraft] = useState<PortfolioProject>(() => initialProject ?? {
    schemaVersion: "1.0.0", format: "monograph-project", copy: { ...template.copy },
    portfolio: structuredClone(examplePortfolio), publication: { ...examplePublication },
  })
  const [incoming, setIncoming] = useState<PortfolioProject | null>(null)
  const [reading, setReading] = useState(false)
  const [status, setStatus] = useState("")
  const [removedCases, setRemovedCases] = useState<PortfolioCase[] | null>(null)
  const [narrow, setNarrow] = useState(false)
  const firstField = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  let files: ReturnType<typeof portfolioProjectFiles> | null = null
  let error = ""
  let previewPortfolio: PortfolioContent | undefined
  try {
    files = portfolioProjectFiles(draft)
    previewPortfolio = files["content/portfolio.json"]
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Complete the project before exporting site files."
  }

  function update(next: PortfolioProject) { setDraft(next); setStatus("") }
  function saveProject(name: string) {
    try {
      download(name, parsePortfolioProject(JSON.stringify(draft)))
      setStatus("Project download requested, including incomplete fields. Nothing was published.")
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Project could not be saved. Your edits are still here.") }
  }
  function updateCase(index: number, patch: Partial<PortfolioCase>) {
    update({ ...draft, portfolio: { ...draft.portfolio, cases: draft.portfolio.cases.map((entry, position) => position === index ? { ...entry, ...patch } : entry) } })
    setRemovedCases(null)
  }

  return <main id="main-content" className={`${atelier.atelier} ${styles.workspace}`}>
    <div className={atelier.atelierShell}>
      <header className={styles.header}>
        <a href={standalone ? "/" : "/studio/templates"}>{standalone ? "View saved site" : "Back to the template atelier"}</a>
        <p className={atelier.kicker}>Monograph / Your work, in your words</p>
        <h1>Build your portfolio.</h1>
        <p>Edit your cases, contact and publication settings. Save a project to keep every field.
          Refreshing resets unsaved edits; files stay on your device.</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.editor}>
          <section aria-labelledby="identity-title">
            <h2 id="identity-title">Identity and practice</h2>
            <label htmlFor="portfolio-brand">Name</label>
            <input id="portfolio-brand" ref={firstField} value={draft.copy.brand} maxLength={copyLimits.brand}
              onChange={(event) => update({ ...draft, copy: { ...draft.copy, brand: event.target.value } })} />
            {([ ["headline", "Headline", copyLimits.headline], ["description", "Description", copyLimits.description] ] as const).map(([key, label, maximum]) =>
              <Field key={key} id={`portfolio-${key}`} label={label} value={draft.copy[key]} maximum={maximum} multiline
                onChange={(value) => update({ ...draft, copy: { ...draft.copy, [key]: value } })} />)}
            {([ ["navigation", "Navigation", 100], ["practice", "Practice heading", 100], ["disciplines", "Disciplines", 160], ["introduction", "Introduction heading", 100] ] as const).map(([key, label, maximum]) =>
              <Field key={key} id={`portfolio-${key}`} label={label} value={draft.portfolio[key]} maximum={maximum}
                onChange={(value) => update({ ...draft, portfolio: { ...draft.portfolio, [key]: value } })} />)}
          </section>

          <section aria-labelledby="cases-title">
            <h2 id="cases-title">Case studies <span>{draft.portfolio.cases.length}/6</span></h2>
            <p>Use your own work and evidence. Keep examples marked as illustrative.</p>
            {draft.portfolio.cases.map((entry, index) => <details key={index} className={styles.case} open={index === 0}>
              <summary>Case {index + 1}: {entry.title || "Untitled case"}</summary>
              {([ ["title", "Title", 160], ["category", "Category", 80], ["role", "Your role", 160], ["poster", "Poster text", 100],
                ["summary", "Summary", 600], ["context", "Context", 2000], ["decision", "Decision", 2000], ["evidence", "Evidence", 2000] ] as const).map(([key, label, maximum]) =>
                <Field key={key} id={`case-${index}-${key}`} label={label} value={entry[key]} maximum={maximum} multiline={maximum >= 600}
                  onChange={(value) => updateCase(index, { [key]: value })} />)}
              <Field id={`case-${index}-url`} label="Evidence URL (optional HTTPS)" value={entry.evidenceUrl ?? ""} maximum={2048}
                onChange={(value) => updateCase(index, { evidenceUrl: value || null })} />
              <label className={styles.check}><input type="checkbox" checked={entry.illustrative}
                onChange={(event) => updateCase(index, { illustrative: event.target.checked })} />This is an illustrative example</label>
              <button type="button" disabled={draft.portfolio.cases.length === 1} onClick={() => {
                setRemovedCases(structuredClone(draft.portfolio.cases))
                update({ ...draft, portfolio: { ...draft.portfolio, cases: draft.portfolio.cases.filter((_, position) => position !== index) } })
                setStatus("Case removed from this draft. Undo is available until you edit or add another case.")
              }}>Remove case {index + 1}</button>
            </details>)}
            <div className={styles.actions}>
              <button type="button" disabled={draft.portfolio.cases.length === 6} onClick={() => {
                setRemovedCases(null)
                update({ ...draft, portfolio: { ...draft.portfolio, cases: [...draft.portfolio.cases, {
                  title: "", category: "", role: "", poster: "", summary: "", context: "", decision: "", evidence: "", evidenceUrl: null, illustrative: true,
                }] } })
              }}>Add a case</button>
              {removedCases && <button type="button" onClick={() => {
                update({ ...draft, portfolio: { ...draft.portfolio, cases: removedCases } })
                setRemovedCases(null)
                setStatus("Removed case restored.")
              }}>Undo removal</button>}
            </div>
          </section>

          <section aria-labelledby="contact-title">
            <h2 id="contact-title">Contact</h2>
            {([ ["title", "Contact heading", 160], ["description", "Contact description", 600], ["label", "Contact link label", 80] ] as const).map(([key, label, maximum]) =>
              <Field key={key} id={`contact-${key}`} label={label} value={draft.portfolio.contact[key]} maximum={maximum} multiline={key === "description"}
                onChange={(value) => update({ ...draft, portfolio: { ...draft.portfolio, contact: { ...draft.portfolio.contact, [key]: value } } })} />)}
            <Field id="contact-href" label="Contact destination (HTTPS or plain mailto:)" value={draft.portfolio.contact.href ?? ""} maximum={2048}
              onChange={(value) => update({ ...draft, portfolio: { ...draft.portfolio, contact: { ...draft.portfolio.contact, href: value || null } } })} />
          </section>

          <section aria-labelledby="publication-title">
            <h2 id="publication-title">Publication settings</h2>
            <label htmlFor="publication-mode">Presentation</label>
            <select id="publication-mode" value={draft.publication.mode} onChange={(event) => update({ ...draft,
              publication: { ...draft.publication, mode: event.target.value as "preview" | "published", indexable: event.target.value === "preview" ? false : draft.publication.indexable } })}>
              <option value="preview">Preview with example notices</option><option value="published">Published presentation</option>
            </select>
            <Field id="publication-canonical" label="Your canonical HTTPS URL" value={draft.publication.canonicalUrl ?? ""} maximum={2048}
              onChange={(value) => update({ ...draft, publication: { ...draft.publication, canonicalUrl: value || null } })} />
            <label className={styles.check}><input type="checkbox" checked={draft.publication.indexable} disabled={draft.publication.mode === "preview"}
              onChange={(event) => update({ ...draft, publication: { ...draft.publication, indexable: event.target.checked } })} />Request search indexing</label>
            <p>Published presentation requires completed cases marked non-illustrative, a contact destination and your canonical URL.
              Verify your rights, claims and destinations before changing those declarations. These settings do not deploy the site.</p>
          </section>
        </div>

        <aside className={styles.preview} aria-labelledby="preview-heading">
          <h2 id="preview-heading">Preview and save</h2>
          <div className={styles.actions} role="group" aria-label="Preview width">
            <button type="button" aria-pressed={!narrow} onClick={() => setNarrow(false)}>Full width</button>
            <button type="button" aria-pressed={narrow} onClick={() => setNarrow(true)}>390px canvas</button>
          </div>
          {files && previewPortfolio ? <div className={`${atelier.previewCanvas} ${narrow ? atelier.narrow : ""}`}>
            <TemplatePreview template={template} copy={files["content/site.json"].copy} portfolio={previewPortfolio} standalone={false} />
          </div> : <div className={styles.empty}><p>Complete the fields below to preview this version. Your draft can still be saved.</p><p role="status">{error}</p></div>}
          <div className={styles.save}>
            <h3>Keep your work</h3>
            <button type="button" onClick={() => saveProject("monograph-project.json")}>Save project</button>
            <p>Includes identity, every case, contact and publication settings. Use this file to resume or export a standalone source project.</p>
            {files && <details><summary>Download validated site files</summary><p>Replace only the matching files in your own exported project&apos;s content folder. Keep a backup first. This does not update the running site.</p>
              {Object.entries(files).map(([name, value]) => <button key={name} type="button" onClick={() => { download(name.split("/").at(-1)!, value); setStatus(`${name} download requested.`) }}>Download {name}</button>)}
            </details>}
            <p role="status" aria-live="polite">{status}</p>
          </div>
          <section className={styles.save} aria-labelledby="resume-title">
            <h3 id="resume-title">Resume a saved project</h3>
            <label htmlFor="portfolio-import">Choose a Monograph project</label>
            <input id="portfolio-import" ref={fileInput} type="file" accept=".json,application/json" disabled={reading}
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                event.target.value = ""
                setReading(true); setIncoming(null); setStatus("Reading on this device. Current edits are unchanged.")
                try {
                  if (file.size > portfolioProjectByteLimit) throw new Error("Choose a Monograph project no larger than 256 KiB.")
                  setIncoming(parsePortfolioProject(await file.text()))
                  setStatus("Review the incoming project before applying it.")
                } catch (cause) { setStatus(cause instanceof Error ? cause.message : "File could not be read. Current edits are unchanged.") }
                finally { setReading(false) }
              }} />
            {incoming && <div className={styles.review}>
              <h4>Review incoming project</h4>
              <p>{incoming.copy.brand || "Untitled project"} / {incoming.portfolio.cases.length} cases / {incoming.publication.mode}</p>
              <p>Applying replaces this draft. Save the current project first to retain it.</p>
              <button type="button" onClick={() => saveProject("monograph-before-import.json")}>Save current project</button>
              <button type="button" onClick={() => { setDraft(incoming); setIncoming(null); setRemovedCases(null); setStatus("Saved project restored."); firstField.current?.focus() }}>Apply project</button>
              <button type="button" onClick={() => { setIncoming(null); setStatus("Import canceled. Current edits are unchanged."); fileInput.current?.focus() }}>Cancel import</button>
            </div>}
          </section>
        </aside>
      </div>
    </div>
  </main>
}
