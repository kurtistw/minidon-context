# Security lane review: REBUILD-MINIDON

- Lane: RESEARCH_SECURITY (owner: design-agent)
- Reviewer: design-agent, 2026-11-13
- Under review: `research/security.md` (drafted and revised by research-agent on 2026-11-12, not
  written by design-agent, so this review does not breach I-14), plus the security-related parts of
  `research/target-state/nfr.json`, `research/risks.json`, `research/target-state/capability-deltas.json`
  and `research/target-state/principles.md` section 8.
- This file is append-only lane evidence. It edits nothing else (I-30), writes nothing to the
  `minidon` or `minidon-rust` repositories (I-29), makes no gate decision (I-23) and waives no gap.
- Labels: every finding below is DERIVED (design-agent reading and probing), unless it quotes a
  human decision, which is marked STATED with its source.

## 1. What I checked

Sources read:

- `.mw/runs/REBUILD-MINIDON/ticket.md` (scope: lift and shift, same data, no behaviour change).
- `research/inputs/human-decisions.md` sections 1 to 6, including section 5 (trailing-newline
  username, decided 2026-11-13 by kurtis, DEMO).
- `.mw/runs/BASELINE-2026-10-30/baseline-review-report.json` (CF resolutions, domain sign-off) and,
  for the open-question answer text, `.mw/context/baseline-review-report.md:69-89` and the
  `openQuestions` in `.mw/context/baseline.json` (OQ-001, OQ-002, OQ-003, OQ-009, OQ-015, OQ-016).
- `research/reviews/research-review-002.md` (N-01, N-02, N-03, N-09, F-18).
- `research/inputs/decision-makers.md`, `research/gaps.md` (GAP-005), `research/outcome.json`
  (GRD-004 to GRD-009), `research/target-state/adr-candidates.md`.
- Python reference at `minidon@e1fbd3a` (read-only): `minidon/accounts/service.py`, `routes.py`,
  `models.py`, `schemas.py`; `minidon/deps.py`, `errors.py`, `main.py`, `db.py`, `config.py`,
  `__main__.py`; `minidon/statuses/service.py`; `minidon/moderation/service.py`, `routes.py`;
  `minidon/social/service.py`; `minidon/notifications/service.py`; `minidon/timelines/routes.py`;
  `pyproject.toml`, `.gitignore`, presence of `uv.lock`.

Probes: I copied the `minidon` package to a temporary directory under `/tmp`, ran it with the
reference repo's `.venv` interpreter (`python -I -B`, database in the temp directory), drove it with
FastAPI's `TestClient`, then deleted the temp directory. `git status` on the `minidon` repository was
clean before and after. No Rust toolchain was used; every Rust-side statement below is DERIVED from
crate and std semantics and is not executed.

Review frame (from the task and the threat-model-delta skill, STRIDE-lite against the change
surface): authentication and token handling; password hashing and rehash compatibility; input
validation and regex differences; authorisation and the staff hierarchy; data at rest; error
disclosure; dependencies and supply chain; execution-time controls for the building agents; known
weaknesses carried forward and labelled; I-05 labelling; the trailing-newline decision.

## 2. Findings

Grades: Critical (blocks the lane, unsafe to build on), Major (must be fixed in a security.md
revision before the lane closes), Minor (should be fixed, does not block alone), Info.

Counts: Critical 0, Major 5, Minor 6, Info 2.

### S-01 (Major) The trailing-newline username decision is not in the security pack at all

- **Evidence (STATED decision).** `research/inputs/human-decisions.md` section 5: copy Python's
  behaviour for parity; a parity test with a trailing-newline username is required; an explicit
  note in the Rust code; a follow-up to reject it in both builds after cutover; the regex engine
  must be able to express it. The decision is dated 2026-11-13, after the 2026-11-12 revision of
  `security.md`, `risks.json`, `nfr.json` and `principles.md`, and none of them mention it (a grep
  for "newline" and "trailing" over those files finds only the unrelated "trailing-slash" in
  RISK-003 and ADR candidate 3).
- **Evidence (code).** `minidon/accounts/service.py:17` `^[a-z0-9_]{1,30}$`, applied with `.match()`
  at `:41` after `username.lower()` at `:39`; no `strip()` on the username. Python `$` matches
  before a final `\n`.
