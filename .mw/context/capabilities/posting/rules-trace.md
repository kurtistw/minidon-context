# Rules Trace

> **Capability:** L1-posting
> **Baseline Version:** BASELINE-2026-10-30
> **Generated:** 2026-10-30T18:00:00Z

## Purpose

This document traces every business rule in `capability.md` to its source in the codebase,
per I-25: every rule traced to `repo@sha:path:lines`.

## Rules Index

| Rule ID | Rule Text | Confidence | Source Count |
|---------|-----------|------------|---------------|
| BR-001 | Status limited to 500 characters | `STATED` | 2 |
| BR-002 | Content warning counts toward the limit | `DERIVED` | 1 |
| BR-003 | Status cannot be empty | `DERIVED` | 1 |
| BR-004 | Four visibility levels | `STATED` | 2 |
| BR-005 | Per-viewer visibility enforcement | `DERIVED` | 1 |
| BR-006 | Mentions/hashtags parsed from text | `STATED`/`DERIVED` | 2 |
| BR-007 | Reply threads under parent | `STATED` | 2 |
| BR-008 | Cannot reply to a boost | `DERIVED` | 1 |
| BR-009 | Edit window is 30 minutes (README) | `STATED` | 1 |
| BR-010 | Edit window enforced in code is 60 minutes | `DERIVED` | 3 |
| BR-011 | Boosts cannot be edited | `DERIVED` | 1 |
| BR-012 | Only the author can edit | `DERIVED` | 1 |
| BR-013 | Self-delete anytime; staff delete-any | `STATED`/`DERIVED` | 2 |
| BR-014 | Deleting a status deletes its boosts | `DERIVED` | 1 |
| BR-015 | Deletion is a soft delete | `DERIVED` | 2 |
| BR-016 | Only public/unlisted statuses can be boosted | `DERIVED` | 1 |
| BR-017 | A status can be boosted once per account | `DERIVED` | 2 |
| BR-018 | Acting on a boost resolves to the original | `DERIVED` | 1 |
| BR-019 | Favouriting is idempotent | `STATED`/`DERIVED` | 2 |
| BR-020 | Posting rate-limited to 30/hour | `DERIVED` | 3 |

## Detailed Traces

### BR-001: A status may contain up to 500 characters

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 15 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 229-230 | Enforcement |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:228-230
# A content warning counts towards the limit too
if len(content) + len(spoiler_text) > settings.max_status_length:
    raise Invalid(f"Statuses are limited to {settings.max_status_length} characters")
```

**Derivation Notes:**
`max_status_length` defaults to 500 (`minidon/config.py:14`), matching README exactly.
Confirmed by `tests/test_statuses.py::test_a_content_warning_counts_towards_the_length_limit`
(posting exactly 500 plain characters succeeds).

---

### BR-002: The content warning counts toward the 500-character limit

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 228-230 | Implementation + comment |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:228-230
# A content warning counts towards the limit too
if len(content) + len(spoiler_text) > settings.max_status_length:
```

**Derivation Notes:**
The inline comment states the intent plainly in code, but README.md's "## Posting" section
never mentions that the content warning shares the length budget with the body. Confirmed by
`test_a_content_warning_counts_towards_the_length_limit` (490 content + 20 spoiler = 510,
rejected).

---

### BR-003: A status cannot be empty

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 70,226-227 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:226-227
if not content:
    raise Invalid("A status cannot be empty")
```

**Derivation Notes:**
`content = content.strip()` happens before this check (line 70), so whitespace-only input is
also rejected. Confirmed by `tests/test_statuses.py::test_empty_statuses_are_refused`.

---

### BR-004: A status has one of four visibility levels

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 17-20 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/models.py | 12-16 | Enum definition |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/models.py:12-16
class Visibility(enum.StrEnum):
    PUBLIC = "public"  # everyone, and the public timeline
    UNLISTED = "unlisted"  # everyone, but kept off the public timeline
    PRIVATE = "private"  # followers only
    DIRECT = "direct"  # mentioned accounts only
```

**Derivation Notes:**
Code enum values map 1:1 to README's four bullet points. "Followers only" is named `PRIVATE`
in code - see `.mw/notes/glossary/followers-only.md`.

---

### BR-005: Visibility is enforced per-viewer

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 24-51 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:41-51
match status.visibility:
    case Visibility.PUBLIC | Visibility.UNLISTED:
        return True
    case Visibility.PRIVATE:
        # Mentioned accounts can read a followers-only status even if they do not follow
        return viewer_id is not None and (
            queries.is_following(session, viewer_id, status.account_id)
            or _is_mentioned(session, status.id, viewer_id)
        )
    case Visibility.DIRECT:
        return viewer_id is not None and _is_mentioned(session, status.id, viewer_id)
