# Repo plan: minidon-rust - REBUILD-MINIDON story 1, L1-accounts

Author: code-plan-agent. Label key (I-05): STATED = a person, the ticket or a recorded human decision said it (source given). DERIVED = inferred or designed by an agent, open to challenge.
Inputs: ir/spec.json, spec/spec.md (REQ-001..REQ-019), test-plan.md, scenarios.md, traceability.json, adr/adr-001.md, adr/adr-002.md, open-points.md, impact.json.

## 1. Scope and delta

- STATED (spec.md section 2): every file below is ADDED. The repository is empty and new (only `.git`). MODIFIED none, REMOVED none.
- STATED (spec.md section 3): story 1 only: L1-accounts/BR-001..BR-014 (14 rules, 19 requirements), five routes: `POST /api/v1/accounts`, `POST /api/v1/auth/token`, `GET` and `PATCH /api/v1/accounts/me`, `GET /api/v1/accounts/{username}`.
- DERIVED minimum shared app skeleton: only what Accounts needs to run and be tested: crate manifest and toolchain, platform module (config, clock, errors, database access, router wiring), and the parity harness. Nothing for Following, Posting, Timelines, Notifications or Moderation. The `Notifier` trait (adr-001 D7) is NOT created here: it is a story 2 file. Moderation-only parts of `identity` (the `include_suspended` variant) exist because BR-012 and Accounts own it (adr-002 2.2).
- Out of scope (STATED): new behaviour, cutover, fixing known weaknesses (follow-ups F-A..F-I in adr-001), other capabilities, docs routes `/docs`, `/redoc`, `/openapi.json` (OP-06), performance (OP-02), DDL or schema creation (OP-05, REQ-017).
- DERIVED test-first rule (test-plan section 8): each test is written, seen green on Python `e1fbd3a` first, seen red on Rust, then made green. Each source file is built together with its test file.

## 2. Platform decisions applied (STATED, adr-001 D1 to D5 and section 5)

- Stable Rust, axum on tokio, sqlx with SQLite and bound parameters only, `regex` crate (no `fancy-regex` in story 1), RustCrypto `pbkdf2`, `hmac`, `sha2`, `subtle`, `rand`. Crate list approved (adr-001 section 5.5). `cargo deny` allows MIT, Apache-2.0, BSD only.
- No DDL. Startup fails with a clear message if the tables are missing. Enum columns upper-case names, naive UTC text `YYYY-MM-DD HH:MM:SS.ffffff`, wire dates naive ISO with `T`, hash `<salt hex>$<digest hex>`, no rehash, tokens clear text as primary key, no column length enforcement.
- Errors: domain `{"error": msg}`; framework 422 `{"detail": [...]}` (status code and top-level shape only, decision 3); 404 `{"detail":"Not Found"}`, 405 `{"detail":"Method Not Allowed"}`; 500 `text/plain "Internal Server Error"`.
- Known differences from Python, section 6 below.

## 3. Files, in build waves

Each entry: path, what it does, Why, requirements and rules served, test file. Tests live under `tests/` and call the crate as a library (`src/lib.rs`), so unit, integration, parity and compat tests are separate files.

### Wave 0 - project skeleton (no behaviour; everything else depends on it)

#### `Cargo.toml` (ADDED, DERIVED)
- What: package `minidon-rust`, lib plus bin, pinned crates from adr-001 D1 (axum, tokio, sqlx sqlite, regex, pbkdf2, hmac, sha2, subtle, rand, serde, serde_json, tower-http catch-panic, chrono or time), dev-dependencies for the harness (reqwest, tempfile). `[lints]` deny `clippy::unwrap_used`, `clippy::expect_used` outside tests; `panic = "unwind"`.
- Why: single manifest is the contract for every later file; lints and unwind setting are required by threat rows 12 and 14.
- Serves: REQ-008, REQ-017, REQ-019 (stack); all rules indirectly. Test file: none (checked by `cargo clippy -D warnings`, `cargo deny check`, `cargo audit` in CI).

