---
name: Millwright Context Build
description: Build or refresh the capability baseline (Activity 01, codebase source)
user-invocable: true
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Task]
---

# /mw-context

> Build or refresh the capability baseline (Activity 01, codebase source)

## Usage

```
/mw-context build | /mw-context refresh
```

## Instructions

# Activity 01: Context Building

Context source: **codebase** — Analyse the configured repositories.
This playbook is generated from `millwright.config.yaml` by `millwright sync`; change the config and re-sync rather than editing it.

## Build

### 1. Find or create the baseline run

Run `millwright run list --active --type baseline` to find a baseline run whose state is not `BASELINE_CONFIRMED`. If there is one, resume it from its current state (`millwright next --run <RUN_ID>`) in the pipeline below. Otherwise create one:

```
millwright context build --yes
```

This writes `run.json` and the first ledger entry. Note the run id it prints; it is `<RUN_ID>` below.

### 2. Run the pipeline

Path for this source: `CREATED` → `INGEST` → `GRAPH` → `DOMAIN_MAP` → `BRD_DRAFT` → `BASELINE_PREP` → `BASELINE_REVIEW` → `BASELINE_CONFIRMED`

#### 1. `INGEST`

- Delegate to the `ingestion-agent` subagent: Discover and index source repositories, identifying file types, languages, entry points, and project structure for baseline runs.
- Delivers: `.mw/context/ingest-report.json`
- Then: `millwright transition --run <RUN_ID> --to GRAPH` (the agent records this when it finishes)

#### 2. `GRAPH`

- Delegate to the `graph-agent` subagent: Build code graph from static analysis including calls, dependencies, and inheritance relationships.
- Delivers: `.mw/context/graph/`, `.mw/context/graph-report.json`
- Then: `millwright transition --run <RUN_ID> --to DOMAIN_MAP` (the agent records this when it finishes)

#### 3. `DOMAIN_MAP`

- Delegate to the `domain-agent` subagent: Extract domain concepts and business terms and map code to capabilities, listing any code that belongs to no capability.
- Delivers: `.mw/context/domain-map.md`, `.mw/context/capabilities/*/code-links.json`, `.mw/notes/glossary/*.md`
- Then: `millwright transition --run <RUN_ID> --to BRD_DRAFT` (the agent records this when it finishes)

#### 4. `BRD_DRAFT`

- Delegate to the `ba-agent` subagent: Business Analyst agent that drafts capability documentation and rule traces from the domain map, graph, and existing docs.
- Delivers: `.mw/context/capabilities/*/capability.md`, `.mw/context/capabilities/*/rules-trace.md`
- Then: `millwright transition --run <RUN_ID> --to BASELINE_PREP` (the agent records this when it finishes)

#### 5. `BASELINE_PREP`

- Delegate to the `context-curator-agent` subagent: Reconcile context sources without picking a winner, list conflicts, and compile baseline.json with every open question owned.
- Delegate to the `baseline-review-agent` subagent: Prepare baseline for human review by validating completeness, verifying provenance, analyzing conflicts, and identifying coverage gaps.
- Delivers: `.mw/context/baseline.json`, `.mw/context/conflicts.md`, `.mw/context/review-findings.md`, `.mw/context/baseline-review-report.md`
- Then: `millwright transition --run <RUN_ID> --to BASELINE_REVIEW` (the agent records this when it finishes)

#### 6. `BASELINE_REVIEW` — human gate: Baseline Review

**Stop here.** Domain expert reviews baseline for completeness, provenance, and conflict resolution. All domains must be signed off and all conflicts resolved.

- Reviewers: domain-expert
- They examine: `domain-map.md`, `capabilities/*/capability.md`, `conflicts.md`, `baseline.json`, `review-findings.md`, `baseline-review-report.md`
- They decide with `millwright baseline review` / `millwright baseline submit --run <RUN_ID>`.
- Approve → `BASELINE_CONFIRMED`.
- Reject → `BASELINE_NEEDS_MODIFICATION`. The run returns to `BRD_DRAFT` once the rework below is done, and continues from there:
  - Delegate to the `ba-agent` subagent: Business Analyst agent that drafts capability documentation and rule traces from the domain map, graph, and existing docs.

The run ends at `BASELINE_CONFIRMED`.

## Refresh

A refresh run follows the same pipeline with run type `refresh`: each agent limits itself to what changed since the confirmed baseline (by repo SHA or source timestamp) and records what it re-used.

## Outputs

| Artifact | Produced by | State | Template |
|---|---|---|---|
| `.mw/context/ingest-report.json` | `ingestion-agent` | `INGEST` | `.mw/templates/01-context/ingest-report.template.json` |
| `.mw/context/graph/` | `graph-agent` | `GRAPH` | — |
| `.mw/context/graph-report.json` | `graph-agent` | `GRAPH` | `.mw/templates/01-context/graph-report.template.json` |
| `.mw/context/domain-map.md` | `domain-agent` | `DOMAIN_MAP` | `.mw/templates/01-context/domain-map.template.md` |
| `.mw/context/capabilities/*/code-links.json` | `domain-agent` | `DOMAIN_MAP` | `.mw/templates/01-context/code-links.template.json` |
| `.mw/notes/glossary/*.md` | `domain-agent` | `DOMAIN_MAP` | — |
| `.mw/context/capabilities/*/capability.md` | `ba-agent` | `BRD_DRAFT` | `.mw/templates/01-context/capability.template.md` |
| `.mw/context/capabilities/*/rules-trace.md` | `ba-agent` | `BRD_DRAFT` | `.mw/templates/01-context/rules-trace.template.md` |
| `.mw/context/baseline.json` | `context-curator-agent` | `BASELINE_PREP` | `.mw/templates/01-context/baseline.template.json` |
| `.mw/context/conflicts.md` | `context-curator-agent` | `BASELINE_PREP` | `.mw/templates/01-context/conflicts.template.md` |
| `.mw/context/review-findings.md` | `baseline-review-agent` | `BASELINE_PREP` | `.mw/templates/01-context/review-findings.template.md` |
| `.mw/context/baseline-review-report.md` | `baseline-review-agent` | `BASELINE_PREP` | `.mw/templates/01-context/baseline-review-report.template.md` |

## Rules

- **I-01**: Activity 01 writes only to `.mw/context/`, `.mw/runs/<RUN_ID>/`, `.mw/notes/glossary/`; never to source repositories or context sources.
- **I-05**: Inferred behaviour is labelled `DERIVED`, never asserted as `STATED`.
- **I-14**: No agent reviews its own work.
- **I-23**: Stop at every human gate; never record a gate decision yourself.
