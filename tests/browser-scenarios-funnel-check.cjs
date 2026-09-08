/* Optional isolated browser acceptance. Requires existing Playwright and Chrome; installs nothing. */
const {chromium}=require(process.env.CX_PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const base=process.env.CX_SCENARIOS_QA_DIR||os.tmpdir();
fs.mkdirSync(base,{recursive:true});
const dir=fs.mkdtempSync(path.join(base,'cx-scenarios-funnel-'));
const report={configurations:[],legacy:[],contrast:[],artifacts:{},limitations:['Chrome only; no screen-reader or semantic/human acceptance','Native screenshot coverage is representative; full matrix geometry/interactions are automated']};
const render=(source,stem)=>execFileSync(process.execPath,[path.join(root,'skills/cx-impact/scripts/render-map.mjs'),source,path.join(dir,stem+'.html')],{stdio:'pipe'});
for(const locale of ['en','ru'])for(const kind of ['map','funnel'])render(path.join(root,'skills/cx-impact/examples',kind==='map'?'scenarios':'funnels',`online-sales.${locale}.json`),kind+(locale==='ru'?'-ru':''));
const legacy=['examples/bicycle-service/map','examples/bicycle-service-en/map',...['routing','eight-stages','twelve-stages','comparison'].map(n=>'examples/regressions/'+n)];
for(const [i,stem] of legacy.entries())render(path.join(root,stem+'.json'),'legacy-'+i);
const settle=page=>page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));
async function checkScale(page){await page.locator('#natural').click();await settle(page);const dims=await page.locator('#viewport>svg').evaluate(s=>[s.getBoundingClientRect().width,s.viewBox.baseVal.width]);assert.ok(Math.abs(dims[0]-dims[1])<1);await page.locator('#fit').click();await settle(page);assert.equal(await page.locator('#viewport').evaluate(n=>{const c=getComputedStyle(n);return n.querySelector('svg').getBoundingClientRect().width<=n.clientWidth-parseFloat(c.paddingLeft)-parseFloat(c.paddingRight)+1}),true,'fit stays within canvas width');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
async function contrast(page,label){
 const pairs=await page.evaluate(()=>{
  const css=getComputedStyle(document.documentElement),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
  const lum=name=>{ctx.fillStyle=css.getPropertyValue('--'+name);ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)};
  return [['fg','bg'],['muted','bg'],['accent','bg'],['accent','accent-soft'],['accent-on','accent'],['evidence','surface-raised'],['hypothesis','surface-raised'],['hypothesis','danger-soft'],['proposal','proposal-soft'],['unknown','surface-raised'],['danger','surface'],['hypothesis','surface'],['unknown','surface']].map(([f,b])=>{const x=lum(f),y=lum(b);return {pair:f+'/'+b,ratio:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}});
 });for(const p of pairs)assert.ok(p.ratio>=4.5,`${label} ${p.pair}: ${p.ratio}`);report.contrast.push({label,pairs});
}
console.log('Artifacts: '+dir);
async function download(page,id,path){const event=page.waitForEvent('download');await page.locator('#'+id).click();await(await event).saveAs(path);return fs.readFileSync(path,'utf8');}
(async()=>{let browser;try{browser=await chromium.launch({channel:'chrome',headless:true});report.chrome=browser.version();
 if(process.env.CX_SCENARIOS_QA_FOCUSED!=='1') for(const [locale,width,height]of [['en',1366,900],['en',1920,1080],['ru',1366,900],['ru',1920,1080]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(file|data|blob):/.test(r.url()))network.push(r.url())});
  for(const kind of ['map','funnel']){
   await page.goto(`file://${dir}/${kind}${locale==='ru'?'-ru':''}.html`);
   const original=JSON.parse(await page.locator('#map-data').textContent());
   let shapeReference;
   for(const design of ['classic','graphite','workshop','signal']){
    await page.locator(`[data-design-choice="${design}"]`).click();
    for(const theme of ['light','dark']){
     await page.locator(`[data-theme-choice="${theme}"]`).click();await settle(page);
     await contrast(page,`${locale}/${width}/${kind}/${design}/${theme}`);
     report.configurations.push({locale,width,height,kind,design,theme,views:kind==='map'?['cjm','blueprint','process']:['stages','flows','table']});
     assert.equal(await page.locator('html').getAttribute('data-design'),design);
     assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     for(const selector of ['.appearance','.controls'])assert.equal(await page.locator(selector).evaluate(n=>n.scrollWidth<=n.clientWidth),true,selector);
     const views=kind==='map'?['cjm','blueprint','process']:['stages','flows','table'];
     for(const view of views){
      await page.locator(kind==='map'?`[data-view="${view}"]`:`#funnel-tab-${view}`).click();
      if(kind==='map'){
       for(const paired of [false,true]){
        if((await page.locator('#compare-toggle').getAttribute('aria-pressed')==='true')!==paired)await page.locator('#compare-toggle').click();
        assert.equal(await page.evaluate(()=>cxMapChecks.geometry.status),'checked');
        const scene=page.locator('#viewport>svg');
        assert.equal(await scene.getAttribute('data-design'),design);
        assert.equal(await page.locator('[data-scenario-region]').count(),paired?2:0);
        if(design!=='classic')assert.ok(await scene.locator('[data-design-decoration]').count());
        await checkScale(page);
        if(paired){
         const ids=await scene.locator('[id]').evaluateAll(ns=>ns.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
         assert.equal(await scene.locator('[marker-end]').evaluateAll(ns=>ns.every(n=>{const id=n.getAttribute('marker-end').match(/#([^)]*)/)?.[1];return !id||n.ownerSVGElement.querySelector('[id="'+id+'"]')})),true);
        }
        if(view==='process'&&paired){
         const node=page.locator('[data-scenario-region="target"] [data-node]').first();await node.focus();await page.keyboard.press('Enter');
         assert.match(await page.locator('#detail-stage').textContent(),/TO BE/);
         assert.ok((await page.locator('#detail-sources').textContent()).trim());await page.keyboard.press('Escape');
         assert.equal(await node.evaluate(n=>n===document.activeElement),true);
        }
       }
       // Leave the paired scene selected for complete export.
      } else if(view==='table'){
       assert.equal(await page.locator('tbody tr').count(),14);assert.equal(await page.locator('#export').isDisabled(),true);
      } else {
       assert.equal(await page.evaluate(()=>cxFunnelChecks.geometry.status),'checked');
       if(view==='flows'){
        const shape=await page.locator('[data-ribbon]').evaluateAll(ns=>ns.map(n=>n.getAttribute('d')));
        if(!shapeReference)shapeReference=shape;else assert.deepEqual(shape,shapeReference);
        assert.equal(await page.locator('[data-funnel-node]>rect:first-child').evaluateAll(ns=>ns.every(n=>+n.getAttribute('width')===20)),true);
       }
      }
      if(view!=='table')await checkScale(page);
      if(theme==='light'){await page.locator('#natural').click();await settle(page);await page.screenshot({path:`${dir}/${locale}-${width}-${kind}-${design}-${view}.png`});}
     }
     // Representative native screenshot and fit export for every identity and color mode.
     if(kind==='funnel')await page.locator('#funnel-tab-flows').click();
     await page.locator('#natural').click();await settle(page);
     await page.locator('#viewport').evaluate(n=>{n.scrollTop=0;n.scrollLeft=0});await page.evaluate(()=>scrollTo(0,0));
     await page.screenshot({path:`${dir}/${locale}-${width}-${kind}-${design}-${theme}.png`});
     if(kind==='map'&&theme==='light'&&((locale==='ru'&&width===1920&&design==='signal')||(locale==='en'&&width===1366&&design==='workshop'))){await page.locator('#comparison-navigation .comparison-choice').last().click();await settle(page);await page.screenshot({path:`${dir}/${locale}-${width}-${design}-target.png`});}
     await page.locator('#fit').click();
     const xml=await download(page,'export',`${dir}/${locale}-${width}-${kind}-${design}-${theme}.svg`);
     assert.match(xml,new RegExp(`data-design="${design}"`));assert.match(xml,/MIT/);
     assert.doesNotMatch(xml,/data-walk=|data-active=|data-traced=|data-counterpart=|data-viewer-only=/);
     if(design!=='classic')assert.match(xml,/data-design-decoration=/);
     if(design==='signal'&&kind==='map')assert.match(xml,/data-static-stroke-width="3"/);
     if(kind==='funnel'){assert.match(xml,/Europe\/Moscow/);}
     const exported=await browser.newPage();await exported.goto(`file://${dir}/${locale}-${width}-${kind}-${design}-${theme}.svg`);assert.equal(await exported.locator('parsererror').count(),0);if(kind==='funnel'){const visible=await exported.locator('text').evaluateAll(ns=>ns.map(n=>[...n.querySelectorAll('tspan')].map(t=>t.textContent).join(' ')).join(' '));for(const source of original.sources)assert.ok(visible.includes(source.text));}await exported.close();
    }
   }
   const raw=await download(page,'source',`${dir}/${locale}-${kind}-export.json`);
   assert.deepEqual(JSON.parse(raw),original);
   if(kind==='funnel')assert.equal(raw,fs.readFileSync(`${dir}/funnel${locale==='ru'?'-ru':''}.json`,'utf8'));
   await page.locator('[data-design-choice="workshop"]').click();await page.locator('[data-theme-choice="dark"]').click();await page.reload();
   assert.equal(await page.locator('html').getAttribute('data-design'),'workshop');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   await page.locator('[data-design-choice="signal"]').click();assert.equal(await page.locator('[data-theme-choice="dark"]').getAttribute('aria-pressed'),'true');
   await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});await page.locator('[data-theme-choice="system"]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
   await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   await page.locator(kind==='map'?'[data-view="process"]':'#funnel-tab-flows').click();
   if(kind==='map'&&await page.locator('#compare-toggle').getAttribute('aria-pressed')==='true')await page.locator('#compare-toggle').click();
   assert.equal(await page.locator('#journey-player').isVisible(),false);
   await page.locator('#path-toggle').click();if(await page.locator('#path-play').isEnabled())await page.locator('#path-play').click();else if(await page.locator('#path-next').isEnabled())await page.locator('#path-next').click();await page.waitForTimeout(650);
   assert.equal(await page.locator('#path-play').getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('[data-viewer-only]').count(),0);
   const xml=await download(page,'export',`${dir}/${locale}-${kind}-reduced.svg`);assert.doesNotMatch(xml,/data-walk=|data-active=|data-viewer-only=/);
   assert.deepEqual(JSON.parse(await page.locator('#map-data').textContent()),original);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.close();console.log(`PASS ${locale} ${width}x${height}: four designs/two themes, ordinary+paired 3 views, funnel 3 views, exports, independent storage/system, keyboard, reduced motion`);
 }
 for(const kind of ['map','funnel'])for(const storage of ['denied','invalid']){
  const page=await browser.newPage();
  await page.addInitScript(mode=>{if(mode==='denied')Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}});else{localStorage.setItem('cx-impact-design','invalid');localStorage.setItem('cx-impact-theme','invalid');}},storage);
  await page.goto(`file://${dir}/${kind}.html`);assert.equal(await page.locator('html').getAttribute('data-design'),'classic');assert.equal(await page.locator('[data-theme-choice="system"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-design-choice="signal"]').click();await page.locator('[data-theme-choice="dark"]').click();assert.equal(await page.locator('html').getAttribute('data-design'),'signal');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.close();
 }
 console.log('PASS denied/invalid storage for both viewers');
// Complete exports from every visual view, source closures and ordinary-mode restoration.
{
 const page=await browser.newPage({viewport:{width:1366,height:900},acceptDownloads:true});
 for(const kind of ['map','funnel']){
  await page.goto(pathToFileURL(path.join(dir,kind+'.html')).href);
  const data=JSON.parse(fs.readFileSync(path.join(dir,kind+'.json')));
  const tab=page.locator(kind==='map'?'#tab-cjm':'#funnel-tab-stages');await tab.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator(kind==='map'?'#tab-blueprint':'#funnel-tab-flows').getAttribute('aria-selected'),'true');
  await page.locator('[data-design-choice="signal"]').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>{const s=getComputedStyle(document.activeElement);return document.activeElement.matches(':focus-visible')&&s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0}),true);
  if(kind==='map'){
   assert.equal(await page.locator('#compare-toggle').getAttribute('aria-pressed'),'false');
   await page.locator('[data-scenario="target"]').click();await page.locator('#compare-toggle').click();
  }
  for(const view of kind==='map'?['cjm','blueprint','process']:['stages','flows']){
   await page.locator(kind==='map'?'#tab-'+view:'#funnel-tab-'+view).click();await settle(page);
   const before=await page.locator('#viewport>svg').evaluate(n=>({w:n.viewBox.baseVal.width,h:n.viewBox.baseVal.height,text:[...n.querySelectorAll('title,desc,text')].map(t=>t.textContent).join('\n')}));
   const file=path.join(dir,`complete-${kind}-${view}.svg`);await download(page,'export',file);
   const svg=await browser.newPage();await svg.goto(pathToFileURL(file).href);
   assert.equal(await svg.locator('parsererror').count(),0);
   const after=await svg.locator('svg').first().evaluate(n=>({w:+n.getAttribute('width'),h:+n.getAttribute('height'),text:[...n.querySelectorAll('title,desc,text')].map(t=>t.textContent).join('\n')}));
   assert.equal(after.text,before.text,'complete native export preserves every visible claim and metadata string');assert.ok(Math.abs(after.w-before.w)<0.01&&Math.abs(after.h-before.h)<0.01,'native export dimensions agree within SVG float precision');
   for(const logo of await svg.locator('image[data-brand]').evaluateAll(ns=>ns.map(n=>n.getAttribute('href'))))assert.ok(Buffer.from(logo.split(',')[1],'base64').equals(fs.readFileSync(path.join(root,'docs/brand/logo.png'))));
   assert.ok(await svg.locator('image[data-brand]').count());
   if(kind==='map')assert.equal(await svg.locator('[data-scenario-region]').count(),2);
   await svg.close();
  }
  if(kind==='map'){
   const node=page.locator('[data-scenario-region="target"] [data-node]').first();await node.focus();await page.keyboard.press('Enter');
   assert.match(await page.locator('#detail-sources').textContent(),/Authored TO BE/);await page.keyboard.press('Escape');
   const unmatched=page.locator('[data-scenario-region="current"] [data-node="n-legacy"]');await unmatched.focus();await page.keyboard.press('Enter');assert.match(await page.locator('#detail-related').textContent(),/No correspondence|unmatched/i);await page.keyboard.press('Escape');
   const split=page.locator('[data-scenario-region="current"] [data-node="n-order"]');await split.focus();await page.keyboard.press('Enter');assert.ok((await page.locator('#detail-related').textContent()).includes('TO BE'));await page.keyboard.press('Escape');
   await page.locator('#compare-toggle').click();assert.equal(await page.locator('[data-scenario="target"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-scenario-region]').count(),0);
   const raw=await download(page,'export',path.join(dir,'ordinary-restored.svg'));assert.doesNotMatch(raw,/data-comparison="true"/);
  } else {
   const widths=await page.locator('[data-funnel-edge]').evaluateAll(ns=>ns.map(n=>({id:n.dataset.funnelEdge,count:+n.dataset.count,width:+n.dataset.width})));
   for(const e of widths)assert.ok(Math.abs(e.width-e.count*520/600)<1e-8);
   for(const n of data.transitions.nodes){const incoming=widths.filter(e=>data.transitions.edges.find(x=>x.id===e.id).to===n.id),outgoing=widths.filter(e=>data.transitions.edges.find(x=>x.id===e.id).from===n.id);for(const edges of [incoming,outgoing])if(edges.length)assert.ok(Math.abs(edges.reduce((v,e)=>v+e.width,0)-n.value*520/600)<1e-8);}
  }
 }
 await page.close();report.completeExports=['paired cjm','paired blueprint','paired process','funnel stages','funnel flows','restored ordinary'];
}
// Focused source/context, CSV, null/zero/absent-data regressions, EN at 1366x900.
{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(dir,'funnel.html')).href);
 assert.match(await page.locator('[data-funnel-stage="entry"]').textContent(),/not applicable/);
 await page.locator('[data-funnel-stage="entry"]').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#detail-sources').textContent());await page.keyboard.press('Escape');assert.equal(await page.locator('[data-funnel-stage="entry"]').evaluate(n=>n===document.activeElement),true);
 await page.locator('#funnel-tab-flows').click();await page.locator('#path-toggle').click();
 const initial=await page.locator('#path-position').textContent();await page.locator('#questions').click();assert.equal(await page.locator('#detail-related button').count(),0);await page.locator('#close').click();assert.equal(await page.locator('#path-position').textContent(),initial);
 await page.locator('#path-choices button').filter({hasText:'Payment recovery'}).click();assert.match(await page.locator('#path-position').textContent(),/Recovery needed/);
 for(const [selector,expected] of [['[data-funnel-node="retry"]',/Retry payment/],['[data-funnel-edge="recover"]',/Recovery needed/]]){await page.locator(selector).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#detail-related button').count(),1);await page.locator('#detail-related button').click();assert.match(await page.locator('#path-position').textContent(),expected);}
 await page.locator('#path-choices button').filter({hasText:'Retry started'}).click();assert.match(await page.locator('#path-position').textContent(),/Retry payment/);await page.locator('#path-close').click();
 const csv=await download(page,'funnel-csv',path.join(dir,'funnel.csv'));assert.match(csv,/"not_applicable"/);assert.match(csv,/"105","420"/);assert.match(csv,/"0.042"/);
 const original=JSON.parse(fs.readFileSync(path.join(dir,'funnel.json')));
 for(const variant of ['absent','zero','unknown','immature','eligible400','empty','csv']){
  const data=structuredClone(original);
  if(variant==='absent'||variant==='unknown'){delete data.transitions;delete data.repeat;if(variant==='unknown')data.stages[1].count=null;}
  if(variant==='zero'){data.transitions.nodes.push({id:'zero',title:'Explicit zero',value:0,outcome:'unknown',sourceIds:['synthetic']});data.transitions.edges.push({id:'zero-edge',from:'checkout',to:'zero',value:0,label:'Explicit zero',sourceIds:['synthetic']});}
  if(variant==='immature'){data.scope.asOf='2026-06-20';Object.assign(data.repeat,{eligible:0,purchased:0,pending:420});}
  if(variant==='eligible400'){data.scope.asOf='2026-08-07';Object.assign(data.repeat,{eligible:400,purchased:105,pending:20});}
  if(variant==='empty'){delete data.transitions;data.stages.forEach(s=>s.count=0);Object.assign(data.repeat,{eligible:0,purchased:0,pending:0});}
  if(variant==='csv'){data.stages[0].title=' =HYPERLINK("bad")';data.stages[1].definition='@sum(1)\nsecond line';data.stages[2].definition='+SUM(1)';data.stages[3].definition='-1+1';data.stages[4].definition='\t=SUM(1)';}
  const input=path.join(dir,'variant-'+variant+'.json');fs.writeFileSync(input,JSON.stringify(data,null,2));render(input,'variant-'+variant);await page.goto(pathToFileURL(path.join(dir,'variant-'+variant+'.html')).href);
  if(variant==='unknown'){assert.equal(await page.locator('[data-funnel-stage="product"]').getAttribute('data-count'),'unknown');assert.equal(await page.locator('[data-funnel-stage="product"] rect:not([data-design-group])').count(),0);}
  if(variant==='absent'||variant==='unknown'){await page.locator('#funnel-tab-flows').click();assert.equal(await page.locator('[data-ribbon]').count(),0);await page.locator('#funnel-tab-table').click();assert.equal(await page.locator('tbody tr').count(),5);}
  if(variant==='zero'){await page.locator('#funnel-tab-flows').click();assert.equal(await page.locator('[data-funnel-edge="zero-edge"] [data-ribbon]').count(),0);assert.equal(await page.locator('[data-funnel-node="zero"]>rect:not([data-design-group])').count(),0);}
  if(variant==='eligible400')assert.match(await page.locator('#funnel-repeat').textContent(),/105 \/ 400 = 26.3%/);
  if(variant==='empty')assert.equal(await page.locator('[data-funnel-stage] rect:not([data-design-group])').count(),0);
  if(variant==='immature')assert.match(await page.locator('#funnel-repeat').textContent(),/Unknown/);
  if(variant==='csv'){const value=await download(page,'funnel-csv',path.join(dir,'quoted.csv'));assert.ok(value.includes(`"' =HYPERLINK(""bad"")"`));assert.ok(value.includes(`"'@sum(1)\nsecond line"`));for(const text of ['+SUM(1)','-1+1','\t=SUM(1)'])assert.ok(value.includes(JSON.stringify("'"+text).replace('\\t','\t')));}
 }
 assert.deepEqual(errors,[]);await page.close();report.focused=['keyboard tabs and visible focus','repeat eligible400','empty cohort','entry N/A','keyboard/source/focus','contextual regression','CSV quoting/formula safety','absent transitions','unknown stage','zero graph','immature repeat'];
}
if(process.env.CX_SCENARIOS_QA_FOCUSED!=='1') for(const [i,stem] of legacy.entries())for(const [width,height] of [[1366,900],[1920,1080]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(file|data|blob):/.test(r.url()))network.push(r.url())});
 await page.goto(pathToFileURL(path.join(dir,'legacy-'+i+'.html')).href);
 for(const view of ['cjm','blueprint','process']){
  await page.locator('#tab-'+view).click();await settle(page);
  assert.deepEqual(await page.evaluate(()=>cxMapChecks.geometry.errors),[]);
  await page.locator('#natural').click();await settle(page);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const dims=await page.locator('#viewport>svg').evaluate(s=>[s.getBoundingClientRect().width,s.viewBox.baseVal.width]);assert.ok(Math.abs(dims[0]-dims[1])<1);
  await page.screenshot({path:path.join(dir,`legacy-${i}-${width}-${view}.png`)});
  await page.locator('#fit').click();await settle(page);
  report.legacy.push({stem,width,height,view,design:'classic',theme:'system'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.close();
}
report.status='passed';console.log('PASS: '+report.configurations.length+' design/theme/locale/size configurations; '+report.legacy.length+' legacy view/size states; complete exports and focused edge cases.');
}finally{if(browser)await browser.close();
 for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);if(fs.statSync(file).isFile())report.artifacts[name]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
 report.runnerSha256=crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
 report.rendererSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'skills/cx-impact/scripts/render-map.mjs'))).digest('hex');
 report.runtime={};for(const name of ['map.html','map-core.js','map-viewer.js','comparison-core.js','funnel-core.js','funnel-viewer.js','design-core.js'])report.runtime[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'skills/cx-impact/assets',name))).digest('hex');
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));
}})().catch(e=>{console.error(e);process.exitCode=1;});
