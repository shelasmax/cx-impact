# Installation and upgrades

## Codex: install per project

1. Download `cx-impact-0.2.0.zip` from the [release](https://github.com/shelasmax/cx-impact/releases/tag/v0.2.0).
2. Extract it. The archive contains a single `cx-impact/` directory, including `SKILL.md`, assets, references, renderer and license.
3. Copy that directory into your project's `.agents/skills/` directory. The resulting file should be `.agents/skills/cx-impact/SKILL.md`.
4. Start a new Codex session in the project and invoke `$cx-impact`.

No global configuration change, package installation or additional service is required. The agent's existing model provider is still used. Rendering needs Node.js 18+; viewing generated HTML needs a modern browser. This release was developed with Node 22 and Chrome on macOS. See [verification](verification.md) for the distinction between local checks and CI.

If you prefer a repository checkout, copy `skills/cx-impact/` from the `v0.2.0` tag into the same destination. Copy the **whole directory**, not only `SKILL.md`.

## Verify the download

The release includes `SHA256SUMS`. Keep it next to the downloaded assets and compare the hash of the archive you downloaded. For example, on macOS:

```sh
shasum -a 256 cx-impact-0.2.0.zip
```

Compare the output with the archive's line in `SHA256SUMS`. If you downloaded all listed assets, `shasum -a 256 -c SHA256SUMS` checks them together. On Linux, `sha256sum` provides the same operation. These checks detect corrupted or mismatched downloads; they are not a signed provenance claim.

## First invocation

```text
$cx-impact Create a target-state CJM and service blueprint for this product's
onboarding. Use the product documents, make assumptions explicit and save
a standalone HTML map with source JSON and a local rebuild bundle.
```

Give a scenario and a current/target mode when known. A description without code is sufficient for a labelled draft. To request a process map, ask for participants, handovers, decisions and recovery. The UI labels are currently Russian, even if authored content is in another language.

## Updating an existing installation

Keep a backup of the existing `cx-impact` directory, especially if you customized it. Replace the installed directory as a unit with the extracted release directory, then start a fresh agent session. Do not copy old runtime files back over the new version.

Generated maps are independent outputs. Keep their JSON and `.source/` snapshots. To preserve a particular map's styling, edit and rebuild its own snapshot:

```sh
node map.source/rebuild.mjs
```

To deliberately migrate an old map, render a copy of its JSON with the new installed renderer and a new output basename. Flat `version: 1` JSON remains supported; absent mode is displayed as unspecified. Old custom templates need the three insertion markers described in the [format guide](../skills/cx-impact/references/maps.md).

## Troubleshooting

| Symptom | Check |
|---|---|
| Skill not found | Confirm the exact project directory and `.agents/skills/cx-impact/SKILL.md`, then start a new session. |
| Node command unavailable | Rendering needs Node.js. The skill does not install it automatically. |
| HTML appears as source on GitHub | Download and save the file, then open it in your browser. |
| Text is tiny | Use **100%** to read, **Fit** for an overview and scroll inside the map canvas. |
| Conditions are listed below the process | Space was insufficient near the routes. Full text is retained; hover/focus highlights the associated route. |
| Browser tool blocks SVG download or `blob:` | Use a normal local browser for the saved HTML. Do not bypass a tool's policy; record that environment limitation separately. |
| A source or requirement is wrong | Edit the JSON claim and source, then regenerate. Layout checks cannot establish that a claim is true. |

## Uninstall and portability

Remove only the installed `.agents/skills/cx-impact/` directory. Generated maps remain where you saved them. Restore your previous directory to roll back an upgrade.

The common `SKILL.md` format is retained. Claude Code's corresponding directory is `.claude/skills/cx-impact/`, with `/cx-impact` as invocation; **Claude compatibility has not been tested** for this release.
