import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm, mkdir, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const runner = join(root, 'scripts/evaluate-codex.py');
const run = (args, env) => spawnSync('python3', ['-B', runner, ...args], { encoding: 'utf8', env });
async function prepare(t) {
  const dir = await mkdtemp(join(tmpdir(), 'cx-evaluation-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, 'evaluation');
  const result = run(['--prepare', output, '--model', 'test-model', '--effort', 'high']);
  assert.equal(result.status, 0, result.stderr);
  return { dir, output, manifest: JSON.parse(await readFile(join(output, 'manifest.json'))) };
}

test('evaluation preparation isolates sixteen attempts and preserves matched inputs', async t => {
  const { output, manifest } = await prepare(t);
  assert.equal(manifest.trials.length, 16);
  assert.equal(manifest.model, 'test-model');
  assert.equal(manifest.effort, 'high');
  assert.equal(new Set(manifest.trials.map(t => t.id)).size, 16);
  const version = (await readFile(join(root, 'VERSION'), 'utf8')).trim() + '\n';
  assert.equal(manifest.packageHashes.VERSION, createHash('sha256').update(version).digest('hex'));
  for (const trial of manifest.trials) {
    const work = join(output, trial.id, 'work');
    const files = await readdir(work);
    assert.equal(files.includes('skill'), trial.arm === 'skill');
    if (trial.arm === 'skill') {
      assert.equal(await readFile(join(work, 'skill/VERSION'), 'utf8'), version);
      for (const [name, hash] of Object.entries(manifest.packageHashes)) {
        assert.equal(createHash('sha256').update(await readFile(join(work, 'skill', name))).digest('hex'), hash);
      }
    }
    assert.equal(files.includes('base-map.json'), trial.case === 'update');
    assert.ok(files.includes('input.md'));
    const peer = manifest.trials.find(p => p.case === trial.case && p.repeat === trial.repeat && p.arm !== trial.arm);
    assert.equal(await readFile(join(work, 'input.md'), 'utf8'), await readFile(join(output, peer.id, 'work/input.md'), 'utf8'));
  }
  assert.deepEqual(manifest.trials.slice(0, 2).map(t => t.arm), ['short', 'skill']);
  assert.deepEqual(manifest.trials.slice(2, 4).map(t => t.arm), ['skill', 'short']);
  const result = run(['--prepare', output, '--model', 'test-model']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /exist/i);
});

test('evaluation refuses to put raw runs in the publication repository', () => {
  const result = run(['--prepare', join(root, 'tests/evaluation/raw-attempt'), '--model', 'test-model']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /outside.*repository/i);
});

test('evaluation records a failed external runner without inventing success or retrying it', async t => {
  const { dir, output, manifest } = await prepare(t);
  const bin = join(dir, 'bin'); await mkdir(bin);
  // Replace the external model process only; no test launches a model or accesses auth.
  const fake = join(bin, 'codex');
  await writeFile(fake, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo codex-test; exit 0; fi\ncat >/dev/null\necho synthetic-provider-failure >&2\nexit 7\n');
  await chmod(fake, 0o755);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
  const trial = manifest.trials[0];
  const args = ['--run', output, '--trial', trial.id, '--timeout', '5'];
  const first = run(args, env);
  assert.equal(first.status, 1, first.stderr);
  const path = join(output, trial.id, 'result.json');
  const raw = await readFile(path, 'utf8'), result = JSON.parse(raw);
  assert.equal(result.status, 'failed');
  assert.equal(result.exitCode, 7);
  assert.equal(result.humanReview, 'not_reviewed');
  assert.equal(result.artifacts.html, false);
  assert.equal(result.inputsUnchanged, true);
  assert.ok(result.elapsedSeconds >= 0);
  run(args, env);
  assert.equal(await readFile(path, 'utf8'), raw, 'a rerun must not replace an earlier failure');
  assert.equal((await readdir(join(output, manifest.trials[1].id))).includes('result.json'), false);
});
