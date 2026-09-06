# Verification scope for v0.2.0

This is an experimental preview. Mechanical checks, visual inspection and human assessment of a map's meaning are different kinds of evidence.

| Layer | Checked locally before publication |
|---|---|
| Structure and data | 18 Node tests: references, evidence status, modes, legacy input, safe JSON embedding and explicit placement conflicts. |
| Geometry | Routes against unrelated cards; labels against cards and other labels; full conditions retained. Includes 8-stage / 5-lane and long 12-stage fixtures. |
| Browser behavior | Chrome 152 on macOS, 1366×900 and 1920×1080. 42 scenario/view/size combinations across public examples and one private local real-world map. Geometry, zoom, fit, keyboard details and JSON export checks passed. |
| SVG export | 21 downloads saved and reopened in Chrome. Complete view bounds, mode, legend and text checked after zoom and scroll. |
| Visual inspection | Agent inspection of representative screenshots, including all three views of the local real-world example, long text, branches and footer legends. Not human acceptance of every state. |
| Rebuild | Six local source bundles reproduced their HTML and JSON byte-for-byte; a customized template was also tested in a disposable directory. |

Private project material and raw local reports are not part of this public repository. The public fixtures, renderer tests and optional browser-check script are available for reproduction. The first release adds packaging/integrity checks and CI; [the Actions page](https://github.com/shelasmax/cx-impact/actions/workflows/checks.yml) is the source of truth for actual hosted results.

Generated `.checks.json` files check structure and geometry; they do not certify visual quality or a completed download. Rebuilding a map does not carry forward human acceptance. Browser inspection should be repeated after material layout changes.

## Limits

- No new comparative model experiment or human acceptance study was performed for this release.
- Claude Code, other browsers, other operating systems and mobile layouts were not part of local visual validation.
- CI validates the checks it runs; it does not run customer research or claim universal browser compatibility.
- The in-app browser's `blob:` policy was not bypassed. Standalone SVG screenshot capture through Playwright timed out; downloaded SVGs were checked through the rendered DOM, while visual inspection used the HTML viewer.
- Dense maps may use numbered full conditions below the process. Fit-to-width is an overview, not a guarantee of readable text at every density.
- Source support and actual customer behavior still require judgement. The skill has not been shown to outperform a short prompt.
