# Contributing to CX Impact

Help make maps easier to read, inspect and discuss. English and Russian contributions are welcome.

## Useful contributions

- A small fictional JSON fixture reproducing a layout or export issue.
- Clearer boundaries between requirements, observations and assumptions.
- Keyboard accessibility, UI localization or documentation improvements.
- Feedback about which part of a map changed a real product decision, with permission to share the material.

For a new subsystem or a change to the data model, open an issue first. Keep pull requests focused and preserve existing map compatibility. The current renderer uses built-in Node APIs; avoid introducing runtime packages without a clear reason.

## Local development

Use Node.js 18+ and Python 3.10+. From the repository root:

```sh
node --test tests/*.test.mjs
python3 -B scripts/check-release.py
python3 -B scripts/build-release.py
```

The release builder creates an archive from an explicit list, checks its contents and smoke-tests the extracted skill. It does not publish anything.

For visual changes, generate a map and inspect the final HTML at 1366×900 and 1920×1080. Check all affected views, text wrapping, routes, complete conditions, 100%/fit, keyboard details and downloaded SVG/JSON. State exactly what you could and could not verify. `tests/browser-map-check.cjs` is optional and uses an already available Playwright module and Chrome; it installs neither.

## Fixtures and reports

Use original synthetic scenarios for public fixtures. Do not upload customer research, proprietary code, private screenshots, credentials or raw agent logs. A small anonymized reproduction is more useful than a large private project dump. Strip identifying material before posting; an `unknown` label does not make sensitive content safe to share.

Tests should catch incorrect behavior, not mirror the implementation. Geometry checks and visual inspection are complementary. Never infer human approval or claim semantic quality from a valid schema.

## Pull requests

Explain the user-visible problem, what changes and the evidence from relevant checks. Include before/after screenshots for material visual changes, labelled as synthetic where appropriate. Note compatibility and layout limits. No contribution agreement is required; contributions are provided under the project's MIT license.

Be respectful and specific when discussing work. Report sensitive security issues through the process in [SECURITY.md](SECURITY.md).
