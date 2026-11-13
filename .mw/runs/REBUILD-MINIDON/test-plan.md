# Test plan: REBUILD-MINIDON story 1, L1-accounts

Owner: qa-planning-agent. Label key (I-05): STATED = said by a person, ticket or human decision. DERIVED = inferred by an agent, open to challenge. Rules are cited as capability plus id (for example `L1-accounts/BR-006`), not by spec section number, because the spec is being written in parallel.

## 1. Scope

- STATED: story 1 of 6, capability `L1-accounts`, the 14 live rules `BR-001` to `BR-014` (none retired). Source: plan-onepager.md section 2.
- STATED: acceptance is a parity test per rule that passes against the Rust build (one-pager section 4). DERIVED: each test must first pass against the Python reference (NFR-001).
- STATED: five endpoints in scope: `POST /api/v1/accounts`, `POST /api/v1/auth/token`, `GET` and `PATCH /api/v1/accounts/me`, `GET /api/v1/accounts/{username}`. (Source: accounts capability.md, integration points.)
- Out of scope: other capabilities, cutover, performance (STATED, OP-02), real user data, fixing known weaknesses.

## 2. Test approach (STATED where decided, else DERIVED)

- STATED (OP-07): the parity harness runs the same requests against Python and Rust, normalises ids and timestamps, uses a fixed clock, includes non-ASCII cases, and only reads the Python repository, never writes inside it.
- STATED (OP-09): a synthetic dataset generated from the Python app is the compatibility data. No real user data.
- STATED (OP-06): error body shapes, the date format, and 404 and 405 bodies are contract and compared as is. Auto-generated docs routes are not contract and are not tested.
- STATED (OP-02): performance is not tested. DERIVED: a gross-slowness check is the suite finishing in normal time, no benchmark is built.
- STATED (OP-05): Rust reads and writes the existing stored formats and never creates or migrates the schema. DERIVED: a test checks that Rust refuses to start on an empty database without a schema, or that this is explicitly recorded as design output (NFR-011).
- DERIVED: the harness starts each build as a process on its own copy of one database file. Python code is never modified. Time control on the Python side uses libfaketime or controlled timestamps in the database copy. Rust has an injectable clock. The fixed clock is `T0 = 2026-01-01 00:00:00 UTC`.
- DERIVED: tests that need a suspended account seed `suspended_at` directly in the database copy, so Accounts can be proven without Moderation code (assumption A-02).
- DERIVED: the normaliser is itself unit-tested (it must not hide real differences: ids, timestamps and token values are replaced, nothing else).

## 3. Pyramid and layers (DERIVED, pyramid-balance)

| Layer | What it proves | Tooling | Share of tests |
|---|---|---|---|
| UNIT | Pure logic: username pattern, case folding, trimming, code-point length limits, hash format, token shape, expiry comparison | `cargo test` in minidon-rust | about 40 percent |
| INT | Service plus SQLite: uniqueness, first-admin, include-suspended lookups, token validity, partial update | `cargo test` with a temp SQLite copy | about 20 percent |
| PARITY | Same HTTP request to both builds, compared after normalisation. This is the acceptance layer for every rule | dual-target black-box suite | about 30 percent |
| COMPAT | Data round trip between builds, hash and token cross-verification, stored formats, synthetic dataset | CI job with one shared database file | about 10 percent |

Rationale: logic rules (formats, limits, hashing) are cheapest and most precisely proven at UNIT. Rules that need storage state (uniqueness, admin, suspension) go to INT. Parity is the stated acceptance, so every one of the 14 rules has at least one PARITY test, except where it cannot (BR-007 random salt: UNIT known-answer plus COMPAT cross-verify, see section 4). Nothing is proven only at the top layer that a lower layer could prove (I-08).

## 4. Rule to layer map (I-08)

Full criterion to test mapping is in traceability.json. Scenario ids are in scenarios.md.

| Rule | Label | Scenarios | Layers (every one states its layer) |
|---|---|---|---|
| L1-accounts/BR-001 | STATED | SC-ACC-001..004 | PARITY, UNIT |
| L1-accounts/BR-002 | DERIVED | SC-ACC-005, 006 | PARITY, UNIT |
| L1-accounts/BR-003 | DERIVED | SC-ACC-007 | PARITY, UNIT |
| L1-accounts/BR-004 | DERIVED | SC-ACC-008, 009 | PARITY, INT |
| L1-accounts/BR-005 | DERIVED | SC-ACC-010 | PARITY, INT |
| L1-accounts/BR-006 | DERIVED | SC-ACC-011, 012 | PARITY, INT, COMPAT |
| L1-accounts/BR-007 | DERIVED | SC-ACC-013, 014, 015 | UNIT, COMPAT (no PARITY: salt is random, stored hashes cannot be compared) |
| L1-accounts/BR-008 | DERIVED | SC-ACC-016 | PARITY, INT |
| L1-accounts/BR-009 | STATED | SC-ACC-017 | PARITY, INT |
| L1-accounts/BR-010 | DERIVED | SC-ACC-018, 019 | PARITY, INT, UNIT |
| L1-accounts/BR-011 | DERIVED | SC-ACC-020, 021 | PARITY, INT |
| L1-accounts/BR-012 | DERIVED | SC-ACC-022 | PARITY, INT |
| L1-accounts/BR-013 | DERIVED (limits), STATED (fields) | SC-ACC-023..026 | PARITY, UNIT, INT |
| L1-accounts/BR-014 | STATED (field), DERIVED (mechanism) | SC-ACC-027 | PARITY, INT, COMPAT (storage and exposure only) |

