---
name: Millwright Build
description: Resume build work (coding and testing)
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Task]
---

# /mw-build

> Resume build work (coding and testing)

## Usage

```
/mw-build [TICKET]
```

## Instructions

# Build (Activity 03)

Resume implementation work.

## What Build Produces

- Code changes following the plan
- Tests at planned layers
- Coverage delta report

## States Handled

- GATE_A (approved) → BUILD
- BUILD → TESTS_LANDED

## Delegate To

coding-agent with skills:
- test-first-loop

testing-agent with skills:
- coverage-delta
- playwright-authoring
- test-budget

## Key Invariants

- I-12: Nothing added at higher test layer than planned
- I-13: Report coverage delta on changed code only
- I-17: Test-first discipline (red→green→refactor)

## Test-First Loop

1. Write failing test
2. Run test (confirm red)
3. Write minimal code to pass
4. Run test (confirm green)
5. Refactor if needed
6. Commit with message linking to requirement
