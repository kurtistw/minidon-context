# Baseline Review Report

> **Run:** BASELINE-2026-10-30
> **Baseline Version:** BASELINE-2026-10-30
> **Review Started:** 2026-10-30T19:30:00Z
> **Review Completed:** -
> **Decision:** PENDING

## Summary

| Metric | Count |
|--------|-------|
| Domains Reviewed | 0 of 1 |
| Domains Approved | 0 |
| Domains Needing Changes | 0 |
| Open Concerns | 21 open questions (`baseline.json.openQuestions`) + 7 open conflicts (`conflicts.md`) |
| Conflicts Resolved | 0 of 7 |

## Reviewers

| Reviewer | Role | Sign-off | Timestamp |
|----------|------|----------|-----------|
| _(unassigned)_ | - | PENDING | - |

## Domain Sign-offs

> Each L0 domain requires explicit sign-off. All child capabilities (L1-L4)
> are approved when the domain is signed off. This baseline has a single L0 domain.

| Domain | Capabilities | Status | Reviewer | Comments | Timestamp |
|--------|--------------|--------|----------|----------|-----------|
| L0-minidon Minidon Social Network | L1-accounts, L1-following, L1-posting, L1-timelines, L1-notifications, L1-moderation (35 total hierarchy nodes: 1 L0, 6 L1, 8 L2, 20 L4) | PENDING | - | review-findings.md recommends READY_FOR_REVIEW; 7 open conflicts and 21 open questions require a decision before this domain can be marked APPROVED | - |

### Sign-off Requirements

- **All domains must be APPROVED** for baseline confirmation
- **No partial approval** - if any domain needs changes, entire baseline returns to BRD_DRAFT
- **Single reviewer sufficient** - one qualified reviewer can approve all domains
- This baseline has exactly one L0 domain, so one sign-off covers all 35 capability-hierarchy
  nodes; see `review-findings.md` for the per-capability detail behind this single row.

## Review Comments

_(To be added by reviewers - see `review-findings.md` for the baseline-review-agent's own
findings, which are not reviewer comments and do not count as sign-off.)_

---

## Conflicts Resolution

> From `conflicts.md` - all conflicts must be resolved before approval.

| ID | Type | AST View | LLM View | Resolution | Reviewer |
|----|------|----------|----------|------------|----------|
| CF-001 | rule-disagreement | Code/tests agree: 60-minute edit window (`config.py:15`, `statuses/service.py:117-118`, `tests/test_statuses.py:62-67`) | README.md + 2026-10-01 decision transcript agree: 30 minutes | PENDING | - |
| CF-002 | ownership-unclear | `minidon/lists/` confirmed dead/unreachable (ingestion-agent MW-W01 + graph-agent orphan BFS, independently agreeing) | domain-map.md lists it as unmapped with no owner | PENDING | - |
| CF-003 | boundary-overlap | `social/queries.py`: 8 in-degree, consumed by 5 of 6 capabilities | Should it be a documented shared-kernel contract? | PENDING | - |
| CF-004 | boundary-overlap | `accounts/service.py#get_by_username`: 18 in-degree, graph's highest hotspot | Should it be a stable identity-resolution API? | PENDING | - |
| CF-005 | boundary-overlap | Code implements Posting+Interacting in one package, no internal split | README documents them as two separate sections | PENDING | - |
| CF-006 | boundary-overlap | Moderation calls Posting's `soft_delete` directly (`moderation/service.py:71`) | Should there be a narrower moderation-facing delete API? | PENDING | - |
| CF-007 | rule-disagreement | Code restricts boosting to public/unlisted only (`BOOSTABLE` frozenset, `statuses/service.py:21,165-166`) | README says "boost any status you can see" | PENDING | - |

## Open Questions Review

> From `baseline.json` - questions that need domain expert input.

