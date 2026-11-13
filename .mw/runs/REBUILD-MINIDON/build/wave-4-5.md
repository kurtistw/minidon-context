# Build log: waves 4 and 5 (story 1, L1-accounts)

Agent: coding-agent. Repo: `/Users/kurtis/tw/test-mw/minidon-rust`, branch `story-1-accounts`, 10 new commits on top of the 16 from waves 0 to 3 (nothing pushed or merged, no co-author line). Stopped after wave 5, no wave 6 work. Python reference repo `/Users/kurtis/tw/test-mw/minidon` never written (proof below).

Label key (I-05): STATED = a human decision or the ticket, source given. DERIVED = found by running the Python oracle or designed by the agent.

## What was built

Wave 4, HTTP (all files in `src/`):
- `accounts/extract.rs`: `OptionalAccount` and `CurrentAccount`. Bearer header bytes decoded with `token::latin1_to_string`, then `parse_bearer`, then `identity::authenticate`. The first `Authorization` header is read (Python does the same).
- `accounts/routes.rs`: the five endpoints. `GET /accounts/{username}` reads no header. 201 for register, 200 elsewhere. `PATCH /accounts/me` order is JSON syntax (422), then who is signed in (401), then field types (422), then the rules (all checked on Python). A wrong method is a 405 with the `Allow` header of the FIRST registered route for that path (`GET` for `/accounts/me` and `/accounts/{username}`, `POST` for the other two), and `HEAD` is a 405, as on Python.
- `accounts/model.rs`: `TokenOut` (field order of Python), `Tainted`, Pydantic's lax bool for `locked` (`"yes"`, `1`, `1.0`, `"TRUE"` ... as the oracle answers, `2` and `" true "` are 422).
- `accounts/service.rs`: `register_with`, `sign_in_with`, `update_profile_with` (lone-surrogate aware, the old functions call them with no taint).
- `platform/scrub.rs`: the lone-surrogate pre-parse of adr-001 decision 6 (below).
- `platform/json.rs`: `RawBody` (parse step) and `Body::into_model` (field validation) so the Python check order can be kept. Only `application/json` and `application/*+json` bodies are parsed (any charset parameter, any case), empty body and other content types fail field validation, duplicate keys: last wins, extra fields ignored.
- `platform/path.rs` and `platform/app.rs`: uvicorn decodes the whole path before Starlette routes (so `/api/v1%2Faccounts/alice`, `/accounts/%6De` and `%2F` behave like their decoded forms, and `%FF` becomes U+FFFD). The router is mounted as the fallback service of an outer router, so a layer decodes the path BEFORE routing. Unmatched requests are a 404, or a 307 with Starlette's `Location` when the decoded path matches a known route after a trailing slash is added or all trailing slashes are removed.
- `platform/config.rs`, `main.rs`: `MINIDON_BIND` (default `127.0.0.1:8000`, must be `ip:port`). Python has no such variable (its port is fixed), so this is the only new setting. Tests first (`unit_config`, `startup_schema`: the real binary serves on a chosen address, a bad value stops startup naming the variable).

