"use strict"
const form = document.querySelector("#form")
const result = document.querySelector("#result")
const save = document.querySelector("#save")
let generation = 0
let report

function reset() {
  generation++
  report = undefined
  save.hidden = true
  result.textContent = "Waiting for comparison."
}
form.addEventListener("input", reset)
form.addEventListener("submit", async (event) => {
  event.preventDefault()
  reset()
  const attempt = generation
  const receipt = document.querySelector("#receipt").files[0]
  const file = document.querySelector("#file").files[0]
  const member = document.querySelector("#path").value.trim()
  try {
    if (receipt.size > 2 * 1024 ** 2 || file.size > 32 * 1024 ** 2) throw Error("File exceeds the workbench size limit.")
    const record = JSON.parse(await receipt.text())
    if (record.schema_version !== "1.0.0" || record.name !== "creator-launch-os" ||
        record.source?.repository !== "https://github.com/frankxai/creator-launch-os" ||
        typeof record.source?.revision !== "string" || !/^[0-9a-f]{40}$/.test(record.source.revision) || !Array.isArray(record.files)) {
      throw Error("Choose a Creator Launch OS package receipt.")
    }
    const entries = member ? record.files.filter(entry => entry?.path === member) : [record.artifact]
    if (entries.length !== 1) throw Error("Member path must match exactly one receipt entry.")
    const expected = entries[0]
    if (!Number.isSafeInteger(expected?.bytes) || expected.bytes < 0 || typeof expected.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(expected.sha256)) {
      throw Error("The selected receipt entry has an invalid size or fingerprint.")
    }
    const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
    if (generation !== attempt) return
    const actual = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("")
    const matches = actual === expected.sha256 && file.size === expected.bytes
    report = {kind:"local_file_comparison", revision:record.source.revision, member:member || null,
      expected_sha256:expected.sha256, actual_sha256:actual, expected_bytes:expected.bytes,
      actual_bytes:file.size, matches}
    result.textContent = (matches ? "Match. " : "Mismatch. ") + file.size + " bytes checked against " + record.source.revision.slice(0, 12) + "."
    save.hidden = false
  } catch (error) {
    if (generation === attempt) result.textContent = "Unable to compare. " + error.message
  }
})
save.addEventListener("click", () => {
  if (!report) return
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + "\n"], { type:"application/json" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "delivery-comparison.json"
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})
