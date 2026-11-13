# Build log: wave 6 (story 1, L1-accounts, compatibility tests)

Agent: coding-agent. Repo: `/Users/kurtis/tw/test-mw/minidon-rust`, branch `story-1-accounts`, 2 new commits on top of the 26 from waves 0 to 5 (nothing pushed or merged, no co-author line). No Rust source under `src/` changed in this wave: no Rust bug was found. Python reference repo `/Users/kurtis/tw/test-mw/minidon` never written (proof below). No run.json or ledger edit, no transition.

Label key (I-05): STATED = a human decision or the ticket, source given. DERIVED = found by running the Python oracle or designed by the agent.

## What was built

Commits:
- `64837f1` Add shared-database compat harness and COMPAT tests CT-ACC-006, 007, 014, SC-ACC-029, 030, NFR-011
- `cbc42e0` Add concurrent two-build write test to the compat suite

Files:
- `tests/parity/shared.rs` (new, DERIVED): `SharedPair`. The Python oracle and the Rust build serve ONE database file at the same time (the wave 5 `Pair` uses two copies). The file is a copy of the Python-made empty template (`create_tables()` in the oracle copy), so the schema is Python's and Rust never runs DDL. Reuses `oracle()`, `PythonServer`, `RustServer`, `Req`, `Observed`, `compare_with`, `dataset.rs` from wave 5 (`parity/mod.rs` only gained `pub mod shared;`). Both clocks move together (Python through the wrapper's `/__clock`, Rust through `FixedClock`). Requests go to one build with `send(side, req)`, or to both with `same(req)` (read only requests, answers compared after the wave 5 normaliser, date values included). The harness opens the file with `journal_mode=DELETE` explicitly, because sqlx defaults to WAL and would change the file for Python (note: the wave 5 `Pair::scalar` and `Pair::sql` use sqlx defaults on their database COPIES, which therefore end up in WAL mode. That is harmless there, but it is not the Python setup. Not changed, see "for the reviewers").
- `tests/compat_accounts.rs` (new): 12 tests, all on the shared file, synthetic data only (OP-09).
- `COMPAT_PYTHON_ONLY=1` (test-first check): the Rust side of every request goes to the oracle, so every expectation is proven on Python alone first.

## The 12 compat tests

