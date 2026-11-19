import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const core = JSON.parse(read("release/package-manifest.json"))
const facts = JSON.parse(read("offer.facts.json"))

// The free MIT delivery deliberately omits commercial/. In the repository the
// kit is present and every check below runs. In an extracted MIT package the
// boundary is proven by the kit's absence instead of by reading its files.
const kitPresent = existsSync(new URL("../commercial/kit/kit.manifest.json", import.meta.url))
const repositoryOnly = kitPresent ? {} : { skip: "MIT package: commercial/ is intentionally absent" }

test("the free MIT package lists no commercial files", () => {
  assert.deepEqual(core.files.filter((path) => path.startsWith("commercial/")), [])
})

test("an extracted MIT package carries no part of the Commercial Kit", () => {
  if (kitPresent) {
    // Repository checkout: the allowlist above is what excludes it.
    assert.ok(core.files.includes("release/package-manifest.json"))
    return
  }
  assert.equal(existsSync(new URL("../commercial", import.meta.url)), false)
})

test("the Commercial Kit and the free MIT package never overlap", repositoryOnly, () => {
  const kit = JSON.parse(read("commercial/kit/kit.manifest.json"))
  assert.equal(kit.sku_id, facts.sku_id)
  assert.equal(kit.license, facts.kit.license)
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

test("public policy text agrees with the facts it restates", repositoryOnly, () => {
  assert.match(read(facts.refund.policy), new RegExp(`within ${facts.refund.window_days} days`))
  assert.match(read("app/kit/page.tsx"), /offer\.refund\.window_days/)
  assert.ok(read(facts.support.policy).includes("Commercial Kit buyers"))
})

test("the offer page still restates the refund window in the MIT package", () => {
  assert.match(read("app/kit/page.tsx"), /offer\.refund\.window_days/)
})
