# Plan review 001: REBUILD-MINIDON story 1 (L1-accounts)

- Reviewer: plan-reviewer-agent (independent of code-plan-agent, which wrote both plans, I-14)
- Date: 2026-11-13
- Run state at review: PLAN_REVIEW
- Plans reviewed: `repos/minidon-rust/plan.md`, `repos/minidon/plan.md`
- Checked against: `ir/spec.json`, `spec/spec.md` (REQ-001..REQ-019), `test-plan.md`, `scenarios.md`,
  `traceability.json`, `adr/adr-001.md`, `adr/adr-002.md`, `open-points.md`, `impact.json`, and the Python
  reference `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488` (read only, nothing written there)

This review is advisory. It does not approve, reject or waive anything. Gate A is a human decision (I-23).

Label key (I-05): every finding is DERIVED (reviewer inference) unless it quotes a source. Python facts
below were read from the reference at `e1fbd3a` and, where marked "confirm on Python", must still be
confirmed by running the oracle, as the plan itself requires.

## Grading

| Grade | Meaning |
|---|---|
| Critical | The plan, if built as written, breaks an invariant or a human decision, or cannot meet the story's acceptance. Fix before Gate A. |
| Major | A wrong claim about the reference, a coverage or ordering gap, or a provenance error that would lead the builder to a parity failure or a scope breach. Fix before build starts. |
| Minor | Accuracy or completeness issue. Fix in the next plan revision or carry into build as a named task. |

## Verdict

**REVISE BEFORE BUILD (0 Critical, 9 Major, 15 Minor).**

The plans are well structured and mostly sound. Every one of the 14 rules and 19 requirements maps to at
least one file and one test, the trailing-newline parity test is fully planned, the three known differences
are planned, the Python plan makes no change to the reference (I-29), story scope is respected at the file
level, and the ADR decisions on DDL, stored formats and the 1 MiB limit are carried through.

The problems are in the detail the builder will rely on. Four Python facts the Rust plan states or implies
are wrong or missing (lookup lower-casing, profile counts read from Following and Posting tables, the
database URL form, and the scope of the lone-surrogate deviation). The wave order puts the parity harness
and the Python-made database last, although waves 1 to 3 already need them and the plan's own test-first
rule needs them first. The crate list goes beyond what the human approved, and several entries label
DERIVED behaviour as STATED.

None of this needs a new human decision except M-03 (wider lone-surrogate deviation) and M-06 (extra
crates). A revised plan should be re-reviewed before build.

| Grade | Count |
|---|---|
| Critical | 0 |
| Major | 9 |
| Minor | 15 |
| **Total** | **24** |

## Method

