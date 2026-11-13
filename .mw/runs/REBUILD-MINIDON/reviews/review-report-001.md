# Review report 001: REBUILD-MINIDON story 1 (L1-accounts), CHANGE_REVIEW

- Reviewer: review-agent (independent, I-14). I did not write the code, the tests or the plans.
- Code under review: `/Users/kurtis/tw/test-mw/minidon-rust`, branch `story-1-accounts`, head `cbc42e0` (28 commits, all of `src/` and `tests/` is new).
- Reference: `/Users/kurtis/tw/test-mw/minidon` at `e1fbd3a9c8d863086cb9e4005b411d7c33c91488`. Read only. Nothing was written there (checked with `git status --short --ignored` at the start and the end: only the `.venv/` and `__pycache__/` entries, all dated 2026-10-28, before this run).
- Inputs read: `ir/spec.json` via `spec/spec.md` (19 requirements, BR-001 to BR-014), `adr/adr-001.md`, `adr/adr-002.md`, `test-plan.md`, `traceability.json`, `impact.json`, `coverage-delta.json`, `build/wave-0-1.md` to `build/wave-6.md`, every file under `src/`, the parity and compat harness and the test files named below.
- Human decisions in adr-001 section 5 (1 to 10) are taken as given. Deviations they cover are not findings.
- Label key (I-05): STATED = I measured or read it, with the source given. DERIVED = my inference, open to challenge.

## Verdict

**Approve with findings.**

No critical findings. One major finding: a security statement in the threat model is not true of the code. It is not a regression against Python, but a human should see it at Gate B. There are 11 minor findings. The code follows the spec and Python closely. The security-sensitive files are careful. They have no panic paths on input, no SQL built from text and no logging of secrets. The tests check behaviour and the parity harness is strict. I re-ran the build checks and the coverage measurement myself and got the same numbers.

| Grade | Count |
|---|---|
| Critical | 0 |
| Major | 1 |
| Minor | 11 |

## What I ran (STATED, measured 2026-11-13 on this machine)

| Command (from `minidon-rust`, via `nix develop -c`) | Result |
|---|---|
| `cargo test` (run twice, plus once more under coverage) | 292 passed, 0 failed, 0 ignored, all 3 runs. Wall clock about 44 s warm |
| `cargo clippy --all-targets -- -D warnings` | clean |
| `cargo fmt --check` | clean |
| `cargo deny check` | advisories ok, bans ok, licenses ok, sources ok |
| `cargo audit` | no vulnerabilities reported (RUSTSEC-2026-0459 ignored per decision 9) |
| `cargo llvm-cov --summary-only` (nixpkgs cargo-llvm-cov, llvm 21.1.8, target dir in /tmp) | lines 1269 of 1296 (97.92 %), functions 217 of 223, regions 1837 of 1922. Identical to `coverage-delta.json` per file |
| Python 3 `hashlib.pbkdf2_hmac` on the three known-answer vectors in `tests/unit_password.rs` | all three digests match, so the vectors are real Python output |
| Python `re.match(r"^[a-z0-9_]{1,30}$")` on `alice\n` and `alice\n\n`, and final-sigma `lower()` in Python and Rust | True and False, and `ας` in both languages |
| `target/tmp/parity-report.jsonl` tally by kind | consistent with 576 comparisons per full run (475 same, 57 detail_shape, 14 deviation, 26 unresolved, 4 out-of-contract), see m-08 |

## Findings

### Critical

None.

### Major

**M-01. The lone-surrogate deviation does not close the username oracle, but the threat model says it does.**

