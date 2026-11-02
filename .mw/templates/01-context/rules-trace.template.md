# Rules Trace

> **Capability:** {{CAPABILITY_ID}}
> **Baseline Version:** {{BASELINE_VERSION}}
> **Generated:** {{TIMESTAMP}}

## Purpose

This document traces every business rule to its source in the codebase, per I-25:
> Every rule traced to `repo@sha:path:lines`

## Rules Index

| Rule ID | Rule Text | Confidence | Source Count |
|---------|-----------|------------|--------------|
| BR-{{ID}} | {{RULE_TEXT}} | `STATED` \| `DERIVED` | {{SOURCE_COUNT}} |

## Detailed Traces

### BR-{{RULE_ID}}: {{RULE_TEXT}}

**Confidence:** `STATED` | `DERIVED`

**Sources:**

| # | Repository | Commit | Path | Lines | Evidence |
|---|------------|--------|------|-------|----------|
| 1 | {{REPO}} | {{SHA}} | {{PATH}} | {{START_LINE}}-{{END_LINE}} | {{EVIDENCE_TYPE}} |

**Code Reference:**
```{{LANGUAGE}}
// {{REPO}}@{{SHA}}:{{PATH}}:{{LINES}}
{{CODE_SNIPPET}}
```

**Derivation Notes:**
{{DERIVATION_NOTES}}

---

## Confidence Legend

| Confidence | Meaning | When to Use |
|------------|---------|-------------|
| `STATED` | Explicitly documented or specified | Comments, docs, tickets |
| `DERIVED` | Inferred from code behaviour | Implementation analysis |

## Conflict Log

> Rules where AST analysis and LLM analysis disagree

| Rule ID | AST Interpretation | LLM Interpretation | Resolution |
|---------|-------------------|-------------------|------------|
| BR-{{ID}} | {{AST_INTERPRETATION}} | {{LLM_INTERPRETATION}} | {{RESOLUTION}} |

## Coverage Summary

- **Total Rules:** {{TOTAL_RULES}}
- **Stated Rules:** {{STATED_COUNT}} ({{STATED_PERCENT}}%)
- **Derived Rules:** {{DERIVED_COUNT}} ({{DERIVED_PERCENT}}%)
- **Rules with Multiple Sources:** {{MULTI_SOURCE_COUNT}}
- **Conflicts Requiring Resolution:** {{CONFLICT_COUNT}}
