# ADR candidates: REBUILD-MINIDON

Optional. Drafted by research-agent on 2026-11-12 as input for the design activity. All DERIVED.
None of these may change external behaviour.

| # | Decision | Why it is needed | Source |
|---|---|---|---|
| 1 | Rust platform: toolchain version, web framework, async runtime, SQLite driver, deployment target | Open question in the ticket; blocks code planning | DEP-003, ticket.md |
| 2 | How the Rust data layer reproduces SQLAlchemy's SQLite formats (enum storage, naive UTC datetime text, ids) | Same data, no migration | ASM-002, RISK-002 |
| 3 | Which framework-level HTTP behaviours are contract (422 body shape, JSON datetime format, null handling, trailing slashes) | Otherwise parity is undefined outside the 82 rules | RISK-003, NFR-003 |
| 4 | Parity harness: one suite run against both builds, response normalisation, clock control | The acceptance criterion depends on it | ASM-003, NFR-001, NFR-005 |
| 5 | Shared social queries module: formal shared contract or internal module | Deferred from baseline | OQ-005, CF-003 |
| 6 | How Moderation deletes a reported status: call Posting's delete or a narrower API | Deferred from baseline | OQ-017, CF-006 |
| 7 | Identity resolution (get_by_username) as a stable internal API | Deferred from baseline | OQ-018, CF-004 |
