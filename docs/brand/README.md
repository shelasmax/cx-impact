# CX Impact brand and map design system

`logo.png` is the release wordmark on an opaque warm ivory background, suitable for a GitHub README in light or dark mode. Keep its proportions, leave clear space and do not add effects or imply endorsement by a model provider.

- Forest green: `#203a34`
- Teal: `#24695a`
- Warm ivory: `#f5f4ef`
- Name: **CX Impact**

The connected paths represent the relationship between a customer's journey and the work behind a service. The logo is an original AI-assisted raster asset; no vector master or trademark registration is claimed. Project assets are distributed under the repository's MIT license to the extent rights apply.

## README artwork and exported logo

`hero.png` and `hero.ru.png` are English and Russian promotional illustrations for the READMEs. They were generated with the built-in OpenAI image-generation tool, using CX Impact brand assets and original synthetic bicycle examples, with the overlapping browser-window composition of Archify as a visual reference. They are illustrative marketing artwork, not pixel-exact renderer screenshots. Keep that distinction in the adjacent caption; the public example galleries below show actual generated output.

The English headline is “Make the service visible.” with “Customer journeys. Service blueprints. Experience-process maps.” and “One scenario. Three views. Clear evidence.” The Russian headline is “Сделайте сервис понятным.” with “Карта пути клиента. Сервис-блюпринт. Карта процесса и опыта.” and “Один сценарий. Три карты. Явные допущения.” Both include HTML, SVG and JSON.

Generation brief: create a wide CX Impact README banner with the project logo and headline on the left, overlapping light CJM and dark process-map browser windows on the right, a deep forest background and subtle connected paths. Use only synthetic product examples, preserve the CX Impact branding, and use Archify only as a composition reference. The localized variant retains the composition and replaces its copy with the Russian wording above. Final built-in edit: reduce the second Russian headline line so the complete word and period have clear space before the front window; retain the remaining artwork.

SVG exports embed the same original `logo.png` data URI as the HTML masthead. The image has reserved space below the complete legend, preserving its proportions and original ivory backing in all four designs and both color modes. No remote logo fetch is made. Each SVG grows by about 1.2 MB; source JSON remains unchanged. The promotional PNGs are repository documentation assets and are not included in the installed skill.

## Graphite Field Notes · map viewer

The generated maps and funnels offer four designs. **Classic**, the original green atlas, remains the default and uses the current brand above. **Graphite Field Notes** is an optional editorial design developed in an OpenDesign project and adapted to the existing deterministic renderer. OpenDesign is a design workspace, not a runtime dependency.

Classic retains Avenir Next / Trebuchet MS typography, green stage headers, alternating ivory/mint cells, rounded cards and filled green view tabs. Supporting text colors have been adjusted for contrast. Its new dark palette uses forest surfaces and mint accents. Graphite uses Georgia titles, neutral paper/graphite surfaces and a terracotta accent. Graphite group headers have terracotta baseline rules and thin marginal lane rules. Workshop uses sage/periwinkle group materials on warm paper or warm charcoal, restrained italic display typography, and deterministic inset outlines for grouping containers only. Signal uses cool neutral surfaces, square group panels, compact monospaced stage identifiers, inset node ports and stronger primary routes. Quantitative bars, zero values, node heights and Sankey ribbons never receive decorative outlines or dimension changes. Geometry, content, details, playback and exports are shared.

`assets/design-core.js` shares preference validation and static SVG treatment across both viewers. Design (`cx-impact-design`) and theme (`cx-impact-theme`) persist independently; missing, invalid or denied storage falls back to Classic/System. Permanent visual treatments use explicit SVG attributes, so exports keep the complete composition after transient focus and traversal are stripped. No motion autoplays; Signal also has a static identity. Funnel chart headers are compact, with full scope, definitions, source ledger and title retained visibly below the chart in SVG. Native body text uses 16px; Fit remains an overview.

All four designs use the current `logo.png` lockup in the masthead. The original PNG is embedded unchanged in the HTML template, including its ivory backing; the surrounding frame clips only excess background and preserves the complete mark and wordmark. Do not substitute CSS symbols, recolor the logo with theme tokens or fetch it remotely. This adds about 1.2 MB to each standalone HTML file and keeps offline viewing and snapshot rebuilds independent.

Design (Classic / Graphite / Workshop / Signal) and color mode (Light / Dark / System) are independent controls. The default is Classic + System. Both choices persist independently when browser storage is available and affect the entire map and exported SVG, without changing authored JSON. The tables below describe Graphite; the Classic token overrides live alongside it in the same template.

### Design decisions and benchmarks