#### `Cargo.lock`, `rust-toolchain.toml`, `deny.toml` (ADDED, STATED adr-001 D1)
- What: committed lockfile, pinned stable toolchain with `edition = 2021` or later, deny policy (licences MIT/Apache-2.0/BSD, sources crates.io only, advisories blocked).
- Why: supply-chain controls (threat row 15, S-09).
- Serves: cross-cutting NFR-006. Test file: CI jobs only.

#### `.gitignore` (ADDED, DERIVED)
- What: ignores `target/`, `*.db`, harness work dirs.
- Why: keeps test databases and build output out of commits.
- Serves: none directly. Test file: none.

#### `src/lib.rs` (ADDED, DERIVED)
- What: declares modules `accounts` and `platform`, `#![forbid(unsafe_code)]`, and exposes `build_app(...)`.
- Why: library entry makes every layer testable without a process; forbid-unsafe is STATED in adr-001 D1.
- Serves: all rules. Test file: `tests/smoke_app.rs` (app builds, unknown route 404).

#### `src/main.rs` (ADDED, STATED adr-001 D1)
- What: reads config, opens database, checks schema, binds `127.0.0.1:8000` by default, serves the app.
- Why: single binary, single container (OP-03); same address and env vars as Python.
- Serves: REQ-017, REQ-019. Test file: `tests/startup_schema.rs` (starts on an empty database, expects a clear failure, expects no DDL; NFR-011).

### Wave 1 - platform module (shared skeleton, depends on wave 0)

#### `src/platform/mod.rs` (ADDED)
- What: re-exports config, clock, error, db, app.
- Why: one place for the shared seam later stories reuse. Serves: all. Test file: covered by wave 1 tests.

#### `src/platform/config.rs` (ADDED, STATED adr-001 D1)
- What: `Settings` with `database_url` (env `MINIDON_DATABASE_URL`, default `sqlite:///./minidon.db`), `instance_domain` (`MINIDON_DOMAIN`, default `minidon.local`), `token_ttl_days` default 30, body limit 1 MiB constant.
- Why: same env vars and defaults as `minidon/config.py`; `token_ttl_days` is configurable per REQ-011-AC2. Only the settings Accounts needs are added.
- Serves: REQ-011 (BR-010), REQ-017. Test file: `tests/unit_config.rs` (defaults, override of ttl to 7).

#### `src/platform/clock.rs` (ADDED, STATED OP-07, adr-001 D4)
- What: `Clock` trait, system clock returning naive UTC with microseconds, and a settable fixed clock for tests and the harness. Not reachable through any production endpoint.
- Why: time is an input (principles 9); required for the expiry boundary at exactly T0+30d (SC-ACC-018).
- Serves: REQ-011, REQ-012 (BR-010, BR-011). Test file: `tests/unit_clock.rs`.

#### `src/platform/error.rs` (ADDED, STATED adr-001 D3)
- What: platform error type with variants Invalid (422), Unauthorized (401), Forbidden (403), NotFound (404), Conflict (409), plus Internal (500). Maps domain errors to `{"error": msg}`, internal to the fixed 500 body. Never logs bodies, `Authorization`, tokens or passwords.
- Why: one mapping point for every status code and body shape (REQ-019, threat row 9).
- Serves: REQ-001, 003..006, 009, 010, 012..014, 019 (all rejection paths). Test file: `tests/unit_error.rs`.

#### `src/platform/db.rs` (ADDED, STATED OP-05)
- What: opens the SQLite pool with sqlx, verifies `accounts` and `access_tokens` tables exist (more tables are not checked in story 1), never runs DDL, helpers for the stored datetime text and enum name round trip.
- Why: Rust uses the schema Python already makes (zero migrations).
- Serves: REQ-017 (all rules that touch storage). Test file: `tests/int_db_formats.rs` (datetime text format `YYYY-MM-DD HH:MM:SS.ffffff`, no DDL executed on a Python-made copy).

