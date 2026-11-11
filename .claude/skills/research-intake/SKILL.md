---
name: research-intake
description: Check research inputs against discovery and record gaps as actionable work
allowed-tools: [Read, Grep, Bash]
---

# Research Intake

Check research inputs against discovery and record gaps as actionable work

## Usage

Run `millwright research scan --run <ID>` to check the input catalog against the discovery output and `research/inputs/`.
Read `research/gaps.json`. Every gap needs an owner, a concrete way to supply it (a file to drop, a provider verb, or a question) and an acceptance condition.
Never guess a missing input. Never waive a blocking gap yourself: a named human does, with `millwright research waive`.
Re-scan only when asked: `millwright research scan` is explicit, never automatic.