- Code: `src/accounts/service.rs:142-147`. An unknown user gets 401 before the taint check. A known user (suspended or not) with a tainted password gets 422 `Text contains a character that cannot be stored`. Pinned in `tests/int_routes.rs:643-651` and `tests/parity_known_differences.rs:81-99`.
- Claims it contradicts: `adr/adr-001.md:62` gives this reason for the deviation: "copying the 500 would also copy the username-existence oracle on sign-in". Threat row 4 (`adr-001.md:110`) says "Lone surrogate: proposed deviation D3 closes the oracle".
- Failure scenario: an attacker sends `POST /api/v1/auth/token` with `{"username":"<guess>","password":"\ud800xxxxxxx"}`. The answer is 422 if the account exists and 401 if it does not. No hashing is done and there is no throttle, so this is a cheap username enumeration on Rust, as the 500 versus 401 split is on Python.
- Why major, not critical: Python has the same oracle, so nothing regresses. Decisions 1, 6 and 10 chose a 4xx and confirmed the 422 body. But the security sign-off (decision 4) and threat row 4 rely on a control that is not there, and a human must know that at the gate.
- Options for the human (I am not deciding): (a) accept it, and correct threat row 4 to "oracle carried forward, F-C". (b) Answer 401 `Invalid username or password` for a tainted password on a known user too. This would close the oracle but needs a new decision, because it changes the decision-10 body for that one case.

### Minor

**m-01. The deviation pins check status only, and the comment says they check shape.** `tests/parity/mod.rs:831-837` says "the pin also checks the shape of each answer". `pin()` (`mod.rs:855-876`) only compares the two statuses, plus the Python 500 body. The HTTP-level tests check status only as well (`tests/int_routes.rs:624-631, 645-651`). The decision-10 body `{"error": "Text contains a character that cannot be stored"}` is asserted only at the service layer (`tests/int_service_tainted.rs`), never through the router. Failure scenario: a refactor of `routes.rs` or `error.rs` sends the tainted case through `validation_response` (`{"detail": [...]}` 422). Every test stays green, but the contract body confirmed in decision 10 has changed. Fix: assert the Rust JSON body in `pin()` for D1 and D6 (or in int_routes), and correct the comment.

**m-02. I-05: `src/accounts/extract.rs:1-2` labels design as STATED.** It reads "ownership of the shared extractor is STATED in adr-002 2.1 as design, not as a human decision". But adr-002 section 2 says "All DERIVED, except where a STATED source is named", and 2.1 names no STATED source. `src/accounts/mod.rs:3` labels the same design DERIVED. Failure scenario: a later story treats the extractor shape as fixed by a human, when it is open to challenge. Fix: label it DERIVED (adr-002 2.1).

**m-03. I-05: some platform modules make claims about Python without a label.** Examples: `src/platform/db.rs:5-6` ("follow a default SQLAlchemy and pysqlite connection: rollback journal ... foreign keys not enforced"), `src/platform/app.rs:3-9` (uvicorn and Starlette routing facts), `src/platform/config.rs:1,9`, `src/platform/clock.rs:3`, and `src/platform/error.rs:1-5`. These are DERIVED facts about Python, but they read as plain assertions. By contrast, `json.rs`, `path.rs`, `password.rs`, `token.rs` and `store.rs` are labelled. Low risk, but I-05 asks for the label.

**m-04. Text still says "needs a human decision" or "unresolved" after decisions 9 and 10.** Places: `deny.toml:11` and `deny.toml:27` ("DEVIATION, needs a human decision"), `.cargo/audit.toml:1`, `tests/parity_known_differences.rs:15-21, 385-393, 406-412` ("A human must say ..."), `tests/unit_unicode_tables.rs:40-47` ("A human decides"), `tests/parity_accounts.rs:1047` ("needs a human, no decision covers it"), `src/accounts/service.rs:132-133` ("recorded as an unresolved difference"). Also `src/platform/clock.rs:6-9` says the Python clock wrapper "is wave 5 work", but `tests/parity/oracle/oracle_app.py` has already done it. The harness also still records these cases as kind `unresolved`. Failure scenario: a later reviewer reopens decided items, or treats the advisory ignore as unapproved. Fix: cite decision 9 and decision 10 (U-01 to U-04 ACCEPTED) in place of the open-question text.

