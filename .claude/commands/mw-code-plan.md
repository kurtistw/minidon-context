---
name: Millwright Code Plan
description: Create per-repo implementation plans
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Grep, Task]
---

# /mw-code-plan

> Create per-repo implementation plans

## Usage

```
/mw-code-plan [TICKET]
```

## Instructions

# Code Planning (Activity 03)

Create detailed implementation plans per repository.

## What Code Plan Produces

- `repos/<repo>/plan.md` - Per-file implementation plan with:
  - File path
  - What changes
  - Why (linked to spec requirement)
  - Wave number (build order)

## States Handled

- READY_FOR_DEV → REPO_PLAN
- REPO_PLAN → PLAN_REVIEW (gate)

## Delegate To

code-plan-agent with skills:
- repo-plan-decompose
- wave-order
- change-sizing
- design-context

## Key Invariants

- I-11: Change must be small enough to integrate same day
- I-10: Plans must trace back to approved spec

## Plan Format

```markdown
# Implementation Plan: trip-api

## Wave 1: Contracts
- src/contracts/booking.ts
  - ADD: NewBookingRequest type
  - Why: REQ-001 requires new booking endpoint

## Wave 2: Services
- src/services/booking.service.ts
  - MODIFY: Add createBooking method
  - Why: REQ-001 implementation
```
