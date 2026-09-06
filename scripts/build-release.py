#!/usr/bin/env python3
"""Build and smoke-test the explicit, dependency-free CX Impact release package."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKILL_FILES = (
    'SKILL.md', 'README.md', 'LICENSE',
    'references/maps.md', 'references/evidence.md',
    'assets/map.html', 'assets/map-core.js', 'assets/map-viewer.js', 'assets/report.md',
    'scripts/render-map.mjs',
)

def build() -> None:
    version = (ROOT / 'VERSION').read_text().strip()
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise SystemExit('VERSION must be a numeric semantic version')
    core = (ROOT / 'skills/cx-impact/assets/map-core.js').read_text()
    if f"const VERSION = '{version}';" not in core:
        raise SystemExit('Renderer and release versions differ')
    out = ROOT / 'dist'
    out.mkdir(exist_ok=True)
    archive = out / f'cx-impact-{version}.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name in SKILL_FILES:
            source = ROOT / 'skills/cx-impact' / name
            if source.is_symlink() or not source.is_file():
                raise SystemExit(f'Invalid release input: {name}')
            info = zipfile.ZipInfo('cx-impact/' + name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o100644 << 16)
            z.writestr(info, source.read_bytes())
        info = zipfile.ZipInfo('cx-impact/VERSION', date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o100644 << 16)
        z.writestr(info, version + '\n')
    expected = {'cx-impact/' + f for f in SKILL_FILES} | {'cx-impact/VERSION'}
    with tempfile.TemporaryDirectory(prefix='cx-impact-release-') as tmp:
        workspace = Path(tmp)
        with zipfile.ZipFile(archive) as z:
            if set(z.namelist()) != expected or z.testzip() is not None:
                raise SystemExit('Archive contents failed verification')
            z.extractall(workspace)
        for folder, stem in [('examples/bicycle-service','bicycle-service-demo'), ('examples/bicycle-service-en','bicycle-service-demo-en')]:
            source = workspace / (stem + '.json')
            shutil.copyfile(ROOT / folder / 'map.json', source)
            html = workspace / (stem + '.html')
            subprocess.run(['node', str(workspace / 'cx-impact/scripts/render-map.mjs'), str(source), str(html)], check=True, stdout=subprocess.DEVNULL)
            before = html.read_bytes()
            if b'MIT License' not in before or b'/*__CX_MAP_' in before:
                raise SystemExit('Generated demo is missing license or contains unresolved markers')
            subprocess.run(['node', str(workspace / (stem + '.source/rebuild.mjs'))], check=True, stdout=subprocess.DEVNULL)
            if html.read_bytes() != before:
                raise SystemExit('Extracted package does not rebuild deterministically')
            checks = json.loads((workspace / (stem + '.checks.json')).read_text())
            if checks['geometry']['status'] != 'checked':
                raise SystemExit('Packaged renderer failed geometry check')
            shutil.copyfile(html, out / (stem + '.html'))
            shutil.copyfile(source, out / (stem + '.json'))
    assets = [archive, *[out / (stem + suffix) for stem in ['bicycle-service-demo','bicycle-service-demo-en'] for suffix in ['.html','.json']]]
    (out / 'SHA256SUMS').write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in assets))
    print(f'Built {archive.name}: {len(expected)} allowlisted files; extracted renderer and exact rebuild passed.')
    for p in assets:
        print(f'{p.name}: {p.stat().st_size} bytes')

if __name__ == '__main__':
    build()
