# Rules Trace

> **Capability:** L1-moderation
> **Baseline Version:** BASELINE-2026-10-30
> **Generated:** 2026-10-30T18:00:00Z

## Purpose

This document traces every business rule in `capability.md` to its source in the codebase,
per I-25: every rule traced to `repo@sha:path:lines`.

## Rules Index

| Rule ID | Rule Text | Confidence | Source Count |
|---------|-----------|------------|---------------|
| BR-001 | Any user may report an account | `STATED` | 3 |
| BR-002 | Cannot report yourself | `DERIVED` | 1 |
| BR-003 | Reported status must belong to the target | `DERIVED` | 1 |
| BR-004 | Report comment limited to 1000 chars | `DERIVED` | 1 |
| BR-005 | Moderators resolve: dismiss/delete/suspend | `STATED` | 3 |
| BR-006 | A report closes once | `DERIVED` | 1 |
| BR-007 | Delete-status resolution requires a linked status | `DERIVED` | 1 |
| BR-008 | Resolution records resolver, time, action, note | `DERIVED` | 1 |
| BR-009 | Suspended accounts cannot sign in | `STATED` | 2 |
| BR-010 | Suspension revokes tokens and hides account | `DERIVED` | 3 |
| BR-011 | Staff-suspend protections | `DERIVED` | 1 |
| BR-012 | Only admins lift suspensions | `DERIVED` | 1 |
| BR-013 | Only admins change roles; not own role | `STATED`/`DERIVED` | 2 |
| BR-014 | Staff-only gating, report-filing open | `STATED`/`DERIVED` | 2 |
| BR-015 | Delete-status reuses Posting's soft_delete cascade | `DERIVED` | 2 |

## Detailed Traces

### BR-001: Any user may report an account

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 49 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 17-44 | Implementation |
| 3 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/models.py | 12-16 | `ReportCategory` enum |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:17-24
def file_report(
    session: Session,
    reporter: Account,
    username: str,
    category: ReportCategory,
    comment: str = "",
    status_id: int | None = None,
) -> Report:
```

**Derivation Notes:**
`file_report` is reachable via `CurrentAccount` (any signed-in user), not `Staff`, matching
README's implication that reporting is open to everyone. Confirmed by
`tests/test_moderation.py::test_suspending_through_a_report_hides_the_account`.

---

### BR-002: A user cannot report themselves

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 26-27 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:26-27
if target.id == reporter.id:
    raise Invalid("You cannot report yourself")
```

**Derivation Notes:**
Confirmed by `tests/test_moderation.py::test_you_cannot_report_yourself`.

---

### BR-003: A reported status must belong to the reported account

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 30-33 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:30-33
if status_id is not None:
    status = session.get(Status, status_id)
    if status is None or status.account_id != target.id:
        raise Invalid("That status does not belong to the reported account")
```

**Derivation Notes:**
Confirmed by `tests/test_moderation.py::test_reported_statuses_must_belong_to_the_reported_account`.

---

### BR-004: Report comments are limited to 1000 characters

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 14,28-29 | Constant + validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:14,28-29
MAX_COMMENT_LENGTH = 1000
...
if len(comment) > MAX_COMMENT_LENGTH:
    raise Invalid(f"Comments are limited to {MAX_COMMENT_LENGTH} characters")
```

**Derivation Notes:**
Not documented anywhere in README.md; no dedicated test found.

---

### BR-005: Moderators resolve reports by dismissing, deleting the status, or suspending

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 50-51 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 51-84 | Implementation |
| 3 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/models.py | 24-27 | `ModerationAction` enum |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:64-77
match action:
    case ModerationAction.DISMISS:
        report.state = ReportState.DISMISSED
    case ModerationAction.DELETE_STATUS:
        ...
        report.state = ReportState.RESOLVED
    case ModerationAction.SUSPEND:
        ...
        report.state = ReportState.RESOLVED
```

**Derivation Notes:**
The three `ModerationAction` enum values map exactly to README's "dismiss them, delete the
reported status or suspend the account." Confirmed by
`tests/test_moderation.py::test_suspending_through_a_report_hides_the_account` and
`test_deleting_the_reported_status_keeps_the_account`.

---

### BR-006: A report can only be resolved once

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 61-62 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:61-62
if report.state != ReportState.OPEN:
    raise Conflict("This report is already closed")
```

**Derivation Notes:**
Confirmed by `tests/test_moderation.py::test_a_report_closes_once`.

---

### BR-007: Delete-status resolution requires a linked status

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 67-70 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:67-70
case ModerationAction.DELETE_STATUS:
    status = session.get(Status, report.status_id) if report.status_id else None
    if status is None:
        raise Invalid("This report is not about a status")
```

**Derivation Notes:**
Not exercised by a dedicated test; straightforward code reading.

---

### BR-008: Resolution always records resolver, time, action and note

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 79-83 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:79-83
report.action_taken = action
report.moderator_note = note
report.resolved_by_id = moderator.id
report.resolved_at = utcnow()
session.commit()
```

**Derivation Notes:**
Applies to all three resolution actions uniformly, after the `match` block. Not exercised
directly by a test asserting all four fields, but visible in the `ReportOut` schema returned
by the resolve endpoint.

---

