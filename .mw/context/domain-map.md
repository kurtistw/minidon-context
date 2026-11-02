# Domain Map

> **Baseline Version:** BASELINE-2026-10-30
> **Generated:** 2026-10-30T17:30:00Z
> **Repositories:** 1 (minidon)

## Overview

Minidon is a single-server, Mastodon-style social network: people sign up, post short
statuses, follow and moderate each other. The whole system lives in one repository
(`minidon`, Python 3.12, FastAPI + SQLAlchemy 2.0 + Pydantic), pinned at commit
`e1fbd3a9c8d863086cb9e4005b411d7c33c91488` on branch `master`. There is one deployable ASGI
app (`minidon/main.py#create_app`), one database reached through `minidon/db.py`, and six
domain packages wired into it through `minidon/main.py`.

This map was built by reading `.mw/context/ingest-report.json`,
`.mw/context/graph-report.json` and `.mw/context/graph/{nodes,edges}.json` (all produced by
earlier agents in this run) plus `minidon/README.md`, directly from the pinned commit. No
file under `/Users/kurtis/tw/test-mw/minidon` was written to while building this map (I-01).

**Capability naming.** The six capability names below (Accounts, Following, Posting,
Timelines, Notifications, Moderation) come directly from `README.md`'s `##` feature headings
and its API table, so they are labelled `STATED` at the L1 level. The README splits "Posting"
and "Interacting" (boost/favourite) into two sections; the code keeps them in one package
(`minidon/statuses/`), so this map represents that as one L1 capability with two `DERIVED`
L2 sub-capabilities rather than inventing a seventh capability the code does not support.
Everything below L1 - which files implement which sub-capability, how deep the hierarchy
goes - is inferred from the code graph and is `DERIVED` unless stated otherwise.

**Hierarchy depth.** This is a small application (45 Python modules, ~2,700 lines of
production code). Four of the six capabilities (Following, Posting, Moderation get L2 splits;
Timelines and Notifications do not - their code has no internal grouping worth naming
separately) have real L2-level distinctions worth naming; Timelines and Notifications do not,
and are left as a single L1 capability mapping straight to its L4 components. No L3 ("feature")
level is populated for this baseline: at this codebase's size, introducing a feature layer
between "sub-capability" and "component" would manufacture distinctions the code does not
have. The L3 table is kept (per the template) but intentionally empty; it should be
populated if/when the codebase grows features large enough to need that extra layer.

**The `lists` package is explicitly not a capability.** `minidon/lists/` (models.py,
service.py) defines a plausible "user-curated lists of accounts" feature, but it is
unreachable from every entry point: not imported by `minidon/main.py`, not re-exported by
the model aggregator `minidon/models.py` (so its tables are never created by
`create_tables()`), has no `routes.py`, and has zero test coverage. Both the
ingestion-agent (warning `MW-W01`) and the graph-agent (orphan analysis, cluster
`cluster-lists-orphan`) independently confirmed this by call-graph traversal from every
entry point. It is listed under **Unmapped Code** below with reason "dead/incomplete code",
not given an `L1-*` id, and has no `code-links.json`. If this feature is ever wired up it
should be assessed as a new capability at that time, not retrofitted now based on dead code.

See `.mw/notes/glossary/` for six terms where business language (README) and code language
differ: `boost.md`, `followers-only.md`, `following.md`, `locked-account.md`, `staff.md`,
`relationship.md`.

## Capability Hierarchy

```
L0-minidon  Minidon Social Network
├── L1-accounts        Accounts                (STATED - README ## Accounts)
│   ├── L2-registration-auth   Registration & sign-in
│   └── L2-profile             Profile
├── L1-following       Following               (STATED - README ## Following)
│   ├── L2-follow-relationships  Follow / unfollow / follow requests
│   └── L2-block-mute            Block / mute
├── L1-posting         Posting                 (STATED - README ## Posting + ## Interacting)
│   ├── L2-status-composition    Compose / edit / delete / reply
│   └── L2-status-interactions   Boost (reblog) / favourite
├── L1-timelines       Timelines               (STATED - README ## Timelines)
├── L1-notifications   Notifications           (STATED - README ## Notifications)
└── L1-moderation      Moderation              (STATED - README ## Moderation)
    ├── L2-reporting              Reports (file / list / resolve)
    └── L2-suspension-roles       Suspension & role assignment

(not a capability) Unmapped/orphaned: minidon/lists/ - see "Unmapped Code"
```

