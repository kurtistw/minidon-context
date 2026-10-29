---
name: Millwright Spec
description: Resume specification authoring
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Task]
---

# /mw-spec

> Resume specification authoring

## Usage

```
/mw-spec [TICKET]
```

## Instructions

# Specification (Activity 02)

Resume spec authoring on a run.

## What Spec Produces

- `spec/` - Rendered specifications (markdown or framework-specific)
- `ir/spec.json` - Canonical spec IR (machine-readable)
- `assumptions.md` - Documented assumptions

## States Handled

- PRD_REVIEW (approved) → SPEC_DRAFT
- SPEC_DRAFT → READY_FOR_DEV_PENDING

## Parallel Track

While spec-agent works on SPEC_DRAFT, qa-planning-agent works on QA_TEST_AUTHOR:
- `test-plan.md` - Test planning
- `scenarios.md` - GWT scenarios

Both must complete before READY_FOR_DEV.

## Delegate To

spec-agent with skills:
- gwt-authoring
- provenance-labelling
- spec-delta
- design-context

## Key Invariants

- I-05: Derived behaviour labelled DERIVED, never asserted as STATED
- I-03: Every requirement has provenance