Wave 5, parity harness (all under `tests/`):
- `parity/oracle/setup.sh`: `git archive <sha>` of the reference repo into `/tmp/minidon-oracle-e1fbd3a`, then `PYTHONDONTWRITEBYTECODE=1 uv sync --frozen` inside the copy. Resolved versions (written to `target/tmp/oracle-versions.txt` each run): Python 3.12.15, fastapi 0.162.0, starlette 1.10.0, uvicorn 0.54.0, pydantic 2.14.1, sqlalchemy 2.1.6, h11 0.16.0.
- `parity/oracle/oracle_app.py`: starts the unmodified `minidon.main:app` with uvicorn on a chosen port and freezes the clock (review M-05). `utcnow` lives in `minidon.db` and reads that module's global `datetime` on every call, and `accounts/service.py` and the column defaults in `accounts/models.py` all call that one function. So replacing `minidon.db.datetime` with a frozen subclass moves sign-in, `authenticate` and `created_at` together, with no reference file touched. `POST /__clock` (wrapper only, not a Minidon route) moves the time. `--create-schema` does what `python -m minidon` does first (`create_tables()`) and is used once per test process for the template database.
- `parity/mod.rs`: `Pair` = Python oracle process + the real Rust router (in process, `FixedClock`) on two copies of ONE Python-made empty database, both clocks at T0 = 2026-01-01 00:00:00. Requests go over a plain socket so both servers get identical bytes (needed for header control bytes, odd paths, duplicate headers, non-UTF-8 bodies). `same` compares status, content-type, allow (as a set), location (host removed) and the body after the normaliser, and also requires equal date VALUES (the clocks are fixed). `deviation` and `unresolved` pin one exact input to exact statuses on both builds. `PARITY_PYTHON_ONLY=1` runs every expectation against the oracle alone.
- `parity/normalise.rs`: replaces ids, token values and timestamps with placeholders after a shape check, and nothing else. A date must match Python's exact wire format (no zone, `T`, fraction left out when microseconds are zero, else exactly six digits). The placeholder keeps whether a fraction was present, so a body that gains or loses a fraction does not normalise equal. `.000000`, `Z`, `+00:00`, a space for `T`, 3 or 7 digit fractions and non-string dates are errors (review M-08).
- `parity/dataset.rs`: seed SQL used on both database copies (suspend, delete an account row, role, follows, statuses). No real data.
- Tests: `parity_harness_self` (7), `parity_accounts` (22: PT-ACC-001..006, 008..014, SC-ACC-028 in four tests, SC-ACC-029, the control-byte pins, binary smoke), `parity_trailing_newline` (6: PT-ACC-004a..f), `parity_known_differences` (9), `unit_normalise` (7), `unit_unicode_tables` (3).
- Real binary: `pt_acc_binary_smoke_...` runs the actual `minidon-rust` binary (system clock, `MINIDON_BIND`) against the oracle, with dates checked for format only. The other parity tests use the in-process router because the binary has no clock override and must not get one.

No new crates. No `unwrap` or `expect` outside tests, no unsafe, no DDL in `src/`. Harness SQL only seeds rows, on database copies.

## Lone-surrogate decisions (adr-001 section 5 decisions 1 and 6), every field

Python behaviour was checked on the oracle first, then built. `platform::scrub` replaces every lone surrogate escape (not a valid pair) with U+FFFD in the raw body text and records the top-level fields whose final value was a string holding one (last duplicate wins, keys decoded first, nested values and keys never mark a field). The service then keeps Python's check order:

| Input | Python | Rust | Status |
|---|---|---|---|
| register username | 422 `{"error": "Username must be..."}` | same | parity (`same`) |
| register email, rules pass | 500 (SQLite binds it after the username check) | 422 `{"error": "Text contains a character that cannot be stored"}` | D6, pinned |
| register email, username taken / no `@` / short password | 409 / 422 / 422 | same | parity |
| register password, rules pass | 500 (hash, after both 409 checks) | 422 same text | D1, pinned |
| register password, username or email taken, or too short | 409 / 409 / 422 | same | parity |
| sign-in password, known user (also suspended) | 500 | 422 | D1, pinned |
| sign-in password, unknown user | 401 | 401 | parity |
| sign-in USERNAME | 500 | 401 | UNRESOLVED U-02 |
| PATCH display name or bio, rules pass | 500 | 422 | D6, pinned |
| PATCH display name or bio too long | 422 `{"error"}` length message | same | parity |
| PATCH tainted display name, bio too long | 422 bio message | same | parity |
| any field the API ignores, or a key | ignored, 2xx | same | parity |

The 4xx body for D1 and D6 is a domain-shaped 422 with a fixed text. That body is a DERIVED choice, decision 1 only says "4xx".

## Commands and results (all from the Rust repo via `nix develop -c`, final run)

