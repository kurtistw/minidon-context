---
name: Millwright Research
description: Resume or check research work: the outcome, the why and the target state
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Bash, Task]
---

# /mw-research

> Resume or check research work: the outcome, the why and the target state

## Usage

```
/mw-research [TICKET]
```

## Instructions

# Research (Activity 02)

Research sits between discovery and planning: the delivery team agrees the outcome, why it
matters and the target state, in a form agents can build against.

## What Research Produces (all under `.mw/runs/<TICKET>/research/`)

- `inputs.json`, `gaps.json` - inputs checked against discovery, and the Gap Register
- `outcome.json` - the outcome, value hypothesis and numeric metrics
- `risks.json`, `reviewers.json`, `estimate.json`, `security.md`
- `target-state/`, `flows/`, and an optional `prototype/`

## States Handled

- CONTEXT_READY → RESEARCH_INTAKE → RESEARCH_DRAFT → RESEARCH_READY → RESEARCH_REVIEW → PLAN_DRAFT

## Commands

- `millwright research init --run <TICKET>` - scaffold research/
- `millwright research scan --run <TICKET>` - check inputs and update the Gap Register (explicit, never automatic)
- `millwright research gaps|status|validate|diff --run <TICKET>`
- `millwright research snapshot --run <TICKET>` - archive a version before revising (files are append-only)
- `millwright research waive <GAP-ID|falsifiedIf> --run <TICKET> --reason "..."` - a named human only
- `millwright research signoff --run <TICKET> --lane <lane>` - tracking only; never blocks the gate

## Delegate To

research-agent (design-agent, qa-planning-agent and ux-context-agent contribute); the
research-reviewer-agent checks the pack at RESEARCH_READY.

## Key Invariants

- I-29: research never writes to source repositories
- I-30: research files are append-only
- I-31: every metric has a baseline and target or a gap; the hypothesis is falsifiable or waived by a named human
