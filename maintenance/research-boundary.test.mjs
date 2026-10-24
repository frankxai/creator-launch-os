// Repository-only policy: intentionally not part of the buyer package.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
test('internal research does not reintroduce unapproved price or revenue experiments', () => {
  assert.doesNotMatch(read('docs/TEMPLATE-PRODUCT-FAMILIES.md'), /€|Price experiment|10,102|€1 million/)
})
test('repository-only policy files and internal research are not buyer dependencies', () => {
  const files = JSON.parse(read('release/package-manifest.json')).files
  for (const path of ['maintenance/research-boundary.test.mjs', '.github/workflows/repository-policy.yml', 'docs/TEMPLATE-PRODUCT-FAMILIES.md']) assert.ok(!files.includes(path))
  assert.doesNotMatch(read('.github/workflows/ci.yml'), /maintenance\/research-boundary|repository-policy/)
})
