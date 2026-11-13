# Spec: REBUILD-MINIDON, story 1 - Accounts (L1-accounts)

Generated from `.mw/runs/REBUILD-MINIDON/ir/spec.json`. Author: spec-agent. Baseline: BASELINE-2026-10-30.

Label key (I-05): STATED means a person, the ticket, README or a recorded human decision said it. DERIVED means an agent inferred it from code or documents and it is open to challenge.

## 1. Summary

Lift and shift of L1-accounts (14 live rules) from Python to Rust with parity. Behaviour is copied as-is, including the trailing-newline username quirk. The Python repository `minidon` is the read-only reference.

## 2. Delta

- ADDED: minidon-rust accounts (new Rust implementation of all requirements below).
- MODIFIED: none.
- REMOVED: none. L1-accounts/BR-001 to BR-014 are all live.

## 3. Scope

In scope: L1-accounts/BR-001..BR-014; POST /api/v1/accounts; POST /api/v1/auth/token; GET and PATCH /api/v1/accounts/me; GET /api/v1/accounts/{username}.

Out of scope: new behaviour; cutover and retiring Python; fixing known weaknesses (follow-ups in human-decisions section 3 and 5); follow-approval mechanism (L1-following); other capabilities.

## 4. Requirements

Each requirement is in EARS form with GWT acceptance criteria.

### REQ-001 - L1-accounts/BR-001 - STATED

**Requirement (event-driven):** When a registration request is received, the system shall lower-case the username and accept it only if it consists of 1 to 30 letters, digits or underscores; otherwise it shall reject the request as invalid (422).

**Sources:** `README.md:10`; `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:17,39,41-42`; `.mw/context/capabilities/accounts/rules-trace.md BR-001`

**Basis (STATED):** README states the rule; the code lower-cases before matching (parity copy).

**Acceptance:**

- REQ-001-AC1: Given no account exists with username alice, when a registration is submitted with username ALICE_01, then the account is created and stored with username alice_01.
- REQ-001-AC2: Given -, when a registration is submitted with an empty username, a 31-character username, or a username containing a hyphen, then the request is rejected with 422 Invalid.

### REQ-002 - L1-accounts/BR-001 - STATED

**Requirement (event-driven):** When a registration request carries a username that is otherwise valid followed by exactly one trailing newline character, the system shall accept it and store it with the newline, exactly as the Python reference does, as a separate account from the same username without the newline (deliberate parity copy of a known defect).

**Sources:** `.mw/runs/REBUILD-MINIDON/research/inputs/human-decisions.md section 5`; `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:17`; `open-points.md/plan-onepager.md section 4`

**Basis (STATED):** Human decision 2026-11-13 (DEMO, kurtis): copy for parity. Rejecting such names is a post-cutover follow-up, out of scope. A parity test is required and the Rust code must carry an explicit note that the behaviour is deliberate.

**DERIVED note:** Two-newline case: DERIVED from the Python pattern ^[a-z0-9_]{1,30}$ (only one final newline can match before end of input). Shown for the Rust regex design (OP-03). The regex engine must be able to express the optional single trailing newline.

**Acceptance:**

- REQ-002-AC1: Given no account exists with username alice, when a registration is submitted with username "alice\n", then the account is created (201) with the trailing newline retained.
- REQ-002-AC2: Given account "alice" exists, when a registration is submitted with username "alice\n", then it is accepted as a distinct account and not rejected as taken (this is the look-alike behaviour, copied on purpose).
- REQ-002-AC3: Given -, when a registration is submitted with username "alice\n\n" (two trailing newlines), then the request is rejected with 422 Invalid.

### REQ-003 - L1-accounts/BR-002 - DERIVED

**Requirement (event-driven):** When a registration request is received, the system shall strip surrounding whitespace and lower-case the email, and reject the request as invalid (422) if the result does not contain an "@" character; no other email format check shall be applied.

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:40,43-44`; `.mw/context/capabilities/accounts/rules-trace.md BR-002`

**Basis (DERIVED):** Inferred from code (confidence 0.85).

**Acceptance:**

- REQ-003-AC1: Given -, when a registration is submitted with email "  Bob@Example.com ", then the email is stored as bob@example.com.
- REQ-003-AC2: Given -, when a registration is submitted with email "bob.example.com", then the request is rejected with 422 Invalid.

### REQ-004 - L1-accounts/BR-003 - DERIVED

**Requirement (event-driven):** When a registration request is received with a password shorter than 8 characters, the system shall reject it as invalid (422).

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:18,45-46`; `.mw/context/capabilities/accounts/rules-trace.md BR-003`

