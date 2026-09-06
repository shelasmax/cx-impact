# Changelog

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
