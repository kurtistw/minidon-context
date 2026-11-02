# L1-following: Following

> **Level:** L1
> **Domain:** L0-minidon (Minidon Social Network)
> **Last Updated:** 2026-10-30T18:00:00Z
> **Baseline Version:** BASELINE-2026-10-30

## Summary

Following covers the social graph: follow/unfollow, follow requests for locked accounts,
block and mute. `STATED` name from README.md `## Following`; the code package is named
`minidon/social/` (see `.mw/notes/glossary/following.md`). Following also owns the shared
read-only predicate layer (`minidon/social/queries.py`) that Accounts, Posting, Timelines
and Notifications all call to answer "does A follow/block/mute B?" without importing each
other's write paths.

## Business Context

### Purpose
Let people build and curate who they see and who sees them: follow accounts (with an
approval step for locked accounts), unfollow, block accounts that should not be able to
follow or view them, and mute accounts silently. `STATED` - README.md `## Following`.

### Stakeholders
| Role | Responsibility |
|------|----------------|
| End user | Follows/unfollows, blocks, mutes; approves or rejects follow requests on a locked account |
| Locked-account owner | Reviews and approves/rejects incoming follow requests |
| BA / Product | Owns the social-graph rules, especially block/mute side effects |

### Business Rules

| ID | Rule | Source | Confidence |
|----|------|--------|------------|
| BR-001 | Following an open (not locked) account takes effect immediately. | README.md `## Following`; `minidon/social/service.py:44,54-55` | `STATED` |
| BR-002 | Following a locked account creates a pending follow request instead, which the owner can authorize or reject. | README.md `## Following`: "Following a locked account sends a follow request, which its owner can accept or reject."; `minidon/social/service.py:44-63,91-108` | `STATED` |
| BR-003 | A user cannot follow themselves. | `minidon/social/service.py:46-47` | `DERIVED` (0.9) |
| BR-004 | A user cannot follow an account involved in a block with them, in either direction. | `minidon/social/service.py:48-49`; `minidon/social/queries.py:25-37` | `DERIVED` (0.9) |
| BR-005 | Following an account you already follow, or already have a pending request to, is a no-op (not a duplicate or an error). | `minidon/social/service.py:50-51` | `DERIVED` (0.85) |
| BR-006 | Unfollowing removes the follow relationship or withdraws a pending follow request, regardless of its acceptance state. | `minidon/social/service.py:66-73` | `DERIVED` (0.85) |
| BR-007 | Blocking an account immediately removes any existing follow relationship between the two accounts, in both directions. | `minidon/social/service.py:120-131` | `DERIVED` (0.9) |
| BR-008 | A user cannot block themselves. | `minidon/social/service.py:113-114` | `DERIVED` (0.9) |
| BR-009 | Blocking an already-blocked account is a no-op, not an error. | `minidon/social/service.py:115-118` | `DERIVED` (0.85) |
| BR-010 | A blocked account can no longer follow you or see your statuses. | README.md `## Following`: "Block an account so that it can no longer follow you or see your statuses."; `minidon/social/service.py:48-49` (follow-time check), `minidon/statuses/service.py:38` (visibility check) | `STATED` |
| BR-011 | Muting an account hides its statuses from your timeline without the muted account being told. | README.md `## Following`: "Mute an account to stop seeing its statuses without it knowing."; `minidon/timelines/service.py` (uses `muted_ids`); no route exposes mute state to the muted party | `STATED` |
| BR-012 | A user cannot mute themselves. | `minidon/social/service.py:145-146` | `DERIVED` (0.9) |
| BR-013 | Muting an already-muted account is a no-op. | `minidon/social/service.py:147-150` | `DERIVED` (0.85) |
| BR-014 | Followers/following lists and the follow-requests list only include accepted (or, for requests, pending) relationships with accounts that are not suspended. | `minidon/social/service.py:76-88,160-181` | `DERIVED` (0.85) |
| BR-015 | The combined follow/block/mute status between a viewer and a target ("Relationship") has five parts: following, requested, followed_by, blocking, muting. | `minidon/social/service.py:17-41` - see `.mw/notes/glossary/relationship.md` | `DERIVED` (0.8) |

## Technical Context

### Components
| Component | Repository | Purpose |
|-----------|------------|---------|
| `minidon/social/models.py` | minidon | `Follow` (doubles as pending request), `Block`, `Mute` ORM models |
| `minidon/social/queries.py` | minidon | Shared read-only predicates: `is_following`, `is_blocked_between`, `is_muting`, `following_ids`, `muted_ids`, `blocked_ids`, counts |
| `minidon/social/service.py` | minidon | Follow/unfollow, follow-request authorize/reject, block/unblock, mute/unmute, followers/following lists, `Relationship` |
| `minidon/social/routes.py` | minidon | Following's HTTP endpoints |