| ID | Question | Owner | Status | Answer |
|----|----------|-------|--------|--------|
| OQ-001 | Is first-registrant-becomes-Admin (BR-006) intended production behaviour? | BA / Product | open | - |
| OQ-002 | Are Accounts' undocumented numeric/algorithmic constants intended business values? | BA / Product | open | - |
| OQ-003 | Is PBKDF2 at 100,000 iterations acceptable given current OWASP guidance? | Security reviewer | open | - |
| OQ-004 | Should blocking retroactively delete existing follows both ways? | BA / Product | open | - |
| OQ-005 | Should `social/queries.py` be a formal stable contract? (= CF-003) | BA / Product / Domain modelling | open | - |
| OQ-006 | Should "Relationship" be adopted as the official business term? | BA / Product | open | - |
| OQ-007 | Edit window: 30 (docs) or 60 (code)? (= CF-001) | BA / Product | open | - |
| OQ-008 | Should followers-only/direct statuses remain un-boostable? (= CF-007) | BA / Product | open | - |
| OQ-009 | Should staff be able to delete any status outside the report-resolve flow? | BA / Product | open | - |
| OQ-010 | Is the 30-posts/hour rate limit intended? | BA / Product | open | - |
| OQ-011 | Are the 20/40 timeline pagination defaults intended? | BA / Product | open | - |
| OQ-012 | Do the three notification suppression rules match intended behaviour? | BA / Product | open | - |
| OQ-013 | Are the 40/80 notification list limits intended? | BA / Product | open | - |
| OQ-014 | Is the 1000-char moderation comment limit intended? | BA / Product | open | - |
| OQ-015 | Is the full scope of suspension's effects intended? | BA / Product | open | - |
| OQ-016 | Does the implemented staff hierarchy match intended policy? | BA / Product | open | - |
| OQ-017 | Should Moderation's delete-status go through a narrower API? (= CF-006) | Tech Lead | open | - |
| OQ-018 | Should `get_by_username` be a formal identity API? (= CF-004) | Tech Lead | open | - |
| OQ-019 | Does the Posting/Interacting merge match business intent? (= CF-005) | BA / Product | open | - |
| OQ-020 | If Lists is completed, new L1 or L2-of-Following? (= CF-002) | BA / Product | open | - |
| OQ-021 | What should happen to the orphaned Lists feature? (= CF-002) | BA / Product | open | - |

## Decision

### Final Decision: PENDING

**Rationale:**
Not yet decided - awaiting human reviewer per I-23. `review-findings.md` (prepared by
baseline-review-agent) independently validated completeness, provenance, conflict framing and
coverage, and recommends READY_FOR_REVIEW: documentation quality is high, provenance is
accurate (one minor line-range citation to correct, no invalid or fabricated references), and
all 7 conflicts are genuinely open business/architecture questions rather than agent
oversights. The gating work for this review is deciding the 7 conflicts and assigning owners to
the 21 open questions, not fixing defects in the baseline documents themselves.

### If NEEDS_MODIFICATION:

**Required Changes:**

1. [ ] _(to be filled in by reviewer if applicable)_

**Categories of Issues:**

| Category | Count |
|----------|-------|
| Completeness | 0 blocking (1 suggestion) |
| Provenance | 0 blocking (1 minor citation range) |
| Conflicts | 7 (all require a human business/architecture decision) |
| Coverage | 0 |

### Signatures

| Reviewer | Role | Decision | Timestamp |
|----------|------|----------|-----------|
| _(unassigned)_ | - | PENDING | - |

---

## Appendix: Review Session Log

| Timestamp | Actor | Action | Details |
|-----------|-------|--------|---------|
| 2026-10-30T19:30:00Z | baseline-review-agent | Prepared review | Validated completeness of all 6 capability docs against baseline.json; verified all 13 integrity hashes match; re-checked ~55 provenance citations across all 6 rules-trace.md files and 51 cited test references against the pinned commit `e1fbd3a9c8d863086cb9e4005b411d7c33c91488`; reviewed all 7 conflicts for fairness/accuracy; recomputed the 45-file/13-unmapped/32-mapped coverage arithmetic. Produced `review-findings.md`. Did not approve, reject, or resolve any conflict (I-14, I-23). |

---

*This review report is the artifact of record for baseline approval. All decisions are recorded in the run ledger.*
