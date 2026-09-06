# CX Impact skill

Create customer journey maps, service blueprints and experience-process maps with a coding agent. The primary output is a standalone interactive HTML map with editable JSON and SVG export. Choose the original green Classic design (default) or Graphite Field Notes. Each has independent light, dark and system color modes. Optional finite path walkthroughs explain stages or authored process transitions, pause at branches and support reduced-motion steps; exported SVG stays complete and static.

## Install in Codex

Copy this entire `cx-impact` directory into your project's `.agents/skills/` directory, then start a new Codex session in that project. Preserve an existing installation before upgrading.

Invoke `$cx-impact` and describe the scenario, the requested current/target mode and the available sources. Node.js 18+ is required to render HTML; no external Node packages are needed. The viewer supports English and Russian labels; set `locale` to `"en"` or `"ru"`. Map content is authored separately in the requested language.

```text
$cx-impact Create a target-state customer journey map and service blueprint
from this project's product documents. Keep requirements, hypotheses and
unknowns distinct. Save an interactive HTML map and its rebuildable sources.
```

For already authored data:

```sh
node scripts/render-map.mjs path/to/map.json path/to/map.html
```

Run that command from this skill directory; input and output paths are examples. Read [the data format](references/maps.md) before creating JSON.

Do not overwrite a map's customized `.source/` directory when upgrading the skill. Its `rebuild.mjs` preserves that map's exact renderer and template. Removing this installed directory uninstalls the skill; your generated maps are separate files.

Project and releases: https://github.com/shelasmax/cx-impact

Experimental preview, licensed under [MIT](LICENSE). Claude Code portability is not tested.
