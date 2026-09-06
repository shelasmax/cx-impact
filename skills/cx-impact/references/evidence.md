# Evidence rules

Evaluate the support for each claim, not the presence of a citation.

| Knowledge boundary | Meaning | Appropriate wording |
| --- | --- | --- |
| Observed in source | A specific version contains the cited logic. | “The after snapshot clears state in the error branch.” |
| Declared | Context or a requirement states intended behavior. | “The supplied requirement says the draft should survive retry.” |
| Inferred | A reasoned consequence follows under stated conditions. | “If this caller handles retry, the cleared state may be submitted again.” |
| Unknown | A material link or observation is unavailable. | “The consumer of this timeout option is not supplied.” |
| Conflicting | Sources disagree in a way that affects the conclusion. | “The document describes retry, but the selected code gates it behind a flag whose value is unavailable.” |

These are boundaries for individual claims, not confidence scores for an entire report. “Inferred” is not permission to speculate without support. If a source-to-scenario link remains unsupported, report the gap instead of inventing a finding.

## Attach useful evidence

For each reference give:

- the commit ID or supplied snapshot and diff side;
- the file, verified line range and a short exact fragment (or an unambiguous hunk if original lines are unavailable);
- the particular claim supported by that fragment.

Where a claim crosses files, support both the changed behavior and the connection to the consumer or user step. Do not imply that a function is reached in production simply because it exists. Use source permalinks only when the repository URL and revision are known; otherwise use local references.

A declared requirement is evidence of intent, not implementation. A test definition is evidence of what it asserts, not a successful run. A supplied execution log can support only the version, configuration and scenario it actually exercised; label it as supplied evidence. Do not run a test merely to strengthen the wording of this read-only review.

Absence in the inspected files is not absence throughout the product. Missing telemetry does not imply that the problem never occurs or affects many people. If supplied sources conflict, show both and propose the smallest check that would resolve the conflict.

## Decision check

Before retaining a finding, ask whether the implementation change, scenario link and risk mechanism are each supported. Look for an alternative explanation and make the verification observable. A correct source observation with no established user scenario belongs under limitations, not under a fabricated customer risk.

Real customer expectations, emotional responses, perceived effort, frequency and business metrics require suitable external evidence. A document can declare a promise; it cannot establish what customers actually expect or how they react. Even supplied metrics do not by themselves establish that this change caused an outcome.
