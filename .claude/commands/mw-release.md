---
name: Millwright Release
description: Check release readiness
user-invocable: true
allowed-tools: [Read, Write, Edit, Bash, Task]
---

# /mw-release

> Check release readiness

## Usage

```
/mw-release [TICKET]
```

## Instructions

# Release (Activity 04)

Check release readiness and deploy.

## What Release Produces

- `release/readiness-checklist.md` - Release checklist
- `release/rollback-plan.md` - Tested rollback procedure

## States Handled

- UAT_DEPLOYED → GATE_C (human review)
- GATE_C (approved) → RELEASED

## Delegate To

deployment-agent with skills:
- release-readiness
- rollback-plan

## Key Invariants

- I-20: Same artifact promoted; no rebuild between environments
- I-22: Rollback procedure must be tested

## Readiness Checklist

- [ ] All acceptance tests pass
- [ ] UAT sign-off obtained
- [ ] Rollback plan documented and tested
- [ ] Observability in place (logs, metrics, alerts)
- [ ] On-call notified
