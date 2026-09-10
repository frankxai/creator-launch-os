"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowDown, ArrowRight, Check, Headphones, Plus, X } from "lucide-react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { localAudioSource } from "@/lib/local-audio"

import {
  briefChecklist,
  challengeDays,
  type TemplateCopy,
  type TemplateDefinition,
} from "@/lib/template-catalog"
import styles from "./template-atelier.module.css"

gsap.registerPlugin(useGSAP)

type PreviewProps = { template: TemplateDefinition; copy: TemplateCopy }

function Heading({ copy, eyebrow }: { copy: TemplateCopy; eyebrow: string }) {
  return (
    <div data-motion-item>
      <p className={styles.kicker}>{eyebrow}</p>
      <h2 className={styles.headline}>{copy.headline}</h2>
      <p className={styles.description}>{copy.description}</p>
    </div>
  )
}

function PreviewNav({ brand, children }: { brand: string; children: ReactNode }) {
  return (
    <div className={styles.previewNav}>
      <span className={styles.wordmark}>{brand}</span>
      <span className={styles.previewNavNote}>{children}</span>
    </div>
  )
}

function MusicPreview({ copy }: { copy: TemplateCopy }) {
  const [track, setTrack] = useState<{ url: string; name: string } | null>(null)
  const [error, setError] = useState("")
  const input = useRef<HTMLInputElement>(null)
  useEffect(
    () => () => {
      if (track) URL.revokeObjectURL(track.url)
    },
    [track],
  )

  return (
    <>
      <PreviewNav brand={copy.brand}>Independent sound / Listening room</PreviewNav>
      <div className={styles.musicHero}>
        <div className={styles.musicIntro}>
          <Heading copy={copy} eyebrow="A room for close listening" />
          <a className={styles.previewButton} href="#listening-room">
            Enter the listening room <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <div
          className={styles.recordSleeve}
          data-motion-item
          aria-label="Illustrative typographic release sleeve"
        >
          <div className={styles.sleeveTop}>
            <span>Study no. 01</span>
            <Headphones size={24} aria-hidden="true" />
          </div>
          <div className={styles.sleeveTitle}>
            Between
            <br />
            <em>the tracks.</em>
          </div>
          <div className={styles.sleeveBottom}>
            <span>{copy.brand}</span>
            <span>Sound / Space / Feeling</span>
          </div>
        </div>
      </div>
      <section
        className={styles.listeningRoom}
        id="listening-room"
        aria-labelledby="listening-title"
      >
        <div>
          <p className={styles.kicker}>Try your own sound</p>
          <h3 id="listening-title">The listening room</h3>
          <p>
            Choose a track from your device. It stays in this browser tab and is never uploaded.
          </p>
        </div>
        <div className={styles.player}>
          <label className={styles.fileLabel} htmlFor="audio-file">
            Choose an audio file <Plus size={16} aria-hidden="true" />
          </label>
          <input
            ref={input}
            id="audio-file"
            type="file"
            accept="audio/*"
            aria-describedby="audio-help audio-error"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              if (
                !file.type.startsWith("audio/") ||
                file.size > 25 * 1024 * 1024 ||
                file.size === 0
              ) {
                setError(
                  "Choose a non-empty audio file under 25 MB. The previous selection, if any, is unchanged.",
                )
                event.target.value = ""
                return
              }
              setError("")
              setTrack({ url: URL.createObjectURL(file), name: file.name })
            }}
          />
          <p id="audio-help" className={styles.small}>
            Audio only, up to 25 MB. Use a recording you have permission to play.
          </p>
          {track && (
            <div className={styles.loadedTrack}>
              <div>
                <span>{track.name}</span>
                <button
                  type="button"
                  aria-label="Remove audio file"
                  onClick={() => {
                    setTrack(null)
                    setError("")
                    if (input.current) input.current.value = ""
                  }}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <audio
                key={track.url}
                controls
                preload="metadata"
                src={localAudioSource(track.url, window.location.origin)}
                aria-label={`Listen to ${track.name}`}
                onError={() =>
                  setError(
                    "This browser could not play that file. Try a supported MP3 or WAV recording.",
                  )
                }
              />
            </div>
          )}
          <p id="audio-error" role="status" className={styles.small}>
            {error}
          </p>
        </div>
      </section>
    </>
  )
}

const researchNotes = [
  {
    name: "Evaluation that travels beyond a benchmark",
    category: "Methods",
    content:
      "Start with a specific task and a documented evaluation set. Record failure categories and reviewer disagreement alongside any summary score. This is an illustrative editorial note, not a published result.",
  },
  {
    name: "What happens when a model should abstain?",
    category: "Open question",
    content:
      "Ask which kinds of uncertainty should cause a system to stop, ask for context, or defer to a person. Publish the conditions and limitations before claiming a solution. No experimental evidence is asserted here.",
  },
  {
    name: "Make the limits part of the interface",
    category: "Practice",
    content:
      "Keep data provenance, method, intended use and known limits beside the result. A reader should not need to discover a separate disclaimer to understand what an example can support.",
  },
] as const