| Test | Covers | What it proves |
|---|---|---|
| `ct_acc_007_password_hashes_cross_verify_in_both_directions` | CT-ACC-007, SC-ACC-015, BR-007, SC-ACC-013/014 | 5 passwords (ASCII, non-ASCII with emoji and CJK, spaces at the edges, 200 characters, tab and newline) x 2 makers: the account made by Python signs in on Rust and the account made by Rust signs in on Python, a wrong password is the generic 401 on the other build, the maker still accepts it. Case-folded user names across builds. Stored hash is `<32 hex>$<64 hex>` for both makers, no salt appears twice over 12 rows, no plaintext in any stored column |
| `ct_acc_007_a_copied_stored_hash_verifies_on_both_builds` | CT-ACC-007 | a hash string copied byte for byte into a second row signs in on both builds |
| `ct_acc_007_tokens_authenticate_on_the_other_build_with_the_exact_expiry_boundary` | CT-ACC-007, BR-010, BR-011 | Python-issued and Rust-issued tokens are read by both builds at start, expiry minus 1 day, minus 1 microsecond (200), at expiry, plus 1 microsecond (401), with a fractional start time. Token rows are 43 URL-safe characters, datetimes `YYYY-MM-DD HH:MM:SS.ffffff`, integer account id. Suspending the account signs the token out on both builds and sign-in is 403, unsuspending restores it |
| `ct_acc_006_stored_role_names_are_read_by_both_builds` | CT-ACC-006, BR-006 | first account (Python) stored `ADMIN`, then Rust, Python, Rust make `USER`. A seeded `MODERATOR` (not reachable through the API) is read as `moderator` by both builds, in me and lookup, with tokens from either build. A Rust PATCH leaves the stored `MODERATOR` alone |
| `ct_acc_006_the_first_account_made_by_rust_is_stored_as_admin_for_python` | CT-ACC-006, BR-006 | Rust makes the first account (stored `ADMIN`, Python reads `admin`). Count includes suspended accounts, so the next one is `USER` |
| `ct_acc_014_the_locked_flag_is_one_boolean_for_both_builds` | CT-ACC-014, BR-014, SC-ACC-027 | default 0, stored as integer. Each build locks, the other reads true (lookup and me), the other unlocks, a PATCH without the field leaves it alone, seeded 1 and 0 read the same |
| `sc_acc_029_rows_written_by_each_build_have_the_same_stored_formats_and_defaults` | SC-ACC-029, OP-05 | `typeof()` of every column and every column default equal for rows of both builds, `created_at` text exact, whole seconds keep `.000000` in the file, `suspended_at` NULL, ids are one sequence, wire dates read the same by both |
| `sc_acc_029_text_survives_a_round_trip_between_builds` | SC-ACC-029 | display name and bio (emoji with ZWJ, combining marks, CJK, CRLF, quotes, backslash, 500 characters) written by one build are read back identically by the other. Stored email lower-cased the same, duplicate e-mail and user name found across builds in any case |
| `sc_acc_030_rust_serves_a_python_made_dataset_and_python_reads_what_rust_writes` | SC-ACC-030, NFR-002, NFR-004 | 10 accounts from Python plus seeded role, suspension, follows and statuses. Rust serves lookup, sign-in and me for every account and equals Python (`same`, tokens cross-checked). Suspended account 404 on lookup and 403 on sign-in on both. Rust then registers 3 accounts, edits two, and Python reads them identically and signs in. Python writes over a Rust row and Rust reads it |
| `nfr_011_neither_starting_nor_serving_rust_changes_the_schema_or_journal_mode` | NFR-011, OP-05 | with both servers running the file is still byte for byte the Python template. A Rust workload (register, sign-in, PATCH, errors, bad routes) leaves `sqlite_master` (all SQL text), `schema_version`, `user_version` and `journal_mode=delete` unchanged. A Python workload leaves it equal too (so the fingerprint is a real baseline). No `-wal`, `-shm` or `-journal` file |
| `the_real_binary_and_python_share_one_database` | smoke | the real `minidon-rust` binary (system clock, `MINIDON_BIND`) and Python cross sign-in and authenticate on one file |
| `both_builds_can_write_to_the_one_file_at_the_same_time` | robustness | 12 registrations, alternating builds, concurrent, each signed in on the other build: all 201 and 200, 13 rows, exactly one `ADMIN`. No `database is locked` error |

Already covered earlier and not repeated (cited, not invented): the empty-database refusal with no DDL (`startup_schema`, `int_db_formats`), `store_leaves_the_schema_untouched` (INT), known-answer hashes from Python (`unit_password`), the stored datetime format (`int_db_formats`).

## Commands and results (all from the Rust repo via `nix develop -c`)

- Test first: `COMPAT_PYTHON_ONLY=1 cargo test --test compat_accounts`: 11 of 11 passed on the oracle alone (12 of 12 after the concurrency test). Honest order: my first Python-only run FAILED 2 tests, both because of mistakes in my expectations (a `COUNT(*)` read as text, and a suspended account `gina` is hidden from lookup, 404), fixed against the oracle's answer, not against Rust.
- First real run (both builds): 10 of 11 passed, 1 failed: `the_real_binary_and_python_share_one_database`. Cause: a test harness fault, not a Rust bug. The binary uses the real system clock and Python was frozen at 2026-01-01, so a Python token (expires 2026-01-31) was expired for the binary. Fixed: `SharedPair::new_with_binary` freezes Python at the real start time.
- Mutation checks (each mutation reverted, tree clean afterwards):
  - token expiry `<=` to `<` in `accounts/token.rs`: `ct_acc_007_tokens_...exact_expiry_boundary` fails.
  - fixed salt (no randomness) in `password.rs`: `ct_acc_007_password_hashes_cross_verify...` fails (salt reused).
  - stored datetime without `.000000` in `platform/clock.rs`: `sc_acc_029_rows_written_by_each_build...` fails.
  - read side of `MODERATOR` renamed in `from_stored`: `ct_acc_006_stored_role_names...` and `sc_acc_030...` fail. (A first mutation of `stored_name` was NOT detected, because Rust never writes `MODERATOR` in story 1, so that function is not reachable through compat. The read side is the one that matters.)
