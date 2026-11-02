---
type: glossary
term: Boost
aliases: [Reblog, Reblogging]
capabilities: [L1-posting]
status: DERIVED
source: minidon/README.md ("Interacting" section) vs minidon/statuses/
---

# Boost

## Business term

"Boost" is the user-facing word (README, `## Interacting`) for resharing a status you can
see so that it also appears on your followers' home timelines.

## Code terms

The code never uses the word "boost". It uses **reblog** throughout:

- `minidon/statuses/models.py` - `Status.reblog_of_id` (self-referential FK: a boost is a
  `Status` row pointing at the original through this column; see the model docstring "A
  boost is a status that points at another one through reblog_of_id").
- `minidon/statuses/service.py` - functions `reblog()` and `unreblog()`, helpers
  `_resolve_boost()` / `_find_boost()`.
- `minidon/statuses/routes.py` - endpoints `POST /statuses/{id}/reblog`.
- `minidon/notifications/models.py` - `NotificationKind.REBLOG`.

## Why this matters

Anyone reading the code without the README would reasonably call this capability
"Reblogging"; anyone reading the README would call it "Boosting". Both names refer to the
same mechanism. Capability maps and future documents should say "boost (reblog in code)" on
first use per document to avoid the BA or a reviewer treating them as two features.

## Where it occurs

- `minidon/statuses/models.py:19-37` (Status.reblog_of_id)
- `minidon/statuses/service.py` (reblog, unreblog, _resolve_boost, _find_boost)
- `minidon/statuses/routes.py` (reblog, unreblog route handlers)
- `minidon/notifications/models.py:12-18` (NotificationKind.REBLOG)
- README.md `## Interacting`
