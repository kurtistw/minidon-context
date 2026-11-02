# Conflicts

> **Baseline Version:** BASELINE-2026-10-30
> **Generated:** 2026-10-30T18:30:00Z
> **Open:** 7 · **Resolved by code:** 0 · **Resolved:** 0

Every disagreement between context sources is listed here, including those the code settles
(I-28). Conflicts are never merged silently; only a human closes an `open` conflict. None of
the seven conflicts below were found to be settled by a mechanical, structural code fact
alone (an enum's members, whether an import exists, etc.) - each turns on a question of
business intent, correctness, or ownership that only a human can close. So there are zero
`resolved-by-code` entries this baseline; that is a finding, not an omission.

This document reconciles 30 source artifacts produced earlier in Activity 01: the structural
pass (`ingest-report.json`, `graph-report.json`, `graph/nodes.json`, `graph/edges.json`) and
the semantic pass (`domain-map.md`, 6 `capability.md` documents, 6 `rules-trace.md`
documents, 6 `code-links.json` documents, 6 glossary notes under `.mw/notes/glossary/`, and
one decision transcript under `.mw/notes/decisions/`). None were picked as a winner; the
reconciler's job is to list, not decide (I-28).

---

## CF-001: Status edit window - 30 minutes (documented) vs. 60 minutes (code)

- **Type:** `rule-disagreement`
- **Status:** `open`
- **Capabilities:** L1-posting
- **Rules:** BR-009 (README value), BR-010 (code value)

| Source | Interpretation | Evidence |
|--------|----------------|----------|
| README.md (`STATED`) | The author may edit their own status within **30 minutes** of posting. | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:README.md:24` |
| Decision transcript (`STATED`, corroborating) | A product decision dated 2026-10-01 records: "Users may edit a status for 30 minutes after posting. After that it is final," reasoning that "long edit windows let people change a post after others have replied to it." This is a second, independent documentary source for 30 minutes, not just README copy - though note the file is misfiled/malformed (see note below). | `millwright-context:.mw/notes/decisions/ADR-001-edit-window.md` (whole file, 4 lines) |
| Code + test (`DERIVED`, 0.95) | `edit_window_minutes` defaults to **60** in `Settings`, is the value actually compared against in `edit_status`, and the rejection test deliberately advances the clock by 61 (not 31) minutes to trigger a `403`. Three independent code artifacts agree with each other on 60; only the documentation side disagrees. | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/config.py:15`; `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:117-118`; `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:tests/test_statuses.py:62-67` |

**Note on the decision transcript:** `.mw/notes/decisions/ADR-001-edit-window.md` is malformed -
its content begins mid-heredoc (`cat > .mw/docs/transcript-2026-10-01-moderation.md`) and is
missing the `## D` of its own `## Decision` heading, suggesting it was meant to land at
`.mw/docs/transcript-2026-10-01-moderation.md` and was mis-captured. The curator is reporting
its content as found, not correcting it; a human should also decide whether this file needs
to be re-filed or repaired, independent of the edit-window question itself.

**Resolution:** Unresolved by design (I-05). Three sources (README, the 2026-10-01 decision
transcript, and the `statuses` capability's own `capability.md`/`rules-trace.md`) agree the
business intent was 30 minutes; three code artifacts agree the enforced value is 60. A human
(BA / Product) must decide whether the code should be changed to 30, the documentation and
decision record updated to 60, or a new decision taken. **Owner: BA / Product.**

---

## CF-002: `minidon/lists/` has no owner

- **Type:** `ownership-unclear`
- **Status:** `open`
- **Capabilities:** _(none - explicitly not mapped to any capability)_
- **Rules:** n/a - this is an unmapped-code item, not a business rule

| Source | Interpretation | Evidence |
|--------|----------------|----------|
| ingestion-agent + graph-agent (agree) | `minidon/lists/` (`models.py`, `service.py`) defines a plausible "user-curated lists of accounts" feature that is unreachable from every entry point: no `routes.py`, not imported by `minidon/main.py`, not re-exported by the model aggregator `minidon/models.py` (so its tables are never created), and has zero test coverage. Both agents reached this conclusion independently - ingestion via per-file reachability analysis (warning `MW-W01`), graph via BFS call-graph traversal from all three entry points (`orphans`, `cluster-lists-orphan`). This structural fact is settled; the two passes do not disagree with each other. | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/lists/models.py` (whole file); `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/lists/service.py` (whole file); `millwright-context:.mw/context/ingest-report.json` (`summary.warnings[MW-W01]`); `millwright-context:.mw/context/graph-report.json` (`analysis.orphans`: `pkg:minidon.lists`, `minidon/lists/models.py`, `minidon/lists/service.py#create_list`, `#add_member`) |
| domain-map.md / product (no decision recorded) | The domain-map deliberately does **not** give `minidon/lists/` an `L1-*` id and lists it under "Unmapped Code" with owner `"Unassigned - product decision needed (finish or remove Lists)"` - i.e. nobody currently owns this code or has decided its fate. | `millwright-context:.mw/context/domain-map.md` (`## Unmapped Code`, `## Domain Boundaries` Boundary Question 5) |

**Resolution:** The "is this dead code" question is settled (both structural agents agree,
independently, at the pinned SHA). The open part is what happens next: finish the feature,
remove it, or leave it dormant and unowned - and, if finished, whether it becomes its own L1
capability or an L2 sub-capability of Following (it curates accounts, like Following does).
No winner is picked here; a human must assign a real owner. **Owner: BA / Product.**

---

## CF-003: Is `minidon/social/queries.py` a shared-kernel contract or an implicit import?

- **Type:** `boundary-overlap`
- **Status:** `open`
- **Capabilities:** L1-following (owner), L1-accounts, L1-posting, L1-timelines, L1-notifications (consumers)
- **Rules:** n/a - architectural boundary question, not a specific business rule

| Source | Interpretation | Evidence |
|--------|----------------|----------|
| graph-agent / domain-map.md | `minidon/social/queries.py` is "the most reused cross-cutting module after accounts.service," consumed directly by five of six capabilities to answer "does A follow/block/mute B?" | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/social/queries.py:1-85`; `millwright-context:.mw/context/domain-map.md` (Boundary Question 1; Cross-Cutting Concerns) |
| ba-agent (following/capability.md) | Flags the same module as an open question: should it be formally documented as a stable cross-capability contract rather than an implicit shared import, since a change to visibility semantics here affects five modules at once? | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/schemas.py` (imports); `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py` (imports); `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/timelines/service.py` (imports); `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/notifications/service.py` (imports) |

**Resolution:** Not resolved here. Whether this becomes a documented contract is a domain-
modelling decision, not a structural fact. **Owner: BA / Product / Domain modelling.**

---

## CF-004: Is `accounts/service.py#get_by_username` a stable identity API or a plain import?

- **Type:** `boundary-overlap`
- **Status:** `open`
- **Capabilities:** L1-accounts (owner), L1-following, L1-posting, L1-timelines, L1-moderation (callers)
- **Rules:** n/a - architectural boundary question, not a specific business rule

| Source | Interpretation | Evidence |
|--------|----------------|----------|
| graph-agent | Highest in-degree hotspot in the whole graph (18 incoming edges): called from accounts/routes, social/routes+service, statuses/service (indirectly via timelines), moderation/service, and the orphaned lists/service. "A behavior change here ripples across 5 of 6 wired capability modules." | `millwright-context:.mw/context/graph-report.json` (`analysis.hotspots`: `minidon/accounts/service.py#get_by_username`, inDegree 18) |
| domain-map.md | Raises this exact hotspot as a boundary question: should it be formalised as a stable identity-resolution API rather than a plain function import? | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/accounts/service.py:105-110`; `millwright-context:.mw/context/domain-map.md` (Boundary Question 2) |

**Resolution:** Not resolved here; an API-design decision for a human (Tech Lead / BA
Product) to make, not a structural fact. **Owner: Tech Lead.**

---

## CF-005: Is "Posting" one capability or two ("Posting" + "Interacting")?

- **Type:** `boundary-overlap`
- **Status:** `open`
- **Capabilities:** L1-posting
- **Rules:** n/a - capability-granularity question, not a specific business rule

| Source | Interpretation | Evidence |
|--------|----------------|----------|
| README.md (`STATED`) | Documents "Posting" (compose/edit/delete/reply) and "Interacting" (boost/favourite) as two separate `##` feature sections. | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:README.md:14` (`### Posting`); `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:README.md:27` (`### Interacting`) |
| domain-agent (domain-map.md, `DERIVED`) | The code implements both in one package, `minidon/statuses/`, with no internal module boundary between them, so the map represents this as one `L1-posting` capability with two `L2` sub-capabilities (`status-composition`, `status-interactions`) rather than inventing a seventh capability the code does not support. | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/` (single package); `millwright-context:.mw/context/domain-map.md` (Overview "Capability naming"; Boundary Question 3) |

**Resolution:** Not resolved here. The domain-map's merge is a reasonable `DERIVED` reading of
the code, but whether it matches what the business means by "Posting" is for a human to
confirm. **Owner: BA / Product.**

---

## CF-006: Moderation calls Posting's `soft_delete` directly, bypassing a moderation-specific API

- **Type:** `boundary-overlap`
- **Status:** `open`
- **Capabilities:** L1-moderation, L1-posting
- **Rules:** L1-moderation BR-015; L1-posting BR-014

| Source | Interpretation | Evidence |
|--------|----------------|----------|
| ba-agent (moderation/rules-trace.md) | Moderation's "delete reported status" resolution action calls `minidon/statuses/service.py#soft_delete` directly, so it inherits Posting's cascading boost-deletion behaviour even though Moderation documents only "delete the reported status." | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/moderation/service.py:71` |
| domain-map.md (Boundary Question 4) | Flags this as "Moderation reaches into Posting's write path rather than going through a narrower moderation-specific API. Worth a boundary decision if Posting's delete semantics ever change." | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:142-150`; `millwright-context:.mw/context/domain-map.md` (Boundary Question 4) |

**Resolution:** Not resolved here; an architecture decision for a human, independent of
whether the current cascading behaviour is otherwise correct. **Owner: Tech Lead / BA Product
(Architecture).**

---

## CF-007: Boostable statuses - "any status you can see" (documented) vs. public/unlisted only (code)

- **Type:** `rule-disagreement`
- **Status:** `open`
- **Capabilities:** L1-posting
- **Rules:** BR-016

| Source | Interpretation | Evidence |
|--------|----------------|----------|
| README.md (`STATED`) | "**Boost** any status you can see to share it with your followers" - no visibility restriction is mentioned; a followers-only status visible to you (because you follow its author) reads as boostable under this wording. | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:README.md:28` |
| Code + test (`DERIVED`, 0.85) | `BOOSTABLE = frozenset({Visibility.PUBLIC, Visibility.UNLISTED})`; attempting to boost a followers-only or direct status raises `403 Forbidden` even for a viewer who can see it (e.g. a follower). | `minidon@e1fbd3a9c8d863086cb9e4005b411d7c33c91488:minidon/statuses/service.py:21,165-166`; confirmed by `tests/test_statuses.py::test_followers_only_statuses_cannot_be_boosted` |

**Resolution:** Unresolved. This was raised as an "open question" rather than a formal
conflict in `posting/rules-trace.md`'s own Conflict Log (which only names BR-009/BR-010); the
curator is elevating it here per I-28 because README's "any status you can see" is a
falsifiable claim the code contradicts for two of four visibility levels, not merely an
undocumented extra restriction. **Owner: BA / Product.**

---