### BR-009: Suspended accounts can no longer sign in

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 52 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 69-70,86-87 | Enforcement (owned by `L1-accounts`) |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:69-70
if account.suspended_at is not None:
    raise Forbidden("This account is suspended")
```

**Derivation Notes:**
Duplicate of `L1-accounts` rules-trace.md BR-009; included here too because the rule is
stated under README's `## Moderation` heading and the suspension action itself is owned by
this capability. Confirmed by
`tests/test_moderation.py::test_suspending_through_a_report_hides_the_account`.

---

### BR-010: Suspension revokes tokens and hides the account everywhere

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 132-136 | Implementation (`_suspend`) |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/accounts/service.py | 96-110 | Lookup hiding (`find_by_username`/`get_by_username`) |
| 3 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 27-28 | Status visibility hiding (`can_view`) |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:132-136
def _suspend(session: Session, target: Account) -> None:
    """Hides the account and its statuses and signs it out everywhere. The caller commits."""
    if target.suspended_at is None:
        target.suspended_at = utcnow()
    accounts.revoke_tokens(session, target)
```

**Derivation Notes:**
`_suspend`'s own docstring states the full scope of the effect; `revoke_tokens` is owned by
`L1-accounts` but called directly from here, a cross-capability call. Confirmed end-to-end
by `tests/test_moderation.py::test_suspending_through_a_report_hides_the_account` (account
profile 404, status 404, `/accounts/me` 401, sign-in 403).

---

### BR-011: Staff-suspend protections (self, admins, other staff)

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 122-129 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:122-129
def _check_can_suspend(moderator: Account, target: Account) -> None:
    if target.id == moderator.id:
        raise Forbidden("You cannot suspend yourself")
    if target.role == Role.ADMIN:
        raise Forbidden("Admins cannot be suspended")
    # Only admins can act against other staff
    if target.is_staff and moderator.role != Role.ADMIN:
        raise Forbidden("Only admins can suspend moderators")
```

**Derivation Notes:**
Three distinct guards in one function. Confirmed by
`tests/test_moderation.py::test_moderators_cannot_suspend_other_staff` (covers both the
self-suspend-another-moderator and self-suspend-the-admin cases).

---

### BR-012: Only admins can lift a suspension

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 95-97 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:95-97
if staff.role != Role.ADMIN:
    raise Forbidden("Only admins can lift a suspension")
```

**Derivation Notes:**
Not documented in README.md (which only says "Admins appoint moderators," not that they
alone can unsuspend). Confirmed by
`tests/test_moderation.py::test_only_admins_lift_suspensions`.

---

### BR-013: Only admins change roles; never their own

**Confidence:** `STATED` (appointment authority); `DERIVED` (self-change restriction, 0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 53 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 104-110 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:104-110
def set_role(session: Session, admin: Account, username: str, role: Role) -> Account:
    if admin.role != Role.ADMIN:
        raise Forbidden("Only admins can change roles")
    target = _find_any(session, username)
    if target.id == admin.id:
        raise Forbidden("You cannot change your own role")
```

**Derivation Notes:**
README states "Admins appoint moderators" (the forward direction); the self-change
restriction is an undocumented refinement. Confirmed by
`tests/test_moderation.py::test_only_admins_change_roles`.

---

### BR-014: Moderation endpoints are staff-gated except filing a report

**Confidence:** `STATED` (two-tier distinction); `DERIVED` (gating mechanism)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 48-53 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/deps.py | 37-43 | Dependency definition |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/deps.py:37-43
def staff_account(account: CurrentAccount) -> Account:
    if not account.is_staff:
        raise Forbidden("Moderators only")
    return account


Staff = Annotated[Account, Depends(staff_account)]
```

**Derivation Notes:**
See `.mw/notes/glossary/staff.md` for the full business-term/code-term cross-reference.
Confirmed by `tests/test_moderation.py::test_regular_users_cannot_see_reports`.

---

### BR-015: Delete-status resolution reuses Posting's cascading soft-delete

**Confidence:** `DERIVED` (0.8)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/moderation/service.py | 71 | Call site |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 142-150 | Implementation (owned by `L1-posting`) |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:71
statuses.soft_delete(session, status)
```

**Derivation Notes:**
Moderation does not reimplement delete semantics; it calls Posting's function directly. See
`.mw/context/capabilities/posting/rules-trace.md` BR-014 for the cascading-boost-deletion
behaviour this inherits, and domain-map.md Boundary Question 4 for the architectural note
this raises.

## Confidence Legend

| Confidence | Meaning | When to Use |
|------------|---------|-------------|
| `STATED` | Explicitly documented or specified | README.md, comments, docs |
| `DERIVED` | Inferred from code behaviour | Implementation analysis |

## Conflict Log

> Rules where documentation and code disagree

| Rule ID | Documentation | Code | Resolution |
|---------|----------------|------|------------|
| _(none)_ | | | No STATED/code disagreement found for Moderation. |

## Coverage Summary

- **Total Rules:** 15
- **Stated Rules:** 5 (33%)
- **Derived Rules:** 10 (67%)
- **Rules with Multiple Sources:** 6 (BR-001, BR-005, BR-009, BR-010, BR-013, BR-014, BR-015)
- **Conflicts Requiring Resolution:** 0