#### `src/platform/app.rs` (ADDED, STATED adr-001 D1, D3)
- What: builds the `Router`, merges the accounts router, sets `DefaultBodyLimit` to 1 MiB, catch-panic layer returning the 500 body, 404 and 405 fallbacks with Python bodies, JSON rejection mapped to 422 `{"detail": [...]}`, no docs routes.
- Why: framework behaviour is contract (OP-06); panic and body-size handling are threat rows 12 and 13.
- Serves: REQ-019, REQ-017. Test file: `tests/int_app_errors.rs` (404, 405, malformed JSON, missing field, wrong type, panic does not stop the server, 413 above 1 MiB). Covers SC-ACC-028.

### Wave 2 - accounts pure logic (depends on wave 1 error and clock; no storage)

#### `src/accounts/mod.rs` (ADDED, STATED adr-002 2.1)
- What: module root exposing `routes`, `identity` only; keeps `service` and `store` private.
- Why: other modules may depend only on `identity` (CF-004). Serves: REQ-013. Test file: none (compile-level, reviewed).

#### `src/accounts/model.rs` (ADDED, DERIVED)
- What: `Account` row struct, `Role` enum (stored `ADMIN`/`USER` and others as Python makes, wire lower-case), profile response type (keys as Python, including counts zero), request types for register, sign-in, profile update (field omission vs null recorded, SC-ACC-026).
- Why: stored enum names and wire shapes must match Python exactly (OP-05, OP-06).
- Serves: REQ-007 (BR-006), REQ-015 (BR-013), REQ-016 (BR-014), REQ-017, REQ-019. Test file: `tests/unit_model.rs` (enum mapping both ways, serialised profile keys).

#### `src/accounts/validate.rs` (ADDED, STATED for BR-001, DERIVED others)
- What: pure functions: `normalise_username` (full Unicode `to_lowercase`, no strip), `username_valid` using `^[a-z0-9_]{1,30}\n?\z`, `normalise_email` (trim with Python whitespace set, lower-case, must contain `@`), `password_valid` (>= 8 code points), `display_name_valid` (<= 30 code points), `bio_valid` (<= 500 code points). Carries the required comment at the pattern: "Deliberate parity copy of Python `$`-before-final-newline (human-decisions section 5). Follow-up: reject in both builds after cutover." (review check RC-001).
- Why: regex engine and text counting are the parity risks (OP-03, NFR-010). `\z` with an optional single `\n` expresses the Python `$` quirk without lookaround, so `fancy-regex` is not needed.
- Serves: REQ-001, REQ-002, REQ-003, REQ-004, REQ-014 (BR-001, BR-002, BR-003, BR-013). Test file: `tests/unit_validate.rs` (UT-ACC-001, UT-ACC-002, UT-ACC-003, UT-ACC-004, UT-ACC-013). Includes `alice\n` ok, `alice\n\n`, `\n`, `ali\nce`, `alice\r\n` rejected, 30 chars plus `\n` ok, Kelvin sign folds to `k`, full-width digits and `İstanbul` rejected, U+00A0 stripped in email, 7 vs 8 emoji, 30 emoji, combining marks counted as code points.

#### `src/accounts/password.rs` (ADDED, DERIVED BR-007)
- What: `hash_password` (16-byte OS-random salt, PBKDF2-HMAC-SHA256, 100,000 iterations, UTF-8 raw, output `<salt hex>$<digest hex>` lower-case) and `verify_password` (parses hash without `unwrap`, constant-time compare of hex via `subtle`, malformed stored hash returns an error mapped to the Python 500 body, not a panic). No rehash.
- Why: byte-compatible hashes in both directions (zero migrations, S-06, GRD-004); malformed row must keep the server up (threat row 12).
- Serves: REQ-008 (BR-007), REQ-009 (BR-008). Test file: `tests/unit_password.rs` (SC-ACC-013 known-answer vectors generated once from Python including non-ASCII, SC-ACC-014 salts differ and are 16 bytes, hash shape 32+`$`+64, tampered hash no panic).

