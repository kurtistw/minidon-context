# L1-posting: Posting

> **Level:** L1
> **Domain:** L0-minidon (Minidon Social Network)
> **Last Updated:** 2026-10-30T18:00:00Z
> **Baseline Version:** BASELINE-2026-10-30

## Summary

Posting covers composing, editing, deleting and replying to statuses, plus boosting
(reblogging) and favouriting. `STATED` name from README.md's `## Posting` and
`## Interacting` sections, which this map merges into one L1 capability because the code
implements both in a single package, `minidon/statuses/` (see domain-map.md Boundary
Question 3 and `.mw/notes/glossary/boost.md`). This is the largest and most central module
in the codebase (293 lines, graph-report's highest out-degree hotspot) and owns the
`can_view` visibility function that Timelines and Notifications both depend on directly.

**A STATED/DERIVED conflict was found in this capability**: README.md states a 30-minute
edit window; the code enforces 60 minutes by default. See BR-009/BR-010 below and the Open
Questions section. Per I-05, both values are recorded; this document does not choose one.

## Business Context

### Purpose
Let people post short statuses with a choice of audience, mention and tag other things in
them, reply to build threads, edit or delete their own posts, and interact with statuses
they can see by boosting (resharing) or favouriting them. `STATED` - README.md `## Posting`
and `## Interacting`.

### Stakeholders
| Role | Responsibility |
|------|----------------|
| End user (author) | Composes, edits (within the window), deletes their own statuses |
| End user (reader) | Views, replies to, boosts, favourites statuses they are allowed to see |
| Moderator / Admin (see `L1-moderation`) | Can delete any status; Moderation's "delete reported status" resolution reuses Posting's delete path directly |
| BA / Product | Owns status length, visibility, edit-window and rate-limit rules |

### Business Rules

| ID | Rule | Source | Confidence |
|----|------|--------|------------|
| BR-001 | A status may contain up to 500 characters. | README.md `## Posting`: "Statuses are up to 500 characters."; `minidon/config.py:14`; `minidon/statuses/service.py:229-230` | `STATED` |
| BR-002 | The content warning (spoiler text) counts toward the same 500-character limit as the status body. | `minidon/statuses/service.py:228-230` | `DERIVED` (0.9) |
| BR-003 | A status cannot be empty after trimming surrounding whitespace. | `minidon/statuses/service.py:70,226-227` | `DERIVED` (0.9) |
| BR-004 | A status has one of four visibility levels: public, unlisted, followers-only, direct. | README.md `## Posting` bullet list; `minidon/statuses/models.py:12-16` | `STATED` |
| BR-005 | Visibility is enforced per-viewer: public/unlisted are visible to everyone; followers-only is visible to followers and to accounts mentioned in it; direct is visible only to mentioned accounts; the author always sees their own; a status is invisible to everyone once its author is suspended or the status is deleted; a boost is invisible unless the original status is also visible to the viewer. | `minidon/statuses/service.py:24-51` | `DERIVED` (0.85) |
| BR-006 | Mentioning `@username` and tagging `#hashtag` in status text is parsed and stored; a user is never recorded as mentioning themselves. | README.md `## Posting`: "Mention people with @username and tag topics with #hashtag."; `minidon/statuses/service.py:19-20,247-262` | `STATED` (feature); `DERIVED` (parsing/self-mention exclusion mechanics) |
| BR-007 | Replying to a status links it to its parent and threads it underneath. | README.md `## Posting`: "Reply to a status to start a thread."; `minidon/statuses/service.py:153-160` | `STATED` |
| BR-008 | A reply cannot target a boost; you can only reply to an original status. | `minidon/statuses/service.py:74-78` | `DERIVED` (0.85) |
| BR-009 | The author may edit their own status within 30 minutes of posting. | README.md `## Posting`: "Edit your own status within 30 minutes of posting." | `STATED` - **see BR-010, this conflicts with the enforced code value** |
| BR-010 | The edit window enforced by the code is 60 minutes from the status's creation time (`edit_window_minutes`, configurable, default 60), not 30. | `minidon/config.py:15`; `minidon/statuses/service.py:117-118`; confirmed by `tests/test_statuses.py::test_editing_after_the_window_closes_is_refused` (uses a 61-minute offset to trigger the rejection) | `DERIVED` (0.95) - **conflicts with BR-009, see Open Questions** |
| BR-011 | A boost cannot itself be edited. | `minidon/statuses/service.py:115-116` | `DERIVED` (0.85) |
| BR-012 | Only the status's author can edit it. | `minidon/statuses/service.py:113-114` | `DERIVED` (0.85) |
| BR-013 | A user may delete their own statuses at any time; staff (moderator or admin) may delete any status, not only through a moderation report. | README.md `## Posting` ("Delete your own statuses at any time") states the self-delete case; the staff-can-delete-any-status case is not documented under Posting | `STATED` (self-delete); `DERIVED` (staff delete-any, 0.85) |
| BR-014 | Deleting a status also deletes (soft-deletes) every boost of it. | `minidon/statuses/service.py:142-150` | `DERIVED` (0.9) |
| BR-015 | Deletion is a soft delete (`deleted_at` set); a deleted status is invisible to every viewer thereafter. | `minidon/statuses/service.py:131-150,25-26` | `DERIVED` (0.9) |
| BR-016 | Only public and unlisted statuses can be boosted; followers-only and direct statuses cannot be boosted even by a viewer who can see them. | `minidon/statuses/service.py:21,165-166` | `DERIVED` (0.85) - narrower than README's "Boost any status you can see," see Open Questions |
| BR-017 | A status can be boosted by a given account only once; a second attempt returns a conflict. | `minidon/statuses/service.py:167-168`, confirmed by `tests/test_statuses.py::test_a_status_can_only_be_boosted_once` | `DERIVED` (0.9) |
| BR-018 | Boosting or favouriting a boost acts on the original status, not the boost row itself. | `minidon/statuses/service.py:276-283` | `DERIVED` (0.85) |
| BR-019 | Favouriting is idempotent (favouriting an already-favourited status does not create a second favourite or double the count). | README.md `## Interacting`: "Favourite a status to show appreciation." (states the feature, not idempotency); `minidon/statuses/service.py:192-211` | `STATED` (feature); `DERIVED` (idempotency, 0.9) |
| BR-020 | Posting original statuses is rate-limited to 30 per rolling hour per account; boosts do not count against this limit. | `minidon/config.py:16`; `minidon/statuses/service.py:233-244`, confirmed by `tests/test_statuses.py::test_posting_is_rate_limited` | `DERIVED` (0.9) - not documented anywhere in README.md |

## Technical Context

### Components
| Component | Repository | Purpose |
|-----------|------------|---------|
| `minidon/statuses/models.py` | minidon | `Visibility` enum, `Status`, `Favourite`, `Mention`, `StatusTag` ORM models |
| `minidon/statuses/service.py` | minidon | `can_view`, create/edit/delete, reblog/unreblog, favourite/unfavourite, mention/tag parsing, rate limiting |
| `minidon/statuses/routes.py` | minidon | Statuses' HTTP endpoints |
| `minidon/statuses/schemas.py` | minidon | `StatusOut` response shape and `serialize_status`, including recursive boost serialization |

### Dependencies
- **Upstream:** `L1-accounts` (`get_by_username`, `find_by_username` for mention resolution),
  `L1-following` (`is_following`, `is_blocked_between` via `minidon/social/queries.py` for
  visibility checks).
- **Downstream:** `L1-timelines` (`can_view` is called directly by every timeline query -
  graph-report cluster "statuses/service.py is central to the statuses/timelines cluster"),
  `L1-notifications` (Posting calls `notify()` for mentions, replies, boosts and favourites),
  `L1-moderation` (`resolve_report`'s delete-status action calls `soft_delete` directly -
  domain-map.md Boundary Question 4).

### Contracts
| Contract | Type | Location |
|----------|------|----------|
| `StatusOut` | Schema | `minidon/statuses/schemas.py:14-30` |
| `can_view(session, viewer, status) -> bool` | API (internal, in-process) | `minidon/statuses/service.py:24-51` - consumed directly by Timelines and Notifications |
| `soft_delete(session, status)` | API (internal, in-process) | `minidon/statuses/service.py:142-150` - consumed directly by Moderation |

## Behavioural Specification

### Invariants
| ID | Invariant | Enforcement |
|----|-----------|-------------|
| INV-001 | A `Status` with `reblog_of_id` set always points at an existing or soft-deleted original; acting on it (edit, reply, further boost, favourite) resolves to the original where the business rule requires it. | `minidon/statuses/service.py:276-283` (`_resolve_boost`) |
| INV-002 | A soft-deleted status (`deleted_at` set) is unconditionally excluded from `can_view`, independent of visibility level. | `minidon/statuses/service.py:25-26` |

### State Transitions
```
Status.deleted_at: None -> <timestamp>         (delete_status / soft_delete; cascades to boosts)
Status.edited_at: None -> <timestamp>          (edit_status, within edit window, see BR-009/010)
Status(boost).deleted_at: None -> <timestamp>  (unreblog)
Favourite: (none) -> exists                    (favourite, idempotent)
Favourite: exists -> (deleted)                 (unfavourite)
```

### Edge Cases
| Scenario | Expected Behaviour | Test Reference |
|----------|--------------------|-----------------|
| Post with a content warning that pushes total length over 500 | `422 Invalid` | `tests/test_statuses.py::test_a_content_warning_counts_towards_the_length_limit` |
| View a followers-only status as a non-follower | `404 Not Found` | `tests/test_statuses.py::test_followers_only_statuses_are_hidden_from_everyone_else` |
| View a direct status as a non-mentioned account | `404 Not Found` | `tests/test_statuses.py::test_direct_statuses_are_visible_only_to_mentioned_accounts` |
| Edit after the window closes | `403 Forbidden` | `tests/test_statuses.py::test_editing_after_the_window_closes_is_refused` |
| Delete a status that has been boosted | Boosts are soft-deleted too, so viewing the boost returns 404 | `tests/test_statuses.py::test_deleting_a_status_removes_its_boosts` |
| Boost a followers-only status | `403 Forbidden` | `tests/test_statuses.py::test_followers_only_statuses_cannot_be_boosted` |
| Boost the same status twice | `409 Conflict` on the second attempt | `tests/test_statuses.py::test_a_status_can_only_be_boosted_once` |
| Post 31 statuses within an hour | The 31st is `429 Too Many Requests` | `tests/test_statuses.py::test_posting_is_rate_limited` |

## Integration Points

### APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/statuses` | POST | Create a status |
| `/api/v1/statuses/{id}` | GET | View a status |
| `/api/v1/statuses/{id}` | PATCH | Edit a status (within the edit window) |
| `/api/v1/statuses/{id}` | DELETE | Delete a status |
| `/api/v1/statuses/{id}/replies` | GET | List replies to a status |
| `/api/v1/statuses/{id}/reblog` | POST | Boost a status |
| `/api/v1/statuses/{id}/unreblog` | POST | Undo a boost |
| `/api/v1/statuses/{id}/favourite` | POST | Favourite a status |
| `/api/v1/statuses/{id}/unfavourite` | POST | Undo a favourite |

### Events
_(none - in-process calls only; Posting calls `L1-notifications#notify` directly for mentions, replies, boosts and favourites)_

## Open Questions

- [ ] **BA / Product (high priority):** README.md states the edit window is **30 minutes**
  (`## Posting`); the code's `edit_window_minutes` setting defaults to **60 minutes**
  (`minidon/config.py:15`), confirmed by a test that specifically uses a 61-minute offset to
  trigger the rejection. This is a direct STATED-vs-code conflict. Which value is correct -
  should the documentation or the code change? Recorded here per I-05, not resolved by this
  document.
- [ ] **BA / Product:** BR-016 (only public/unlisted statuses can be boosted) is narrower
  than README's "Boost any status you can see to share it with your followers," which does
  not mention a visibility restriction. Confirm whether followers-only/direct statuses
  should remain un-boostable, or whether the documentation should be updated to describe
  this restriction.
- [ ] **BA / Product:** BR-013's staff-delete-any-status path is reachable directly via
  `DELETE /statuses/{id}` by any staff member, not only through Moderation's report-resolve
  flow. Confirm this is intended (vs. moderation deletions being expected to always go
  through a report).
- [ ] **BA / Product:** BR-020 (30 posts/hour rate limit) is undocumented anywhere in
  README.md. Confirm this is an intended, business-reviewed limit.

## Change History

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-10-30 | Initial capability document drafted from code-links.json, README.md and graph analysis for baseline BASELINE-2026-10-30. Edit-window conflict (BR-009/BR-010) identified and recorded without resolution, per I-05. | ba-agent |