- `cargo test`: 292 passed, 0 failed (was 280, +12).
- Repeat runs (NFR-005): `compat_accounts` run 10 times in a row, 10 of 10 green, no retry, no sleep used to hide anything (the only sleeps are the 40 ms waits for a server port to open, as in wave 5). About 9 s per run.
- `cargo clippy --all-targets -- -D warnings`: clean. `cargo fmt --check`: clean. `cargo deny check`: advisories ok, bans ok, licenses ok, sources ok. No new crates, no `unwrap`/`expect` in `src/` (none touched), no unsafe, no DDL anywhere except the oracle's `create_tables()` in the Python copy.
- I-29 proof: `git status --short --ignored` in `/Users/kurtis/tw/test-mw/minidon` (only the ignored `.venv/` and `__pycache__` entries it already had), a SHA-256 over every file (2044 files, `.git` excluded, ignored files included) and a hash of every path with size and mtime were taken before the full test run and after it: identical (`/tmp/wave6/before.txt` and `after.txt`, script `/tmp/wave6/sum.sh`). The harness self-test `the_reference_repo_is_never_written_by_a_harness_run` also passed. The oracle copy is `/tmp/minidon-oracle-e1fbd3a` (git archive, `PYTHONDONTWRITEBYTECODE=1`, `uv sync --frozen`).

## Compat results: differences between the builds

None. Every round trip, in both directions, passed: password hash with random salts (BR-007), token (including the expiry boundary to the microsecond), stored dates, enum names (`ADMIN`, `USER`, `MODERATOR`), column defaults, locked flag, text round trip, whole synthetic dataset, concurrent writes, schema unchanged. No Rust bug found, no source change. Nothing unanticipated from Python, so nothing is UNRESOLVED from wave 6. U-01 to U-04 from wave 5 are unchanged and stay pinned in the parity suite as adr-001 decision 10 requires.

What this does NOT show (not tested, so not claimed): other Python versions or other SQLite builds (one pinned oracle, Python 3.12.15, SQLAlchemy 2.1.6), a real legacy database (OP-09), U-04 uniqueness across builds for an email that holds one of the 55 newer code points (a known and accepted difference, `u04_...` in wave 5), roles other than the three in the Python enum, a database where another process holds a long write lock, a file in WAL mode (Python is rollback journal and Rust follows it on purpose).

## Rule-to-test check (traceability.json, 14 rules, 39 planned test ids)

Method: `/tmp/wave6/check_trace.py` maps every planned test id to concrete test names, then checks each name exists in `cargo test -- --list` (292 tests). Result: 39 of 39 planned ids map to existing tests, all pass in the final run. Table below. The IDs of traceability.json are only in the names of some tests (`ut_acc_*`, `pt_acc_*`, `ct_acc_*`). The INT and some UNIT tests are named after scenarios (`sc_acc_*`) or behaviour, so the id-to-test mapping is by my reading of the scenario, not by name. A reviewer should confirm the mapping. Suggested follow-up: put the id in a comment above each mapped test.

Honest notes on thin or indirect coverage (nothing invented):
- BR-007: no PARITY by plan (random salt). Covered by UNIT known answers from Python plus 3 COMPAT tests. This is the only rule whose acceptance is not a parity test.
- UT-ACC-010 maps to the boundary unit test and the token shape test. IT-ACC-010 maps to `sign_in_issues_a_43_char_token...` and `it_acc_expiry_boundary_with_a_fixed_clock`.
- IT-ACC-011 and IT-ACC-012 have no test named after them. Mapped to `int_extract` and `int_identity` tests (expiry boundary, suspension on the next request, odd tokens, suspended hidden from lookup). The route level behaviour is in `int_routes::expired_and_suspended_tokens_are_signed_out` and `pt_acc_012`.
- SC-ACC-012 is INT only by plan (no PARITY): `sc_acc_012_...` plus the COMPAT check that suspended accounts still count.
- BR-014 scope limit stays as planned: the follow-request mechanism is story 2.
- Plan item "CI repeats the suite 10 times" (NFR-005): done by hand for compat here and for parity in wave 5. No CI file was written (CI is outside the files of the plan).

