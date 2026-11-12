# ADR candidates: REBUILD-MINIDON

Optional. Drafted by research-agent on 2026-11-12 as input for the design activity, revised the
same day after research review 001. All DERIVED. None of these may change external behaviour.
The design-agent lane has not reviewed this list yet.

| # | Decision | Why it is needed | Source |
|---|---|---|---|
| 1 | Rust platform: toolchain version, web framework, async runtime, SQLite driver, regex engine, deployment target | Open question in the ticket; blocks code planning. The regex engine must support lookbehind and Unicode `\w` and `\b`, or the patterns must be re-expressed and proven equal (RISK-010) | DEP-003, ticket.md, NFR-010 |
| 2 | How the Rust data layer reproduces SQLAlchemy's SQLite formats: enum columns stored as upper-case member names (`'ADMIN'`, `'PRIVATE'`) in VARCHAR sized to the longest name, the API returning the lower-case value; naive UTC datetime text `YYYY-MM-DD HH:MM:SS.ffffff`, serialised as naive ISO with `T`; ids; and whether Rust may create the schema at all (NFR-011) | Same data, no migration | ASM-002, RISK-002, research-review-001 F-09 |
| 3 | Which framework-level HTTP behaviours are contract: the two 422 body shapes (`{"error": msg}` and `{"detail": [...]}`), JSON datetime format, null handling, trailing slashes, the `{"detail": "Not Found"}` 404 and 405 bodies, and the `/openapi.json`, `/docs` and `/redoc` routes | Otherwise parity is undefined outside the 80 live rules | RISK-003, NFR-003 |
| 4 | Parity harness: one suite run against both builds, response normalisation, data-timestamp control for the Python side, Unicode input class | The acceptance criterion depends on it | ASM-003, NFR-001, NFR-005, NFR-010 |
| 5 | Rust shape of the decisions already made at the baseline gate: `get_by_username` as a stable identity API owned by L1-accounts (CF-004); the social queries module as a plain module owned by L1-following (CF-003); Moderation calling Posting's soft delete directly, with the boost cascade (CF-006) | The decisions are made (STATED, gate record); only their Rust form is open | baseline-review-report.json CF-003, CF-004, CF-006 |

Earlier candidates 5, 6 and 7 (OQ-005, OQ-017, OQ-018) asked design to decide these questions.
The baseline gate had already decided them, so they are folded into candidate 5 as "how", not
"whether".
