import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateMap, renderMap } from '../skills/cx-impact/scripts/render-map.mjs';
import Core from '../skills/cx-impact/assets/map-core.js';
const example = JSON.parse(await readFile(new URL('../examples/bicycle-service/map.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(example);

test('accepts a complete scenario with all three map views', () => assert.equal(validateMap(copy()).stages.length, 6));
test('rejects broken source references and unsourced facts', () => {
  let m=copy();m.stages[0].goal.sourceIds=['missing'];assert.throws(()=>validateMap(m),/unknown source/);
  m=copy();delete m.stages[0].goal.sourceIds;assert.throws(()=>validateMap(m),/needs a source/);
});
test('allows an honest partial draft with unknown layers', () => {
  const m=copy();delete m.process;delete m.stages[0].backstage;
  m.stages[0].goal={text:'Needs research',status:'unknown'};
  assert.doesNotThrow(()=>validateMap(m));
});
test('rejects broken process links and node placement collisions', () => {
  let m=copy();m.process.edges[0].to='missing';assert.throws(()=>validateMap(m),/unknown node/);
  m=copy();m.process.nodes.push({...m.process.nodes[0],id:'duplicate-position'});assert.throws(()=>validateMap(m),/occupied lane/);
});
test('rejects duplicate stage IDs and text that exceeds card contract', () => {
  let m=copy();m.stages[1].id=m.stages[0].id;assert.throws(()=>validateMap(m),/duplicate ID/);
  m=copy();m.stages[0].goal.text='a'.repeat(141);assert.throws(()=>validateMap(m),/at most 140/);
});
test('embeds JSON without allowing source text to close its script element', async () => {
  const m=copy();m.sources[0].text='</script><script>window.injected=true</script> $&';
  const html=await renderMap(m);
  assert.equal(html.includes(m.sources[0].text),false);
  const content=html.match(/<script id="map-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(content),m);
});
test('renders independent HTML without CDN or runtime fetch', async () => {
  const html=await renderMap(copy());
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=|\bfetch\(/);
});

test('English UI preserves evidence meaning and authored content, including missing conditions', async () => {
  const m=copy();m.locale='en';m.mode='target';
  assert.equal(Core.labelFor({status:'declared'},m),'Requirement / intent');
  assert.equal(Core.labelFor({status:'unknown'},m),'Unknown');
  assert.equal(Core.cell(m,{},'backstage').text,'Unknown');
  assert.equal(Core.cell(m,m.stages[0],'goal').text,example.stages[0].goal.text);
  delete m.process.edges.find(e=>e.from==='decision').label;
  assert.ok(Core.layoutProcess(m).edges.some(e=>e.label==='Condition not specified'));
  assert.match(await renderMap(m),/<html lang="en">/);
  assert.match(await renderMap(copy()),/<html lang="ru">/);
  const comparison={version:1,locale:'en',mode:'comparison',current:{...copy(),mode:'current'},target:{...copy(),mode:'target'}};
  assert.deepEqual(Core.scenarios(comparison).map(map=>map.locale),['en','en']);
  comparison.target.locale='ru';assert.deepEqual(Core.scenarios(comparison).map(map=>map.locale),['en','ru']);
  m.locale='fr';assert.throws(()=>validateMap(m),/locale/);
});

test('English bicycle example preserves the Russian scenario topology and evidence statuses', async () => {
  const en=JSON.parse(await readFile(new URL('../examples/bicycle-service-en/map.json',import.meta.url),'utf8'));
  validateMap(en);assert.doesNotMatch(JSON.stringify(en),/[А-Яа-яЁё]/);
  const meaning=x=>Array.isArray(x)?x.map(meaning):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>!['locale','title','subtitle','actor','goal','disclaimer','text','detail','label','artifact','scenario','start','end'].includes(k)).map(([k,v])=>[k,meaning(v)])):x;
  assert.deepEqual(meaning(en),meaning(example));
  for(let i=0;i<en.stages.length;i++)assert.deepEqual({status:en.stages[i].goal.status,sourceIds:en.stages[i].goal.sourceIds},{status:example.stages[i].goal.status,sourceIds:example.stages[i].goal.sourceIds});
});
