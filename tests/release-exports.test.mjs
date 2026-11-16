import {test} from 'node:test';
import assert from 'node:assert/strict';
import {listingPacket,verifyCapture} from '../scripts/export-marketplace.mjs';
import {projectTokens} from '../scripts/export-design-tokens.mjs';
const fixture=()=>({pkg:{name:'template',version:'1.0.0',license:'MIT'},template:{id:'template',name:'A Template',version:'1.0.0',license:'MIT',sourceRepository:'https://github.com/owner/template'},listing:'title: A Template\nstate: draft\n'});
test('channel packet binds the canonical listing and cannot advance publication or price',()=>{const a=listingPacket(fixture());assert.equal(a.state,'REVIEW_ONLY_NOT_SUBMITTED');assert.equal(a.pricing,'unchanged');assert.match(a.listingSha256,/^[a-f0-9]{64}$/);const f=fixture();f.listing+='description: revised\n';assert.notEqual(listingPacket(f).listingSha256,a.listingSha256);});
for(const field of ['name','version','license']) test('rejects '+field+' drift',()=>{const f=fixture();f.pkg[field]='different';assert.throws(()=>listingPacket(f),/drift/);});
test('tokens preserve authored CSS values and bind source bytes',()=>{const source=':root { --paper: #fff; --font: var(--source); --space: 1rem; }';const a=projectTokens([{path:'app.css',selector:':root'}],()=>source)[0];assert.deepEqual(a.tokens['--paper'],{$value:'#fff'});assert.deepEqual(a.tokens['--font'],{$value:'var(--source)'});assert.equal(Object.keys(a.tokens).length,3);assert.throws(()=>projectTokens([{path:'x',selector:'.missing'}],()=>source),/Missing/);});

test('commercial captures reject stale revisions, unsafe names and modified bytes', async()=>{
 const {createHash}=await import('node:crypto');const bytes=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(bytes);bytes.writeUInt32BE(1280,16);bytes.writeUInt32BE(720,20);
 const record={name:'cover',revision:'revision-a',viewport:{width:1280,height:720},bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 assert.equal(verifyCapture(record,bytes,'revision-a').filename,'cover.png');
 assert.throws(()=>verifyCapture(record,bytes,'revision-b'),/stale/);
 assert.throws(()=>verifyCapture({...record,name:'..\/private'},bytes,'revision-a'),/identity/);
 const modified=Buffer.from(bytes);modified[9]=1;assert.throws(()=>verifyCapture(record,modified,'revision-a'),/bytes differ/);
 assert.throws(()=>verifyCapture({...record,viewport:{width:600,height:600}},bytes,'revision-a'),/dimensions/);
});