**Basis (DERIVED):** Inferred from code. The 8-character minimum is a known weakness copied on purpose (raise to 12 is a follow-up, human-decisions section 3).

**DERIVED note:** Length is counted in characters, not bytes; Rust must count characters (research risk: text handling).

**Acceptance:**

- REQ-004-AC1: Given -, when a registration is submitted with a 7-character password, then the request is rejected with 422 Invalid.
- REQ-004-AC2: Given -, when a registration is submitted with an 8-character password, then the password is accepted.

### REQ-005 - L1-accounts/BR-004 - DERIVED

**Requirement (unwanted-behaviour):** If a registration request carries a username that matches an existing account username case-insensitively, including a suspended account, then the system shall reject it with 409 Conflict.

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:47-48,96-102`; `.mw/context/capabilities/accounts/rules-trace.md BR-004`

**Basis (DERIVED):** Inferred from code, confirmed by test_usernames_are_unique_regardless_of_case.

**DERIVED note:** Interaction with REQ-002 is DERIVED: uniqueness compares the stored (lower-cased) string, so "alice\n" does not collide with "alice".

**Acceptance:**

- REQ-005-AC1: Given account alice exists and is not suspended, when a registration is submitted with username ALICE, then 409 Conflict (Username is taken).
- REQ-005-AC2: Given account alice exists and is suspended, when a registration is submitted with username alice, then 409 Conflict (Username is taken).

### REQ-006 - L1-accounts/BR-005 - DERIVED

**Requirement (unwanted-behaviour):** If a registration request carries an email that is already registered on any account, regardless of suspension, then the system shall reject it with 409 Conflict.

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:49-50`; `.mw/context/capabilities/accounts/rules-trace.md BR-005`

**Basis (DERIVED):** Inferred from code, confirmed by test_emails_are_unique.

**Acceptance:**

- REQ-006-AC1: Given an account with email a@x.com exists, suspended or not, when a registration is submitted with email a@x.com, then 409 Conflict (Email is already registered).

### REQ-007 - L1-accounts/BR-006 - DERIVED

**Requirement (event-driven):** When a registration succeeds on an instance with no accounts, the system shall assign the Admin role to the new account; for every later registration it shall assign the User role.

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:52-58`; `.mw/context/capabilities/accounts/rules-trace.md BR-006`

**Basis (DERIVED):** Inferred from code (0.95), confirmed by test_the_first_account_runs_the_instance.

**DERIVED note:** Admin seeding is a known weakness (instance takeover risk, OQ-001) copied on purpose; secure seeding is a follow-up.

**Acceptance:**

- REQ-007-AC1: Given the accounts table is empty, when the first valid registration succeeds, then the account has role admin.
- REQ-007-AC2: Given at least one account exists, when another valid registration succeeds, then the account has role user.

### REQ-008 - L1-accounts/BR-007 - DERIVED

**Requirement (event-driven):** When the system stores or verifies a password, it shall use PBKDF2-HMAC-SHA256 with 100,000 iterations and a random 16-byte salt, store the hash as "<salt hex>$<digest hex>", compare in constant time, and never store the plaintext.

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:17-21,24-35`; `.mw/context/capabilities/accounts/rules-trace.md BR-007`

**Basis (DERIVED):** Inferred from code. Hash format must be byte-compatible both ways (zero migrations, OP-05). Hash strength is a known weakness copied on purpose (OQ-003 follow-up).

**Acceptance:**

- REQ-008-AC1: Given -, when an account is registered, then the stored hash has the form 32 hex chars, a dollar sign, then 64 hex chars and no plaintext is stored.
- REQ-008-AC2: Given an account was registered by the Python build, when the Rust build verifies the correct password against the stored hash, then verification succeeds.
- REQ-008-AC3: Given an account was registered by the Rust build, when the Python build verifies the correct password, then verification succeeds.

### REQ-009 - L1-accounts/BR-008 - DERIVED