- **Evidence (probe, e1fbd3a).**
  - `alice` and `alice\n` both register (201), as two accounts.
  - `ALICE\n` then gets 409 "Username is taken" (lower-casing happens before the uniqueness check).
  - 30 letters plus `\n` registers (201). The stored username is 31 characters in a `String(30)`
    column, which SQLite does not enforce.
  - `POST /api/v1/auth/token` with `alice\n` signs in to the look-alike account.
  - `GET /api/v1/accounts/alice%0A` returns the look-alike; `GET /api/v1/accounts/alice` returns
    the real one.
  - The look-alike's statuses and profile show `"username": "alice\n"` and
    `"acct": "alice\n@minidon.local"`, which most clients render as `alice`.
- **Why it is a security concern (look-alike accounts, Spoofing).**
  - An attacker can register a visually identical account next to a real one. With
    `display_name` set to the victim's display name, the impersonation is close to perfect in any
    client that drops or folds the newline.
  - Moderation misdirection: reports and the report queue show the target as a username string
    (`moderation/routes.py` `serialize_report`). A moderator who reads `alice` and acts on
    `/api/v1/admin/accounts/alice/suspend` suspends the real account, not the reported look-alike.
    The direct actions take the username from the path (`moderation/service.py:86-110`, `_find_any`).
  - Mentions cannot reach the look-alike (`MENTION_PATTERN` has no newline), so `@alice` always
    resolves to the real account. That limits but does not remove the impersonation risk.
- **What the revision needs.**
  - A STRIDE row (Spoofing: look-alike accounts by trailing newline), Impact Medium, Likelihood
    Medium, with these controls: the parity cases above, including `ALICE\n` giving 409 and the
    31-character stored username.
  - An entry under "Weaknesses carried forward on purpose", STATED from human-decisions section 5,
    with its follow-up. The same item in RISK-006 and principles.md section 8.
  - A Rust implementation constraint:
    - The pattern ends in an optional newline before the absolute end of input (`\n?` then `\z`).
      In the `regex` crate, `$` without multi-line mode already means end of input.
    - The data layer must not enforce `VARCHAR(30)` or reject 31-character usernames.
    - Lower-casing must happen before the match, with full Unicode `to_lowercase` (the probe
      registered `Kate`, KELVIN SIGN, as `kate`).
  - An NFR-010 named case (review 002 N-01 asked for this, and the decision now settles it).
- I agree with review 002 that no other `re` pattern in `minidon/` uses `$`.

### S-02 (Major) Several authentication weaknesses are carried forward without being listed

The pack lists five carried-forward weaknesses. My read and probes found these as well. Each one
is current Python behaviour, so parity keeps it. Unless it is named, a Rust implementer may "fix"
it by accident (a parity failure), or it may never become a follow-up.

- **No sign-in throttling.** Probe: 50 wrong passwords in a row for one account all return 401,
  with no 429 and no lockout. Combined with the 8-character minimum (OQ-002), this is online
  brute force. The only rate limit in the code is on posting (`statuses/service.py:233-244`).
- **Username enumeration.**
  - Registration returns distinct 409 messages, "Username is taken" and "Email is already
    registered" (`accounts/service.py:48,50`), so it reveals both usernames and email addresses.
  - Sign-in timing: an unknown username returns without running PBKDF2 (`issue_token`
    short-circuits at `accounts/service.py:65`). Probe averages over 20 calls: about 1.2 ms for an
    unknown user and about 7 ms for a known one.
  - A suspended account returns 403 "This account is suspended" only after a correct password
    (`:67-68`), which confirms that password is right.
- **No body size limit.** Probe: a 3 MB JSON registration body is accepted (201). Python sets no
  request size limit. Most Rust frameworks default to one (for example about 2 MB in axum), which
  would return 413 where Python returns 201 or 422. This is both a parity point and a DoS point.
- **No sign-out or token revocation endpoint.** Tokens live 30 days (`config.py`). The only way
  to revoke one is suspension (`moderation/service.py:132-136`). A leaked token, see the
  clear-text storage item, stays valid until expiry.
