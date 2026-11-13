# Flows lane review: REBUILD-MINIDON (RESEARCH_FLOWS)

- Reviewer: ux-context-agent (owner of the RESEARCH_FLOWS lane)
- Date: 2026-11-13
- Files reviewed: `research/flows/journeys.md`, `research/flows/value-stream.md` (both drafted by research-agent)
- Method: each file reviewed on its own against the sources, then against each other. Nothing was edited. This review is the only file written.
- Grades: Major (the file is misleading or fails a lane-note check), Minor (wrong detail or gap that does not mislead the gate), Info.

## 1. What I checked

Sources read: `ticket.md`; the six `capabilities/*/rules-trace.md` Rules Index tables and the Dependencies section of each `capability.md`; `baseline-review-report.md` (CF and OQ ids); `outcome.json`; `outcome-brief.md`; `estimate.json`; `inputs/human-decisions.md` (all six sections); `target-state/adr-candidates.md`; `reviews/research-review-002.md`; the run ledger (`ledger.jsonl`, seq 1 to 23); and the Python repo at `e1fbd3a` (read-only: every `routes.py`, `accounts/service.py`, `statuses/service.py`, `social/service.py`, `moderation/service.py`, `notifications/service.py`, `deps.py`, `errors.py`). I ran one pure-regex check in `/tmp` (no repo files touched).

Checks, as asked:

1. Capability coverage (accounts, following, posting, timelines, notifications, moderation) and the parity-test flow.
2. Numbers: 81 rules, 80 live, 40 endpoints.
3. Endpoint coverage against the 40 routes (lane-note check 1).
4. Status codes per step against the Python code (lane-note check 2).
5. Personas fit a backend with no screens (lane-note check 3).
6. J5 against ADR candidate 4 (lane-note check 4).
7. Rule citation form (capability/BR-id).
8. Value-stream times against the ledger, and the durations against `estimate.json`.
9. Waves against the baseline dependency order.
10. The trailing-newline username decision (`human-decisions.md` section 5).

## 2. Findings

### F-01 (Major) Journeys exercise 25 of the 40 endpoints; 15 are never shown

I counted the routes in the six routers (timelines 4, social 12, accounts 5, statuses 9, notifications 4, moderation 6 = 40, matches the pack and the lane note) and matched them against the journey steps. Shown: accounts 3, statuses 6, social 6, timelines 1, notifications 3, moderation 6 = 25.

Not covered by any journey step:
- Accounts: `GET /accounts/me`, `GET /accounts/{username}`
- Statuses: `GET /statuses/{id}`, `POST /statuses/{id}/unreblog`, `POST /statuses/{id}/unfavourite`
- Social: `GET /accounts/{username}/relationship`, `POST .../unfollow`, `POST .../unblock`, `POST .../unmute`, `GET .../followers`, `GET .../following`
- Timelines: `GET /timelines/public`, `GET /timelines/tag/{tag}`, `GET /accounts/{username}/statuses`
- Notifications: `POST /notifications/{id}/read`

This matters because Timelines has one of its four routes in a journey and the three missing ones carry the visibility and anonymous-viewer behaviour (L1-timelines/BR-004, BR-005, BR-006, L1-posting/BR-005). The lane note asked for this check and the draft still fails it. The pack's falsifiedIf names "any of the 40 endpoints", so the journeys should be able to point at all 40.

### F-02 (Major) Value-stream durations do not add up to `estimate.json`: 19 to 38 days against 16 to 34, still unreconciled

The ahead-of-us rows in `value-stream.md` give: plan, PRD and spec 2 to 4 d; build waves "14 to 28 d of stories plus 2 to 5 d" = 16 to 33 d; acceptance 1 d. Sum = 19 to 38 d (adding the under-1-day research row, up to 39). `estimate.json` agentic is 16 to 34. So the gap is +3 days at the low end and +4 at the high end, which is review 001's finding, and it is not fixed. Causes, each checked against `estimate.json`:

- The 2 to 4 d plan row is labelled "DERIVED from estimate.json" but no such figure exists there. The estimate's basis (lines for "Agentic (DERIVED), step by step") already counts human effort on the gates "(research, PRD, plan, PR reviews)" inside the 14 to 29 subtotal. Adding a separate plan row double counts it.
- The 1 d acceptance row also has no line in the estimate. The nearest item is "fixed overhead 0 to 1".
- The build row says 14 to 28; the estimate subtotal is 14 to 29 (12 to 24 + 1 to 2 + 1 to 2 + 0 to 1). With the 2 to 5 widening the correct total is 16 to 34, not 16 to 33.
- Units are mixed. `estimate.json` is person-days of human effort (agent compute not counted). The value stream shows elapsed time for finished steps (hours) and "d" for later steps without saying which unit.