**m-05. PBKDF2 runs on an unbounded blocking pool.** In `src/accounts/service.rs:29-37` (used at lines 94 and 151), each sign-in or registration that reaches hashing does `spawn_blocking`. The tokio default allows up to 512 blocking threads. Python's sync FastAPI routes run in anyio's thread pool, which is limited to 40 threads. Failure scenario: a flood of sign-ins for known usernames (no throttle, by parity) makes up to 512 OS threads, each doing 100,000 rounds. Memory, scheduler load and the latency of other requests are worse than on Python. CPU work per request is the same. This is not in contract (OP-02, performance not tested), but it is a resource-use difference from Python that adr-001 threat row 5 and F-C do not mention. Possible fix: a semaphore around `blocking` (for example 40 permits), or a recorded acceptance.

**m-06. Traceability ids do not match the test names.** `traceability.json` maps `UT-ACC-002` to BR-002 (email) and `UT-ACC-003` to BR-003 (password). But `tests/unit_validate.rs` has tests named `ut_acc_002_invalid_usernames` and `ut_acc_003_non_ascii_folding_matches_python` (both BR-001). `IT-ACC-005`, `006`, `008`, `009`, `010` and `013` appear in no test name or comment. The mapping in `build/wave-6.md:69-109` was made by reading the tests, and I checked it by reading them (see the spot check below). Failure scenario: a check that maps ids to names maps UT-ACC-002 and UT-ACC-003 to the wrong rules, or reports six INT ids as missing. Fix: rename the two unit tests, or put the planned id in a comment above each mapped test (wave-6 also suggests this).

**m-07. REQ-018 says 14 of 14 rules, and 13 of 14 have a parity test.** `spec/spec.md` REQ-018 (STATED) says "Each of the 14 live Accounts rules shall have a parity test". The test plan (section 4) makes BR-007 an exception (random salt) and covers it with UNIT known answers and three COMPAT tests. I confirmed those are strong. In practice, every parity sign-in (`pt_acc_008`, `pt_acc_009`, `pt_acc_003`) also runs Rust's verify on a Rust-made hash next to Python's. The behaviour is covered, but the spec text and the delivery disagree. Fix: amend REQ-018, or have a human note the exception at Gate B.

**m-08. Flakiness and hygiene risks in the harness (none seen in 3 runs).**
- `tests/parity/mod.rs:132-138` (`free_port`) binds port 0, releases it, then the child binds it later (lines 151-156 and 231-234). The `START` mutex only orders child starts. It does not cover the in-process `RustServer::start` that binds port 0 on other test threads, or other processes. If another listener takes the port, the readiness loop (`TcpStream::connect`) passes against the wrong server, and the comparisons fail in confusing ways.
- `tests/parity/oracle/setup.sh:8` runs `rm -rf "$dest"` on the fixed path `/tmp/minidon-oracle-e1fbd3a` when the ready marker is missing. Two `cargo test` runs started together on a fresh machine (two CI jobs on one runner, for example) can delete each other's oracle.
- `parity-report.jsonl` is opened append-only (`mod.rs:791-797`) and never reset. It holds 4525 lines now, about 7 runs. The per-run totals in the build logs cannot be read from it without slicing by hand.
- The only sleeps are the 40 ms readiness polls, which is acceptable. Clocks are fixed (both sides), so no wall-clock dependence, except in the binary smoke tests, which compare date format only, by design.

**m-09. `coverage-delta.json` lists the wrong uncovered lines for some files (the totals are right).** For `src/platform/scrub.rs` it reports 139 of 140 lines covered with `uncoveredLines: []`. For `src/main.rs` it counts 14 missed lines but lists 11. For `src/platform/app.rs` it counts 4 missed lines but lists 3. For `src/platform/db.rs` it counts 3 missed lines but lists 1 (I re-measured the counts). Failure scenario: someone fixes the listed gaps and believes the file is fully covered. Totals, per-file counts and the with-oracle versus without-oracle split are credible.

**m-10. Small scope creep: `Role::is_staff` (`src/accounts/model.rs:49-52`).** It is not called anywhere in story 1. It belongs to Moderation (`staff_account` in `deps.py`). It is harmless, but it is untested here and is shipped ahead of the story that defines it.

**m-11. No CI configuration in the repository.** The gates (clippy `-D warnings`, fmt, `cargo deny`, `cargo audit`, and the NFR-005 "run 10 times") exist only as manual runs recorded in the build logs. Test plan section 3 says COMPAT runs as a "CI job", and NFR-006 is "CI, not a scenario". wave-6 admits this. Failure scenario: a later story merges with a deny or clippy regression, and no check catches it before a human merges (I-15).