#### `src/accounts/token.rs` (ADDED, DERIVED BR-010, BR-011)
- What: `new_token` (32 random bytes, URL-safe base64 no padding, 43 chars), `expires_at(now, ttl_days)`, `is_expired(expires_at, now)` with `expires_at <= now` as expired, `parse_bearer` (case-insensitive prefix `Bearer`, token trimmed with Python whitespace set including U+001C to U+001F, non-ASCII or odd headers give anonymous, never 400 or 500).
- Why: exact expiry boundary and header parsing are parity cases (threat row 2, adr-001 D3).
- Serves: REQ-011, REQ-012 (BR-010, BR-011). Test file: `tests/unit_token.rs` (UT-ACC-010, shape, boundary minus 1 s, exact, plus 1 s, header cases).

### Wave 3 - storage and rules (depends on wave 2)

#### `src/accounts/store.rs` (ADDED, STATED adr-001 D1)
- What: sqlx queries with bound parameters only: count accounts, find by username (exact, stored form), find by email, insert account, update profile fields, insert token, find token with account join. Read per request, no cache (S-05). Uses the stored text formats from `platform/db.rs`.
- Why: single place that touches the `accounts` and `access_tokens` tables (adr-002 2.1); no SQL via `format!` (threat row 14).
- Serves: REQ-005, 006, 007, 011, 012, 013, 016, 017 (BR-004..BR-006, BR-010..BR-014). Test file: `tests/int_store.rs` (IT-ACC-004, IT-ACC-005, IT-ACC-006, IT-ACC-011, IT-ACC-014 on a Python-made temp database copy; quotes and `%` in usernames stay inert).

#### `src/accounts/identity.rs` (ADDED, STATED CF-004, adr-001 D6)
- What: public stable API `get_by_username(db, username)` (suspended counts as not found), `get_by_username_including_suspended`, `get_by_id`, and `authenticate(db, clock, token)` returning an account or none (unknown, expired, missing account or suspended account all mean signed-out).
- Why: Accounts owns identity; later stories call these as functions and never read the accounts table (CF-004). Reads auth state from the database every request (threat row 7).
- Serves: REQ-012, REQ-013 (BR-011, BR-012). Test file: `tests/int_identity.rs` (IT-ACC-011, IT-ACC-012; suspended and expired are signed-out on the very next request; deleted account row signed-out; include-suspended variant finds a suspended account; seeded via `suspended_at` in the database copy).

#### `src/accounts/service.rs` (ADDED, STATED BR-001/BR-009, DERIVED others)
- What: `register` (order as Python: normalise and validate username, email, password, then username uniqueness 409 "Username is taken", then email uniqueness 409 "Email is already registered", count-then-insert with first account Admin, same race kept), `sign_in` (unknown or wrong password both 401 "Invalid username or password"; password checked before suspension, suspended 403 "This account is suspended"; token issued with ttl), `update_profile` (limits, partial update keeps omitted fields, locked flag). Messages copied from Python (confirmed by harness, not asserted from reading).
- Why: central rule logic for all 14 rules; no dummy hash and no throttle by parity (threat rows 4, 5).
- Serves: REQ-001..REQ-011, REQ-013..REQ-016 (BR-001..BR-010, BR-013, BR-014). Test file: `tests/int_service.rs` (IT-ACC-004..IT-ACC-014; first admin, later user, all-suspended dataset still count based (SC-ACC-012), 409 for `ALICE\n` after `alice\n`, 50 wrong passwords all 401 with no lockout, 403 vs 401 order on a suspended account).

### Wave 4 - HTTP routes (depends on wave 3)