- `cargo test`: 280 passed, 0 failed (was 156). New: unit_scrub 14, int_service_tainted 11, unit_lax_bool 5, int_extract 7, unit_path 6, int_routes 22, unit_config +3, startup_schema +2, unit_normalise 7, parity_harness_self 7, parity_accounts 22, parity_trailing_newline 6, parity_known_differences 9, unit_unicode_tables 3 (= 124).
- `cargo clippy --all-targets -- -D warnings`: clean.
- `cargo fmt --check`: clean.
- `cargo deny check`: advisories ok, bans ok, licenses ok, sources ok (exceptions of adr-001 decision 9 unchanged).
- Python first (test-first): `PARITY_PYTHON_ONLY=1 cargo test --test parity_accounts --test parity_trailing_newline --test parity_known_differences` passes 22, 6 and 9 tests on the oracle alone. Every parity test asserts status and body facts on the Python answer as well as comparing. Honest note on order: the Rust routes were built before the harness, so "red on Rust first" was not applied to the parity tests. What was applied: the Python facts were probed on the oracle BEFORE the Rust routes were written (the table above, redirects, `Allow`, lax bool, content types, header shapes, path decoding), and `int_routes`, `unit_scrub` and the other wave 4 unit tests were red before the code. The harness was then shown to fail when Rust is wrong: a formatter that prints `.000000` is reported by the date check, and `\n?\z` replaced by `\z` in `validate.rs` fails PT-ACC-004a, b, c and f (both mutations reverted).
- Parity run against both builds: 22 + 6 + 9 + 7 tests green. Repeat runs (NFR-005): the four parity files were run 10 times in a row, 40 of 40 test binaries green, no failure, no retry, no sleep used to hide anything.
- I-29 proof: `git status --short --ignored` in `/Users/kurtis/tw/test-mw/minidon` and a checksum of every file under it (ignored `.venv` and `__pycache__` included, `.git` excluded; 2044 files) are identical before and after all of this work. The harness also checks it itself (`the_reference_repo_is_never_written_by_a_harness_run`: path, size and mtime of every entry, plus `git status --ignored`).

## Parity results: every difference

Numbers are from one clean run of the whole suite (`target/tmp/parity-report.jsonl`, one line per comparison). Kinds: `same` (identical after normalisation), `detail_shape` (422 `{"detail": [...]}` on both, status and top-level shape only, adr-001 decision 3), the pinned kinds below.

### Fixed Rust bugs (found while probing Python or by my own tests, all fixed test first)

1. Duplicate JSON keys: serde errors, Python takes the last one. Body is parsed to a `Value` first (last wins), then deserialised.
2. `locked` strictness: Python accepts Pydantic lax booleans (`"yes"`, `1`, `1.0`, `"TRUE"`, ...). `unit_lax_bool`.
3. `HEAD` on a GET route: axum serves it, Python answers 405. Handlers answer 405 with `Allow`.
4. `Allow` header: Python lists only the first matching route's methods (`GET` for `/accounts/me`), axum would list all. Matches Python now.
5. Trailing slash: axum 404s, Python redirects with 307 and a `Location` built from the decoded path (percent sign left alone, `?` `#` backslash escaped, then quoted). Implemented and compared byte for byte for 25 paths.
6. Path decoding before routing (`/api/v1%2Faccounts`, `%6De`, `%2F`, `%FF`).
7. `PATCH /accounts/me` check order (syntax, auth, field types).
8. Token response key order: `serde_json::json!` sorts keys, caught by `int_routes` (raw text compare). Now a struct, `TokenOut`.
9. Content types: charset parameter, any case, `+json` suffix are JSON on Python.

### Whitelisted by decision (adr-001 decisions 1, 2, 6), pinned by exact input and statuses

