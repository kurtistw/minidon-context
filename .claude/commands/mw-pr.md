---
name: Millwright PR
description: Compose and raise pull request
user-invocable: true
allowed-tools: [Read, Write, Bash, Task]
---

# /mw-pr

> Compose and raise pull request

## Usage

```
/mw-pr [TICKET]
```

## Instructions

# Pull Request (Activity 03)

Compose and raise the pull request.

## What PR Produces

- Pull request on each affected repo
- Links to ticket, spec, review report

## States Handled

- GATE_B (approved) → PR_RAISED
- PR_RAISED → MERGED (human merges)

## Delegate To

pr-agent with skills:
- pr-compose

## Key Invariants

- I-15: Raise the PR; never merge it
- I-16: One PR per repo, titled by ticket

## PR Format

```markdown
## TICKET-123: Add booking endpoint

### Summary
Implements REQ-001: New booking creation endpoint

### Links
- Ticket: [TICKET-123](...)
- Spec: .mw/runs/TICKET-123/spec/
- Review: .mw/runs/TICKET-123/reviews/review-report-001.md

### Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Coverage delta meets threshold

### Checklist
- [x] Spec conformance verified
- [x] No blockers in review report
- [x] Contract compatibility checked
```

## After PR Raised

Stop and notify human. Human must:
1. Review the PR
2. Merge when approved
3. Use `/mw-gate approve` to record MERGED state
