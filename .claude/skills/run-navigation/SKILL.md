---
name: Run Navigation
description: Navigate Millwright states and transitions
allowed-tools: [Bash]
---

# Run Navigation

Navigate Millwright states and transitions

## Usage

Millwright is a runtime harness: the CLI owns run state, and the kernel validates every change.

- **Read state**: `millwright next --run <TICKET>` — current state, who owns it, what done-when requires
- **Advance state**: `millwright transition --run <TICKET> --to <STATE> --actor <your-agent-id> [--artifacts <paths>]`
- **Check policy**: `millwright check --run <TICKET>` — the same checks CI runs
- **Artifacts**: write them under `.mw/runs/<TICKET>/`

Never edit `.mw/runs/<TICKET>/run.json` or `ledger.jsonl` by hand — `millwright transition` is the only
way state changes, and it appends the ledger entry. If a transition is rejected, fix the cause it
reports rather than working around it. Stop at gate states: only a human decides a gate (I-23).
