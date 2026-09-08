import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile, mkdtemp, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
let Design;
try { Design=require('../skills/cx-impact/assets/design-core.js'); } catch {}
test('appearance preferences independently accept four designs and tolerate invalid or denied storage',()=>{
  assert.ok(Design,'shared design helper must exist');
  const saved=new Map([['cx-impact-design','workshop'],['cx-impact-theme','dark']]);
  const storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)};
  assert.equal(Design.readChoice('design',storage),'workshop');
  Design.saveChoice('design','signal',storage);
  assert.equal(Design.readChoice('theme',storage),'dark');
  assert.equal(Design.readChoice('design',storage),'signal');
  Design.saveChoice('theme','system',storage);
  assert.equal(Design.readChoice('design',storage),'signal');
  saved.set('cx-impact-design','invalid');saved.set('cx-impact-theme','invalid');
  assert.equal(Design.readChoice('design',storage),'classic');
  assert.equal(Design.readChoice('theme',storage),'system');
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
  assert.equal(Design.readChoice('design',denied),'classic');
  assert.doesNotThrow(()=>Design.saveChoice('design','signal',denied));
  assert.equal(Design.saveChoice('design','invalid',storage),false);
});
test('Workshop group outlines are deterministic and stay within the supplied group rectangle',()=>{
  assert.ok(Design);
  const b={x:10,y:20,width:200,height:100};
  const points=Design.outlinePoints(b,3);
  assert.deepEqual(points,Design.outlinePoints(b,3));
  assert.notDeepEqual(points,Design.outlinePoints(b,4));
  for(const [x,y]of points){assert.ok(x>=b.x&&x<=b.x+b.width);assert.ok(y>=b.y&&y<=b.y+b.height);}
});
test('both viewer snapshots contain the design helper and rebuild without an installed package',async()=>{
  const {deliverMap}=await import('../skills/cx-impact/scripts/render-map.mjs');
  for(const kind of ['scenarios','funnels']){
    const dir=await mkdtemp(join(tmpdir(),'cx-design-'));
    const raw=await readFile(`skills/cx-impact/examples/${kind}/online-sales.en.json`,'utf8');
    await writeFile(join(dir,'input.json'),raw);
    await deliverMap(join(dir,'input.json'),join(dir,'output.html'));
    const html=await readFile(join(dir,'output.html'),'utf8');
    const manifest=JSON.parse(await readFile(join(dir,'output.source/manifest.json')));
    assert.ok(manifest.files['assets/design-core.js']);
    assert.match(html,/data-design-choice="workshop"/);
    assert.match(html,/data-design-choice="signal"/);
    execFileSync(process.execPath,[join(dir,'output.source/rebuild.mjs')]);
    assert.equal(await readFile(join(dir,'output.html'),'utf8'),html);
    assert.equal(await readFile(join(dir,'output.json'),'utf8'),raw);
  }
});
