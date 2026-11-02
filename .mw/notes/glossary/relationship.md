---
type: glossary
term: Relationship
aliases: [Follow status]
capabilities: [L1-following]
status: DERIVED
source: minidon/social/service.py (no business documentation found for this exact term)
---

# Relationship

## Code term

`minidon/social/service.py` defines a frozen dataclass `Relationship` with fields
`username`, `following`, `requested`, `followed_by`, `blocking`, `muting` - the full
follow/block/mute status between a viewer and a target account, returned by
`GET /accounts/{username}` (via `show_relationship` in `minidon/social/routes.py`).

## Business term

README does not name this concept explicitly; it only lists the individual states
("Follow and unfollow accounts", "Block an account", "Mute an account") without a name for
their combined view. "Relationship" is a reasonable business name (Mastodon's own API uses
the same term) but it is **DERIVED** here, not confirmed against project documentation.

## Why this matters

If the BA agent or a future document introduces its own name for "the five-field follow/
block/mute status between two accounts", check here first - the code already has one.

## Where it occurs

- `minidon/social/service.py:17-41` (Relationship dataclass, relationship() function)
- `minidon/social/routes.py` (show_relationship handler)
