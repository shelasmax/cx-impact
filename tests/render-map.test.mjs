import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateMap, renderMap } from '../skills/cx-impact/scripts/render-map.mjs';
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