function LabPreview({ copy }: { copy: TemplateCopy }) {
  return (
    <>
      <PreviewNav brand={copy.brand}>Research / Methods / Open questions</PreviewNav>
      <div className={styles.labHero}>
        <div className={styles.marginNote}>
          An independent
          <br />
          research practice
          <span className={styles.researchMark} aria-hidden="true">
            ↳
          </span>
        </div>
        <Heading copy={copy} eyebrow="A question is a place to begin" />
      </div>
      <section className={styles.publications} aria-labelledby="research-title">
        <div className={styles.sectionLine}>
          <h3 id="research-title">From the research desk</h3>
          <span>Illustrative notes, not published findings</span>
        </div>
        {researchNotes.map((note, index) => (
          <details key={note.name} className={styles.researchRow}>
            <summary>
              <span className={styles.index}>0{index + 1}</span>
              <span>
                <span className={styles.kicker}>{note.category}</span>
                <strong>{note.name}</strong>
              </span>
              <Plus size={19} aria-hidden="true" />
            </summary>
            <p>{note.content}</p>
          </details>
        ))}
      </section>
    </>
  )
}

function ToolPreview({ copy }: { copy: TemplateCopy }) {
  const [idea, setIdea] = useState("")
  const [result, setResult] = useState<string[]>([])
  return (
    <>
      <PreviewNav brand={copy.brand}>A practical starting point</PreviewNav>
      <div className={styles.toolHero}>
        <Heading copy={copy} eyebrow="From loose idea to next step" />
        <div className={styles.toolAside}>
          <span>Input → clarity</span>
          <p>
            Try the interaction.
            <br />
            Understand the product.
          </p>
          <span className={styles.toolArrow} aria-hidden="true">
            ↘
          </span>
        </div>
      </div>
      <section className={styles.toolPanel} aria-label="Interactive brief example" data-motion-item>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setResult(briefChecklist(idea))
          }}
        >
          <label htmlFor="brief-idea">01 / Your starting point</label>
          <textarea
            id="brief-idea"
            required
            maxLength={400}
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="A release page for my first ambient record…"
          />
          <button className={styles.previewButton} type="submit" disabled={!idea.trim()}>
            Make a checklist <ArrowRight size={16} aria-hidden="true" />
          </button>
          <p className={styles.small}>
            Local rules-based demo. No model call, upload or saved history.
          </p>
        </form>
        <div className={styles.toolResult} aria-live="polite">
          <p className={styles.kicker}>02 / A place to begin</p>
          {result.length ? (
            <ol>
              {result.map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.toolEmpty}>
              <span aria-hidden="true">↳</span>
              <h3>
                Your next step
                <br />
                starts here.
              </h3>
              <p>
                Write a small idea on the left. We’ll turn it into four useful prompts for your
                work.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function PortfolioPreview({ copy }: { copy: TemplateCopy }) {
  return (
    <>
      <PreviewNav brand={copy.brand}>Independent designer / Selected work</PreviewNav>
      <div className={styles.portfolioHero}>
        <p className={styles.portfolioIndex}>
          A considered practice
          <br />
          <span>Design / Systems / Stories</span>
        </p>
        <Heading copy={copy} eyebrow="A short introduction" />
      </div>
      <section className={styles.caseStudy} aria-labelledby="case-title">
        <div className={styles.casePoster} data-motion-item>
          <span>Selected study / 01</span>
          <p>
            Less,
            <br />
            <em>
              but with
              <br />
              intention.
            </em>
          </p>
          <span>An illustrative editorial system</span>
        </div>
        <div className={styles.caseCopy}>
          <p className={styles.kicker}>Case study / Editorial design</p>
          <h3 id="case-title">A publication that makes space for reading.</h3>
          <p>
            A sample case-study structure. Replace it with your own work, responsibilities and
            permission-cleared evidence.
          </p>
          <details>
            <summary>
              The context <Plus size={16} aria-hidden="true" />
            </summary>
            <p>
              The brief: help readers distinguish a short note from a deep essay without making the
              archive feel like a software dashboard.
            </p>
          </details>
          <details>
            <summary>
              The decision <Plus size={16} aria-hidden="true" />
            </summary>
            <p>
              Use one strong reading column, an index that shows the shape of the archive, and
              typography that separates navigation from the author’s voice.
            </p>
          </details>
          <details>
            <summary>
              The proof to bring <Plus size={16} aria-hidden="true" />
            </summary>
            <p>
              Add real before-and-after captures, your role and constraints, and permission to show
              the work. Claim an outcome only when it has evidence.
            </p>
          </details>
        </div>
      </section>
    </>
  )
}

function CreatorPreview({ copy }: { copy: TemplateCopy }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <PreviewNav brand={copy.brand}>Notes on a creative life</PreviewNav>
      <div className={styles.creatorHero}>
        <Heading copy={copy} eyebrow="A letter, a practice, a body of work" />
        <div className={styles.issueCover} data-motion-item>
          <span>The practice notes / No. 01</span>
          <p>
            The quiet
            <br />
            <em>
              part of
              <br />
              making.
            </em>
          </p>
          <span>Read slowly. Keep what helps.</span>
        </div>
      </div>
      <section className={styles.essay} aria-labelledby="essay-title">
        <div>
          <p className={styles.kicker}>A sample from the notebook</p>
          <h3 id="essay-title">Start with what you can return to.</h3>
          <p>
            A useful practice is not always the most ambitious one. Sometimes it is the one that
            still feels possible on an ordinary Tuesday.
          </p>
          <button
            type="button"
            className={styles.textButton}
            aria-expanded={open}
            aria-controls="sample-essay"
            onClick={() => setOpen(!open)}
          >
            {open ? "Close the note" : "Read the complete note"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.essayMargin}>
          Field notes
          <br />
          <span>On making room</span>
          <br />
          An original sample essay
        </div>
        <div id="sample-essay" hidden={!open} className={styles.essayBody}>
          <p>
            Choose a small place for the work to live: a notebook, a folder, a half-hour that does
            not require a perfect mood. Give it a name you would actually say out loud.
          </p>
          <p>
            Then make something modest and complete. A paragraph with an ending. A loop with a
            little silence around it. A page that helps one person find what they came for.
          </p>
          <p>
            Keep a record of what you tried. You are not collecting proof that you are productive.
            You are leaving a trail back to the work, so the next beginning costs a little less.
          </p>
        </div>
      </section>
    </>
  )
}

function ChallengePreview({ copy }: { copy: TemplateCopy }) {
  const [day, setDay] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])
  const active = challengeDays[day]
  return (
    <>
      <PreviewNav brand={copy.brand}>A seven-day creative practice</PreviewNav>
      <div className={styles.challengeHero}>
        <Heading copy={copy} eyebrow="Less planning. A little more doing." />
        <div className={styles.dayPoster} aria-hidden="true">
          <span>Your next small step</span>
          <strong>{String(day + 1).padStart(2, "0")}</strong>
          <span>of seven days</span>
        </div>
      </div>
      <section className={styles.challengePlan} aria-labelledby="day-title" data-motion-item>
        <div className={styles.days} role="group" aria-label="Choose a challenge day">
          {challengeDays.map((item, index) => (
            <button
              type="button"
              key={item.title}
              aria-pressed={day === index}
              aria-label={`Day ${index + 1}: ${item.title}${completed.includes(index) ? ", complete" : ""}`}
              onClick={() => setDay(index)}
            >
              <span>Day {index + 1}</span>
              {completed.includes(index) ? (
                <Check size={19} aria-hidden="true" />
              ) : (
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              )}
            </button>
          ))}
        </div>
        <div className={styles.dayTask}>
          <div>
            <p className={styles.kicker}>Your practice for day {day + 1}</p>
            <h3 id="day-title">{active.title}</h3>
            <p>{active.task}</p>
            <label className={styles.completeLabel}>
              <input
                type="checkbox"
                checked={completed.includes(day)}
                onChange={(event) =>
                  setCompleted(
                    event.target.checked
                      ? [...completed, day]
                      : completed.filter((value) => value !== day),
                  )
                }
              />
              I finished this step
            </label>
          </div>
          <div className={styles.progressNote}>
            <span aria-live="polite">{completed.length} / 7 steps complete</span>
            <progress max={7} value={completed.length} aria-label="Challenge progress" />
            <p>
              Progress lasts while this preview is open. No account, reminders or member data is
              connected.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

export function TemplatePreview({ template, copy }: PreviewProps) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          desktop: "(min-width: 800px)",
          mobile: "(max-width: 799px)",
        },
        (context) => {
          if (context.conditions?.reduce) return
          gsap.from("[data-motion-item]", {
            y: context.conditions?.desktop ? 12 : 6,
            opacity: 0,
            duration: 0.4,
            stagger: 0.06,
            ease: "power2.out",
            clearProps: "transform,opacity",
          })
        },
      )
      return () => media.revert()
    },
    { scope: root, dependencies: [template.id], revertOnUpdate: true },
  )

  return (
    <div
      ref={root}
      className={`${styles.specimen} ${styles[template.id]}`}
      data-template={template.id}
    >
      {template.id === "music" && <MusicPreview copy={copy} />}
      {template.id === "lab" && <LabPreview copy={copy} />}
      {template.id === "tool" && <ToolPreview copy={copy} />}
      {template.id === "portfolio" && <PortfolioPreview copy={copy} />}
      {template.id === "creator" && <CreatorPreview copy={copy} />}
      {template.id === "challenge" && <ChallengePreview copy={copy} />}
    </div>
  )
}
