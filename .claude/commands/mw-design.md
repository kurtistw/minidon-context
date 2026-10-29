---
name: Millwright Design
description: Author ADRs and architectural decisions
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Task]
---

# /mw-design

> Author ADRs and architectural decisions

## Usage

```
/mw-design [TICKET]
```

## Instructions

# Design (Activity 02)

Handle architectural decisions for a run.

## What Design Produces

- `adr/adr-NNNN.md` - Architecture Decision Records
- `design/threat-model-delta.md` - STRIDE-lite threat analysis

## States Handled

- ARCH_DECISION state when architectural choices needed

## Delegate To

design-agent with skills:
- adr-authoring
- threat-model-delta

## ADR Format

```markdown
# ADR-0001: Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue?

## Decision
What was decided?

## Consequences
What are the trade-offs?
```