**Requirement (unwanted-behaviour):** If a sign-in request carries an unknown username or a wrong password, then the system shall reject it with 401 Unauthorized and the same generic message (Invalid username or password) in both cases.

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:65-68`; `.mw/context/capabilities/accounts/rules-trace.md BR-008`

**Basis (DERIVED):** Inferred from code, confirmed by test_sign_in_with_the_wrong_password_fails.

**DERIVED note:** Response timing and username discovery by other routes are known gaps carried to design (security lane), not fixed here.

**Acceptance:**

- REQ-009-AC1: Given -, when sign-in with an unknown username, then 401 with message Invalid username or password.
- REQ-009-AC2: Given account alice exists, when sign-in with alice and a wrong password, then 401 with the identical message.

### REQ-010 - L1-accounts/BR-009 - STATED

**Requirement (unwanted-behaviour):** If a sign-in request is made for a suspended account, even with the correct password, then the system shall reject it with 403 Forbidden (This account is suspended).

**Sources:** `README.md:52`; `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:69-70`; `.mw/context/capabilities/accounts/rules-trace.md BR-009`

**Basis (STATED):** README states the rule; enforcement is in Accounts sign-in. The 403 status is DERIVED from the code (Forbidden).

**Acceptance:**

- REQ-010-AC1: Given account alice is suspended, when sign-in with alice and the correct password, then 403 Forbidden and no access token is issued.

### REQ-011 - L1-accounts/BR-010 - DERIVED

**Requirement (event-driven):** When a sign-in succeeds, the system shall issue a random URL-safe access token that expires 30 days after issue (configurable through the token_ttl_days setting, default 30).

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:73-75`; `.mw/context/capabilities/accounts/rules-trace.md BR-010`; `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/config.py:17`

**Basis (DERIVED):** Inferred from code and configuration default.

**Acceptance:**

- REQ-011-AC1: Given a valid account, when sign-in succeeds, then an access token is returned whose expiry is issue time plus 30 days.
- REQ-011-AC2: Given token_ttl_days is configured as 7, when sign-in succeeds, then expiry is issue time plus 7 days.

### REQ-012 - L1-accounts/BR-011 - DERIVED

**Requirement (event-driven):** When a request presents a token that is unknown, expired, or belongs to a now-suspended or missing account, the system shall treat the caller as signed out (no account); a protected route shall then answer 401 Unauthorized.

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:81-88`; `.mw/context/capabilities/accounts/rules-trace.md BR-011`

**Basis (DERIVED):** Inferred from code. An expiry exactly equal to now counts as expired (<=).

**Acceptance:**

- REQ-012-AC1: Given a token whose expiry is at or before now, when GET /accounts/me with that token, then 401 Unauthorized.
- REQ-012-AC2: Given a valid token whose account is later suspended, when GET /accounts/me with that token, then 401 Unauthorized.
- REQ-012-AC3: Given -, when GET /accounts/me with no token, then 401 Unauthorized.

### REQ-013 - L1-accounts/BR-012 - DERIVED

**Requirement (event-driven):** When a username lookup is made without an explicit request to include suspended accounts, the system shall treat a suspended account as not found (404 Account not found); the lookup used by registration and sign-in shall include suspended accounts. This lookup, get_by_username, is the stable identity API other capabilities call.

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:96-110`; `.mw/context/capabilities/accounts/rules-trace.md BR-012`

**Basis (DERIVED):** Inferred from code, confirmed by test_suspending_through_a_report_hides_the_account. Stable API ownership is STATED in human-decisions section 3 (CF-004); its Rust shape is decided in the design ADR.

**Acceptance:**

- REQ-013-AC1: Given account spammer is suspended, when GET /accounts/spammer, then 404 Not Found.
- REQ-013-AC2: Given account alice is active, when GET /accounts/alice, then 200 with the profile.

### REQ-014 - L1-accounts/BR-013 - DERIVED

**Requirement (unwanted-behaviour):** If a profile update carries a display name longer than 30 characters or a bio longer than 500 characters, then the system shall reject it as invalid (422).

**Sources:** `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:19-20,121-128`; `.mw/context/capabilities/accounts/rules-trace.md BR-013`

**Basis (DERIVED):** Numeric limits are DERIVED from code constants. Counting is in characters (research risk: text handling).

**Acceptance:**

- REQ-014-AC1: Given a signed-in account, when PATCH /accounts/me with a 31-character display name, then 422 Invalid and the profile is unchanged.
- REQ-014-AC2: Given a signed-in account, when PATCH /accounts/me with a 30-character display name and a 500-character bio, then the update is accepted.

### REQ-015 - L1-accounts/BR-013 - STATED

**Requirement (ubiquitous):** The system shall let an account hold an editable display name and bio, changed through PATCH /accounts/me.

**Sources:** `README.md:11`; `.mw/context/capabilities/accounts/rules-trace.md BR-013`

**Basis (STATED):** README states that profiles have a display name and a bio. The route is DERIVED from capability.md.

**Acceptance:**

- REQ-015-AC1: Given a signed-in account, when PATCH /accounts/me with a new display name and bio, then GET /accounts/me returns the new values.

