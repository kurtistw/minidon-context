# Outcome brief: REBUILD-MINIDON

For the decision-maker at the research gate. Drafted by research-agent on 2026-11-12 and
revised the same day after research review 001 (`research/reviews/research-review-001.md`).
Machine-readable version: `outcome.json` (OUT-001). Claims are STATED (the ticket, the human
baseline gate record, the research inputs) or DERIVED (inferred by research-agent), as marked.
The reviewer roster and the estimate are DEMO content. Rules are cited as capability/BR id,
for example `L1-accounts/BR-006`, because ids restart in each capability.

## What changed in this revision

- **Parity denominator 80, not 82.** The baseline has 81 rules counted as (capability, BR id)
  pairs. The old 82 counted a reference to a Following rule in the Notifications file as a tenth
  Notifications rule. `L1-posting/BR-009` (30-minute edit window) was retired at the baseline
  gate and cannot pass against Python, so the target is 80 of 80. CON-002 is retracted.
- **The human gate record is the authority** for baseline decisions
  (`.mw/runs/BASELINE-2026-10-30/baseline-review-report.json`). The questions the old pack sent
  to design (OQ-005, OQ-017, OQ-018) were already decided there. The gate follow-ups are now
  listed as out of scope.
- **Added:** error codes 409 and 429; a risk and an NFR for Python versus Rust text semantics
  (RISK-010, NFR-010); an NFR for schema creation (NFR-011); the answer on DERIVED rules (ASM-005).
- **Dropped MET-006.** All 21 open questions were answered at the gate, so it measured nothing.
- **Estimate arithmetic fixed** (still DEMO).

## The outcome

A Rust build of minidon, in the new repository `minidon-rust`, that passes a parity test for
every one of the **80 live baseline rules** and runs on existing minidon data without
migration. It is then ready for a separate cutover ticket.

## The problem

minidon runs on Python: FastAPI and SQLAlchemy on SQLite, 2,123 source lines, 6 capabilities,
81 rules (80 live) and 40 HTTP endpoints (STATED, `research/inputs/baseline-metrics.md` and the
code at `e1fbd3a`). The team wants it on Rust. The danger of a rewrite is silent change:
behaviour that quietly differs, or data the new build reads differently. 64 of the 81 rules
were inferred from the code, not documented. The baseline needed 21 open questions and 7
doc-versus-code conflicts settled by a human. Python and Rust handle text differently (regex,
string length, case). Only about 50 of the 81 rules cite an existing Python test (DERIVED).
Today, 0 of the 80 rules are proven in Rust, because `minidon-rust` has no commits yet.

## Why

The ticket asks for a move from Python to Rust with feature parity on the same data (STATED).
**The business reason for Rust is still not stated.** The human decisions of 2026-11-12 record
it as open, for the PO to supply (`research/inputs/human-decisions.md`, section 5). So the value
of this run is proven sameness, not a user-facing change. **Decision needed:** if the real
reason is performance, cost or safety, say so. Nothing in this pack measures it, and the Python
build has no performance baseline (RISK-005). This pack does not guess a reason.

## Value hypothesis (DERIVED)

For minidon's maintainers, the delivery team and current API clients: if every capability is
rebuilt in Rust from the baseline specs, each live rule gets a black-box parity test that
passes against Python first, and Rust uses the existing data formats, then all 80 live rules
pass against Rust with 0 migrations. Cutover can then be planned without finding the
behaviour again.

It rests on four assumptions (`risks.json`):

- ASM-001: the 80 live rules cover all observable behaviour.
- ASM-002: Rust can match SQLAlchemy's SQLite formats exactly.
- ASM-003: parity can be proven over HTTP, with Python as the oracle.
- ASM-004: the baseline gate decisions ("copy current behaviour, record follow-ups") stand.

**It is proven wrong if**, by 2027-03-31, any of these happens:

- fewer than 80 of the 80 live rules pass;
- any migration is needed;
- a side-by-side run of the same requests (including non-ASCII text) on the same data shows a
  difference that no rule explains. That would mean the rules do not describe everything
  minidon does.

## Metrics

| ID | Metric | Role | Baseline (date, source) | Target (minimum) by |
|---|---|---|---|---|
| MET-001 | Live baseline rules passing parity against Rust | outcome | 0 of 80 (2026-11-12, DERIVED: empty repo) | 80 (80) by 2027-03-31 |
| MET-002 | Capabilities with every live rule passing (Posting needs 19 of 19) | leading | 0 of 6 (2026-11-12, DERIVED) | 6 (6) by 2027-03-31 |
| MET-003 | Python test functions whose behaviour a black-box parity test covers | leading | 0 of 54 (2026-11-12, DERIVED) | 54 (54) by 2027-03-31 |
| MET-004 | Migrations needed to run Rust on existing data | guardrail | 0 (2026-11-12, DERIVED: no migration tool in Python) | stays 0 |
| MET-005 | Commits on any branch since `e1fbd3a`, plus uncommitted changes, in the Python repo | guardrail | 0 (2026-11-12, DERIVED: HEAD is e1fbd3a, tree clean) | stays 0 |