### Level 0 (Business Domains)
| ID | Name | Description |
|----|------|-------------|
| L0-minidon | Minidon Social Network | A single-server Mastodon-style microblog: accounts, posts, follows, feeds, notifications and moderation. `STATED` - README.md title and intro paragraph. |

### Level 1 (Capabilities)
| ID | Parent | Name | Description |
|----|--------|------|-------------|
| L1-accounts | L0-minidon | Accounts | Registration, sign-in/access tokens, profile, roles. `STATED` name (README `## Accounts`); code location `minidon/accounts/` `DERIVED`. |
| L1-following | L0-minidon | Following | Follow/unfollow, follow requests, block, mute - the social graph. `STATED` name (README `## Following`); code location `minidon/social/` `DERIVED` (package name differs from business name - see `.mw/notes/glossary/following.md`). |
| L1-posting | L0-minidon | Posting | Create/edit/delete statuses, replies, visibility, mentions/hashtags, plus boosting and favouriting. `STATED` name (README `## Posting` + `## Interacting`, merged here); code location `minidon/statuses/` `DERIVED`. |
| L1-timelines | L0-minidon | Timelines | Read-model queries over statuses: home, public, hashtag, per-account. `STATED` name (README `## Timelines`); code location `minidon/timelines/` `DERIVED`. |
| L1-notifications | L0-minidon | Notifications | Notification creation and delivery/read-state. `STATED` name (README `## Notifications`); code location `minidon/notifications/` `DERIVED`. |
| L1-moderation | L0-minidon | Moderation | Reports, resolution actions, suspension, role assignment. `STATED` name (README `## Moderation`); code location `minidon/moderation/` `DERIVED`. |

### Level 2 (Sub-capabilities)
| ID | Parent | Name | Description |
|----|--------|------|-------------|
| L2-registration-auth | L1-accounts | Registration & sign-in | Sign up, sign in, access tokens. `DERIVED` from `minidon/accounts/service.py` (register, issue_token, authenticate, revoke_tokens) and `routes.py` (register, sign_in). |
| L2-profile | L1-accounts | Profile | View/update display name and bio. `DERIVED` from `minidon/accounts/service.py#update_profile`, `routes.py` (show_me, update_me, show). |
| L2-follow-relationships | L1-following | Follow relationships | Follow, unfollow, follow requests (locked-account approval flow). `DERIVED` from `minidon/social/service.py` (follow, unfollow, follow_requests, authorize_request, reject_request, followers, following). |
| L2-block-mute | L1-following | Block & mute | Block/unblock, mute/unmute. `DERIVED` from `minidon/social/service.py` (block, unblock, mute, unmute). |
| L2-status-composition | L1-posting | Status composition | Create, edit (within 30 min), delete, reply. `DERIVED` from `minidon/statuses/service.py` (create_status, edit_status, delete_status, soft_delete, replies). |
| L2-status-interactions | L1-posting | Status interactions | Boost (reblog/unreblog), favourite/unfavourite. `DERIVED` from `minidon/statuses/service.py` (reblog, unreblog, favourite, unfavourite) - see `.mw/notes/glossary/boost.md`. |
| L2-reporting | L1-moderation | Reporting | File a report, list open reports, resolve (dismiss/delete status/suspend). `DERIVED` from `minidon/moderation/service.py` (file_report, list_reports, resolve_report). |
| L2-suspension-roles | L1-moderation | Suspension & roles | Suspend/unsuspend an account, assign roles. `DERIVED` from `minidon/moderation/service.py` (suspend, unsuspend, set_role) - see `.mw/notes/glossary/staff.md`. |

### Level 3 (Features)
| ID | Parent | Name | Description |
|----|--------|------|-------------|
| _(none populated this baseline)_ | | | See "Hierarchy depth" in Overview: at this codebase's size, L2 sub-capabilities already map directly onto L4 components with no intermediate feature grouping worth naming. |

