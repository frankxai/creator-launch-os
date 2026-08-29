"use client"

import type { PropsWithChildren } from "react"
import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(useGSAP, ScrollTrigger)

type MotionConditions = {
  desktop?: boolean
  finePointer?: boolean
  reduceMotion?: boolean
}

export function HomeMotion({ children }: PropsWithChildren) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!scope.current) {
        return
      }

      const media = gsap.matchMedia()

      media.add(
        {
          desktop: "(min-width: 960px)",
          finePointer: "(pointer: fine)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const conditions = (context.conditions ?? {}) as MotionConditions
          const root = scope.current

          if (!root) {
            return
          }

          const heroLines = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-line]"))
          const heroFollow = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-follow]"))
          const heroStage = root.querySelector<HTMLElement>("[data-hero-stage]")
          const heroLenses = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"))
          let cleanupPointer: (() => void) | undefined

          if (conditions.reduceMotion) {
            gsap.set([...heroLines, ...heroFollow, ...heroLenses, ...(heroStage ? [heroStage] : [])], {
              clearProps: "transform,opacity,visibility",
            })
            return
          }

          const desktop = Boolean(conditions.desktop)
          const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } })

          heroTimeline
            .from(heroLines, {
              yPercent: 22,
              autoAlpha: 0,
              duration: desktop ? 0.82 : 0.55,
              stagger: desktop ? 0.08 : 0.045,
            })
            .from(
              heroFollow,
              {
                y: 18,
                autoAlpha: 0,
                duration: desktop ? 0.56 : 0.42,
                stagger: 0.07,
              },
              desktop ? "-=0.48" : "-=0.32",
            )

          if (heroStage) {
            heroTimeline.from(
              heroStage,
              {
                y: desktop ? 34 : 20,
                rotate: desktop ? 1.8 : 0,
                scale: desktop ? 0.965 : 0.985,
                autoAlpha: 0,
                duration: desktop ? 0.9 : 0.62,
              },
              desktop ? "-=0.72" : "-=0.46",
            )
          }

          heroTimeline.from(
            heroLenses,
            {
              y: 14,
              scale: 0.92,
              autoAlpha: 0,
              duration: 0.5,
              stagger: 0.06,
            },
            "-=0.48",
          )

          if (heroStage && conditions.finePointer) {
            let bounds = heroStage.getBoundingClientRect()
            const movers = heroLenses.map((lens) => {
              const depth = Number.parseFloat(lens.dataset.depth ?? "8")

              return {
                depth,
                x: gsap.quickTo(lens, "x", { duration: 0.42, ease: "power3.out" }),
                y: gsap.quickTo(lens, "y", { duration: 0.42, ease: "power3.out" }),
              }
            })

            const updateBounds = () => {
              bounds = heroStage.getBoundingClientRect()
            }

            const handlePointerMove = (event: PointerEvent) => {
              const normalizedX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
              const normalizedY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2

              movers.forEach((mover) => {
                mover.x(normalizedX * mover.depth)
                mover.y(normalizedY * mover.depth)
              })
            }

            const resetLenses = () => {
              movers.forEach((mover) => {
                mover.x(0)
                mover.y(0)
              })
            }

            heroStage.addEventListener("pointerenter", updateBounds)
            heroStage.addEventListener("pointermove", handlePointerMove)
            heroStage.addEventListener("pointerleave", resetLenses)
            window.addEventListener("resize", updateBounds, { passive: true })

            cleanupPointer = () => {
              heroStage.removeEventListener("pointerenter", updateBounds)
              heroStage.removeEventListener("pointermove", handlePointerMove)
              heroStage.removeEventListener("pointerleave", resetLenses)
              window.removeEventListener("resize", updateBounds)
            }
          }

          if (conditions.desktop) {
            const story = root.querySelector<HTMLElement>("[data-release-story]")
            const storyPanels = Array.from(root.querySelectorAll<HTMLElement>("[data-story-panel]"))
            const storySteps = Array.from(root.querySelectorAll<HTMLElement>("[data-story-step]"))
            const storyProgress = root.querySelector<HTMLElement>("[data-story-progress]")

            if (story && storyPanels.length === 3 && storySteps.length === 3 && storyProgress) {
              gsap.set(storyPanels.slice(1), { autoAlpha: 0, y: 24 })
              gsap.set(storySteps.slice(1), { opacity: 0.42 })
              gsap.set(storyProgress, { scaleY: 0.08, transformOrigin: "top" })

              gsap
                .timeline({
                  defaults: { ease: "none" },
                  scrollTrigger: {
                    trigger: story,
                    start: "top top+=96",
                    end: "bottom bottom-=96",
                    scrub: 0.65,
                    invalidateOnRefresh: true,
                  },
                })
                .to(storyProgress, { scaleY: 0.5, duration: 1 }, 0)
                .to(storySteps[0], { opacity: 0.42, duration: 0.22 }, 0.5)
                .to(storyPanels[0], { autoAlpha: 0, y: -20, duration: 0.22 }, 0.5)
                .to(storySteps[1], { opacity: 1, duration: 0.22 }, 0.56)
                .to(storyPanels[1], { autoAlpha: 1, y: 0, duration: 0.24 }, 0.56)
                .to(storyProgress, { scaleY: 1, duration: 1 }, 1)
                .to(storySteps[1], { opacity: 0.42, duration: 0.22 }, 1.5)
                .to(storyPanels[1], { autoAlpha: 0, y: -20, duration: 0.22 }, 1.5)
                .to(storySteps[2], { opacity: 1, duration: 0.22 }, 1.56)
                .to(storyPanels[2], { autoAlpha: 1, y: 0, duration: 0.24 }, 1.56)
            }
          }

          return cleanupPointer
        },
      )

      return () => media.revert()
    },
    { scope },
  )

  return <div ref={scope}>{children}</div>
}
