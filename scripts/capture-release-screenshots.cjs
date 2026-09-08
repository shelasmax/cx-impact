/* Capture original synthetic release illustrations with an already installed Chrome/Playwright. */
const { chromium } = require(process.env.CX_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const output = path.join(root, 'docs/releases', 'v' + version);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'cx-release-screenshots-'));
const cases = [
  ['comparison-classic', 'comparison', 'cjm', 'classic', 'light', 'export'],
  ['comparison-graphite', 'comparison', 'blueprint', 'graphite', 'light', 'export'],
  ['comparison-workshop', 'comparison', 'process', 'workshop', 'light', 'export'],
  ['comparison-signal', 'comparison', 'process', 'signal', 'dark', 'interface'],
  ['funnel-stages', 'funnel', 'stages', 'signal', 'light', 'export'],
  ['funnel-flows', 'funnel', 'flows', 'signal', 'light', 'export'],
  ['funnel-table', 'funnel', 'table', 'graphite', 'light', 'interface'],
  ['funnel-workshop', 'funnel', 'stages', 'workshop', 'light', 'interface'],
];
const settle = page => page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const records = [];
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    for (const locale of ['en', 'ru']) {
      for (const [stem, kind, view, design, theme, mode] of cases) {
        const source = path.join(root, 'skills/cx-impact/examples', kind === 'funnel' ? 'funnels' : 'scenarios', `online-sales.${locale}.json`);
        const html = path.join(temporary, `${kind}-${locale}.html`);
        if (!fs.existsSync(html)) execFileSync(process.execPath, [path.join(root, 'skills/cx-impact/scripts/render-map.mjs'), source, html]);
        const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
        const errors = [], requests = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) requests.push(r.url()); });
        await page.goto(pathToFileURL(html).href);
        await page.locator(`[data-design-choice="${design}"]`).click();
        await page.locator(`[data-theme-choice="${theme}"]`).click();
        await page.locator(kind === 'funnel' ? `#funnel-tab-${view}` : `#tab-${view}`).click();
        if (kind === 'comparison') await page.locator('#compare-toggle').click();
        if (view !== 'table') await page.locator('#fit').click();
        await settle(page);
        await page.locator('#viewport').evaluate(n => { n.scrollTop = 0; n.scrollLeft = 0; });
        await page.evaluate(() => scrollTo(0, 0));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        const filename = `${stem}-${locale}.png`;
        if (mode === 'export') {
          const download = page.waitForEvent('download');
          await page.locator('#export').click();
          const svg = path.join(temporary, `${stem}-${locale}.svg`);
          await (await download).saveAs(svg);
          const exported = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
          await exported.goto(pathToFileURL(svg).href);
          const scene = exported.locator('svg').first();
          assert.equal(await scene.getAttribute('data-design'), design);
          await scene.screenshot({ path: path.join(output, filename) });
          await exported.close();
        } else {
          await page.screenshot({ path: path.join(output, filename), fullPage: true });
        }
        assert.deepEqual(errors, []); assert.deepEqual(requests, []);
        records.push({ filename, locale, kind, view, design, theme, capture: mode,
          viewport: { width: 1920, height: 1080 }, sourceSha256: hash(fs.readFileSync(source)),
          htmlSha256: hash(fs.readFileSync(html)), sha256: hash(fs.readFileSync(path.join(output, filename))) });
        await page.close();
        console.log('Captured ' + filename + ' (' + mode + ')');
      }
    }
    fs.writeFileSync(path.join(output, 'screenshots.json'), JSON.stringify({ version, chrome: browser.version(), records }, null, 2) + '\n');
  } finally {
    if (browser) await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
