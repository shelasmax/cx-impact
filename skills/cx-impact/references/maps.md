# Visual maps · renderer 0.4.0

Use a bounded scenario with shared stages across views. This is an original simplified authoring format, not full BPMN or a claim of complete XP Mapping conformance. Set `locale: "en"` for English interface labels or `locale: "ru"` for Russian. Omission preserves Russian for existing maps. Author the scenario content in the requested language; the renderer does not translate user content. Locale applies to buttons, accessibility labels, evidence/status labels, details, missing values and exported SVG. A comparison wrapper's locale is inherited unless a nested scenario explicitly overrides it.

## Mode and evidence

`mode` is `current` (AS-IS) or `target` (TO-BE). Supply `scope.scenario`, `scope.start`, `scope.end` and `scope.asOf` (date or an explicit unknown date). Do not infer current behavior when the user asks for a target service. State limitations at their affected stages as well as in the disclaimer.

For a separately requested comparison, use:

```json
{"version":1,"mode":"comparison","current":{"version":1,"mode":"current"},"target":{"version":1,"mode":"target"}}
```

Each nested map must contain all ordinary map fields; the abbreviated objects above only illustrate the wrapper. Mode switching preserves separate content. SVG exports the active scenario/view; JSON exports the complete original wrapper.

Claims use `text`, `status`, optional `detail` and `sourceIds`. Process nodes use `title` instead of `text`.

| Status | Meaning |
|---|---|
| `user_fact` | Fact explicitly supplied in the user's task |
| `requirement` | Product requirement or intention; not an observed outcome |
| `observed` | A supported observation; research context and limits belong in detail |
| `code` | What was found in source code; not observed customer behavior |
| `declared` | Legacy supplied statement; shown as “Требование / намерение” in target mode |
| `hypothesis` | An explanation or expectation requiring validation |
| `proposal` | A proposed improvement or recovery; not an agreed rule |
| `unknown` | Not established; default when status is absent |

The first five statuses require a source. `observed` and `requirement` cannot be supported solely by sources explicitly typed `code`. This mechanical check cannot judge whether a source truly supports a claim; the author must inspect that support. Synthetic research fixtures are fictional, never evidence about real customers.

Source objects have `id`, `label`, `text` (statement/locator, displayed without fetching), and `kind`: `user-input`, `requirement`, `research`, `runtime`, `code` or `other`. Keep code links out of the observation category. A passing test requires a recorded run; the presence of a test only establishes its existence.

## Minimal map shape

The following is a complete small **synthetic target** example. Create fresh content for the user's scenario.

```json
{
  "version": 1,
  "locale": "en",
  "mode": "target",
  "scope": {"scenario":"Service request", "start":"Submit request", "end":"Receive confirmation", "asOf":"2026-09-06"},
  "title": "Service request",
  "subtitle": "Synthetic target example",
  "actor": "Customer",
  "goal": "Agree an appointment",
  "disclaimer": "Fictional brief; not customer research or evidence of an implemented service.",
  "defaultView": "cjm",
  "sources": [{"id":"brief", "kind":"user-input", "label":"Fictional brief", "text":"The proposed service accepts requests and confirms an appointment."}],
  "stages": [
    {"id":"request", "title":"Request service", "action":{"text":"Send a request", "status":"requirement", "sourceIds":["brief"]}, "barrierIds":["availability"]},
    {"id":"confirmation", "title":"Receive confirmation", "action":{"text":"Read the confirmation", "status":"requirement", "sourceIds":["brief"]}}
  ],
  "barriers": [{
    "id":"availability", "text":"Availability is unspecified", "status":"unknown", "stageIds":["request"],
    "consequence":{"text":"The waiting path cannot yet be specified", "status":"unknown"},
    "improvement":{"text":"State how the appointment is confirmed", "status":"proposal"},
    "question":{"text":"Who confirms the slot and when?", "status":"unknown"}
  }],
  "participants": [{"id":"person", "title":"One person", "roles":["Customer", "Representative"]}],
  "questions": [{"id":"waiting", "text":"What happens while confirmation is pending?", "status":"unknown", "stageIds":["request"], "impact":"Changes the waiting and follow-up path."}],
  "process": {
    "lanes":[{"id":"customer", "title":"Customer", "participantId":"person", "role":"Customer role"}],
    "nodes":[
      {"id":"send", "stageId":"request", "laneId":"customer", "title":"Send request", "artifact":"Request", "status":"requirement", "sourceIds":["brief"], "barrierIds":["availability"]},
      {"id":"read", "stageId":"confirmation", "laneId":"customer", "title":"Read confirmation", "status":"requirement", "sourceIds":["brief"]}
    ],
    "edges":[{"from":"send", "to":"read", "kind":"flow", "label":"When confirmation arrives", "status":"requirement", "sourceIds":["brief"]}]
  }
}
```

