---
type: glossary
term: Staff
aliases: [Moderator, Admin, Moderators and admins]
capabilities: [L1-moderation, L1-accounts]
status: DERIVED
source: minidon/README.md ("Moderation" section) vs minidon/accounts/models.py and minidon/deps.py
---

# Staff

## Business term

README (`## Moderation`) distinguishes two business roles by name: **"Moderators"** (review
reports, dismiss/delete/suspend) and **"Admins"** (appoint moderators, i.e. change roles).
It never uses the collective word "staff".

## Code terms

- `minidon/accounts/models.py` - `Role` enum: `USER`, `MODERATOR`, `ADMIN`; and
  `STAFF_ROLES = frozenset({Role.MODERATOR, Role.ADMIN})`, with `Account.is_staff` as a
  property checking membership.
- `minidon/deps.py` - the FastAPI dependency alias is named `Staff` (`staff_account`),
  gating every moderation-only route in `minidon/moderation/routes.py`.
- `minidon/moderation/service.py#_check_can_suspend` and `#set_role` additionally
  distinguish MODERATOR from ADMIN inside the "staff" umbrella (moderators cannot suspend
  other staff; only admins change roles) - the README's two-tier distinction is preserved in
  code, just under the umbrella term "staff".

## Why this matters

"Staff" is purely a code/implementation grouping (used for the auth dependency and the role
set), not a term end users or the README ever see. Business-facing documents should keep
saying "Moderators" and "Admins"; "Staff" should only appear when describing the
authorization mechanism itself.

## Where it occurs

- `minidon/accounts/models.py:12-18` (Role enum, STAFF_ROLES, is_staff property)
- `minidon/deps.py` (Staff, staff_account)
- `minidon/moderation/service.py` (_check_can_suspend, set_role)
- README.md `## Moderation`
