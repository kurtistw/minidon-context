# L1-moderation: Moderation

> **Level:** L1
> **Domain:** L0-minidon (Minidon Social Network)
> **Last Updated:** 2026-10-30T18:00:00Z
> **Baseline Version:** BASELINE-2026-10-30

## Summary

Moderation covers reporting accounts, a staff queue for resolving reports (dismiss, delete
the reported status, or suspend), account suspension/unsuspension, and role assignment.
`STATED` name from README.md `## Moderation`. It depends on both Accounts (roles,
suspension, identity) and Posting (reuses `soft_delete` directly for the delete-status
resolution - domain-map.md Boundary Question 4), and is the only capability gated by the
`Staff` dependency (see `.mw/notes/glossary/staff.md`: the README's "Moderators"/"Admins"
distinction is implemented in code as a `Role` enum and a `STAFF_ROLES` set).

## Business Context

### Purpose
Let any user report an account (optionally about one of its statuses); let moderators and
admins review open reports and resolve them; let suspension lock a problem account out of
the instance; let admins appoint moderators. `STATED` - README.md `## Moderation`.

### Stakeholders
| Role | Responsibility |
|------|----------------|
| End user (reporter) | Files a report against an account |
| Moderator (code: `Role.MODERATOR`) | Reviews and resolves reports; can suspend non-staff accounts |
| Admin (code: `Role.ADMIN`) | Everything a moderator can do, plus lift suspensions, change roles, and act against other staff |
| BA / Product | Owns the resolution actions and the moderator/admin authority split |

### Business Rules

