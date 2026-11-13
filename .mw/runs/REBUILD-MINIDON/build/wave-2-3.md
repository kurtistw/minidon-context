# Build log: waves 2 and 3 (story 1, L1-accounts)

Agent: coding-agent. Repo: `/Users/kurtis/tw/test-mw/minidon-rust`, branch `story-1-accounts`, 9 commits on top of the 7 from waves 0 and 1 (nothing pushed or merged, no co-author line). Python repo untouched. Stopped after wave 3: no routes, no extractors, no harness.

## What was built

Wave 2 (pure logic, `src/accounts/`):
- `mod.rs`: declares the modules. `store` and `service` are `pub` only because the integration tests under `tests/` call the crate as a library (the plan says private). Only `identity` is the API for other capabilities (CF-004). Convention, not enforced by the compiler.
- `model.rs`: `Role` (USER, MODERATOR, ADMIN) with `stored_name`, `wire_name`, `from_stored` (exact match only, as SQLAlchemy), `is_staff`; `Account`, `AccessToken`, `ProfileCounts`, `AccountOut` (Python field order), `RegisterIn`, `TokenIn`, `ProfileIn` (missing field and null both mean leave alone). This is where the enum-name helpers deferred from wave 1 went.
- `validate.rs`: `normalise_username`, `username_valid` (`^[a-z0-9_]{1,30}\n?\z`, with the "deliberate, human decision 2026-11-13, RC-001" comment and the follow-up), `python_strip` (Python whitespace set = Rust `is_whitespace` plus U+001C to U+001F), email, password, display name and bio rules in code points, and the Python message texts as constants.
- `password.rs`: PBKDF2-HMAC-SHA256, 100,000 rounds, 16-byte OS salt, `<salt hex>$<digest hex>`, `subtle` constant-time compare of the hex texts, `PasswordError` (maps to the fixed 500) for rows that cannot be read. No panic path.
- `token.rs`: `new_token` (43 chars), `expires_at`, `is_expired` (`<=`), `parse_bearer` (prefix `bearer ` case-insensitive, Python strip, empty token is anonymous), `latin1_to_string` (Starlette decodes header bytes as latin-1).

Wave 3:
- `store.rs`: sqlx with literal SQL and bound parameters only. `find_by_username` lower-cases its input (M-01). `insert_account` writes every column with Python's code defaults (m-03). `profile_counts` reads `follows` and `statuses` (M-02). `update_profile` uses `COALESCE` so only given fields change.
- `identity.rs`: `get_by_username` (suspended is `NotFound("Account not found")`, as Python raises), `get_by_username_including_suspended`, `get_by_id`, `authenticate(pool, clock, token)`. Every call reads the database.
- `service.rs`: `register`, `sign_in`, `update_profile`, `serialize_account`. PBKDF2 runs in `spawn_blocking`.
- `platform/db.rs`: `verify_schema` now also requires `follows` and `statuses` (needed for M-02).
- `Cargo.toml`: dev-profile opt-level for `sha2`, `pbkdf2`, `hmac` and the `minidon-rust` package (service tests 13 s down to 1.4 s). Not a crate change.
- `tests/fixtures/python_schema.sql`: added the `follows` and `statuses` DDL, generated from the Python models at e1fbd3a with SQLAlchemy `CreateTable` in a `git archive` copy under `/tmp/mw-schema-gen` (reference repo not written; `PYTHONDONTWRITEBYTECODE=1`; `git status --short --ignored` in the reference is the same before and after, and no `.pyc` newer than the script exists).
- `tests/support/mod.rs`: `apply_python_schema`, `schema_state`.

No new crates. No `unwrap`/`expect` outside tests, no unsafe, no DDL in `src/`.

## Tests (test first, red seen before green)

Each test file was written first and seen failing (compile error on the missing module or function, or for the db check an `unwrap_err` on `Ok`), then the code was written. These are unit and INT tests, so the "green on Python first" rule does not apply to them. Python expectations were taken by reading the reference and by running Python 3 stdlib one-offs (regex cases, whitespace set, lower-casing, PBKDF2 known answers), not by running the app.

| File | Tests | Covers |
|---|---|---|
| `tests/unit_model.rs` | 8 | Role names both ways, MODERATOR, junk rejected, profile JSON key order, no secrets, wire date |
| `tests/unit_validate.rs` | 14 | UT-ACC-001..004, 013, SC-ACC-001..007, 023..025 (Kelvin sign, İstanbul, final sigma, newline set) |
| `tests/unit_password.rs` | 7 | UT-ACC-007, SC-ACC-013, 014 (3 Python known answers incl. non-ASCII), tampered rows |
| `tests/unit_token.rs` | 8 | UT-ACC-010, SC-ACC-018, 019, bearer cases, latin-1 (m-04) |
| `tests/int_store.rs` | 19 | IT-ACC-004..006, 011, 014, M-01, M-02, m-03, inert SQL text, no schema change |
| `tests/int_identity.rs` | 13 | IT-ACC-011, 012, SC-ACC-018, 020..022, next-request suspension, deleted account row |
| `tests/int_service.rs` | 42 | SC-ACC-001..012, 013, 015..017, 023..027, 029, 50 wrong passwords, check order, m-12, look-alike sign-in |
| `tests/int_db_formats.rs` | +1 | follows and statuses are checked at startup |

