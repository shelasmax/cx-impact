# CX Impact skill

Create customer journey maps, service blueprints, experience-process maps, optional AS IS / TO BE comparisons and quantitative sales funnels with a coding agent. The primary output is standalone interactive HTML with editable JSON and branded SVG export. Choose Classic (the original green design, default), Graphite Field Notes, Workshop or Signal, each with light, dark and system modes. Finite path walkthroughs pause at branches and support reduced motion; exported SVG stays complete and static.

## Install

From your project, select your agent with the [Skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add shelasmax/cx-impact --skill cx-impact
```

Or copy this **entire** directory to the project location:

| Agent | Directory | Invocation |
|---|---|---|
| Codex | `.agents/skills/cx-impact/` | `$cx-impact` |
| Claude Code | `.claude/skills/cx-impact/` | `/cx-impact` |
| OpenCode | `.agents/skills/cx-impact/` or `.opencode/skills/cx-impact/` | Ask to use the `cx-impact` skill |
| DeepSeek Harness | `.agents/skills/cx-impact/` or `.dsh/skills/cx-impact/` | Ask to use the `cx-impact` skill |

Start a fresh session after installation. Node.js 18+, file and shell access are required for rendering; no external Node packages are needed. Configure model access in your agent. Codex is the tested local target. OpenCode discovery is checked. Claude Code and DeepSeek Harness compatibility follows official documentation; no model-driven end-to-end tests are claimed for these three agents.

[Full installation guide](https://github.com/shelasmax/cx-impact/blob/main/docs/installation.md) · [Установка на русском](https://github.com/shelasmax/cx-impact/blob/main/docs/installation.ru.md)

## Create a map

Start with three complete worked examples: [English](references/quickstart.md) · [Русский](references/quickstart.ru.md). They include fictional inputs, ready-to-copy requests, editable results and limits: a target service, a documented current process, and an update from new material.

```text
$cx-impact Create a target-state customer journey map and service blueprint
from this project's product documents. Keep requirements, hypotheses and
unknowns distinct. Save an interactive HTML map and its rebuildable sources.
```

Use `/cx-impact` in Claude Code or ask OpenCode/DSH to load the skill. Describe the scenario and requested current/target mode. English and Russian are supported: set `locale` to `"en"` or `"ru"` for viewer labels and author content in the requested language.

Пример для Claude Code:

```text
/cx-impact Создай целевую CJM и сервис-блюпринт по документам проекта.
Разделяй требования, гипотезы и неизвестные. Сохрани интерактивный HTML
и комплект для пересборки. Содержание карты и интерфейс — на русском.
```

For authored data, from this skill directory:

```sh
node scripts/render-map.mjs path/to/map.json path/to/map.html
```

Check existing JSON without creating or replacing files:

```sh
node scripts/render-map.mjs --check path/to/map.json
```

The report on stdout covers structure and geometry. Warnings permit a draft (exit 0); invalid input or geometry failure exits 1. This is not a semantic or browser-quality assessment.

To update a map, give the agent its previous JSON and new source material. Ask it to retain unchanged IDs and claims, show unresolved source conflicts and deliver a separate revision bundle with a change note. The [revision guidance](references/maps.md#revising-a-map) also covers preserving customized snapshots.

Paths above are examples. Read [the data format](references/maps.md) before authoring JSON. Resolve resources relative to this installed package.

Preserve an existing installation before upgrading and replace it as a unit. Do not overwrite a map's customized `.source/` directory: its `rebuild.mjs` preserves that map's exact renderer and template. Remove only the installed skill directory to uninstall; generated maps remain separate.

[Project and releases](https://github.com/shelasmax/cx-impact). Experimental preview, licensed under [MIT](LICENSE).

## Paired scenarios and quantitative funnels

Enable Compare AS IS / TO BE for an explicit comparison document. Supply correspondence; identical IDs are not automatic matches. The paired SVG stacks both scenarios and retains their source attribution. Comparison can be turned off for ordinary reading.

A separate `kind: "sales-funnel"` document provides Stages, Flows and Table. Use supplied unique-people counts in a closed cohort; explicit bounded DAG flows with unrolled retries; and a separate mature repeat-purchase denominator. Unknown is not zero, residual is not established loss, and no financial outcome is inferred. Read [English funnel format](references/funnels.md) or [русский формат](references/funnels.ru.md).

From this package directory:

```sh
node scripts/render-map.mjs examples/scenarios/online-sales.en.json output/comparison.html
node scripts/render-map.mjs examples/funnels/online-sales.en.json output/funnel.html
node scripts/render-map.mjs --check examples/funnels/online-sales.ru.json
```

Mechanical checks are not semantic or human acceptance.
