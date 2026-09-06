# CX Impact first-use guide

This guide contains three small, fictional exercises for product managers and analysts. All input and script paths below are relative to the installed `cx-impact` skill directory. Run the commands from that directory. The examples write to the separate sibling directory `../cx-impact-first-use-output`; replace it with a directory in your own project if preferred. Keep generated maps and custom snapshots outside the installed skill.

The linked JSON files are authored worked examples, not transcripts of an agent run. Pasting a prompt into Codex starts an actual agent experiment, so its map may differ while still being valid. Compare its evidence labels, unknowns and topology with the authored result instead of expecting identical wording.

You can validate an authored JSON file without writing output:

```sh
node scripts/render-map.mjs --check examples/first-use/target.en.json
```

The command exits `0` only when structure and automated geometry pass. Invalid structure or failed geometry exits `1`. A structurally valid map produces its JSON report on stdout; validation errors are written to stderr. Check mode writes no files. Rendering creates HTML, adjacent JSON, a checks report and a `.source/` rebuild bundle.

## 1. Create a target service from requirements

Input material — **Product brief · 2026-08-18**:

> The workplace service must let an employee request a portable workshop kit through the intranet. The request must include date and team name, be stored, and be made available to a coordinator. The coordinator must check availability, record the decision, and send through the intranet either a pickup confirmation with location or an unavailable notice. For confirmed requests, the pickup desk must prepare and hand over the labelled kit and record collection. After the workshop, the employee must return the kit to the same desk; the desk must accept it and close the loan record. Pickup hours and the path for late returns are not specified.

Copy this prompt into Codex:

```text
$cx-impact
Create a compact target-state map for the fictional service below. Use English UI and authored content, 4 shared stages, and include CJM, service blueprint and process views. Treat intended behavior as requirements, optional improvements as proposals, and unsupported experience, frequency and financial effects as unknown. Include both availability branches. Preserve the two missing rules as explicit questions and stage limitations. Deliver editable JSON and standalone HTML in a local output directory.

Source: Product brief · 2026-08-18
The workplace service must let an employee request a portable workshop kit through the intranet. The request must include date and team name, be stored, and be made available to a coordinator. The coordinator must check availability, record the decision, and send through the intranet either a pickup confirmation with location or an unavailable notice. For confirmed requests, the pickup desk must prepare and hand over the labelled kit and record collection. After the workshop, the employee must return the kit to the same desk; the desk must accept it and close the loan record. Pickup hours and the path for late returns are not specified.
```

Review the [expected authored JSON](../examples/first-use/target.en.json), then render that bundled example:

```sh
mkdir -p ../cx-impact-first-use-output
node scripts/render-map.mjs --check examples/first-use/target.en.json
node scripts/render-map.mjs examples/first-use/target.en.json ../cx-impact-first-use-output/first-use-target-en.html
```

Look for requirement labels across all three views, the available/unavailable branch in Process, and unknown pickup-hours and late-return entries. This fixture describes intent only. It does not show implementation, observed behavior, customer emotion, demand frequency, financial impact or validated benefit from the proposals. A passing check covers structure and automated geometry only.

## 2. Map a current process from a document

Input material — **Operations handbook · 2026-07-10**:

> Employees email the facilities inbox with the requested date and team name. A coordinator copies each request into the loan spreadsheet and checks the cupboard. The coordinator does not send an acknowledgement before the check is complete and emails either a collection message or an unavailable message. The handbook sets no response deadline. For available kits, the employee signs a paper sheet at the reception desk and collects the labelled kit; the spreadsheet row remains the support record. The employee later returns the kit to reception, where the receptionist puts it back into reception stock. The handbook does not describe late returns.

Copy this prompt into Codex:

```text
$cx-impact
Create a compact current-state map from the fictional document below. Use English UI and authored content, 4 shared stages, and include CJM, service blueprint and process views. Treat document statements as declared, not observed. Keep customer experience, actual response time, frequency and financial effects unknown. Mark improvement ideas as proposals and retain the available/unavailable branch and late-return question. Deliver editable JSON and standalone HTML in a local output directory.

Source: Operations handbook · 2026-07-10
Employees email the facilities inbox with the requested date and team name. A coordinator copies each request into the loan spreadsheet and checks the cupboard. The coordinator does not send an acknowledgement before the check is complete and emails either a collection message or an unavailable message. The handbook sets no response deadline. For available kits, the employee signs a paper sheet at the reception desk and collects the labelled kit; the spreadsheet row remains the support record. The employee later returns the kit to reception, where the receptionist puts it back into reception stock. The handbook does not describe late returns.
```