#### `src/accounts/extract.rs` (ADDED, STATED adr-002 2.1, 2.2 BR-011)
- What: axum extractors `OptionalAccount` (anonymous on any unparseable or invalid token) and `CurrentAccount` (401 "Sign in required" when anonymous), built on `token::parse_bearer` and `identity::authenticate`. Staff extractor is NOT added (story 6).
- Why: the shared auth extractor is the highest drift risk (threat row 7); it is reviewed by an agent other than its author (I-14).
- Serves: REQ-012 (BR-011), REQ-013 (BR-012). Test file: `tests/int_extract.rs` (no token, malformed `Authorization`, wrong case `bEaReR`, tab and extra spaces, non-ASCII header, expired, suspended token).

#### `src/accounts/routes.rs` (ADDED, STATED OP-06)
- What: `Router` for the five endpoints under `/api/v1`: register (201), token (200 with Python body keys), `GET` and `PATCH /accounts/me`, `GET /accounts/{username}` (optional auth, URL-decoded so `alice%0A` reaches the store). Trailing-slash behaviour copies Python (checked by the harness).
- Why: the only HTTP surface of story 1; status codes and body shapes are contract (REQ-019).
- Serves: REQ-001..REQ-016, REQ-019 (all rules end to end). Test file: `tests/int_routes.rs` (route-level checks per rule through the in-process app with the fixed clock).

#### `src/accounts/` wiring in `src/platform/app.rs` (modifies a wave 1 file within this plan)
- What: merge `accounts::routes::router()` into the platform router. Not a separate file; done in the wave 4 commit.
- Why: keeps wave 1 compilable without accounts. Serves: REQ-019. Test file: `tests/int_routes.rs`.

### Wave 5 - parity harness (depends on wave 4 and on the read-only Python reference)

#### `tests/parity/mod.rs` (ADDED, STATED OP-07, adr-001 D4)
- What: harness core: starts Python (from a copy or outside the repo, `PYTHONDONTWRITEBYTECODE=1`, `uv sync --frozen`, `MINIDON_DATABASE_URL` set) and Rust as processes, each on its own copy of one Python-made database, fixed clock `T0 = 2026-01-01 00:00:00 UTC`, sends identical requests, compares status and body after normalisation. Records resolved Python versions in the parity report. Proof of no write to the Python repo: `git status --ignored` and a tree checksum before and after (I-29).
- Why: parity is the stated acceptance for every rule (REQ-018).
- Serves: REQ-018, REQ-017. Test file: `tests/parity_harness_self.rs` (harness self-test: no write to Python repo detected, clock fixed).

#### `tests/parity/normalise.rs` (ADDED, DERIVED test-plan section 2)
- What: replaces generated ids, timestamps and token values with stable placeholders and nothing else. Error bodies, date format and 404/405 bodies are not normalised (OP-06). Header differences listed explicitly.
- Why: a normaliser that hides real differences would fake parity.
- Serves: REQ-018, REQ-019. Test file: `tests/unit_normalise.rs`.

#### `tests/parity/dataset.rs` (ADDED, STATED OP-09)
- What: builds the synthetic dataset through the Python API (no real user data) and copies it per run; seeds `suspended_at` directly in the copy so Accounts is proven without Moderation (A-02).
- Why: compatibility data and suspended-account scenarios without other capabilities.
- Serves: REQ-017, REQ-018 (BR-004, 005, 009, 011, 012). Test file: used by `tests/parity_accounts.rs` and `tests/compat_accounts.rs`.

#### `tests/parity_accounts.rs` (ADDED, STATED test-plan section 4)
- What: one PARITY test per rule BR-001..BR-014 except BR-007 (PT-ACC-001..PT-ACC-014, with the trailing-newline set below), plus SC-ACC-028 (framework errors) and SC-ACC-029 (response shape and dates). Each first green on Python `e1fbd3a`.
- Why: 13 of 14 rules have PARITY tests (BR-007 uses UNIT plus COMPAT because of random salt).
- Serves: REQ-001..REQ-006, 007, 009..REQ-016, REQ-018, REQ-019. Test file: itself.

