import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const kit = JSON.parse(read("commercial/kit/kit.manifest.json"))
const core = JSON.parse(read("release/package-manifest.json"))
const facts = JSON.parse(read("offer.facts.json"))

test("the Commercial Kit and the free MIT package never overlap", () => {
  assert.equal(kit.sku_id, facts.sku_id)
  assert.equal(kit.license, facts.kit.license)
  assert.deepEqual(core.files.filter((path) => path.startsWith("commercial/")), [])
  for (const path of kit.files) {
    assert.ok(path.startsWith("commercial/"), path)
    assert.ok(read(path).length > 0, path)
  }
})

test("the free core never imports commercial files", () => {
  for (const path of core.files.filter((file) => /\.(tsx?|mjs)$/.test(file))) {
    assert.doesNotMatch(read(path), /from ["'][^"']*commercial\//, path)
  }
})

test("public policy text agrees with the facts it restates", () => {
  assert.match(read(facts.refund.policy), new RegExp(`within ${facts.refund.window_days} days`))
  assert.match(read("app/kit/page.tsx"), /offer\.refund\.window_days/)
  assert.ok(read(facts.support.policy).includes("Commercial Kit buyers"))
})
