# L1-timelines: Timelines

> **Level:** L1
> **Domain:** L0-minidon (Minidon Social Network)
> **Last Updated:** 2026-10-30T18:00:00Z
> **Baseline Version:** BASELINE-2026-10-30

## Summary

Timelines is a read-only capability: four feeds built entirely from queries over Posting's
`Status` table, filtered by Following's block/mute predicates and Posting's `can_view`
visibility function. `STATED` name from README.md `## Timelines`. It owns no data of its
own and has no internal grouping worth naming at L2 (domain-map.md "Hierarchy depth").

## Business Context

### Purpose
Give each reader four different views of the statuses they are allowed to see: their home
feed, the server's public feed, one account's statuses, and everything tagged with a given
hashtag. `STATED` - README.md `## Timelines`.

### Stakeholders
| Role | Responsibility |
|------|----------------|
| End user | Reads any of the four timelines |
| BA / Product | Owns feed composition and pagination rules |

### Business Rules

| ID | Rule | Source | Confidence |
|----|------|--------|------------|
| BR-001 | The home timeline shows the viewer's own statuses and the statuses of everyone they follow. | README.md `## Timelines`: "Home - your statuses and those of everyone you follow."; `minidon/timelines/service.py:18-39` | `STATED` |
| BR-002 | The home timeline excludes statuses, and boosts of statuses, from accounts the viewer mutes. | `minidon/timelines/service.py:22-29,38` | `DERIVED` (0.85) |
| BR-003 | The home timeline hides a reply unless the viewer also follows (or is) the account being replied to. | `minidon/timelines/service.py:31-35` | `DERIVED` (0.85) |
| BR-004 | The public timeline shows every public, original (non-boost) status on the instance, excluding authors the viewer mutes or has a block with. | README.md `## Timelines`: "Public - every public status on the server."; `minidon/timelines/service.py:42-55` | `STATED` (feature); `DERIVED` (original-only and hidden-author exclusions) |
| BR-005 | The profile timeline shows one account's statuses, including its boosts, filtered to what the viewer is allowed to see. | README.md `## Timelines`: "Profile - one account's statuses."; `minidon/timelines/service.py:58-69` | `STATED` |
| BR-006 | The hashtag timeline shows every public status carrying a given tag (case-insensitive, `#` prefix optional), excluding authors the viewer mutes or has a block with. | README.md `## Timelines`: "Hashtag - every public status with a given tag."; `minidon/timelines/service.py:72-90` | `STATED` (feature); `DERIVED` (case-folding, hidden-author exclusion) |
| BR-007 | Every timeline is paginated newest-first by descending status ID, with a default page size of 20 and a maximum of 40, using `max_id` as a "older than this ID" cursor. | `minidon/timelines/service.py:14-15,100-118`; `minidon/timelines/routes.py:14` | `DERIVED` (0.9) - not documented in README.md |
| BR-008 | Every status is re-checked against Posting's visibility rules (`can_view`) when a timeline is built, so a status that becomes invisible to a viewer (deletion, suspension, a new block) disappears from their feeds without any timeline-specific filter. | `minidon/timelines/service.py:114` | `DERIVED` (0.85) - cross-reference to `L1-posting` BR-005 |

## Technical Context

### Components
| Component | Repository | Purpose |
|-----------|------------|---------|
| `minidon/timelines/service.py` | minidon | `home`, `public`, `account`, `hashtag` queries; shared `_page`/`_hidden_authors` helpers |
| `minidon/timelines/routes.py` | minidon | Timelines' HTTP endpoints |

### Dependencies
- **Upstream:** `L1-accounts` (`get_by_username` for the profile timeline),
  `L1-following` (`following_ids`, `muted_ids`, `blocked_ids` from `minidon/social/queries.py`),
  `L1-posting` (`Status`/`StatusTag` models, `can_view`).
- **Downstream:** None - Timelines is a terminal, read-only capability; no other capability
  depends on it.

### Contracts
| Contract | Type | Location |
|----------|------|----------|
| Timeline responses (`list[StatusOut]`) | Schema | Reuses `L1-posting`'s `minidon/statuses/schemas.py#StatusOut` |

## Behavioural Specification

### Invariants
| ID | Invariant | Enforcement |
|----|-----------|-------------|
| INV-001 | A status that fails `can_view` for a given viewer never appears in any of that viewer's four timelines, regardless of any other filter having already passed. | `minidon/timelines/service.py:114` (`can_view` is the last check in `_page`, applied unconditionally) |
| INV-002 | No timeline response exceeds `MAX_LIMIT` (40) statuses. | `minidon/timelines/routes.py:14` (`Query(ge=1, le=MAX_LIMIT)` on the `limit` parameter) |

### State Transitions
_(none - Timelines holds no state of its own; it is a pure read-model over Posting's data)_

### Edge Cases
| Scenario | Expected Behaviour | Test Reference |
|----------|--------------------|-----------------|
| Home timeline with a muted followee who boosted a status | Both the followee's own statuses and their boosts are hidden | `tests/test_timelines.py::test_home_hides_muted_accounts_and_their_boosted_statuses` |
| Home timeline with a reply to someone you don't follow | Reply is hidden even though the replier is followed | `tests/test_timelines.py::test_home_hides_replies_to_accounts_you_do_not_follow` |
| Public timeline includes a boost | Boost is excluded; only the original, if public, appears | `tests/test_timelines.py::test_public_shows_only_public_original_statuses` |
| Hashtag search for a private status with the same tag | Excluded; only public matches appear | `tests/test_timelines.py::test_hashtag_timeline` |
| Profile timeline viewed by a non-follower vs. a follower | Non-follower sees only public statuses; a follower also sees followers-only ones | `tests/test_timelines.py::test_profile_timeline_respects_visibility` |
| Paginating with `max_id` | Second page starts strictly before the given ID | `tests/test_timelines.py::test_timelines_page_with_max_id` |

## Integration Points

### APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/timelines/home` | GET | Your statuses and those of everyone you follow |
| `/api/v1/timelines/public` | GET | Every public status on the server |
| `/api/v1/timelines/tag/{tag}` | GET | Every public status with a given hashtag |
| `/api/v1/accounts/{username}/statuses` | GET | One account's statuses |

### Events
_(none - Timelines is read-only and issues no writes or notifications)_

## Open Questions

- [ ] **BA / Product:** BR-007's pagination defaults (20/40) are undocumented in README.md.
  Confirm these are the intended product values and whether clients should be able to
  request more than 40.

## Change History

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-10-30 | Initial capability document drafted from code-links.json, README.md and graph analysis for baseline BASELINE-2026-10-30. | ba-agent |