Review the [expected authored JSON](../examples/first-use/current.en.json), then render that bundled example:

```sh
mkdir -p ../cx-impact-first-use-output
node scripts/render-map.mjs --check examples/first-use/current.en.json
node scripts/render-map.mjs examples/first-use/current.en.json ../cx-impact-first-use-output/first-use-current-en.html
```

Look for declared labels rather than observed labels, the email-to-spreadsheet handoff, both availability outcomes, and explicit unknowns for actual waiting and late-return handling. The handbook establishes only what the document says. It does not prove staff follow the process, establish customer experience, measure frequency or financial effects, or validate the proposals. A passing check is not a visual or human review.

## 3. Update a current map with new material

Existing material retained from the previous example — **Operations handbook · 2026-07-10**:

> Employees email the facilities inbox with the requested date and team name. A coordinator copies each request into the loan spreadsheet and checks the cupboard. The coordinator does not send an acknowledgement before the check is complete and emails either a collection message or an unavailable message. The handbook sets no response deadline. For available kits, the employee signs a paper sheet at the reception desk and collects the labelled kit; the spreadsheet row remains the support record. The employee later returns the kit to reception, where the receptionist puts it back into reception stock. The handbook does not describe late returns.

New material — **Customer FAQ · 2026-08-02**:

> Every kit request receives a confirmation email within one business day, even when the availability check is still in progress. The FAQ does not say whether it supersedes the operations handbook.

Copy this prompt into Codex:

```text
$cx-impact
Update examples/first-use/current.en.json with the new fictional FAQ below. Keep the map current-state. Retain every unaffected stable ID, claim and original source; append the new source instead of replacing the handbook. The FAQ conflicts with the handbook about confirmation timing, and neither source has stated authority. Preserve that contradiction as an explicit unknown barrier and question rather than selecting a winner or merging the two paths. Keep all other unsupported experience, frequency and financial effects unknown. Deliver the revision under a new local output basename and write an adjacent changes.md with the baseline, retained and added source IDs, changed/added/removed IDs, unresolved questions and actual verification limits.

New source: Customer FAQ · 2026-08-02
Every kit request receives a confirmation email within one business day, even when the availability check is still in progress. The FAQ does not say whether it supersedes the operations handbook.
```

Review the [expected authored JSON](../examples/first-use/updated.en.json), then render that bundled example:

```sh
mkdir -p ../cx-impact-first-use-output
node scripts/render-map.mjs --check examples/first-use/updated.en.json
node scripts/render-map.mjs examples/first-use/updated.en.json ../cx-impact-first-use-output/first-use-updated-en.html
```

Look for `current` mode, both source records, unchanged process IDs and topology, and the response-timing barrier that cites both documents without choosing an authority. The affected reply cells, nodes and transitions also show unknown confirmation order; the retained graph is a document-based scaffold, not a resolved execution sequence. The example does not determine which document governs, whether either rule is followed, or what customers experience. It adds no frequency, financial effect or measured proposal outcome. Automated validation cannot resolve the semantic conflict or establish human acceptance.

Worked change note for the authored result:

- Baseline: `examples/first-use/current.en.json`; original source `ops-handbook` retained unchanged.
- Added source ID: `customer-faq`.
- Changed entities (their IDs are retained): `response-timing`, `response-authority`; the `review` action/channel/evidence/frontstage claims; `send-collection`, `receive-unavailable`, `available`, `unavailable` and `collection-to-sign`. Each affected claim now exposes the unresolved timing and both sources. Dated map metadata was refreshed.
- Added domain IDs: none. Removed IDs: none. All stage, participant, lane, node and edge IDs are unchanged.
- Unresolved: which document governs confirmation timing, whether either rule is followed, actual customer experience, frequency and financial effects.
- Verification: structure and automated geometry pass; label callouts remain listed in full below the process. Visual appearance, interactions, exports, rebuild and human acceptance are not checked by this authored example.

For your own update, keep the original generated bundle intact. Use a new output basename, or copy a customized snapshot into a new revision directory while keeping its original basename so its relative rebuild paths still resolve.