## Spec conformance (REQ-001 to REQ-019, BR-001 to BR-014)

For each rule I compared the Rust code with `minidon/accounts/service.py`, `routes.py`, `deps.py`, `schemas.py` and `models.py` at `e1fbd3a`, and read the tests that cover it.

| Rule / REQ | Rust | Python match | Verdict |
|---|---|---|---|
| BR-001 / REQ-001, REQ-002 | `validate.rs:31` `^[a-z0-9_]{1,30}\n?\z` on `to_lowercase()`, no strip. Comment RC-001 at `validate.rs:23-30` says it is deliberate, cites the 2026-11-13 decision and the follow-up, and names the tests | `service.py:17,39,41` | Conforms. RC-001 satisfied. `alice\n\n`, `\n`, `ali\nce` and CRLF are rejected (UT-ACC-004, PT-ACC-004a..f) |
| BR-002 / REQ-003 | `normalise_email` = Python whitespace strip (White_Space plus U+001C..U+001F) then lower, then `contains('@')` | `service.py:40,43` | Conforms. Strip set proven equal for every code point against the oracle (`unit_unicode_tables.rs`) |
| BR-003 / REQ-004 | `chars().count() >= 8`, not trimmed | `service.py:45` | Conforms (code points, NUL and spaces tested on both builds) |
| BR-004 / REQ-005 | `store::find_by_username` lower-cases and includes suspended accounts. Checked before email | `service.py:47,96-102` | Conforms |
| BR-005 / REQ-006 | exact match on the normalised email, after the username check | `service.py:49` | Conforms |
| BR-006 / REQ-007 | `COUNT(*)` over all rows, then insert. Same race. Unique violation becomes 500 | `service.py:52-61` | Conforms |
| BR-007 / REQ-008 | RustCrypto PBKDF2-SHA256, 100,000 rounds, OsRng 16-byte salt, lower-case hex, `subtle` `ct_eq` on hex text, strict `split('$')` into exactly 2 parts, non-ASCII digest becomes 500 | `service.py:24-35` | Conforms. One documented small difference: Python `bytes.fromhex` skips whitespace in the salt, Rust does not. Python never writes such a row |
| BR-008 / REQ-009 | same message for unknown user and wrong password, no hashing for unknown users | `service.py:66-68` | Conforms |
| BR-009 / REQ-010 | 403 only after a correct password | `service.py:69-70` | Conforms |
| BR-010 / REQ-011 | 32 OsRng bytes, URL-safe base64 without padding (43 chars), expiry = now + ttl days, ttl 30 by default, 7 tested (`int_service.rs:423`) | `service.py:71-75`, `config.py:17` | Conforms |
| BR-011 / REQ-012 | DB read on every request, `expires_at <= now` counts as expired, missing or suspended account means signed out, `CurrentAccount` returns 401 "Sign in required" | `service.py:81-88`, `deps.py:16-31` | Conforms |
| BR-012 / REQ-013 | `identity::get_by_username` hides suspended accounts (404 "Account not found"). An including-suspended variant exists | `service.py:96-110` | Conforms |
| BR-013 / REQ-014, REQ-015 | limits of 30 and 500 code points, display name checked first, nothing written on any failure | `service.py:113-132` | Conforms. Python sets the display name before it checks the bio, but rolls back without a commit, so the result is the same |
| BR-014 / REQ-016 | stored as 0 or 1, Pydantic lax bool reproduced (`model.rs:173-198`) | `models.py:30`, `routes.py:35` | Conforms (21 accepted and 12 rejected inputs compared with the oracle) |
| REQ-017 | no DDL anywhere in `src/` (grep), `create_if_missing(false)`, the schema is checked and the app refuses to start if a table is missing. NFR-011 compat test fingerprints `sqlite_master`, `schema_version`, `user_version` and `journal_mode` | OP-05 | Conforms |
| REQ-018 | see m-07 | | Conforms except for the wording, 13 of 14 |
| REQ-019 | `{"error"}` and `{"detail"}` shapes, 404 and 405 bodies, `Allow` header of the first route, 307 trailing-slash redirect, decoding before routing, no docs routes | `main.py`, Starlette | Conforms (PT-ACC-028 compares about 100 cases in full) |

