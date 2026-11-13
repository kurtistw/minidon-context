# Build log: waves 0 and 1 (story 1, L1-accounts)

Agent: coding-agent. Repo: `/Users/kurtis/tw/test-mw/minidon-rust`, branch `story-1-accounts`, 7 commits, nothing pushed or merged. Python repo untouched (`git status` clean there). Stopped after wave 1.

## What was built

Wave 0: `flake.nix`, `flake.lock`, `rust-toolchain.toml` (1.94.0, clippy, rustfmt, rust-src), `Cargo.toml`, `Cargo.lock`, `deny.toml`, `.cargo/audit.toml`, `.gitignore`, `CRATES.md`, stub `src/lib.rs` and `src/main.rs`, `tests/fixtures/python_schema.sql`.

Wave 1: `src/platform/{mod,config,clock,error,db,app}.rs`, real `src/main.rs`, tests `unit_config` (8), `unit_clock` (10), `unit_error` (4), `int_db_formats` (8), `int_app_errors` (10), `smoke_app` (1), `startup_schema` (3), helper `tests/support/mod.rs`. Total 44 tests, all green.

Flake: dev shell provides the pinned Rust (via rust-overlay reading `rust-toolchain.toml`), cargo-deny, cargo-audit, uv, sqlite CLI. `nix develop -c <cmd>` works without extra flags on this machine.

## Commands and results (all from the Rust repo, via `nix develop -c`)

- `cargo test`: 44 passed, 0 failed.
- `cargo clippy --all-targets -- -D warnings`: clean (`unwrap_used`, `expect_used` denied outside tests, `unsafe_code` forbidden).
- `cargo fmt --check`: clean.
- `cargo deny check`: advisories ok, bans ok, licenses ok, sources ok (with the exceptions below).
- `cargo audit`: passes with the ignore in `.cargo/audit.toml`.

Red then green: each test file was written first and seen failing (unresolved module or, for `startup_schema`, 3 test failures against the stub `main`), then the code was written. For config, clock, error, db and app the red state was a compile failure on the missing module, not an assertion failure. These tests are not parity tests, so the "green on Python first" rule does not apply to them (the plan applies it to parity tests in wave 5).

## Review findings applied

- M-05: `platform/clock.rs` has a lock-free `FixedClock` (set and advance to an exact instant, microsecond precision), tested at T0+30d and one second either side. The Python wrapper is wave 5 work. The facts it must respect are recorded in the clock.rs module comment (`utcnow` imported by name in `accounts/service.py` and bound as column default in `accounts/models.py`).
- M-06: every crate listed with version, licence and reason in `CRATES.md`. `time` chosen, not chrono. `base64` and `hex` added. reqwest (no TLS features) and tempfile are dev only.
- M-08 (wire part): `format_wire` omits a zero fraction, confirmed on Python/Pydantic (`2026-01-01T00:00:00`). The normaliser check itself is wave 5.
- M-09: `parse_database_url` turns `sqlite:///./minidon.db` into the relative path and `sqlite:////abs` into the absolute path, `sqlite://` and `:memory:` into memory, and rejects everything else with a message naming `MINIDON_DATABASE_URL`.
- m-06: 413 body specified, missing and wrong Content-Type cases tested (422).
- m-07: `lib.rs` declares only `platform`. JSON cases use test-only routes in `tests/int_app_errors.rs`.
- m-15: token ttl has no env var, tested.
- M-04 (partly): the Python-made schema is a fixture generated from the Python app at e1fbd3a (`uv sync --frozen` and `create_tables()` in a `git archive` copy under /tmp, so the reference repo was not written). Only tests apply it. A full Python-made database fixture and the harness remain a wave 5 matter.
- D2: `connect` never creates the file, `verify_schema` never runs DDL, tested byte-identical before and after.

## Deviations from the plan and ADRs, need a human decision

1. Licences (`deny.toml`, `CRATES.md`). Decision 5 allows only MIT, Apache-2.0, BSD. Unavoidable transitive crates carry Unicode-3.0 (ICU data crates via `url` via sqlx-core and reqwest, plus unicode-ident) and Zlib (`foldhash` via `hashbrown` via sqlx-core). Allowed per crate through `exceptions`, not globally. Without them `cargo deny check` cannot pass with sqlx.
2. Advisory RUSTSEC-2026-0459 (bundled SQLite before 3.54, needs a crafted sibling `-wal` file). The latest sqlx (0.9.0) pins `libsqlite3-sys` below 0.38; the fix is 0.39. Tried: sqlx 0.8.6 (same crate), unbundled linking (still flagged by the scanner, and adds an ISC build-time crate plus libclang). Ignored in `deny.toml` and `.cargo/audit.toml` with the reason and the exposure (one operator-owned file, journal mode DELETE, no extension loading). Remove when sqlx allows 0.39+. This is the one place a check was relaxed, so a human should confirm it.
3. Toolchain is 1.94.0, because sqlx 0.9 requires Rust 1.94.
4. sqlx feature `sqlite-bundled` only, not `sqlite` (which also enables extension loading).
5. `platform/db.rs` sets journal mode DELETE and foreign keys off (sqlx defaults are WAL and on). This matches a default SQLAlchemy and pysqlite connection, so the shared file is not switched to WAL under Python.
6. Enum name round-trip helpers from the plan's db.rs entry were not built: they belong with the `Role` enum in wave 2 `model.rs`.
7. Added `tests/support/mod.rs` and `tests/fixtures/python_schema.sql`, not in the plan.
8. `ApiJson` extractor and the response helpers live in `platform/error.rs`, not app.rs. 422 `detail` messages are fixed texts, never serde messages, because serde messages echo input values (passwords).
9. 413 body is `{"detail": "Request Entity Too Large"}`. DERIVED choice, Python has no limit.
10. `main.rs` binds `127.0.0.1:8000` with no override. The harness will need a free port per build (m-13), so a bind override may be added in wave 5.
11. `startup_schema.rs` tests only the failure paths of the binary (empty database, missing file, bad URL). A successful start binds port 8000 and is left to the harness.

## Unresolved

- Items 1 and 2 above need a human yes or no before the wave merges (I-15).
- Trailing-slash behaviour (FastAPI redirects, axum does not) is for wave 4 and the harness.
- `cargo audit` needs network access to fetch the advisory database.
