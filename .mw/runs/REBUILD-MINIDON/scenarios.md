# Scenarios: REBUILD-MINIDON story 1, L1-accounts

Owner: qa-planning-agent. Scope: the 14 live L1-accounts rules, cited as `L1-accounts/BR-nnn` (capability plus id, never spec section numbers).
Label key (I-05): STATED = a person, the ticket, README or a human decision said it. DERIVED = inferred by an agent from code or rule text, open to challenge.

Conventions (all DERIVED, from OP-07 and NFR-001/005/010):
- Every scenario runs as the same HTTP request against the Python reference (minidon@e1fbd3a, read-only) and the Rust build, each on its own copy of the same synthetic dataset (OP-09). Pass means same status and same body after normalisation.
- Fixed clock: `T0 = 2026-01-01 00:00:00 UTC`. Normalisation replaces generated ids, timestamps and token values with stable placeholders. Error bodies, the date format and 404/405 bodies are NOT normalised (OP-06).
- "Expected" values below are DERIVED from reading the Python code and must be confirmed by running Python first. If Python disagrees, Python wins and the scenario text is corrected.
- Base path is `/api/v1`. Layers: UNIT (Rust function level), INT (Rust service plus SQLite), PARITY (black-box dual-target HTTP), COMPAT (cross-build data round trip).

## L1-accounts/BR-001 - username shape, case-insensitive (STATED)

### SC-ACC-001 Valid usernames are accepted and lowercased - PARITY, UNIT
- Given an empty instance and the fixed clock
- When `POST /accounts` is sent with username `Alice_01`, a valid email and an 8-char password
- Then the status is 201 and the profile shows username `alice_01`

### SC-ACC-002 Invalid usernames are rejected - PARITY, UNIT
- Given an empty instance
- When registering with username `""`, a 31-char username, `bad-name`, `has space`, or full-width digits `１２３`
- Then each returns 422 with the Python error body for "Username must be 1-30 letters, digits or underscores"; a 30-char username returns 201

### SC-ACC-003 Non-ASCII username folding - PARITY, UNIT
- Given an empty instance
- When registering with `Ålice` (accented), `用户` (CJK), `İstanbul` (lower-case gives i plus combining dot), and `Kelvin` (Kelvin sign, lower-cases to ASCII `k`)
- Then the first three return 422; the Kelvin-sign name returns 201 stored as `kelvin` (DERIVED from Python `str.lower()`; Rust must match, NFR-010)

### SC-ACC-004 Trailing-newline username is accepted, deliberately (REQUIRED, STATED) - PARITY, UNIT
- Basis: STATED human decision 2026-11-13 (human-decisions.md section 5, one-pager section 4). Copy Python for parity. This is a known defect, rejecting it is a follow-up after cutover, outside this story.
- Given an empty instance
- When `POST /accounts` is sent with username `"alice\n"` (JSON string with one final LF)
- Then the status is 201 and the stored and returned username is `"alice\n"` in both builds
- And when `"alice"` is then registered with a different email, it also returns 201 as a separate account (look-alike pair, DERIVED from Python `find_by_username` exact match)
- And `GET /accounts/alice%0A` and `GET /accounts/alice` return the two different accounts
- Edge set (all PARITY): `"alice\n\n"` returns 422 (only one final newline is tolerated); `"\n"` alone returns 422; a 30-char name plus `"\n"` returns 201; `"ali\nce"` returns 422; `"alice\r\n"` returns 422
- Required in Rust source: an explicit comment that this is deliberate and cites the decision (checked in review, not in a test)

## L1-accounts/BR-002 - email must contain @ (DERIVED)

### SC-ACC-005 Email without @ is rejected - PARITY, UNIT
- Given an empty instance
- When registering with email `not-an-email`
- Then 422 with body error "Email address is not valid"

### SC-ACC-006 Email trimmed and lowercased, minimal check - PARITY, UNIT
- Given an empty instance
- When registering with email `  Bob@Example.COM ` and separately `@`, and `ÄÖ@Ü.de`, and an email wrapped in U+00A0
- Then the first is stored as `bob@example.com` (201), `@` is accepted (201, only `@` presence is checked), non-ASCII is lowercased as Python does, U+00A0 is stripped as Python `str.strip()` does

## L1-accounts/BR-003 - password at least 8 characters (DERIVED)