## Security-sensitive files (STATED: read line by line)

- `src/accounts/extract.rs`: reads the first `Authorization` header as latin-1 bytes, as Starlette does. Errors become anonymous, never 400 or 500. Every request reads the DB, nothing is cached. Fine, apart from the label (m-02).
- `src/accounts/token.rs`: `parse_bearer` slices only after `header.get(..7)` has succeeded, so the slice falls on a char boundary and cannot panic. An ASCII case-insensitive prefix check is equivalent to Python's `lower().startswith` for latin-1 text. An empty token after the strip means anonymous. Fine.
- `src/accounts/password.rs`: no `unwrap`. A malformed row (no `$`, three parts, odd or non-hex salt, non-ASCII digest) is an `Err` that becomes the fixed 500. It never panics (`ut_acc_007_tampered_hash_rows_never_panic`, `int_service.rs:542`). The compare runs in constant time over equal lengths and returns early only on a length mismatch, as Python's `compare_digest` does. Fine.
- `src/accounts/validate.rs`: the regex is bounded, so there is no ReDoS risk. If the pattern failed to compile, no username would be valid (fails closed, never panics). Fine.
- `src/accounts/routes.rs`: PATCH order is parse, then auth, then field types, as in Python. The lookup route does not read `Authorization`. A wrong method returns 405 before the body is read. Fine.
- `src/platform/scrub.rs`: every index is guarded (`bytes.get`, `hex4` length check, slices after checked bounds). An escaped backslash before `u` is handled. Pairs are kept. Duplicate keys: the last value wins. Only depth-1 string values are marked. Fixed messages only, nothing echoed. I traced 8 adversarial inputs by hand (nested, arrays, escaped keys, truncated escapes, a high surrogate followed by a high surrogate) and found no wrong result and no panic path.
- `src/platform/json.rs`: the body limit comes from the outer `DefaultBodyLimit` (1 MiB, decision 2), and a 413 is told apart from other read errors. Content-type rules and empty-body rules match the oracle (no content type gives 422 on Python too, PT-ACC-028). serde messages are never echoed. Fine.
- `src/platform/path.rs`: no panics (the nibble index is always below 16). Decoding is single (`canonical_path` encodes `%` as `%25`, so the axum `Path` decode gives the original text and never decodes twice). `%2F` splits a segment, as uvicorn does. Fine.
- SQL: every statement in `store.rs` and `db.rs` is a literal with `?` bound parameters. `select_account!` uses `concat!` of literals only. No `format!` reaches SQL. `AssertSqlSafe` appears only in the test harness.
- `unwrap`, `expect`, `unsafe`: none in `src/` (`grep`). `#![forbid(unsafe_code)]` is in lib and main, and the `[lints]` table denies `unwrap_used` and `expect_used`. The catch-panic layer drops the payload, and a test proves the server keeps serving after a panic (`int_app_errors.rs:161`).
- Logging: only `main.rs:16` prints, and only startup errors (config or DB open, with no request data). No request, body, token or password logging.
- Body limit: 1 MiB as decided. Exactly 1 MiB is accepted on both builds, above it Rust returns 413 (pinned).

## Test quality

- Behaviour, not execution: the parity tests assert exact Python status and body facts on the oracle answer, then require the Rust answer to be equal after normalisation. I spot-read PT-ACC-001 to 014, 028 and 029. They check messages, stored text (`db_same`), boundaries to the microsecond and ordering of checks.
- Vacuity checks (STATED from code):
  - The normaliser replaces only `id`, `access_token` (after a 43-character shape check) and `created_at`/`expires_at` (after an exact wire-format check, keeping the with-fraction and without-fraction shapes distinct). With fixed clocks, `compare_with` also requires equal date values (`mod.rs:634-641`). This is not over-broad.
  - `DetailShape` is decision 3 only. It applies only when both answers are 422 with a body that holds just a `detail` array.
  - Whitelisting is by named pin only: D1, D2, D6 (decisions 1, 2 and 6), U-01 to U-04 (decision 10) and the docs routes (OP-06). I found no implicit skip, and no pin beyond these. The weakness is m-01 (pins check status only).
  - `PARITY_PYTHON_ONLY` and `COMPAT_PYTHON_ONLY` turn off comparison, but only when the variable is set. That is the test-first switch and it is off in normal runs.
  - Ids are normalised (STATED OP-07). A swapped id would be hidden only if the usernames also matched, and the tests compare usernames, so the risk is low.
