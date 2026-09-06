# Five-person first-use pilot

[Русская версия](pilot.ru.md)

This protocol is for an exploratory pilot with five product managers or analysts who already use Codex. It tests whether people can make a useful first CX Impact map and whether they choose to use or update a map again during ordinary work. It is not a representative usability study, a controlled comparison, or evidence of general product-market fit.

The pilot owner recruits and contacts participants. This document supplies drafts and blank records only; the repository does not send invitations, schedule follow-ups, or publish results. Keep consent records, participant details, source material, maps, screenshots, recordings, transcripts, and raw Codex logs in a private location outside the public repository. Only original synthetic tasks may enter the public tree. Human usefulness and quality ratings must be made by people, never inferred from automated checks.

## Targets and denominators

- **First use:** at least **4 of 5 enrolled participants** create an independent, useful first map.
- **Two-week repeat:** at least **3 of the same 5 enrolled participants** independently create another real map or materially update a real map within 14 calendar days of their first run.

The denominator remains all five enrolled participants. Report confirmed outcomes, confirmed failures, withdrawals, technical failures, and nonresponses separately. For example, a missing follow-up response is “repeat not established — no response,” not evidence that the participant did or did not repeat. It still does not enter the numerator. Do not replace a participant silently after enrollment; if an additional person is recruited, report that person outside the original five-person denominator.

An **independent first map** is the first artifact completed before the observer gives task-specific wording, content, commands, corrections, or troubleshooting. Reading the installed CX Impact documentation and using ordinary Codex knowledge are allowed. Installation or authentication help supplied by the owner must be recorded and the independence decision explained.

A **useful first map** is an independent first artifact that the participant says can help the named real decision in its current state or after minor edits they can identify, and for which the participant can point to at least one concrete way it clarified the decision. The participant makes this judgement; the observer records it without upgrading an answer. The artifact must contain the requested views and be readable enough for the participant to inspect. A structural check alone cannot make it useful.

A **real repeat or update** means that, after the first session and within 14 calendar days, the participant independently uses CX Impact in ordinary work to either create a map for another real scenario or materially revise a real map with new evidence, requirements, stages, branches, roles, or decisions. They must render or open the resulting artifact and use or plan to use it in a discussion, decision, or piece of analysis. Reopening the first HTML, showing the pilot artifact, retrying the first run, or making only a formatting correction does not count.

## Recruitment

Recruit people who:

1. currently work as a product manager, product owner, service designer, business analyst, operations analyst, or closely related role;
2. have used Codex for work at least twice in the previous 30 days;
3. have a current journey, service, or operating-process decision that a map could support;
4. can work with material they are authorized to use and keep it in the private pilot location; and
5. can reserve up to 60 minutes for a first run and respond to one manual follow-up 14 days later.

Avoid recruiting only people who helped build CX Impact. Record prior mapping experience; do not use it to exclude a participant unless the study owner decides that the intended audience requires a narrower screen.

### Exact invitation draft

**Subject:** Invitation: 60-minute first-use pilot for CX Impact in Codex

> We are running an exploratory pilot of CX Impact, a Codex skill for creating customer journey maps, service blueprints, and experience-process maps. We are looking for product managers and analysts who already use Codex.
>
> The first session takes up to 60 minutes. You will use CX Impact on a real work scenario that you are authorized to discuss, work independently while we observe, and tell us whether the result helps a current decision. We will contact you once more 14 days later to ask whether you used or updated a map again. This is a product pilot, not a performance assessment.
>
> Your raw materials, maps, Codex logs, and notes will be kept in the private pilot workspace and will not be added to the public repository. We will report only anonymized exploratory results unless we separately agree otherwise. Participation is optional, and you may stop at any time.
>
> If you are interested, please reply to the screener below. Do not include confidential project material in your reply.

### Screener

Ask each candidate to answer:

1. What is your current role?
2. Approximately how many times have you used Codex for work in the last 30 days: 0, 1, 2–5, 6–10, or more than 10?
3. Have you created or edited a customer journey, service blueprint, or process map in the last year: never, once, or more than once?
4. Do you have a current, non-sensitive work decision that could benefit from mapping a 3–7-stage journey or process? Answer yes/no and name only the type of decision.
5. Can you attend a session of up to 60 minutes and receive one manual follow-up 14 days later? Answer yes/no.
6. Do you agree that an observer may take anonymized notes about the session? Answer yes/no. Any recording requires a separate explicit agreement.

Eligible participants meet criteria 1–5 and agree to observation. Record exclusions and declines as recruitment flow, not as pilot outcomes. Enroll exactly five before calculating the two targets.

## Preparation

The owner should prepare the same tested CX Impact package and Codex setup for each participant. Record the package version or commit, Codex version, model, reasoning effort, operating system, installation route, and any environment limitation. Confirm that each participant can access Codex before the timed run, but do not rehearse the task or supply a finished example from their scenario.

Ask the participant to bring a bounded real scenario and source material they are permitted to use. Suitable material includes a short brief, procedure, or set of notes. If no suitable real material is available, do not substitute a public synthetic exercise and count it as a real pilot outcome; record the session as not eligible for the primary target or reschedule before enrollment is finalized.

Create a private participant folder. Store public product files separately from private source material and outputs. Give the participant write access to their folder. Do not copy private notes, outputs, or raw logs into `docs/`, `tests/`, `skills/`, examples, release archives, issues, or pull requests.