### SC-ACC-007 Password length boundary in code points - PARITY, UNIT
- Given an empty instance
- When registering with passwords of 7 chars, 8 chars, 7 emoji (28 bytes), 8 emoji (32 bytes)
- Then 7 chars and 7 emoji return 422 "Password must be at least 8 characters"; 8 chars and 8 emoji return 201 (counted as code points, not bytes, NFR-010)

## L1-accounts/BR-004 - username unique, case-insensitive, includes suspended (DERIVED)

### SC-ACC-008 Duplicate username in any case - PARITY, INT
- Given account `carol` exists
- When registering `CAROL` with a new email
- Then 409 "Username is taken"

### SC-ACC-009 Suspended account's username stays reserved - PARITY, INT
- Given account `dave` exists and is suspended (seeded in the dataset by setting `suspended_at`, no Moderation code needed)
- When registering `dave` with a new email
- Then 409 "Username is taken"

## L1-accounts/BR-005 - email unique across all accounts (DERIVED)

### SC-ACC-010 Duplicate email incl. suspended and case variants - PARITY, INT
- Given account `erin` with email `erin@x.org`, and a suspended account `frank` with email `frank@x.org`
- When registering a new username with `ERIN@x.org`, then with `frank@x.org`
- Then both return 409 "Email is already registered" (email is trimmed and lowercased first)

## L1-accounts/BR-006 - first account becomes Admin (DERIVED)

### SC-ACC-011 First registrant is Admin, later ones are User - PARITY, INT
- Given an empty instance
- When `first` registers, then `second` registers
- Then `first` has role admin and `second` has role user (observed through `GET /accounts/me`, and in the stored enum value `ADMIN`/`USER` in the COMPAT check)

### SC-ACC-012 Admin is decided by account count, not by name - INT
- Given a non-empty dataset whose accounts were all suspended
- When a new account registers
- Then it is a User (count is over all accounts, DERIVED from `COUNT(*)`)

## L1-accounts/BR-007 - PBKDF2-HMAC-SHA256, 100k iterations, random salt (DERIVED)

### SC-ACC-013 Hash format and algorithm known-answer - UNIT
- Given salt bytes and a password fixed in the test
- When the Rust hasher runs
- Then the output is `<salt hex>$<digest hex>` and equals the Python result for the same salt and password (known-answer vectors generated once from Python, including non-ASCII passwords encoded as UTF-8)

### SC-ACC-014 Two hashes of one password differ - UNIT
- When the same password is hashed twice
- Then the salts are 16 bytes and the two stored strings differ

### SC-ACC-015 Hashes cross-verify between builds - COMPAT
- Given an account created through Python and another created through Rust, on one shared database file
- When each signs in on the other build
- Then sign-in returns 200 (NFR-002, NFR-004); plaintext never appears in the stored row
- Note: stored hash strings are never compared across builds, because the salt is random (excluded from normalised parity)

## L1-accounts/BR-008 - wrong credentials rejected without detail (DERIVED)

### SC-ACC-016 Wrong password and unknown user look identical - PARITY, INT
- Given account `gina` exists
- When `POST /auth/token` is sent with `gina` and a wrong password, and again with unknown user `nobody`
- Then both return 401 with the same body "Invalid username or password"
- Note: DERIVED, the reference also leaks existence through response timing and registration 409. That is accepted weakness carried to design (one-pager section 5) and is not tested as a defect

## L1-accounts/BR-009 - suspended accounts cannot sign in (STATED)

### SC-ACC-017 Suspended account with correct password - PARITY, INT
- Given account `hank` exists with a valid token, then `suspended_at` is set (seeded)
- When `POST /auth/token` is sent with the correct password
- Then 403 "This account is suspended"
- And a wrong password on the same suspended account returns 401, not 403 (password is checked first, DERIVED from service order)

## L1-accounts/BR-010 - token expires 30 days after issue (DERIVED)

### SC-ACC-018 Token lifetime boundary with a fixed clock - PARITY, INT
- Given the clock is T0 and `ivy` signs in
- When the token is used at T0+30d minus 1s, at exactly T0+30d, and at T0+30d plus 1s
- Then `GET /accounts/me` returns 200, 401, 401 (expiry check is `expires_at <= now`, DERIVED)
- Python side: time is controlled by libfaketime or by rewriting `expires_at` in the shared database copy (Python code is not changed, NFR-005)

### SC-ACC-019 Issued token shape - PARITY (shape only), UNIT
- When sign-in succeeds
- Then the body has the same keys as Python and the token is a URL-safe string of 43 chars (32 random bytes); the token value is normalised