- **What the revision needs.** List each item under carried-forward weaknesses, labelled DERIVED,
  with a recommended follow-up. For the Rust build, state the parity choice explicitly:
  - no sign-in throttle;
  - the same 409 messages;
  - no request body limit below what Python accepts, or a human decision to accept a 413
    difference;
  - timing is not part of the parity contract, but the Rust build must not add a dummy hash in
    this run either, because that would be a silent fix.

### S-03 (Major) Python's 500 paths are not enumerated, and one is a username-existence oracle

- **Evidence (probe, e1fbd3a).**
  - A lone surrogate in the password (`"password": "\ud800aaaaaaaa"`) gives
    `500 text/plain "Internal Server Error"`, on registration and on sign-in.
    `password.encode()` raises (`accounts/service.py:26,32`).
  - On sign-in it is 500 only when the username exists. An unknown username returns 401 first. So
    the 500 is an existence oracle that needs no timing.
  - Integer ids beyond the 64-bit range (`GET /api/v1/statuses/99999999999999999999`, and
    `?max_id=99999999999999999999` on `/api/v1/timelines/public`) give 500. SQLite cannot bind
    the integer.
  - A stored `password_hash` without a `$` makes `verify_password` raise (`:31`), so sign-in gives
    500. This only happens with tampered or legacy data.
- **Rust side (DERIVED).** `serde_json` rejects lone surrogates while parsing, and `i64` path and
  query extraction rejects out-of-range numbers. So a natural Rust build returns 4xx in all three
  cases. That closes the oracle, but it is a parity difference the differential run will flag.
- **Gap in the pack.** Row 5 and NFR-003 say "test that a 500 body has no internal detail". They
  do not name these inputs, or the 500 body Python actually sends (`text/plain`,
  `Internal Server Error`). Nor do they say whether matching it is in scope.
- **What the revision needs.** Add these cases to row 5 and to ADR candidate 3 as an explicit
  human decision: either copy the 500s (oracle included), or accept a 4xx difference and record it
  as a deliberate deviation. Add the oracle to the carried-forward weaknesses.

### S-04 (Major) The execution-time controls for the building agents are incomplete

The current section covers three things: credentials, production data, and not writing to the
Python repo. It does not cover these.

- **The oracle can write into the reference repo without anyone seeing it.**
  - The Python default database is `sqlite:///./minidon.db`, relative to the working directory
    (`config.py`), and `python -m minidon` creates the tables at startup (`__main__.py:9`).
  - A parity harness that starts Python with its working directory in the `minidon` repo writes
    `minidon.db` there, and Python writes `__pycache__` there too.
  - Both are covered by `.gitignore` (`*.db`, `__pycache__/`). So the MET-005 proof
    (`git status` and `git rev-list` on the minidon repo) would not detect the write that breaks
    I-29 and GRD-006.
  - Control needed: start the oracle from a copy or from a working directory outside the repo,
    with `MINIDON_DATABASE_URL` always set and `PYTHONDONTWRITEBYTECODE=1`. Extend MET-005 with
    `git status --ignored` or a file-tree checksum.
- **Build-time code runs on the agent's machine.** `cargo build` runs `build.rs` scripts and proc
  macros from every new crate. Controls needed:
  - crates are added only through a reviewed `Cargo.toml` change;
  - builds run in the agent sandbox with no access to credentials;
  - `cargo deny` sources are restricted to crates.io;
  - no git or path dependencies outside the repo.
- **Agents may not weaken the guards.** Agents never disable or `#[allow]` the cargo-deny,
  cargo-audit or clippy checks of NFR-006, and never add `unsafe` without a human-reviewed reason.
- **Security-sensitive modules get a second agent and a human.** Password hashing, token handling,
  the auth extractors, the staff checks and `can_view` are reviewed by an agent other than their
  author (I-14) and a human merges (I-15). Name these modules in the controls, so the plan can
  route them.
- **Test data holds live credentials.** A copy of real data contains working tokens (clear text,
  valid for 30 days), real email addresses and password hashes. "Sanitised" must be defined:
  - delete or expire every `access_tokens` row;
  - replace emails;
  - keep hashes only for synthetic accounts with known passwords.

### S-05 (Major) No row covers threats introduced by the Rust stack itself

The lane note in `security.md:6-7` asks for this, and the table has no such row. Proposed rows or
controls:

- **Panics as denial of service.** Python turns any exception into one 500 for that request.
  A Rust `unwrap()` or `expect()` on, for example, `stored.split('$')` or hex decoding behaves
  differently:
  - without a catch-panic layer it can drop the connection;
  - with shared state behind a `Mutex` it can poison the lock and fail later requests;
  - with `panic = "abort"` it kills the process.
  Control: deny `unwrap` and `expect` in non-test code (`clippy::unwrap_used`, `expect_used`),
  add a catch-panic layer that maps to Python's 500 body, and add a test that a malformed stored
  hash does not take the server down.
- **Header parsing.** Starlette decodes headers as latin-1, then `deps.py:20-22` lower-cases and
  `strip()`s them with Python's whitespace set. In Rust, `HeaderValue::to_str` fails on
  non-visible-ASCII bytes, and hyper rejects some bytes that h11 accepts. Control: parity cases
  for an `Authorization` header with non-ASCII bytes, tabs, multiple spaces and U+001C to U+001F
  around the token. An unparseable header must give anonymous access or 401, never 400 or 500,
  unless ADR candidate 3 decides otherwise.
- **SQL injection.** SQLAlchemy binds every parameter. The Rust data layer must use bound
  parameters only, with no `format!` into SQL. Add a lint or review check and a parity case with
  quotes and `%` in usernames, tags and content.
- **Auth state caching.** Python reads role and suspension from the database on every request
  (`accounts/service.py:79-87`, `deps.py`). So a role change, suspension or token revocation takes
  effect on the next request (OQ-015, STATED: full suspension scope intended). A Rust build that
  caches accounts or tokens, or moves to stateless tokens, breaks this silently. Control: an
  explicit "no auth cache" constraint, and a test that a suspended or demoted account fails on its
  very next request with an already-issued token.
- **Regex engine DoS.** If the engine choice is a backtracking engine such as `fancy-regex`
  (needed for lookbehind, RISK-010), name it as a ReDoS consideration. The current patterns are
  bounded (`{1,30}`, `{1,100}`), so the likelihood is low, but the choice should be recorded.

### S-06 (Minor) Row 1 misses the reverse direction and some byte-level details of hash compatibility

- Row 1 and NFR-004 test only Python-created accounts signing in on Rust. NFR-002 implies the
  reverse ("password hashes" in the round trip), but row 1 should say it directly:
  - an account registered on Rust signs in on Python;
  - Rust emits lower-case hex (`hmac.compare_digest(candidate.hex(), digest)` at
    `accounts/service.py:35` compares hex strings, so upper-case hex fails on Python);
  - the salt is 16 random bytes (`:25`);
  - the password is encoded as UTF-8 with no Unicode normalisation and no trimming (`:26`).
- **Rehash compatibility.** Python hard-codes 100,000 iterations and the stored format carries no
  iteration marker (`security.md:48-50` notes this). So during the period when both builds share
  data (NFR-002 reverse direction), any rehash-on-login in Rust locks the account out on Python.
  State it as a constraint now, not only as a note for the follow-up: no rehash and no new hash
  format in this run (consistent with GRD-004, STATED). The OQ-003 follow-up must change both
  builds together or wait until cutover.
- The constant-time comparison applies to the hash only. Token lookup is a primary-key fetch
  (`session.get(AccessToken, token)`), which is not constant time in Python either. Parity does
  not require more, but say so, so nobody believes token comparison is constant time.

### S-07 (Minor) Row 3 misses some authorisation paths and object-level cases

- **Two-step admin suspension.** "Nobody can suspend an admin (not even another admin)" is true
  for one call only. An admin can `PUT /admin/accounts/{other admin}/role` to `moderator` or
  `user` (`moderation/service.py:104-111` only blocks self-change), then suspend that account.
  The baseline accepts this as policy (OQ-016, STATED), but it should be a named parity case, so
  Rust copies it and does not "fix" it.
- **Further cases to name.**
  - Role changes and unsuspend work on suspended accounts (`_find_any`, include_suspended).
  - Unsuspending an account that is not suspended is a 200 no-op.
  - An admin can promote any account to admin.
