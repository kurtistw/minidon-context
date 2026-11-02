# Rules Trace

> **Capability:** L1-timelines
> **Baseline Version:** BASELINE-2026-10-30
> **Generated:** 2026-10-30T18:00:00Z

## Purpose

This document traces every business rule in `capability.md` to its source in the codebase,
per I-25: every rule traced to `repo@sha:path:lines`.

## Rules Index

| Rule ID | Rule Text | Confidence | Source Count |
|---------|-----------|------------|---------------|
| BR-001 | Home = own + followed statuses | `STATED` | 2 |
| BR-002 | Home excludes muted accounts/boosts | `DERIVED` | 1 |
| BR-003 | Home hides replies to unfollowed accounts | `DERIVED` | 1 |
| BR-004 | Public = public originals, hides muted/blocked | `STATED`/`DERIVED` | 2 |
| BR-005 | Profile = one account's statuses, visibility-filtered | `STATED` | 2 |
| BR-006 | Hashtag = public statuses with tag | `STATED`/`DERIVED` | 2 |
| BR-007 | Pagination: 20 default, 40 max, max_id cursor | `DERIVED` | 2 |
| BR-008 | can_view re-applied per timeline build | `DERIVED` | 1 |

## Detailed Traces

### BR-001: Home timeline shows own statuses and those you follow

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 38 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 18-24,38 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:22-24,38
followed = queries.following_ids(session, viewer.id)
muted = queries.muted_ids(session, viewer.id)
in_network = followed | {viewer.id}
...
query = select(Status).where(Status.account_id.in_(list(in_network - muted)))
```

**Derivation Notes:**
Confirmed by `tests/test_timelines.py::test_home_shows_your_statuses_and_those_you_follow`.

---

### BR-002: Home timeline excludes muted accounts and their boosts

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 26-29,38 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:26-29
def keep(status: Status) -> bool:
    if status.reblog_of_id is not None:
        original = session.get(Status, status.reblog_of_id)
        if original is not None and original.account_id in muted:
            return False
```

**Derivation Notes:**
Not documented in README.md. Confirmed by
`tests/test_timelines.py::test_home_hides_muted_accounts_and_their_boosted_statuses`.

---

### BR-003: Home timeline hides replies to accounts you don't follow

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 31-35 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:31-35
# A reply only shows when you also follow the account being replied to
if status.in_reply_to_id is not None and status.account_id != viewer.id:
    parent = session.get(Status, status.in_reply_to_id)
    if parent is not None and parent.account_id not in in_network:
        return False
```

**Derivation Notes:**
Not documented in README.md. Confirmed by
`tests/test_timelines.py::test_home_hides_replies_to_accounts_you_do_not_follow`.

---

### BR-004: Public timeline shows public originals, excluding muted/blocked authors

**Confidence:** `STATED` (feature); `DERIVED` (refinements, 0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 39 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 42-55,93-97 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:50-54
query = select(Status).where(
    Status.visibility == Visibility.PUBLIC,
    Status.reblog_of_id.is_(None),
    Status.account_id.not_in(list(_hidden_authors(session, viewer))),
)
```

**Derivation Notes:**
README says "every public status on the server" without mentioning that boosts are excluded
or that the viewer's own mutes/blocks apply here too. Confirmed by
`tests/test_timelines.py::test_public_shows_only_public_original_statuses`.

---

### BR-005: Profile timeline shows one account's statuses, visibility-filtered

**Confidence:** `STATED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 40 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 58-69 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:66-69
target = accounts.get_by_username(session, username)
query = select(Status).where(Status.account_id == target.id)
return _page(session, viewer, query, limit=limit, max_id=max_id)
```

**Derivation Notes:**
Unlike `public`, this query does not exclude boosts or filter by visibility at the query
level - all of that is handled by `_page`'s per-status `can_view` call. Confirmed by
`tests/test_timelines.py::test_profile_timeline_respects_visibility`.

---

### BR-006: Hashtag timeline shows public statuses with the given tag

**Confidence:** `STATED` (feature); `DERIVED` (refinements, 0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | README.md | 41 | Documentation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 72-90 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:84-88
.where(
    StatusTag.tag == tag.lstrip("#").lower(),
    Status.visibility == Visibility.PUBLIC,
    Status.account_id.not_in(list(_hidden_authors(session, viewer))),
)
```

**Derivation Notes:**
Tag matching strips a leading `#` and lower-cases, undocumented in README. Confirmed by
`tests/test_timelines.py::test_hashtag_timeline` (searching "python" matches a status tagged
`#Python`).

---

### BR-007: Pagination defaults to 20, caps at 40, uses `max_id` as a cursor

**Confidence:** `DERIVED` (0.9)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 14-15,100-118 | Implementation |
| 2 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/routes.py | 14 | API constraint |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:14-15
DEFAULT_LIMIT = 20
MAX_LIMIT = 40
```
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/routes.py:14
Limit = Annotated[int, Query(ge=1, le=MAX_LIMIT)]
```

**Derivation Notes:**
Not documented anywhere in README.md. Confirmed by
`tests/test_timelines.py::test_timelines_page_with_max_id`.

---

### BR-008: `can_view` is re-applied per status on every timeline build

**Confidence:** `DERIVED` (0.85)

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | minidon | e1fbd3a9c8d863086cb9e4005b411d7c33c91488 | minidon/timelines/service.py | 100-118 | Implementation |

**Code Reference:**
```python
// minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py:112-117
for status in session.scalars(query.order_by(Status.id.desc())):
    if (keep is None or keep(status)) and can_view(session, viewer, status):
        page.append(status)
        if len(page) == limit:
            break
```

**Derivation Notes:**
`can_view` is owned by `L1-posting` (see `.mw/context/capabilities/posting/rules-trace.md`
BR-005); Timelines adds no visibility logic of its own beyond calling it. This is a
cross-capability dependency worth documenting explicitly since a change to `can_view`
silently changes every timeline's output.

## Confidence Legend

| Confidence | Meaning | When to Use |
|------------|---------|-------------|
| `STATED` | Explicitly documented or specified | README.md, comments, docs |
| `DERIVED` | Inferred from code behaviour | Implementation analysis |

## Conflict Log

> Rules where documentation and code disagree

| Rule ID | Documentation | Code | Resolution |
|---------|----------------|------|------------|
| _(none)_ | | | No STATED/code disagreement found for Timelines. |

## Coverage Summary

- **Total Rules:** 8
- **Stated Rules:** 4 (50%)
- **Derived Rules:** 4 (50%)
- **Rules with Multiple Sources:** 4 (BR-001, BR-004, BR-005, BR-006, BR-007)
- **Conflicts Requiring Resolution:** 0