| rule | planned test id | layer | concrete tests | status |
|---|---|---|---|---|
| BR-001 | UT-ACC-001 | UNIT | ut_acc_001_valid_usernames, ut_acc_002_invalid_usernames, ut_acc_003_non_ascii_folding_matches_python | ok |
| BR-001 | PT-ACC-004a | PARITY | pt_acc_004a_alice_newline_is_accepted_and_kept | ok |
| BR-001 | PT-ACC-004b | PARITY | pt_acc_004b_alice_and_alice_newline_are_two_accounts_in_either_order | ok |
| BR-001 | PT-ACC-004c | PARITY | pt_acc_004c_lookup_with_and_without_the_newline_gives_different_accounts | ok |
| BR-001 | PT-ACC-004d | PARITY | pt_acc_004d_two_final_newlines_are_rejected | ok |
| BR-001 | PT-ACC-004e | PARITY | pt_acc_004e_a_lone_newline_and_a_newline_inside_are_rejected | ok |
| BR-001 | PT-ACC-004f | PARITY | pt_acc_004f_thirty_characters_plus_a_newline_pass_and_crlf_fails | ok |
| BR-001 | PT-ACC-001 | PARITY | pt_acc_001_usernames_are_validated_and_lower_cased | ok |
| BR-001 | UT-ACC-004 | UNIT | ut_acc_004_trailing_newline_set | ok |
| BR-002 | PT-ACC-002 | PARITY | pt_acc_002_email_needs_an_at_sign_and_is_trimmed_and_lower_cased | ok |
| BR-002 | UT-ACC-002 | UNIT | email_is_trimmed_and_lower_cased, email_only_needs_an_at_sign | ok |
| BR-003 | PT-ACC-003 | PARITY | pt_acc_003_password_length_counts_code_points | ok |
| BR-003 | UT-ACC-003 | UNIT | password_length_counts_code_points | ok |
| BR-004 | PT-ACC-004 | PARITY | pt_acc_004_username_is_unique_case_insensitively_suspended_included | ok |
| BR-004 | IT-ACC-004 | INT | sc_acc_008_duplicate_username_in_any_case, sc_acc_009_a_suspended_username_stays_reserved | ok |
| BR-005 | PT-ACC-005 | PARITY | pt_acc_005_email_is_unique_trimmed_lower_cased_suspended_included | ok |
| BR-005 | IT-ACC-005 | INT | sc_acc_010_duplicate_email_including_suspended_and_case_variants | ok |
| BR-006 | PT-ACC-006 | PARITY | pt_acc_006_first_account_is_admin_and_the_rest_are_users | ok |
| BR-006 | IT-ACC-006 | INT | sc_acc_011_first_account_is_admin_later_ones_are_users, sc_acc_012_admin_is_decided_by_count_even_when_all_are_suspended | ok |
| BR-006 | CT-ACC-006 | COMPAT | ct_acc_006_stored_role_names_are_read_by_both_builds, ct_acc_006_the_first_account_made_by_rust_is_stored_as_admin_for_python | ok |
| BR-007 | UT-ACC-007 | UNIT | sc_acc_013_known_answers_match_python, sc_acc_014_salts_differ_and_shape_is_32_dollar_64, ut_acc_007_tampered_hash_rows_never_panic | ok |
| BR-007 | CT-ACC-007 | COMPAT | ct_acc_007_password_hashes_cross_verify_in_both_directions, ct_acc_007_a_copied_stored_hash_verifies_on_both_builds, ct_acc_007_tokens_authenticate_on_the_other_build_with_the_exact_expiry_boundary | ok |
| BR-008 | PT-ACC-008 | PARITY | pt_acc_008_wrong_credentials_look_the_same_and_never_lock_out | ok |
| BR-008 | IT-ACC-008 | INT | sc_acc_016_wrong_password_and_unknown_user_look_identical | ok |
| BR-009 | PT-ACC-009 | PARITY | pt_acc_009_suspended_accounts_cannot_sign_in | ok |
| BR-009 | IT-ACC-009 | INT | sc_acc_017_suspended_account_with_the_right_password_is_403_and_gets_no_token, sc_acc_017_wrong_password_on_a_suspended_account_is_401_not_403 | ok |
| BR-010 | PT-ACC-010 | PARITY | pt_acc_010_token_lasts_30_days_with_an_exact_boundary | ok |
| BR-010 | IT-ACC-010 | INT | sign_in_issues_a_43_char_token_for_30_days_and_stores_it, it_acc_expiry_boundary_with_a_fixed_clock | ok |
| BR-010 | UT-ACC-010 | UNIT | ut_acc_010_expiry_boundary_is_less_than_or_equal, token_shape_is_43_url_safe_chars_from_32_bytes | ok |
| BR-011 | PT-ACC-011 | PARITY | pt_acc_011_unusable_tokens_are_signed_out | ok |
| BR-011 | IT-ACC-011 | INT | expiry_boundary_is_exact, suspension_is_seen_on_the_very_next_request, suspending_signs_out_on_the_very_next_request, unknown_empty_and_odd_tokens_are_signed_out | ok |
| BR-012 | PT-ACC-012 | PARITY | pt_acc_012_suspended_accounts_look_not_found | ok |
| BR-012 | IT-ACC-012 | INT | get_by_username_hides_suspended_accounts_in_any_case, the_including_suspended_variant_finds_a_suspended_account | ok |
| BR-013 | PT-ACC-013 | PARITY | pt_acc_013_display_name_and_bio_limits_count_code_points, pt_acc_013_partial_update_leaves_other_fields_alone | ok |
| BR-013 | UT-ACC-013 | UNIT | display_name_limit_is_30_code_points, bio_limit_is_500_code_points | ok |
| BR-013 | IT-ACC-013 | INT | sc_acc_023_display_name_boundary, sc_acc_024_bio_boundary, sc_acc_025_limits_count_code_points, sc_acc_026_partial_update_leaves_other_fields_alone | ok |
| BR-014 | PT-ACC-014 | PARITY | pt_acc_014_locked_flag_round_trips_with_pydantic_lax_booleans | ok |
| BR-014 | IT-ACC-014 | INT | sc_acc_027_locked_flag_round_trip | ok |
| BR-014 | CT-ACC-014 | COMPAT | ct_acc_014_the_locked_flag_is_one_boolean_for_both_builds | ok |