| Id | Cases | Python | Rust |
|---|---|---|---|
| D1 | register password with a lone surrogate (3 inputs), sign-in of a known user (also a suspended one) | 500 text | 422 |
| D2 | body above 1 MiB (1 MiB + 1 byte plus padding, 3 MiB) | 201 | 413 |
| D6 | register email (3 inputs), PATCH display name (2), PATCH bio (2, one with `locked: true`, nothing changes on either side) | 500 text | 422 |

A body of exactly 1 MiB is a 201 on both. The out-of-range 64-bit id half of decision 1 has no route in story 1 (plan review m-05), so it is not pinned here. Decision 3 (validation message text) is applied as a comparison mode (57 comparisons compare only status and `{"detail": [...]}` shape), not as an input whitelist. Neighbours that must still match Python (the table above) are compared in full.

### Out of contract by a stated decision (OP-06)

`/docs`, `/redoc`, `/openapi.json`, `/docs/oauth2-redirect`: Python 200, Rust 404. Not ported on purpose. Pinned (4 cases).

### UNRESOLVED: Python behaves in a way the spec and ADRs did not anticipate. Needs a human. Pinned so it cannot change unseen, not hidden, not whitelisted.

- **U-01 Control bytes in a header value.** Python's HTTP parser (h11 0.16) lets control bytes through except NUL, VT and FF (400 on both builds, different 400 bodies). hyper answers 400 for every control byte except tab, before any Accounts code runs. Effects: a token wrapped in U+001C to U+001F authenticates on Python (the strip rule of plan review m-04) and is a 400 on Rust; bytes 0x01, 0x08, 0x1B, 0x7F give 401 on Python and 400 on Rust. `token::parse_bearer` itself strips U+001C to U+001F (`unit_token`), the HTTP layer never lets them reach it. 12 cases pinned in `parity_accounts.rs`. Fixing this means lowering the HTTP parser's strictness, which no decision covers.
- **U-02 Sign-in username with a lone surrogate.** Python 500 (SQLite cannot bind it), with or without an account of that name. Decision 6 only covers the registration username and the sign-in password. Rust answers 401 (U+FFFD matches no account). Options for the human: copy the 500, keep 401, or answer a 4xx like decision 1. 3 cases pinned.
- **U-03 JSON that Python's `json.loads` accepts and `serde_json` refuses.** Python accepts `NaN`, `Infinity`, `-Infinity`, `1e999` (even in ignored fields), a UTF-8 byte order mark, and UTF-16 bodies (BOM or null byte detection): all 200 on Python, 422 on Rust. Invalid UTF-8 in a JSON body is a 400 `{"detail": "There was an error parsing the body"}` on Python (not the 422 list) and a 422 on Rust. Whether such bodies are contract (OP-06) is for a human. Closing it means a Python-compatible JSON reader (encoding detection plus non-standard constants) in front of serde, a bounded task. 11 cases pinned. Both builds agree (422 detail list) on the other bad bodies tried: empty, `{`, a NUL, a control character in a string, a bad escape, `\xff\xfe`.
- **U-04 Unicode tables.** The oracle runs Python 3.12.15 (Unicode 15.0.0). Rust 1.94 lower-cases 55 code points that Python leaves alone (Georgian U+1C89, U+A7CB..U+A7DC, Garay U+10D50..U+10D65, U+16EA0..U+16EB8; all Unicode 16 and later capitals). Checked over ALL code points against a fixture dumped from the oracle (`tests/fixtures/python_unicode.json`, `tests/parity/oracle/gen_unicode.py`): the `strip()` whitespace set is identical, and the differing set is pinned (the test fails if it grows or shrinks). None of the 55 lowers to an ASCII pattern character, so usernames are unaffected. An email containing one is stored lower-cased by Rust and unchanged by Python (`u04_...` shows U+10D50 stored as U+10D70 by Rust only), so uniqueness could differ across builds for such emails. Options: an exclusion list copying Python 3.12, accept it, or pin the production Python version.

Anything else that differed between the builds was either a Rust bug (fixed, list above) or is in the tables above. No difference is hidden by the normaliser: it replaces ids, tokens and timestamps only, after a shape check, and the harness compares date values on top.