- **Object-level authorisation and an existence oracle.** Probe:
  - User B gets 404 on `GET` of user A's `direct` status, but 403 "You can only delete your own
    statuses" on `DELETE` of the same id. A missing id gives 404.
  - `delete_status` (`statuses/service.py:131-137`) does not call `can_view`, so 403 versus 404
    reveals that a hidden status exists (ids are sequential).
  - In contrast, `mark_read` returns 404 for another user's notification
    (`notifications/service.py:75-77`).
  Add both as parity cases. Add the delete oracle to the carried-forward weaknesses (DERIVED).

### S-08 (Minor) I-05: STATED labels still cover DERIVED content

- `security.md:43-45` labels the whole carried-forward list STATED, "gate answers recorded by
  kurtis on 2026-11-10". Inside it, two statements are inferences, not gate answers:
  - "The stored hash does not record the iteration count, so the upgrade needs a format change
    or a rehash-on-login scheme" (`:48-50`);
  - "The check is COUNT based and can race (RISK-009)" (`:54`).
  The clear-text token bullet (`:57-59`) is correctly marked DERIVED inline.
- `risks.json` RISK-006 is still `STATED` and includes clear-text tokens, which no gate answer
  names (review 002 N-09, not fixed). Principle 8 mixes the two in one sentence.
- The OQ answer text is cited to the gate JSON (`security.md:14-15`, GRD-004 in `outcome.json`),
  which holds no OQ answers. They are in `.mw/context/baseline-review-report.md:69-89`
  (review 002 N-03, not fixed in `security.md`).
- Fix: split each bullet into the STATED gate answer and the DERIVED note, and cite the `.md`
  table for OQ answers.

### S-09 (Minor) Supply chain covers only the Rust side; the oracle's dependencies are unpinned

- `pyproject.toml` declares `fastapi>=0.115`, `sqlalchemy>=2.0`, `uvicorn>=0.30`. The 422
  validation body, 404 and 405 bodies, header decoding and JSON serialisation all come from these
  libraries. If the oracle environment is rebuilt with newer versions, the parity contract
  silently moves.
- `uv.lock` exists in the reference repo. Control: build the oracle with `uv sync --frozen` from
  that lock, and record the resolved versions in the parity report.
- For the Rust side, row 9 should name the selection criteria the design ADR must meet:
  - an audited, maintained PBKDF2 and HMAC implementation (RustCrypto `pbkdf2`, `hmac`, `sha2`,
    or `ring`);
  - a constant-time comparison primitive (for example `subtle`);
  - `cargo deny` licence and source policies, not only advisories.

### S-10 (Minor) Data at rest is covered only for tokens

- What also sits at rest, unprotected, in the SQLite file: password hashes (weak by OQ-003, so
  an offline attack is cheaper), email addresses, `direct` and `private` status content, and
  report comments and moderator notes.
- The file mode of a database the Rust build creates (NFR-011 path) should match Python's, or be
  stricter, and be stated: SQLite creates the file subject to the process umask, typically 0644.
- The pack should say in one place that data at rest is unchanged by design. That statement is
  what keeps the GAP-005 waiver valid ("rests on no new data being stored", `security.md:66-67`).
  Any new column, cache file or log that Rust adds would break it.