## Unresolved items

None new from wave 6. Carried from wave 5 and decided in adr-001 decision 10: U-01 to U-04 (accepted, pinned). Still open for a human: nothing blocks wave 6.

## For the testing-agent and the review-agent

- Review `tests/parity/shared.rs` and `tests/compat_accounts.rs` (author: coding-agent, so I-14 requires another agent). Look at: the explicit `journal_mode(Delete)` in `SharedPair::connect`, the hand-written concurrent join (`futures_join`, because `futures` is not an approved crate), the Python-only switch.
- Wave 5 `Pair::sql` and `Pair::scalar` open the two database copies with sqlx defaults, which means WAL mode on the COPIES (never on the shared file). It does not change any result, but a reviewer may want it switched to `journal_mode(Delete)` for consistency. I did not touch wave 5 files.
- The security-sensitive files from wave 4 and 5 (`extract.rs`, `routes.rs`, `scrub.rs`, `json.rs`, `path.rs`, `password.rs`, `token.rs`, `identity.rs`) still need an independent review (I-14). Wave 6 added no `src/` code.
- Re-run commands: `cd /Users/kurtis/tw/test-mw/minidon-rust && nix develop -c cargo test --test compat_accounts` (needs `uv`, `git`, network on first run for the oracle). Test-first mode: `COMPAT_PYTHON_ONLY=1`.
- Ask the testing-agent to try its own mutations of the stored formats, and to run the parity and compat suites 10 times together (NFR-005).
- Cutover items still carried: the trailing-newline follow-up (PT-ACC-004a..f), weaknesses F-A to F-I, the production Python version for U-04, CI wiring (the oracle setup needs `uv`), and a human merges (I-15).
