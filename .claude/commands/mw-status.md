---
name: Millwright Status
description: Show current run state, blockers, and next owner
user-invocable: true
allowed-tools: [Read, Glob, Bash]
---

# /mw-status

> Show current run state, blockers, and next owner

## Usage

```
/mw-status [TICKET]
```

## Instructions

# Show Run Status

## If TICKET provided:
Run `millwright next --run <TICKET>`

## If no TICKET:
Run `millwright next --all` to list active runs and their states.

## Output Format:

```
Run: TICKET-123
State: SPEC_DRAFT
Type: feature
Classification: standard

Counters:
  Plan Attempts: 0
  Modification Attempts: 0
  Build Attempts: 0

Last Transition:
  From: PLAN_DRAFT → To: SPEC_DRAFT
  Actor: planning-agent
  Time: 2026-09-03T14:30:00Z

Next Owner: spec-agent
Blockers: None
```

If at a gate, show:
- What artifacts are ready for review
- Who needs to review (from gate definition)
- Use `/mw-gate approve` or `/mw-gate reject` to proceed