- Read both plans and every input listed above in full.
- Rebuilt the rule, requirement and test mapping myself from `traceability.json` and `spec.md`, then
  matched every test id and every requirement against the plan text (script over the files, not the
  plan's own section 7 table).
- Read the Python reference files the plan relies on: `minidon/accounts/service.py`, `routes.py`,
  `schemas.py`, `models.py`, `minidon/deps.py`, `config.py`, `errors.py`, `main.py`, `db.py`,
  `__main__.py`, `minidon/social/queries.py`, plus `git status --ignored` and the repo root listing.
- Checked wave dependencies file by file, and the size of each wave against I-11.
- Checked each file entry for a Why line and a STATED or DERIVED label, and compared each STATED label
  with the label its cited source gives.

## Check results (what holds)

| Check | Result |
|---|---|
| 14 of 14 rules covered by a file and a test | PASS. Every BR-001..BR-014 has a source file and at least one test file (own mapping, not the plan's). |
| 19 of 19 requirements covered by a file and a test | PASS with gaps in detail: REQ-011-AC2 (m-15), REQ-014-AC1 "profile unchanged" (m-12). |
| Traceability test ids present | PASS by range notation (PT-ACC-001..014, IT-ACC-004..014, PT-ACC-004a..f). UT-ACC-007 is not named (m-11). |
| Trailing-newline parity test (test-plan 5, RC-001) | PASS. All six cases, the "fails if Rust rejects" rule and the RC-001 comment are planned. Sign-in case missing (m-10). |
| Three known differences (test-plan 6b) | PASS for the list. Scope of difference 1 is incomplete (M-03), id case not exercisable in story 1 (m-05). |
| Python plan makes no change (I-29) | PASS. No ADDED, MODIFIED or REMOVED entries. Proof wording needs a fix (m-13). |
| Story scope (no Following, Notifications, Posting, Moderation) | PASS at file level. One hidden dependency on Following and Posting tables (M-02). |
| Build waves in valid dependency order | FAIL in part (M-04, m-07). |
| Each wave same-day integrable (I-11) | PARTIAL. Waves 0 to 4 plausible, wave 5 is not (M-04). |
| Why line and STATED or DERIVED label per file (I-05) | PARTIAL (M-07, m-09). |
| ADR decisions reflected | No DDL PASS, stored formats PASS with one gap (m-03), 4xx deviation PARTIAL (M-03), 1 MiB PASS (413 body unspecified, m-06), crate list FAIL (M-06), harness clock deviates from D4 (M-05). |

## Critical findings

None.

## Major findings

### M-01. Username lookup must lower-case its input, the plan says "exact, stored form"

- File and section: `repos/minidon-rust/plan.md` section 3, wave 3, `src/accounts/store.rs` and
  `src/accounts/identity.rs`.
- Finding: the plan says store "find by username (exact, stored form)" and `identity::get_by_username(db,
  username)` with no case handling. Python `find_by_username` compares `Account.username ==
  username.lower()` (`minidon/accounts/service.py:99`). Sign-in passes the raw username
  (`service.py:66`), and `GET /accounts/{username}` passes the raw path value (`routes.py:63-65`), so both
  are case-insensitive in Python because of the lookup, not because of the caller.
- Impact: built as written, sign-in with `Alice` and lookup of `LOU` (SC-ACC-022) fail on Rust. Later
  stories call `identity::get_by_username` (CF-004) and would inherit the bug.
- Fix: state that every username lookup in `store`/`identity` applies the same full Unicode lower-case as
  registration, before the exact compare; add unit and INT cases (`ALICE`, `ALICE%0A`, Kelvin sign).

### M-02. Profile counts read the Following and Posting tables; the plan hard-codes zero

- File and section: `repos/minidon-rust/plan.md` section 3, wave 2 `src/accounts/model.rs` ("including
  counts zero"), wave 1 `src/platform/db.rs` (checks only `accounts` and `access_tokens`); section 1 scope.
- Finding: Python `serialize_account` (`minidon/accounts/schemas.py:29-51`) computes `followers_count` and
  `following_count` from the `follows` table (accepted only, `minidon/social/queries.py:66-85`) and
  `statuses_count` from `statuses` (not deleted, not a boost). Every profile response in story 1 (register,
  `me`, lookup, PATCH) carries them.
- Impact: on the synthetic dataset (SC-ACC-030, REQ-017-AC1) any seeded follow or status makes Rust differ
  from Python. Querying those tables from Accounts breaks the CF-003 ownership shape; hard-coding zero
  breaks parity. The plan picks neither explicitly.
- Fix: choose and record one: (a) story 1 dataset holds no follows or statuses, Rust returns zero, with a
  test that fails once such rows exist, and story 2 and 3 replace the zeros through the owning modules; or
  (b) a read-only count query against `follows` and `statuses` placed behind a seam the owning stories
  take over, with `db.rs` checking those tables too. Either way, name it in section 1 and add a parity case.

### M-03. The lone-surrogate deviation covers more fields than the plan lists

- File and section: `repos/minidon-rust/plan.md` section 6, row 1, and `tests/parity_known_differences.rs`.
- Finding: the plan whitelists only "lone-surrogate password" and "out-of-range id". `serde_json` rejects a
  lone surrogate in any JSON string at parse time, so Rust answers 422 `{"detail": [...]}` for every field.
  Python behaves differently per field (DERIVED from reading, confirm on Python):
  - username with a lone surrogate: `lower()` works, the pattern fails, Python returns 422
    `{"error": "Username must be ..."}`. Rust returns 422 `{"detail": [...]}`: a different top-level body
    shape, which known difference 3 does not cover.
  - email, display name, bio with a lone surrogate that pass validation: Python fails when SQLite encodes
    the text, a 500.
  - sign-in password for an unknown user: Python returns 401 before hashing (`service.py:66-68`); only an
    existing user reaches the 500.
- adr-002 section 2.4 names "the five lone-surrogate and range inputs from adr-001 D3"; the plan does not
  list five. The plan also says the harness "whitelists exactly these inputs and nothing wider", so these
  cases would show as parity failures or be silently whitelisted.
- Fix: enumerate every input class and field with the Python and Rust outcome, and take the ones outside
  decision 1 (notably the username body-shape change) back to the human, or design a parse path that
  reproduces Python for them.

### M-04. Parity harness and Python-made database are needed from wave 1 but planned in wave 5

- File and section: `repos/minidon-rust/plan.md` section 1 (test-first rule), section 3 waves 1, 3 and 5,
  section 4 table and same-day size paragraph.
- Finding:
  - Section 1 says each test is "seen green on Python first, seen red on Rust, then made green". Parity
    tests are in wave 5, after the Rust routes (wave 4) are built, so they can never be red-first on Rust.
  - `tests/int_db_formats.rs` (wave 1), `tests/int_store.rs` and `tests/int_identity.rs` (wave 3) run "on a
    Python-made temp database copy", but the only planned way to make one, `tests/parity/dataset.rs`, is in
    wave 5. Rust may not create DDL (REQ-017), so waves 1 to 3 have no way to get a schema.
  - Wave 5 (harness core with Python process control and time control, normaliser, dataset, 13 rule parity
    tests, trailing-newline set, known differences) is the riskiest and largest wave; it is not credibly
    same-day (I-11).
- Fix: move harness core, normaliser and a Python schema/dataset fixture into an early wave (after the
  skeleton, it only needs a Rust binary that answers 404). Then add each rule's parity test in the same wave
  as the Rust code for that rule, which also splits wave 5 into same-day pieces.

### M-05. Python time control departs from adr-001 D4 and cannot hit the exact expiry instant

- File and section: `repos/minidon-rust/plan.md` section 3 wave 5 `tests/parity/mod.rs`, section 8 risk 2;
  `repos/minidon/plan.md` "How the oracle is used", bullet 3.
- Finding: adr-001 D4 chose a test-only wrapper in the harness copy that patches `utcnow`. The plans say
  libfaketime, else rewriting stored timestamps, and cite D4 as STATED for this. Rewriting `expires_at`
  against a live Python clock cannot make `expires_at == now` hold exactly, so SC-ACC-018 "exactly T0+30d
  returns 401" and NFR-005 (10 identical runs) are not deterministic on the fallback. libfaketime on the
  macOS dev machine (DYLD injection) is also unreliable.
- Reference fact the wrapper must respect: `utcnow` is imported by name (`minidon/accounts/service.py:14`)
  and bound as a column default (`minidon/accounts/models.py:33,45`), so patching `minidon.db.utcnow` alone
  does not change sign-in, authenticate or `created_at`.
- Fix: adopt the D4 wrapper (patch every bound reference in the copy, or freeze the clock in-process), or
  record why not and how the exact instant is reached on both builds.

### M-06. Crates beyond the human-approved list

- File and section: `repos/minidon-rust/plan.md` section 2 bullet 1 ("Crate list approved") and section 3
  wave 0 `Cargo.toml`.
- Finding: adr-001 section 5 decision 5 approves "the crate list as written" in D1: axum, tokio, sqlx,
  regex (fancy-regex fallback), pbkdf2, hmac, sha2, subtle, rand. The plan adds serde, serde_json,
  tower-http, "chrono or time" (undecided), reqwest and tempfile, and its own design needs crates it does
  not list (URL-safe base64 for tokens, hex encoding for the hash). Threat row 15 says crates are added only
  through reviewed changes with the security reviewer approving the list.
- Fix: list every runtime and dev crate with version, licence and reason, choose chrono or time, and get the
  extra crates approved before wave 0 merges.

### M-07. DERIVED behaviour labelled STATED (I-05)

- File and section: `repos/minidon-rust/plan.md` section 3 file headings.
- Finding: several entries label as STATED content their own source labels DERIVED:
  - `src/accounts/extract.rs` "STATED adr-002 2.1, 2.2 BR-011": adr-002 section 2 says "All DERIVED,
    except where a STATED source is named", and BR-011 is DERIVED in spec REQ-012.
  - `src/accounts/store.rs` "STATED adr-001 D1": serves BR-004..BR-006, BR-010..BR-014, all DERIVED; "bound
    parameters only" is in D1's DERIVED detail table.
  - `src/accounts/identity.rs` "STATED CF-004": ownership is STATED, but the behaviours it implements
    (BR-011, BR-012) are DERIVED.
  - `src/accounts/routes.rs` "STATED OP-06": optional auth and trailing-slash copy are DERIVED (and the
    first is wrong, m-01).
  - `src/accounts/mod.rs` "STATED adr-002 2.1": DERIVED design.
  - `tests/parity/dataset.rs` "STATED OP-09": seeding `suspended_at` is DERIVED (test-plan section 2, A-02).
  - `src/main.rs` "STATED adr-001 D1": address and env vars are D1 DERIVED details.
  - Section 2 heading "STATED, adr-001 D1 to D5": only the human-decided parts (OP-03, OP-05, OP-06, OP-07
    and section 5 decisions) are STATED.
- Fix: split labels per entry: STATED for the human decision cited, DERIVED for the design and behaviour.

### M-08. Normaliser can hide a date-format difference that OP-06 makes contract

- File and section: `repos/minidon-rust/plan.md` section 3 wave 5 `tests/parity/normalise.rs`; section 2
  bullet 2 ("wire dates naive ISO with `T`").
- Finding: the normaliser "replaces ... timestamps ... with stable placeholders", yet the same entry says
  the date format is not normalised. A placeholder that replaces the whole value hides format drift (for
  example a `Z` suffix, or `.000000` where Python prints none). DERIVED from Pydantic behaviour, confirm on
  Python: Pydantic omits the fractional part when microseconds are zero, so at the fixed clock T0 Python
  prints `2026-01-01T00:00:00` and a Rust formatter that always prints six digits differs.
- Fix: the normaliser must first assert the value matches the exact Python wire pattern (including the
  zero-microsecond rule) and only then replace it; `tests/unit_normalise.rs` must prove a format change is
  reported. Add the zero-microsecond rule to section 2.

### M-09. Database URL is SQLAlchemy form; the plan does not translate it

- File and section: `repos/minidon-rust/plan.md` section 3 wave 1 `src/platform/config.rs` and
  `src/platform/db.rs`.
- Finding: `MINIDON_DATABASE_URL` defaults to `sqlite:///./minidon.db` (`minidon/config.py:21`), which is
  SQLAlchemy syntax (three slashes then a relative path; four slashes for an absolute path). The plan keeps
  the same variable and default but says nothing about parsing it. Passed as is to sqlx, the path part is
  read differently (DERIVED: risk of opening `/./minidon.db` at the root or failing), so the two builds would
  not share one database file, which breaks the COMPAT layer and REQ-017.
- Fix: plan an explicit SQLAlchemy-to-sqlx URL translation for the `sqlite:///relative` and
  `sqlite:////absolute` forms, with unit cases in `tests/unit_config.rs` and an INT case that both builds
  open the same file.

## Minor findings

### m-01. `GET /accounts/{username}` has no optional auth in Python

- `repos/minidon-rust/plan.md` wave 4 `src/accounts/routes.rs`. Python `show(username, session)`
  (`routes.py:63-65`) takes no account dependency, so the `Authorization` header is ignored there. The plan
  says "optional auth". Observable result is the same, but it adds a database read and an auth path Python
  does not have. Drop it, and correct SC-ACC-020's wording in the next scenarios revision.

### m-02. Role enum must include MODERATOR explicitly

- `repos/minidon-rust/plan.md` wave 2 `src/accounts/model.rs`. Python `Role` is USER, MODERATOR, ADMIN
  (`minidon/accounts/models.py:12-15`). "`ADMIN`/`USER` and others as Python makes" is vague; a seeded
  moderator row must round-trip in story 1. Name all three and test them in `tests/unit_model.rs`.

### m-03. Insert must supply Python's client-side defaults

- `repos/minidon-rust/plan.md` wave 3 `src/accounts/store.rs`. `display_name ""`, `bio ""`, `locked
  false`, `role`, `suspended_at NULL` and `created_at` are SQLAlchemy `default=` values
  (`models.py:28-33,45`), not database defaults, so the Python-made schema gives Rust no defaults. State
  that Rust inserts every column with Python's values, and cover it in `tests/compat_accounts.rs`.

### m-04. Bearer parsing: exact prefix and Latin-1 whitespace

- `repos/minidon-rust/plan.md` wave 2 `src/accounts/token.rs`. Python requires the prefix `bearer ` with a
  single space after lower-casing (`deps.py:20`), so `Bearer<TAB>tok` is anonymous. Then it calls
  `str.strip()`, which also strips Latin-1 bytes such as U+00A0 and U+0085 that Starlette decodes from
  header bytes. The plan says non-ASCII headers give anonymous; Python may authenticate `Bearer
  <token><0xA0>` (confirm on Python through a real server, not TestClient). Add both cases to
  `tests/int_extract.rs` and the parity set.

### m-05. Out-of-range id difference is not exercisable in story 1

- `repos/minidon-rust/plan.md` section 6 row 1. The five Accounts routes have no integer path parameter.
  Say that the id half of difference 1 is pinned in the first story that has an id route, so
  `tests/parity_known_differences.rs` does not invent one.

### m-06. 413 body and Content-Type rejections unspecified

- `repos/minidon-rust/plan.md` wave 1 `src/platform/app.rs`. The 413 body above 1 MiB is not specified
  (axum's default is plain text). axum also returns 415 for a missing or wrong `Content-Type` and 400 for
  some JSON syntax errors, where FastAPI answers 422 (DERIVED, confirm on Python). Specify the 413 body and
  add missing and wrong `Content-Type` cases to `tests/int_app_errors.rs`.

### m-07. Wave 0 and wave 1 files depend on later waves

- `repos/minidon-rust/plan.md` section 3 waves 0 and 1, section 4. `src/main.rs` (wave 0) opens the
  database and checks the schema, which is `platform/db.rs` (wave 1); `src/lib.rs` (wave 0) declares the
  `accounts` module (wave 2) and exposes `build_app` (wave 1). `tests/int_app_errors.rs` (wave 1) tests
  malformed JSON and missing fields with no JSON route yet. Waves 0 and 1 ship as one change, so this is
  minor, but `lib.rs` must not declare `accounts` before wave 2, and the JSON cases need a test-only route
  or a move to wave 4.

### m-08. File count and impact.json understate the change

- `repos/minidon-rust/plan.md` section 4 ("About 30 files"); `impact.json` `scope.repositories[1]
  .estimatedFiles: 0`. The plan has 30 source and harness files plus about 18 test files (about 48). The
  minidon-rust estimate in impact.json is 0, which can mislead the change-sizing check (I-11). Correct the
  count in the plan and ask the owner of impact.json to update it.

### m-09. Missing labels and Why lines

- `repos/minidon-rust/plan.md` section 3. `src/platform/mod.rs` and the "`src/accounts/` wiring" entry have
  no STATED or DERIVED label. `tests/parity_trailing_newline.rs` and `tests/parity_known_differences.rs`
  have no Why line in their entry (only "See section 5/6"). Add both.

### m-10. Trailing-newline set lacks sign-in

- `repos/minidon-rust/plan.md` section 5. adr-001 threat row 3 lists "sign-in and lookup with `%0A`" as
  parity cases. The plan covers lookup only. Add sign-in as `alice\n` returning the look-alike's token, and
  sign-in as `alice` not reaching it.

### m-11. Test id gaps and a collision

- `repos/minidon-rust/plan.md` wave 2 `src/accounts/password.rs`, section 5. UT-ACC-007 (traceability
  BR-007) is not named; `tests/unit_password.rs` should carry it. PT-ACC-004 (BR-004 parity) and
  PT-ACC-004a..f (BR-001 trailing newline) share a prefix from `traceability.json`; use the full ids in test
  names so a report cannot conflate them.

### m-12. REQ-014-AC1 "profile unchanged" not planned

- `repos/minidon-rust/plan.md` wave 3 `src/accounts/service.rs`. Python mutates `display_name` before
  checking `bio` and relies on no commit (`service.py:121-131`). State that Rust validates all fields before
  writing, and add a case (valid display name plus invalid bio returns 422 and changes nothing) to
  `tests/int_service.rs` and the parity set.

### m-13. "`git status --ignored` clean" cannot hold; port and startup facts

- `repos/minidon/plan.md` "How the oracle is used" bullet 4; `repos/minidon-rust/plan.md` wave 5
  `tests/parity/mod.rs`. The reference already has ignored `.venv/` and several `__pycache__/` directories
  today, so the proof must be "unchanged before and after", not "clean". Also `python -m minidon` runs
  `create_tables()` and hard-codes `127.0.0.1:8000` (`minidon/__main__.py:9-10`), the same default as the
  Rust binary, and `cargo test` runs tests in parallel. Plan how the harness creates the schema, and starts
  each build on its own free port.

### m-14. Python reference map is incomplete

- `repos/minidon/plan.md` "Read-only reference map". Missing: `minidon/social/queries.py` and
  `minidon/statuses/models.py` (profile counts, M-02), `minidon/__main__.py` (schema creation and port,
  m-13). `service.py` also serves BR-014 (`update_profile` locked flag), not only BR-001..BR-013.

### m-15. REQ-011-AC2 cannot be shown on Python; risk of a new env var

- `repos/minidon-rust/plan.md` wave 1 `src/platform/config.rs`. Python `token_ttl_days` is a dataclass
  default with no env var (`minidon/config.py:17,20-23`). The plan says it is "configurable per
  REQ-011-AC2" but not how. Adding `MINIDON_TOKEN_TTL_DAYS` would be new behaviour. State that the override
  is a code or test-only setting, and that REQ-011-AC2 is proven at UNIT/INT only and is exempt from the
  "green on Python first" rule, with the reason.

## Python reference facts spot-checked

| Plan claim | Reference | Result |
|---|---|---|
| Pattern `^[a-z0-9_]{1,30}$`, lower-case first, no strip | `service.py:17,39,41` | Confirmed |
| Email `strip().lower()`, only `@` checked | `service.py:40,43` | Confirmed |
| Check order username, email, password, then username 409, then email 409 | `service.py:41-50` | Confirmed |
| First account Admin by `COUNT(*)` | `service.py:53,58` | Confirmed |
| Hash `<salt hex>$<digest hex>`, 16-byte salt, 100,000 iterations, `compare_digest` on hex | `service.py:21,24-35` | Confirmed |
| Password checked before suspension, 401 then 403 | `service.py:66-70` | Confirmed |
| Token `token_urlsafe(32)`, expiry `utcnow() + ttl`, expired when `<= now` | `service.py:72-74,83` | Confirmed |
| Lookup "exact, stored form" | `service.py:99` lower-cases input | Wrong (M-01) |
| Profile counts zero | `schemas.py:29-51` reads follows and statuses | Incomplete (M-02) |
| Same env vars and defaults as `config.py` | `config.py:20-23`, URL is SQLAlchemy form, ttl has no env var | Incomplete (M-09, m-15) |
| `GET /accounts/{username}` optional auth | `routes.py:63-65` has no auth dependency | Wrong (m-01) |
| Bearer prefix case-insensitive, token stripped | `deps.py:20-22` | Confirmed, detail in m-04 |
| Domain errors `{"error": msg}`, no custom 500 handler | `main.py:18-20`, `errors.py` | Confirmed |
| Roles stored upper-case | `models.py:12-15` (USER, MODERATOR, ADMIN) | Confirmed, MODERATOR to name (m-02) |
| `uv sync --frozen` possible | `uv.lock` present at repo root | Confirmed |

## Recommendation to the Gate A decider

Send the Rust plan back to code-plan-agent for one revision covering M-01 to M-09 and the minors, and take
two items to a human before build: the wider lone-surrogate deviation (M-03) and the extra crates (M-06).
The Python plan needs only m-13 and m-14. After revision, a fresh review (plan-review-002) by an agent other
than the plan author should confirm the fixes.
