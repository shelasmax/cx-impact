# CX Impact skill

Create customer journey maps, service blueprints and experience-process maps with a coding agent. The primary output is standalone interactive HTML with editable JSON and branded SVG export. Choose Classic (the original green design, default) or Graphite Field Notes, each with light, dark and system modes. Finite path walkthroughs pause at branches and support reduced motion; exported SVG stays complete and static.

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

Paths above are examples. Read [the data format](references/maps.md) before authoring JSON. Resolve resources relative to this installed package.

Preserve an existing installation before upgrading and replace it as a unit. Do not overwrite a map's customized `.source/` directory: its `rebuild.mjs` preserves that map's exact renderer and template. Remove only the installed skill directory to uninstall; generated maps remain separate.

[Project and releases](https://github.com/shelasmax/cx-impact). Experimental preview, licensed under [MIT](LICENSE).
