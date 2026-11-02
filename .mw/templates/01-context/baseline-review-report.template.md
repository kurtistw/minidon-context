# Baseline Review Report

> **Run:** {{RUN_ID}}
> **Baseline Version:** {{BASELINE_VERSION}}
> **Review Started:** {{REVIEW_START_TIMESTAMP}}
> **Review Completed:** {{REVIEW_END_TIMESTAMP}}
> **Decision:** {{DECISION}}

## Summary

| Metric | Count |
|--------|-------|
| Domains Reviewed | {{TOTAL_DOMAINS}} |
| Domains Approved | {{APPROVED_DOMAINS}} |
| Domains Needing Changes | {{CHANGES_NEEDED_DOMAINS}} |
| Open Concerns | {{OPEN_CONCERNS}} |
| Conflicts Resolved | {{CONFLICTS_RESOLVED}} |

## Reviewers

| Reviewer | Role | Sign-off | Timestamp |
|----------|------|----------|-----------|
| {{REVIEWER_ID}} | {{REVIEWER_ROLE}} | {{SIGNOFF_STATUS}} | {{TIMESTAMP}} |

## Domain Sign-offs

> Each L0 domain requires explicit sign-off. All child capabilities (L1-L4)
> are approved when the domain is signed off.

| Domain | Capabilities | Status | Reviewer | Comments | Timestamp |
|--------|--------------|--------|----------|----------|-----------|
| {{DOMAIN_ID}} {{DOMAIN_NAME}} | {{CHILD_CAPABILITIES}} | {{STATUS}} | {{REVIEWER}} | {{COMMENTS}} | {{TIMESTAMP}} |

### Sign-off Requirements

- **All domains must be APPROVED** for baseline confirmation
- **No partial approval** - if any domain needs changes, entire baseline returns to BRD_DRAFT
- **Single reviewer sufficient** - one qualified reviewer can approve all domains

## Review Comments

### Comment {{COMMENT_ID}}

- **Domain:** {{DOMAIN_ID}}
- **Capability:** {{CAPABILITY_ID}}
- **Category:** {{CATEGORY}}
- **Severity:** {{SEVERITY}}
- **Reviewer:** {{REVIEWER}}
- **Timestamp:** {{TIMESTAMP}}

**Issue:**
{{ISSUE_DESCRIPTION}}

**Suggested Resolution:**
{{SUGGESTED_RESOLUTION}}

**Status:** {{COMMENT_STATUS}}
**Resolution:** {{RESOLUTION_TEXT}}
**Resolved By:** {{RESOLVER}} @ {{RESOLUTION_TIMESTAMP}}

---

## Conflicts Resolution

> From `conflicts.md` - all conflicts must be resolved before approval.

| ID | Type | AST View | LLM View | Resolution | Reviewer |
|----|------|----------|----------|------------|----------|
| {{CONFLICT_ID}} | {{CONFLICT_TYPE}} | {{AST_VIEW}} | {{LLM_VIEW}} | {{RESOLUTION}} | {{REVIEWER}} |

## Open Questions Review

> From `baseline.json` - questions that need domain expert input.

| ID | Question | Owner | Status | Answer |
|----|----------|-------|--------|--------|
| {{QUESTION_ID}} | {{QUESTION_TEXT}} | {{OWNER}} | {{STATUS}} | {{ANSWER}} |

## Decision

### Final Decision: {{DECISION}}

**Rationale:**
{{DECISION_RATIONALE}}

### If NEEDS_MODIFICATION:

**Required Changes:**

1. [ ] {{REQUIRED_CHANGE}}

**Categories of Issues:**

| Category | Count |
|----------|-------|
| {{CATEGORY}} | {{COUNT}} |

### Signatures

| Reviewer | Role | Decision | Timestamp |
|----------|------|----------|-----------|
| {{REVIEWER_NAME}} | {{ROLE}} | {{DECISION}} | {{TIMESTAMP}} |

---

## Appendix: Review Session Log

| Timestamp | Actor | Action | Details |
|-----------|-------|--------|---------|
| {{TIMESTAMP}} | {{ACTOR}} | {{ACTION}} | {{DETAILS}} |

---

*This review report is the artifact of record for baseline approval. All decisions are recorded in the run ledger.*