### Level 4 (Components)
| ID | Parent | Name | Repository | Path |
|----|--------|------|------------|------|
| L4-accounts-models | L2-registration-auth | Account/AccessToken/Role models | minidon | minidon/accounts/models.py |
| L4-accounts-routes | L2-registration-auth | Accounts API routes | minidon | minidon/accounts/routes.py |
| L4-accounts-schemas | L2-profile | Account response schema | minidon | minidon/accounts/schemas.py |
| L4-accounts-service | L2-registration-auth | Accounts service (auth + profile) | minidon | minidon/accounts/service.py |
| L4-social-models | L2-follow-relationships | Follow/Block/Mute models | minidon | minidon/social/models.py |
| L4-social-queries | L2-follow-relationships | Shared follow/block/mute predicates | minidon | minidon/social/queries.py |
| L4-social-routes | L2-follow-relationships | Following API routes | minidon | minidon/social/routes.py |
| L4-social-service | L2-follow-relationships | Following/block/mute service | minidon | minidon/social/service.py |
| L4-statuses-models | L2-status-composition | Status/Favourite/Mention/StatusTag models | minidon | minidon/statuses/models.py |
| L4-statuses-routes | L2-status-composition | Statuses API routes | minidon | minidon/statuses/routes.py |
| L4-statuses-schemas | L2-status-composition | Status response schema | minidon | minidon/statuses/schemas.py |
| L4-statuses-service | L2-status-composition | Statuses service (CRUD + boost/favourite) | minidon | minidon/statuses/service.py |
| L4-timelines-routes | L1-timelines | Timelines API routes | minidon | minidon/timelines/routes.py |
| L4-timelines-service | L1-timelines | Timelines read-model queries | minidon | minidon/timelines/service.py |
| L4-notifications-models | L1-notifications | Notification/NotificationKind models | minidon | minidon/notifications/models.py |
| L4-notifications-routes | L1-notifications | Notifications API routes | minidon | minidon/notifications/routes.py |
| L4-notifications-service | L1-notifications | Notifications service | minidon | minidon/notifications/service.py |
| L4-moderation-models | L2-reporting | Report/ModerationAction models | minidon | minidon/moderation/models.py |
| L4-moderation-routes | L2-reporting | Moderation API routes | minidon | minidon/moderation/routes.py |
| L4-moderation-service | L2-reporting | Moderation service (reports + suspension + roles) | minidon | minidon/moderation/service.py |

Each capability's full component list (including `__init__.py` package markers, exact line
ranges, exports and dependency edges) is in its `code-links.json` under
`.mw/context/capabilities/<id>/`.

## Repository to Capability Mapping

| Repository | Capabilities | Primary Domain |
|------------|--------------|----------------|
| minidon | L1-accounts, L1-following, L1-posting, L1-timelines, L1-notifications, L1-moderation | Social networking (single-server Mastodon-style instance) |

## Unmapped Code

> Per I-04: Code belonging to no capability must be listed, not silently ignored.

