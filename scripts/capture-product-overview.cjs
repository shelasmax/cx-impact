/* Compose the bilingual product overview from real, unretouched renderer captures. */
const {chromium}=require(process.env.CX_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');const {pathToFileURL}=require('node:url');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/brand'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cx-product-overview-'));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const cases=[['cjm','comparison','classic','light'],['stages','funnel','signal','light'],['blueprint','comparison','graphite','light'],['process','comparison','workshop','dark']];
const copy={
 en:{tag:'Maps · Scenarios · Funnels',headline:'See the service.<br>Understand the conversion.',sub:'Customer journeys, service operations and sales — connected for discussion.',labels:['Customer journey','Sales funnel','Service blueprint','Process & handoffs'],foot:'AS IS / TO BE · Four designs · Standalone HTML · SVG / JSON / CSV',caption:'Real output excerpts · Original synthetic examples'},
 ru:{tag:'Карты · Сценарии · Воронки',headline:'Видеть сервис.<br>Понимать конверсию.',sub:'Путь клиента, работа сервиса и продажи — для совместного обсуждения.',labels:['Путь клиента · CJM','Воронка продаж','Сервисная схема','Процесс и передачи'],foot:'AS IS / TO BE · Четыре оформления · Автономный HTML · SVG / JSON / CSV',caption:'Реальные фрагменты результатов · Синтетические данные'}
};
async function main(){let browser;const records=[];try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const locale of ['en','ru']){
  const images=[];
  for(const [view,kind,design,theme]of cases){
   const input=path.join(root,'skills/cx-impact/examples',kind==='funnel'?'funnels':'scenarios',`online-sales.${locale}.json`),html=path.join(tmp,`${kind}-${locale}.html`);
   if(!fs.existsSync(html))execFileSync(process.execPath,[path.join(root,'skills/cx-impact/scripts/render-map.mjs'),input,html],{stdio:'pipe'});
   const page=await browser.newPage({viewport:{width:1920,height:1080},acceptDownloads:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(html).href);await page.locator(`[data-design-choice="${design}"]`).click();await page.locator(`[data-theme-choice="${theme}"]`).click();
   await page.locator(kind==='funnel'?`#funnel-tab-${view}`:`#tab-${view}`).click();
   if(kind==='comparison')await page.locator('[data-scenario="current"]').click();
   const download=page.waitForEvent('download');await page.locator('#export').click();const exported=path.join(tmp,`${view}-${locale}.svg`);await(await download).saveAs(exported);
   const capture=await browser.newPage({viewport:{width:1920,height:1080}});await capture.goto(pathToFileURL(exported).href);
   const scene=capture.locator(kind==='funnel'?'[data-funnel-body]':'svg').first();
   const png=path.join(tmp,`${view}-${locale}.png`);await scene.screenshot({path:png});
   images.push(pathToFileURL(png).href);
   records.push({locale,view,kind,design,theme,scenario:kind==='comparison'?'current':null,source:path.relative(root,input),sourceSha256:hash(fs.readFileSync(input)),htmlSha256:hash(fs.readFileSync(html)),captureSha256:hash(fs.readFileSync(png))});
   assert.deepEqual(errors,[]);await capture.close();await page.close();
  }
  const c=copy[locale];
  const cards=images.map((src,i)=>`<article class="card card-${i}"><div class="bar"><span class="number">0${i+1}</span><h2>${c.labels[i]}</h2><span class="design">${cases[i][2]}</span></div><div class="shot"><img src="${src}" alt="${c.labels[i]}"></div></article>`).join('');
  const html=`<!doctype html><html lang="${locale}"><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#102a24;color:#f8f6ee;font-family:"Avenir Next","Segoe UI",sans-serif}.overview{width:1800px;height:1250px;padding:44px 56px 32px;position:relative;background:radial-gradient(ellipse at 100% 0,#245044,transparent 58%),#102a24}.top{display:flex;justify-content:space-between;align-items:center}.logo{width:285px;height:95px;object-fit:contain;border-radius:8px}.tag{color:#b9d4c8;font-size:20px;letter-spacing:.12em;text-transform:uppercase}h1{font-size:62px;letter-spacing:-.04em;line-height:1.06;margin:28px 0 15px;font-weight:650}p{font-size:24px;color:#b9d4c8;margin:0 0 27px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.card{border:1px solid #58746a;border-radius:12px;overflow:hidden;background:#fbfcf8;box-shadow:0 10px 32px #0003;height:344px}.bar{height:47px;display:flex;align-items:center;gap:12px;padding:0 20px;background:#f0f3eb;color:#203a34;border-bottom:1px solid #dae1d5}h2{font-size:20px;font-weight:650;margin:0}.number{font-size:12px;color:#60786c}.design{margin-left:auto;font-size:13px;text-transform:capitalize;color:#60786c}.shot{height:296px;overflow:hidden;padding:10px 14px 0}.shot img{display:block;width:100%;height:auto}.card-1{border-color:#76bdcd}.card-1 .bar{background:#e6f1f4}.card-1 .shot{background:#f7fbfd;padding-top:12px}.card-3 .shot{background:#24291f}.card-3 .bar{background:#303828;color:#e6edda;border-color:#536445}.card-3 .design,.card-3 .number{color:#bdce95}footer{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:26px;color:#bdd8cd;font-size:18px}footer small{font-size:15px;color:#93b7a7}.line{height:1px;background:#416357;margin-top:26px}
</style><main class="overview"><div class="top"><img class="logo" src="${pathToFileURL(path.join(out,'logo.png')).href}" alt="CX Impact"><span class="tag">${c.tag}</span></div><h1>${c.headline}</h1><p>${c.sub}</p><div class="grid">${cards}</div><div class="line"></div><footer><span>${c.foot}</span><small>${c.caption}</small></footer></main></html>`;
  const composition=path.join(tmp,`overview-${locale}.html`);fs.writeFileSync(composition,html);
  const page=await browser.newPage({viewport:{width:1800,height:1250}});await page.goto(pathToFileURL(composition).href);
  assert.equal(await page.locator('img').evaluateAll(ns=>ns.every(n=>n.complete&&n.naturalWidth>0)),true);
  assert.equal(await page.locator('.overview').evaluate(n=>n.scrollHeight<=n.clientHeight),true,'overview height');
  assert.equal(await page.locator('footer').evaluate(n=>n.scrollWidth<=n.clientWidth),true,'footer text');
  const filename=locale==='en'?'hero.png':'hero.ru.png';await page.screenshot({path:path.join(out,filename)});
  records.push({locale,composition:filename,sha256:hash(fs.readFileSync(path.join(out,filename))),width:1800,height:1250});await page.close();console.log('Captured '+filename);
 }
 fs.writeFileSync(path.join(out,'hero.manifest.json'),JSON.stringify({version:fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),chrome:browser.version(),method:'Browser composition of real SVG captures; excerpts cropped by presentation frames, with no retouching of chart contents.',records},null,2)+'\n');
 console.log('Source captures: '+tmp);
}finally{if(browser)await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