## Views and references

**CJM:** goals, action plus separately sourced channel, experience, barriers and opportunities. Unknown experience is valid; no numerical emotion curve is required. Prefer 2–7 words per title, preserving meaning.

**Blueprint:** `evidence` (what the customer receives), customer `action`, `frontstage`, `backstage`, `support`. The renderer draws interaction, visibility and internal interaction boundaries. A stage with `barrierIds` exposes those barriers from blueprint details. A blank cell is not evidence of absent work.

**Process:** `lanes` (roles), `nodes` (actions) and directed `edges`. One person can be linked to several lanes through `participantId`. A lane need not correspond to one staff member, account or concurrent action. `artifact` names an output; optional `detail` explains inputs/outputs and conditions.

- Stage cells: `goal`, `action`, `channel`, `experience`, `barrier`, `opportunity`, `evidence`, `frontstage`, `backstage`, `support`. Missing cells display “Не установлено”.
- Shared `barriers[]`: unique `id`, typed claim, optional `stageIds` and typed `consequence`, `improvement`, `question`. Reference with `stage.barrierIds` and `node.barrierIds`. The first barrier is summarized on the grid; details show all linked barriers. The original status/source is reused across views. Keep explicit references aligned with `stageIds`.
- `questions[]`: typed claims, `stageIds`, optional `impact`. Use `hypothesis` for an explicit assumption and `unknown` for a question. The viewer exposes these from the registry and affected stage details.
- Node `kind`: `action`, `decision`, `outcome`; omitted means action. The process legend explains that an empty cell means a step is not described; it does not establish absent work. The whole `process` may be omitted if its participants/sequence are unknown.
- Edge `kind`: solid `flow`, dashed/open-arrow `handoff`, dotted `exception`. Ordinary “not ready” is `flow`. Use `label` or `condition` for the full decision criterion, recipients and timeout; Both are displayed when supplied with different text; a short label cannot hide the full condition. An outgoing decision with neither shows “Условие не задано” and emits a warning. Optional `status`, `detail`, `sourceIds` give a transition its own basis, especially proposed recovery.
- Unplaced long labels are listed in full below the process with a warning. Hover/focus highlights the matching route; click opens endpoints and the condition. Do not delete a condition to suppress a warning.

IDs use lower-case letters, digits, hyphens and underscores, beginning with a letter. Use 2–12 stages, 1–8 lanes and one node per stage/lane. Multiple nodes in one cell and self loops require a separate bounded map for now. Keep ordinary cells within 140 characters, barrier summaries within 180, node titles within 100, artifacts within 120 and branch conditions within 180. Move supporting explanation to `detail` (up to 8000). Long conditions wrap; they are not truncated. Strings are plain text, not HTML.

## Backward compatibility

Existing flat `version: 1` inputs remain supported. Do not auto-upgrade their meaning:

- Missing mode displays “Режим не указан”; no current/target inference.
- Missing source kind displays an unspecified type.
- Legacy string `node.barrier` becomes an annotation with **unknown basis**, not a hypothesis. Typed inline `barrier` objects retain status/source. Shared IDs are recommended for new maps.
- `declared` retains its stored status; target mode uses an explicit intention label. Switching views does not rewrite data.
- Upgrading to explicit mode requires adding scope. Old custom HTML templates require all three insertion markers: `/*__CX_MAP_DATA__*/`, `/*__CX_MAP_CORE__*/`, `/*__CX_MAP_VIEWER__*/`. An old generated HTML is still usable independently; rebuild it with its saved old renderer or deliberately migrate its template.

## Rebuild and local customization

The renderer writes `map.html`, exact adjacent `map.json`, `map.checks.json` and `map.source/` containing exact assets, renderer, manifest hashes and `rebuild.mjs`. Run from the map directory:

