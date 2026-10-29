---
name: Millwright Start
description: Start a new feature or defect run
user-invocable: true
allowed-tools: [Read, Write, Glob, Bash]
---

# /mw-start

> Start a new feature or defect run

## Usage

```
/mw-start <TICKET> [--type feature|defect]
```

## Instructions

# Start New Run

Create a new run for a ticket.

## Usage

`/mw-start TICKET-123` - Start feature run (default)
`/mw-start TICKET-123 --type defect` - Start defect run

## Steps

1. Check whether the run already exists: `millwright next --run TICKET-123`
   - If it does, report its current state and suggest `/mw` to resume

2. Create the run (this writes `run.json` and the ledger's genesis entry):
```bash
millwright run new TICKET-123 --type feature
```

3. If ticket provider configured, fetch ticket details to `.mw/runs/TICKET-123/ticket.md`

4. Delegate to planning-agent to begin Activity 02
