import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function listingPacket({pkg,template,listing}) {
 const title=listing.match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^"(.*)"$/,'$1');
 if(title!==template.name || pkg.name!==template.id || pkg.version!==template.version || pkg.license!=='MIT' || template.license!=='MIT') throw Error('Canonical identity/version/license drift');
 return {schemaVersion:'1.0.0',title,version:pkg.version,license:pkg.license,repository:template.sourceRepository,listingSha256:createHash('sha256').update(listing).digest('hex'),state:'REVIEW_ONLY_NOT_SUBMITTED',pricing:'unchanged',submission:'approval_required'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const read=p=>readFileSync(resolve(root,p),'utf8');
 const packet=listingPacket({pkg:JSON.parse(read('package.json')),template:JSON.parse(read('template.manifest.json')),listing:read('marketplace.listing.yaml')});
 const config=JSON.parse(read('release/pipeline.json'));
 for(const channel of ['github','vercel_templates','gumroad','envato']) {
  const dir=resolve(root,'dist/marketplace',channel);mkdirSync(dir,{recursive:true});
  const requirements={github:['source ZIP','SHA256SUMS','receipt.json','LICENSE','CHANGELOG.md'],vercel_templates:['Next.js App Router','README deploy button','working Vercel demo','reviewed screenshot'],gumroad:['source ZIP with notices','1280x720 cover','600x600 thumbnail','support scope','owner-approved listing and price'],envato:['category eligibility review','English HTML/PDF help','licensed distributable assets','preview ZIP','reviewed category-specific requirements']};
  writeFileSync(resolve(dir,'listing.json'),JSON.stringify({...packet,channel,demo:config.demo,required:requirements[channel],blockers:config.blockers},null,2)+'\n');
  writeFileSync(resolve(dir,'description.txt'),`${packet.title}\nVersion ${packet.version}. ${config.promise}\nMIT source; retain the included copyright and permission notice.\n${config.boundary}\nReview candidate. No listing has been submitted.\n`);
  if(channel==='envato') writeFileSync(resolve(dir,'documentation.html'),read('docs/release/setup.html'));
 }
 console.log('Exported four channel review packets. No network or publishing action performed.');
}
