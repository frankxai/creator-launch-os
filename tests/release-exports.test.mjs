import {test} from 'node:test';
import assert from 'node:assert/strict';
import {listingPacket} from '../scripts/export-marketplace.mjs';
import {projectTokens} from '../scripts/export-design-tokens.mjs';
const fixture=()=>({pkg:{name:'template',version:'1.0.0',license:'MIT'},template:{id:'template',name:'A Template',version:'1.0.0',license:'MIT',sourceRepository:'https://github.com/owner/template'},listing:'title: A Template\nstate: draft\n'});
test('channel packet binds the canonical listing and cannot advance publication or price',()=>{const a=listingPacket(fixture());assert.equal(a.state,'REVIEW_ONLY_NOT_SUBMITTED');assert.equal(a.pricing,'unchanged');assert.match(a.listingSha256,/^[a-f0-9]{64}$/);const f=fixture();f.listing+='description: revised\n';assert.notEqual(listingPacket(f).listingSha256,a.listingSha256);});
for(const field of ['name','version','license']) test('rejects '+field+' drift',()=>{const f=fixture();f.pkg[field]='different';assert.throws(()=>listingPacket(f),/drift/);});
test('tokens preserve authored CSS values and bind source bytes',()=>{const source=':root { --paper: #fff; --font: var(--source); --space: 1rem; }';const a=projectTokens([{path:'app.css',selector:':root'}],()=>source)[0];assert.deepEqual(a.tokens['--paper'],{$value:'#fff'});assert.deepEqual(a.tokens['--font'],{$value:'var(--source)'});assert.equal(Object.keys(a.tokens).length,3);assert.throws(()=>projectTokens([{path:'x',selector:'.missing'}],()=>source),/Missing/);});