MET-001 counts (capability, BR id) pairs from the rules-trace files, minus retired rules. The
target equals the minimum for the parity metrics on purpose: a partial port is not parity.
The target dates are DERIVED from the estimate. They are not commitments.

MET-003 is not a one-to-one translation: the Python tests run in-process with an in-memory
database and one monkeypatched clock, which a black-box harness cannot do. Clock-dependent
tests are re-expressed with data timestamps.

Not measured, and not metrics here: latency and throughput (not required, never measured).
Rule-to-test coverage is now roughly known (about 50 of 81, DERIVED, RISK-004) and sizes the
estimate; planning confirms it per rule.

## Which rules are DERIVED (the ticket's open question)

| Capability | Rules | Purely STATED | DERIVED or mixed |
|---|---|---|---|
| L1-accounts | 14 | 2 | 12 |
| L1-following | 15 | 4 | 11 |
| L1-posting | 20 | 4 | 16 |
| L1-timelines | 8 | 2 | 6 |
| L1-notifications | 9 | 2 | 7 |
| L1-moderation | 15 | 3 | 12 |
| **Total** | **81** | **17** | **64** |

Source: the Rules Index of each `rules-trace.md`, as in `baseline-metrics.md`. The 17 purely
STATED rules are listed in ASM-005. **Decision (STATED, human-decisions.md section 4):** the
L0-minidon domain sign-off at the baseline gate on 2026-11-10 counts as human confirmation of
the DERIVED rules, so none is left unconfirmed. Parity tests check what Python does, so the
test approach does not change. Caveat (DERIVED): that sign-off was one domain-level approval by
a DEMO reviewer, not a rule-by-rule review.

## Scope

In: all 6 capabilities, the shared platform behaviour (wiring, error mapping with 400, 401,
403, 404, 409, 422 and 429, both 422 body shapes, auth, config), text handling with Python's
Unicode semantics, the existing data formats including password hashes and tokens, a parity
suite that runs against both builds, and the gate decisions on shared code (Accounts owns the
identity API; Moderation calls Posting's delete directly; the social queries module stays a
plain module owned by Following).

Out: cutover and parallel running, any change to the Python repo, the dead Lists code, and the
follow-ups named at the baseline gate: secure admin seeding (OQ-001), a 12-character minimum
password (OQ-002), stronger password hashing (OQ-003), an audit trail for staff deletes (OQ-009),
a test guard for new notification kinds (OQ-012), README and ADR-001 fixes (OQ-010, OQ-015,
CF-001, CF-007), documenting the identity contract (CF-004) and the boost cascade (CF-006),
deleting `minidon/lists/` (CF-002), and adopting "Relationship" as the official term (OQ-006,
which the Rust build simply uses).

## What you are accepting

- Known weaknesses are copied on purpose and become follow-up tickets (RISK-006,
  `security.md`): 100,000-iteration PBKDF2, an 8-character minimum password, tokens stored in
  clear text, the first registrant becoming Admin, and staff deletes without an audit trail.
- Where the docs and the code disagree, the code wins, as decided at the gate: a 60-minute
  edit window (`L1-posting/BR-010`), and boosting only `public` and `unlisted` statuses
  (`L1-posting/BR-016`).
- All gate decisions and the decisions in `human-decisions.md` come from one person
  (RISK-007). This is a DEMO roster, and a reversal by a real reviewer changes the scope
  (RISK-001).

## Not yet done (outside research-agent's remit)

- The parallel research branches are still open. `security.md` belongs to design-agent and
  `flows/` to ux-context-agent; research-agent drafted both, and each file now says so and lists
  what a lane review should check. Those agents need to review their files and close their
  branches. RESEARCH_ESTIMATE is research-agent's branch; closing it is a transition this
  revision did not run.

## Things to fix in the baseline record (baseline owner, not research)

- `baseline.json` was not updated after the gate: status `draft`, no confirmer, and all 7
  conflicts still `open` (CON-001). The decisions themselves are recorded and current.
- The Posting rules-trace still labels `L1-posting/BR-010` DERIVED and CF-001 "Unresolved",
  although the gate made BR-010 STATED.

## Estimate (DEMO, DERIVED)

- Agentic: 16 to 34 person-days.
- Traditional: 34 to 79 person-days.

These are human effort only, with the step-by-step arithmetic in `estimate.json`. There is no
delivery history, so the ranges are wide.
