#!/usr/bin/env python3
"""Prepare and run local synthetic Codex trials. Never grades semantic quality."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import runpy
import shutil
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / 'tests/evaluation'


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def outside_repository(path: str) -> Path:
    directory = Path(path).resolve()
    if directory == ROOT or ROOT in directory.parents:
        raise ValueError('Keep raw evaluation runs outside the publication repository')
    return directory


def prepare(directory: Path, model: str, effort: str) -> None:
    if directory.exists():
        raise ValueError('Evaluation directory already exists; use a new directory')
    cases = json.loads((CASES / 'cases.json').read_text())['cases']
    if len(cases) != 4 or len({case['id'] for case in cases}) != 4:
        raise ValueError('Expected four distinct evaluation cases')
    package_files = runpy.run_path(str(ROOT / 'scripts/build-release.py'))['SKILL_FILES']
    # Use the release allowlist, never a recursive copy of a development folder.
    package = {name: (ROOT / 'skills/cx-impact' / name).read_bytes() for name in package_files}
    version = (ROOT / 'VERSION').read_text().strip()
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('VERSION must be a numeric semantic version')
    package['VERSION'] = (version + '\n').encode()
    inputs = {}
    for case in cases:
        if not re.fullmatch(r'[a-z][a-z0-9-]*', case['id']):
            raise ValueError('Invalid evaluation case ID')
        for key in ['input', 'baseMap']:
            if key in case:
                name = case[key]
                if Path(name).name != name:
                    raise ValueError('Case inputs must be local filenames')
                inputs[name] = (CASES / name).read_bytes()
    directory.mkdir(parents=True)
    manifest = {
        'version': 1, 'createdAt': datetime.now(timezone.utc).isoformat(),
        'model': model, 'effort': effort,
        'packageHashes': {name: hashlib.sha256(data).hexdigest() for name, data in package.items()},
        'environmentNote': 'Same local CLI configuration in both arms. Host skill discovery and readable paths are not a hermetic isolation boundary; audit transcripts for contamination.',
        'trials': [],
    }
    common = (
        'Work only with the supplied files in this working directory. '
        'Read input.md and base-map.json when supplied. Do not read other projects or trial directories, '
        'use the network, install tools, delegate, or change global configuration. '
        'Create output/map.html as standalone HTML and output/map.json as editable JSON. '
        'For an update, also write output/changes.md. Keep the input files unchanged. '
        'Use English. Distinguish source-supported statements, proposals and unknowns. '
        'Proceed with an honest draft when information is missing; record unresolved questions. '
        'Report exactly what you verified and any environment limits.\n\n'
    )
    for case in cases:
        for repeat in [1, 2]:
            for arm in (['short', 'skill'] if repeat == 1 else ['skill', 'short']):
                trial_id = f"{case['id']}-{arm}-{repeat}"
                trial_dir = directory / trial_id
                work = trial_dir / 'work'
                work.mkdir(parents=True)
                (work / 'input.md').write_bytes(inputs[case['input']])
                if 'baseMap' in case:
                    (work / 'base-map.json').write_bytes(inputs[case['baseMap']])
                if arm == 'skill':
                    for name, data in package.items():
                        target = work / 'skill' / name
                        target.parent.mkdir(parents=True, exist_ok=True)
                        target.write_bytes(data)
                instruction = ('Read skill/SKILL.md and use the supplied CX Impact package and its resources. Use no other skills.\n\n'
                               if arm == 'skill' else 'Use a short-prompt workflow without loading skills or a CX Impact package.\n\n')
                (trial_dir / 'prompt.txt').write_text(common + instruction + case['task'] + '\n')
                hashes = {str(path.relative_to(work)): digest(path) for path in work.rglob('*') if path.is_file()}
                manifest['trials'].append({'id': trial_id, 'case': case['id'], 'arm': arm, 'repeat': repeat,
                                           'inputHashes': hashes, 'promptSha256': digest(trial_dir / 'prompt.txt')})
    write_json(directory / 'manifest.json', manifest)
    print(f'Prepared {len(manifest["trials"])} fresh trials in {directory}; no models run, no human ratings recorded.')


def inputs_unchanged(work: Path, hashes: dict) -> bool:
    return all((work / name).is_file() and digest(work / name) == value for name, value in hashes.items())


def run_trial(directory: Path, trial: dict, manifest: dict, timeout: int, codex: str, version: str) -> bool:
    trial_dir = directory / trial['id']
    result_file = trial_dir / 'result.json'
    if result_file.exists():
        result = json.loads(result_file.read_text())
        print(f"{trial['id']}: retained {result['status']}", flush=True)
        return result['status'] == 'completed'
    work = trial_dir / 'work'
    if not inputs_unchanged(work, trial['inputHashes']) or digest(trial_dir / 'prompt.txt') != trial['promptSha256']:
        raise ValueError(f"{trial['id']}: prepared inputs changed; prepare a new evaluation")
    # Exclusive marker also prevents concurrent launches and silent reruns after interruption.
    with (trial_dir / 'started.json').open('x') as marker:
        marker.write(json.dumps({'startedAt': datetime.now(timezone.utc).isoformat()}))
    command = [codex, 'exec', '--ignore-user-config', '--ephemeral', '--skip-git-repo-check',
               '--disable', 'plugins', '--disable', 'hooks', '--disable', 'apps',
               '--enable', 'skip_host_skill_discovery', '--sandbox', 'workspace-write',
               '-m', manifest['model'], '-c', f'model_reasoning_effort={json.dumps(manifest["effort"])}',
               '-C', str(work), '--json', '-o', str(work / 'final.md'), '-']
    start = time.monotonic()
    status, code = 'failed', None
    with (trial_dir / 'stdout.jsonl').open('w') as stdout, (trial_dir / 'stderr.txt').open('w') as stderr:
        process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=stdout, stderr=stderr,
                                   text=True, start_new_session=True)
        try:
            process.communicate((trial_dir / 'prompt.txt').read_text(), timeout=timeout)
            code = process.returncode
            status = 'completed' if code == 0 else 'failed'
        except subprocess.TimeoutExpired:
            if os.name == 'posix':
                os.killpg(process.pid, signal.SIGKILL)
            else:
                process.kill()
            process.communicate()
            code, status = process.returncode, 'timeout'
    usage = None
    for line in (trial_dir / 'stdout.jsonl').read_text().splitlines():
        try:
            event = json.loads(line)
            if event.get('type') == 'turn.completed':
                usage = event.get('usage')
        except (ValueError, AttributeError):
            continue
    valid_json = False
    try:
        json.loads((work / 'output/map.json').read_text())
        valid_json = True
    except (OSError, ValueError):
        pass
    result = {'status': status, 'exitCode': code, 'elapsedSeconds': round(time.monotonic() - start, 3),
              'codexVersion': version, 'command': command, 'usage': usage,
              'artifacts': {'html': (work / 'output/map.html').is_file(), 'jsonParseable': valid_json,
                            'changes': (work / 'output/changes.md').is_file()},
              'inputsUnchanged': inputs_unchanged(work, trial['inputHashes']),
              'humanReview': 'not_reviewed', 'finishedAt': datetime.now(timezone.utc).isoformat()}
    write_json(result_file, result)
    print(f"{trial['id']}: {status}; artifacts={result['artifacts']}; human review pending", flush=True)
    return status == 'completed'


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--prepare', metavar='DIRECTORY')
    mode.add_argument('--run', metavar='DIRECTORY')
    parser.add_argument('--model', help='Explicit available model for both arms (required for preparation)')
    parser.add_argument('--effort', choices=['low', 'medium', 'high', 'xhigh'], default='xhigh')
    parser.add_argument('--timeout', type=int, default=600, help='Seconds allowed per trial')
    parser.add_argument('--trial', help='Run one prepared trial ID; default runs all remaining attempts sequentially')
    args = parser.parse_args()
    try:
        if args.prepare:
            if not args.model or args.trial:
                raise ValueError('Preparation requires --model and does not accept --trial')
            prepare(outside_repository(args.prepare), args.model, args.effort)
            return
        if args.model or args.timeout <= 0:
            raise ValueError('Run uses the prepared model and requires a positive timeout')
        directory = outside_repository(args.run)
        manifest = json.loads((directory / 'manifest.json').read_text())
        for trial in manifest['trials']:
            if not re.fullmatch(r'[a-z][a-z0-9-]*', trial['id']):
                raise ValueError('Invalid prepared trial ID')
        trials = [trial for trial in manifest['trials'] if not args.trial or trial['id'] == args.trial]
        if not trials:
            raise ValueError('No matching prepared trial')
        codex = shutil.which('codex')
        if not codex:
            raise ValueError('Install/configure Codex separately before running; preparation needs no model access')
        version = subprocess.run([codex, '--version'], capture_output=True, text=True, check=True).stdout.strip()
        results = [run_trial(directory, trial, manifest, args.timeout, codex, version) for trial in trials]
        if not all(results):
            sys.exit(1)
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        print(f'Evaluation not completed: {error}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