- The wave-6 claim that sqlx defaults to WAL, so that `Pair::sql` and `Pair::scalar` put the copies into WAL mode, is not true for sqlx-sqlite 0.9.0. Its `options/mod.rs:179` says "Don't set `journal_mode` unless the user requested it". So that concern is moot and nothing needs to change (STATED from the crate source in `~/.cargo/registry`).
- The coverage numbers are credible (see the table at the top). The `withoutOracle` claim (only 3 lines depend on the oracle) agrees with the per-file numbers.

## Traceability spot check (6 rules, tests read)

| Rule | Tests read | Proves the rule? |
|---|---|---|
| BR-001 | `ut_acc_004_trailing_newline_set`, `pt_acc_004a..f` (`tests/parity_trailing_newline.rs`), `pt_acc_001` | Yes. Both builds accept `alice\n` and keep it. `alice` and `alice\n` are two accounts. `%0A` lookups are distinct. 30 characters plus a newline is accepted, CRLF and two newlines are rejected |
| BR-004 | `pt_acc_004_username_is_unique_case_insensitively_suspended_included` | Yes. Case variants, a suspended name, the Kelvin sign, and the username checked before the email |
| BR-007 | `sc_acc_013_known_answers_match_python` (vectors re-checked by me in Python), `ct_acc_007_*` per wave-6 | Yes, at UNIT and COMPAT (see m-07) |
| BR-009 | `pt_acc_009_suspended_accounts_cannot_sign_in` | Yes. 403 only with the right password, wrong password gives 401, an old token is refused on the next request and works again after unsuspend |
| BR-010 | `pt_acc_010_token_lasts_30_days_with_an_exact_boundary` | Yes. Exact `expires_at` text, key order, boundaries at -1 s, 0 and +1 s, and at the microsecond with a fractional start, stored text equal in both builds |
| BR-014 | `pt_acc_014_locked_flag_round_trips_with_pydantic_lax_booleans` | Yes. Default false, stored `1`, 21 lax inputs accepted, 12 rejected, text fields strict |

The traceability mapping is right in substance. The id names drift (m-06).

## I-05 labels in code

Checked by grep (17 STATED or DERIVED labels in `src/`) and by reading. The labels are mostly correct. Problems: m-02 (extract.rs mislabels design as STATED) and m-03 (some unlabelled Python facts in platform modules).

## Scope

Nothing from other capabilities is implemented. The profile counts read `follows` and `statuses` only, as Python's `serialize_account` does, and the code marks this as a seam (`store.rs:185-188`). `get_by_username_including_suspended` and `get_by_id` are part of the identity API named in adr-001 D6. Only `Role::is_staff` reaches ahead (m-10). Story size is known and decided, so not raised.

## What I could not verify

- The "10 repeated runs" stability claim (NFR-005). I ran the full suite 3 times (all green), not 10.
- Behaviour on Linux or a CI image. I ran everything on macOS (Apple silicon) only.
- The real production Python version (U-04 follow-up), real legacy data (OP-09), and performance or load behaviour (OP-02). I did not load-test m-05.
- HTTP-parser-level behaviour beyond the pinned U-01 cases (for example slow headers, very many headers, HTTP/1.0). axum is configured for HTTP/1 only and I did not probe further.
- Stored rows that Python never writes (for example a datetime with no time part, or fractions that are not six digits). Rust would answer 500 where SQLAlchemy might parse them. Python never produces them, so I did not raise this.
- `ir/spec.json` itself. I reviewed the generated `spec/spec.md`, which says it comes from it.
