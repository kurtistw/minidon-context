---
name: Millwright Review
description: Request code review
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Grep, Task]
---

# /mw-review

> Request code review

## Usage

```
/mw-review [TICKET]
```

## Instructions

# Code Review (Activity 03)

Request review of implementation.

## What Review Produces

- `reviews/review-report-NNN.md` - Graded findings report

## States Handled

- TESTS_LANDED → CHANGE_REVIEW
- CHANGE_REVIEW → GATE_B (human review)

## Delegate To

review-agent with skills:
- review-report
- spec-conformance
- contract-compat

## Key Invariants

- I-14: No agent reviews its own work
  - review-agent cannot review work from coding-agent or testing-agent
  - Check ledger to verify who produced the work

## Report Format

```markdown
# Review Report v001

## Summary
- Blockers: 0
- Warnings: 2
- Suggestions: 3

## Findings

### [WARNING] Missing error handling
- File: src/services/booking.ts:45
- Spec: REQ-001 requires validation errors
- Fix: Add try/catch with proper error response

### [SUGGESTION] Consider extracting helper
- File: src/services/booking.ts:60-80
- Rationale: Improves testability
```
