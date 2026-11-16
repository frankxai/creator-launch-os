import { readFileSync, mkdirSync, writeFileSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import {execFileSync} from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function listingPacket({pkg,template,listing}) {
 const title=listing.match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^"(.*)"$/,'$1');
 if(title!==template.name || pkg.name!==template.id || pkg.version!==template.version || pkg.license!=='MIT' || template.license!=='MIT') throw Error('Canonical identity/version/license drift');
 return {schemaVersion:'1.0.0',title,version:pkg.version,license:pkg.license,repository:template.sourceRepository,listingSha256:createHash('sha256').update(listing).digest('hex'),state:'REVIEW_ONLY_NOT_SUBMITTED',pricing:'unchanged',submission:'approval_required'};
}
export function verifyCapture(record,bytes,revision) {
 if(!['cover','thumbnail','mobile'].includes(record.name) || record.revision!==revision) throw Error('Untrusted capture identity or stale source revision');
 if(bytes.length<24 || bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a' || bytes.readUInt32BE(16)!==record.viewport.width || bytes.readUInt32BE(20)!==record.viewport.height) throw Error('Capture PNG dimensions do not match its receipt');
 if(bytes.length!==record.bytes || createHash('sha256').update(bytes).digest('hex')!==record.sha256) throw Error('Capture bytes differ from source receipt');
 return {name:record.name,filename:record.name+'.png',revision,viewport:record.viewport,sha256:record.sha256,bytes:record.bytes,approval:'pending'};
}
function capturedAssets() {
 const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim();
 const directory=resolve(root,'test-results');if(!existsSync(directory))return [];
 const receipts=readdirSync(directory,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>resolve(directory,e.name,'commercial-receipt.json')).filter(existsSync);
 if(receipts.length!==1) throw Error('Exactly one commercial capture receipt is required');
 const records=JSON.parse(readFileSync(receipts[0],'utf8'));
 if(records.length!==3 || new Set(records.map(r=>r.name)).size!==3) throw Error('Three distinct commercial captures are required');
 return records.map(record=>{if(!['cover','thumbnail','mobile'].includes(record.name)) throw Error('Untrusted capture identity');const path=resolve(dirname(receipts[0]),record.name+'.png');const bytes=readFileSync(path);return {...verifyCapture(record,bytes,revision),sourcePath:path};});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const read=p=>readFileSync(resolve(root,p),'utf8');
 const packet=listingPacket({pkg:JSON.parse(read('package.json')),template:JSON.parse(read('template.manifest.json')),listing:read('marketplace.listing.yaml')});
 const config=JSON.parse(read('release/pipeline.json'));
 const assets=capturedAssets();
 for(const channel of ['github','vercel_templates','gumroad','envato']) {
  const dir=resolve(root,'dist/marketplace',channel);mkdirSync(dir,{recursive:true});
  const requirements={github:['source ZIP','SHA256SUMS','receipt.json','LICENSE','CHANGELOG.md'],vercel_templates:['Next.js App Router','README deploy button','working Vercel demo','reviewed screenshot'],gumroad:['source ZIP with notices','1280x720 cover','600x600 thumbnail','support scope','owner-approved listing and price'],envato:['category eligibility review','English HTML/PDF help','licensed distributable assets','preview ZIP','reviewed category-specific requirements']};
  writeFileSync(resolve(dir,'listing.json'),JSON.stringify({...packet,channel,demo:config.demo,required:requirements[channel],assets:assets.map(({sourcePath,...record})=>record),captureState:assets.length?'source_bound_review_candidates':'missing_browser_capture',blockers:config.blockers},null,2)+'\n');
  for(const asset of assets) copyFileSync(asset.sourcePath,resolve(dir,asset.filename));
  writeFileSync(resolve(dir,'description.txt'),`${packet.title}\nVersion ${packet.version}. ${config.promise}\nMIT source; retain the included copyright and permission notice.\n${config.boundary}\nReview candidate. No listing has been submitted.\n`);
  if(channel==='envato') writeFileSync(resolve(dir,'documentation.html'),read('docs/release/setup.html'));
 }
 console.log('Exported four channel review packets. No network or publishing action performed.');
}
