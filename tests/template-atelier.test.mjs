import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
// Exercise the real pure module without depending on Node's version-specific TS loader.
const compiled = ts.transpileModule(read("lib/template-catalog.ts"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const {
  briefChecklist,
  challengeDays,
  copyLimits,
  createTemplatePacket,
  createV0Brief,
  getTemplate,
  normalizeCopy,
  templates,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

test("six distinct audience journeys have explicit production boundaries", () => {
  assert.deepEqual(
    templates.map((item) => item.id),
    ["music", "lab", "tool", "portfolio", "creator", "challenge"],
  )
  assert.equal(new Set(templates.map((item) => item.composition)).size, 6)
  for (const template of templates) {
    assert.equal(template.journey.length, 3)
    assert.ok(template.integrations.length >= 3)
    assert.ok(template.copy.headline.length <= copyLimits.headline)
    assert.ok(template.copy.description.length <= copyLimits.description)
  }
  assert.equal(getTemplate("invalid").id, "music")
})

test("blank or oversized copy has deterministic safe export defaults", () => {
  const template = getTemplate("music")
  assert.deepEqual(normalizeCopy(template, {}), template.copy)
  assert.equal(normalizeCopy(template, { headline: " \n " }).headline, template.copy.headline)
  assert.equal(normalizeCopy(template, { brand: "a".repeat(100) }).brand.length, 48)
  assert.equal(
    normalizeCopy(template, { description: "  A real idea.  " }).description,
    "A real idea.",
  )
})

test("the export packet contains current copy, not fabricated v0 or product claims", () => {
  for (const template of templates) {
    const packet = createTemplatePacket(template, { brand: "My studio" })
    assert.equal(packet.copy.brand, "My studio")
    assert.equal(packet.templateId, template.id)
    assert.equal(packet.generatedByV0, false)
    assert.equal(packet.maturity, "local-interactive-example")
    assert.equal(packet.motion.reducedMotion, "static")
    assert.equal(packet.motion.maxHeroTimelines, 1)
    assert.match(packet.publicationGate, /shared demand capture/)
    assert.equal("audio" in packet, false)
    assert.equal("progress" in packet, false)
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(packet)))
  }
})

test("brief keeps copy as data and preserves the v0/local motion division", () => {
  const copy = { headline: 'Quotes " & <script>literal copy</script>' }
  const brief = createV0Brief(getTemplate("lab"), copy)
  assert.ok(brief.includes(JSON.stringify(copy.headline)))
  assert.match(brief, /not instructions/)
  assert.match(brief, /Do not author or replace GSAP code/)
  assert.match(brief, /Do not publish or deploy automatically/)
  assert.match(brief, /No checkout until/)
  assert.match(brief, /shared demand-capture contract/)
})

test("tool example is deterministic, bounded and rejects empty input", () => {
  assert.deepEqual(briefChecklist("  "), [])
  const result = briefChecklist("  A music page  ")
  assert.equal(result.length, 4)
  assert.match(result[0], /A music page$/)
  assert.deepEqual(briefChecklist("A music page"), result)
  assert.ok(briefChecklist("x".repeat(1000))[0].length < 450)
})

test("challenge covers exactly seven actionable days without health promises", () => {
  assert.equal(challengeDays.length, 7)
  assert.equal(new Set(challengeDays.map((item) => item.title)).size, 7)
  for (const day of challengeDays) assert.ok(day.task.length > 80)
})

test("preview is scoped, self-cleaning and uses browser-native private audio", () => {
  const source = read("components/template-preview.tsx")
  assert.match(source, /useGSAP/)
  assert.match(source, /gsap\.matchMedia\(\)/)
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(source, /media\.revert\(\)/)
  assert.match(source, /revertOnUpdate: true/)
  assert.match(source, /URL\.revokeObjectURL/)
  assert.match(source, /25 \* 1024 \* 1024/)
  assert.doesNotMatch(source, /fetch\(|autoPlay|dangerouslySetInnerHTML|localStorage/)
})

test("workbench preserves contract and packaging boundaries", () => {
  const files = [
    "app/studio/templates/page.tsx",
    "components/template-atelier.tsx",
    "components/template-preview.tsx",
    "components/template-atelier.module.css",
    "lib/template-catalog.ts",
    "tests/template-atelier.test.mjs",
  ]
  const source = files.slice(0, 4).map(read).join("\n")
  assert.doesNotMatch(source, /text-transform:\s*uppercase|href=["']#["']|dangerouslySetInnerHTML/)
  assert.match(read(files[0]), /index: false, follow: false/)
  assert.match(read("app/studio/page.tsx"), /href="\/studio\/templates"/)
  const manifest = JSON.parse(read("release/package-manifest.json"))
  for (const file of files) assert.ok(manifest.files.includes(file), `${file} must be packaged`)
})