| Reference | Applied principle | Boundary |
|---|---|---|
| [Archify](https://github.com/tt-a1i/archify) and its [design system](https://github.com/tt-a1i/archify/blob/main/DESIGN.md) | Quiet controls, semantic paths, finite reader-directed motion, portable clean exports | Original typography and map composition; no copied code or template |
| [Smaply journey maps](https://www.smaply.com/tools/journey-maps) | Consistent stage columns, readable claim cards, explicit evidence categories | No invented emotion scores, quotations or metrics |
| [Smaply blueprints](https://www.smaply.com/tools/service-blueprints) and [NN/g](https://www.nngroup.com/articles/service-blueprints-definition/) | Legible customer/frontstage/backstage/support structure with labelled boundaries | Preserve all existing status/source and current/target distinctions |

The aim is an authored map for research and workshops: substantial claim text, clear reading order and secondary supporting controls. The accent marks selection and navigation; it never represents severity or probability. Risk, hypothesis and proposal are separate roles. Idle cards remain flat; elevation is reserved for the details drawer.

### Theme tokens

The canonical token definitions are embedded in the packaged [HTML template](../../skills/cx-impact/assets/map.html), so there is no additional runtime asset. SVG primitives receive explicit resolved colors; exports do not depend on the surrounding page CSS. The palettes use OKLCH; token pairs are checked after browser sRGB conversion. The light accent and hypothesis colors were darkened after contrast measurement.

| Semantic role | Light | Dark |
|---|---|---|
| `bg` | `oklch(0.965 0.006 80)` | `oklch(0.15 0.010 250)` |
| `surface` | `oklch(0.992 0.003 80)` | `oklch(0.19 0.012 250)` |
| `fg` | `oklch(0.22 0.012 250)` | `oklch(0.94 0.006 80)` |
| `muted` | `oklch(0.48 0.016 250)` | `oklch(0.70 0.014 250)` |
| `border` | `oklch(0.83 0.010 80)` | `oklch(0.34 0.014 250)` |
| `accent` | `oklch(0.53 0.175 31)` | `oklch(0.72 0.155 35)` |
| `surface-raised` | `oklch(1 0 0)` | `oklch(0.23 0.013 250)` |
| `surface-subtle` | `oklch(0.945 0.008 80)` | `oklch(0.18 0.011 250)` |
| `surface-inset` | `oklch(0.925 0.008 250)` | `oklch(0.125 0.009 250)` |
| `fg-soft` | `oklch(0.37 0.014 250)` | `oklch(0.82 0.010 80)` |
| `border-strong` | `oklch(0.66 0.014 250)` | `oklch(0.50 0.016 250)` |
| `accent-hover` | `oklch(0.49 0.170 31)` | `oklch(0.78 0.145 35)` |
| `accent-active` | `oklch(0.46 0.170 31)` | `oklch(0.66 0.155 35)` |
| `accent-soft` | `oklch(0.93 0.045 31)` | `oklch(0.28 0.065 35)` |
| `accent-on` | `oklch(0.985 0.004 80)` | `oklch(0.16 0.018 31)` |
| `focus` | `oklch(0.56 0.170 31)` | `oklch(0.76 0.145 35)` |
| `evidence` | `oklch(0.48 0.095 235)` | `oklch(0.73 0.095 235)` |
| `evidence-soft` | `oklch(0.93 0.030 235)` | `oklch(0.25 0.040 235)` |
| `hypothesis` | `oklch(0.51 0.105 72)` | `oklch(0.78 0.110 72)` |
| `hypothesis-soft` | `oklch(0.94 0.040 72)` | `oklch(0.27 0.045 72)` |
| `proposal` | `oklch(0.45 0.095 170)` | `oklch(0.72 0.090 170)` |
| `proposal-soft` | `oklch(0.93 0.030 170)` | `oklch(0.25 0.038 170)` |
| `danger` | `oklch(0.49 0.145 24)` | `oklch(0.73 0.135 24)` |
| `danger-soft` | `oklch(0.94 0.035 24)` | `oklch(0.27 0.055 24)` |
| `unknown` | `oklch(0.50 0.012 250)` | `oklch(0.70 0.012 250)` |
| `unknown-soft` | `oklch(0.93 0.008 250)` | `oklch(0.25 0.012 250)` |
| `edge-flow` | `oklch(0.34 0.018 250)` | `oklch(0.80 0.012 80)` |
| `edge-handoff` | `oklch(0.50 0.065 235)` | `oklch(0.70 0.080 235)` |
| `edge-recovery` | `oklch(0.51 0.125 24)` | `oklch(0.70 0.130 24)` |

Evidence labels remain the original eight categories: observation, stated source, requirement, brief fact, code observation, hypothesis, unknown and proposal. The first five share the evidence color but retain distinct text and sources. Color does not collapse their meanings. Flow is solid, handoff dashed `8 4`, recovery dotted `2 4`; full branch conditions are retained.

### Type and geometry

| Role | Specification |
|---|---|
| Main title / drawer title | Georgia, Times New Roman, serif; regular; responsive 28–42px main / 28px drawer |
| Claim text | Segoe UI, Helvetica Neue, Arial, sans-serif; 16px native; 1.4 line height |
| Stage title / ordinal | 17px semibold sans-serif / 22px Georgia; ordinal uses accent |
| Supporting UI | 11–14px; 10px only for compact evidence metadata and ordinals |
| Layout | 4px base spacing; 4/8/12/16/24/32px spacing vocabulary |
| Stage columns | 194px label rail, 245px column pitch, 12px gutter; geometry shared across views |
| Process nodes | 197px width, height measured from text; one authored node per stage/lane |
| Surfaces | 1px structural border; 4px card/control radii, 8px panels |
| Controls | At least 44px high; wrap on narrow screens; large maps scroll inside canvas |

Natural 100% remains one SVG unit per CSS pixel. Fit-to-width is a complete overview; it does not compress layout or promise readable body text on very large maps. No remote fonts, assets or packages are loaded.

### Components and states

| Component | Anatomy | Interaction and states |
|---|---|---|
| View tab | Ordinal, name, selected underline | Default, hover, keyboard focus, selected; arrow/Home/End navigation |
| Design choice | Classic, Graphite, Workshop, Signal text buttons | Classic default; changes fonts, cards and palette; independent of color mode |
| Theme choice | Light, Dark, System text buttons | Pressed state in text semantics and underline; saves preference when storage is available |
| Evidence cell | Claim, optional channel, explicit evidence footer | Full-card pointer and keyboard activation; status is preserved in details |
| Process node | Action, output, evidence, decision corner mark or outcome surface | Hover/focus outline; active walk border; original graph remains unchanged |
| Connector | Directed path, arrowhead, semantic line pattern, full condition | Pointer/keyboard details and route highlight; no fabricated routes |
| Details drawer | Stage, title, status, detail, sources and related claims | Modal scrim, background inert, focus trap, Escape and focus restoration |
| Walkthrough | Position, reading-order explanation, play/pause, previous/next/reset, branches | Closed and static initially; finite; pauses for a branch; cycle/end stops |
| Export | SVG, original JSON, persistent retry link | Full active view/theme; removes transient styles, highlight and animated trace |

Selected, hover and focus states never change an evidence category. Focus uses a 3px ring in HTML and an explicit outline/stroke in SVG. Disabled controls remain labelled. Source excerpts are plain text; interface copy never implies a hypothesis is validated.

### Motion contract

Use 150ms control feedback and a 520ms finite line reveal for authored process transitions, at a fixed 1800ms reading cadence. Neither is a duration estimate for the service. No autoplay, ambient movement or looping particles. CJM/blueprint walkthrough highlights stages and does not invent connections between internal operations.

Process traversal uses the existing directed graph. Multiple start points require selection; every fork pauses for explicit choice; revisiting a node ends automatic playback. Previous lets the reader revisit a fork and choose another branch. Opening details or hiding the page pauses playback. View/scenario/theme changes and Reset clear transient state. Reduced-motion preference disables timed playback and preserves immediate step controls.

### Accessibility, verification and maintenance

Normal active text pairs target at least 4.5:1 contrast; color is always paired with a label or line pattern. Browser checks cover semantic text/surface pairs in all four designs and both color modes, actual text bounds, keyboard behavior, complete exports, independent stored design/system-mode preferences and reduced-motion steps. This is scoped verification, not a general WCAG certification or human acceptance claim.

After a token or component change, regenerate the public examples and inspect all three views at 1366×900 and 1920×1080, 100% and fit. Reopen SVG after an active walkthrough and compare JSON. Keep private design explorations and raw QA files outside publication inputs.

MVP integration stays in the existing template, core and viewer; no schema change or dependency is required. Production maintenance requires the same geometry/evidence contracts and repeated visual inspection. Rollback restores those presentation files and regenerates affected examples; authored JSON and older self-contained map snapshots remain usable.

## Creation record

Created with the built-in OpenAI image-generation tool, then edited with the same tool to provide an opaque background. No third-party logo was used as a reference.

Initial brief: create a professional horizontal CX Impact lockup with three rounded paths meeting at a meaningful point, forest green and teal, precise negative space, a restrained wordmark, no mascot, chart arrow, tagline, mockup or extra symbols.

Final edit prompt:

> Preserve the exact symbol, the exact wordmark “CX Impact”, its spelling, typography and green/teal colors. Place it on a fully opaque solid warm ivory background #f5f4ef, with no transparency anywhere. Make a clean horizontal GitHub README masthead, logo filling most of the width, comfortable but modest padding, approximately 3:1 aspect ratio. No added text, shadows, gradients, mockup or extra symbols. Preserve sharp logo edges. The opaque background must keep it legible on GitHub in light and dark mode.
