# Rules Trace

> **Capability:** L1-accounts
> **Baseline Version:** BASELINE-2026-10-30
> **Generated:** 2026-10-30T18:00:00Z

## Purpose

This document traces every business rule in `capability.md` to its source in the codebase,
per I-25: every rule traced to `repo@sha:path:lines`.

## Rules Index

| Rule ID | Rule Text | Confidence | Source Count |
|---------|-----------|------------|---------------|
| BR-001 | Usernames are 1-30 letters/digits/underscores, case-insensitive | `STATED` | 2 |
| BR-002 | Registration email must contain `@` | `DERIVED` | 1 |
| BR-003 | Password must be at least 8 characters | `DERIVED` | 1 |
| BR-004 | Usernames unique case-insensitively, incl. suspended | `DERIVED` | 1 |
| BR-005 | Emails unique across all accounts | `DERIVED` | 1 |
| BR-006 | First account registered becomes Admin | `DERIVED` | 1 |
| BR-007 | Passwords hashed with PBKDF2-HMAC-SHA256, 100k iterations | `DERIVED` | 1 |
| BR-008 | Wrong username/password rejected without detail | `DERIVED` | 1 |
| BR-009 | Suspended accounts cannot sign in | `STATED` | 2 |
| BR-010 | Access tokens expire after 30 days | `DERIVED` | 2 |
| BR-011 | Expired/suspended-account tokens authenticate as signed-out | `DERIVED` | 1 |
| BR-012 | Suspended accounts look not-found to normal lookups | `DERIVED` | 1 |
| BR-013 | Display name <= 30 chars, bio <= 500 chars | `DERIVED`/`STATED` | 2 |
| BR-014 | Locked flag drives follow-request approval (mechanism in Following) | `STATED`/`DERIVED` | 2 |

## Detailed Traces

### BR-001: Usernames are 1-30 letters, digits or underscores, case-insensitive

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 10 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 17,39,41-42 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:17,39,41-42
USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{1,30}$")
...
username = username.lower()
...
if not USERNAME_PATTERN.match(username):
    raise Invalid("Username must be 1-30 letters, digits or underscores")
```

**Derivation Notes:**
README.md states the rule in business language exactly as implemented. The code lowercases
the username before matching, which is how "not case sensitive" is implemented (storage is
always lowercase, so lookups are inherently case-insensitive).

---

### BR-002: A registration email address must contain an `@` character

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 40,43-44 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:40,43-44
email = email.strip().lower()
if not USERNAME_PATTERN.match(username):
    ...
if "@" not in email:
    raise Invalid("Email address is not valid")
```

**Derivation Notes:**
README.md does not describe email validation at all. This is the full extent of email
validation in the code - no format/domain checking beyond the `@` presence check. Confidence
is 0.85, not higher, because "is not valid" is a generic message; the rule as stated here is
an accurate paraphrase of what the single `if` condition actually checks, not an assumption
about broader intent.

---

