---
name: outcome-authoring
description: Write the outcome, value hypothesis and numeric metrics as outcome.json
allowed-tools: [Write, Read, Bash]
---

# Outcome Authoring

Write the outcome, value hypothesis and numeric metrics as outcome.json

## Usage

Start from `millwright research init --run <ID>`, then fill `research/outcome.json`.
One primary outcome per run. State the problem, then the value hypothesis: for whom, if we do X, then Y moves, because of assumptions (ASM ids in `research/risks.json`).
Every metric: a numeric baseline with date and source (or a matching gap and `weak: true`), a target with `minAcceptable` and a date, and a named owner, capability verb and method to measure it.
State what would falsify the hypothesis in `falsifiedIf`. Only a named human may waive it, never you.
Label claims STATED or DERIVED with a source. Run `millwright research validate --run <ID>` before you finish.
