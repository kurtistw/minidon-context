---
name: grill-architecture-context
description: Baseline review session with the architect on unparsed repos, cross-repo calls, orphans, unmapped code, integration points, data ownership and architecture conflicts
allowed-tools: [Read, Grep, Glob, Task, Bash(millwright next *), Bash(millwright baseline review *), Bash(millwright baseline comment *), Bash(millwright baseline resolve *)]
disable-model-invocation: true
argument-hint: "<run-id> [L0-domain]"
---

# Grill Architecture Context

Baseline review session with the architect on unparsed repos, cross-repo calls, orphans, unmapped code, integration points, data ownership and architecture conflicts

> **Load the `grilling` skill first** ([Grilling](../grilling/SKILL.md)) and run
> the session by its rules. This skill adds what to cover and where each answer is recorded.

## Usage

Interview the baseline reviewer (architect, tech lead) about the structural side of an
Activity 01 baseline: what was parsed, how the repositories connect, which code belongs to no
capability, and who owns the data that crosses repository boundaries.

### 1. Load the run

The reviewer names the run (`<RUN_ID>`) and may name an L0 domain. Without a run, list
the candidates with `millwright next --all` and ask.

1. `millwright next --run <RUN_ID>`: the run should be at `BASELINE_REVIEW`. At
   `BASELINE_PREP` the review agent has not finished; say so and stop.
2. `millwright baseline review --run <RUN_ID>`: starts or continues the review report and
   shows each domain's status.
3. Read `.mw/runs/<RUN_ID>/baseline-review-report.json` (comments and conflict resolutions
   already recorded; do not ask again what is settled) and `.mw/context/review-findings.md`
   (the baseline-review-agent's findings and its questions for reviewers).
4. Read the structural artifacts:
   - `.mw/context/ingest-report.json`: each repository's `status` (`parsed`,
     `partial`, `failed`), its `reason`, and its `unparsedFiles`
   - `.mw/context/graph-report.json`: `analysis.crossRepoCallPaths` (look for
     `resolved: false`), `analysis.unresolvedReferences`, `analysis.orphans`, and
     `delta.removedNodes`; the graph itself is in `.mw/context/graph/`
   - `.mw/context/domain-map.md`: Unmapped Code, Repository to Capability Mapping,
     Cross-Cutting Concerns, Bounded Contexts (integration style) and Anti-Corruption Layers
   - `.mw/context/capabilities/<CAP-ID>/code-links.json`: components, contracts and
     dependencies; and the Integration Points (APIs, Events) in each `capability.md`
   - `.mw/context/baseline.json`: `repositories` (ingest status), `coverage`
     (`mappedCodePercent`, `unmappedPaths`) and `conflicts`
   - `.mw/context/conflicts.md`: the `boundary-overlap` and `ownership-unclear`
     conflicts, and every `resolved-by-code` one with its evidence
5. Unless the reviewer named a domain, recommend one as Q1 of the first round: the one whose
   repositories have the most unparsed files, unmapped paths and unresolved calls.

### 2. Build the design tree

One branch per:

- repository that is `partial` or `failed`: is the reason acceptable, and does the gap hide
  a capability?
- cross-repo call that did not resolve, and unresolved reference: a missing contract, an
  external service, or a parse gap?
- orphan: dead code, an entry point the graph missed (scheduled job, reflection, message
  handler), or a capability nobody mapped?
- removed node: was the deletion intended?
- unmapped path: legitimately excluded (generated code, fixtures), or business code to assign?
- integration point between repositories: sync API, event or shared database, and is it
  the one the domain map says?
- data that two repositories write: which one is the system of record?
- architecture conflict still `open`, or `resolved-by-code` with evidence that does not
  prove the structural fact it claims

### 3. Run the rounds

Use the grilling technique. Facts about the code are yours to find: read the graph, the
code at the pinned SHA, or send a sub-agent. Ask the reviewer about intent and ownership.
Questions that work well here:

- "`billing` is `partial`: 41 Kotlin files failed to parse (`parse-error`). They hold
  the invoice scheduler. Should that be a coverage gap blocking L0-003?"
- "`orders` calls `inventory` at `/reserve`, but the call did not resolve: inventory has no
  such route at the pinned SHA. Is the route served by the legacy gateway instead?"
- "`src/jobs/Reconcile.java` is an orphan. Is it the nightly settlement job, part of L1-009?"
- "Both `orders` and `fulfilment` write `shipment_status`. Is `fulfilment` the system of
  record?"

### 4. Record each answer as it is settled

| Settled answer | Record with |
|---|---|
| An unparsed repo or unmapped path hides business code | `millwright baseline comment --run <RUN_ID> --domain <L0-ID> --category coverage-gap --severity <severity> --message "<repo>:<path>: <what it is, which capability should own it, evidence>"` |
| An unmapped path is legitimately excluded | same, `--category coverage-gap --severity suggestion`, giving the reason, so the curator records it |
| An orphan or cluster is a missing capability | `--category capability-missing` |
| Code or data is owned by the wrong capability or repository | `--category boundary-wrong` (include the system of record the reviewer named) |
| A reference does not resolve to the code it cites | `--category provenance-unclear` |
| A conflict is settled | `millwright baseline resolve --run <RUN_ID> --conflict CF-002 --resolution "<decision>. Evidence: <repo@sha:path:lines>."` |
| A `resolved-by-code` conflict is really about intent | `--category conflict-unresolved`, naming who decides |
| A term is settled | the glossary note (below) |

Recording rules:

- One command per settled answer, run as soon as the reviewer answers. Never batch them to the
  end of the session.
- `--domain` is the L0 domain the finding belongs to; add `--capability` when it is about
  one capability. Quote the message for the shell.
- Recommend a severity with each question; the reviewer decides it. `blocker` means the
  domain cannot be approved until it is fixed (open blockers stop
  `baseline submit --decision approve`); `major` should be fixed; `minor` can be approved
  with a note; `suggestion` is for later.
- Use only these categories: `rule-incorrect`, `rule-missing`, `boundary-wrong`,
  `capability-missing`, `capability-split`, `capability-merge`, `provenance-unclear`,
  `conflict-unresolved`, `owner-unassigned`, `coverage-gap`, `other`.
- `millwright baseline resolve` closes a conflict for the gate (I-28). Use it only when the
  reviewer has decided it, and put the decision and its evidence in the resolution.
- The commands record the person running them as the reviewer.

A repository-level finding belongs to the L0 domain that owns the repository in the domain
map's Repository to Capability Mapping. If no domain owns it, that is itself a question for
the reviewer.

A settled term is written to `.mw/notes/glossary/<term>.md`, the glossary the
domain-agent keeps: frontmatter `type: glossary`, the canonical term, aliases, the code
terms and where they occur, the capabilities that use it, and `source` naming the reviewer
and the run. Update the existing note rather than creating a duplicate, and keep
implementation detail out of it.

### 5. Close the session

When the frontier is empty for the chosen domain:

1. Summarise what was recorded (comment IDs, resolved conflicts, glossary notes) and what is
   left: other domains, open `blocker` comments, conflicts still unresolved.
2. Ask the reviewer to confirm you share one understanding.
3. If they want to proceed, show them the command and let them run it:
   `millwright baseline signoff --run <RUN_ID> --domain <L0-ID> --status approved` (or
   `--status needs-change`), and, once every domain is signed off,
   `millwright baseline submit --run <RUN_ID>`. Never run either yourself.