Total now 156 tests (44 before, 112 new), all green.

## Commands and results (from the Rust repo, via `nix develop -c`)

- `cargo test`: 156 passed, 0 failed.
- `cargo clippy --all-targets -- -D warnings`: clean.
- `cargo fmt --check`: clean.
- `cargo deny check`: advisories ok, bans ok, licenses ok, sources ok (waves 0-1 exceptions per adr-001 decision 9 unchanged).

## Review findings applied

- M-01: store lower-cases every username lookup. Tests: `ALICE`, Kelvin sign, `ALICE\n`, stored `Mixed` is unreachable (as Python).
- M-02: counts come from the tables (option b). Read only, behind `store::profile_counts`, marked as a seam for stories 2 and 3. `db.rs` checks the tables. Test with accepted and pending follows, deleted statuses and boosts.
- M-03 (pure part): any username with U+FFFD fails the pattern with Python's message. Wave 4 must do the pre-parse (below). Unknown-user sign-in is 401 before hashing (tested with passwords that could not be hashed).
- M-07: module comments label STATED only for the human decision cited (CF-004, RC-001, BR-009) and DERIVED for the rest.
- m-02: MODERATOR named and tested. m-03: insert supplies Python's defaults. m-04: bearer prefix needs exactly one space, latin-1 decode and Python strip, tested. m-11: test names carry the full ids (`ut_acc_007_...`, `sc_acc_004_...`). m-12: all fields validated before any write, display name first.

## Where Python disagreed with the plan (Python wins)

1. Lookup is case-insensitive in the store (M-01, plan said exact stored form).
2. `get_by_username` raises 404 "Account not found" in Python, so the Rust identity function returns `Err(NotFound)`, not an option. The including-suspended variant returns an option.
3. Profile counts are not zero (M-02).
4. `store` and `service` are `pub`, plan says private (tests need them).
5. Python `bytes.fromhex` skips ASCII whitespace inside the salt text; Rust accepts strict hex only, so a row like `ab cd...` is an error in Rust and works in Python. No such row is ever written by either build.
6. Python `compare_digest` raises on a non-ASCII stored digest (500); Rust returns the same error. An upper-case stored digest is a plain mismatch in both.

## Unresolved or for a human

- Lower-casing and strip rely on Rust's Unicode tables (Rust 1.94) versus the Python version's tables. Identical on every case tested. A character added to Unicode between the two versions could differ for emails. Only the wave 5 parity run can rule that out.
- The plan's "unknown user returns 401 before hashing" is proven by behaviour (odd passwords, no 500), not by timing. No timing test, on purpose (flaky).
- Pydantic accepts lax booleans for `locked` (for example `"true"`, `1`) and numbers or strings in other fields as per its coercion rules; serde is strict. Confirm on Python in wave 5 and decide whether it is contract (OP-06).

## What wave 4 must handle

- Pre-parse for lone surrogates (adr-001 decision 6). `serde_json` rejects a `\ud800` escape. Wave 4 needs a step before it that replaces a lone surrogate escape with U+FFFD and records which field it was in:
  - `username` in register: leave as U+FFFD, the service then returns Python's 422 `{"error": "Username must be ..."}` (tested at service level).
  - `password` in sign-in: unknown user must still be 401, so the handler must look the user up first (`identity::get_by_username_including_suspended`) and only then return a 4xx for a known user. The service has no flag for this yet.
  - email, display name, bio, register password: after the service rules would pass, answer 4xx instead of inserting (Python 500). Today the service would store U+FFFD, so the handler must stop it before calling the service when the field passed validation. Order matters for which 422 body shows first.
  - The harness whitelists only these inputs.
- Latin-1: build the bearer header string with `token::latin1_to_string(value.as_bytes())`, then `parse_bearer`, then `identity::authenticate`.
- `GET /accounts/{username}` has no auth in Python (m-01): no extractor, no `Authorization` read. URL-decode the path so `alice%0A` reaches `identity::get_by_username` as `alice\n`.
- Profile responses: always `service::serialize_account` (counts from the tables).
- Sign-in body: `access_token`, `token_type` "bearer", `expires_at` via `format_wire`. Status 201 for register, 200 elsewhere.
- Trailing-slash behaviour (FastAPI redirects) still open from wave 1.
- `PATCH` with wrong JSON types (for example `locked: "yes"`): 422 `{"detail": ...}`, confirm lax coercion against Python.
- `extract.rs` and `routes.rs` are security-sensitive and need a reviewer other than their author (I-14).