| ID | Rule | Source | Confidence |
|----|------|--------|------------|
| BR-001 | Any user may report an account, optionally pointing at one of that account's statuses, with a category and comment. | README.md `## Moderation`: "Report an account, optionally pointing at one of its statuses."; `minidon/moderation/service.py:17-44`; `minidon/moderation/models.py:12-16` (`ReportCategory`) | `STATED` |
| BR-002 | A user cannot report themselves. | `minidon/moderation/service.py:26-27` | `DERIVED` (0.9) |
| BR-003 | A reported status must belong to the reported account; otherwise the report is rejected as invalid. | `minidon/moderation/service.py:30-33` | `DERIVED` (0.9) |
| BR-004 | Report comments are limited to 1000 characters. | `minidon/moderation/service.py:14,28-29` | `DERIVED` (0.9) - undocumented in README.md |
| BR-005 | Moderators review open reports and resolve them by dismissing, deleting the reported status, or suspending the account. | README.md `## Moderation`: "Moderators review open reports and dismiss them, delete the reported status or suspend the account."; `minidon/moderation/service.py:51-84`; `minidon/moderation/models.py:24-27` (`ModerationAction`) | `STATED` |
| BR-006 | A report can only be resolved once; resolving an already-closed report returns a conflict. | `minidon/moderation/service.py:61-62` | `DERIVED` (0.85) |
| BR-007 | The "delete status" resolution requires the report to reference a status; a report with no linked status cannot be resolved this way. | `minidon/moderation/service.py:67-70` | `DERIVED` (0.85) |
| BR-008 | Resolving a report always records who resolved it, when, the action taken, and an optional moderator note. | `minidon/moderation/service.py:79-83` | `DERIVED` (0.85) |
| BR-009 | Suspended accounts can no longer sign in. | README.md `## Moderation`: "Suspended accounts can no longer sign in."; enforced in `L1-accounts` (`minidon/accounts/service.py:69-70,86-87`) | `STATED` |
| BR-010 | Suspending an account immediately revokes all of its access tokens (signs it out everywhere) and hides the account and its statuses from everyone. | `minidon/moderation/service.py:132-136`; `minidon/accounts/service.py:96-110` (lookup hiding); `minidon/statuses/service.py:27-28` (`can_view` hides a suspended author's statuses) | `DERIVED` (0.85) - the "signs out everywhere" and "hides statuses" mechanics are undocumented |
| BR-011 | A moderator cannot suspend themselves, cannot suspend an admin, and cannot suspend another staff member (moderator or admin) unless they are themselves an admin. | `minidon/moderation/service.py:122-129` | `DERIVED` (0.85) - the staff-protection rule refines README's undifferentiated "Moderators review open reports..." |
| BR-012 | Only admins can lift a suspension. | `minidon/moderation/service.py:95-97` | `DERIVED` (0.85) - undocumented in README.md |
| BR-013 | Only admins can change another account's role; an admin cannot change their own role. | README.md `## Moderation`: "Admins appoint moderators." (states the forward direction, not the self-change restriction); `minidon/moderation/service.py:104-110` | `STATED` (appointment authority); `DERIVED` (self-change restriction, 0.85) |
| BR-014 | Moderation's staff-only endpoints (list reports, resolve, suspend, unsuspend, role change) require the acting account to be a moderator or admin; filing a report is open to any signed-in user. | README.md `## Moderation`'s Moderator/Admin distinction; `minidon/deps.py:37-43` (`Staff`/`staff_account`) | `STATED` (two-tier distinction); `DERIVED` (gating mechanism) |
| BR-015 | Moderation's "delete reported status" action calls Posting's `soft_delete` directly, so it inherits Posting's cascading boost-deletion behaviour even though Moderation documents only "delete the reported status." | `minidon/moderation/service.py:71`; cross-reference `L1-posting` BR-014 | `DERIVED` (0.8) - see domain-map.md Boundary Question 4 |

## Technical Context

### Components
| Component | Repository | Purpose |
|-----------|------------|---------|
| `minidon/moderation/models.py` | minidon | `ReportCategory`, `ReportState`, `ModerationAction` enums; `Report` ORM model |
| `minidon/moderation/service.py` | minidon | `file_report`, `list_reports`, `resolve_report`, `suspend`, `unsuspend`, `set_role` |
| `minidon/moderation/routes.py` | minidon | Moderation's HTTP endpoints, all staff-gated except filing a report |

### Dependencies
- **Upstream:** `L1-accounts` (`Role`, suspension fields, `revoke_tokens`, `find_by_username`),
  `L1-posting` (`soft_delete`, `Status` model - domain-map.md Boundary Question 4).
- **Downstream:** None directly, but Moderation's suspension action changes behaviour
  observed in `L1-accounts` (sign-in is refused) and `L1-posting` (the account's statuses
  become invisible via `can_view`).

### Contracts
| Contract | Type | Location |
|----------|------|----------|
| `ReportOut` | Schema | `minidon/moderation/routes.py:34-46` |
| `Staff` dependency | API (internal, in-process) | `minidon/deps.py:37-43` - gates every Moderation route except `file_report` |

## Behavioural Specification

### Invariants
| ID | Invariant | Enforcement |
|----|-----------|-------------|
| INV-001 | A `Report` only ever transitions `open -> resolved` or `open -> dismissed`, never back to `open`, and never out of a closed state. | `minidon/moderation/service.py:61-62` |
| INV-002 | No account with `Role.ADMIN` can ever be suspended, by anyone. | `minidon/moderation/service.py:125-126` |
| INV-003 | Only an admin can change role or lift a suspension; a moderator never can. | `minidon/moderation/service.py:95-97,104-106` |

### State Transitions
```
Report.state: open -> dismissed          (resolve_report, action=dismiss)
Report.state: open -> resolved           (resolve_report, action=delete_status or suspend)
Account.suspended_at: None -> <ts>       (suspend, or resolve_report action=suspend)
Account.suspended_at: <ts> -> None       (unsuspend, admin only)
Account.role: user -> moderator -> admin (set_role, admin only; never a target's own role)
```

### Edge Cases
| Scenario | Expected Behaviour | Test Reference |
|----------|--------------------|-----------------|
| Suspend an account via report resolution | Account's profile becomes `404`, its statuses `404`, it is signed out, and sign-in afterwards returns `403` | `tests/test_moderation.py::test_suspending_through_a_report_hides_the_account` |
| Delete a reported status via resolution | Status becomes `404`; the account itself remains visible | `tests/test_moderation.py::test_deleting_the_reported_status_keeps_the_account` |
| Resolve an already-closed report | `409 Conflict` | `tests/test_moderation.py::test_a_report_closes_once` |
| Report a status that belongs to someone else | `422 Invalid` | `tests/test_moderation.py::test_reported_statuses_must_belong_to_the_reported_account` |
| Report yourself | `422 Invalid` | `tests/test_moderation.py::test_you_cannot_report_yourself` |
| A regular user views the report queue | `403 Forbidden` | `tests/test_moderation.py::test_regular_users_cannot_see_reports` |
| A moderator tries to suspend another moderator or an admin | `403 Forbidden`; an admin can | `tests/test_moderation.py::test_moderators_cannot_suspend_other_staff` |
| A moderator tries to change someone's role | `403 Forbidden` | `tests/test_moderation.py::test_only_admins_change_roles` |
| A moderator tries to lift a suspension | `403 Forbidden`; an admin can | `tests/test_moderation.py::test_only_admins_lift_suspensions` |

## Integration Points

### APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/reports` | POST | File a report against an account |
| `/api/v1/admin/reports` | GET | List reports (staff only) |
| `/api/v1/admin/reports/{id}/resolve` | POST | Resolve a report (staff only) |
| `/api/v1/admin/accounts/{username}/suspend` | POST | Suspend an account (staff only) |
| `/api/v1/admin/accounts/{username}/unsuspend` | POST | Lift a suspension (admin only) |
| `/api/v1/admin/accounts/{username}/role` | PUT | Change an account's role (admin only) |

### Events
_(none - in-process calls only; Moderation calls `L1-accounts#revoke_tokens` and
`L1-posting#soft_delete` directly)_

## Open Questions

- [ ] **BA / Product:** BR-004 (1000-character report comment limit) is undocumented in
  README.md. Confirm this is the intended value.
- [ ] **BA / Product:** BR-010's "sign out everywhere" and "hide statuses" effects of
  suspension are not described in README.md beyond "can no longer sign in." Confirm the full
  scope of suspension's effects is as implemented.
- [ ] **BA / Product:** BR-011/BR-012 (moderator-vs-admin authority over staff accounts and
  over lifting suspensions) refine README's undifferentiated description of "Moderators" in
  a way that matters operationally. Confirm the staff hierarchy as implemented matches
  intended policy, especially that moderators have no suspend/unsuspend authority over each
  other.
- [ ] **BA / Product / Architecture:** BR-015 - Moderation's delete-status resolution calls
  Posting's `soft_delete` directly rather than through a narrower moderation-facing API
  (domain-map.md Boundary Question 4). Worth a boundary decision if Posting's delete
  semantics ever change independently of Moderation's needs.

## Change History

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-10-30 | Initial capability document drafted from code-links.json, README.md and graph analysis for baseline BASELINE-2026-10-30. | ba-agent |
