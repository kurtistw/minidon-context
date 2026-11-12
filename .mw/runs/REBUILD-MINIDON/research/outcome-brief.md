# Outcome brief: REBUILD-MINIDON

For the decision-maker at the research gate. Drafted by research-agent on 2026-11-12.
Machine-readable version: `outcome.json` (OUT-001). Claims are STATED (the ticket, the
baseline, the research inputs) or DERIVED (inferred by research-agent), as marked.
The reviewer roster and the estimate are DEMO content.

## The outcome

A Rust build of minidon, in the new repository `minidon-rust`, that passes a parity test for
every one of the 82 baseline rules and runs on existing minidon data without migration. It is
then ready for a separate cutover ticket.

## The problem

minidon runs on Python: FastAPI and SQLAlchemy on SQLite, 2,123 source lines, 6 capabilities,
82 rules and 40 HTTP endpoints (STATED, `research/inputs/baseline-metrics.md` and the code at
`e1fbd3a`). The team wants it on Rust. The danger of a rewrite is silent change: behaviour that
quietly differs, or data the new build reads differently. The baseline had 21 open questions
and 7 conflicts between docs and code. Nobody has measured how many rules the Python tests
cover. Today, 0 of the 82 rules are proven in Rust, because `minidon-rust` has no commits yet.

## Why

The ticket asks for a move from Python to Rust with feature parity on the same data (STATED).
It does not say why Rust is wanted, and it does not ask for performance parity. So the value of
this run is proven sameness, not a user-facing change. **Decision needed:** if the real reason
is performance, cost or safety, say so now. Nothing in this pack measures it, and the Python
build has no performance baseline (RISK-005).

## Value hypothesis (DERIVED)

For minidon's maintainers, the delivery team and current API clients: if every capability is
rebuilt in Rust from the baseline specs, each rule gets a black-box parity test that passes
against Python first, and Rust uses the existing data formats, then all 82 rules pass against
Rust with 0 migrations. Cutover can then be planned without finding the behaviour again.

It rests on four assumptions (`risks.json`):

- ASM-001: the 82 rules cover all observable behaviour.
- ASM-002: Rust can match SQLAlchemy's SQLite formats exactly.
- ASM-003: parity can be proven over HTTP, with Python as the oracle.
- ASM-004: the demo answers ("copy current behaviour") hold.

**It is proven wrong if**, by 2027-03-31, any of these happens:

- fewer than 82 of 82 rules pass;
- any migration is needed;
- a side-by-side run of the same requests on the same data shows a difference that no rule
  explains. That would mean the rules do not describe everything minidon does.

## Metrics

| ID | Metric | Role | Baseline (date, source) | Target (minimum) by |
|---|---|---|---|---|
| MET-001 | Baseline rules passing parity against Rust | outcome | 0 of 82 (2026-11-12, DERIVED: empty repo) | 82 (82) by 2027-03-31 |
| MET-002 | Capabilities with every rule passing | leading | 0 of 6 (2026-11-12, DERIVED) | 6 (6) by 2027-03-31 |
| MET-003 | Python test functions with a passing Rust equivalent | leading | 0 of 54 (2026-11-12, DERIVED) | 54 (54) by 2027-03-31 |
| MET-004 | Migrations needed to run Rust on existing data | guardrail | 0 (2026-11-12, DERIVED: no migration tool in Python) | stays 0 |
| MET-005 | Commits to the Python repo made by this run | guardrail | 0 (2026-11-12, DERIVED: HEAD is e1fbd3a) | stays 0 |
| MET-006 | Baseline open questions without a decision | leading | 21 (2026-11-11, STATED) | 0 by 2027-01-15; 5 deferred to design today |

The target equals the minimum for the parity metrics on purpose: a partial port is not parity.
The target dates are DERIVED from the estimate. They are not commitments.

Not measured, and not metrics here: latency and throughput (not required, never measured) and
rules covered by an automated Python test (planning task, `baseline-metrics.md`). If either
should become a metric, it needs a gap and a measurement of the Python build first.

## Scope

In: all 6 capabilities, the shared platform behaviour (wiring, error mapping, auth, config),
the existing data formats including password hashes and tokens, and a parity suite that runs
against both builds.

Out: cutover and parallel running, any change to the Python repo, the orphaned Lists code,
stronger password hashing, and fixing the README.

## What you are accepting

- Known weaknesses are copied on purpose and become follow-up tickets (RISK-006,
  `security.md`): 100,000-iteration PBKDF2, tokens stored in clear text, the first registrant
  becoming Admin, and staff able to delete any status.
- Where the docs and the code disagree, the code wins: a 60-minute edit window, and boosting
  only public and unlisted statuses.
- Every open-question answer is a DEMO proposal pending human review. Reversing one changes the
  scope (RISK-001).
- One person holds every role (RISK-007). This is a DEMO roster.

## Things to fix in the baseline record

- `baseline.json` still says status `draft`, with no confirmer and all 7 conflicts `open`
  (CON-001).
- Its rule count for Notifications says 9, while the rules-trace has 10. The total is 81
  against 82 (CON-002). This pack uses 82.

## Estimate (DEMO, DERIVED)

- Agentic: 12 to 25 person-days.
- Traditional: 35 to 60 person-days.

These are human effort only. There is no delivery history, so the ranges are wide
(`estimate.json`).
