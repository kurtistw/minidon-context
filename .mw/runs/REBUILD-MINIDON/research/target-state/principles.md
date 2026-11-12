# Target-state principles: REBUILD-MINIDON

Drafted by research-agent on 2026-11-12 and revised the same day after research review 001.
The design-agent lane may extend it; no design-agent review has happened yet. Each principle
says where it comes from: STATED (the ticket, the human baseline gate record
`.mw/runs/BASELINE-2026-10-30/baseline-review-report.json`, or `research/inputs/human-decisions.md`)
or DERIVED (inferred by research-agent). Rules are cited as capability/BR id.

## 1. Parity, not improvement

The Rust build does what the Python build does, including its known weaknesses. Any change to
behaviour is a separate ticket, and the follow-ups named at the baseline gate are recorded,
not built here. STATED: ticket.md, Out of scope; human-decisions.md section 3.

## 2. The baseline is the spec; the Python build is the oracle

Specs come from the 80 live rules in `.mw/context/capabilities/*/rules-trace.md` (81 rules
minus the retired `L1-posting/BR-009`), not from reading the Python code line by line. The
Python build at `e1fbd3a` settles any doubt about what a rule means, because every parity test
must pass against it first. STATED (ticket.md, Why; human-decisions.md section 1); the oracle
role is DERIVED from "serves as the reference".

## 3. Same data, no migration

Rust uses the SQLite schema and storage formats exactly as SQLAlchemy writes them today:
table and column names, enum columns stored as upper-case member names, naive UTC datetime
text, the password hash string and clear-text token keys. Data written by either build must be
readable by the other, and a schema Rust creates must match the one SQLAlchemy creates. STATED
(ticket.md, Scope); the two-way rule and the schema rule are DERIVED, so that a later cutover
can run both builds.

## 4. Code wins over documentation

Where the docs and the code disagree, Rust copies the code: a 60-minute edit window
(`L1-posting/BR-010`; CF-001 retired BR-009) and boosting only public and unlisted statuses
(`L1-posting/BR-016`, CF-007). Doc corrections are follow-ups. STATED: baseline gate record,
CF-001 and CF-007.

## 5. Prove behaviour at the HTTP boundary

Parity tests are black-box HTTP tests that run unchanged against both builds. Unit tests inside
Rust are welcome, but they do not count toward parity. DERIVED from ASM-003.

## 6. Keep the capability boundaries of the baseline

The Rust code keeps the six L1 capabilities as modules (accounts, following, posting,
timelines, notifications, moderation) plus a platform module for wiring, errors, config and
data access. The shared pieces follow the gate decisions: `get_by_username` is a stable
identity API owned by Accounts (CF-004); the social queries module is a plain module owned by
Following (CF-003); Moderation calls Posting's soft delete directly (CF-006). Design decides
only how these look in Rust. STATED: baseline gate record, CF-003, CF-004, CF-006; the module
layout is DERIVED.

## 7. Do not port what has no behaviour

The dead Lists code (`minidon/lists/`) is unreachable and is not ported. STATED: baseline gate
record, CF-002 (closes OQ-020 and OQ-021).

## 8. Carry weaknesses forward visibly

Weak password hashing, the 8-character minimum password, clear-text tokens,
first-registrant-becomes-Admin and staff deletes without an audit trail are kept for parity
and listed in `security.md` and `risks.json` (RISK-006), so they turn into follow-up tickets
instead of being forgotten. STATED for the follow-ups (gate answers OQ-001, OQ-002, OQ-003,
OQ-009); DERIVED for the way they are carried.

## 9. Time is an input

Rules that depend on time (edit window, rate limit, token expiry, ordering) are tested with
controlled timestamps, never by waiting. DERIVED from RISK-008.

## 10. Same configuration surface

The same environment variables (`MINIDON_DATABASE_URL`, `MINIDON_DOMAIN`), the same defaults
as `minidon/config.py`, and the same development address (`127.0.0.1:8000`). DERIVED from the
code at `e1fbd3a`.

## 11. Text means the same thing in both languages

Mentions, hashtags, length limits, lower-casing and trimming follow Python's Unicode semantics,
not Rust's byte or ASCII defaults. Non-ASCII input is a required parity-test class (NFR-010).
DERIVED from RISK-010.