```sh
node map.source/rebuild.mjs
```

The snapshot uses no installed skill and produces deterministic HTML. Edit the adjacent JSON for content and the local snapshot for presentation. Rebuild does not rewrite IDs or unrelated source data. A canonical renderer refuses to overwrite a modified bundle or silently drop a recorded custom template; use its rebuild command or a new output name. `--template <path>` explicitly supplies a custom template; `--no-bundle` is intended for already self-contained rebuilds or disposable tests, not ordinary delivery.

## Design, themes and path walkthrough

The bundled viewer preserves **Classic**, the original green atlas design, as the default: Avenir Next/Trebuchet typography, rounded tinted cards and green stage headers. **Graphite Field Notes** is an optional design: neutral paper/graphite surfaces, editorial titles, system sans-serif map text, a restrained terracotta selection accent, and separate evidence colors. Both designs have light and dark palettes using semantic tokens, explicit SVG fills/strokes, complete status labels and the existing line patterns. No webfont or rendering service is fetched. Body text remains 16px at native 100%; fit is an overview.

Two independent groups control appearance: Classic / Graphite and Light / Dark / System. The initial defaults are Classic and System. Choices are saved independently in browser-local storage when available. Denied or invalid storage does not prevent switching. Appearance settings are viewer preferences, not new map fields. SVG exports retain both selected colors and typography.

The optional Path walkthrough is closed and static on load:

- **CJM / blueprint:** read the authored stages in order. This does not infer backstage operation order or a process edge.
- **Process:** start from a root; multiple roots or a rootless cycle require selecting a starting point. Follow only authored directed edges, preserving complete conditions.
- **Fork:** automatically pause and show every outgoing branch as a labelled button. Choose explicitly; no branch is treated as more likely or successful.
- **End / repeated node:** stop automatic playback. Reset or step backward to review another choice; no infinite loop.
- **Pause / previous / next / reset:** available from the panel. Changing view, scenario, design or color mode resets traversal. Opening details and hiding the browser page pause playback.
- **Reduced motion:** Play is disabled; Previous/Next provide static highlights with no animated trace.

Animation is a 520ms viewer-only stroke reveal at a fixed reading cadence. Neither duration nor emphasis represents observed timing, frequency, probabilities or runtime activity. SVG export contains the complete active view in the selected theme and strips interactive styles, transient markers and dimming. JSON remains the exact original map/wrapper.

## Verification and export

`map.checks.json` records structure, geometry, visual, interactions, export and reproducibility separately. `checked` states its scope; `not_checked` and `environment_limited` must explain what is missing. Writing a snapshot is not the same as executing its rebuild.

The shared geometry checks routes against unrelated cards and labels against cards/other labels. The browser adds actual text bounding-box checks in `window.cxMapChecks`. Also inspect the final HTML visually at 1366×900 and 1920×1080, all requested views at natural 100% and fitted overview. Test keyboard scroll, tabs, details, Escape and status/source preservation. Natural 100% means one SVG unit per CSS pixel; fitting a large map is an overview, not a promise of readable body text.

SVG export includes the entire active scenario/view, selected theme, mode, scope and legend independently of zoom, scroll and playback. Interactive CSS and temporary trace/focus state are removed. JSON exports the unchanged complete data. Reopen a downloaded SVG and compare downloaded JSON before claiming a successful round-trip. Persistent retry and standalone SVG links remain in the page. The viewer says a file is formed, not that a download has been saved. Browser tools may block blob URLs; report that specific limitation without a workaround or a claim about the user's browser.

Use a quiet canvas, clear stage columns and role lanes. Status must be text as well as color; connection kinds also differ by line pattern. Decoration, fabricated KPIs or smooth emotion curves do not compensate for missing content. Automated geometry and visual inspection are complementary.

## References

[Archify](https://github.com/tt-a1i/archify) and [OpenDiagram](https://github.com/Itz-Agasta/OpenDiagram) inform visual delivery, not dependencies. [NN/g service blueprint guidance](https://www.nngroup.com/articles/service-blueprints-definition/) describes the layers. [XP Mapping](https://github.com/Byndyusoft/xp-mapping) is background; none of its text, code or templates is bundled here.
