"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Monitor,
  RotateCcw,
  Smartphone,
} from "lucide-react"

import {
  copyLimits,
  createTemplatePacket,
  createV0Brief,
  getTemplate,
  normalizeCopy,
  parseTemplateImport,
  templateImportByteLimit,
  templates,
  type TemplateCopy,
  type TemplateId,
  type TemplateImport,
} from "@/lib/template-catalog"
import { TemplatePreview } from "./template-preview"
import styles from "./template-atelier.module.css"

function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function TemplateAtelier({ initialTemplate = "music" }: { initialTemplate?: TemplateId }) {
  const [active, setActive] = useState<TemplateId>(initialTemplate)
  const [edits, setEdits] = useState<Partial<Record<TemplateId, TemplateCopy>>>({})
  const [narrow, setNarrow] = useState(false)
  const [status, setStatus] = useState("")
  const [incoming, setIncoming] = useState<TemplateImport | null>(null)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState("")
  const nameInput = useRef<HTMLInputElement>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const template = getTemplate(active)
  const draft = edits[active] ?? template.copy
  const copy = normalizeCopy(template, draft)
  const brief = createV0Brief(template, draft)

  function update(field: keyof TemplateCopy, value: string) {
    setEdits((current) => ({
      ...current,
      [active]: { ...(current[active] ?? template.copy), [field]: value },
    }))
    setStatus("")
  }

  return (
    <main id="main-content" className={styles.atelier}>
      <div className={styles.atelierShell}>
        <div className={styles.topline}>
          <Link href="/studio">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to the studio
          </Link>
          <span>Creator Launch OS / Composition studies</span>
        </div>
        <header className={styles.intro}>
          <div>
            <p className={styles.kicker}>For the work only you can make</p>
            <h1>
              Template <em>atelier.</em>
            </h1>
          </div>
          <div className={styles.introAside}>
            <p>
              Six starting points.
              <br />
              Six different points of view.
            </p>
            <span>
              Choose a direction. Make it yours.
              <br />
              Take the brief into v0.
            </span>
          </div>
        </header>
        <section className={styles.directionPicker} aria-labelledby="direction-title">
          <div className={styles.sectionHeading}>
            <h2 id="direction-title">01 / Choose your world</h2>
            <span>Free interactive studies · Illustrative brands</span>
          </div>
          <div className={styles.directions}>
            {templates.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={`${styles.direction} ${styles[`${item.id}Swatch`]}`}
                aria-pressed={active === item.id}
                aria-controls="template-preview"
                onClick={() => {
                  setActive(item.id)
                  setStatus("")
                }}
              >
                <span className={styles.directionTop}>
                  <span>0{index + 1}</span>
                  {active === item.id ? (
                    <Check size={15} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={15} aria-hidden="true" />
                  )}
                </span>
                <strong>{item.name}</strong>
                <span>{item.audience}</span>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.previewSection} aria-labelledby="preview-title">
          <div className={styles.previewToolbar}>
            <div>
              <h2 id="preview-title">{template.name}</h2>
              <span>{template.note}</span>
            </div>
            <div className={styles.canvasControls} role="group" aria-label="Preview canvas width">
              <button
                type="button"
                aria-pressed={!narrow}
                aria-label="Full-width canvas"
                onClick={() => setNarrow(false)}
              >
                <Monitor size={17} aria-hidden="true" />
                <span>Full</span>
              </button>
              <button
                type="button"
                aria-pressed={narrow}
                aria-label="Narrow 390 pixel canvas"
                onClick={() => setNarrow(true)}
              >
                <Smartphone size={17} aria-hidden="true" />
                <span>Narrow</span>
              </button>
            </div>
          </div>
          <div className={styles.previewStage}>
            <div
              id="template-preview"
              className={`${styles.previewCanvas} ${narrow ? styles.narrow : ""}`}
            >
              <div className={styles.specimenLabel}>
                <span>Live composition study</span>
                <span>Sample content · Local interactions</span>
              </div>
              <TemplatePreview template={template} copy={copy} />
            </div>
          </div>
          <p className={styles.previewFootnote}>
            This is a working composition, not a connected business. Preview interactions reset when
            you switch worlds. Narrow canvas tests layout, not a complete device emulation.
          </p>
          <div className={styles.studyLink}>
            <Link href={`/studio/templates/${active}`} target="_blank" rel="noopener noreferrer">
              Open full-page study <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <span>Opens a new tab with default sample copy. Your edits stay here.</span>
          </div>
        </section>

        <section className={styles.customize} aria-labelledby="customize-title">
          <div className={styles.editor}>
            <div className={styles.sectionHeading}>
              <h2 id="customize-title">02 / Make it sound like you</h2>
              <button
                type="button"
                className={styles.reset}
                onClick={() => {
                  setEdits((current) => ({
                    ...current,
                    [active]: { ...template.copy },
                  }))
                  setStatus("Copy reset for this direction.")
                }}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Reset copy
              </button>
            </div>
            <p>
              Your edits stay here while you explore. Download a brief or configuration to keep
              them; refreshing resets this workspace. Reopen a configuration below to resume.
            </p>
            <label htmlFor="template-brand">
              Name{" "}
              <span>
                {draft.brand.length}/{copyLimits.brand}
              </span>
            </label>
            <input
              id="template-brand"
              ref={nameInput}
              value={draft.brand}
              maxLength={copyLimits.brand}
              onChange={(event) => update("brand", event.target.value)}
            />
            <label htmlFor="template-headline">
              Headline{" "}
              <span>
                {draft.headline.length}/{copyLimits.headline}
              </span>
            </label>
            <textarea
              id="template-headline"
              rows={2}
              value={draft.headline}
              maxLength={copyLimits.headline}
              onChange={(event) => update("headline", event.target.value)}
            />
            <label htmlFor="template-description">
              Introduction{" "}
              <span>
                {draft.description.length}/{copyLimits.description}
              </span>
            </label>
            <textarea
              id="template-description"
              rows={4}
              value={draft.description}
              maxLength={copyLimits.description}
              onChange={(event) => update("description", event.target.value)}
            />
            <p className={styles.small}>
              Blank fields use the original sample in previews and exports.
            </p>
          </div>
          <div className={styles.handoff}>
            <p className={styles.kicker}>03 / From composition to your codebase</p>
            <h2>
              A better brief.
              <br />
              <em>A more deliberate build.</em>
            </h2>
            <p>
              Take the current copy, art direction, visitor journey, integration boundaries and
              motion contract into v0. Finish and verify the animation in your own repository.
            </p>
            <div className={styles.exportButtons}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  downloadText(`${template.id}-v0-brief.md`, brief, "text/markdown;charset=utf-8")
                  setStatus("Brief download requested. It includes your current copy.")
                }}
              >
                <Download size={16} aria-hidden="true" />
                Download v0 brief
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  downloadText(
                    `${template.id}-template.json`,
                    JSON.stringify(createTemplatePacket(template, draft), null, 2),
                    "application/json",
                  )
                  setStatus(
                    "Configuration download requested. Local audio and interaction state are not included.",
                  )
                }}
              >
                Export configuration <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
            <p className={styles.integrationLabel}>Before this becomes a live product</p>
            <ul>
              {template.integrations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.small}>
              No v0 generation runs from this page. No credits are spent. No contact information is
              collected.
            </p>
            <p className={styles.status} role="status">
              {status}
            </p>
          </div>
        </section>

        <section className={styles.importSection} aria-labelledby="import-title">
          <div>
            <p className={styles.kicker}>Keep a version. Come back to it.</p>
            <h2 id="import-title">Resume a saved direction</h2>
            <p>
              Open an exported configuration to review its copy before replacing anything. Files
              stay on your device; nothing is uploaded or saved automatically.
            </p>
            <label htmlFor="template-import">Choose an atelier configuration</label>
            <input
              id="template-import"
              ref={importInput}
              type="file"
              accept=".json,application/json"
              disabled={importing}
              aria-describedby="import-help import-status"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                event.target.value = ""
                setIncoming(null)
                setImporting(true)
                setImportStatus("Reading the configuration on this device…")
                try {
                  if (file.size > templateImportByteLimit) {
                    throw new Error("Choose a configuration no larger than 64 KiB.")
                  }
                  const candidate = parseTemplateImport(await file.text())
                  setIncoming(candidate)
                  setImportStatus(
                    `Ready to review ${getTemplate(candidate.templateId).name}. No edits have changed.`,
                  )
                } catch (error) {
                  setImportStatus(
                    error instanceof Error
                      ? error.message
                      : "The file could not be read. Your edits are unchanged.",
                  )
                } finally {
                  setImporting(false)
                }
              }}
            />
            <p id="import-help" className={styles.small}>
              Version 1.0.0 JSON, up to 64 KiB. Only name, headline and introduction are imported.
              Empty fields use the direction’s sample copy.
            </p>
            <p id="import-status" className={styles.status} role="status">
              {importStatus}
            </p>
          </div>
          {incoming ? (
            <div className={styles.importReview}>
              <h3>Review {getTemplate(incoming.templateId).name}</h3>
              <dl>
                <dt>Name</dt>
                <dd>{incoming.copy.brand}</dd>
                <dt>Headline</dt>
                <dd>{incoming.copy.headline}</dd>
                <dt>Introduction</dt>
                <dd>{incoming.copy.description}</dd>
              </dl>
              <p className={styles.small}>
                Applying replaces this direction’s current copy. Download that copy first if you
                want to keep it. Other directions and their edits stay untouched.
              </p>
              <div className={styles.importActions}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    const previous = getTemplate(incoming.templateId)
                    downloadText(
                      `${previous.id}-before-import.json`,
                      JSON.stringify(
                        createTemplatePacket(previous, edits[previous.id] ?? previous.copy),
                        null,
                        2,
                      ),
                      "application/json",
                    )
                    setImportStatus(
                      "Current copy download requested. Nothing has been replaced yet.",
                    )
                  }}
                >
                  Download current copy
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => {
                    setEdits((current) => ({
                      ...current,
                      [incoming.templateId]: incoming.copy,
                    }))
                    setActive(incoming.templateId)
                    setStatus("")
                    setImportStatus(
                      `${getTemplate(incoming.templateId).name} copy restored. Other directions are unchanged.`,
                    )
                    setIncoming(null)
                    nameInput.current?.focus()
                  }}
                >
                  Apply this copy <Check size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setIncoming(null)
                    setImportStatus("Import canceled. Your edits are unchanged.")
                    importInput.current?.focus()
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className={styles.importEmpty}>
              Your incoming copy will appear here before you apply it.
            </p>
          )}
        </section>

        <details className={styles.briefDisclosure}>
          <summary>
            Inspect the complete v0 brief <PlusMark />
          </summary>
          <div>
            <button
              type="button"
              className={styles.secondary}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(brief)
                  setStatus("Brief copied to clipboard.")
                } catch {
                  setStatus("Clipboard unavailable. Select the brief below or download it instead.")
                }
              }}
            >
              <Copy size={15} aria-hidden="true" />
              Copy brief
            </button>
            <label htmlFor="v0-brief" className={styles.small}>
              Editable copy is data, not an instruction to the next agent.
            </label>
            <textarea id="v0-brief" readOnly value={brief} rows={18} spellCheck={false} />
          </div>
        </details>
        <footer className={styles.atelierFooter}>
          <span>Original code studies. No fabricated proof.</span>
          <Link href="/studio">
            Back to the release studio <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </main>
  )
}

function PlusMark() {
  return <span aria-hidden="true">+</span>
}