Reconciliation I recommend (research-agent or the estimate branch owner decides; I have not edited either file): keep `estimate.json` as the authority, state the unit (person-days) on the value stream, make the build row 14 to 29 d plus 2 to 5 d = 16 to 34 d, and relabel plan, PRD, spec and acceptance as "included in the build row" or as a share of it, not as extra rows. If the owner believes plan/spec and acceptance are really extra, then `estimate.json` must be raised to 19 to 38 (and the traditional range re-checked for the same omission). Either way the two files must agree before the research gate. I cannot tell from the sources which is intended, so this is flagged and not resolved.

### F-03 (Major) The trailing-newline username decision is not reflected in either flow

`human-decisions.md` section 5 (2026-11-13) says the Rust build must accept a username with one trailing newline, requires a parity test for it, and requires an explicit note in the Rust implementation. Neither flows file mentions it, and both predate the decision.

I confirmed the behaviour with the Python pattern from `accounts/service.py:17`: `^[a-z0-9_]{1,30}$` matches `"alice\n"` (True) and does not match `"alice\n\n"` or `"\n"`. Registration then stores the name unchanged (only `.lower()` and no strip on username), so `"alice\n"` is a separate account from `"alice"` and the Conflict check at registration does not fire. Email is stripped; username is not, which is worth stating in the journey.

What must show up:
- J1: a step or note after `POST /accounts`: "username `alice` then `alice\n` both return 201 (look-alike accounts; deliberate copy, `L1-accounts/BR-001` and `BR-004`, human-decisions section 5); `alice\n\n` returns 422".
- J5: the parity test class must name this case as a required member of the Unicode and text input class, and the Rust side must carry a deliberate-behaviour comment (ADR candidate 1, regex engine).
- Value stream: the "Unicode input class in wave 1" line should include this case, since it also drives the regex-engine decision.

### F-04 (Minor) Rules are not cited as capability/BR-id consistently, and several steps cite no rule

Good: the draft uses the right form where it cites (`L1-accounts/BR-006`, `L1-posting/BR-020`, `L1-posting/BR-010`, `L1-posting/BR-016`). Problems:
- J2 cites "OQ-004" for the block-deletes-follows step. OQ-004 is an open-question id from the gate record. The rule is `L1-following/BR-007`.
- J3 and J4 cite conflict ids (CF-007, CF-006) as if they were rules. Keep them as gloss, but add the rule ids: `L1-posting/BR-016` (already there for J3), `L1-moderation/BR-015` and `L1-posting/BR-014`, `BR-015` for the J4 cascade.
- Steps with no rule id although the rules exist: PBKDF2 and sign-in (`L1-accounts/BR-007`, `BR-008`, `BR-009`), token TTL (`L1-accounts/BR-010`), display name and bio limits (`L1-accounts/BR-013`), content and spoiler limit (`L1-posting/BR-001`, `BR-002`), soft delete and boosts (`L1-posting/BR-014`, `BR-015`), follow rules (`L1-following/BR-001` to `BR-005`), notification suppression (`L1-notifications/BR-002`, `BR-003`, `BR-004`), notification limits (`L1-notifications/BR-009`), timeline limits (`L1-timelines/BR-007`), report limits (`L1-moderation/BR-004`), single closure (`L1-moderation/BR-006`), suspend protections (`L1-moderation/BR-010`, `BR-011`, `BR-012`, `BR-013`).
- The draft never cites `L1-posting/BR-009` (retired), which is correct. J1 correctly cites `BR-010` for the 60 minute window.
- Note for the reader of J1: the code limit is by code points; the rules-trace says "characters" (RISK-010). The draft says code points, which matches Python `len`. Fine.

### F-05 (Minor) Several status codes are missing or imprecise against the Python code