### Dependencies
- **Upstream:** `L1-accounts` (identity resolution via `get_by_username`; the `locked` field
  lives on `Account`).
- **Downstream:** `L1-accounts` (`AccountOut.followers_count`/`following_count`),
  `L1-posting` (visibility/boost checks call `is_blocked_between`/`is_following`),
  `L1-timelines` (feed filtering calls `following_ids`/`muted_ids`/`blocked_ids`),
  `L1-notifications` (suppresses notifications between blocking/muting accounts), all consume
  `minidon/social/queries.py` directly (graph-report cluster note: "most reused cross-cutting
  module after accounts.service").

### Contracts
| Contract | Type | Location |
|----------|------|----------|
| `Relationship` | Schema | `minidon/social/service.py:17-26` |
| `minidon/social/queries.py` predicate layer | API (internal, in-process) | `minidon/social/queries.py` - see domain-map.md Boundary Question 1 |

## Behavioural Specification

### Invariants
| ID | Invariant | Enforcement |
|----|-----------|-------------|
| INV-001 | Two accounts can never both have an active block pointing in opposite directions produce different "is blocked" answers - a block is symmetric for every purpose this app checks. | `minidon/social/queries.py:25-37` (`is_blocked_between` checks both directions with `or_`) |
| INV-002 | A `Follow` row with `accepted=False` is a pending request, never a live follow, for every reader of the table (counts, feeds, followers lists). | `minidon/social/queries.py:12-22,47-52,66-84`; `minidon/social/service.py:160-181` all filter on `Follow.accepted` |

### State Transitions
```
Follow: (none) -> pending (accepted=False)   [target.locked == True]
Follow: (none) -> accepted (accepted=True)   [target.locked == False]
Follow: pending -> accepted                   [authorize_request, by target]
Follow: pending -> (deleted)                  [reject_request, by target; or unfollow, by follower]
Follow: accepted -> (deleted)                 [unfollow, by follower; or block, either direction]
Block: (none) -> active                       [block]
Block: active -> (deleted)                    [unblock]
Mute: (none) -> active                        [mute]
Mute: active -> (deleted)                     [unmute]
```

### Edge Cases
| Scenario | Expected Behaviour | Test Reference |
|----------|--------------------|-----------------|
| Follow a locked account | Creates a pending request, not an immediate follow | `tests/test_social.py::test_following_a_locked_account_sends_a_request` |
| Reject a pending follow request | Request is deleted; `following`/`requested` both false | `tests/test_social.py::test_rejecting_a_follow_request` |
| Block an account you mutually follow | Both follow rows deleted; further follow attempts return 403 | `tests/test_social.py::test_blocking_removes_follows_both_ways` |
| Follow yourself | `422 Invalid` | `tests/test_social.py::test_you_cannot_follow_yourself` |
| List followers/following | Ordered by follow creation time, accepted only | `tests/test_social.py::test_followers_and_following_lists` |

## Integration Points

### APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/accounts/{username}/relationship` | GET | View the combined follow/block/mute status with a target |
| `/api/v1/accounts/{username}/follow` | POST | Follow (or request to follow) an account |
| `/api/v1/accounts/{username}/unfollow` | POST | Unfollow / withdraw a request |
| `/api/v1/accounts/{username}/block` | POST | Block an account |
| `/api/v1/accounts/{username}/unblock` | POST | Unblock an account |
| `/api/v1/accounts/{username}/mute` | POST | Mute an account |
| `/api/v1/accounts/{username}/unmute` | POST | Unmute an account |
| `/api/v1/accounts/{username}/followers` | GET | List an account's followers |
| `/api/v1/accounts/{username}/following` | GET | List who an account follows |
| `/api/v1/follow_requests` | GET | List your pending follow requests (locked accounts) |
| `/api/v1/follow_requests/{username}/authorize` | POST | Accept a pending follow request |
| `/api/v1/follow_requests/{username}/reject` | POST | Reject a pending follow request |

### Events
_(none - in-process calls only; `notify()` is called directly from `social/service.py#follow`, see `L1-notifications`)_

## Open Questions

- [ ] **BA / Product:** BR-007 (blocking retroactively deletes existing follows both ways)
  is not mentioned in README.md, which only describes blocking's effect on future follows
  and visibility. Confirm this retroactive cleanup is the intended business behaviour.
- [ ] **BA / Product / Domain modelling:** `minidon/social/queries.py` is a shared predicate
  module consumed by five of six capabilities (domain-map.md Boundary Question 1). Should it
  be formally documented as a stable cross-capability contract rather than an implicit
  shared import?
- [ ] **BA / Product:** "Relationship" (BR-015) has no name in README.md; confirm the business
  wants to adopt this term (also used by Mastodon's own public API) or prefers another.

## Change History

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-10-30 | Initial capability document drafted from code-links.json, README.md and graph analysis for baseline BASELINE-2026-10-30. | ba-agent |
