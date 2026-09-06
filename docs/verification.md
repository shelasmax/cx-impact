# Verification scope

## v0.3.0 · Classic and Graphite viewer

The v0.3.0 renderer is checked locally in Chrome 152.0.7977.83 on macOS. This records scoped verification before publication, not a general accessibility certification.

| Layer | Scope |
|---|---|
| Unit tests | 23 Node tests, including authored roots, full branch choices, disconnected starts, terminal nodes, cycles, and input immutability. |
| Themes and geometry | 168 scenario/design/color-mode/view/size combinations: six public examples, including both comparison scenarios, all three views, Classic/Graphite × light/dark, 1366×900 and 1920×1080. Actual text bounds and page containment checked. |
| Theme preferences | Design choice survives reload independently of color mode; explicit color mode survives system changes; System follows the system preference. Both controls work when storage access throws a SecurityError. |
| Contrast | Ten normal text/surface pairings per design/color-mode combination checked at ≥4.5:1 after browser sRGB conversion, including accent-on-tint and hypothesis-on-barrier. This does not certify every possible user customization. |
| Playback | No autoplay; Play/Pause, previous, next, reset; automatic pause at the bicycle decision and explicit no-repair branch; view changes clear state; reduced-motion uses static steps; input JSON remains unchanged. |
| Exports | 84 themed SVG downloads reopened and checked for full bounds/content, plus export during an active path with all transient state removed. Existing export checks additionally cover zoom/scroll, original JSON and retry links. |
| Visual review | Agent inspection of the original/new bicycle maps, all three types in both designs and light/dark, both languages, native laptop reading and desktop overview, plus representative long-route, 12-stage and comparison views. Generated screenshots are local QA material, not a claim of human acceptance of every state. |
| Packaging | Allowlist integrity check; local archive extracted, both language demos rendered, source snapshots rebuilt byte-for-byte. Only allowlisted package files enter the archive. |

Reproduce with the standard Node tests and release scripts. The optional browser scripts `tests/browser-map-check.cjs` and `tests/browser-design-check.cjs` use an already installed Playwright module and Chrome. Set `CX_PLAYWRIGHT_MODULE` if it is outside project resolution; `CX_DESIGN_QA_DIR` selects a local output directory for the design checks. They install no dependencies. Keyboard scrolling is synchronized to the observed scroll result, with focus/visibility diagnostics on timeout.

Only a 390px overflow smoke check was added for narrow screens in each design. Other browser engines, operating systems, touch behavior and screen readers remain unverified. The OpenDesign prototype is a design artifact; the packaged viewer preserves the repository's data, geometry and export contracts. Private design explorations and raw logs are excluded from publication.

## Published v0.2.1 baseline

This is an experimental preview. Mechanical checks, visual inspection and human assessment of a map's meaning are different kinds of evidence.

| Layer | Checked locally before publication |
|---|---|
| Structure and data | 20 Node tests: references, evidence status, modes, legacy input, safe JSON embedding explicit placement conflicts, English evidence labels and translation parity. |
| Geometry | Routes against unrelated cards; labels against cards and other labels; full conditions retained. Includes 8-stage / 5-lane and long 12-stage fixtures. |
| Browser behavior | Chrome 152 on macOS, 1366×900 and 1920×1080. 42 scenario/view/size combinations across six public examples (both bicycle translations, routing, 8/12 stages and current/target comparison). Geometry, zoom, fit, keyboard details and JSON export checks passed. |
| SVG export | 21 downloads saved and reopened in Chrome. Complete view bounds, mode, legend and text checked after zoom and scroll. |
| Visual inspection | Agent inspection of all three bicycle views in both languages, at laptop/desktop sizes and as six complete README previews. Representative regression screenshots cover long text and branches. Not human acceptance of every state. |
| Rebuild | Six public source bundles reproduced their HTML byte-for-byte; extracted packages render and rebuild both language demos. A customized template is covered by a Node test. |

Private project material and raw local reports are not part of this public repository. The public fixtures, renderer tests and optional browser-check script are available for reproduction. Packaging/integrity checks and CI are included; [the Actions page](https://github.com/shelasmax/cx-impact/actions/workflows/checks.yml) is the source of truth for actual hosted results.

Generated `.checks.json` files check structure and geometry; they do not certify visual quality or a completed download. Rebuilding a map does not carry forward human acceptance. Browser inspection should be repeated after material layout changes.

## Limits

- No new comparative model experiment or human acceptance study was performed for this release.
- Claude Code, other browsers, other operating systems and mobile layouts were not part of local visual validation.
- CI validates the checks it runs; it does not run customer research or claim universal browser compatibility.
- The in-app browser's `blob:` policy was not bypassed. Downloaded SVGs were checked through the rendered DOM; visual inspection used the HTML viewer.
- Dense maps may use numbered full conditions below the process. Fit-to-width is an overview, not a guarantee of readable text at every density.
- Source support and actual customer behavior still require judgement. The skill has not been shown to outperform a short prompt.