```

**Derivation Notes:**
README.md states the four visibility levels' audiences in general terms but does not mention
the "mentioned accounts can also read a followers-only status" exception, nor the
suspended-author/deleted-status/boost-must-also-be-visible preconditions earlier in the
function (lines 25-33). Confirmed by `tests/test_statuses.py::test_followers_only_statuses_are_hidden_from_everyone_else`
and `test_direct_statuses_are_visible_only_to_mentioned_accounts`.

---

### BR-006: Mentions and hashtags are parsed from status text

**Confidence:** `STATED` (feature); `DERIVED` (parsing mechanics)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 22 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 19-20,247-262 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:19-20
MENTION_PATTERN = re.compile(r"(?<![\w@])@([A-Za-z0-9_]{1,30})\b")
HASHTAG_PATTERN = re.compile(r"(?<![\w#])#(\w{1,100})")
```

**Derivation Notes:**
README states the feature ("Mention people with @username and tag topics with #hashtag.")
but not the exact regex, the exclusion of unknown usernames (`_sync_mentions_and_tags` only
notifies accounts that actually exist), or the exclusion of self-mentions (line 256:
`account.id != status.account_id`). Confirmed by
`tests/test_statuses.py::test_posting_parses_mentions_and_hashtags` (mentioning `@nobody`,
a non-existent account, produces no mention entry).

---

### BR-007: Replying to a status threads it under its parent

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 23 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 153-160 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:153-160
def replies(session: Session, viewer: Account | None, status_id: int) -> list[Status]:
    parent = get_status(session, status_id, viewer)
    children = session.scalars(
        select(Status)
        .where(Status.in_reply_to_id == parent.id, Status.deleted_at.is_(None))
        .order_by(Status.id)
    )
    return [child for child in children if can_view(session, viewer, child)]
```

**Derivation Notes:**
Confirmed by `tests/test_statuses.py::test_replies_are_listed_under_their_parent`.

---

### BR-008: A reply cannot target a boost

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 74-78 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:74-78
parent = None
if in_reply_to_id is not None:
    parent = get_status(session, in_reply_to_id, author)
    if parent.reblog_of_id is not None:
        raise Invalid("You cannot reply to a boost")
```

**Derivation Notes:**
Not mentioned in README.md; no dedicated test found exercising this path. Confidence reflects
unambiguous code but lack of test confirmation.

---

### BR-009: README states the edit window is 30 minutes

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 24 | Documentation |

**Code Reference:**
```markdown
<!-- minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:README.md:24 -->
- **Edit** your own status within **30 minutes** of posting.
```

**Derivation Notes:**
This rule is recorded as `STATED` exactly as written. It directly conflicts with BR-010's
code-enforced value - see Conflict Log below. Per I-05, both are recorded; neither is chosen
here.

---

### BR-010: The code enforces a 60-minute edit window by default

**Confidence:** `DERIVED` (0.95)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/config.py | 15 | Configured default |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 117-118 | Enforcement |
| 3 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | tests/test_statuses.py | 62-67 | Test confirming the enforced value |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/config.py:15
edit_window_minutes: int = 60
```
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:117-118
if utcnow() - status.created_at > timedelta(minutes=settings.edit_window_minutes):
    raise Forbidden("The edit window for this status has closed")
```
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:tests/test_statuses.py:62-67
def test_editing_after_the_window_closes_is_refused(make_user, monkeypatch):
    alice = make_user("alice")
    status = alice.toot("frist")
    later = utcnow() + timedelta(minutes=61)
    monkeypatch.setattr(statuses_service, "utcnow", lambda: later)
    assert alice.patch(f"/api/v1/statuses/{status['id']}", {"content": "x"}).status_code == 403
```

**Derivation Notes:**
The test deliberately advances the clock by 61 minutes (not 31) to trigger the rejection,
which is strong confirmation that the enforced window is 60 minutes, not 30. This directly
contradicts BR-009 (README's stated 30 minutes). Confidence is high (0.95) because three
independent artifacts - the config default, the comparison logic, and the test's chosen
offset - all agree with each other on 60, while only README disagrees.

---

### BR-011: A boost cannot be edited

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 115-116 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:115-116
if status.reblog_of_id is not None:
    raise Invalid("Boosts cannot be edited")
```

**Derivation Notes:**
Not documented in README.md; no dedicated test found.

---

### BR-012: Only the author can edit their status

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 113-114 | Validation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:113-114
if status.account_id != editor.id:
    raise Forbidden("You can only edit your own statuses")
```

**Derivation Notes:**
Confirmed by `tests/test_statuses.py::test_only_the_author_can_edit`.

---

### BR-013: Self-delete anytime; staff can delete any status

**Confidence:** `STATED` (self-delete); `DERIVED` (staff delete-any, 0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 25 | Documentation (self-delete) |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 131-140 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:135-138
# Staff can remove anyone's status
if status.account_id != actor.id and not actor.is_staff:
    raise Forbidden("You can only delete your own statuses")
```

**Derivation Notes:**
README.md only documents the self-delete case under `## Posting`. The staff delete-any-status
branch is undocumented there (Moderation's section describes deleting "the reported status,"
not a general staff delete power reachable directly via `DELETE /statuses/{id}`). Confirmed
(self-delete-only direction) by `tests/test_statuses.py::test_users_cannot_delete_other_peoples_statuses`.

---

