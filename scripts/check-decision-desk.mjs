import { readFileSync, lstatSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root=new URL('../',import.meta.url)
const hash=p=>{const file=fileURLToPath(new URL(p,root));if(!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink())throw Error('Invalid source file');return createHash('sha256').update(readFileSync(file)).digest('hex')}
const manifest=JSON.parse(readFileSync(new URL('public/architecture-decision-desk/projection.json',root),'utf8'))
const expected=['index.html','style.css','app.js','review-core.js','LICENSE']
if(JSON.stringify(manifest.files.map(f=>f.path))!==JSON.stringify(expected))throw Error('Projection allowlist changed')
for(const f of manifest.files)if(hash('public/architecture-decision-desk/'+f.path)!==f.sha256)throw Error('Projection drift: '+f.path)
if(manifest.candidatePatch.path!=='vendor/architecture-decision-desk/guide-candidate.patch'||hash(manifest.candidatePatch.path)!==manifest.candidatePatch.sha256)throw Error('Candidate source patch drift')
console.log('Decision Desk delivery bytes and reconstructable upstream patch verified. Upstream integration remains pending.')
