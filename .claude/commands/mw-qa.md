---
name: Millwright QA
description: Run acceptance testing
user-invocable: true
allowed-tools: [Read, Write, Edit, Bash, Task]
---

# /mw-qa

> Run acceptance testing

## Usage

```
/mw-qa [TICKET]
```

## Instructions

# QA / Acceptance (Activity 04)

Run acceptance tests on merged code.

## What QA Produces

- `qa/acceptance-results.json` - Test results
- `qa/uat-evidence.md` - UAT evidence documentation

## States Handled

- MERGED → SPEC_FOLDBACK → ACCEPTANCE_AUTOMATION
- ACCEPTANCE_AUTOMATION → UAT_DEPLOYED

## Delegate To

acceptance-agent with skills:
- playwright-authoring
- traceability-matrix

## Key Invariants

- I-19: UI-only tests require stated reason
- I-14: acceptance-agent cannot review work from testing-agent

## Acceptance Checklist

1. Verify all GWT scenarios pass
2. Check traceability matrix coverage
3. Document any deviations
4. Prepare UAT evidence for Gate C
