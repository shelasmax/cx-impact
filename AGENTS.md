# Developing CX Impact

These are repository-development instructions, not the distributed skill.

## Product scope

Keep one canonical package in `skills/cx-impact/`. It creates CJM, service blueprints and experience-process maps with standalone HTML, editable JSON and SVG exports. Current and target scenarios are explicit. A Git diff is an optional workflow, not a prerequisite.

Use built-in Node APIs; do not add runtime packages, a server, SDK, MCP, database or external rendering service without an explicit design decision. Keep the common skill format. Codex is the tested local target; do not claim or run Claude testing without a separate request.

## Evidence and privacy

Preserve requirements, observations, code observations, hypotheses, proposals and unknowns across views. Do not infer customer emotions, frequency or financial effects from code. Automated checks do not establish semantic quality or human acceptance.

Use original synthetic fixtures for public tests and examples. Local research, prior evaluation runs, private project maps and raw agent logs are not publication inputs. Preserve any such local files; never stage them. The repository uses an explicit publication allowlist in `.gitignore` and a release-integrity check. Do not bypass it with `git add -f`.

Do not copy external templates or code without an explicit reuse decision and license compliance. Design references are not runtime dependencies. Preserve the MIT notice in the package and generated HTML.

## Verification

From the repository root, with Node.js 18+ and Python 3.10+:

```sh
node --test tests/*.test.mjs
python3 -B scripts/check-release.py
python3 -B scripts/build-release.py
```

For a rendering change, regenerate affected public examples and inspect final HTML at 1366×900 and 1920×1080: requested views, wrapping, routes, complete branch conditions, natural 100%/fit, keyboard details and SVG/JSON export. Structural and geometry checks do not replace visual inspection.

Optional `tests/browser-map-check.cjs` uses an already available Playwright module and Chrome. Do not install dependencies solely to run it without discussing that change. State exactly what was not checked.

## Changes and releases

Prefer small, reversible changes, stable IDs and backward-compatible map input. Keep custom map snapshots separate from the installed skill. Do not change product code while mapping it.

Publishing a release, changing visibility, pushing tags or modifying global CLI settings requires an explicit user request. Releases are built from the allowlisted skill files; verify the archive by extracting and rendering it. Do not force-push or move an existing release tag. Keep CI credentials read-only and pin external actions to verified commit SHAs.