## Self-directed first run

Use the following participant instruction verbatim. Replace bracketed fields only with the participant's selected scenario and authorized file names.

> Use CX Impact in Codex to map **[scenario]** as a **[CURRENT / AS-IS or TARGET / TO-BE]** scenario. Use the supplied **[source file names]**. Create a customer journey map, a service blueprint, and an experience-process map, with standalone HTML and editable JSON. Work as you normally would with Codex. Keep evidence, proposals, and unknowns distinct. Stop when you have an artifact you would be willing to inspect for your real decision. You may read the CX Impact documentation. Tell the observer if you are blocked or decide to stop.

Start the timer when the participant has the instruction and source files visible and begins working in Codex. The observer remains silent and does not move the pointer, edit the prompt, provide a command, or correct content during the independent attempt. The observer may remind the participant to think aloud without suggesting an action.

Stop the first-artifact timer when the participant has saved editable JSON and standalone HTML, opened the HTML, and can reach all three requested views. If the participant stops, reaches 45 active minutes without a first artifact, or asks for task-specific help, record the time and reason. Assistance may then be given so the remaining interview can continue, but the primary independence outcome for that participant is no. Record wall-clock elapsed time, break time, and active time separately; never convert a missing time to zero.

After the participant inspects the map, ask:

1. What real decision were you trying to make or clarify?
2. What, if anything, did the map make clearer?
3. Would you use this artifact for that decision in its current state or after minor edits you can name? Why?
4. Which claims, paths, or labels would you correct before using it?
5. What did you expect to happen that did not happen?
6. What assistance did you need, from whom, and at what point?

Allow the participant to make corrections after the first-artifact timestamp. Record every correction and its active time, including source/status changes, missing branches, stage or role changes, wording, layout, export, and file handling. Participant-initiated correction is still a correction; observer assistance is recorded separately.

## Blank first-run observation sheet

Leave fields blank until a session occurs. A blank is unmeasured, not zero or “no.”

| Field | Record |
|---|---|
| Participant ID |  |
| Session date (YYYY-MM-DD) |  |
| Role |  |
| Prior Codex use band |  |
| Prior mapping experience |  |
| Package/commit |  |
| Codex version |  |
| Model / effort |  |
| Operating system / setup notes |  |
| Scenario and explicit mode |  |
| Real decision to be helped |  |
| Authorized source types used |  |
| Timer start |  |
| First artifact time or stop time |  |
| Wall-clock minutes |  |
| Break minutes |  |
| Active minutes |  |
| HTML saved and opened |  |
| Editable JSON saved |  |
| CJM / blueprint / process reachable |  |
| Task-specific help before first artifact |  |
| Exact help, provider, and timestamp |  |
| Independent first map: yes / no / not established |  |
| Participant's usefulness answer and reason |  |
| Concrete clarification for the decision |  |
| Useful first map: yes / no / not established |  |
| Corrections made by participant |  |
| Corrections suggested or made by observer |  |
| Correction active minutes |  |
| Technical failures / environment limits |  |
| Observer notes |  |

## Two-week follow-up

At the end of the first session, calculate the participant's follow-up date as first-session date + 14 calendar days and record it immediately. The owner contacts each participant manually on that date. Do not create an automation or recurring task for this protocol.

Use this exact follow-up draft:

> Since your CX Impact first-use session on **[first-session date]**, have you independently used CX Impact again in real work by **[follow-up date]**?
>
> A repeat means either creating a map for another real scenario or materially updating a real map with new evidence, requirements, stages, branches, roles, or decisions, then opening the result and using or planning to use it in a discussion, decision, or analysis. Reopening, demonstrating, retrying the first run, or making only a formatting correction does not count.
>
> If yes, please state the date, whether it was a new map or update, the type of decision it supported, and what changed. Do not send confidential source material or the map itself. If no, what was the main reason? You may also decline to answer.

Record the response without interpreting an ambiguous answer as a repeat. Ask one neutral clarification if needed. If there is no response, record each contact date and “repeat not established — no response.”

| Participant ID | First-run date | Planned +14-day date | Actual contact date(s) | Response date | New map / material update | Real-work decision or discussion | Evidence sufficient for definition | Outcome: confirmed repeat / confirmed no repeat / not established | Nonresponse, withdrawal, or notes |
|---|---|---|---|---|---|---|---|---|---|
| P01 |  |  |  |  |  |  |  |  |  |
| P02 |  |  |  |  |  |  |  |  |  |
| P03 |  |  |  |  |  |  |  |  |  |
| P04 |  |  |  |  |  |  |  |  |  |
| P05 |  |  |  |  |  |  |  |  |  |

## Exploratory readout

Report participant-level outcomes before totals. For the first target, show `independent and useful / 5 enrolled`, then list independent but not useful, assisted, stopped, and technical-failure outcomes. For the repeat target, show `confirmed real repeats or updates / 5 enrolled`, then confirmed no repeat, not established because of nonresponse, withdrawal, and technical limitations.

Include median and range for measured first-artifact active time and correction time only when their measured denominators are shown. Keep unreviewed or missing values blank. Describe recurring assistance and corrections with anonymized examples. Do not turn five purposively recruited participants into percentages that imply population precision, and do not claim causality, superiority, or general adoption from this pilot.
