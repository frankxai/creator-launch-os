import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function projectTokens(sources, read = path => readFileSync(resolve(root,path),'utf8')) {
 return sources.map(({path,selector}) => {
  const css=read(path); const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const match=css.match(new RegExp(escaped+'\\s*\\{([^}]+)\\}'));
  if(!match) throw Error('Missing token scope '+selector+' in '+path);
  const tokens=Object.fromEntries([...match[1].matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)(?:;|$)/g)].map(m=>[m[1],{$value:m[2].trim()}]));
  if(!Object.keys(tokens).length) throw Error('Empty token projection: '+path);
  return {source:path,selector,sha256:createHash('sha256').update(css).digest('hex'),tokens};
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const config=JSON.parse(readFileSync(resolve(root,'release/pipeline.json'),'utf8'));
 const output={schemaVersion:'1.0.0',status:'code-authority-projection-not-a-new-brand-master',projections:projectTokens(config.tokenSources)};
 mkdirSync(resolve(root,'dist/design'),{recursive:true});writeFileSync(resolve(root,'dist/design/tokens.json'),JSON.stringify(output,null,2)+'\n');
 console.log('Projected '+output.projections.length+' existing CSS token scopes; Figma parity remains separately reviewed');
}
