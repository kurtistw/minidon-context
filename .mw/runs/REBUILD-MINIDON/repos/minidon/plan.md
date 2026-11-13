# Repo plan: minidon (Python reference) - REBUILD-MINIDON story 1, L1-accounts

Author: code-plan-agent. Label key (I-05): STATED = a person, the ticket or a recorded human decision said it. DERIVED = inferred by an agent, open to challenge.

## Decision: NO CHANGE to this repository

- STATED (CLAUDE.md, ticket.md): `/Users/kurtis/tw/test-mw/minidon` (Python, backend, read-only reference, pinned at `e1fbd3a9c8d863086cb9e4005b411d7c33c91488`) is the parity oracle only. No file is ADDED, MODIFIED or REMOVED. Estimated files changed: 0 (impact.json `estimatedFiles: 0`).
- STATED (spec.md section 2): Delta is ADDED in minidon-rust only. MODIFIED none, REMOVED none. All 14 rules L1-accounts/BR-001..BR-014 stay live in Python.
- Why: the Rust build is judged against the unmodified Python behaviour. Any edit here would move the oracle (adr-001 D4, OP-07).

## How the oracle is used (all work happens outside this repo)

DERIVED from adr-001 D4, test-plan section 2:

- The parity harness (in minidon-rust, see its plan wave 5) starts Python from a copy of the reference or from a working directory outside the repo. `MINIDON_DATABASE_URL` is always set, `PYTHONDONTWRITEBYTECODE=1`, dependencies come from `uv sync --frozen`. Resolved versions go into the parity report.
- Python owns the schema (adr-001 D2). Test databases and the synthetic dataset (OP-09) are created by running the Python app against a database file outside this repo. Rust never creates DDL.
- Python time is controlled by the harness (libfaketime, or rewriting stored timestamps in the database copy). No change to `minidon/db.py` `utcnow`.
- Proof of no write (MET-005, extended by adr-001 D4): `git status --ignored` clean and a file-tree checksum equal before and after every harness run (ignored `minidon.db` and `__pycache__` would otherwise hide a write, I-29).
- Every parity test must first pass against this build (test-first loop). If Python disagrees with a scenario, Python wins and the scenario text is corrected.

## Read-only reference map (DERIVED, for the builder; not files to change)

| Reference file | Used for | Rules |
|---|---|---|
| `minidon/accounts/service.py` | validation, hashing, register, sign-in, token, lookup, profile update | BR-001..BR-013 |
| `minidon/accounts/models.py` | table and column formats, enum names, locked flag | BR-006, BR-014, REQ-017 |
| `minidon/accounts/routes.py`, `schemas.py` | five routes, response shapes | REQ-019 |
| `minidon/deps.py` | Authorization header parsing, optional vs required account | BR-011 |
| `minidon/errors.py`, `minidon/main.py` | domain error to `{"error": msg}` mapping | REQ-019 |
| `minidon/config.py` | `token_ttl_days=30`, env vars and defaults | BR-010 |
| `minidon/db.py` | `utcnow()` naive UTC, SQLite storage | REQ-017 |
| `tests/test_accounts.py` | existing Python tests, a source for scenarios only | all |

## Files

None. (No changes: no ADDED, MODIFIED or REMOVED entries.)

## Order

Not applicable. This repo has no build waves. It must be available and unchanged before minidon-rust wave 5 (parity harness) starts.
