/* Isolated stage-chart QA; uses an existing Playwright/Chrome, never public screenshots. */
const {chromium}=require(process.env.CX_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const dir=fs.mkdtempSync(path.join(process.env.CX_FUNNEL_COLUMNS_QA_DIR||os.tmpdir(),'cx-funnel-columns-'));
const report={cases:[],limitations:['Chrome only; semantic acceptance and assistive technology testing remain human checks.']};
const variants=['original','tiny','unknown','empty','long','large'];
for(const locale of ['ru','en']){
 const original=JSON.parse(fs.readFileSync(path.join(root,`skills/cx-impact/examples/funnels/online-sales.${locale}.json`)));
 for(const variant of variants){
  const data=structuredClone(original);
  if(variant!=='original'){delete data.transitions;delete data.repeat;}
  if(variant==='tiny')data.stages.forEach((s,i)=>s.count=[12000,160,20,1,0][i]);
  if(variant==='unknown'){data.stages[0].count=null;data.stages[2].count=null;}
  if(variant==='empty')data.stages.forEach(s=>s.count=0);
  if(variant==='long')data.stages=Array.from({length:12},(_,i)=>({...data.stages[0],id:`step-${i}`,count:12000-i*1000,title:(locale==='ru'?'Подтверждение заказа после проверки всех данных и выбора способа получения покупки':'Confirm the order after checking all details and choosing how to receive the purchase')}));
  if(variant==='large')data.stages=data.stages.slice(0,2).map((s,i)=>({...s,count:i?1:Number.MAX_SAFE_INTEGER}));
  const source=path.join(dir,`${locale}-${variant}.json`),output=source.replace(/json$/,'html');
  fs.writeFileSync(source,JSON.stringify(data));
  execFileSync(process.execPath,[path.join(root,'skills/cx-impact/scripts/render-map.mjs'),source,output],{stdio:'pipe'});
 }
}
async function chartMeasurements(page){
 return page.locator('[data-funnel-body]').evaluate(g=>{
  const box=n=>{const b=n.getBBox();return {x:b.x,y:b.y,w:b.width,h:b.height};};
  const overlaps=[];
  const stages=[...g.querySelectorAll('[data-funnel-stage]')].map(n=>{
   const texts=[...n.querySelectorAll('text')].map(t=>({text:[...t.querySelectorAll('tspan')].map(s=>s.textContent).join(' '),...box(t)}));
   for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    const a=texts[i],b=texts[j];
    if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.5&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.5)overlaps.push([n.dataset.funnelStage,a.text,b.text]);
   }
   const bar=n.querySelector('[data-stage-bar]');
   return {id:n.dataset.funnelStage,count:n.dataset.count,bar:bar?box(bar):null,share:n.querySelector('[data-stage-share]').textContent,texts,hit:box(n.querySelector('[data-stage-hit]'))};
  });
  const metrics=[...g.querySelectorAll('[data-funnel-metric]')].map(n=>n.querySelectorAll('text')[1].textContent);
  return {stages,overlaps,metrics,baseline:+g.querySelector('[data-funnel-baseline]').dataset.funnelBaseline,width:g.ownerSVGElement.viewBox.baseVal.width};
 });
}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});report.chrome=browser.version();
  for(const locale of ['ru','en'])for(const [width,height] of [[1366,900],[1920,1080]]){
   const page=await browser.newPage({viewport:{width,height},acceptDownloads:true}),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(file|data|blob):/.test(r.url()))requests.push(r.url());});
   for(const variant of variants){
    const source=path.join(dir,`${locale}-${variant}.json`),data=JSON.parse(fs.readFileSync(source));
    await page.goto(pathToFileURL(source.replace(/json$/,'html')).href);
    for(const design of ['classic','graphite','workshop','signal'])for(const theme of ['light','dark']){
     await page.locator(`[data-design-choice="${design}"]`).click();await page.locator(`[data-theme-choice="${theme}"]`).click();
     await page.locator('#natural').click();
     const result=await chartMeasurements(page),label=`${locale}/${width}/${variant}/${design}/${theme}`;
     assert.deepEqual(result.overlaps,[],label+' text collisions');
     for(const [i,s] of result.stages.entries()){
      const input=data.stages[i],entry=data.stages[0].count;
      assert.equal(s.count,input.count===null?'unknown':String(input.count));
      assert.equal(s.texts.find(t=>t.text===input.title)?.text,input.title,label+' full title');
      for(const t of s.texts){assert.ok(t.x>=s.hit.x-.5&&t.x+t.w<=s.hit.x+s.hit.w+.5,label+' text stays within stage: '+t.text);}
      if(input.count===null||input.count===0||entry===null||entry===0)assert.equal(s.bar,null,label+' empty/unknown has no bar');
      else {assert.ok(Math.abs(s.bar.h-input.count*180/entry)<.0001,label+' proportional height');assert.ok(Math.abs(s.bar.y+s.bar.h-result.baseline)<.0001,label+' common zero');}
      if(i)assert.ok(result.stages[i-1].hit.x+result.stages[i-1].hit.w<s.hit.x,label+' stage order');
     }
     if(variant==='tiny')assert.ok(result.stages[3].share.startsWith('<'),label+' tiny positive rate is not rounded to zero');
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,label+' page overflow');
     await page.locator('#fit').click();
     assert.equal(await page.locator('#viewport').evaluate(n=>n.querySelector('svg').getBoundingClientRect().width<=n.clientWidth-32+1),true,label+' fit');
     const stage=page.locator('[data-funnel-stage]').last();await stage.focus();await page.keyboard.press('Enter');
     assert.equal(await page.locator('#detail-title').textContent(),data.stages.at(-1).title);
     assert.ok((await page.locator('#detail-sources').textContent()).includes(data.sources[0].label));
     await page.keyboard.press('Escape');assert.equal(await stage.evaluate(n=>document.activeElement===n),true,label+' focus return');
     await page.locator('#natural').click();await page.locator('#viewport').evaluate(n=>{n.scrollTop=0;n.scrollLeft=0});await page.evaluate(()=>scrollTo(0,0));
     if(variant==='original'){
      const stem=`${locale}-${width}-${design}-${theme}`;
      await page.screenshot({path:path.join(dir,stem+'.png')});
      const download=page.waitForEvent('download');await page.locator('#export').click();const svg=path.join(dir,stem+'.svg');await(await download).saveAs(svg);
      const exported=await browser.newPage();await exported.goto(pathToFileURL(svg).href);
      assert.equal(await exported.locator('parsererror').count(),0,label+' SVG opens');
      assert.deepEqual(await chartMeasurements(exported),result,label+' SVG geometry and text remain exact');
      await exported.close();
     }
     if(['tiny','long','unknown','large'].includes(variant)&&design==='signal'&&theme==='light')await page.screenshot({path:path.join(dir,`${locale}-${width}-${variant}.png`)});
     report.cases.push({locale,width,height,variant,design,theme});
    }
   }
   assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);await page.close();
   console.log(`PASS ${locale} ${width}×${height}: six fixtures, four designs, two themes, labels, magnitudes, keyboard, SVG`);
  }
  for(const name of ['funnel-core.js','funnel-viewer.js'])report[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'skills/cx-impact/assets',name))).digest('hex');
  report.status='passed';fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Artifacts: '+dir);
 }finally{if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