#### `tests/parity_trailing_newline.rs` (ADDED, STATED, REQUIRED)
- See section 5.

#### `tests/parity_known_differences.rs` (ADDED, STATED adr-001 section 5)
- See section 6.

### Wave 6 - compatibility (depends on waves 4 and 5)

#### `tests/compat_accounts.rs` (ADDED, DERIVED)
- What: COMPAT tests on one shared database file: CT-ACC-006 (stored enum `ADMIN`/`USER`), CT-ACC-007 and SC-ACC-015 (hash cross-verify Python to Rust and Rust to Python, plaintext never stored), CT-ACC-014 (locked flag boolean read the same by both), SC-ACC-029 stored datetime text and upper-case enums, SC-ACC-030 synthetic dataset round trip with no schema change, plus a check that Rust leaves the schema unchanged (NFR-011).
- Why: zero migrations in both directions (REQ-017); BR-007 cannot be proven by PARITY.
- Serves: REQ-006..REQ-008, REQ-016, REQ-017 (BR-006, BR-007, BR-014). Test file: itself.

Note (DERIVED, not a file): CI repeats the suite 10 times with no difference (NFR-005, test-plan section 8); no sleeps, no retries. Configured in CI, not in this plan's files.

## 4. Wave order and dependencies (DERIVED, wave-order)

