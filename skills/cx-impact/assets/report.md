# CX Impact report

Use this structure in the user's language. Replace instructional placeholders, omit empty sections, and do not manufacture findings to fill the template.

**Comparison:** [resolved base/head commits or supplied before/after snapshot names]

**Scope:** [inspected files and relevant paths; missing, truncated or conflicting context]

**Outcome:** [Risks identified / No significant risk found in the inspected scope / Insufficient context / No changes]

## [Finding: the behavior to verify]

**Change:** [concrete before → after implementation difference]

**User step and conditions:** [action, step and conditions; identify an inferred mapping]

**Potential risk:** [observable result that may fail, with a supported mechanism]

**Evidence:**

- E1 — [revision or snapshot; side; file:lines; exact fragment]. Supports: [specific claim].
- [Further evidence only where it supports another claim or connection.]

**Knowledge boundary:** [observed in source; declared intent if supplied; inference; remaining unknowns or conflicts]

**Recommended verification:** [preconditions → action or injected failure → observable expected result]

**Decision supported:** [what the engineer should check or clarify before deciding about this change]

## Limitations and unresolved questions

[Missing information and the smallest useful next check. For an empty or negative result, summarize the bounded reasoning here without claiming the whole PR or product is safe.]