The lane note asked for the 409 and 429 outcomes; those are right (registration 409 at `accounts/service.py:46-49`; re-boost 409 at `statuses/service.py:167-168`; report already closed 409 at `moderation/service.py:63-64`; 429 at `statuses/service.py:233-244`, originals only). Other mismatches:
- J2: following across a block returns 403 (`social/service.py:48-49`, `L1-following/BR-004`), following yourself returns 422 (`BR-003`). Neither shown.
- J2: a follow to a locked account creates a `follow_request` notification, not a `follow` notification (`social/service.py:56-62`). The diagram sends one "follow notification" arrow after both branches, which is imprecise.
- J2: `GET /notifications?limit=81` returns 422 by FastAPI validation (`le=80`), same for timelines `limit` above 40; the draft says only "80 max".
- J3: refusing to reblog a `private` or `direct` status is 403 (`statuses/service.py:165-166`). A status the viewer cannot see returns 404 first (`get_status`, lines 54-58). The flowchart says only "refused". Replying to a boost is 422 (`L1-posting/BR-008`), not shown.
- J1: sign-in failure is 401 and a suspended account's sign-in is 403 (`accounts/service.py:60-63`). Username, email and password validation failures are 422.
- J4: `resolve` with `delete_status` and no linked status is 422 (`BR-007`); `resolve` can also be `dismiss` or `suspend` (`BR-005`); only delete-status is drawn. Non-staff on any `/admin/*` route get 403 (`deps.py:37-43`), and an unauthenticated caller gets 401.
- Framework-level error bodies (`{"error": msg}` for domain errors against `{"detail": [...]}` for validation) are ADR candidate 3; the journeys should say 422 has two shapes so a step does not look like one contract.

### F-06 (Minor) Personas: one is missing

Three API-client personas fit a backend with no screens (GAP-007 waived): a signed-in user, staff (moderator or admin) and the delivery team in J5. The draft shows user and staff. Missing: the anonymous reader. Public timeline, hashtag timeline, profile timeline, `GET /statuses/{id}`, replies, followers/following and `GET /accounts/{username}` use `OptionalAccount` and work without a token; behaviour differs for anonymous viewers (visibility, `can_view`). Also missing: the target of a follow request (a locked-account owner) and the first-account admin as separate roles; J2 notes the target only in a note. Add one anonymous-reader journey, which would also fix most of F-01.

### F-07 (Minor) J5 is incomplete against the outcome and ADR candidate 4 is undecided

J5 shows the per-rule test loop (Python first, then Rust) which matches MET-001 ("a rule counts only if its test first passes against Python e1fbd3a") and GRD-002 (retired rules get no test). It does not show: the data-compatibility check on a Python-created SQLite database (MET-004, 0 migrations), the differential run of the same request sequence on copies of one database, which is the falsifiedIf in `outcome.json`, or the in-process-test exclusion rule in MET-003. J5 should be marked provisional until ADR candidate 4 (parity harness: one suite against both builds, normalisation, timestamp control) is decided; the lane note's check 4 therefore cannot be closed yet. That is a design dependency, not a defect in the draft.

### F-08 (Minor) Value-stream history is stale after review 002 and the decision of 2026-11-13

From the ledger (STATED, all arithmetic checked): CREATED to CONTEXT_READY is 23:15:50 to 04:02:27 = 4 h 47 min (draft says 4 h 46 min and "~4.8 h", fine). CONTEXT_READY to RESEARCH_DRAFT: 04:02:27 to 04:11:45 = 9 min 18 s (draft "about 9 min", fine). RESEARCH_INTAKE step: 04:08:17 to 04:11:45 = 3 min 28 s (draft "~4 min", fine). These times are correct.

Stale items:
- "Research draft, review 001 and revision: under 1 d" is wrong now. Draft started 2026-11-12 04:11; the latest ledger entry (seq 23) is 2026-11-13 14:33, about 34 hours, and it includes review 001, the human-decisions fixes, the revision, review 002 and the 2026-11-13 decision. The diagram shows only review 001.
- RESEARCH_READY was reached at seq 16 (2026-11-12 17:34 UTC), so the "wait before the research gate" is known to be at least 21 h at seq 23 and is not "unknown" for the part already passed. It is a wait for the gate, but part of it is review work; the draft should split process time from wait where the ledger allows it. The pulled and intake rows say "included in elapsed" and do not separate process from wait. The ledger cannot split them, so say "not separable from the ledger" rather than leave the cell implicit.
- The lane-note check "waits ahead are marked unknown rather than guessed" check passes: every wait ahead is "unknown", none is invented. The one number that is invented is the plan row (F-02).

