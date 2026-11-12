# Target-state principles: REBUILD-MINIDON

Drafted by research-agent on 2026-11-12 (the design-agent lane may extend it). Each principle
says where it comes from: STATED (the ticket, or a DEMO answer in `.mw/context/baseline.json`)
or DERIVED (inferred by research-agent).

## 1. Parity, not improvement

The Rust build does what the Python build does, including its known weaknesses. Any change to
behaviour is a separate ticket. STATED: ticket.md, Out of scope; DEMO answers OQ-001 to OQ-016.

## 2. The baseline is the spec; the Python build is the oracle

Specs come from the 82 rules in `.mw/context/capabilities/*/rules-trace.md`, not from reading
the Python code line by line. The Python build at `e1fbd3a` settles any doubt about what a rule
means, because every parity test must pass against it first. STATED (ticket.md, Why); the
oracle role is DERIVED from "serves as the reference".

## 3. Same data, no migration

Rust uses the SQLite schema and storage formats exactly as SQLAlchemy writes them today:
table and column names, enum storage, naive UTC datetime text, the password hash string and
clear-text token keys. Data written by either build must be readable by the other. STATED
(ticket.md, Scope); the two-way rule is DERIVED, so that a later cutover can run both builds.

## 4. Code wins over documentation

Where the docs and the code disagree, Rust copies the code: a 60-minute edit window (CF-001)
and boosting only public and unlisted statuses (CF-007). Doc corrections are follow-ups.
STATED: DEMO answers OQ-007 and OQ-008.

## 5. Prove behaviour at the HTTP boundary

Parity tests are black-box HTTP tests that run unchanged against both builds. Unit tests inside
Rust are welcome, but they do not count toward parity. DERIVED from ASM-003.

## 6. Keep the capability boundaries of the baseline

The Rust code keeps the six L1 capabilities as modules (accounts, following, posting,
timelines, notifications, moderation) plus a platform module for wiring, errors, config and
data access. How the shared pieces look (the social queries module, identity resolution,
Moderation calling Posting's delete) is an ADR decision, not a research decision. STATED:
DEMO answers OQ-005, OQ-017, OQ-018 (deferred to design).

## 7. Do not port what has no behaviour

The orphaned Lists code (`minidon/lists/`) is unreachable and is not ported. STATED: DEMO
answer OQ-021.

## 8. Carry weaknesses forward visibly

Weak password-hashing parameters, clear-text tokens and first-registrant-becomes-Admin are kept
for parity and listed in `security.md` and `risks.json` (RISK-006), so they turn into follow-up
tickets instead of being forgotten. DERIVED.

## 9. Time is an input

Rules that depend on time (edit window, rate limit, token expiry, ordering) are tested with
controlled timestamps, never by waiting. DERIVED from RISK-008.

## 10. Same configuration surface

The same environment variables (`MINIDON_DATABASE_URL`, `MINIDON_DOMAIN`) and the same
defaults as `minidon/config.py`. DERIVED from the code at `e1fbd3a`.
