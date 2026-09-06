#!/usr/bin/env python3
"""Check tracked publication inputs and internal links. Not a comprehensive secret scanner."""
from __future__ import annotations
import hashlib
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = {'README.md','README.ru.md','LICENSE','VERSION','CHANGELOG.md','CONTRIBUTING.md','SECURITY.md','AGENTS.md','CLAUDE.md','.gitignore'}
DOC_FILES = {'docs/installation.md','docs/verification.md'}
PREFIXES = ('skills/cx-impact/','tests/','scripts/','.github/','docs/brand/','docs/releases/','examples/bicycle-service/','examples/regressions/')
SENSITIVE = re.compile(r'/Users/|/home/(?!runner\b)|(?:gh[pousr]_[A-Za-z0-9]{30,})|(?:github_pat_[A-Za-z0-9_]{30,})|(?:sk-[A-Za-z0-9_-]{32,})|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')

def main() -> None:
    result = subprocess.run(['git','ls-files','-z'], cwd=ROOT, capture_output=True, check=True)
    tracked = {s for s in result.stdout.decode().split('\0') if s}
    if not tracked:
        raise SystemExit('Stage the intended public files before checking release inputs')
    errors = []
    for name in sorted(tracked):
        path = ROOT / name
        if not (name in ROOT_FILES or name in DOC_FILES or name.startswith(PREFIXES)):
            errors.append(f'Not an approved publication input: {name}')
        if path.is_symlink() or not path.is_file():
            errors.append(f'Expected regular file: {name}'); continue
        if any(part in {'.env','private','node_modules','__pycache__'} for part in path.relative_to(ROOT).parts):
            errors.append(f'Unexpected private/generated path: {name}')
        if path.suffix.lower() in {'.png','.jpg','.jpeg','.webp'}:
            continue
        text = path.read_text(encoding='utf-8')
        # The scanner's pattern is executable code, not a leaked private path.
        if name != 'scripts/check-release.py' and SENSITIVE.search(text):
            errors.append(f'Potential sensitive material in {name}; inspect without printing it')
        if path.suffix == '.md':
            targets = re.findall(r'\]\(([^)]+)\)', text) + re.findall(r'(?:src|href)="([^"]+)"', text)
            for target in targets:
                if target.startswith(('http://','https://','#','mailto:')):
                    continue
                clean = unquote(target.split('#',1)[0].split('?',1)[0].strip('<>'))
                if not clean:
                    continue
                resolved = (path.parent / clean).resolve()
                try:
                    relative = resolved.relative_to(ROOT).as_posix()
                except ValueError:
                    errors.append(f'Link outside publication tree in {name}'); continue
                if relative not in tracked and not any(f.startswith(relative.rstrip('/')+'/') for f in tracked):
                    errors.append(f'Link to unpublished file in {name}: {clean}')
    if (ROOT/'LICENSE').read_bytes() != (ROOT/'skills/cx-impact/LICENSE').read_bytes():
        errors.append('Root and packaged licenses differ')
    for manifest in ROOT.glob('examples/*/*.source/manifest.json'):
        import json
        m = json.loads(manifest.read_text())
        for name, digest in m['files'].items():
            if hashlib.sha256((manifest.parent/name).read_bytes()).hexdigest() != digest:
                errors.append(f'Snapshot hash mismatch: {manifest.parent.name}/{name}')
        html = manifest.parent.with_name(manifest.parent.name.removesuffix('.source')+'.html')
        if hashlib.sha256(html.read_bytes()).hexdigest() != m['htmlSha256']:
            errors.append(f'HTML hash mismatch: {html.name}')
    if errors:
        print('\n'.join(errors),file=sys.stderr);raise SystemExit(1)
    print(f'Publication inputs checked: {len(tracked)} tracked files; paths, internal links, package license and snapshot hashes passed.')

if __name__ == '__main__':
    main()