### F-09 (Minor) Build waves put a producer before its consumer

Wave 2 is Following and wave 3 starts Notifications with Posting, Timelines and Moderation. `L1-following`'s `follow` calls `notify()` from Notifications (`social/service.py:56-62`), and `L1-notifications` reads `social/queries.py` owned by Following (`notifications/capability.md` Dependencies). The estimate's basis orders the work Accounts, Following, Posting, Timelines, Notifications, Moderation. Following parity tests for the follow and follow-request notification cannot pass in wave 2 without a `notify` stub or Notifications moved earlier. Also J2 (follow plus notification) and J3 (posting plus notifications) span waves. The lane note says waves should match the order design settles on; design has not settled it, so flag this as a design input (ADR candidate 5 covers CF-003 and CF-004 but not this cycle) rather than a defect.

### F-10 (Info) Numbers are right where used

- 40 endpoints: right (journeys opening paragraph; I counted 40 routes).
- 80 live: right in J5 (`MET-001, of 80`) and the value stream (`MET-001 = 80 of 80`).
- 81 rules: not stated in either file. The journeys carry the 80 only. Not wrong, but a reader cannot see why 80 and not 81; add the one-line "81 rules minus retired `L1-posting/BR-009`" to J5.
- `e1fbd3a` is the right Python commit (checked `git rev-parse`).

### F-11 (Info) The lane note says the lane has not reviewed the files and the branch is open; that stays true until the ledger records the branch close

This review does not close RESEARCH_FLOWS. Closing is a `millwright transition` or equivalent by the owner of that action, which I was told not to run.

## 3. What I agree with

- API-client journeys are the right form for a backend with no screens, and Mermaid is the form the flow-mapping skill asks for.
- All six capabilities appear: accounts and posting (J1), following, timelines and notifications (J2), posting and notifications (J3), moderation (J4), plus the delivery journey J5 for parity. Moderation is covered completely (6 of 6 routes).
- 429 (originals only, 30 per rolling hour), the 60 minute edit window (`L1-posting/BR-010`), first account becomes Admin (`L1-accounts/BR-006`), staff protections, admin-only unsuspend and role change, report closing once, and boost visibility all match the Python code.
- The value stream marks every wait ahead as unknown, gives no invented waits, and the ledger-derived times for the finished steps are arithmetically right.
- "Where time is likely to be lost" matches RISK-007, RISK-002, RISK-010 and DEP-003 in the pack.
- Rules cited in capability/BR form where they are cited.

## 4. What must change

Before the lane review can be called closed and the research gate can rely on `flows/`:

1. (F-01) Cover all 40 endpoints: add the 15 missing routes, most simply with an anonymous-reader journey (F-06) and short additions to J1, J2 and J3.
2. (F-02) Reconcile the value stream with `estimate.json`: one authority, one unit, and either remove the extra plan and acceptance rows or raise the estimate. State the answer in the file; do not leave 19 to 38 against 16 to 34.
3. (F-03) Add the trailing-newline case to J1, J5 and the wave 1 text.
4. (F-04, F-05) Replace OQ-004 and bare CF ids with capability/BR ids and add the missing status codes listed above.
5. (F-08) Update the value-stream history for review 002 and the 2026-11-13 decision; replace "under 1 d" with the ledger-based figure.

Should change, can follow later: F-07 (J5 completeness, after ADR candidate 4) and F-09 (wave order, after design settles it).

Who changes it: `flows/` is research-agent's draft and research is append-only (I-30), so the revision is for research-agent to append, with this review as input. I did not edit it.

## 5. Status of the flows lane review

The flows lane review of both files is **complete** as a review: both files have been checked independently against all the named sources and the findings above are final for the current versions (journeys and value stream as of research version 19 and the 2026-11-13 decision).

The lane is **not ready to close**. Three Major findings (F-01, F-02, F-03) are open and need a revision of the two flows files by research-agent. F-07 and F-09 additionally depend on design decisions (ADR candidates 4 and 5) that are not made. I have not run any transition, closed the RESEARCH_FLOWS branch, made a gate decision, committed, or waived any gap. Closing the branch is for the run owner after the revision and a re-check of the flows files.

Counts: 3 Major, 6 Minor (F-04, F-05, F-06, F-07, F-08, F-09), 2 Info (F-10, F-11). 0 Critical.
