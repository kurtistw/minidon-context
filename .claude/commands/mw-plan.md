---
name: Millwright Plan
description: Resume or check planning work
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Task]
---

# /mw-plan

> Resume or check planning work

## Usage

```
/mw-plan [TICKET]
```

## Instructions

# Planning (Activity 02)

Resume planning work on a run.

## What Planning Produces

- `ticket.md` - Cached ticket snapshot
- `impact.json` - Capability/service impact analysis
- `plan-onepager.md` - BA-readable plan (no code paths)
- `open-points.md` - Routed open questions with owners

## States Handled

- PULLED → CONTEXT_READY: Map ticket to capabilities
- CONTEXT_READY → PLAN_DRAFT: Draft the one-pager
- PLAN_DRAFT → PRD_REVIEW: Submit for BA/PO review

## Delegate To

planning-agent with skills:
- capability-resolve
- issue-hierarchy
- onepager-craft
- open-point-routing

## Key Invariants

- I-06: Story must resolve to exactly one capability
- I-07: One-pager must be approvable without opening codebase
