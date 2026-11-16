import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const config=JSON.parse(await readFile('release/pipeline.json','utf8'));
const revision=execFileSync('git',['rev-parse','HEAD']).toString().trim();
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function settle(page) {
 await page.evaluate(async()=>{await document.fonts.ready;});
 await expect(page.locator('h1')).toHaveCount(1);
 await expect(page.locator('main')).toHaveCount(1);
}
for(const width of [1280,390,320]) test(`release routes reflow and expose accessible content at ${width}px`,async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width,height:width===1280?720:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const receipt=[];
 for(const route of config.captureRoutes){
  const response=await page.goto(route,{waitUntil:'networkidle'});expect(response.status()).toBe(200);await settle(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);
  const a11y=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  await info.attach('a11y-'+route,{body:JSON.stringify(a11y,null,2),contentType:'application/json'});
  expect(a11y.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  const basename=route==='/'?'home':route.replace(/\//g,'-').replace(/^-/, '');
  const bytes=await page.screenshot({path:info.outputPath(`${basename}-${width}.png`),fullPage:true,animations:'disabled',caret:'hide'});
  if(process.env.VISUAL_REGRESSION==='1') await expect(page).toHaveScreenshot(`${basename}-${width}.png`,{fullPage:true,animations:'disabled',maxDiffPixelRatio:.001});
  const fonts=await page.locator('body,h1').evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,fontFamily:getComputedStyle(n).fontFamily,fontSize:getComputedStyle(n).fontSize,fontWeight:getComputedStyle(n).fontWeight})));
  receipt.push({route,revision,viewport:{width,height:width===1280?720:844},dpr:1,sha256:digest(bytes),bytes:bytes.length,mime:'image/png',fonts,a11y:'passed',visualRegression:process.env.VISUAL_REGRESSION==='1'?'approved-baseline-compared':'capture-only-no-approved-baseline'});
 }
 expect(errors).toEqual([]);await writeFile(info.outputPath('receipt.json'),JSON.stringify(receipt,null,2));
});
test('commercial cover and thumbnail candidates retain actual sample UI',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});const receipts=[];
 for(const [name,width,height] of [['cover',1280,720],['thumbnail',600,600],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.goto('/',{waitUntil:'networkidle'});await settle(page);
  const bytes=await page.screenshot({path:info.outputPath(`${name}.png`),animations:'disabled',caret:'hide'});
  receipts.push({name,revision,route:'/',viewport:{width,height},dpr:1,sha256:digest(bytes),bytes:bytes.length,mime:'image/png',approval:'pending',rights:'release/rights.json'});
 }
 await writeFile(info.outputPath('commercial-receipt.json'),JSON.stringify(receipts,null,2));
});
test('reduced-motion rendering is stable and the primary keyboard target is visible',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/',{waitUntil:'networkidle'});await settle(page);
 await page.keyboard.press('Tab');const focus=page.locator(':focus');await expect(focus).toBeVisible();
 const initial=await page.screenshot({animations:'disabled',caret:'hide'});await page.waitForTimeout(250);const resting=await page.screenshot({animations:'disabled',caret:'hide'});
 await info.attach('reduced-initial',{body:initial,contentType:'image/png'});await info.attach('reduced-resting',{body:resting,contentType:'image/png'});
 expect(digest(initial)).toBe(digest(resting));
});
