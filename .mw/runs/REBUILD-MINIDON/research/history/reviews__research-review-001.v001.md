# Research review 001: REBUILD-MINIDON

- Reviewer: research-reviewer-agent (independent of research-agent, I-14)
- Date: 2026-11-12
- Run state at review: RESEARCH_READY, research version 13
- Pack reviewed: `.mw/runs/REBUILD-MINIDON/research/` (outcome.json, outcome-brief.md, risks.json,
  reviewers.json, estimate.json, security.md, target-state/, flows/, gaps.json, inputs.json, inputs/)
- Checked against: `ticket.md`, `.mw/context/` (baseline.json, capabilities/*/rules-trace.md,
  baseline-review-report.md), `.mw/runs/BASELINE-2026-10-30/` (run.json, ledger.jsonl,
  baseline-review-report.json), and the Python reference `minidon@e1fbd3a` (read-only)
- `millwright research validate`: "Research pack is consistent" (structure only; it does not check
  the findings below)

This review is advisory. It does not approve or reject anything. Only a human decides the
research gate (I-23).

## Grading

| Grade | Meaning |
|---|---|
| Critical | Makes the outcome or its falsification test wrong as written. Fix before relying on the pack. |
| Major | A material gap, a wrong claim or a provenance error that would mislead planning or design. |
| Minor | Accuracy or completeness issue; fix in the next revision or carry into design. |
| Info | Housekeeping, or DEMO content a real team must replace. |

## Summary

| Grade | Count |
|---|---|
| Critical | 2 |
| Major | 6 |
| Minor | 9 |
| Info | 2 |
| **Total** | **19** |

The pack is well structured, honest about its DEMO content and strong on the data-compatibility,
time and framework risks. But its headline number is wrong. The baseline has 81 rules, not 82,
and one of them (Posting BR-009) was retired at the baseline gate and cannot pass against Python.
So the "82 of 82" target can never be met, and the hypothesis fails by construction. The pack
also builds on the DEMO answers written into `baseline.json` during research. It does not use
the human decisions recorded when the baseline gate was approved, and in places the two differ.

## Method

I re-derived the pack's key numbers and claims from the sources instead of trusting the pack:
rule counts per rules-trace file, routes, test functions, line count, error classes, config, models
and services in `minidon@e1fbd3a`, the baseline run's ledger and review report, and the REBUILD
run ledger. To confirm the storage formats I ran the Python reference once against a throwaway
SQLite file in `/tmp`, with bytecode writing disabled. No file in the source repo was created or
changed: `git status` is clean and no new `.pyc` files were written. The temp files were deleted.

---

## Critical

### F-01 (Critical) The baseline has 81 rules, not 82. CON-002 is a false contradiction

- **Evidence.** `.mw/context/capabilities/notifications/rules-trace.md:16-24` (the Rules Index)
  lists 9 rules, BR-001 to BR-009, and there are 9 `### BR-` sections. The only `BR-010` in the
  file is at line 102, and it points to **L1-following's** BR-004/BR-010, not to a Notifications
  rule. The `baseline.json` index (`ruleCount: 9` for L1-notifications) is correct. Per-file
  counts: accounts 14, following 15, posting 20, timelines 8, notifications 9, moderation 15,
  which adds up to **81**.
- **Second defect.** The pack and `inputs/baseline-metrics.md:8` define the count as "distinct BR ids across
  `capabilities/*/rules-trace.md`". Rule ids restart in each capability, so that method returns
  **20**, not 82 or 81. The MET-001 measurement method (`outcome.json:75`) uses the same wording.
- **Affected.** `outcome.json:13, 33, 49` (statement, hypothesis, falsifiedIf), MET-001
  (`outcome.json:53-80`), `risks.json:51-59` (CON-002), `target-state/capability-deltas.json:33-39`
  (says Notifications has 10 rules), `outcome-brief.md:92-95`, `nfr.json:7`.
- **Fix.** Recount by (capability, BR id) pairs, change the MET-001 method to say so, retract
  CON-002, and give rule references a capability prefix (for example `L1-accounts/BR-006`). Ids such
  as "BR-006" appear in several capabilities and are ambiguous in the pack as written
  (`risks.json:127`, `security.md:39`).

### F-02 (Critical) Posting BR-009 was retired at the baseline gate and cannot pass against Python

- **Evidence.** `.mw/context/capabilities/posting/rules-trace.md:24`: "BR-009 | Edit window is 30
  minutes (README) | STATED". The code enforces 60 minutes (`minidon/config.py:15`,
  `minidon/statuses/service.py:117-118`). The human gate record
  `.mw/runs/BASELINE-2026-10-30/baseline-review-report.json` (CF-001, resolved by the human
  reviewer on 2026-11-09) says: "BR-009 (30 min) is retired; BR-010 (60 min) stands as STATED."
- **Impact.** GRD-002 (`outcome.json:268`) and MET-001 say a rule counts only if its parity test
  first passes against Python. A test for BR-009 cannot pass against Python. So even with the count
  corrected to 81, MET-001 tops out at 80, and the falsifiedIf (`outcome.json:49`: "fewer than 82 of
  82") fires whatever the Rust build does. The pack keeps the 60-minute behaviour (GRD-005, CON-003)
  but never takes BR-009 out of the denominator.
- **Fix.** The parity denominator should be **80** (81 rules minus retired BR-009), stated with its
  derivation. Update MET-001, MET-002 (Posting would need 19 of 19), the falsifiedIf, the
  capability-deltas and the brief.

---

## Major

### F-03 (Major) The pack ignores the human baseline-gate record and builds on later DEMO answers

- **Evidence.** The baseline was approved by a human: `.mw/runs/BASELINE-2026-10-30/run.json`
  state `BASELINE_CONFIRMED`, and the ledger seq 8 is a `gate.approve` by a human actor at
  2026-11-10T17:07:04Z, with the checks `policy:baseline-conflicts-resolved` and
  `policy:baseline-domains-signed-off`. The human resolutions are recorded in
  `.mw/runs/BASELINE-2026-10-30/baseline-review-report.json` and
  `.mw/context/baseline-review-report.md:53-89`. Its rationale is "follow-ups captured for
  Activity 2". The DEMO answers in `baseline.json` came later, in commit `6a4aed4` ("08 - research:
  resolve blockers..."). The pack treats only those DEMO answers as the answer set.
- **Where the two answer sets differ:**
  - OQ-005 / CF-003: the human said "leave as plain import, owned by L1-following". The pack
    defers it to an ADR (`adr-candidates.md:12`, `risks.json:190`).
  - OQ-017 / CF-006: the human said "accept the direct call; document the cascade in BR-015". The
    pack defers it (`adr-candidates.md:13`).
  - OQ-018 / CF-004: the human said "formalise as a stable identity API owned by L1-accounts". The
    pack defers it (`adr-candidates.md:14`).
  - The human answers name follow-ups the pack does not carry: secure admin seeding (OQ-001,
    "instance takeover risk"), raising the minimum password length from 8 to 12 (OQ-002), an audit
    trail for staff deletes (OQ-009), adopting "Relationship" as the official term (OQ-006), a test
    guard for new notification kinds (OQ-012), README updates (OQ-010, OQ-015), repairing ADR-001
    (CF-001), and deleting `minidon/lists/` (CF-002).
- **Knock-on.** CON-001 (`risks.json:43-50`) calls the baseline unconfirmed. The run record shows
  it was confirmed; only `baseline.json` was not updated (status `draft`, `confirmedBy` null, CF-001
  to CF-007 still `open`). MET-006's baseline of 21 (`outcome.json:198-223`) is stale: the gate
  record says all 21 were answered on 2026-11-10.
- **Fix.** Cite the gate record as the authority for gate decisions. Reconcile each DEMO answer
  against it: if they agree, cite both; if they differ, raise it for the human to decide. Rewrite
  CON-001 as "baseline.json not updated after the gate". Add the missing follow-ups to the
  out-of-scope list and `security.md`. Re-baseline or drop MET-006.
- **Demo note.** Both answer sets come from the demo. A real team would need a single answer
  record, owned by real BA, Tech Lead and Security people.

### F-04 (Major) DEMO answers proposed by an agent are labelled STATED (I-05)

- **Evidence.** Each `baseline.json` answer reads "DEMO ANSWER, proposed by Claude, pending human
  review". The pack labels claims sourced only from these answers as `STATED`:
  - GRD-004 (`outcome.json:285-287`) and GRD-005 (`outcome.json:292-294`)
  - NFR-004 (`target-state/nfr.json:33-34`)
  - principles 1, 4, 6 and 7 (`target-state/principles.md:10, 30, 42-43, 47-48`)
- **Why it matters.** An agent's proposal waiting for human review is inferred behaviour. Under
  I-05 it must be `DERIVED`. The pack's own brief says the answers are pending review
  (`outcome-brief.md:86-87`), which contradicts the STATED labels.
- **Fix.** Relabel these as DERIVED, or cite the human gate record where it says the same thing
  (F-03). That record is a human statement, so citing it would justify STATED.

### F-05 (Major) The error-status mapping is incomplete: 409 and 429 are missing

- **Evidence.** `minidon/errors.py:28-33` defines `Conflict` (409) and `RateLimited` (429). They
  are raised for:
  - username taken and email registered (`accounts/service.py:48, 50`)
  - already boosted (`statuses/service.py:168`)
  - report already closed (`moderation/service.py:62`)
  - the posting rate limit (`statuses/service.py:244`)

  My probe of the Python reference returned `{"error": "Username is taken"}` for a duplicate
  registration.
- **Where the pack is wrong.** It lists the mapping as "(400, 401, 403, 404, 422)" in three places:
  `capability-deltas.json:52`, `nfr.json:23` (NFR-003) and `security.md:22`.
- **Second gap.** There are two different 422 body shapes:
  - DomainError gives `{"error": msg}` (`main.py:18-20`).
  - FastAPI/Pydantic validation gives `{"detail": [...]}` (seen in the probe).

  ADR candidate 3 touches on this, but NFR-003 should name both shapes.
- **Fix.** Correct the mapping to 400, 401, 403, 404, 409, 422 and 429 everywhere it appears, and
  add 409 and 429 cases to the differential and security checks. Rate-limit enforcement matters for
  DoS (security row 8).

### F-06 (Major) Cross-language semantics are missing from the risk register

The risks cover data formats, framework behaviour, time and concurrency. They do not cover places
where Python and Rust behave differently even when the logic is translated faithfully:

- **Regex dialect.** `statuses/service.py:19-20` uses negative lookbehind (`(?<![\w@])`,
  `(?<![\w#])`) and `\b`. The standard Rust `regex` crate does not support lookaround. Python's
  `\w` and `\b` are Unicode-aware, and a port must match that exactly. These patterns decide
  mentions, hashtags, mention notifications and who can see DIRECT/PRIVATE statuses
  (`statuses/service.py:46-51`). So a mismatch is also a disclosure risk (security row 4).
- **String length.** Python `len()` counts code points. Limits use it at `statuses/service.py:229`
  (500, including the spoiler text), `accounts/service.py:45, 122, 126` and
  `moderation/service.py:28`. Rust `str::len()` counts bytes.
- **Case and whitespace.** Python's Unicode `.lower()` (usernames, emails, tags) and `.strip()`
  (content, email) differ from Rust's ASCII-only helpers.
- **Token shape.** `secrets.token_urlsafe(32)` gives 43 characters, and the column is `String(64)`.

**Fix.** Add a RISK and an NFR ("text-processing parity: regex, length, case-folding and trimming
match Python, including non-ASCII input"). Make Unicode inputs a required class in the parity
suite.

### F-07 (Major) The ticket's open question on DERIVED rules is not answered

- **Evidence.** `ticket.md` asks: "Which baseline rules are DERIVED and still unconfirmed by a
  human." The pack does not answer it anywhere. A grep of the research pack finds no count or list.
  From the rules-trace indexes, 64 of the 81 rules are `DERIVED` or `STATED`/`DERIVED`, and 17 are
  purely `STATED`.
- **Why it matters.** Parity tests check what Python does, so DERIVED rules are safe to test. But
  the human must know which "rules" are agent inferences before accepting that "every baseline rule
  passes" means feature parity (ASM-001). The domain sign-off at the baseline gate
  (`baseline-review-report.json`, L0-minidon approved) may count as confirmation. The pack should
  say whether it does.
- **Fix.** Add the per-capability DERIVED list or count. State whether the baseline-gate domain
  sign-off confirms the DERIVED rules. If it does not, record a gap for the domain lane.

### F-08 (Major) The parallel research branches are open and the lane contributions are missing

- **Evidence.**
  - `.mw/runs/REBUILD-MINIDON/run.json` lists branches RESEARCH_ESTIMATE, RESEARCH_SECURITY and
    RESEARCH_FLOWS with `complete: false`.
  - `millwright next` says the done-when for this state is "Parallel branches ... complete".
  - It names design-agent as owner of `security.md` and ux-context-agent as owner of `flows/`.
  - `manifest.json:278-284` (security.md) and `:230-245` (flows/) record `research-agent` as the
    actor for both.
- **Impact.** The security threat model and the flows were not drafted by the lanes assigned to
  them, so there was no second view before this review. The branches will also need closing before
  the run can move on.
- **Fix.** Have design-agent and ux-context-agent review or extend their files and close their
  branches. research-agent closes RESEARCH_ESTIMATE. This is for the owning agents to do, not for
  this review.

---

## Minor

### F-09 (Minor) The storage formats are now confirmed and should be stated, not hedged

- **What the probe confirmed.** A probe of the Python reference on a fresh file database shows:
  - Enum columns store the member **name**: `accounts.role = 'ADMIN'`,
    `statuses.visibility = 'PRIVATE'`. The API returns the value (`"admin"`, `"private"`).
  - The DDL sizes enum columns to the longest name (`role VARCHAR(9)`).
  - Datetimes are stored as `'YYYY-MM-DD HH:MM:SS.ffffff'` and serialised by the API as naive ISO
    `'YYYY-MM-DDTHH:MM:SS.ffffff'`, with no zone.
- **Where the pack is wrong or hedged.**
  - ASM-002 (`risks.json:19`) says the enums are "stored as SQLAlchemy Enum values", which is
    wrong or at best ambiguous.
  - RISK-002 (`risks.json:91`) only says the name "can differ" from the value.
- **Fix.** State these as facts in ASM-002 and RISK-002, and carry them into ADR candidate 2.

### F-10 (Minor) Some of the observable HTTP surface is outside the 40 endpoints

- **Evidence.** The Python app also serves `/openapi.json` and `/docs` (both 200 in the probe), and
  FastAPI also serves `/redoc`. Unknown routes return `{"detail": "Not Found"}`, and wrong methods
  return 405.
- **Gap.** The scope and the falsifiedIf talk only about "the 40 endpoints".
- **Fix.** ADR candidate 3 should say explicitly whether the API docs routes and the 404/405 bodies
  are contract.

### F-11 (Minor) Creating the schema on a fresh instance is not covered

- **Evidence.** Python creates its schema at startup (`minidon/__main__.py:9`,
  `minidon/db.py:30-33`). NFR-002 (`nfr.json:15-19`) only covers the Rust build running on a
  Python-created database.
- **Gap.** If Rust ever bootstraps an empty database, its DDL must match SQLAlchemy's: types,
  `VARCHAR` lengths, `NOT NULL`, unique constraints and indexes. Otherwise "readable by the other
  build" (principle 3) breaks for new instances.
- **Also missing.** `__main__.py:10` hard-codes `127.0.0.1:8000`, and this is not in the
  configuration surface (NFR-009).

### F-12 (Minor) The 54 Python tests are in-process, so MET-003 is not a one-to-one mapping

- **Evidence.** `tests/conftest.py:20-36` runs each test on an in-memory database through
  `dependency_overrides`. `tests/test_statuses.py:62-66` monkeypatches `utcnow`.
- **Impact.** A black-box harness against a running Python process can do neither. MET-003
  (`outcome.json:110-137`) assumes every Python test gets a "Rust-side equivalent". The
  clock-dependent tests will need data-timestamp setup in a shared database file, as RISK-008
  suggests, or a different oracle.
- **Fix.** Note this in MET-003, or narrow it to "tests whose behaviour can be checked black-box".

### F-13 (Minor) Rule-to-test coverage can already be roughly measured

- **Evidence.** RISK-004 (`risks.json:105-113`) and `baseline-metrics.md:10` say rule-to-test
  coverage is "not measured". But the rules-trace files already cite tests: about 50 of 81 rule
  sections cite a `tests/test_*.py` file (DERIVED, from a grep of `### BR-` sections).
- **Fix.** Record that figure as a DERIVED estimate. It sizes the "new parity tests" work in the
  estimate.

### F-14 (Minor) The estimate arithmetic does not follow from its stated basis

- **Traditional range.** The basis (`estimate.json:17`) gives 3,000 to 5,000 lines at 100 to 150
  lines a day, which is 20 to 50 days. Adding the harness (5 to 8 days) and data work (4 to 8 days)
  gives **29 to 66** days, not the stated 35 to 60.
- **Agentic range.** The agentic range (`estimate.json:18`, 6 capabilities at 2 to 4 days, plus 0
  to 1 day) leaves out the platform story and the parity-harness story that the same file lists as
  separate stories (`:20`).
- **Widening.** The 2 to 5 days for RISK-003 (`:29`) are described but not applied.
- **Fix.** Show the arithmetic, or widen the ranges. This is DEMO content, but the basis should
  still add up.

### F-15 (Minor) The MET-005 guardrail is weakened by its filter

- **Evidence.** `outcome.json:191` counts only commits "referencing REBUILD-MINIDON".
- **Impact.** A write to the Python repo that does not mention the ticket, or an uncommitted change
  in the working tree, would go uncounted.
- **Fix.** Count every commit after `e1fbd3a` on all branches, plus a dirty-tree check.

### F-16 (Minor) Some security claims are inexact

- **Row 7.** `security.md:24` refers to "ModerationAction records". `ModerationAction` is an enum
  (`moderation/models.py:24-27`). The record is the set of `Report` fields `action_taken`,
  `moderator_note`, `resolved_by_id` and `resolved_at` (`moderation/service.py:79-82`). The direct
  suspend, unsuspend and role-change endpoints leave no record beyond `suspended_at` and `role`, so
  a repudiation parity test has little to read there.
- **Row 3.** `security.md:20` says "moderator cannot suspend an admin". In fact **no one** can
  suspend an admin (`moderation/service.py:125-126`), and an admin cannot change their own role
  (`:108-109`). These negative cases should be listed explicitly.

### F-17 (Minor) Visibility is named in prose, not by its wire value

The pack says "followers-only" (`journeys.md:57`, `outcome-brief.md:85`, `security.md:21`). The API
and stored values are `private` and `PRIVATE` (`statuses/models.py:15`). Specs and parity tests
should use the wire values to avoid misreading.

---

## Info

### F-18 (Info) DEMO roster and DEMO answers: what a real team must replace

These are judged as demo content and are disclosed clearly (RISK-007, `reviewers.json:4`,
`inputs/decision-makers.md:3`). Before relying on the pack, a real team would need to replace or
add the following:

- **Roster.** Separate, named people for PO, BA, Tech Lead and Security. Today one person holds
  every lane.
- **Security lane.** Security review is folded into the "integration" lane
  (`reviewers.json:38-39`). A real team should name a distinct security reviewer.
- **Gate approvers.** `decision-makers.md` names approvers only for the research and PRD gates.
  The plan and release gates need approvers too.
- **Open-question gaps.** GAP-010 to GAP-030 were closed on the strength of the DEMO answers in
  `baseline.json` (`gaps.json`, resolution evidence is the baseline.json hash). They should be
  re-confirmed against real human answers (see F-03).
- **Waivers.** The seven waivers (GAP-003 to GAP-009) were all made by the same demo
  decision-maker. Each reason is reasonable for a lift and shift. GAP-005 (compliance) carries a
  stated condition, "revisit at cutover", which should become a tracked item on the cutover
  ticket.

### F-19 (Info) Housekeeping

- `flows/value-stream.md:13` still shows research draft "in progress".
- `outcome.json:335-337` `links.gaps` leaves out the waived GAP-008 and GAP-009.
- The rules-trace still labels Posting BR-010 `DERIVED` (`posting/rules-trace.md:25`) and records
  CF-001 as "Unresolved" (`:598`), although the gate record makes BR-010 STATED. This is baseline
  upkeep, not a research defect. Research must not edit `.mw/context/`; it is listed here so the
  owner can pick it up.

---

## What the pack gets right

These are worth keeping as the pack is revised:

- **Ticket and scope checks hold up.** 40 routes, 54 test functions in 6 files, 2,123 source lines,
  the config defaults (`config.py:14-22`), PBKDF2 at 100,000 iterations with `compare_digest`
  (`accounts/service.py:21-35`), the `expires_at <= now` token expiry (`:83`), clear-text token
  keys, the COUNT-based first-admin check (`:53`), and Lists tables never being created
  (`models.py`, `db.py:31`) were all verified against the code. So were `minidon-rust` having no
  commits and `minidon` HEAD being `e1fbd3a`.
- **The hypothesis is falsifiable.** Once the denominator is fixed, the falsifiedIf includes a
  differential check that tests ASM-001, and its own unprovable list (`nfr.json:80-84`) is honest
  about the limits.
- **The risk thinking is strong.** RISK-002 (enum names), RISK-003 (framework behaviour), RISK-008
  (clock) and RISK-009 (concurrency) are the right risks for this kind of rebuild. The probe
  confirmed RISK-002's enum concern.
- **Out-of-scope boundaries are clear**, and weaknesses carried forward are made visible (principle
  8 and `security.md:28-41`).

## Recommendation for the human at the research gate

**Reviewer recommendation: revise before approving.** The pack is not ready to approve as it
stands, because both Critical findings change the outcome's numbers: the parity denominator should
be 80, not 82, and as written the hypothesis cannot pass.

Suggested revision scope, as a new research version (snapshot first, the files are append-only
under I-30):

1. Fix F-01 and F-02: the denominator, the MET-001 method, CON-002, and rule ids with a capability
   prefix.
2. Reconcile the pack with the human baseline-gate record (F-03), and fix the STATED labels on DEMO
   answers (F-04).
3. Correct the error mapping (F-05), add the cross-language semantics risk and NFR (F-06), and
   answer the ticket's DERIVED-rules question (F-07).
4. Get the security and flows lanes to review their files and close the open research branches
   (F-08).

The Minor and Info findings can be fixed in the same revision or carried into design as ADR inputs.
Whether to approve, send back or waive anything is the human's decision alone (I-23).