## Other observations

- Trailing slash (open from waves 1 to 3): copied from Python, see fix 5. It is observable, so it is parity, not a recorded difference.
- `GET /accounts/{username}` really has no auth in Python (m-01): a nonsense, non-ASCII or wrong-scheme header gives 200 on both builds.
- Python's 500 body is `text/plain; charset=utf-8` `Internal Server Error` (pinned in the deviation cases).
- The Python process logs a traceback for each 500 into the per-test log file inside the temp dir. No secrets leave the harness.
- Python started from the copy needs about 0.7 s per test. Startup of the two servers is serialised by a lock so free-port picking cannot race. The whole parity set takes about 35 s.
- `cargo test` with the parity tests needs `uv`, `git` and network access to the uv cache on the first run only (the Nix shell provides `uv`). The oracle copy is reused from `/tmp/minidon-oracle-e1fbd3a`, override with `MINIDON_ORACLE_DIR`, reference repo override `MINIDON_REFERENCE_REPO` (default `../minidon`).
- Security-sensitive files from this wave, still needing a reviewer other than their author (I-14): `accounts/extract.rs`, `accounts/routes.rs`, `platform/scrub.rs`, `platform/json.rs`, `platform/path.rs`, plus the earlier `password.rs`, `token.rs`, `identity.rs`.

## Problems that need a human

1. U-01, U-02, U-03, U-04 above: what should Rust do (copy Python, keep as is, or answer a 4xx). Nothing was silently chosen: Rust's current behaviour is pinned and reported.
2. The body of the D1 and D6 4xx (`{"error": "Text contains a character that cannot be stored"}`, 422) is a DERIVED choice.
3. `MINIDON_BIND` is a new env var that Python does not have (default unchanged). It exists so two builds can run side by side. Confirm or replace it.
4. The wave 1 policy exceptions (licences, RUSTSEC-2026-0459 ignore) are unchanged and were already decided in adr-001 decision 9.

## What wave 6 must handle

- `tests/compat_accounts.rs` on ONE shared database file used by both builds in turn: CT-ACC-006 (stored enum names `ADMIN`, `USER`, `MODERATOR` read by both), CT-ACC-007 and SC-ACC-015 (hash cross-verify Python to Rust and Rust to Python, plaintext never stored), CT-ACC-014 (locked flag), SC-ACC-029 stored datetime text (the harness already shows both databases hold `YYYY-MM-DD HH:MM:SS.ffffff` after the same requests, `db_same`), SC-ACC-030 synthetic dataset round trip, and a test that Rust leaves the schema unchanged (NFR-011). The harness `Pair` uses two copies, wave 6 needs a variant that points both servers at one file.
- Reuse: `parity/mod.rs` (`oracle()`, `PythonServer`, `Req`, `Observed`, `compare`), `parity/dataset.rs`, `RustServer::start_binary`.
- Decide U-01 to U-04, then either change Rust or move the pins to ordinary parity.
- Independent review of the security-sensitive files above (I-14), a human merges (I-15).
- NFR-005 repeat runs and CI wiring (the oracle setup needs `uv`).
- Cutover items already carried: the trailing-newline follow-up (PT-ACC-004a..f change in both builds by decision), the weaknesses F-A to F-I.

## Totals of the final run (576 comparisons)

| Kind | Count |
|---|---|
| same (status, headers, normalised body and date values equal) | 475 |
| detail_shape (422 `{"detail": [...]}`, decision 3) | 57 |
| deviation D1 / D2 / D6 (decisions 1, 2, 6) | 5 / 2 / 7 |
| out of contract OP-06 (docs routes) | 4 |
| unresolved U-01 / U-02 / U-03 | 12 / 3 / 11 |
| different (a failure) | 0 |

U-04 is a database comparison (`u04_...`) and the `unit_unicode_tables` pin, so it is not a line in that report.
