import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inspectMap, renderMap } from '../skills/cx-impact/scripts/render-map.mjs';

const load = async (scenario, locale) => JSON.parse(await readFile(new URL(`../skills/cx-impact/examples/first-use/${scenario}.${locale}.json`, import.meta.url)));

function meaning(map) {
  const claims = [];
  function visit(value, path = '') {
    if (!value || typeof value !== 'object') return;
    if (value.status) claims.push({ path, status: value.status, sourceIds: value.sourceIds });
    for (const [key, item] of Object.entries(value)) visit(item, `${path}/${key}`);
  }
  visit(map);
  return {
    mode: map.mode,
    stages: map.stages.map(s => [s.id, s.barrierIds]),
    sources: map.sources.map(s => [s.id, s.kind]),
    barriers: map.barriers.map(b => [b.id, b.stageIds]),
    questions: map.questions.map(q => [q.id, q.stageIds]),
    participants: map.participants.map(p => p.id),
    lanes: map.process.lanes.map(l => [l.id, l.participantId]),
    nodes: map.process.nodes.map(n => [n.id, n.stageId, n.laneId, n.kind, n.barrierIds]),
    edges: map.process.edges.map(e => [e.id, e.from, e.to, e.kind]),
    claims,
  };
}

for (const scenario of ['target', 'current', 'updated']) {
  test(`${scenario} first-use examples preserve bilingual topology and render exact source data`, async () => {
    const en = await load(scenario, 'en'), ru = await load(scenario, 'ru');
    assert.deepEqual(meaning(en), meaning(ru));
    assert.doesNotMatch(JSON.stringify(en), /[А-Яа-яЁё]/);
    for (const map of [en, ru]) {
      assert.equal(map.mode, scenario === 'target' ? 'target' : 'current');
      assert.equal(inspectMap(map).geometry.status, 'checked');
      const html = await renderMap(map);
      const embedded = JSON.parse(html.match(/<script id="map-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
      assert.deepEqual(embedded, map);
    }
  });
}

test('worked revisions retain original source records and corresponding entity IDs', async () => {
  for (const locale of ['en', 'ru']) {
    const before = await load('current', locale), after = await load('updated', locale);
    for (const key of ['stages', 'participants']) assert.deepEqual(after[key].map(x => x.id), before[key].map(x => x.id));
    for (const key of ['lanes', 'nodes', 'edges']) assert.deepEqual(after.process[key].map(x => x.id), before.process[key].map(x => x.id));
    for (const source of before.sources) assert.deepEqual(after.sources.find(s => s.id === source.id), source);
    assert.equal(after.sources.length, before.sources.length + 1);
    assert.ok(after.questions.some(q => q.status === 'unknown' && q.sourceIds?.length === 2), 'conflict retains both sources in an open question');
    const normalized = structuredClone(after);
    // Only the documented revision metadata and conflict-bearing claims may change.
    for (const key of ['title', 'subtitle', 'disclaimer']) normalized[key] = before[key];
    normalized.scope.asOf = before.scope.asOf;
    normalized.sources = normalized.sources.filter(s => before.sources.some(old => old.id === s.id));
    const oldStage = before.stages.find(s => s.id === 'review');
    const stage = normalized.stages.find(s => s.id === 'review');
    const conflict = claim => {
      assert.equal(claim.status, 'unknown');
      assert.deepEqual(claim.sourceIds, ['ops-handbook', 'customer-faq']);
    };
    for (const key of ['action', 'channel', 'evidence', 'frontstage']) {
      conflict(stage[key]); stage[key] = oldStage[key];
    }
    for (const [key, id] of [['barriers', 'response-timing'], ['questions', 'response-authority']]) {
      const index = normalized[key].findIndex(item => item.id === id);
      conflict(normalized[key][index]);
      normalized[key][index] = before[key].find(item => item.id === id);
    }
    for (const [key, ids, fields] of [
      ['nodes', ['send-collection', 'receive-unavailable'], ['title', 'status', 'sourceIds', 'detail']],
      ['edges', ['available', 'unavailable', 'collection-to-sign'], ['condition', 'label', 'status', 'sourceIds', 'detail']],
    ]) for (const id of ids) {
      const item = normalized.process[key].find(item => item.id === id);
      const old = before.process[key].find(item => item.id === id);
      conflict(item);
      for (const field of fields) {
        if (Object.hasOwn(old, field)) item[field] = old[field];
        else delete item[field];
      }
    }
    assert.deepEqual(normalized, before, 'all unrelated claims, references and graph content survive the revision');
  }
});

test('process examples connect customer returns to the documented desk work', async () => {
  for (const scenario of ['target', 'current', 'updated']) {
    const map = await load(scenario, 'en');
    const lane = scenario === 'target' ? 'desk-lane' : 'reception-lane';
    const receiver = map.process.nodes.find(n => n.stageId === 'return' && n.laneId === lane);
    assert.ok(receiver, `${scenario}: receiving/restocking work from the source must be represented`);
    assert.ok(map.process.edges.some(e => e.from === 'return-kit' && e.to === receiver.id));
    if (scenario === 'target') {
      const handover = map.process.nodes.find(n => n.stageId === 'collect' && n.laneId === lane);
      assert.ok(handover, 'the target desk prepares and hands over the kit');
      assert.ok(map.process.edges.some(e => e.from === 'send-confirmation' && e.to === handover.id));
      assert.ok(map.process.edges.some(e => e.from === handover.id && e.to === 'collect-kit'));
    }
  }
});
