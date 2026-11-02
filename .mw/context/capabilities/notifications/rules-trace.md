# Rules Trace

> **Capability:** L1-notifications
> **Baseline Version:** BASELINE-2026-10-30
> **Generated:** 2026-10-30T18:00:00Z

## Purpose

This document traces every business rule in `capability.md` to its source in the codebase,
per I-25: every rule traced to `repo@sha:path:lines`.

## Rules Index

| Rule ID | Rule Text | Confidence | Source Count |
|---------|-----------|------------|---------------|
| BR-001 | Six notification kinds | `STATED` | 3 |
| BR-002 | No self-notification | `DERIVED` | 1 |
| BR-003 | No notification across a block | `DERIVED` | 1 |
| BR-004 | No notification while muted | `DERIVED` | 1 |
| BR-005 | Mark read one-at-a-time or all-at-once | `STATED` | 2 |
| BR-006 | Only the recipient can read/mark their notifications | `DERIVED` | 1 |
| BR-007 | Marking read twice is a no-op | `DERIVED` | 1 |
| BR-008 | Suspended actors excluded from list/count | `DERIVED` | 1 |
| BR-009 | List defaults 40, caps at 80 | `DERIVED` | 2 |

## Detailed Traces

### BR-001: Recipients are notified of six interaction kinds

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 44-45 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/models.py | 12-18 | Enum definition |
| 3 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py:56-61; minidon/statuses/service.py:92-94,98-104,175-177,203-209 | Call sites |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/models.py:12-18
class NotificationKind(enum.StrEnum):
    MENTION = "mention"
    REPLY = "reply"
    REBLOG = "reblog"
    FAVOURITE = "favourite"
    FOLLOW = "follow"
    FOLLOW_REQUEST = "follow_request"
```

**Derivation Notes:**
All six kinds README names have a corresponding enum value and at least one `notify()` call
site. Confirmed end-to-end by `tests/test_notifications.py::test_interactions_notify_the_author`
(exercises reply, mention, reblog, favourite, follow in one test) and
`test_locked_accounts_are_notified_of_follow_requests` (follow_request).

---

### BR-002: A user is never notified about their own actions

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/service.py | 30-31 | Guard clause |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/service.py:30-31
if recipient.id == actor.id:
    return
```

**Derivation Notes:**
Not documented in README.md. Confirmed by
`tests/test_notifications.py::test_you_are_not_notified_about_your_own_actions`.

---

### BR-003: No notification is created across a block

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/service.py | 32-33 | Guard clause |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/service.py:32-33
if queries.is_blocked_between(session, recipient.id, actor.id):
    return
```

**Derivation Notes:**
Not documented in README.md; no dedicated test found, but the guard is unambiguous and
reuses the same symmetric predicate traced in `L1-following`'s rules-trace.md BR-004/BR-010.

---

### BR-004: No notification is created while the recipient mutes the actor

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/service.py | 34-35 | Guard clause |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/service.py:34-35
if queries.is_muting(session, recipient.id, actor.id):
    return
```

**Derivation Notes:**
Not documented in README.md. Confirmed by
`tests/test_notifications.py::test_muted_accounts_do_not_notify_you`.

---

### BR-005: Notifications can be marked read individually or all at once

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 46 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/service.py | 77-93 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/service.py:87-93
def mark_all_read(session: Session, recipient: Account) -> None:
    session.execute(
        update(Notification)
        .where(Notification.recipient_id == recipient.id, Notification.read_at.is_(None))
        .values(read_at=utcnow())
    )
    session.commit()
```

**Derivation Notes:**
Confirmed by `tests/test_notifications.py::test_marking_notifications_read`.

---

### BR-006: Only the recipient can read or mark their own notifications

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/service.py | 77-80 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/service.py:77-80
notification = session.get(Notification, notification_id)
if notification is None or notification.recipient_id != recipient.id:
    raise NotFound("Notification not found")
```

**Derivation Notes:**
`list_notifications`/`unread_count` also scope every query by `recipient_id` (lines 49-58,
61-73). Confirmed by
`tests/test_notifications.py::test_you_cannot_read_someone_elses_notifications`.

---

### BR-007: Marking an already-read notification read again is a no-op

**Confidence:** `DERIVED` (0.8)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/service.py | 81-84 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/service.py:81-84
if notification.read_at is None:
    notification.read_at = utcnow()
    session.commit()
return notification
```

**Derivation Notes:**
Not exercised by a dedicated test (the existing test marks a notification read only once);
confidence reflects straightforward but unconfirmed-by-test code reading.

---

### BR-008: The list and unread count exclude notifications from suspended actors

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/service.py | 49-58,61-73 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/service.py:49-54
query = (
    select(Notification)
    .join(Account, Account.id == Notification.actor_id)
    .where(Notification.recipient_id == recipient.id, Account.suspended_at.is_(None))
    .order_by(Notification.id.desc())
    .limit(limit)
)
```

**Derivation Notes:**
Not documented in README.md; no dedicated test found, but the join condition is unambiguous
and consistent with every other capability's pattern of hiding suspended accounts.

---

### BR-009: Listing notifications defaults to 40, caps at 80

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/routes.py | 55 | API constraint |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/notifications/service.py | 46-48 | Default |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/routes.py:55
limit: int = Query(40, ge=1, le=80),
```

**Derivation Notes:**
Not documented in README.md; no dedicated test exercises the limit boundary.

## Confidence Legend

| Confidence | Meaning | When to Use |
|------------|---------|-------------|
| `STATED` | Explicitly documented or specified | README.md, comments, docs |
| `DERIVED` | Inferred from code behaviour | Implementation analysis |

## Conflict Log

> Rules where documentation and code disagree

| Rule ID | Documentation | Code | Resolution |
|---------|----------------|------|------------|
| _(none)_ | | | No STATED/code disagreement found for Notifications. |

## Coverage Summary

- **Total Rules:** 9
- **Stated Rules:** 2 (22%)
- **Derived Rules:** 7 (78%)
- **Rules with Multiple Sources:** 3 (BR-001, BR-005, BR-009)
- **Conflicts Requiring Resolution:** 0
