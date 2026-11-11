# CLAUDE.md

This project uses Millwright for structured agentic development.

## Configuration

- Project: minidon
- Profile: baseline/default@0.1.0
- Spec Framework: none

## How Millwright Works

Millwright is a runtime harness: the CLI owns run state, and the kernel validates every change.

- **Read state**: `millwright next --run <TICKET>` — current state, who owns it, what done-when requires
- **Advance state**: `millwright transition --run <TICKET> --to <STATE> --actor <your-agent-id> [--artifacts <paths>]`
- **Check policy**: `millwright check --run <TICKET>` — the same checks CI runs
- **Artifacts**: write them under `.mw/runs/<TICKET>/`

Never edit `.mw/runs/<TICKET>/run.json` or `ledger.jsonl` by hand — `millwright transition` is the only
way state changes, and it appends the ledger entry. If a transition is rejected, fix the cause it
reports rather than working around it. Stop at gate states: only a human decides a gate (I-23).

A `PreToolUse` hook (`.claude/settings.json`) runs `millwright hook pre-tool-use` before file
writes and shell commands, and blocks calls that would break I-01, I-14 or I-15.

## Key Invariants

- **I-01**: Activity 01 never writes to source repositories
- **I-05**: Derived behaviour is labelled `DERIVED`, never asserted as `STATED`
- **I-14**: No agent reviews its own work
- **I-15**: Agents raise PRs but never merge them
- **I-23**: Every gate decision requires a human (stop at gate states)

## Repositories

- minidon (backend, Python, read-only reference): /Users/kurtis/tw/test-mw/minidon
- minidon-rust (backend, Rust rebuild target): /Users/kurtis/tw/test-mw/minidon-rust