| Repository | Path | Reason | Owner |
|------------|------|--------|-------|
| minidon | minidon/main.py | Shared platform infrastructure - ASGI app factory (`create_app`) that wires all six capability routers and the single `DomainError` handler; not owned by any one capability. | Platform/Core |
| minidon | minidon/__main__.py | Shared platform infrastructure - `python -m minidon` CLI/dev-server entry point. | Platform/Core |
| minidon | minidon/models.py | Shared utility - single-import aggregator re-exporting ORM models from five capability packages (deliberately excludes `minidon.lists`, which is why Lists' tables are never created). | Platform/Core |
| minidon | minidon/config.py | Shared utility - app-wide `Settings` (env-sourced DB URL, domain), read by Accounts and Statuses but not owned by either. | Platform/Core |
| minidon | minidon/db.py | Shared utility - SQLAlchemy engine, session factory, declarative `Base`, `create_tables()`; extended by every capability's models (and by the orphaned Lists models). | Platform/Core |
| minidon | minidon/deps.py | Shared utility - FastAPI dependency aliases (`SessionDep`, `OptionalAccount`, `CurrentAccount`, `Staff`) used by every capability's routes. | Platform/Core |
| minidon | minidon/errors.py | Shared utility - `DomainError` exception hierarchy mapped to HTTP responses once in `main.py`; raised by every capability. | Platform/Core |
| minidon | minidon/__init__.py | Empty package marker, no behaviour. | Platform/Core |
| minidon | tests/__init__.py | Empty package marker, no behaviour. | Platform/QA |
| minidon | tests/conftest.py | Shared test infrastructure - pytest fixtures (`client`, `make_user`, in-memory SQLite engine) used by every capability's test module. | Platform/QA |
| minidon | minidon/lists/__init__.py | Dead code: part of the orphaned Lists package (see Overview). Empty package marker. | Unassigned - product decision needed (finish or remove Lists) |
| minidon | minidon/lists/models.py | Dead code: orphan in graph report. Defines `List`/`ListMember` SQLAlchemy models; confirmed unreachable from every entry point by both the ingestion-agent (`MW-W01`) and the graph-agent (independent call-graph BFS). Tables are never created because `minidon/models.py` does not re-export `minidon.lists`. | Unassigned - product decision needed (finish or remove Lists) |
| minidon | minidon/lists/service.py | Dead code: orphan in graph report. `create_list`/`add_member` have zero incoming reference edges from anywhere in the repo and no test coverage (no `test_lists.py` exists). Internally well-formed (correctly calls `accounts.service` and `social.queries`) - reads as an incomplete feature, not broken code. | Unassigned - product decision needed (finish or remove Lists) |

## Cross-Cutting Concerns

| Concern | Affected Capabilities | Implementation |
|---------|----------------------|----------------|
| Authentication & session resolution | All six capabilities | `minidon/deps.py` (SessionDep, OptionalAccount, CurrentAccount, Staff) backed by `minidon/accounts/service.py` (authenticate, issue_token) |
| Error-to-HTTP-status mapping | All six capabilities | `minidon/errors.py` (DomainError hierarchy), registered once in `minidon/main.py#domain_error` |
| Identity resolution (`get_by_username`) | Owned by Accounts; called from Following, Posting (indirectly via Timelines), Moderation | `minidon/accounts/service.py#get_by_username` - graph-report's highest in-degree hotspot (18 incoming edges) |
| Social predicate layer (`is_following` / `is_blocked_between` / `is_muting`) | Owned by Following; consumed by Accounts, Posting, Timelines, Notifications | `minidon/social/queries.py` - graph-report cluster note names it "the most reused cross-cutting module after accounts.service" |
| Notification fan-in | Produced by Following and Posting; owned by Notifications | `minidon/notifications/service.py#notify`, called from `social/service.py` (follow/follow-request) and `statuses/service.py` (mention/reblog/favourite) |
| Shared ORM declarative base | All six capabilities, plus the orphaned Lists package | `minidon/db.py#Base` - graph-report hotspot, extended by 13 reachable model classes (14 incl. the orphaned Lists models) |

## Domain Boundaries

### Bounded Contexts
| Context | Capabilities | Integration Style |
|---------|--------------|-------------------|
| Minidon application (single repo, single database via `MINIDON_DATABASE_URL`) | L1-accounts, L1-following, L1-posting, L1-timelines, L1-notifications, L1-moderation | Shared DB - all six capabilities share one SQLAlchemy `Base`/engine and call each other's service functions in-process; there are no network boundaries or separate datastores between them. `DERIVED` from `minidon/db.py` and the import graph. |

### Anti-Corruption Layers
| Source Context | Target Context | Adapter Location |
|----------------|----------------|------------------|
| _(none identified)_ | | Single repository, single process, no external systems or legacy integrations in this baseline. |

### Boundary Questions (for the BA agent / curator)

1. **`minidon/social/queries.py`** is mapped to L1-following (it lives in the `social`
   package and reads the tables Following owns) but is consumed directly by Accounts
   (`schemas.py`), Posting and Timelines (visibility filtering) and Notifications. Is this a
   shared-kernel module that should be documented as a stable cross-capability contract
   rather than an implicit import?
2. **`minidon/accounts/service.py#get_by_username`** is called from five other
   capability-owning modules (graph-report hotspot, 18 incoming edges). Mapped to
   L1-accounts since it owns the `Account` table. Should this be formalised as a stable
   identity-resolution API rather than a plain function import?
3. **Posting vs. Interacting**: README treats "Posting" (compose/edit/delete) and
   "Interacting" (boost/favourite) as two feature sections; the code implements both in one
   package (`minidon/statuses/`). This map resolves them as one L1 capability with two L2
   sub-capabilities. Confirm this granularity is what the business means by "Posting".
4. **`minidon/moderation/service.py#resolve_report`** calls
   `minidon/statuses/service.py#soft_delete` directly to implement the "delete the reported
   status" resolution action - Moderation reaches into Posting's write path rather than
   going through a narrower moderation-specific API. Worth a boundary decision if Posting's
   delete semantics ever change.
5. **The orphaned Lists feature** (see Unmapped Code), if ever completed, would most
   plausibly become either a new L1 capability or an L2 sub-capability of Following (it
   curates accounts, like Following does). Not committed to either boundary here since the
   code is unreachable and unowned.

## Statistics

- **Total Capabilities:** 6 (L1), 8 (L2)
- **Mapped Code Coverage:** 71% (32 of 45 Python modules: 26 production files + 6
  capability test files; see Unmapped Code for the other 13)
- **Unmapped Paths:** 13
- **Cross-Repo Dependencies:** 0 (single-repository baseline; `millwright.config.yaml`
  lists one repo, role `backend`)
