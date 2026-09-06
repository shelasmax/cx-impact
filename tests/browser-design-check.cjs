/* Optional theme and finite-playback QA. Uses an existing Playwright module. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.CX_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const out=process.env.CX_DESIGN_QA_DIR||path.join(require('node:os').tmpdir(),'cx-impact-design-qa');
const cases=['examples/bicycle-service/map','examples/bicycle-service-en/map',...['routing','eight-stages','twelve-stages','comparison'].map(n=>'examples/regressions/'+n)];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const stem of cases){
   const file=path.resolve(root,stem+'.html'),input=JSON.parse(fs.readFileSync(path.resolve(root,stem+'.json')));
   const page=await browser.newPage({viewport:{width:1366,height:900},acceptDownloads:true});
   const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
   await page.goto(pathToFileURL(file).href);
   assert.equal(await page.locator('html').getAttribute('data-design'),'classic','existing green design is the default');
   const original=await page.evaluate(()=>document.getElementById('map-data').textContent);
   const classicFont=await page.locator('#viewport text').first().getAttribute('font-family');
   await page.locator('[data-design-choice="graphite"]').click();
   assert.notEqual(await page.locator('#viewport text').first().getAttribute('font-family'),classicFont,'design changes the diagram, not just the surrounding controls');
   await page.reload();assert.equal(await page.locator('html').getAttribute('data-design'),'graphite','design choice survives reload');
   for(const design of ['classic','graphite']){
   const selectedMode=await page.locator('[data-theme-choice][aria-pressed="true"]').getAttribute('data-theme-choice');
   await page.locator(`[data-design-choice="${design}"]`).click();
   assert.equal(await page.locator('[data-theme-choice][aria-pressed="true"]').getAttribute('data-theme-choice'),selectedMode,'changing design preserves color-mode preference');
   for(const mode of input.mode==='comparison'?['current','target']:[input.mode||'unspecified']){
    if(input.mode==='comparison')await page.locator(`[data-scenario="${mode}"]`).click();
    for(const theme of ['light','dark']){
     await page.locator(`[data-theme-choice="${theme}"]`).click();
     assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
     const contrast=await page.evaluate(()=>{
      const css=getComputedStyle(document.documentElement),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
      const luminance=name=>{ctx.fillStyle=css.getPropertyValue('--'+name);ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);};
      return [['fg','bg'],['muted','bg'],['accent','bg'],['accent','accent-soft'],['accent-on','accent'],['evidence','surface-raised'],['hypothesis','surface-raised'],['hypothesis','danger-soft'],['proposal','proposal-soft'],['unknown','surface-raised']].map(([f,b])=>{const x=luminance(f),y=luminance(b);return {pair:f+'/'+b,ratio:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};});
     });
     for(const c of contrast)assert.ok(c.ratio>=4.5,`${theme}: ${c.pair} contrast ${c.ratio}`);
     for(const width of [1366,1920]){
      await page.setViewportSize({width,height:width===1366?900:1080});
      for(const view of ['cjm','blueprint','process']){
       await page.locator('#tab-'+view).click();
       assert.deepEqual(await page.evaluate(()=>window.cxMapChecks.geometry.errors),[],`${stem}/${mode}/${theme}/${view}`);
       assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
       await page.locator('#natural').click();
       const dims=await page.locator('#viewport>svg').evaluate(s=>[s.getBoundingClientRect().width,s.viewBox.baseVal.width]);assert.ok(Math.abs(dims[0]-dims[1])<1);
       await page.locator('#fit').click();
       await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished)));
       const label=stem.replaceAll('/','-')+'-'+mode+'-'+design+'-'+theme+'-'+view+'-'+width;
       await page.screenshot({path:path.join(out,label+'.png')});
       if(width===1366){
        const shownFont=await page.locator('#viewport text').first().getAttribute('font-family');
        const shownSurface=await page.locator('#viewport>svg>rect').first().getAttribute('fill');
        const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download;
        const saved=path.join(out,label+'.svg');await d.saveAs(saved);
        const xml=fs.readFileSync(saved,'utf8');assert.doesNotMatch(xml,/data-walk=|data-active=|data-traced=|data-viewer-only=/);
        const svgPage=await browser.newPage();await svgPage.goto(pathToFileURL(saved).href);
        assert.equal(await svgPage.locator('text').first().getAttribute('font-family'),shownFont,'SVG preserves the selected design font');
        assert.equal(await svgPage.locator('svg>rect').first().getAttribute('fill'),shownSurface,'SVG preserves the selected design and light/dark surface');
        assert.equal(await svgPage.locator('[data-node]').count(),view==='process'?(input[mode]||input).process?.nodes.length||0:0);
        assert.deepEqual(await svgPage.locator('svg').evaluate(s=>[...s.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x<0||b.y<0||b.x+b.width>s.viewBox.baseVal.width+1||b.y+b.height>s.viewBox.baseVal.height+1}).map(t=>t.textContent)),[]);
        await svgPage.close();
       }
      }
     }
    }
   }
   }
   assert.equal(await page.evaluate(()=>document.getElementById('map-data').textContent),original,'appearance choices preserve original JSON');
   // Theme persists; an explicit choice survives a system change.
   await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   await page.emulateMedia({colorScheme:'light'});assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   await page.locator('[data-theme-choice="system"]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
   await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
   if(stem==='examples/bicycle-service/map'){
    await page.locator('#tab-process').click();await page.locator('#path-toggle').click();
    await page.locator('#path-play').click();await page.locator('#path-play').click();
    assert.equal(await page.locator('#path-play').getAttribute('aria-pressed'),'false');
    const paused=await page.locator('#path-position').innerText();await page.waitForTimeout(1950);assert.equal(await page.locator('#path-position').innerText(),paused);
    await page.locator('#path-reset').click();
    await page.locator('#path-play').click();
    await page.waitForFunction(()=>document.querySelector('[data-node="decision"]')?.hasAttribute('data-active'),null,{timeout:25000});
    for(let i=0;i<15&&!(await page.locator('#path-choices').isVisible());i++)await page.locator('#path-next').click();
    assert.equal(await page.locator('[data-node="decision"]').getAttribute('data-active'),'true');
    assert.equal(await page.locator('#path-choices button').count(),2,'all branches visible');
    assert.equal(await page.locator('#path-play').getAttribute('aria-pressed'),'false');
    const before=await page.evaluate(()=>JSON.parse(document.getElementById('map-data').textContent));
    await page.locator('#path-choices button').last().click();
    assert.match(await page.locator('#path-caption').innerText(),/без ремонта/);
    // Export during active focus remains a complete, static diagram.
    const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download;
    const saved=path.join(out,'active-path.svg');await d.saveAs(saved);assert.doesNotMatch(fs.readFileSync(saved,'utf8'),/data-walk=|data-active=|data-traced=|data-viewer-only=/);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(document.getElementById('map-data').textContent)),before);
    await page.locator('#path-prev').click();assert.equal(await page.locator('[data-node="decision"]').getAttribute('data-active'),'true');
    await page.locator('#tab-cjm').click();assert.equal(await page.locator('[data-active]').count(),0,'view change clears traversal');
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.getElementById('path-play').disabled);
    await page.locator('#path-next').click();assert.equal(await page.locator('[data-stage][data-active]').count(),1);assert.equal(await page.locator('[data-viewer-only]').count(),0);
    await page.locator('#path-reset').click();for(let i=0;i<input.stages.length;i++)await page.locator('#path-next').click();assert.equal(await page.locator('#path-next').isDisabled(),true,'stage walkthrough ends');
    await page.locator('#path-close').click();assert.equal(await page.locator('[data-active]').count(),0);
    await page.setViewportSize({width:390,height:844});
    for(const design of ['classic','graphite']){await page.locator(`[data-design-choice="${design}"]`).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);}
    // A browser denying preference storage must still allow both controls to work.
    const denied=await browser.newPage();
    await denied.addInitScript(()=>{Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new DOMException('Storage denied','SecurityError');};});
    await denied.goto(pathToFileURL(file).href);
    await denied.locator('[data-design-choice="graphite"]').focus();await denied.keyboard.press('Enter');
    await denied.locator('[data-theme-choice="dark"]').click();
    assert.equal(await denied.locator('html').getAttribute('data-design'),'graphite');assert.equal(await denied.locator('html').getAttribute('data-theme'),'dark');
    await denied.close();
   }
   assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.close();console.log(stem+': themes, geometry and static exports passed');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
