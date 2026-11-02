---
type: glossary
term: Locked account
aliases: [Approval-required account]
capabilities: [L1-accounts, L1-following]
status: DERIVED
source: minidon/README.md ("Accounts" section) vs minidon/accounts/models.py and minidon/social/service.py
---

# Locked account

## Business term

README (`## Accounts`): "**Locked accounts** approve each new follower by hand."

## Code term

`minidon/accounts/models.py` - `Account.locked: Mapped[bool]` (default `False`). The field
lives on the `Account` model (owned by the Accounts capability), but the behaviour it
triggers - turning a follow into a pending follow request - is implemented in
`minidon/social/service.py#follow`:

```python
accepted = not target.locked
```

## Why this matters

This is a cross-capability field: the data lives in Accounts, the business rule it drives
lives in Following. A reader looking only at `minidon/social/` for "locked account" logic
will find the behaviour but not the field definition, and vice versa. Flagged here as a
glossary cross-reference; the underlying business rule itself (accepted/pending follow
request semantics) is for the BA agent to formalise with provenance, not this map.

## Where it occurs

- `minidon/accounts/models.py:30` (Account.locked field)
- `minidon/social/service.py` (`follow()` - accepted/pending branch; `follow_requests()` -
  lists pending requests created because the target was locked)
- README.md `## Accounts`