Result: 14 of 14 rules mapped, 14 of 14 have a scenario, 13 of 14 have a PARITY test (BR-007 is the stated exception with its reason).

## 5. Required parity test: trailing-newline username (STATED)

- Scenario `SC-ACC-004`, test ids `PT-ACC-004a` to `PT-ACC-004f` (PARITY) and `UT-ACC-004` (UNIT on the pattern).
- Source: human decision 2026-11-13 (human-decisions.md section 5, one-pager section 4). This test is REQUIRED and the story cannot be called done without it passing against both builds.
- The Rust build must accept `"alice\n"` exactly as Python does and the test must fail if Rust rejects it. The regex engine choice (OP-03: `regex` crate, `fancy-regex` fallback) is checked by this test. DERIVED: the unit test also covers the neighbouring cases (two newlines, CRLF, newline in the middle) so an over-broad fix would also fail.
- The Rust code must carry a comment that the behaviour is deliberate (review check, listed in traceability.json under `review_checks`).
- When the follow-up fix lands after cutover, this test is expected to change in both builds. It then needs an explicit decision and is not silently edited.

## Unprovable requirements

I-09, DERIVED. Each item below cannot be proven by any test layer.

1. That the 14 rules are all of Accounts' behaviour (ASM-001, A-01). Scenarios SC-ACC-028 to 030 sample the surface, they cannot prove completeness.
2. Performance and resource use (NFR-007, OP-02). No baseline exists and none is required.
3. Behaviour on real legacy data. Only the synthetic dataset is used (OP-09, DEP-005).
4. The follow-request behaviour driven by the locked flag (`L1-accounts/BR-014`, mechanism owned by `L1-following/BR-002`). Proven in story 2. Here only storage and exposure are proven.
5. That PBKDF2 stored hashes are bit-identical across builds. Impossible by design (random salt). Proven instead by known-answer vectors and cross-verification.
6. Real wall-clock behaviour of the 30-day token lifetime. Proven with a controlled clock only.
7. Business reason for Rust and success beyond parity (OP-01). Not a testable requirement.
8. Concurrency behaviour (NFR-008) is a smoke test outside this story's per-rule acceptance.
9. Accepted weaknesses (no sign-in throttling, username enumeration, no body size limit, 500 cases in Python) are not tested as defects. Where Python returns 500, behaviour is recorded and the parity decision goes to design (OP-08).

## 7. Non-functional coverage for this story (DERIVED)

| NFR | Coverage in story 1 |
|---|---|
| NFR-001 parity | All PARITY tests, 14 rules |
| NFR-002, 004 compat and credentials | SC-ACC-015, 027, 029, 030 |
| NFR-003 error shapes | SC-ACC-028 and the error bodies in each rule scenario |
| NFR-005 time determinism | SC-ACC-018, suite run 10 times with no difference |
| NFR-010 text parity | SC-ACC-003, 004, 006, 007, 025 |
| NFR-011 schema | one test that Rust does not create or alter the schema (OP-05) |
| NFR-007 performance | not tested (STATED, OP-02) |
| NFR-006 quality gates | CI, not a scenario |

## 8. Entry, exit and flakiness

- Entry: spec for L1-accounts available, harness skeleton exists, synthetic dataset generated by Python.
- Exit: all 30 scenarios implemented, green against Python first and then Rust, 14 of 14 rules traced, the trailing-newline test green on both, suite stable over 10 repeated runs, no skipped or quarantined test.
- DERIVED: no sleeps. Time is controlled. Any flaky test is fixed, not retried.
- Test-first (DERIVED): each test is written and seen to pass on Python, then seen to fail on Rust (red), then made green.

## 9. Risks to the test approach (DERIVED)

- Python `re` versus Rust regex differences (Unicode `\w`, `$` semantics): covered by SC-ACC-003, 004, 025.
- Normaliser hides a real difference: covered by normaliser unit tests.
- Python time control without code change (libfaketime availability on the CI image): fallback is rewriting stored timestamps in the database copy.
- Single person holds all review roles in the demo setup, which weakens independent review of this plan (I-14 still applies: the author of this plan does not review it).