| Wave | Files | Depends on | Reason |
|---|---|---|---|
| 0 | Cargo.toml, Cargo.lock, rust-toolchain.toml, deny.toml, .gitignore, src/lib.rs, src/main.rs | none | manifest and entry points |
| 1 | platform: mod, config, clock, error, db, app | 0 | error type and clock are used by every accounts file |
| 2 | accounts: mod, model, validate, password, token | 1 (error, clock) | pure logic, no storage; can be built in parallel within the wave |
| 3 | accounts: store, identity, service | 2 | storage and rules use wave 2 types and logic |
| 4 | accounts: extract, routes (+ wiring in platform/app.rs) | 3 | HTTP surface depends on service and identity |
| 5 | tests/parity/* and parity test files | 4, Python reference | acceptance layer needs a running Rust build |
| 6 | tests/compat_accounts.rs | 4, 5 (dataset) | needs the dataset and both builds |

Same-day size (I-11, change-sizing, DERIVED): About 30 files in 7 waves is too large for one integration. Integrate per wave (each wave compiles and passes its own tests and is a separate PR, I-15: agents raise, humans merge). Waves 0 to 1 is one small change, wave 2 one, wave 3 one, wave 4 one, waves 5 and 6 one each.

## 5. Required parity test: trailing-newline username (STATED, human decision 2026-11-13, test-plan section 5)

- File: `tests/parity_trailing_newline.rs`, test ids `PT-ACC-004a` to `PT-ACC-004f` (PARITY) and `UT-ACC-004` (UNIT, in `tests/unit_validate.rs`). Scenario SC-ACC-004. Rule BR-001. Requirement REQ-002 (REQ-002-AC1, AC2, AC3).
- Cases, all run against Python first and then Rust:
  - `"alice\n"` registers, 201, username kept with the newline.
  - `"alice"` then `"alice\n"` (and the reverse) are two accounts, both 201; `ALICE\n` after `alice\n` returns 409.
  - `GET /accounts/alice%0A` and `GET /accounts/alice` return the two different accounts.
  - `"alice\n\n"` is 422, `"\n"` is 422, `"ali\nce"` is 422, `"alice\r\n"` is 422, a 30-char name plus `"\n"` is 201.
- The test must fail if Rust rejects `"alice\n"`. The neighbouring cases make an over-broad fix fail too.
- Review check RC-001 (STATED): `src/accounts/validate.rs` carries the comment that the behaviour is deliberate and cites the 2026-11-13 decision.
- The story is not done until this test passes against both builds. When the follow-up fix lands after cutover this test changes in both builds by an explicit decision, never silently.

## 6. Known differences from Python (STATED, adr-001 section 5 decisions 1 to 3, test-plan section 6b)

The parity suite expects these and must not report them as failures. Each has one test pinning the Rust behaviour, in `tests/parity_known_differences.rs`. The harness whitelists exactly these inputs and nothing wider.

| # | Input | Python | Rust | Rule and requirement |
|---|---|---|---|---|
| 1 | Lone-surrogate password, or an out-of-range 64-bit id in a path | 500 | 4xx (422 for the password, 404 for the id) | BR-007, BR-008, REQ-019 |
| 2 | Request body above 1 MiB | accepted (201) | 413 | REQ-019, threat row 13 |
| 3 | Text of validation messages in the 422 `{"detail": [...]}` body | exact FastAPI text | same status and top-level shape, message text may differ | REQ-019 |

Domain `{"error": msg}` messages (for example "Username is taken") are NOT in this list and must match exactly.

## 7. Requirement and rule coverage (DERIVED)

| Rule | Requirements | Main files | Test files |
|---|---|---|---|
| BR-001 (STATED) | REQ-001, REQ-002 | validate.rs, service.rs | unit_validate, parity_accounts, parity_trailing_newline |
| BR-002 | REQ-003 | validate.rs | unit_validate, parity_accounts |
| BR-003 | REQ-004 | validate.rs | unit_validate, parity_accounts |
| BR-004 | REQ-005 | store.rs, service.rs | int_store, int_service, parity_accounts |
| BR-005 | REQ-006 | store.rs, service.rs | int_store, int_service, parity_accounts |
| BR-006 | REQ-007 | store.rs, service.rs, model.rs | int_service, parity_accounts, compat_accounts |
| BR-007 | REQ-008 | password.rs | unit_password, compat_accounts (no PARITY by design) |
| BR-008 | REQ-009 | service.rs | int_service, parity_accounts |
| BR-009 (STATED) | REQ-010 | service.rs | int_service, parity_accounts |
| BR-010 | REQ-011 | token.rs, config.rs, clock.rs | unit_token, unit_config, int_service, parity_accounts |
| BR-011 | REQ-012 | identity.rs, extract.rs, token.rs | int_identity, int_extract, parity_accounts |
| BR-012 | REQ-013 | identity.rs | int_identity, parity_accounts |
| BR-013 | REQ-014, REQ-015 | validate.rs, service.rs | unit_validate, int_service, parity_accounts |
| BR-014 (STATED field) | REQ-016 | model.rs, service.rs | int_service, parity_accounts, compat_accounts |
| cross-cutting | REQ-017 | platform/db.rs, main.rs | int_db_formats, startup_schema, compat_accounts |
| cross-cutting | REQ-018 | tests/parity/* | parity_harness_self, unit_normalise |
| cross-cutting | REQ-019 | error.rs, app.rs, routes.rs | int_app_errors, int_routes, parity_accounts |

14 of 14 rules and 19 of 19 requirements are mapped to at least one file and one test file.

## 8. Risks and notes (DERIVED)

- Regex: `^[a-z0-9_]{1,30}\n?\z` on the lower-cased input. If the unit test shows a mismatch with Python on any case, that is raised at design, not hidden.
- Python time control without code change: libfaketime if available, else rewriting stored timestamps in the database copy (test-plan section 9).
- Security-sensitive files (`password.rs`, `token.rs`, `identity.rs`, `extract.rs`) are reviewed by an agent other than their author (I-14, adr-002 S-04); a human merges (I-15).
- No Moderation code exists in story 1: suspended accounts are seeded in the database copy only.
- The Python repository is not changed (see `repos/minidon/plan.md`).
