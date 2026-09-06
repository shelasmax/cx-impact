/* Optional browser QA. Uses an existing Playwright installation; does not install packages. */
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {chromium}=require(process.env.CX_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const cases=[['bicycle','examples/bicycle-service/map'],['bicycle-en','examples/bicycle-service-en/map'],...['routing','eight-stages','twelve-stages','comparison'].map(n=>[n,'examples/regressions/'+n])];
if(process.env.CX_MAP_PRIVATE_CASE)cases.push(['private',process.env.CX_MAP_PRIVATE_CASE.replace(/\.html$/,'')]);
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const[name,stem]of cases){
   const file=path.resolve(root,stem+'.html'),out=path.dirname(file),prefix=path.basename(stem),input=JSON.parse(fs.readFileSync(path.resolve(root,stem+'.json')));
   const page=await browser.newPage({viewport:{width:1366,height:900},acceptDownloads:true});
   const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
   const report={browser:browser.version(),file:path.basename(file),htmlSha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex'),geometry:{status:'checked',views:[]},visual:{status:'not_checked',note:'Screenshots captured; human/agent image inspection recorded separately.'},interactions:{status:'checked',checks:[]},export:{status:'checked',checks:[]},environment:{inAppBlobPreview:'not_checked; no policy bypass attempted'}};
   await page.goto(pathToFileURL(file).href);await page.waitForFunction(()=>window.cxMapChecks);
   const modes=input.mode==='comparison'?['current','target']:[input.mode||'unspecified'];
   for(const mode of modes){
    if(input.mode==='comparison')await page.locator(`[data-scenario="${mode}"]`).click();
    for(const size of [{width:1366,height:900},{width:1920,height:1080}]){
     await page.setViewportSize(size);
     for(const view of ['cjm','blueprint','process']){
      await page.locator('#tab-'+view).click();await page.locator('#natural').click();
      const geometry=await page.evaluate(()=>window.cxMapChecks);
      if(input.locale==='en') { assert.equal(await page.locator('html').getAttribute('lang'),'en'); assert.doesNotMatch(await page.locator('body').innerText(),/[А-Яа-яЁё]/); }
      assert.equal(geometry.geometry.status,'checked',`${name}/${view}: ${JSON.stringify(geometry.geometry.errors)}`);
      const dimensions=await page.evaluate(()=>{const vp=document.getElementById('viewport'),svg=vp.querySelector('svg'),css=getComputedStyle(vp);return{page:document.documentElement.scrollWidth,viewport:innerWidth,natural:svg.getBoundingClientRect().width,viewBox:svg.viewBox.baseVal.width,client:vp.clientWidth,padding:parseFloat(css.paddingLeft)+parseFloat(css.paddingRight),scroll:vp.scrollWidth};});
      assert.equal(dimensions.page,dimensions.viewport,'no horizontal page overflow');assert.ok(Math.abs(dimensions.natural-dimensions.viewBox)<1,'100% means native CSS pixels');if(dimensions.natural+dimensions.padding>dimensions.client)assert.ok(dimensions.scroll>dimensions.client,'large maps scroll within the canvas');
      report.geometry.views.push({mode,view,width:size.width,...geometry.geometry});
      await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,`${prefix}-${mode}-${view}-${size.width}-100.png`)});
      await page.locator('#fit').click();
      const fit=await page.locator('#viewport>svg').evaluate(svg=>svg.getBoundingClientRect().width);
      assert.ok(fit<=dimensions.client-dimensions.padding+1,'fit uses available width');
      await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,`${prefix}-${mode}-${view}-${size.width}-fit.png`)});
      // Entire SVG captured independently of the clipped viewport, for manual geometry review.
      if(size.width===1920){await page.locator('#viewport').evaluate(el=>el.scrollTop=el.scrollHeight);await page.screenshot({path:path.join(out,`${prefix}-${mode}-${view}-bottom.png`)});await page.locator('#viewport').evaluate(el=>el.scrollTop=0);}
      await page.locator('#plus').click();assert.notEqual(await page.locator('#scale').innerText(),Math.round(fit/dimensions.viewBox*100)+'%');await page.locator('#natural').click();
      const card=page.locator(view==='process'?'[data-node]':'[data-cell]').first();await card.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#drawer').isVisible(),true);if(input.locale==='en')assert.doesNotMatch(await page.locator('#drawer').innerText(),/[А-Яа-яЁё]/);await page.keyboard.press('Escape');assert.equal(await page.locator('#drawer').isVisible(),false);assert.equal(await card.evaluate(el=>el===document.activeElement),true);
      await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(180);if(dimensions.natural+dimensions.padding>dimensions.client)assert.ok(await page.locator('#viewport').evaluate(el=>el.scrollLeft)>0);
      if(size.width===1366){
       await page.locator('#viewport').evaluate(el=>{el.scrollTop=120;el.scrollLeft=150});await page.locator('#minus').click();
       const xmlBefore=await page.locator('#viewport>svg').evaluate(svg=>({width:svg.viewBox.baseVal.width,height:svg.viewBox.baseVal.height,text:svg.textContent}));
       const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download;const saved=path.join(out,`${prefix}-${mode}-${view}.svg`);await d.saveAs(saved);
       assert.equal(await page.locator('[data-export-type="image/svg+xml"] a').count(),2);
       const svgPage=await browser.newPage();await svgPage.goto(pathToFileURL(saved).href);
       const exported=await svgPage.locator('svg').evaluate(svg=>({width:+svg.getAttribute('width'),height:+svg.getAttribute('height'),viewBox:svg.getAttribute('viewBox'),text:svg.textContent,nodeCount:svg.querySelectorAll('[data-node]').length,edges:[...svg.querySelectorAll('[data-edge]')].map(p=>({kind:p.dataset.kind,dash:p.getAttribute('stroke-dasharray')})),outside:[...svg.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<0||b.y<0||b.x+b.width>svg.viewBox.baseVal.width+1||b.y+b.height>svg.viewBox.baseVal.height+1}).map(t=>t.textContent)}));
       assert.ok(Math.abs(exported.width-xmlBefore.width)<0.1);assert.ok(Math.abs(exported.height-xmlBefore.height)<0.1);assert.equal(exported.text,xmlBefore.text);assert.deepEqual(exported.outside,[],'standalone SVG text within full bounds');
       if(view==='process'){for(const e of exported.edges)assert.equal(e.dash,{flow:'none',handoff:'8 4',exception:'2 4'}[e.kind]);}
       await svgPage.close();report.export.checks.push(`${mode}/${view}: download saved, standalone SVG reopened, complete native bounds, mode and legend retained`);
      }
     }
    }
   }
   await page.locator('#questions').click();assert.equal(await page.locator('#drawer').isVisible(),true);await page.keyboard.press('Escape');
   await page.locator('#tab-cjm').click();await page.locator('#tab-cjm').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-blueprint').getAttribute('aria-selected'),'true');
   if(name==='routing'){
    await page.locator('#tab-cjm').click();await page.locator('[data-cell="s0:barrier"]').click();assert.equal(await page.locator('#detail-status').innerText(),'Не установлено');await page.keyboard.press('Escape');
    await page.locator('#tab-process').click();await page.locator('[data-node="n2"]').click();const detail=await page.locator('#drawer').innerText();assert.match(detail,/b-unknown/);assert.match(detail,/Не установлено/);assert.match(detail,/Связанное улучшение/);await page.keyboard.press('Escape');
   }
   const jsonDownload=page.waitForEvent('download');await page.locator('#source').click();const jd=await jsonDownload;const jsonFile=path.join(out,prefix+'-download.json');await jd.saveAs(jsonFile);assert.deepEqual(JSON.parse(fs.readFileSync(jsonFile)),input);fs.unlinkSync(jsonFile);
   const retry=page.waitForEvent('download');await page.locator('[data-export-type="application/json"] a').click();const retryDownload=await retry;assert.equal(await retryDownload.failure(),null);
   assert.match(await page.locator('#status').innerText(),input.locale==='en'?/File generated/:/Файл сформирован/);assert.match(await page.locator('#status').innerText(),input.locale==='en'?/cannot confirm/:/не подтверждено/);
   if(name==='bicycle'||name==='bicycle-en'){
    // README images show the complete view at a spacious desktop size, without editing the map.
    await page.setViewportSize({width:1920,height:1600});
    for(const view of ['cjm','blueprint','process']){
     await page.locator('#tab-'+view).click();await page.locator('#fit').click();
     await page.locator('#export-links').evaluate(el=>el.replaceChildren());
     await page.locator('#status').evaluate(el=>el.textContent='');
     await page.evaluate(()=>window.scrollTo(0,0));
     const canvas=await page.locator('#viewport').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight}));
     assert.ok(canvas.scroll<=canvas.height+1,'README preview includes the whole diagram');
     await page.locator('.shell').screenshot({path:path.join(out,view+'-preview.png')});
     fs.copyFileSync(path.join(out,prefix+'-'+modes[0]+'-'+view+'.svg'),path.join(out,view+'.svg'));
    }
   }
   assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
   report.interactions.checks=['Natural 100%, fit, zoom, canvas keyboard scroll, details keyboard activation, Escape focus return at both viewport sizes','Tab keyboard navigation and assumptions registry','Explicit current/target switching where comparison is supplied'];
   report.export.checks.push('Downloaded JSON deep-equals original input; persistent retry triggers another download');
   fs.writeFileSync(path.join(out,prefix+'.browser-check.json'),JSON.stringify(report,null,2)+'\n');console.log(name+': all browser assertions passed');await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
