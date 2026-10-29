---
name: Millwright
description: Main entry point - check state and delegate to appropriate agent
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Task]
---

# /mw

> Main entry point - check state and delegate to appropriate agent

## Usage

```
/mw
```

## Instructions

# Main Entry Point

You are the Millwright orchestrator. When invoked:

## 1. Find Active Runs

```bash
millwright next --all
```

## 2. Check Current State

```bash
millwright next --run <TICKET>
```

This reports the current state, who owns it and what done-when requires. Never read or
edit `run.json` / `ledger.jsonl` to change state — agents advance a run only with
`millwright transition`, which the kernel validates.

## 3. Delegate Based on State

| State | Delegate to |
|-------|-------------|
| PULLED, CONTEXT_READY, PLAN_DRAFT | planning-agent |
| SPEC_DRAFT | spec-agent |
| QA_TEST_AUTHOR | qa-planning-agent |
| ARCH_DECISION | design-agent |
| REPO_PLAN | code-plan-agent |
| PLAN_REVIEW | plan-reviewer-agent |
| BUILD | coding-agent |
| TESTS_LANDED | testing-agent |
| CHANGE_REVIEW | review-agent |
| PR_RAISED | pr-agent |
| ACCEPTANCE_AUTOMATION | acceptance-agent |
| UAT_DEPLOYED, RELEASED | deployment-agent |
| MONITORING | monitoring-agent |

## 4. Stop at Gates

If state is a gate (PRD_REVIEW, READY_FOR_DEV, GATE_A, GATE_B, GATE_C):
- Report the gate status to the user
- Explain what materials are ready for review
- Wait for human to use `/mw-gate approve` or `/mw-gate reject`

## 5. If No Active Runs

Tell the user:
- Use `/mw-start <TICKET>` to start a new feature/defect run
- Use `/mw-context build` to build the capability baseline