- Logs are a new at-rest store if the Rust build adds request logging that Python lacks
  (uvicorn's access log is the only Python log). Row 5 already says "never log token or password
  values". Extend it to request bodies and the `Authorization` header.

### S-11 (Minor) Row 8 rate-limit parity misses the counting details

- `_check_rate_limit` (`statuses/service.py:233-244`):
  - counts soft-deleted statuses, because it has no `deleted_at` filter;
  - excludes boosts;
  - uses `created_at >= now - 1h` and `recent >= 30`.
  So deleting posts does not free quota. A Rust port that filters deleted rows would loosen the
  control.
- The check is count-then-insert, so concurrent posts can exceed 30, as in Python (NFR-008).
- Name these as parity cases in row 8.

### S-12 (Info) The roster is DEMO content, and the GAP-005 condition is still untracked

- `research/inputs/decision-makers.md` names kurtis as the Security reviewer, as a DEMO
  assumption (RISK-007, STATED).
- The GAP-005 waiver condition "revisit at cutover" is still only a sentence in
  `security.md:66-67` (review 002 F-18). It should be an item on the cutover ticket.

### S-13 (Info) The two lanes that remain open still need design-agent input

`principles.md` is listed in the run's produces list with design-agent as owner, and its header
says "no design-agent review has happened yet". This review covers its section 8 only. The
remaining principles and `adr-candidates.md` were not reviewed by this lane.

## 3. What I agree with

- **The framing is right.** In a lift and shift, the risk is accidental change of security
  behaviour plus forgotten weaknesses, not a new attack surface (`security.md:19-24`).
- **Rows 1 to 9 are accurate against the code.** I checked:
  - the hash format and parameters (`accounts/service.py:21-35`);
  - the bearer parsing (`deps.py:20-22`, case-insensitive prefix, then `strip()`);
  - token expiry (`expires_at <= utcnow()`, `:80`);
  - every staff negative case in row 3 (`moderation/service.py:95-129`);
  - the four `Report` fields in row 7 (`:79-82`);
  - the error map in row 5 (`errors.py`, `main.py:18-20`).
  Impact and likelihood ratings are reasonable. I would not change any rating.
- **Row 4 is correct to treat mention parsing as a disclosure path.** `can_view` for `private`
  and `direct` depends on `Mention` rows (`statuses/service.py:44-51`), which come from
  `MENTION_PATTERN`.
- **The carried-forward weaknesses that are listed are listed correctly,** with gate follow-ups:
  OQ-001, OQ-002, OQ-003 and OQ-009 match `.mw/context/baseline-review-report.md:69-77`. The
  clear-text-token item is correctly flagged as having no gate follow-up and is labelled DERIVED.
- **GRD-004** (no hashing change in this run) and **NFR-010 and GRD-009** (code-point lengths,
  Unicode case folding and trimming) are the right controls. Review 002 N-02 has the details.
- The capability deltas are all `behaviourChange: none`, which is consistent with copying every
  weakness. The L1-moderation summary correctly includes "revokes all tokens".

## 4. What a real security reviewer must still do

The Security reviewer role is DEMO content (S-12). A real, independent security reviewer must:

1. **Confirm or reverse the carried-forward weaknesses.** This covers the existing list, the
   additions in S-01, S-02, S-03 and S-07, and in particular the trailing-newline look-alike
   decision (human-decisions section 5), the 500 oracle and the delete existence oracle. A
   reversal is a scope change (RISK-001).
2. **Decide whether timing behaviour and the Python 500 paths are part of the parity contract**
   (S-02, S-03, with ADR candidate 3).
3. **Approve the crate choices** for PBKDF2, HMAC, constant-time comparison, the regex engine and
   the SQLite driver when DEP-003 and ADR candidate 1 are decided, and the `cargo deny` policy
   (S-09).
4. **Approve the definition of a sanitised dataset** before any real data is used, and act as or
   name the data owner (S-04, S-10, DEP-005).
5. **Review the security-sensitive modules in minidon-rust** at PR time: hashing, tokens, auth
   extractors, staff checks, `can_view`. Agent review alone does not satisfy this.
6. **Raise the follow-up tickets** (OQ-001, OQ-002, OQ-003, OQ-009, clear-text tokens,
   trailing-newline rejection, sign-in throttling, enumeration, body size limit, sign-out
   endpoint), and **sequence the OQ-003 rehash** against cutover so that neither build locks
   users out (S-06).
7. **Track the GAP-005 "revisit at cutover" condition** on the cutover ticket.

## 5. Lane status

This lane review is complete: every area in the review frame was checked and every finding has
evidence.

The RESEARCH_SECURITY branch is not ready to close. It is blocked by the five Major findings
S-01 to S-05. These need a revision of `research/security.md` (and the matching entries in
`risks.json`, `nfr.json` and `principles.md`):

- the trailing-newline look-alike row and weakness entry;
- the unlisted authentication weaknesses;
- the 500 paths and the oracle;
- the execution-time controls for the building agents;
- the Rust-stack threats.

Under I-30, the revision goes in as a new version, not an edit in place. Once it is done, a
re-check by a reviewer other than its author is needed. The Minor findings should be fixed in the
same revision but do not block on their own. This review does not transition the run, close the
branch, decide a gate or waive a gap.
