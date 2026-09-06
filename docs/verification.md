# Verification scope

## v0.5.0 · First use, revisions and check-only validation

Version 0.5.0 adds three worked exercises in English and Russian, a documented revision workflow, `--check`, and pilot/evaluation materials. It keeps input version 1 and existing viewer behavior; only the core version metadata advances to 0.5.0. The six previously published HTML snapshots retain their embedded versions.

| Layer | Checked locally |
|---|---|
| Node tests | 39 tests: the existing 23 plus eight check-only CLI tests, five first-use/example preservation tests and three evaluation-runner tests. Check-only coverage includes unchanged file bytes and modification times, malformed input, structural errors, geometry failure, warnings, comparisons and symlinked installation. |
| Revision preservation | The worked update retains source history and stable IDs; tests compare all unaffected content and require both sources on disputed claims. The copied custom-snapshot procedure was also executed locally: the original JSON/HTML remained unchanged, customization survived, and a second rebuild was byte-identical. |
| New-example browser checks | Chrome 152.0.7977.83 on macOS, six first-use JSON examples × three views × 1366×900 and 1920×1080: 36 combinations. Geometry, native scale, fit and keyboard detail opening/closing with focus return passed. No page errors or viewer network requests were observed. |
| Exports | 18 SVG downloads were saved, reopened and checked for text containment within the full view bounds; six JSON downloads deep-equalled their inputs. This was scoped to the new examples in Classic/light. |
| Agent visual inspection | Representative final English/Russian screenshots of all three views at both sizes, including full conditions below the process, desk handoffs and the revised conflict labels. This is agent inspection, not human acceptance of every state. |
| Packaging | Publication allowlist check and the 19-file archive build passed. The extracted check-only command was exercised, both existing language demos and all six new exercises rendered, and source snapshots rebuilt byte-for-byte. All 20 English/Russian quickstart commands were executed from an extracted installation: six result bundles were created outside it and the installed files stayed unchanged. Every newly prepared evaluation skill arm was also compared byte-for-byte with every archive member. |

Browser outputs and raw trial data remain local and outside publication inputs. This pass did not rerun the entire historical theme matrix, test another browser engine or operating system, or assess screen-reader behavior. The viewer is unchanged; the broader historical scope remains documented below.

The [five-person pilot](pilot.md) and [synthetic comparison](evaluation.md) have separate human review procedures. Participant recruitment, usefulness ratings and the 14-day follow-up have not taken place. Mechanical checks do not establish demand or superiority over a short prompt. The product remains an experimental preview.

## v0.4.0 · Branded exports and agent installation

All 23 Node tests passed locally. Both browser suites passed in Chrome 152 on macOS: 42 baseline scenario/view/size combinations and 168 design/color-mode combinations at 1366×900 and 1920×1080. The checks cover native/fit scale, keyboard details, routes, appearance persistence, playback and reduced motion. 21 baseline and 84 themed SVG downloads were reopened; their embedded PNG bytes match the current `docs/brand/logo.png`. Baseline exports also check logo containment in the full SVG bounds. Export during an active path remains static, and downloaded JSON deep-equals the source. No viewer network requests were observed.

All six public HTML examples and their snapshots were regenerated. Agent visual inspection covered the six complete English/Russian README previews and representative laptop/desktop Classic/Graphite screens; the footer logo fits below the legend. Promotional hero images were inspected separately and are explicitly labelled illustrations. They are not evidence of renderer output. Other browser engines and assistive technologies were not tested.

| Installation layer | Result and limit |
|---|---|
| Skills CLI | `skills@1.5.23` installed the published repository in an isolated temporary project. The upcoming package was also installed from its local source for `codex claude-code opencode` and separately `universal`, using project-local copies and disabled telemetry. No global installation was changed. |
| Resource integrity and rendering | All ten canonical package files matched in the installed `.agents/skills/`, `.claude/skills/` and Universal copies. Each copy rendered the synthetic English example and rebuilt identical HTML. This checks the installed renderer, not generation by a model. |
| OpenCode | OpenCode 1.15.12, `debug skill --pure`, discovered exactly one `cx-impact` entry from the isolated project’s `.agents/skills/cx-impact/SKILL.md`. Compatible `.claude/skills/` discovery was also observed in the earlier combined install. No model-driven end-to-end run. |
| Claude Code | Package format, resource layout and invocation documented against official skills documentation. The installed files and renderer were checked without a Claude model session. Documentation-only compatibility, not a model test. |
| DeepSeek Harness | Filesystem discovery roots and bundled resources documented against the official skills subsystem. Universal installation produced the documented project directory; DSH itself was not installed or run. |

The publication-integrity and release build scripts check the allowlisted archive, extracted-package rendering in both languages and byte-identical snapshot rebuilds. The hosted [Actions results](https://github.com/shelasmax/cx-impact/actions/workflows/checks.yml) record CI outcomes. [English installation guide](installation.md) and [Russian installation guide](installation.ru.md) link the official provider documentation and state the same support boundaries.

## v0.3.1 · Current masthead logo

The current release logo replaces placeholder CSS marks in both designs. The embedded PNG was compared byte-for-byte with `docs/brand/logo.png`. Chrome checks covered both languages, Classic/Graphite × light/dark at 1366×900 and 1920×1080 (16 combinations), image decoding, no network requests and a 390px overflow check. Masthead screenshots were visually inspected in light/dark and at narrow width.

The standard 23 Node tests, publication-integrity check and extracted-package render/rebuild check were rerun. The existing browser map check verifies all six public examples, keyboard details, natural/fit geometry, SVG/JSON exports and refreshed README previews. The map body, playback and color tokens are unchanged from v0.3.0; its broader coverage below remains the baseline. No additional browser engine or assistive-technology testing was performed.

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

- The published v0.4.0 release did not include a comparative model experiment or human acceptance study. Development trial outcomes remain local; the public evaluation protocol does not contain human results or a superiority claim.
- Claude Code, other browsers, other operating systems and mobile layouts were not part of local visual validation.
- CI validates the checks it runs; it does not run customer research or claim universal browser compatibility.
- The in-app browser's `blob:` policy was not bypassed. Downloaded SVGs were checked through the rendered DOM; visual inspection used the HTML viewer.
- Dense maps may use numbered full conditions below the process. Fit-to-width is an overview, not a guarantee of readable text at every density.
- Source support and actual customer behavior still require judgement. The skill has not been shown to outperform a short prompt.