## L1-accounts/BR-011 - expired or suspended-account token is signed-out (DERIVED)

### SC-ACC-020 Expired token is treated as no token - PARITY, INT
- Given an expired token (see SC-ACC-018)
- When `GET /accounts/me` is sent
- Then 401, and a public endpoint that uses optional auth (`GET /accounts/{username}`) returns 200 as for a signed-out caller

### SC-ACC-021 Token of a now-suspended account - PARITY, INT
- Given `jay` holds a valid token, then `jay` is suspended (seeded)
- When `GET /accounts/me` is sent with that token
- Then 401
- And a token for a deleted/unknown account row is also treated as signed-out (INT only, no public way to create it)
- And an unknown or malformed token returns 401 with the same body as a missing token (PARITY)

## L1-accounts/BR-012 - suspended accounts look not-found (DERIVED)

### SC-ACC-022 Lookup of a suspended account - PARITY, INT
- Given `kim` is active and `lou` is suspended
- When `GET /accounts/kim` and `GET /accounts/lou` (also `LOU`) are sent
- Then `kim` returns 200 and `lou` returns 404 "Account not found" in any case
- And the INT test confirms the include-suspended variant of the lookup used by sign-in and registration still finds `lou` (the stable `get_by_username` contract owned by Accounts, human decision CF-004)

## L1-accounts/BR-013 - display name 30, bio 500 (DERIVED, field existence STATED)

### SC-ACC-023 Display name boundary - PARITY, UNIT
- Given signed-in `mia`
- When `PATCH /accounts/me` sets display name of 30 chars, then 31 chars
- Then 200 then 422 "Display name must be at most 30 characters"

### SC-ACC-024 Bio boundary - PARITY, UNIT
- When `PATCH /accounts/me` sets a bio of 500 chars, then 501 chars
- Then 200 then 422 with the Python bio message

### SC-ACC-025 Limits count code points - PARITY, UNIT
- When setting a display name of 30 emoji, 30 CJK chars, and 15 letters plus 15 combining marks, then each plus one more
- Then the 30-code-point values return 200 and the 31-code-point values return 422 (code points, not bytes or grapheme clusters, NFR-010)

### SC-ACC-026 Partial update leaves other fields alone - PARITY, INT
- Given `mia` has a display name, a bio and locked false
- When `PATCH /accounts/me` sends only the bio
- Then display name and locked are unchanged (field omission versus null is compared in both builds and recorded; DERIVED, confirm on Python)

## L1-accounts/BR-014 - locked flag stored and exposed (STATED field, DERIVED mechanism)

### SC-ACC-027 Locked flag round trip - PARITY, INT, COMPAT
- Given `nia` is signed in with locked false
- When `PATCH /accounts/me` sets locked true, then `GET /accounts/nia` is read
- Then both show locked true, and the stored value is read the same by the other build (boolean column format, NFR-002)
- Scope limit (DERIVED): the follow-request behaviour the flag drives belongs to `L1-following/BR-002` and is proven in story 2, not here. Here we prove only that Accounts stores, updates and exposes the flag

## Cross-cutting scenarios for the Accounts endpoints (DERIVED, NFR-003)

### SC-ACC-028 Framework-level errors on Accounts endpoints - PARITY
- When `POST /accounts` has a missing field, a wrong type, or invalid JSON; `GET /accounts/me` is called with `Authorization: Bearer` malformed; an unknown route and a wrong method are sent
- Then status codes and bodies match Python: validation 422 `{"detail": [...]}`, domain errors `{"error": msg}`, 404 `{"detail": "Not Found"}`, 405 as Python (OP-06). `/docs`, `/redoc` and `/openapi.json` are not contract and are not tested (OP-06)

### SC-ACC-029 Registration response shape and dates - PARITY, COMPAT
- When an account registers at T0
- Then the body keys, counts (zero followers, following, statuses) and date text format equal Python after id and timestamp normalisation; the stored datetime text is `YYYY-MM-DD HH:MM:SS.ffffff` and enum names are upper case (OP-05)

### SC-ACC-030 Synthetic dataset round trip - COMPAT
- Given the synthetic dataset generated by the Python app (OP-09, no real user data)
- When Rust starts on it with no migration and serves sign-in, `me` and lookup for every seeded account
- Then results equal Python's; Python then reads rows written by Rust with identical results (NFR-002, NFR-004)

## Not provable in this story (I-09), see test-plan.md section 6
