---
type: glossary
term: Followers only
aliases: [Private visibility]
capabilities: [L1-posting]
status: DERIVED
source: minidon/README.md ("Posting" section) vs minidon/statuses/models.py
---

# Followers only

## Business term

README (`## Posting`) lists four visibility levels a status can have, one of them named
**"Followers only"** - visible only to the author's followers.

## Code term

`minidon/statuses/models.py` names the same level `Visibility.PRIVATE`:

```
PUBLIC = "public"      # everyone, and the public timeline
UNLISTED = "unlisted"  # everyone, but kept off the public timeline
PRIVATE = "private"    # followers only
DIRECT = "direct"      # mentioned accounts only
```

## Why this matters

"Private" is overloaded in most systems (private account, private message, private key).
Here it specifically means "followers only", not "only visible to the author" or "DM-like".
Use "followers-only" in business-facing documents and note `Visibility.PRIVATE` as the code
value on first use, so a reader does not assume a stricter meaning than the code implements.

## Where it occurs

- `minidon/statuses/models.py:12-16` (Visibility enum)
- `minidon/statuses/service.py` (`can_view`, `_validate_text` - visibility checks)
- `minidon/timelines/service.py` (`_hidden_authors`, home/public/account timeline filters)
- README.md `## Posting`
