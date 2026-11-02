# Rules Trace

> **Capability:** L1-following
> **Baseline Version:** BASELINE-2026-10-30
> **Generated:** 2026-10-30T18:00:00Z

## Purpose

This document traces every business rule in `capability.md` to its source in the codebase,
per I-25: every rule traced to `repo@sha:path:lines`.

## Rules Index

| Rule ID | Rule Text | Confidence | Source Count |
|---------|-----------|------------|---------------|
| BR-001 | Following an open account is immediate | `STATED` | 2 |
| BR-002 | Following a locked account creates a pending request | `STATED` | 2 |
| BR-003 | Cannot follow yourself | `DERIVED` | 1 |
| BR-004 | Cannot follow across a block | `DERIVED` | 2 |
| BR-005 | Re-following is a no-op | `DERIVED` | 1 |
| BR-006 | Unfollow removes follow or pending request | `DERIVED` | 1 |
| BR-007 | Blocking deletes existing follows both ways | `DERIVED` | 1 |
| BR-008 | Cannot block yourself | `DERIVED` | 1 |
| BR-009 | Re-blocking is a no-op | `DERIVED` | 1 |
| BR-010 | Blocked accounts cannot follow or view you | `STATED` | 2 |
| BR-011 | Muting hides statuses silently | `STATED` | 1 |
| BR-012 | Cannot mute yourself | `DERIVED` | 1 |
| BR-013 | Re-muting is a no-op | `DERIVED` | 1 |
| BR-014 | Lists exclude suspended accounts and non-accepted follows | `DERIVED` | 1 |
| BR-015 | Relationship has five fields | `DERIVED` | 1 |

## Detailed Traces

### BR-001: Following an open account takes effect immediately

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 32-33 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 44,54-55 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:53-55
# Locked accounts approve each follower by hand
accepted = not target.locked
session.add(Follow(follower_id=follower.id, followee_id=target.id, accepted=accepted))
```

**Derivation Notes:**
`accepted` is set true outright for any non-locked target, matching README's "Follow and
unfollow accounts" with no mention of a pending state for open accounts. Confirmed by
`tests/test_social.py::test_following_an_open_account_is_immediate`.

---

### BR-002: Following a locked account creates a pending follow request

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 32-33 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 44-63,91-108 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:91-98
def authorize_request(session: Session, account: Account, username: str) -> Account:
    requester = accounts.get_by_username(session, username)
    request = _find_follow(session, requester.id, account.id)
    if request is None or request.accepted:
        raise NotFound("No pending follow request from this account")
    request.accepted = True
    session.commit()
    return requester
```

**Derivation Notes:**
There is no separate "FollowRequest" table - a pending request is simply a `Follow` row with
`accepted=False`, and `authorize_request`/`reject_request` act on that same row. This is the
glossary cross-reference documented in `.mw/notes/glossary/locked-account.md`. Confirmed by
`tests/test_social.py::test_following_a_locked_account_sends_a_request`.

---

### BR-003: A user cannot follow themselves

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 46-47 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:46-47
if target.id == follower.id:
    raise Invalid("You cannot follow yourself")
```

**Derivation Notes:**
Not mentioned in README.md; confirmed by `tests/test_social.py::test_you_cannot_follow_yourself`.

---

### BR-004: A user cannot follow an account involved in a block with them

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 48-49 | Validation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/queries.py | 25-37 | Supporting predicate |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:48-49
if queries.is_blocked_between(session, follower.id, target.id):
    raise Forbidden("You cannot follow this account")
```

**Derivation Notes:**
`is_blocked_between` checks both directions (`blocker==a & blocked==b` OR `blocker==b &
blocked==a`), so it does not matter who blocked whom. Confirmed by
`tests/test_social.py::test_blocking_removes_follows_both_ways` (the follow attempt after
blocking returns 403).

---

### BR-005: Following an already-followed (or already-requested) account is a no-op

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 50-51 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:50-51
if _find_follow(session, follower.id, target.id):
    return target
```

**Derivation Notes:**
Returns the target without raising or creating a duplicate row, regardless of whether the
existing `Follow` is accepted or pending. Not exercised by name in the test suite; confidence
reflects straightforward code reading rather than a confirming test.

---

### BR-006: Unfollowing removes a follow or withdraws a pending request

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 66-73 | Implementation + docstring |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:66-73
def unfollow(session: Session, follower: Account, username: str) -> Account:
    """Stops following, or withdraws a pending request."""
    target = accounts.get_by_username(session, username)
    session.execute(
        delete(Follow).where(Follow.follower_id == follower.id, Follow.followee_id == target.id)
    )
```

**Derivation Notes:**
The delete is unconditional on `accepted`, so the same endpoint serves both "unfollow" and
"cancel my pending request" - README.md does not separate these as different actions.
Confirmed by `tests/test_social.py::test_unfollowing`.

---

