# Research review 002: REBUILD-MINIDON

- Reviewer: research-reviewer-agent (independent of research-agent, I-14)
- Date: 2026-11-12
- Run state at review: RESEARCH_READY, research version 19 (manifest), pack files revised in versions 17 to 19
- Pack reviewed: `.mw/runs/REBUILD-MINIDON/research/` (outcome.json, outcome-brief.md, risks.json,
  reviewers.json, estimate.json, security.md, target-state/, flows/, gaps.json, gaps.md, inputs.json,
  inputs/, manifest.json, history/)
- Prior review: `research/reviews/research-review-001.md` (19 findings, F-01 to F-19)
- Checked against: `ticket.md`; `.mw/context/` (baseline.json, capabilities/*/rules-trace.md,
  baseline-review-report.md); `.mw/runs/BASELINE-2026-10-30/baseline-review-report.json`; the run
  ledger and manifest; git history of this repo; the Python reference `minidon@e1fbd3a` (read-only)

This review is advisory. It does not approve, reject or waive anything. Only a human decides the
research gate (I-23).

## Grading

| Grade | Meaning |
|---|---|
| Critical | Makes the outcome or its falsification test wrong as written. Fix before relying on the pack. |
| Major | A material gap, a wrong claim or a provenance error that would mislead planning or design. |
| Minor | Accuracy or completeness issue; fix in the next revision or carry into design. |
| Info | Housekeeping, or DEMO content a real team must replace. |

## Summary

The revision is a real fix, not a cosmetic one. Both Critical findings are closed: the parity
denominator is now 80 with its derivation shown everywhere it appears, and the pack now treats
the human baseline-gate record as the authority. I re-derived the numbers myself and they hold:
81 (capability, BR id) pairs, 17 purely STATED and 64 DERIVED or mixed, 50 rule sections citing a
Python test, and estimate arithmetic that adds up.

Of the 19 prior findings, 16 are fixed, 2 are partly fixed and 1 is not fixed (F-08: the lane
branches are still open). The revision says so itself and cannot fix it alone.

This review found 12 new findings: 0 Critical, 1 Major, 8 Minor and 3 Info. The Major one
(N-01) was found by probing the Python reference. Python accepts a username with a trailing
newline as a separate account (`"alice\n"` next to `"alice"`). That breaks the STATED rule
L1-accounts/BR-001, and a standard Rust regex would not reproduce it. The pack's text-parity work
does not cover it, and someone has to decide whether to copy it.

| Grade | New findings |
|---|---|
| Critical | 0 |
| Major | 1 |
| Minor | 8 |
| Info | 3 |
| **Total** | **12** |

## Method

- I read every pack file in full and diffed the current files against `history/` to confirm what
  changed between version 13 and versions 17 to 19.
- I recounted the rules from the Rules Index and `### BR-` sections of each `rules-trace.md`,
  counted test citations per rule section, recounted routes (40), test functions (54) and
  source lines (2,123), and checked `minidon` HEAD (`e1fbd3a`, 0 commits outside it) and
  `minidon-rust` (no commits).
- I compared the gate record JSON and the gate-time `baseline-review-report.md` with the pack's
  citations, and used `git show 1cbf445` to see what changed in `.mw/context/baseline.json`.
- **Probes.** I ran the Python reference twice with the repo's own `.venv` interpreter, using
  `-I -B` and `PYTHONDONTWRITEBYTECODE=1`, against throwaway SQLite files under `/tmp/rr002*`.
  Both directories were deleted afterwards. No file in the source repo was created or changed:
  `git status` is clean, and no `.pyc` file in the source tree is newer than the probes. One
  early `git status` call may have briefly taken git's index lock, but `.git/index` itself was
  not modified. Later calls used `--no-optional-locks`.
- No Rust toolchain is installed on this machine, so the Rust-side behaviour in N-01 and N-02 is
  DERIVED from the documented semantics of Rust's `regex` crate and `std`, not from running it.

---

## Status of the prior findings (review 001)

| ID | Grade (001) | Status | Evidence |
|---|---|---|---|
| F-01 | Critical | **Fixed** | 81 (capability, BR id) pairs stated with per-capability counts (`inputs/baseline-metrics.md:14-22`, `outcome.json:65`). The MET-001 method counts pairs and forbids bare ids (`outcome.json:75`). CON-002 is retracted with the id kept (`risks.json:60-69`). Notifications shows 9 (`capability-deltas.json:41-43`). Rules carry capability prefixes throughout. I recounted: 14+15+20+8+9+15 = 81. |
| F-02 | Critical | **Fixed** | The denominator of 80 is stated with its derivation in the statement, the hypothesis, falsifiedIf, MET-001 and MET-002 (Posting 19 of 19), NFR-001, the capability deltas (`retired: L1-posting/BR-009`), principles 2 and 4, and the brief. GRD-002 excludes retired rules from parity tests (`outcome.json:248`). The ground for retiring BR-009 matches gate record CF-001. |
| F-03 | Major | **Fixed** (residue in N-03, N-04) | The gate record is cited as the authority (`outcome.json:7, 332`, `risks.json:4`). OQ-005, OQ-017 and OQ-018 are now treated as decided (`adr-candidates.md:13-17`, DEP-004). The gate follow-ups are listed as out of scope (`outcome.json:211-219`). CON-001 is rewritten as "baseline.json not updated after the gate" (`risks.json:52-58`). MET-006 is dropped. `baseline.json` answers were replaced with the gate answers by a human (`git show 1cbf445`). |
| F-04 | Major | **Fixed** (citation slip in N-03) | GRD-004 and GRD-005 now cite the gate record and `human-decisions.md` (`outcome.json:264-274`). NFR-004 cites the gate answer for OQ-003 (`nfr.json:33-34`). Principles 1, 4, 6 and 7 cite the gate record or human decisions, and their DERIVED parts are split out (`principles.md:13, 36, 51, 56`). The remaining labelling issues are elsewhere (N-09). |
| F-05 | Major | **Fixed** | 400, 401, 403, 404, 409, 422 and 429 appear in `capability-deltas.json:59`, `nfr.json:23`, `security.md:35` and `outcome.json:202`. Both 422 body shapes are named. The 409 and 429 cases are in the NFR-003 "how" with correct code references (I checked `errors.py:28-33`, `accounts/service.py:48,50`, `statuses/service.py:168,244`, `moderation/service.py:62`). |
| F-06 | Major | **Fixed** (gaps in N-01, N-02) | Added RISK-010 (`risks.json:170-177`), NFR-010 (`nfr.json:72-78`), GRD-009 (`outcome.json:302-308`), principle 11, a Unicode input class in the falsifiedIf, ADR candidate 1, and security rows 4 and 8. The scope is right, but some details are wrong or missing (N-01, N-02). |
| F-07 | Major | **Fixed** | ASM-005 (`risks.json:43-50`) and the brief table (`outcome-brief.md:96-113`) give per-capability counts and list all 17 purely STATED rules. I verified every count and every id against the Rules Index tables. `human-decisions.md` section 4 records the human decision that the domain sign-off confirms the DERIVED rules, with a caveat. |
| F-08 | Major | **Not fixed** | `run.json` still has RESEARCH_ESTIMATE, RESEARCH_SECURITY and RESEARCH_FLOWS at `complete: false`. design-agent and ux-context-agent have not reviewed their files. The revision now says so in lane notes (`security.md:3-11`, `journeys.md:3-11`, `value-stream.md:3-8`, `outcome-brief.md:144-150`) and lists what each lane review should check. This is outside research-agent's remit, but it still blocks moving the run on. |
| F-09 | Minor | **Fixed** (one enum missed, N-06) | Storage formats are stated as facts in ASM-002 (`risks.json:19`), RISK-002 (`:101`), NFR-002, principle 3 and ADR candidate 2. |
| F-10 | Minor | **Fixed** | `/openapi.json`, `/docs`, `/redoc`, the 404 and 405 bodies are named in ASM-001, RISK-003, NFR-003 and ADR candidate 3. |
| F-11 | Minor | **Fixed** | NFR-011 covers schema creation (`nfr.json:79-86`). NFR-009, GRD-007 and principle 10 add `127.0.0.1:8000`. |
| F-12 | Minor | **Partly fixed** (N-05) | The MET-003 method now explains the in-process tests and excludes tests that cannot be expressed black-box (`outcome.json:133`). But the target and minimum are still 54 of 54, so any exclusion makes the target unreachable. |
| F-13 | Minor | **Fixed** (small count error, N-08) | RISK-004 gives about 50 of 81 with a per-capability split (`risks.json:119`). I reproduced 5, 9, 13, 7, 5 and 11 = 50. |
| F-14 | Minor | **Fixed** | Traditional: 20-50 + 5-8 + 4-8 + 3-8 = 32-74, plus 2-5 = 34-79. Agentic: 12-24 + 1-2 + 1-2 + 0-1 = 14-29, plus 2-5 = 16-34. The platform and harness stories are included, and the RISK-003 widening is applied (`estimate.json:18-19, 30`). Remaining gaps are in N-08 and N-12. |
| F-15 | Minor | **Fixed** | MET-005 counts every commit outside `e1fbd3a` on all refs plus `git status --porcelain`, with no message filter (`outcome.json:191`). |
| F-16 | Minor | **Fixed** | Row 7 names the four `Report` fields and calls `ModerationAction` an enum. Row 3 lists every negative case, which I checked against `moderation/service.py:95-129` (`security.md:33, 37`). |
| F-17 | Minor | **Fixed** | Wire values are used throughout (`security.md:16-17`, `journeys.md:18`, `risks.json:83`). "Followers only" now appears only as a gloss on `private`. |
| F-18 | Info | **Partly fixed** | `reviewers.json:4` now asks for separate people, a separate security reviewer, and plan and release approvers. But: `inputs/decision-makers.md` still names approvers only for the research and PRD gates. GAP-010 to GAP-030 still cite the pre-correction `baseline.json` hash (N-04). The GAP-005 condition "revisit at cutover" is mentioned (`security.md:67`) but not tracked as an item anywhere. |
| F-19 | Info | **Fixed** (research side) | `value-stream.md` is current, and `outcome.json:323-325` links GAP-003 to GAP-009. The Posting rules-trace upkeep (BR-010 still DERIVED, CF-001 still "Unresolved") is still the baseline owner's job. The pack records it in CON-001 and `outcome-brief.md:152-157`. |

Totals: 16 fixed (5 with a residue tracked as a new finding), 2 partly fixed, 1 not fixed.

---

## New findings

## Major

### N-01 (Major) Python accepts a trailing newline in usernames, which breaks L1-accounts/BR-001; the pack does not cover it

- **Evidence (code).** `minidon/accounts/service.py:17` is `USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{1,30}$")`,
  applied with `.match()` at `:41` after `username.lower()` at `:39`. In Python `re`, `$` also
  matches just before a final `\n`.
- **Evidence (probe, Python reference at e1fbd3a, temp database).**
  - `POST /api/v1/accounts {"username": "alice\n", ...}` returned **201**, with `"username": "alice\n"`
    and `"acct": "alice\n@minidon.local"`. It became Admin as the first registrant.
  - A second `POST` with `"username": "alice"` also returned **201**.
  - The `accounts` table then held both `'alice\n'` and `'alice'`.
- **Why it matters.**
  - **The rule says one thing and Python does another.** L1-accounts/BR-001 is purely STATED as
    "Usernames are 1-30 letters/digits/underscores" (`.mw/context/capabilities/accounts/rules-trace.md:33`),
    but Python accepts something else. A parity test written from the rule, for example "reject
    `alice\n`", fails against Python, so under GRD-002 it never counts. A test written from
    Python's behaviour encodes a defect.
  - **A Rust port will differ.** In Rust's `regex` crate, `$` matches only at the end of the
    text (DERIVED, crate semantics; not executed here). So a straightforward port rejects these
    usernames, and the differential run in the falsifiedIf (`outcome.json:49`) fails.
  - **It is a spoofing path.** Two visually identical accounts can exist (`alice` and `alice\n`),
    which bears on security row 1 or 3 and on L1-accounts/BR-004 (uniqueness).
  - **The pack's text-parity work does not cover it.** RISK-010, NFR-010 and GRD-009 cover
    lookbehind, `\w`, `\b`, length, case and trimming, but not anchor semantics (`$`, and `\Z`
    versus `\z`).
- **What is needed (a human decision, not a reviewer one).** Decide whether the Rust build copies
  this quirk (strict parity, as the ticket's "no behaviour changes" suggests) or treats it as a
  defect (a behaviour change, so out of scope here or an explicit scope change). Record the
  answer, add the case to RISK-010 and NFR-010, and give L1-accounts/BR-001 a note. Also check
  every other `re` pattern in the codebase for `$` anchors. Only `USERNAME_PATTERN` uses one
  today, from a grep of `re.compile` in `minidon/`.

## Minor

### N-02 (Minor) RISK-010 and NFR-010 misdescribe the Rust side and miss the concrete divergences

- **Wrong claim.** RISK-010 (`risks.json:173`) and principle 11 (`principles.md:80-81`) contrast
  Python with "Rust's ASCII-only helpers" and "byte or ASCII defaults". Rust's standard library
  has Unicode `to_lowercase()` and `trim()`, and `regex` has Unicode `\w` and `\b` by default
  (DERIVED, crate and std semantics). The real risk is that the two Unicode definitions do not
  match, not that Rust is ASCII-only. Framed this way, a team that uses the Unicode Rust APIs
  would believe the risk is closed.
- **Concrete divergences I confirmed on the Python side by probing** (Rust side DERIVED):
  - **Whitespace set.** Python `str.isspace()` and `strip()` include U+001C to U+001F; Rust
    `char::is_whitespace` (Unicode White_Space) does not.
    - Probe: `POST /api/v1/statuses {"content": "\x1c"}` returned 422
      `{"error": "A status cannot be empty"}`.
    - A Rust `trim()` would keep the character and create the status. This affects
      L1-posting/BR-003 and email normalisation (`accounts/service.py:40`).
  - **`\w` set.** Python `\w` is `str.isalnum()` plus `_`. It excludes combining marks and
    includes other numerics.
    - Probes: `HASHTAG_PATTERN.findall("#café")` gives `['cafe']` (the tag stops before the
      combining accent), and `"#x²"` gives `['x²']`.
    - Rust `regex` `\w` (UTS #18) includes marks (Mn) and excludes `No`. So even an engine with
      lookbehind (for example fancy-regex) would give different tags. This affects
      L1-posting/BR-006, L1-timelines/BR-006 and mention-based visibility (security row 4).
- **Fix.** Reword RISK-010 and principle 11 to "Python's and Rust's Unicode definitions differ".
  List these cases, and N-01's anchor case, as named members of the NFR-010 Unicode input class.

### N-03 (Minor) Open-question answers are cited to the gate JSON, which does not contain them

- **Evidence.** `.mw/runs/BASELINE-2026-10-30/baseline-review-report.json` holds the seven CF
  resolutions, the domain sign-off and the rationale "CF-001..007 resolved, OQ-001..021
  answered". It holds **no** OQ answer text. The answers (for example OQ-001 "secure admin
  seeding", OQ-002 "8 -> 12", OQ-003 "600k or argon2id", OQ-009 "audit trail") appear only in
  `.mw/context/baseline-review-report.md:69-89`, which was written in the gate commit `7c552d6`.
  Its header still reads "Decision: PENDING" (`:7`, `:93`).
- **Affected.** GRD-004 (`outcome.json:266`, "OQ-003 gate answer" cited to the JSON), NFR-004
  (`nfr.json:34`), ASM-004 (`risks.json:37`), RISK-006 (`risks.json:137`), principle 8, and
  `security.md:43-44`.
- **Fix.** Cite `.mw/context/baseline-review-report.md` (Open Questions Review table) for OQ
  answers, and the JSON for CF resolutions. Ask the baseline owner to bring the .md header in
  line with the JSON decision, so the "artifact of record" does not say PENDING.

### N-04 (Minor) The pinned baseline was edited after confirmation, and the gap evidence still pins the old file

- **Evidence.**
  - Commit `1cbf445` (a human commit during research) rewrote 21 OQ answers, statuses and
    `resolvedAt` values in `.mw/context/baseline.json`. No baseline run or new baseline version
    recorded this; `outcome.json:9` still pins `BASELINE-2026-10-30`.
  - The current `baseline.json` SHA-256 is `19856663...`. GAP-010 to GAP-030 in `gaps.json` still
    give `b9ba4b95...` as resolution evidence, which is the hash of the DEMO-answer version from
    commit `6a4aed4`. Their resolution time (`2026-11-12T03:30Z`) is before the gate answers were
    copied in.
  - `gaps.md:3` says "Research version 16".
- **Impact.** The content of the decisions is now right (it matches the gate .md), so this is
  traceability, not substance. But the Gap Register still shows the questions closed on the
  strength of the superseded DEMO answers, which is the concern F-18 raised.
- **Fix.** The baseline owner records the post-gate correction (status `confirmed`, the
  confirmer, CF statuses `resolved`), ideally as a recorded baseline revision. A human then
  re-runs `millwright research scan` so the gap evidence points at the current file. Research
  must not edit `.mw/context/` itself.

### N-05 (Minor) MET-003 can fail by construction, the same shape as F-02

- **Evidence.** `outcome.json:127-133` sets target 54 and minAcceptable 54, while the method
  says "any test that cannot be expressed black-box ... does not count".
- **Impact.** If planning excludes even one test, MET-003 tops out at 53 and misses its target
  regardless of the Rust build. The risk is small: all 54 tests drive the HTTP client
  (`tests/conftest.py:20-36`), and the only clock patch is `tests/test_statuses.py:62-66`, which
  data timestamps can express. But the definition should not depend on that.
- **Fix.** Define the denominator as "black-box-expressible tests, listed in the traceability
  matrix", or state that all 54 are expected to be expressible and that any exclusion needs a
  human-approved change to the target.

### N-06 (Minor) ASM-002 and the estimate miss the sixth enum column

- **Evidence.** `minidon/moderation/models.py:24-27` defines `ModerationAction`, which is stored in
  `reports.action_taken` (`:40`). ASM-002 lists five enum columns: Role, Visibility,
  NotificationKind, ReportCategory and ReportState (`risks.json:19`). `estimate.json:15` says
  "5 enum types". There are six StrEnum types, all stored as columns.
- **Why it matters.** `DELETE_STATUS` (stored name) and `delete_status` (API value) differ by
  more than case. Repudiation parity (security row 7) reads `action_taken`. The probe in review
  001 confirmed that other enum columns store the name. That this one does too is DERIVED, by
  the same SQLAlchemy mechanism.
- **Fix.** Add `ModerationAction` / `reports.action_taken` to ASM-002, RISK-002, NFR-002 and ADR
  candidate 2, and change the estimate to 6.

### N-07 (Minor) Over-limit errors for two live rules are the framework validation body, which ADR candidate 3 may rule out of contract

- **Evidence.**
  - Code: `timelines/routes.py:14` (`Query(ge=1, le=MAX_LIMIT)`) and `notifications/routes.py:55`
    (`Query(40, ge=1, le=80)`). Python rejects; it does not clamp.
  - Probe: `GET /api/v1/timelines/public?limit=41` returned 422
    `{"detail": [{"type": "less_than_equal", "loc": ["query", "limit"], "msg": "Input should be less than or equal to 40", "input": "41", "ctx": {"le": 40}}]}`.
- **Impact.** Part of the behaviour of L1-timelines/BR-007 and L1-notifications/BR-009 ("caps
  at 80" in the Rules Index suggests clamping) is this Pydantic body. NFR-003 and ADR candidate 3
  treat "the exact validation body" as possibly not contract (`nfr.json:23`,
  `adr-candidates.md:11`). So the ADR 3 decision affects MET-001 itself, not only the behaviour
  outside the rules. The same applies to every endpoint where a missing or mistyped JSON field
  hits Pydantic before the DomainError checks.
- **Fix.** Note in NFR-003 and ADR candidate 3 that the validation body is the error path of
  live rules. Treat ADR candidate 3 as a prerequisite for those parity tests. Describe the limits
  as "reject above", not "cap".

### N-08 (Minor) Small number inconsistencies between files

- **Untested rules: 30, not 31.** RISK-004 (`risks.json:119`) and `estimate.json:17-18` count
  "about 31" rules without a cited test, out of 81. That includes the retired
  L1-posting/BR-009, which cites no test and gets no parity test (GRD-002). For the 80 live
  rules the figure is 50 of 80 cited and 30 to write. The effect on the estimate is negligible,
  but the denominator should match MET-001.
- **DERIVED count after the gate.** The pack counts 64 DERIVED or mixed of 81, from the
  rules-trace labels (`baseline-metrics.md:22`, ASM-005). The gate made L1-posting/BR-010 STATED,
  which the pack itself acknowledges (CON-001, `outcome-brief.md:156-157`). For the 80 live rules
  that gives 17 purely STATED (16 + BR-010) and 63 DERIVED or mixed. Also, 9 of the 64 are mixed
  `STATED`/`DERIVED`, so `outcome.json:15` and `outcome-brief.md:36-37` overstate when they say
  64 rules were "inferred from the code ... rather than documented".
- **Value stream versus estimate.** `value-stream.md:37-39` gives plan 2-4 d, build 14-28 d plus
  2-5 d, and acceptance 1 d, which is 19 to 38 d. The agentic total it cites is 16 to 34 d
  (`estimate.json:7-8`). Either plan and acceptance effort is outside the estimate (say so), or
  the steps double count.
- **Widening list.** `estimate.json:23-26` `widenedBy` lists GAP-006 and GAP-004 but not
  RISK-003, which is the only widening actually applied to the numbers (`:30`).

### N-09 (Minor) Some STATED labels still carry DERIVED content (I-05)

The F-04 items are fixed, but the same pattern remains elsewhere:

- RISK-006 is `STATED` (`risks.json:137-138`) and includes "access tokens stored in clear text".
  No gate answer names that as a follow-up, and `security.md:57-59` itself calls the
  recommendation DERIVED. Principle 8 (`principles.md:61-65`) has the same mix.
- `outcome-brief.md:33-34` labels "40 HTTP endpoints" STATED from `baseline-metrics.md`. That
  file has no endpoint count; the 40 is a route count from the code (DERIVED, correct).
  `estimate.json:15` says the same correctly ("from the code").
- `outcome.json:22-28` labels the `why` STATED, but it ends with an inference ("The value of this
  run is therefore proven parity").
- NFR-001, NFR-002 and NFR-004 are `STATED` while their text includes DERIVED parts: the
  normalisation, the reverse read direction, and credential continuity as a reading of "same
  data". Their `source` fields disclose this, but the label does not.
- ASM-005 is typed `assumption` but labelled `STATED`. It mixes a human decision (STATED), agent
  counts (DERIVED) and a DERIVED caveat.
- DEP-002 and CON-001 are agent observations of repository and file state, labelled STATED.

**Fix.** Where a claim is part ticket or gate and part inference, label it DERIVED with the
stated part as its source, or split it into two claims. A reader should be able to trust a
STATED label without reading the source field.

## Info

### N-10 (Info) Revision attribution and append-only audit trail

- Files and the commit message say research-agent revised the pack (for example
  `outcome-brief.md:3-4`, `risks.json:4`, commit `3011abd`). But the ledger entries for versions
  17 to 19 (seq 19-21) and the manifest entries for the revised files all record the human
  `kurtis.angell@...` as actor, and no ledger entry is by research-agent. For an I-14 audit, the
  record should show who authored a revision, not only who ran the snapshot.
- `history/reviews__research-review-001.v002.md` differs from the current review 001 only by a
  stray `z` before the title. v001, v003 and the current file share one hash, so review 001's
  content is unchanged. The edit and its revert are visible in the archive, as I-30 intends.
- `outcome.json:5` says `researchVersion: 18`, the manifest says 19, and `gaps.md:3` says 16.

### N-11 (Info) Duplicate rules across capabilities

L1-accounts/BR-009 and L1-moderation/BR-009 have the same title, "Suspended accounts cannot sign
in". L1-accounts/BR-014 (locked flag drives follow approval, "mechanism in Following") overlaps
L1-following/BR-002. Counting both of each pair in the 80 is defensible, because they are
separate baseline entries. But the traceability matrix should map each pair explicitly, so that
one test is not counted twice by accident and the two rules are not left to diverge.

### N-12 (Info) DEMO content: what a real team must replace

Judged as demo content. It is clearly disclosed (`reviewers.json:4`, `estimate.json:5`,
`decision-makers.md:3`, RISK-007). Before relying on the pack, a real team needs to:

- **Roster.** Name distinct PO, BA, Tech Lead and Security people, plus approvers for the plan
  and release gates. `decision-makers.md:12-15` still lists only the research and PRD gates. One
  person made every gate answer, every waiver and every decision in `human-decisions.md`.
- **Confirmation of DERIVED rules.** The human decision that one domain-level sign-off confirms
  all 64 DERIVED or mixed rules (ASM-005) is defensible for a demo. A real BA should confirm
  rule by rule, at least for the 55 purely DERIVED rules.
- **Estimate.** Calibrate against real delivery history (GAP-006 is waived) and the team's Rust
  experience. Price agent compute, which is excluded today (`estimate.json:5`). Replace the
  100-150 lines a day and 2-4 human days per capability figures with team data.
- **Target date.** The 2027-03-31 date is DERIVED from a DEMO estimate, with unknown gate waits
  on a single person. A real PO should set it.
- **The reason for Rust.** RISK-005 and `human-decisions.md` section 5 leave it open. A real PO
  must supply it, or explicitly accept a parity-only outcome.
- **GAP-005 condition.** "Revisit at cutover" should be a tracked item on the cutover ticket,
  not only a sentence in `security.md:67`.

---

## What the revision gets right

- **Both Critical findings are fixed consistently.** The 80 and its derivation appear in every
  file that uses the number, and the retired rule is handled explicitly in GRD-002, MET-002 and
  the capability deltas.
- **The gate record is the authority, and the pack is honest about what is not fixed.** It
  separates decisions ("whether") from design ("how") in ADR candidate 5. It lists the follow-ups
  out of scope. It names the open lane branches and the baseline upkeep as other owners' work.
- **I reproduced every count I checked:** 81, 17/64, the per-capability test-citation split, 40
  routes, 54 tests, 2,123 lines, the estimate sums, and the ledger times in `value-stream.md`.
- **The new security rows are precise and verifiable** against `moderation/service.py`.

## Recommendation for the human at the research gate

**Reviewer recommendation: no Critical findings remain. The pack can be judged on its merits
once two things are in place. The numbers and the outcome are now sound.**

1. **F-08, the open lane branches.** RESEARCH_ESTIMATE, RESEARCH_SECURITY and RESEARCH_FLOWS
   must be closed by their owning agents after design-agent and ux-context-agent review
   `security.md` and `flows/`. The run cannot move to RESEARCH_REVIEW until they are closed
   (`millwright next`, done-when). This review does not close or waive them.
2. **N-01 needs a human decision.** Copy Python's trailing-newline username behaviour, or treat
   it as a defect. Either answer changes what the parity test for L1-accounts/BR-001 asserts and
   what the differential run may show. Neither this reviewer nor research-agent can make that
   call.

The Minor findings (N-02 to N-09) can go into a short revision before the gate or be carried
into design as inputs. N-02, N-06 and N-07 belong with ADR candidates 1 to 3, and N-03 and N-04
with the baseline owner. The Info findings are housekeeping and DEMO content. Whether to approve,
send back or waive anything is the human's decision alone (I-23).