### BR-003: A password must be at least 8 characters

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 18,45-46 | Constant + Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:18,45-46
MIN_PASSWORD_LENGTH = 8
...
if len(password) < MIN_PASSWORD_LENGTH:
    raise Invalid(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
```

**Derivation Notes:**
An unambiguous named constant used in a single guard clause. Not mentioned anywhere in
README.md.

---

### BR-004: Usernames must be unique, case-insensitively, including against suspended accounts

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 47-48,96-102 | Validation + supporting lookup |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:47-48
if find_by_username(session, username, include_suspended=True):
    raise Conflict("Username is taken")
```

**Derivation Notes:**
`find_by_username(..., include_suspended=True)` (lines 96-102) is called during registration
specifically so a suspended account's username cannot be reused. Confirmed by
`tests/test_accounts.py::test_usernames_are_unique_regardless_of_case`.

---

### BR-005: Email addresses must be unique across all accounts

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 49-50 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:49-50
if session.scalar(select(Account).where(Account.email == email)):
    raise Conflict("Email is already registered")
```

**Derivation Notes:**
Unlike username uniqueness, this query does not filter by suspension state, so it checks
every account regardless of status. Confirmed by `test_emails_are_unique`.

---

### BR-006: The first account registered on a fresh instance is automatically granted Admin

**Confidence:** `DERIVED` (0.95)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 52-58 | Decision logic |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:52-58
# The first account on a fresh instance is the one running it
is_first = session.scalar(select(func.count()).select_from(Account)) == 0
account = Account(
    username=username,
    email=email,
    password_hash=hash_password(password),
    role=Role.ADMIN if is_first else Role.USER,
)
```

**Derivation Notes:**
Unambiguous: a `COUNT(*)` over the `accounts` table decides role at creation time. Confirmed
by `tests/test_accounts.py::test_the_first_account_runs_the_instance`. Not mentioned in
README.md; raised as an open question in `capability.md`.

---

### BR-007: Passwords are hashed with PBKDF2-HMAC-SHA256 (100,000 iterations, random salt)

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 17-21,24-35 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:21,24-27
PBKDF2_ITERATIONS = 100_000

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"{salt.hex()}${digest.hex()}"
```

**Derivation Notes:**
`verify_password` (lines 30-35) uses `hmac.compare_digest` for a constant-time comparison.
Never asserted in any documentation; purely an implementation detail surfaced here because
it is a business-significant security choice.

---

### BR-008: Signing in with the wrong username or password is rejected without indicating which was wrong

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 65-68 | Decision logic |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:65-68
account = find_by_username(session, username, include_suspended=True)
if account is None or not verify_password(password, account.password_hash):
    raise Unauthorized("Invalid username or password")
```

**Derivation Notes:**
The single generic error message is used whether the username does not exist or the password
is wrong, which is a standard anti-enumeration pattern. Confirmed by
`test_sign_in_with_the_wrong_password_fails`.

---

### BR-009: Suspended accounts can no longer sign in

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 52 | Documentation (`## Moderation`) |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 69-70 | Enforcement |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:69-70
if account.suspended_at is not None:
    raise Forbidden("This account is suspended")
```

**Derivation Notes:**
Stated under README's `## Moderation` heading, but enforced here in Accounts' `issue_token`.
Cross-capability rule; owned here because the enforcement point is Accounts' sign-in path.
Confirmed by `tests/test_moderation.py::test_suspending_through_a_report_hides_the_account`.

---

### BR-010: An access token expires 30 days after issue

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 73-75 | Implementation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/config.py | 17 | Configured default |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:73-75
access = AccessToken(
    token=secrets.token_urlsafe(32),
    account_id=account.id,
    expires_at=utcnow() + timedelta(days=settings.token_ttl_days),
)
```

**Derivation Notes:**
`token_ttl_days` defaults to 30 in `Settings` (`minidon/config.py:17`) and is not overridden
anywhere else in the codebase. Not documented in README.md.

---

### BR-011: An expired token, or a token on a now-suspended account, authenticates as signed-out

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 81-88 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:81-88
def authenticate(session: Session, token: str) -> Account | None:
    access = session.get(AccessToken, token)
    if access is None or access.expires_at <= utcnow():
        return None
    account = session.get(Account, access.account_id)
    if account is None or account.suspended_at is not None:
        return None
    return account
```

**Derivation Notes:**
Returns `None` rather than raising; `minidon/deps.py#current_account` is what turns a `None`
into a `401 Unauthorized`. Confirmed indirectly by
`test_requests_without_a_token_are_refused` and by `test_suspending_through_a_report_hides_the_account`.

---

### BR-012: Suspended accounts look not-found to normal username lookups

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 96-110 | Implementation + docstring |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:105-110
def get_by_username(session: Session, username: str) -> Account:
    """An active account. Suspended accounts look as if they do not exist."""
    account = find_by_username(session, username)
    if account is None:
        raise NotFound("Account not found")
    return account
```

**Derivation Notes:**
The docstring itself states the intent plainly; `find_by_username`'s default
(`include_suspended=False`) is what every other capability's calls to `get_by_username` rely
on. Confirmed by `tests/test_moderation.py::test_suspending_through_a_report_hides_the_account`
(`GET /accounts/spammer` returns 404 after suspension).

---

### BR-013: Display name is limited to 30 characters; bio to 500 characters

**Confidence:** `DERIVED` (0.9) for the numeric limits; field existence is `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 11 | Documentation (states fields exist, not limits) |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 19-20,121-128 | Constants + validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:19-20,121-128
MAX_DISPLAY_NAME_LENGTH = 30
MAX_BIO_LENGTH = 500
...
if display_name is not None:
    if len(display_name) > MAX_DISPLAY_NAME_LENGTH:
        raise Invalid(f"Display name must be at most {MAX_DISPLAY_NAME_LENGTH} characters")
```

**Derivation Notes:**
README confirms "Profiles have a display name and a bio" but never states numeric limits.
Confirmed by `tests/test_accounts.py::test_display_names_are_limited`.

---

### BR-014: The "locked" flag drives follow-request approval

**Confidence:** `STATED` (field + named behaviour); `DERIVED` (exact mechanism)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 12 | Documentation (`## Accounts`) |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/models.py | 30 | Field definition |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/models.py:30
locked: Mapped[bool] = mapped_column(default=False)
```

**Derivation Notes:**
The field lives in Accounts; the behaviour it drives (turning a follow into a pending
request) is implemented in `minidon/social/service.py#follow` and traced fully in
`.mw/context/capabilities/following/rules-trace.md` BR-002. See
`.mw/notes/glossary/locked-account.md` for the cross-capability note.

## Confidence Legend

| Confidence | Meaning | When to Use |
|------------|---------|-------------|
| `STATED` | Explicitly documented or specified | README.md, comments, docs |
| `DERIVED` | Inferred from code behaviour | Implementation analysis |

## Conflict Log

> Rules where documentation and code disagree

| Rule ID | Documentation | Code | Resolution |
|---------|----------------|------|------------|
| _(none for this capability)_ | | | No STATED/code disagreement found for Accounts. See Posting's rules-trace.md BR-009/BR-010 for the one cross-capability conflict found this baseline (edit window: 30 vs 60 minutes). |

## Coverage Summary

- **Total Rules:** 14
- **Stated Rules:** 3 (21%) (BR-001, BR-009, BR-014 partially)
- **Derived Rules:** 11 (79%)
- **Rules with Multiple Sources:** 4 (BR-001, BR-009, BR-010, BR-013, BR-014)
- **Conflicts Requiring Resolution:** 0
