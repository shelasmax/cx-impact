# Changelog

## [Unreleased]

- Redesigned funnel stages as equal-width vertical columns with a shared zero baseline, a conversion/entry/exit summary and aligned per-step conversion and residual metrics. Long titles wrap; zero, unknown and tiny positive values remain distinct. All four designs and light/dark themes retain their palette and typography.
- Funnel percentage labels show up to two decimal places and mark positive rates below 0.01% explicitly. Input version 1, calculations, sources and exact JSON/CSV exports remain compatible.

## [0.6.0] — 2026-09-08

- Opt-in aligned AS IS / TO BE with explicit one-to-many correspondence, original per-side sources and complete stacked SVG.
- Independent quantitative people-cohort funnel: stages, explicit recovery flows, table, separate mature repeat cohort, JSON/CSV/SVG exports and bilingual synthetic examples.
- Four independent visual designs: Classic (default), Graphite, Workshop and Signal; light/dark/system and static reduced-motion behavior.
- Appearance changes stop funnel playback and clear the previous traversal; reopening starts paused at the root.
- Updated isolated browser acceptance, public snapshots and explicit package extraction/rebuild checks. Existing map input remains `version: 1`; no runtime dependency is added.
- English and Russian release descriptions, actual interface screenshots, interactive comparison/funnel demos and an offline showcase with exact source snapshots.

## [0.5.0] — 2026-09-07

- Three bilingual first-use examples for product managers and analysts, including synthetic source material, authored JSON and an existing-map revision.
- Explicit revision guidance for stable IDs, source changes, unresolved conflicts, separate output bundles and preservation of custom snapshots.
- Read-only `node render-map.mjs --check map.json` command with existing structure/geometry diagnostics and failure exit codes; no map schema or viewer change.
- Five-person pilot materials and four synthetic comparison tasks, with a local Codex trial runner. Protocols and mechanical trial outcomes do not establish human acceptance or superiority over a short prompt.
- Expanded allowlisted package checks cover the first-use JSON examples and the extracted check-only command. No new runtime dependency.

## [0.4.0] — 2026-09-06

- Current CX Impact logo embedded unchanged in every SVG export, with reserved footer space and no external image request. HTML remains standalone and JSON exports retain the original data.
- English and Russian README promotional artwork, with refreshed real output previews below it.
- One-command installation through the existing Skills CLI; a single canonical skill package for Codex, Claude Code, OpenCode and DeepSeek Harness.
- Agent-specific installation and upgrade guides in English and Russian, including an explicit verification matrix. Claude Code and DeepSeek Harness compatibility is based on official documentation; OpenCode discovery is checked locally. No model-driven end-to-end test is claimed for these three agents.
- Both existing designs and light/dark/system modes are preserved; Classic remains the default. No runtime dependency or JSON schema change.

## [0.3.1] — 2026-09-06

- Replaced the placeholder masthead symbols in Classic and Graphite with the current CX Impact release logo.
- Embedded the original logo into standalone HTML and portable snapshots, retaining its colors and light backing in both color modes. No additional network request or package asset is required.

## [0.3.0] — 2026-09-06

- Original green Classic design retained as the default; Graphite Field Notes is an optional visual system developed through an OpenDesign design project: editorial hierarchy, paper/graphite surfaces, semantic colors and refined map controls.
- Independent Classic/Graphite design and light/dark/system mode selection with browser-local preferences; standalone SVG retains the selected colors and typography.
- Finite, opt-in stage/process walkthroughs with play, pause, previous, next, reset and explicit branch selection; cycles stop and reduced motion uses static steps.
- Accessible modal details, focus return, complete static exports without temporary viewer styles, and theme/contrast/playback regression checks.
- Refreshed public examples and portable source snapshots. No map schema change or new runtime dependency.

## [0.2.1] — 2026-09-06

### Added

- English and Russian viewer labels through optional `locale`, including evidence status, details, accessibility text and SVG exports. Existing maps keep Russian by default.
- An English translation of the fictional bicycle-service example, preserving scenario IDs, evidence statuses and process connections.
- Three visible, titled screenshots in each README, with matching language, interactive demos and JSON sources.
- Localization and translation-parity checks; browser QA now includes both bicycle examples.

Published as the Latest GitHub release for repository visibility. The product remains experimental; the existing v0.2.0 tag and assets are preserved.

## [0.2.0] — 2026-09-06

First public preview of CX Impact's visual mapping skill.

### Added

- Customer journey, service blueprint and experience-process views in one standalone HTML artifact.
- Explicit current-state and target-state maps; separately requested comparison.
- Typed claims and sources, shared barriers, participant roles and open questions.
- Orthogonal routing around unrelated cards and full branch labels with explicit callout fallback.
- Natural 100% scale, calculated fit-to-width, canvas scrolling and keyboard-accessible details.
- Full active-view SVG export, unchanged JSON export and persistent retry links.
- Local source snapshots with reproducible rebuild commands and protection for custom templates.
- Public documentation in English and Russian, MIT license, brand assets, regression fixtures and release packaging.

### Fixed

- CLI invocation through symlinked installation or temporary directories, caught by the extracted-package smoke test.

### Compatibility

The JSON format remains `version: 1`. Older flat maps retain their data; a missing mode is shown explicitly, and string barriers have unknown evidence status. Older custom templates require deliberate migration to the new insertion markers.

### Known limitations

The viewer UI is Russian. Complex processes can need separate maps; there is one node per stage/lane. Some conditions are moved below dense maps. Claude is untested. Checks do not establish semantic correctness or superiority over a short prompt.

Earlier local experiments are not published releases and do not establish the quality of this version.

[0.2.0]: https://github.com/shelasmax/cx-impact/releases/tag/v0.2.0

[0.2.1]: https://github.com/shelasmax/cx-impact/releases/tag/v0.2.1

[0.3.0]: https://github.com/shelasmax/cx-impact/releases/tag/v0.3.0

[0.3.1]: https://github.com/shelasmax/cx-impact/releases/tag/v0.3.1

[0.4.0]: https://github.com/shelasmax/cx-impact/releases/tag/v0.4.0

[0.5.0]: https://github.com/shelasmax/cx-impact/releases/tag/v0.5.0

[0.6.0]: https://github.com/shelasmax/cx-impact/releases/tag/v0.6.0
