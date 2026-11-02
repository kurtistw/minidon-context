---
type: glossary
term: Following
aliases: [Social graph, Relationships]
capabilities: [L1-following]
status: DERIVED
source: minidon/README.md ("Following" section) vs minidon/social/ package name
---

# Following

## Business term

README groups follow/unfollow, follow requests, block and mute under one feature heading,
**"Following"** (`## Following`).

## Code term

The code package is named `minidon/social/`, not `minidon/following/`. There is no code
module literally named "following" at the package level - it is a function name
(`social/service.py#following`) and a table name (`Follow`), not the package name.

## Why this matters

A code-first reader would look for a "Following" capability and find nothing at package
granularity; a documentation-first reader would look for "social" and not find it in the
README. This capability map uses the business name **Following** for the L1 capability and
records `minidon/social/` as its code location, so both directions resolve.

## Where it occurs

- `minidon/social/models.py` (Follow, Block, Mute tables)
- `minidon/social/queries.py` (is_following, following_ids, count_following, ...)
- `minidon/social/service.py` (follow, unfollow, follow_requests, authorize_request,
  reject_request, block, unblock, mute, unmute, followers, following)
- `minidon/social/routes.py` (follow/unfollow/block/unblock/mute/unmute endpoints)
- README.md `## Following`
