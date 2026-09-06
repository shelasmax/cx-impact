import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, mkdir, readdir, stat, rm, symlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const renderer = fileURLToPath(new URL('../skills/cx-impact/scripts/render-map.mjs', import.meta.url));
const fixture = async name => JSON.parse(await readFile(new URL(`fixtures/${name}.json`, import.meta.url)));
const run = (cwd, args, script = renderer) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });

async function workspace(t, value) {
  const dir = await mkdtemp(join(tmpdir(), 'cx-check-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'map.json'), typeof value === 'string' ? value : JSON.stringify(value));
  await writeFile(join(dir, 'map.html'), 'Existing HTML must be preserved');
  await writeFile(join(dir, 'map.checks.json'), 'Existing report must be preserved');
  await mkdir(join(dir, 'map.source'));
  await writeFile(join(dir, 'map.source/manifest.json'), 'Existing custom bundle must be preserved');
  return dir;
}

async function snapshot(dir) {
  const files = {};
  for (const name of await readdir(dir)) {
    const path = join(dir, name), info = await stat(path);
    files[name] = info.isDirectory() ? await snapshot(path) : { bytes: await readFile(path, 'utf8'), mtime: info.mtimeMs };
  }
  return files;
}

test('--check prints a usable report without touching existing artifacts', async t => {
  const dir = await workspace(t, await fixture('routing')), before = await snapshot(dir);
  const result = run(dir, ['--check', 'map.json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const report = JSON.parse(result.stdout);
  assert.equal(report.structure.status, 'checked');
  assert.equal(report.geometry.status, 'checked');
  for (const field of ['visual', 'interactions', 'export', 'reproducibility']) assert.equal(report[field].status, 'not_checked');
  assert.deepEqual(await snapshot(dir), before);
});

test('--check allows an honest partial legacy map and exposes its warnings', async t => {
  const map = await fixture('routing');
  delete map.mode; delete map.scope; delete map.process;
  const dir = await workspace(t, map), before = await snapshot(dir);
  const result = run(dir, ['--check', 'map.json']);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.ok(report.structure.warnings.some(w => w.code === 'MODE_UNSPECIFIED'));
  assert.deepEqual(report.geometry.maps, []);
  assert.deepEqual(await snapshot(dir), before);
});

test('--check includes both scenarios in a comparison', async t => {
  const dir = await workspace(t, await fixture('comparison'));
  const result = run(dir, ['--check', 'map.json']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).geometry.maps.map(map => map.mode), ['current', 'target']);
});

test('--check reports a detected geometry failure, exits 1 and writes no files', async t => {
  const dir = await workspace(t, await fixture('routing'));
  const preload = join(dir, 'colliding-route.cjs');
  const core = fileURLToPath(new URL('../skills/cx-impact/assets/map-core.js', import.meta.url));
  // Fault-inject one corrupt route into the real layout and real geometry checker.
  // No production test seam or fake success/failure report is used.
  await writeFile(preload, `const Core=require(${JSON.stringify(core)});
const layoutProcess=Core.layoutProcess;
Core.layoutProcess=map=>{
  const layout=layoutProcess(map),edge=layout.edges[0];
  const node=layout.nodes.find(n=>n.id!==edge.from&&n.id!==edge.to);
  edge.points=[{x:node.x+10,y:node.y-10},{x:node.x+10,y:node.y+node.h+10}];
  layout.geometry=Core.checkGeometry(layout);
  return layout;
};\n`);
  const before = await snapshot(dir);
  const result = spawnSync(process.execPath, ['--require', preload, renderer, '--check', 'map.json'], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  const report = JSON.parse(result.stdout);
  assert.equal(report.structure.status, 'checked');
  assert.equal(report.geometry.status, 'failed');
  assert.ok(report.geometry.maps[0].errors.some(error => error.code === 'EDGE_NODE_COLLISION'));
  assert.deepEqual(await snapshot(dir), before);
});

test('--check reports missing branch conditions without rejecting a draft', async t => {
  const map = await fixture('routing');
  const decision = map.process.nodes.find(node => node.kind === 'decision');
  const edge = map.process.edges.find(edge => edge.from === decision.id);
  delete edge.label; delete edge.condition;
  const dir = await workspace(t, map);
  const result = run(dir, ['--check', 'map.json']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(JSON.parse(result.stdout).structure.warnings.some(w => w.code === 'MISSING_CONDITION'));
});

test('--check fails with actionable structural diagnostics and preserves the directory', async t => {
  const map = await fixture('routing');
  map.process.edges[0].to = 'missing';
  const dir = await workspace(t, map), before = await snapshot(dir);
  const result = run(dir, ['--check', 'map.json']);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /unknown node/);
  assert.deepEqual(await snapshot(dir), before);
});

test('--check rejects malformed JSON, missing input and extra output arguments without writing', async t => {
  const dir = await workspace(t, '{'), before = await snapshot(dir);
  for (const args of [['--check', 'map.json'], ['--check', 'missing.json'], ['--check'], ['--check', 'map.json', 'new.html'], ['--check', 'map.json', '--no-bundle']]) {
    const result = run(dir, args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.trim());
    assert.deepEqual(await snapshot(dir), before);
  }
});

test('--check works through a symlinked installed skill from another directory', async t => {
  const dir = await workspace(t, await fixture('routing'));
  const alias = join(dir, 'installed-skill');
  await symlink(fileURLToPath(new URL('../skills/cx-impact/', import.meta.url)), alias, 'dir');
  const result = run(dir, ['--check', 'map.json'], join(alias, 'scripts/render-map.mjs'));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).geometry.status, 'checked');
});
