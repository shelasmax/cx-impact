# Installation and upgrades

[Русская версия](installation.ru.md) · [README](../README.md)

CX Impact uses one portable `SKILL.md` package. Your agent needs file reading/writing and shell access; rendering requires Node.js 18+ and no external Node packages. Model access is configured in your agent. The generated HTML works in a modern browser without a server or network requests.

## Install with npx

From your project directory:

```sh
npx skills add shelasmax/cx-impact --skill cx-impact
```

Choose your agent and installation scope in the installer. For explicit project-local copies:

```sh
npx skills add shelasmax/cx-impact --skill cx-impact --agent codex claude-code opencode --copy --yes
```

You can name just one of those agents. Add `--global` only if you want installation for all your projects. `--copy` keeps a complete copy of the package rather than symlinking it. Start a fresh agent session after installation.

This uses the third-party [Vercel Skills CLI](https://github.com/vercel-labs/skills); no CX Impact npm package is necessary. `npx` needs npm and network access. The installation flow was checked with `skills@1.5.23`; to reproduce that installer version, replace `npx skills` with `npx --yes skills@1.5.23`. The CLI supports `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1` if you want to disable its telemetry. This is separate from the offline map viewer.

## Choose your agent

| Agent | Project skill directory | Invocation | Verification scope |
|---|---|---|---|
| Codex | `.agents/skills/cx-impact/` | `$cx-impact` | Tested local target; install and renderer checks. |
| Claude Code | `.claude/skills/cx-impact/` | `/cx-impact` | Documentation compatibility; installed files checked, no model-driven run. |
| OpenCode | `.agents/skills/cx-impact/` via installer; native `.opencode/skills/cx-impact/` also supported | Ask it to use the `cx-impact` skill | Local discovery checked; no model-driven run. |
| DeepSeek Harness | `.agents/skills/cx-impact/` or `.dsh/skills/cx-impact/` | Ask it to use the `cx-impact` skill | Documentation compatibility; harness runtime not tested. |

### Claude Code

```sh
npx skills add shelasmax/cx-impact --skill cx-impact --agent claude-code --copy --yes
```

The directory contains `SKILL.md`, references, assets and scripts. Claude Code's [official skills documentation](https://code.claude.com/docs/en/skills) supports this structure and `/cx-impact`; a personal installation goes under `~/.claude/skills/`. No `CLAUDE.md`, plugin adapter or special frontmatter is needed. The repository's root `CLAUDE.md` is for contributors, not an installation dependency. Compatibility here is documentation-based, as requested; it is not a claim of a successful model session.

### OpenCode

```sh
npx skills add shelasmax/cx-impact --skill cx-impact --agent opencode --copy --yes
```

OpenCode supports both native and compatible skill directories, including `.agents/skills/` and `.claude/skills/`, according to its [official documentation](https://opencode.ai/docs/skills/). Ask it to load `cx-impact` through its skill tool, then describe the map. Avoid installing different versions under several recognized paths. A local `opencode debug skill --pure` check verified discovery; this does not test generation by the configured model.

### DeepSeek Harness

For a project-local shared skills directory:

```sh
npx skills add shelasmax/cx-impact --skill cx-impact --agent universal --copy --yes
```

The `universal` target writes `.agents/skills/cx-impact/`. It is an installer target, not a DeepSeek-specific adapter. Alternatively, copy the whole extracted package into `.dsh/skills/cx-impact/` at the project root.

The [official filesystem-skills documentation](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/skills) describes both locations and bundled resources. Use a harness configuration with filesystem skills and the model-facing skill tool enabled, plus file and shell tools. No packaged DSH plugin is needed for this route. The harness itself was not installed or run for this release. The project-local instruction avoids assuming that the installer's global directory matches a custom DSH home.

## Manual or version-pinned installation

1. Download [cx-impact-0.6.0.zip](https://github.com/shelasmax/cx-impact/releases/download/v0.6.0/cx-impact-0.6.0.zip).
2. Extract it. The archive contains a single `cx-impact/` directory, including `SKILL.md`, assets, references, renderer and license.
3. Copy that **whole directory** to the location in the table above. Preserve any existing installation first.
4. Start a fresh agent session in that project.

For a repository checkout, use `skills/cx-impact/` from tag `v0.6.0`. The short `npx` command follows the repository; the release archive pins the complete package to a version. Once downloaded, manual installation and rendering need no package registry.

The release includes `SHA256SUMS`. On macOS, compare the archive's hash with its line in that file:

```sh
shasum -a 256 cx-impact-0.6.0.zip
```

If you downloaded all listed assets, `shasum -a 256 -c SHA256SUMS` checks them together. On Linux use `sha256sum`. These detect mismatched downloads; they are not signed provenance.

## First map, in English or Russian

In Claude Code, for example:

```text
/cx-impact Create a target-state CJM and service blueprint for this product's
onboarding. Use the product documents, make assumptions explicit and save
a standalone HTML map with source JSON and a local rebuild bundle.
Use English for both the map content and viewer labels.
```

Use `$cx-impact` for Codex; in OpenCode or DeepSeek Harness, start with “Use the cx-impact skill”. Give a scenario and current/target mode. A description without code is enough for a labelled draft. Ask for participants, handovers, decisions and recovery when requesting a process map.

Ask for English or Russian. The agent sets `locale: "en"` or `"ru"` for viewer labels and authors the content in that language. An omitted locale preserves Russian for older JSON. See the [Russian invocation example](installation.ru.md#первая-карта).

## Updating, rollback and uninstall

Back up your installed `cx-impact/` directory before replacing it, especially if customized. Rerun the same installer command or replace the whole directory with the new release, then start a fresh session. Do not mix old and new runtime files. To roll back, restore the saved directory or a previous release archive.

Generated maps are separate outputs. Keep their JSON and `.source/` snapshots. To preserve a map's exact styling, edit and rebuild its own snapshot:

```sh
node map.source/rebuild.mjs
```

To migrate a map deliberately, render a copy of its JSON with the new renderer and a new output basename. Flat `version: 1` JSON remains supported; absent mode is shown as unspecified. Old custom templates need the insertion markers in the [format guide](../skills/cx-impact/references/maps.md).

Remove only the installed `cx-impact/` directory to uninstall. For installer-managed copies, `npx skills remove cx-impact` offers scope and agent selection. Your generated maps stay where you saved them.

## Troubleshooting

| Symptom | Check |
|---|---|
| Skill not found | Check the directory from the agent table, exact `SKILL.md` spelling and session project. Start a fresh session. |
| Wrong skill version | Check for duplicate local/personal copies and the `VERSION` file in the release archive. |
| Node command unavailable | Install Node.js 18+ separately; the skill does not install it. |
| Agent cannot write or render | Check that its file and shell tools are available for your chosen output directory. |
| HTML appears as source on GitHub | Download it and open the saved file in a browser. |
| Text is tiny | Use **100%** for reading, **Fit** for an overview and scroll inside the canvas. |
| Conditions appear below the process | The route had insufficient label space. Full text remains; hover/focus highlights the route. |
| A browser tool blocks SVG download or `blob:` | Open the saved HTML in a normal local browser. Record the tool limitation; do not bypass its policy. |
| A claim or source is wrong | Edit the JSON and regenerate. Layout checks cannot establish truth. |

[Verification scope](verification.md) distinguishes installer, discovery, renderer and model-level checks.