### BR-007: Blocking deletes existing follows between the two accounts, both ways

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 120-131 | Implementation + inline comment |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:120-129
# A block cuts every follow between the two accounts, in both directions
session.execute(
    delete(Follow).where(
        or_(
            and_(Follow.follower_id == blocker.id, Follow.followee_id == target.id),
            and_(Follow.follower_id == target.id, Follow.followee_id == blocker.id),
        )
    )
)
session.add(Block(blocker_id=blocker.id, blocked_id=target.id))
```

**Derivation Notes:**
Confirmed by `tests/test_social.py::test_blocking_removes_follows_both_ways`. README.md only
describes block's forward-looking effect ("can no longer follow you or see your statuses");
the retroactive cleanup of existing follows is additional behaviour not mentioned there -
raised as an open question in `capability.md`.

---

### BR-008: A user cannot block themselves

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 113-114 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:113-114
if target.id == blocker.id:
    raise Invalid("You cannot block yourself")
```

**Derivation Notes:**
Not mentioned in README.md; no dedicated test found, but the pattern is identical to BR-003
and BR-012.

---

### BR-009: Blocking an already-blocked account is a no-op

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 115-118 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:115-118
if session.scalar(
    select(Block.id).where(Block.blocker_id == blocker.id, Block.blocked_id == target.id)
):
    return target
```

**Derivation Notes:**
Returns early without creating a duplicate `Block` row or re-running the follow-cleanup step.

---

### BR-010: A blocked account can no longer follow you or see your statuses

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 34 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 48-49 | Enforcement (follow) |
| 3 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 38 | Enforcement (visibility) |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:38
if viewer_id is not None and queries.is_blocked_between(session, viewer_id, status.account_id):
    return False
```

**Derivation Notes:**
Enforcement spans two capabilities: Following's `follow()` guard and Posting's `can_view()`.
Both consume the same `is_blocked_between` predicate owned by Following. Confirmed by
`tests/test_statuses.py::test_blocked_accounts_cannot_see_your_statuses` and
`tests/test_social.py::test_blocking_removes_follows_both_ways`.

---

### BR-011: Muting hides an account's statuses without telling it

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 35 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 22-23,93-97 | Enforcement |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:22-23
followed = queries.following_ids(session, viewer.id)
muted = queries.muted_ids(session, viewer.id)
```

**Derivation Notes:**
No route or schema anywhere exposes "muted by X" to account X, which is the code-level
evidence for "without it knowing." Confirmed by
`tests/test_timelines.py::test_home_hides_muted_accounts_and_their_boosted_statuses` and
`tests/test_notifications.py::test_muted_accounts_do_not_notify_you`.

---

### BR-012: A user cannot mute themselves

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 145-146 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:145-146
if target.id == muter.id:
    raise Invalid("You cannot mute yourself")
```

**Derivation Notes:**
Not mentioned in README.md; same pattern as BR-003/BR-008.

---

### BR-013: Muting an already-muted account is a no-op

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 147-150 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:147-150
if not queries.is_muting(session, muter.id, target.id):
    session.add(Mute(muter_id=muter.id, muted_id=target.id))
    session.commit()
return target
```

**Derivation Notes:**
If already muting, the function returns without touching the database (no duplicate row, no
commit).

---

### BR-014: Followers/following/follow-request lists exclude suspended accounts and non-matching Follow states

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 76-88,160-181 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:160-169
def followers(session: Session, username: str) -> list[Account]:
    target = accounts.get_by_username(session, username)
    return list(
        session.scalars(
            select(Account)
            .join(Follow, Follow.follower_id == Account.id)
            .where(Follow.followee_id == target.id, Follow.accepted, Account.suspended_at.is_(None))
            .order_by(Follow.created_at)
        )
    )
```

**Derivation Notes:**
`followers`/`following` filter on `Follow.accepted` and `Account.suspended_at.is_(None)`;
`follow_requests` filters on `Follow.accepted.is_(False)` and the same suspension exclusion.
Not documented in README.md. Confirmed partially by
`tests/test_social.py::test_followers_and_following_lists`.

---

### BR-015: The "Relationship" view has five fields: following, requested, followed_by, blocking, muting

**Confidence:** `DERIVED` (0.8)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/social/service.py | 17-41 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/service.py:17-26
@dataclass(frozen=True)
class Relationship:
    """How the viewer relates to another account."""

    username: str
    following: bool
    requested: bool
    followed_by: bool
    blocking: bool
    muting: bool
```

**Derivation Notes:**
README.md lists the individual states ("Follow and unfollow", "Block", "Mute") but never
names their combined view; "Relationship" is the code's own name. See
`.mw/notes/glossary/relationship.md` for the full cross-reference note. Confidence held at
0.8 (not higher) because the business name for this concept is unconfirmed outside the code.

## Confidence Legend

| Confidence | Meaning | When to Use |
|------------|---------|-------------|
| `STATED` | Explicitly documented or specified | README.md, comments, docs |
| `DERIVED` | Inferred from code behaviour | Implementation analysis |

## Conflict Log

> Rules where documentation and code disagree

| Rule ID | Documentation | Code | Resolution |
|---------|----------------|------|------------|
| _(none)_ | | | No STATED/code disagreement found for Following. |

## Coverage Summary

- **Total Rules:** 15
- **Stated Rules:** 4 (27%)
- **Derived Rules:** 11 (73%)
- **Rules with Multiple Sources:** 4 (BR-001, BR-002, BR-004, BR-010, BR-011)
- **Conflicts Requiring Resolution:** 0