### BR-014: Deleting a status also deletes its boosts

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 142-150 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:142-150
def soft_delete(session: Session, status: Status) -> None:
    """Deletes a status and every boost of it. The caller commits."""
    now = utcnow()
    status.deleted_at = now
    session.execute(
        update(Status)
        .where(Status.reblog_of_id == status.id, Status.deleted_at.is_(None))
        .values(deleted_at=now)
    )
```

**Derivation Notes:**
Confirmed by `tests/test_statuses.py::test_deleting_a_status_removes_its_boosts`.

---

### BR-015: Deletion is a soft delete

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 131-150 | Implementation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 25-26 | Enforcement in `can_view` |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:25-26
if status.deleted_at is not None:
    return False
```

**Derivation Notes:**
No row is ever physically removed from the `statuses` table by application code; `deleted_at`
is the sole mechanism. This is standard for an audit-friendly moderation trail but is not
documented anywhere.

---

### BR-016: Only public and unlisted statuses can be boosted

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 21,165-166 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:21,165-166
BOOSTABLE = frozenset({Visibility.PUBLIC, Visibility.UNLISTED})
...
if original.visibility not in BOOSTABLE:
    raise Forbidden("Only public and unlisted statuses can be boosted")
```

**Derivation Notes:**
README.md's "Boost any status you can see to share it with your followers" is broader than
this restriction (a followers-only status is visible to followers, but code forbids boosting
it). Confirmed by `tests/test_statuses.py::test_followers_only_statuses_cannot_be_boosted`.
Raised as an open question in `capability.md` (a documentation gap, not a direct numeric
conflict like BR-009/BR-010).

---

### BR-017: A status can be boosted once per account

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 167-168,286-293 | Implementation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | tests/test_statuses.py | 98-104 | Test |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:167-168
if _find_boost(session, account.id, original.id):
    raise Conflict("You have already boosted this status")
```

**Derivation Notes:**
Confirmed by `tests/test_statuses.py::test_a_status_can_only_be_boosted_once`.

---

### BR-018: Acting on a boost resolves to the original status

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 276-283 | Implementation + docstring |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:276-283
def _resolve_boost(session: Session, status: Status) -> Status:
    """Acting on a boost acts on the status it boosts."""
    if status.reblog_of_id is None:
        return status
    original = session.get(Status, status.reblog_of_id)
    if original is None:
        raise NotFound("Status not found")
    return original
```

**Derivation Notes:**
Used by `reblog`, `unreblog`, `favourite` and `unfavourite` to normalize the target, so e.g.
favouriting a boost actually favourites the original (and is reflected on the original's
`favourites_count`).

---

### BR-019: Favouriting is idempotent

**Confidence:** `STATED` (feature); `DERIVED` (idempotency, 0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 29 | Documentation (feature) |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 192-211 | Implementation (idempotency) |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:198-199
if already is None:
    session.add(Favourite(account_id=account.id, status_id=status.id))
```

**Derivation Notes:**
Confirmed by `tests/test_statuses.py::test_favourites_are_counted_once`.

---

### BR-020: Posting is rate-limited to 30 statuses per rolling hour

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/config.py | 16 | Configured default |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/statuses/service.py | 233-244 | Implementation |
| 3 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | tests/test_statuses.py | 127-131 | Test |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:233-244
def _check_rate_limit(session: Session, author: Account) -> None:
    recent = session.scalar(
        select(func.count())
        .select_from(Status)
        .where(
            Status.account_id == author.id,
            Status.reblog_of_id.is_(None),
            Status.created_at >= utcnow() - timedelta(hours=1),
        )
    )
    if recent >= settings.max_posts_per_hour:
        raise RateLimited("You are posting too quickly, try again later")
```

**Derivation Notes:**
`Status.reblog_of_id.is_(None)` in the count means only original statuses count toward the
limit, not boosts. Confirmed by `tests/test_statuses.py::test_posting_is_rate_limited` (30
successful posts, 31st returns 429). Not mentioned anywhere in README.md.

## Confidence Legend

| Confidence | Meaning | When to Use |
|------------|---------|-------------|
| `STATED` | Explicitly documented or specified | README.md, comments, docs |
| `DERIVED` | Inferred from code behaviour | Implementation analysis |

## Conflict Log

> Rules where documentation and code disagree

| Rule ID | Documentation | Code | Resolution |
|---------|----------------|------|------------|
| BR-009 / BR-010 | README.md `## Posting`: edit window is **30 minutes** | `minidon/config.py:15` `edit_window_minutes: int = 60`, enforced at `minidon/statuses/service.py:117-118`, confirmed by a test using a 61-minute offset | **Unresolved.** Recorded as an open question in `capability.md` for BA/Product to decide which value is correct; this document does not choose a winner, per I-05. |

## Coverage Summary

- **Total Rules:** 20
- **Stated Rules:** 6 (30%) (BR-001, BR-004, BR-006 partial, BR-007, BR-009, BR-013 partial, BR-019 partial - counted where a STATED source exists)
- **Derived Rules:** 14 (70%)
- **Rules with Multiple Sources:** 7 (BR-001, BR-004, BR-006, BR-007, BR-010, BR-015, BR-017, BR-019, BR-020)
- **Conflicts Requiring Resolution:** 1 (BR-009 vs BR-010, edit window length)
