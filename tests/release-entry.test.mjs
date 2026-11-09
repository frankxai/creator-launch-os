import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFileSync(join(root, path), 'utf8')

test('Decision Desk setup link names an actual public file, not an unserved directory', () => {
  const href = read('app/start/page.tsx').match(/href="([^"]+)"[^>]*>Open the free Architecture Decision Desk/)[1]
  assert.equal(href, '/architecture-decision-desk/index.html')
  assert.match(read('public' + href), /<h1/)
})

test('CI verifies projection integrity before dependencies and packaging without a draft skip', () => {
  const ci = read('.github/workflows/ci.yml')
  const step = '      - name: Verify Decision Desk source and delivery integrity\n        run: node scripts/check-decision-desk.mjs'
  assert.ok(ci.includes(step))
  assert.ok(ci.indexOf(step) < ci.indexOf('      - name: Install dependencies'))
  assert.ok(ci.indexOf(step) < ci.indexOf('      - name: Package immutable delivery candidate'))
})

test('the actual checker rejects tampered delivery and candidate patch bytes', t => {
  const scratch = mkdtempSync(join(tmpdir(), 'decision-integrity-'))
  t.after(() => rmSync(scratch, { recursive: true, force: true }))
  for (const dir of ['scripts', 'public', 'vendor']) mkdirSync(join(scratch, dir), { recursive: true })
  cpSync(join(root, 'scripts/check-decision-desk.mjs'), join(scratch, 'scripts/check-decision-desk.mjs'))
  cpSync(join(root, 'public/architecture-decision-desk'), join(scratch, 'public/architecture-decision-desk'), { recursive: true })
  cpSync(join(root, 'vendor/architecture-decision-desk'), join(scratch, 'vendor/architecture-decision-desk'), { recursive: true })
  const check = () => execFileSync(process.execPath, ['scripts/check-decision-desk.mjs'], { cwd: scratch, stdio: 'pipe' })
  assert.match(check().toString(), /verified/)
  appendFileSync(join(scratch, 'public/architecture-decision-desk/app.js'), '\n// drift fixture\n')
  assert.throws(check, e => e.status === 1 && e.stderr.toString().includes('Projection drift: app.js'))
  cpSync(join(root, 'public/architecture-decision-desk/app.js'), join(scratch, 'public/architecture-decision-desk/app.js'))
  appendFileSync(join(scratch, 'vendor/architecture-decision-desk/guide-candidate.patch'), '\nfixture\n')
  assert.throws(check, e => e.status === 1 && e.stderr.toString().includes('Candidate source patch drift'))
})

test('buyer package excludes internal research and historical execution receipts', () => {
  const files = JSON.parse(read('release/package-manifest.json')).files
  for (const path of ['docs/TEMPLATE-PRODUCT-FAMILIES.md', 'docs/RELEASE-INTEGRATION-20261021.md', 'docs/HISTORICAL-VERIFICATION-20261021.md']) assert.ok(!files.includes(path), path)
  assert.doesNotMatch(read('README.md'), /TEMPLATE-PRODUCT-FAMILIES/)
  assert.match(read('README.md'), /Node\.js 24/)
  assert.match(read('docs/TEMPLATE-PROJECT-EXPORT.md'), /Monograph \(portfolio\) exports include.*`\/edit`/)
})


test('buyer verification metadata has no references to excluded repository receipts', () => {
  const manifest = JSON.parse(read('template.manifest.json'))
  const files = new Set(JSON.parse(read('release/package-manifest.json')).files)
  for (const status of Object.values(manifest.verification)) {
    for (const path of status.match(/docs\/[A-Za-z0-9_./-]+\.md/g) ?? []) {
      assert.ok(files.has(path), `verification reference must be delivered: ${path}`)
    }
  }
  assert.match(manifest.verification.typeCheck, /NOT_VERIFIED_FOR_THIS_PACKAGE/)
})
