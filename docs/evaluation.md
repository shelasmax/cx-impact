# Synthetic Codex evaluation

[Русская версия](evaluation.ru.md)

This protocol compares the complete CX Impact release package with a short prompt on four original synthetic mapping tasks. It is an exploratory, paired evaluation of artifacts from independent fresh Codex sessions. It is not a customer study, a performance benchmark for every model or environment, or evidence that one arm is generally superior.

The separation of repeat trials, mechanical outcome checks, and human judgement follows the evaluation concepts described in [Anthropic's guide to agent evaluations](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents). This protocol assigns semantic quality to people; it does not use a model as an acceptance grader.

The four trial inputs are public synthetic material. Keep prepared workspaces, prompts, model transcripts, stderr, generated artifacts, ratings, reviewer notes, and any copied review set local and outside the repository. They are raw evaluation data, not publication inputs. Do not publish an aggregate superiority claim before a person has reviewed the artifacts.

## Design

The evaluation has two arms, four tasks, and two repeats: **2 × 4 × 2 = 16 independent sessions**.

- **Full-package arm (`skill`):** the fresh workspace contains the full release-allowlisted CX Impact package under `skill/`. The agent is told to read `skill/SKILL.md` and use its bundled resources.
- **Short-prompt arm (`short`):** the fresh workspace contains no CX Impact package, format manual, or worked example. The agent receives only the common instruction and case request.

Both arms receive identical `input.md` and, for the update task, identical `base-map.json`. The common instruction requires English output, preserves the inputs, distinguishes supported statements, proposals, and unknowns, and asks for `output/map.html` plus `output/map.json`; the update also requires `output/changes.md`.

Use exactly the same explicit model, reasoning effort, Codex CLI version, sandbox, and tool configuration in both arms. Each session has a new work directory and no conversational history. For repeat 1, the runner orders `short` then `skill`; for repeat 2, it orders `skill` then `short`. This alternates arm order within every case. A failure or timeout is a run outcome and must never be silently replaced by another attempt.

This comparison is the full package versus the short prompt, including instructions, references, assets, renderer, and worked guidance. It is not a comparison of two prompt paragraphs.

## Tasks

The trial manifest is [cases.json](../tests/evaluation/cases.json). Inputs contain source text and user requests only; they do not contain the rubric or expected answers.

| Case | Explicit mode | Differentiating challenge |
|---|---|---|
| `incomplete` | TARGET / TO-BE | A design-review portal concept describes a four-stage intended flow but omits deadlines and revision handling. |
| `current` | CURRENT / AS-IS | Two consistent documents describe a visitor-badge main path, a restricted-date branch, an identity-mismatch recovery, and return. |
| `conflicting` | CURRENT / AS-IS | Two hall-booking documents disagree about when confirmation occurs and when the deposit is paid; neither has established authority. |
| `update` | CURRENT / AS-IS revision | A complete existing map must retain stable IDs and sources while adding request/checklist material and exposing a new conflict about key return. |

All scenarios are fictional and unrelated to the bicycle and first-use workshop examples. They contain no medical, legal, or financial business guidance.

## Prepare and run

Requirements are Node.js 18+, Python 3.10+, the current installed Codex CLI, and a working Codex authentication. The runner does not configure or change authentication.

Choose a new local directory outside the repository. Replace the literal `MODEL` placeholder with one model that is actually available in the current Codex installation, then prepare all 16 workspaces:

```sh
python3 -B scripts/evaluate-codex.py --prepare /tmp/cx-impact-evaluation --model MODEL --effort xhigh
```

Preparation refuses an existing directory. Use a new directory name for a distinct evaluation; do not delete or overwrite an earlier run to reuse its name. Inspect `manifest.json` before starting. Confirm that it records 16 unique trials, eight per arm; the selected model and effort; package hashes; case, arm, and repeat; and the input and prompt hashes.

Run the prepared sessions sequentially with a 600-second limit per session:

```sh
python3 -B scripts/evaluate-codex.py --run /tmp/cx-impact-evaluation --timeout 600
```

The run is resumable for attempts that already have `result.json`: rerunning retains their recorded status and proceeds to unstarted attempts. A single prepared trial may be selected with `--trial TRIAL-ID`. If a process was externally interrupted after `started.json` was written but before `result.json` was created, preserve that evidence; do not remove the marker and silently retry. Record the attempt as interrupted, run other unstarted IDs individually if appropriate, and use a newly prepared evaluation directory for any separately reported retry.

The runner records completed, failed, and timeout statuses; exit code; elapsed seconds; Codex version and command; available token usage; basic artifact presence; input integrity; and `humanReview: not_reviewed`. A timeout or nonzero model exit makes the overall runner exit nonzero even though its result remains part of the 16-attempt denominator.

The development runner uses the currently installed Codex executable with explicit flags, ephemeral execution, ignored user configuration, disabled plugins/hooks/apps, the experimental `skip_host_skill_discovery` flag, and a workspace-write sandbox. These controls improve matching but are not a hermetic isolation guarantee. The installed CLI can still advertise host skills despite that flag; check startup diagnostics instead of assuming discovery was suppressed. Both arms still share the host command environment, and globally discoverable behavior or readable paths may differ by installation. Audit transcripts for contamination and record any environment limitation. Do not write global configuration as part of the evaluation.

The prompt tells agents not to use the network or other projects. Do not promise browser tools or treat the absence of a browser as a failure by itself. Standalone HTML can be inspected later in an available local browser. Record which browser and inspection steps were actually used.

## Run handling and denominators

Keep all 16 manifest entries in the run table. For each arm, report outcomes as counts over **8 prepared sessions**:

| Arm | Completed / 8 | Failed / 8 | Timeout / 8 | Interrupted / 8 | HTML present / 8 | Parseable JSON / 8 | Update note present / 2 update runs |
|---|---|---|---|---|---|---|---|
| Full package |  |  |  |  |  |  |  |
| Short prompt |  |  |  |  |  |  |  |

Artifact presence and JSON parsing are mechanical observations, not quality scores. Preserve stderr and partial outputs for failed and timed-out sessions. Do not rerun an inconvenient result under the same trial ID. If a protocol deviation occurs, keep the original outcome and describe the additional attempt separately.

For human review, show `reviewed artifacts / artifacts available` and `reviewed attempts / 8 prepared` for each arm. A blank score means unreviewed. A score of zero means a reviewer inspected the artifact and assigned the zero anchor. Never convert a missing artifact, missing rating, or nonresponse to a human score without the predeclared handling below.

Before results are visible, decide how missing artifacts enter any exploratory arm summary. The recommended rule is to show run outcomes separately and compute quality distributions only for human-reviewed artifacts, with their denominator. Also show a conservative completion endpoint over all eight prepared attempts per arm. Do not blend a failure into a zero quality score because those answers mean different things.

## Human review procedure

Have an evaluator copy completed artifacts into a private review set with random labels that do not contain case, arm, repeat, directory names, prompt text, or CLI transcript. Review the HTML, JSON, and update note together. Randomize presentation order. Hide arm assignment where feasible until ratings and correction measurements are locked.

Perfect blinding is unlikely: the full package can produce a recognizable viewer and richer file bundle. Ask the evaluator to record whether they guessed an arm and why. Report renderer-style recognition as a limitation; do not claim the review was blind if it was not.

The evaluator must read the relevant source input before assigning source fidelity, then inspect each view, meaningful details, branch conditions, source/status links, and output files. Automated structure, geometry, or parse checks may inform the review but cannot determine semantic fidelity, usefulness, or acceptance. Human ratings stay human.

Use the evaluator-only case checklists below. **Never copy these checklists into `input.md`, `prompt.txt`, or a trial workspace.** They describe review expectations and would leak answers to the agent.

### Evaluator-only checklist: `incomplete`

- The scenario remains TARGET / TO-BE and covers submission, capacity decision, posted feedback, and requester acknowledgement across all three views.
- Supplied intended behavior is labelled as requirement/intention rather than observed current behavior.
- The available/unavailable decision is visible with meaningful full conditions and endpoints.
- Missing response deadline, what happens after an unavailable date, feedback timing, and revision/resubmission handling are not invented as facts. Material gaps are localized as unknowns or questions where they affect the path.
- No customer emotion, frequency, staffing system, notification channel beyond the supplied portal behavior, or business effect is presented as established.

### Evaluator-only checklist: `current`

- The map remains CURRENT / AS-IS, retains both dated documents, and labels their contents as documented statements rather than observations.
- The request deadline and fields, visitor-log entry, restricted-date decision, approval/decline messages, north-desk identity check, badge issue, and badge return remain traceable to the supplied sources.
- The restricted-date branch and identity-mismatch recovery are both visible; the mismatch path calls the host and does not issue a badge.
- The approved email template is used only for the claims it supports. No volume, emotion, wait time, system implementation, or successful real-world execution is invented.

### Evaluator-only checklist: `conflicting`

- Both dated sources remain separate and source-linked; the newer FAQ is not treated as authoritative merely because it is newer.
- The disagreement about immediate confirmation/deposit at collection versus confirmation only after deposit is received is visible at the affected stage, claims, and process conditions.
- The map retains the undisputed request, availability check, unavailable branch, key collection, and key return statements.
- An open question identifies the authority or decision needed to resolve the conflict. The artifact does not merge the two sequences into an unsupported single current path.

### Evaluator-only checklist: `update`

- The map stays CURRENT / AS-IS. Unchanged entity IDs and the exact `studio-desk-guide` source record are preserved; new material uses a distinct new source record.
- Intended recording duration is added to the request where relevant, and the equipment checklist is added before key handover, with the new source attached.
- The conflict between return to reception by 17:00 and return only through the security drop box is not resolved by date alone. Both sources remain visible, the affected claims/nodes/edges are updated consistently, and an open question records what authority is needed.
- Unaffected stages, participants, branches, IDs, and source links are not silently rewritten or removed.
- `changes.md` names the baseline and new source, changed and added IDs with reasons, any removals or explicitly states none, unresolved conflict, and checks actually performed. It does not claim visual, interaction, export, or reproducibility checks that were not run.

## Rating anchors

Assign one integer anchor per quality dimension after inspecting the artifact. Add a short evidence note for every 0 or 1. These anchors support consistent human judgement; they are not automatically calculated.

### Source fidelity

- **2:** Material factual claims are traceable to the supplied sources, source types and modes are represented honestly, and supplied content is neither silently contradicted nor discarded.
- **1:** The main source meaning is preserved, but one or more minor claims are overbroad, weakly sourced, or inconsistently labelled without changing a material decision.
- **0:** A hard unsupported factual claim appears, a material source statement is contradicted or discarded, a document is presented as observed behavior, or the update rewrites source history. **Any hard unsupported factual claim forces source fidelity to 0.**

### Unknowns and conflicts

- **2:** Material missing information and conflicts are explicit, linked to affected stages or entities, and paired with useful open questions or impact notes; no authority is invented.
- **1:** Major uncertainty is acknowledged, but localization, competing-source links, or decision impact is incomplete.
- **0:** A material gap is presented as known, an unresolved conflict is silently resolved, or critical uncertainty is hidden from the relevant path.

### Conditions and recovery

- **2:** Decisions, complete branch conditions, recipients/endpoints, handoffs, and supplied recovery paths agree across the process and other views.
- **1:** The main path is followable, but a condition, branch endpoint, handoff, or recovery is vague or inconsistently represented.
- **0:** A material branch or recovery is missing or wrong, conditions reverse supplied meaning, or the artifact shows only an assumed success path.

### Readability and decision usefulness

- **2:** A reviewer can navigate all three requested views, understand the bounded scenario and evidence distinctions, and use the artifact to discuss the named decision with at most minor edits.
- **1:** The content is substantially understandable, but density, labels, cross-view inconsistency, missing detail, or file behavior creates notable friction before decision use.
- **0:** A requested view is unusable or absent, the scenario cannot be followed, or the artifact would mislead the decision without major reconstruction.

Record manual correction and time separately from these four quality ratings:

- **Manual corrections:** list each factual/source/status, topology/condition, readability, rendering, and file-output correction required to reach an acceptable artifact. Record the count and active correction minutes. Write `0` only after a human confirms that no correction was required; leave unreviewed values blank.
- **Run time:** use the runner's `elapsedSeconds` for the Codex session. It includes CLI startup and tool work and is not a pure generation benchmark. Do not replace a timeout with its configured ceiling without labelling it censored.
- **Review and correction time:** time human review and active correction separately. Pauses and unrelated work do not count; record missing measurements as blank.

### Blank review form

| Field | Record |
|---|---|
| Random artifact ID |  |
| Evaluator ID |  |
| Review date |  |
| HTML / JSON / changes note available |  |
| Source fidelity (0/1/2) |  |
| Source-fidelity evidence |  |
| Unknowns and conflicts (0/1/2) |  |
| Unknowns evidence |  |
| Conditions and recovery (0/1/2) |  |
| Conditions evidence |  |
| Readability and decision usefulness (0/1/2) |  |
| Readability/usefulness evidence |  |
| Hard unsupported factual claim found |  |
| Required corrections, itemized |  |
| Correction count |  |
| Active correction minutes |  |
| Review minutes |  |
| Runner elapsed seconds |  |
| Browser / visual inspection actually performed |  |
| Arm guessed before unblinding and reason |  |
| Environment or blinding limits |  |

## Analysis and reporting

Unblind only after ratings, notes, and correction/time records are locked. Present the 16 trial outcomes first, then the human-reviewed quality distributions and matched case/repeat observations. Keep each score's denominator visible. With two repeats per case, report individual values or medians and ranges rather than precision-heavy inferential statistics.

Describe task-specific patterns as hypotheses for follow-up. Do not claim that the package is superior because it produced more files, passed structural validation, or used a recognizable renderer. An aggregate superiority statement requires completed human review under this protocol and should still be labelled exploratory because the inputs are synthetic, the sample is small, sessions share one host environment, and review may reveal the arm.
