#!/usr/bin/env python3
"""Build and smoke-test the explicit, dependency-free CX Impact release package."""
from __future__ import annotations
import hashlib
import html as html_module
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
    'references/funnels.md', 'references/funnels.ru.md',
    'examples/scenarios/online-sales.en.json', 'examples/scenarios/online-sales.ru.json',
    'examples/funnels/online-sales.en.json', 'examples/funnels/online-sales.ru.json',
    'references/quickstart.md', 'references/quickstart.ru.md',
    'examples/first-use/target.en.json', 'examples/first-use/target.ru.json',
    'examples/first-use/current.en.json', 'examples/first-use/current.ru.json',
    'examples/first-use/updated.en.json', 'examples/first-use/updated.ru.json',
    'assets/map.html', 'assets/map-core.js', 'assets/map-viewer.js', 'assets/report.md',
    'assets/comparison-core.js', 'assets/funnel-core.js', 'assets/funnel-viewer.js',
    'assets/design-core.js',
    'scripts/render-map.mjs',
)

SCREENSHOT_STEMS = ('comparison-classic', 'comparison-graphite', 'comparison-workshop',
                    'comparison-signal', 'funnel-stages', 'funnel-flows', 'funnel-table',
                    'funnel-workshop')

def build_showcase(out: Path, version: str) -> list[Path]:
    """Build only explicit public demos, screenshots and their standalone sources."""
    gallery = ROOT / 'docs/releases' / f'v{version}'
    manifest = json.loads((gallery / 'screenshots.json').read_text())
    screenshot_names = {f'{stem}-{locale}.png' for stem in SCREENSHOT_STEMS for locale in ('en', 'ru')}
    if manifest['version'] != version or len(manifest['records']) != 16 or {r['filename'] for r in manifest['records']} != screenshot_names:
        raise SystemExit('Release screenshot manifest differs from the explicit bilingual set')
    overview = json.loads((ROOT / 'docs/brand/hero.manifest.json').read_text())
    captures = [r for r in overview['records'] if 'view' in r]
    compositions = [r for r in overview['records'] if 'composition' in r]
    if overview['version'] != version or len(captures) != 8 or len(compositions) != 2:
        raise SystemExit('Product overview manifest differs from the bilingual set')
    if {(r['locale'], r['view']) for r in captures} != {(locale, view) for locale in ('en', 'ru') for view in ('cjm', 'blueprint', 'process', 'stages')}:
        raise SystemExit('Product overview captures are incomplete')
    if any(r['kind'] != ('funnel' if r['view'] == 'stages' else 'comparison') for r in captures):
        raise SystemExit('Unexpected product overview document kind')
    if {(r['locale'], r['composition']) for r in compositions} != {('en', 'hero.png'), ('ru', 'hero.ru.png')}:
        raise SystemExit('Unexpected product overview composition')
    assets = []
    with tempfile.TemporaryDirectory(prefix='cx-impact-showcase-') as tmp:
        stage = Path(tmp) / 'showcase'
        stage.mkdir()
        (stage / 'screenshots').mkdir()
        for record in compositions:
            source = ROOT / 'docs/brand' / record['composition']
            if source.is_symlink() or hashlib.sha256(source.read_bytes()).hexdigest() != record['sha256']:
                raise SystemExit('Product overview hash mismatch')
            name = f"product-{record['locale']}.png"
            shutil.copyfile(source, stage / name)
            shutil.copyfile(source, out / name)
            assets.append(out / name)
        for record in manifest['records']:
            source = gallery / record['filename']
            if source.is_symlink() or hashlib.sha256(source.read_bytes()).hexdigest() != record['sha256']:
                raise SystemExit('Release screenshot hash mismatch')
            shutil.copyfile(source, stage / 'screenshots' / source.name)
            shutil.copyfile(source, out / source.name)
            assets.append(out / source.name)
        for locale in ('en', 'ru'):
            document = (ROOT / 'docs/releases' / f'v{version}.{locale}.md').read_text()
            (stage / f'README.{locale}.md').write_text(document.replace(f'(v{version}/', '(screenshots/').replace(f'(v{version}.', '(README.'))
            for kind, folder in [('comparison', 'scenarios'), ('funnel', 'funnels')]:
                source = ROOT / 'skills/cx-impact/examples' / folder / f'online-sales.{locale}.json'
                result = stage / f'{kind}-{locale}.html'
                subprocess.run(['node', str(ROOT / 'skills/cx-impact/scripts/render-map.mjs'), str(source), str(result)], check=True, stdout=subprocess.DEVNULL)
                if result.with_suffix('.json').read_bytes() != source.read_bytes():
                    raise SystemExit('Showcase input bytes changed')
                for record in [*manifest['records'], *captures]:
                    if record['kind'] == kind and record['locale'] == locale:
                        if record['sourceSha256'] != hashlib.sha256(source.read_bytes()).hexdigest() or record['htmlSha256'] != hashlib.sha256(result.read_bytes()).hexdigest():
                            raise SystemExit('Release screenshots or overview are stale relative to the current source/runtime')
                for suffix in ('.html', '.json'):
                    shutil.copyfile(result.with_suffix(suffix), out / result.with_suffix(suffix).name)
                    assets.append(out / result.with_suffix(suffix).name)
        package = out / f'cx-impact-{version}.zip'
        shutil.copyfile(package, stage / package.name)
        labels = {
            'en': ('Explore CX Impact', 'Maps & AS IS / TO BE', 'Sales funnel', 'Product guide', 'Synthetic examples. Open HTML in a browser; Node.js 18+ is needed only to rebuild.', 'Installable skill package'),
            'ru': ('Посмотреть CX Impact', 'Карты и AS IS / TO BE', 'Воронка продаж', 'Описание продукта', 'Синтетические примеры. Откройте HTML в браузере; Node.js 18+ нужен только для пересборки.', 'Пакет скилла для установки'),
        }
        captions = {
            'en': ['Classic: paired customer journey', 'Graphite: paired service blueprint', 'Workshop: paired process', 'Signal: dark process interface', 'Signal: stages and conversion', 'Signal: payment recovery flows', 'Graphite: numerical table', 'Workshop: funnel interface'],
            'ru': ['Classic: парная карта пути клиента', 'Graphite: парная сервисная схема', 'Workshop: парный процесс', 'Signal: тёмный интерфейс процесса', 'Signal: этапы и конверсии', 'Signal: восстановление оплаты', 'Graphite: таблица чисел', 'Workshop: интерфейс воронки'],
        }
        sections = []
        for locale, (title, comparison, funnel, guide, note, install) in labels.items():
            pictures = ''.join(f'<figure><img loading="lazy" src="screenshots/{stem}-{locale}.png" alt="{html_module.escape(caption)}"><figcaption>{html_module.escape(caption)}</figcaption></figure>' for stem, caption in zip(SCREENSHOT_STEMS, captions[locale]))
            sections.append(f'<section id="{locale}" lang="{locale}"><h2>{title}</h2><img src="product-{locale}.png" alt="CX Impact"><p>{note}</p><nav><a href="comparison-{locale}.html">{comparison}</a><a href="funnel-{locale}.html">{funnel}</a><a href="README.{locale}.md">{guide}</a><a href="{package.name}">{install}</a></nav><details><summary>{"Screenshots" if locale == "en" else "Скриншоты"}</summary>{pictures}</details></section>')
        (stage / 'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CX Impact ' + version + '</title><style>body{margin:40px auto;max-width:1120px;padding:0 24px;background:#f5f3ed;color:#203a34;font:18px/1.6 system-ui}h1{font-size:48px}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#24695a}nav a{padding:12px;background:white;border:1px solid #bbb;border-radius:8px}section{margin:40px 0}figure{margin:24px 0}img{max-width:100%;height:auto}summary{cursor:pointer;margin:24px 0}</style><h1>CX Impact ' + version + '</h1><nav><a href="#en">English</a><a href="#ru">Русский</a></nav>' + ''.join(sections) + '</html>')
        archive = out / f'cx-impact-{version}-showcase.zip'
        with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for file in sorted(stage.rglob('*')):
                if file.is_file():
                    info = zipfile.ZipInfo(file.relative_to(stage).as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.external_attr = (0o100644 << 16)
                    z.writestr(info, file.read_bytes())
        extracted = Path(tmp) / 'extracted'
        with zipfile.ZipFile(archive) as z:
            expected = {p.relative_to(stage).as_posix() for p in stage.rglob('*') if p.is_file()}
            if len(z.namelist()) != len(expected) or set(z.namelist()) != expected or z.testzip() is not None:
                raise SystemExit('Showcase archive members or CRC failed')
            z.extractall(extracted)
        for file in stage.rglob('*'):
            if file.is_file() and file.read_bytes() != (extracted / file.relative_to(stage)).read_bytes():
                raise SystemExit('Showcase extracted bytes differ')
        for link in re.findall(r'(?:href|src)="([^"]+)"', (extracted / 'index.html').read_text()):
            if not link.startswith('#') and not (extracted / link).is_file():
                raise SystemExit('Showcase has a broken local link')
        for source in extracted.glob('*.source'):
            target = source.with_suffix('.html')
            before = target.read_bytes()
            subprocess.run(['node', str(source / 'rebuild.mjs')], check=True, stdout=subprocess.DEVNULL)
            if target.read_bytes() != before:
                raise SystemExit('Extracted showcase did not rebuild exactly')
        assets.append(archive)
    print('Showcase: 16 screenshots and two product overview hashes, exact archive contents, local links and four extracted rebuilds passed.')
    return assets

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
            if len(z.namelist()) != len(expected) or set(z.namelist()) != expected or z.testzip() is not None:
                raise SystemExit('Archive contents failed verification')
            z.extractall(workspace)
        for name in SKILL_FILES:
            if (workspace / 'cx-impact' / name).read_bytes() != (ROOT / 'skills/cx-impact' / name).read_bytes():
                raise SystemExit(f'Archive byte mismatch: {name}')
        for folder, stem in [('examples/bicycle-service','bicycle-service-demo'), ('examples/bicycle-service-en','bicycle-service-demo-en')]:
            source = workspace / (stem + '.json')
            shutil.copyfile(ROOT / folder / 'map.json', source)
            html = workspace / (stem + '.html')
            checked = subprocess.run(['node', str(workspace / 'cx-impact/scripts/render-map.mjs'), '--check', str(source)], check=True, capture_output=True, text=True)
            if json.loads(checked.stdout)['geometry']['status'] != 'checked' or html.exists():
                raise SystemExit('Packaged check-only command failed or wrote HTML')
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
        for name in SKILL_FILES:
            if not name.startswith('examples/') or not name.endswith('.json'):
                continue
            source = workspace / 'cx-impact' / name
            html = workspace / 'rendered' / source.parent.name / (source.stem + '.html')
            checked = subprocess.run(['node', str(workspace / 'cx-impact/scripts/render-map.mjs'), '--check', str(source)], check=True, capture_output=True, text=True)
            if json.loads(checked.stdout)['geometry']['status'] != 'checked' or html.exists():
                raise SystemExit('Packaged fixture check-only failed')
            subprocess.run(['node', str(workspace / 'cx-impact/scripts/render-map.mjs'), str(source), str(html)], check=True, stdout=subprocess.DEVNULL)
            before = html.read_bytes()
            if b'MIT License' not in before or b'data:image/png;base64,' not in before or b'/*__CX_MAP_' in before:
                raise SystemExit('Packaged fixture branding/markers failed')
            if html.with_suffix('.json').read_bytes() != source.read_bytes():
                raise SystemExit('Packaged fixture source bytes changed')
            # Move the complete snapshot away from the installation before rebuilding.
            copied = workspace / 'copied' / source.parent.name
            copied.mkdir(parents=True, exist_ok=True)
            shutil.copytree(html.with_suffix('.source'), copied / (source.stem + '.source'))
            for suffix in ['.html', '.json', '.checks.json']:
                shutil.copyfile(html.with_suffix(suffix), copied / (source.stem + suffix))
            subprocess.run(['node', str(copied / (source.stem + '.source/rebuild.mjs'))], check=True, stdout=subprocess.DEVNULL)
            if (copied / (source.stem + '.html')).read_bytes() != before:
                raise SystemExit('Copied source bundle failed exact rebuild')
            subprocess.run(['node', str(html.with_suffix('.source') / 'rebuild.mjs')], check=True, stdout=subprocess.DEVNULL)
            if html.read_bytes() != before:
                raise SystemExit('Packaged fixture did not rebuild deterministically')
    assets = [archive, *[out / (stem + suffix) for stem in ['bicycle-service-demo','bicycle-service-demo-en'] for suffix in ['.html','.json']]]
    assets += build_showcase(out, version)
    (out / 'SHA256SUMS').write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in assets))
    print(f'Built {archive.name}: {len(expected)} allowlisted files; extracted renderer and exact rebuild passed.')
    for p in assets:
        print(f'{p.name}: {p.stat().st_size} bytes')

if __name__ == '__main__':
    build()
