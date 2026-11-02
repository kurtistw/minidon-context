# L1-notifications: Notifications

> **Level:** L1
> **Domain:** L0-minidon (Minidon Social Network)
> **Last Updated:** 2026-10-30T18:00:00Z
> **Baseline Version:** BASELINE-2026-10-30

## Summary

Notifications records and delivers alerts for the six interaction kinds README names (follow,
follow request, mention, reply, boost, favourite), and owns the read/unread state. `STATED`
name from README.md `## Notifications`. It is a fan-in point: `notify()` is called directly
from both Following and Posting, and Notifications itself applies suppression rules (no
self-notify, no notify across a block, no notify while muted) that neither README nor the
calling capabilities document. It has no internal grouping worth naming at L2
(domain-map.md "Hierarchy depth").

## Business Context

### Purpose
Tell an account when someone follows them, asks to follow them, mentions them, replies to
them, boosts their status, or favourites it; let them mark notifications read one at a time
or all at once. `STATED` - README.md `## Notifications`.

### Stakeholders
| Role | Responsibility |
|------|----------------|
| End user | Receives notifications; marks them read |
| BA / Product | Owns which interactions notify and which are suppressed |

### Business Rules

| ID | Rule | Source | Confidence |
|----|------|--------|------------|
| BR-001 | Recipients are notified of: new followers, follow requests, mentions, replies, boosts and favourites. | README.md `## Notifications`: "Get notified when someone follows you, asks to follow you, mentions you, replies to you, boosts your status or favourites it."; `minidon/notifications/models.py:12-18` (`NotificationKind`); call sites in `minidon/social/service.py` and `minidon/statuses/service.py` | `STATED` |
| BR-002 | A user is never notified about their own actions. | `minidon/notifications/service.py:30-31` | `DERIVED` (0.9) |
| BR-003 | No notification is created between two accounts that have a block between them, in either direction. | `minidon/notifications/service.py:32-33` | `DERIVED` (0.9) |
| BR-004 | No notification is created when the recipient is muting the actor. | `minidon/notifications/service.py:34-35` | `DERIVED` (0.9) |
| BR-005 | Notifications can be marked read one at a time or all at once. | README.md `## Notifications`: "Mark notifications as read one at a time or all at once."; `minidon/notifications/service.py:77-93` | `STATED` |
| BR-006 | A user can only mark their own notifications as read; attempting to act on someone else's notification fails as not-found. | `minidon/notifications/service.py:77-80` | `DERIVED` (0.85) |
| BR-007 | Marking an already-read notification as read again is a no-op (it does not change `read_at` or trigger an extra write). | `minidon/notifications/service.py:81-84` | `DERIVED` (0.8) |
| BR-008 | The notification list and the unread count exclude any notification whose actor is currently suspended. | `minidon/notifications/service.py:49-58,61-73` | `DERIVED` (0.85) - undocumented in README.md |
| BR-009 | Listing notifications returns at most 40 by default and accepts a client-requested limit of up to 80; the list can be filtered to unread-only. | `minidon/notifications/routes.py:55`; `minidon/notifications/service.py:46-48` | `DERIVED` (0.85) - undocumented in README.md |

## Technical Context

### Components
| Component | Repository | Purpose |
|-----------|------------|---------|
| `minidon/notifications/models.py` | minidon | `NotificationKind` enum, `Notification` ORM model |
| `minidon/notifications/service.py` | minidon | `notify` (creation + suppression), `list_notifications`, `unread_count`, `mark_read`, `mark_all_read` |
| `minidon/notifications/routes.py` | minidon | Notifications' HTTP endpoints; also serializes the linked status (if any) through `can_view`-gated visibility |

### Dependencies
- **Upstream:** `L1-accounts` (identity for recipient/actor), `L1-following` (block/mute
  predicates via `minidon/social/queries.py`), `L1-posting` (links a status to a notification
  where relevant, and gates whether that status is shown back to the recipient via `can_view`).
- **Downstream:** `L1-following` and `L1-posting` are the *producers* that call
  `notify()` - `minidon/social/service.py#follow` (follow/follow-request) and
  `minidon/statuses/service.py` (mention, reply, reblog, favourite). Notifications itself has
  no downstream consumers; it is a fan-in terminal for events, read only by the end user.
  (See domain-map.md Cross-Cutting Concerns: "Notification fan-in.")

### Contracts
| Contract | Type | Location |
|----------|------|----------|
| `notify(session, *, recipient, actor, kind, status=None)` | API (internal, in-process) | `minidon/notifications/service.py:18-43` - called from two other capabilities |
| `NotificationOut` | Schema | `minidon/notifications/routes.py:21-27` |

## Behavioural Specification

### Invariants
| ID | Invariant | Enforcement |
|----|-----------|-------------|
| INV-001 | No `Notification` row is ever created where `recipient_id == actor_id`. | `minidon/notifications/service.py:30-31` |
| INV-002 | A notification is only ever readable (list, unread count, mark-read) by its own recipient. | `minidon/notifications/service.py:49-58,77-80` |

### State Transitions
```
Notification.read_at: None -> <timestamp>   (mark_read, by recipient only; idempotent)
Notification.read_at: None -> <timestamp>   (mark_all_read, bulk, by recipient)
```

### Edge Cases
| Scenario | Expected Behaviour | Test Reference |
|----------|--------------------|-----------------|
| Favouriting/boosting/replying to/mentioning yourself | No notification created | `tests/test_notifications.py::test_you_are_not_notified_about_your_own_actions` |
| Mentioning an account that mutes you | No notification created | `tests/test_notifications.py::test_muted_accounts_do_not_notify_you` |
| Multiple interaction kinds on one status | Each produces its own notification, newest first | `tests/test_notifications.py::test_interactions_notify_the_author` |
| Following a locked account | Produces a `follow_request` notification, not `follow` | `tests/test_notifications.py::test_locked_accounts_are_notified_of_follow_requests` |
| Reading someone else's notification | `404 Not Found` | `tests/test_notifications.py::test_you_cannot_read_someone_elses_notifications` |
| Mark one read, then mark all read | Unread count drops to 1, then to 0 | `tests/test_notifications.py::test_marking_notifications_read` |

## Integration Points

### APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/notifications` | GET | List notifications (optionally unread-only) |
| `/api/v1/notifications/unread_count` | GET | Unread notification count |
| `/api/v1/notifications/read_all` | POST | Mark all notifications read |
| `/api/v1/notifications/{id}/read` | POST | Mark one notification read |

### Events
_(none - in-process calls only; Notifications is called by `L1-following`'s `follow()` and
`L1-posting`'s create/reblog/favourite paths; it calls nothing onward itself)_

## Open Questions

- [ ] **BA / Product:** BR-002/BR-003/BR-004 (self-notification, block, and mute suppression)
  are not documented anywhere in README.md. Confirm these three suppression rules match
  intended product behaviour, since they are easy to silently break when adding a new
  notification kind.
- [ ] **BA / Product:** BR-009's numeric limits (40 default / 80 max) are undocumented.
  Confirm these are the intended values.

## Change History

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-10-30 | Initial capability document drafted from code-links.json, README.md and graph analysis for baseline BASELINE-2026-10-30. | ba-agent |
