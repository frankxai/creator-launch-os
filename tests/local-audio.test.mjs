import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"

const source = readFileSync(new URL("../lib/local-audio.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { localAudioSource } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
)

test("local audio accepts only same-origin browser blob URLs", () => {
  for (const origin of ["https://example.com", "http://localhost:3000"]) {
    const url = `blob:${origin}/05f96e64-f014-4a31-9767-80e2a63aa313`
    assert.equal(localAudioSource(url, origin), url)
  }
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "https://example.com/track.mp3",
    "blob:https://foreign.example/123",
    "blob:null/123",
    "//foreign.example/track.mp3",
    "not a URL",
    "",
  ]) {
    assert.equal(localAudioSource(value, "https://example.com"), undefined, value)
  }
  assert.equal(localAudioSource("blob:null/123", "null"), undefined)
})