### REQ-016 - L1-accounts/BR-014 - STATED

**Requirement (ubiquitous):** The system shall let an account set a locked flag (default false) through PATCH /accounts/me and expose it on the profile; the flag shall be stored and returned exactly as Python does.

**Sources:** `README.md:12`; `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/models.py:30`; `.mw/context/capabilities/accounts/rules-trace.md BR-014`

**Basis (STATED):** Field and its purpose (locked accounts approve followers by hand) are STATED in README. The follow-approval mechanism is owned by L1-following and is out of scope here (DERIVED).

**Acceptance:**

- REQ-016-AC1: Given a new account, when the profile is read, then locked is false.
- REQ-016-AC2: Given a signed-in account, when PATCH /accounts/me sets locked to true, then GET /accounts/me returns locked true.

### REQ-017 - cross-cutting (L1-accounts, story 1) - STATED

**Requirement (ubiquitous):** The Rust Accounts build shall read and write the existing stored formats (enum names, date text, hash format) with zero schema migrations and shall not create or migrate the schema.

**Sources:** `ticket.md Scope: same data`; `.mw/runs/REBUILD-MINIDON/research/inputs/human-decisions.md section 2`; `open-points.md OP-05`

**Basis (STATED):** OP-05 decision (DEMO): Rust uses the schema Python already makes.

**Acceptance:**

- REQ-017-AC1: Given a synthetic dataset generated by the Python app (OP-09), when the Rust Accounts build runs against a copy, then all 14 rules behave as on Python and no schema change is made.

### REQ-018 - cross-cutting (L1-accounts, story 1) - STATED

**Requirement (ubiquitous):** Each of the 14 live Accounts rules shall have a parity test that passes against both the Python reference and the Rust build, with the same requests and normalised ids and timestamps.

**Sources:** `plan-onepager.md section 4`; `research/inputs/human-decisions.md section 1`

**Basis (STATED):** 14 of 14 rules (acceptance in the one-pager). Running each test against Python first is DERIVED (one-pager section 4); the harness design is OP-07 (read-only on the Python repo, includes non-ASCII cases).

**Acceptance:**

- REQ-018-AC1: Given the parity harness with a fixed clock, when a rule's request is run against Python and Rust, then responses match after normalisation.

### REQ-019 - cross-cutting (L1-accounts, story 1) - DERIVED

**Requirement (ubiquitous):** The Accounts routes shall return the same status codes and error body shapes, date format, and 404/405 bodies as the Python reference; the auto-generated documentation routes shall not be ported.

**Sources:** `open-points.md OP-06`; `assumptions.md A-01`; `.mw/context/capabilities/accounts/rules-trace.md edge cases`

**Basis (DERIVED):** Contract decision OP-06 is a DEMO decision by kurtis (STATED there); applying it to the Accounts routes and the exact codes is DERIVED. Cases where Python returns a server error are carried to design, not specified here.

**Acceptance:**

- REQ-019-AC1: Given -, when each Accounts route is called with an invalid or unauthorised input, then the status code and body shape match the Python reference.

## 5. Rule coverage

| Rule | Requirements |
|---|---|
| L1-accounts/BR-001 | REQ-001, REQ-002 |
| L1-accounts/BR-002 | REQ-003 |
| L1-accounts/BR-003 | REQ-004 |
| L1-accounts/BR-004 | REQ-005 |
| L1-accounts/BR-005 | REQ-006 |
| L1-accounts/BR-006 | REQ-007 |
| L1-accounts/BR-007 | REQ-008 |
| L1-accounts/BR-008 | REQ-009 |
| L1-accounts/BR-009 | REQ-010 |
| L1-accounts/BR-010 | REQ-011 |
| L1-accounts/BR-011 | REQ-012 |
| L1-accounts/BR-012 | REQ-013 |
| L1-accounts/BR-013 | REQ-014, REQ-015 |
| L1-accounts/BR-014 | REQ-016 |

## 6. Known weaknesses copied on purpose

- trailing-newline username accepted (REQ-002)
- first registrant becomes Admin (REQ-007)
- 8-character minimum password (REQ-004)
- PBKDF2 100k iterations (REQ-008)
- no sign-in throttling, username discovery, no body size limit, Python 500 cases (security lane, design inputs)

## 7. Open items

- OP-03 regex engine must express REQ-002 (confirm in ADR)
- OP-08 lane findings to be worked at design
- DERIVED rules are treated as human-confirmed by the 2026-11-10 baseline sign-off (human-decisions section 4)
