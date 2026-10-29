---
name: Millwright Gate
description: Record human gate decision (approve or reject)
user-invocable: true
allowed-tools: [Read, Bash]
---

# /mw-gate

> Record human gate decision (approve or reject)

## Usage

```
/mw-gate approve | /mw-gate reject <reason> --category <category>
```

## Instructions

# Gate Decision (Human Only)

This command records a human gate decision. Gates require human approval per I-23, and
every decision names the human who made it. Only run it when the user has explicitly
decided; ask for their name or handle if you don't know it. Never decide a gate yourself.

## Approve

`/mw-gate approve`

1. Run `millwright next --run <TICKET>` to confirm the run is at a gate
   (PRD_REVIEW, READY_FOR_DEV, GATE_A, GATE_B, GATE_C) and to see the next state
2. Record the decision:
```bash
millwright transition --run <TICKET> --to <NEXT_STATE> --trigger gate.approve --actor <human-name>
```

## Reject

`/mw-gate reject "Missing rollback plan" --category missing-rollback`

Categories: missing-rollback, spec-drift, test-layer-mismatch, scope-too-large, contract-unresolved, security-unassessed, provenance-missing, other

```bash
millwright transition --run <TICKET> --to <GATE>_NEEDS_MODIFICATION --trigger gate.reject \
  --actor <human-name> --reason "Missing rollback plan" --category missing-rollback
```

The kernel validates the transition, increments the attempt counters and appends the
ledger entry. Never edit `run.json` or `ledger.jsonl` directly.
