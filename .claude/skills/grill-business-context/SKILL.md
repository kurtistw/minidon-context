---
name: grill-business-context
description: Baseline review session with the domain expert or BA on capabilities, DERIVED rules, the domain map, glossary, open-question owners and business conflicts
allowed-tools: [Read, Grep, Glob, Task, Bash(millwright next *), Bash(millwright baseline review *), Bash(millwright baseline comment *), Bash(millwright baseline resolve *)]
disable-model-invocation: true
argument-hint: "<run-id> [L0-domain]"
---

# Grill Business Context

Baseline review session with the domain expert or BA on capabilities, DERIVED rules, the domain map, glossary, open-question owners and business conflicts

> **Load the `grilling` skill first** ([Grilling](../grilling/SKILL.md)) and run
> the session by its rules. This skill adds what to cover and where each answer is recorded.

## Usage

Interview the baseline reviewer (domain expert, business analyst, product owner) about
the business side of an Activity 01 baseline: capabilities and their rules, the domain map,
the language, and who owns the open questions.

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
4. Read the business artifacts for the domain:
   - `.mw/context/domain-map.md`: the L0 domains, the L1 capabilities under them, and the
     Domain Boundaries section
   - `.mw/context/capabilities/<CAP-ID>/capability.md`: the BRD for each capability
     (written in `BRD_DRAFT`): Business Rules with their `STATED`/`DERIVED` label and
     confidence, Stakeholders, Edge Cases, Open Questions
   - `.mw/context/capabilities/<CAP-ID>/rules-trace.md`: the code and document evidence for
     each rule
   - `.mw/context/baseline.json`: `openQuestions` (owner, status) and `conflicts`
   - `.mw/context/conflicts.md`: every disagreement between the code pass and the
     documents, with its status
   - `.mw/notes/glossary/`
5. Unless the reviewer named one, recommend a domain as Q1 of the first round: the one with
   the most `DERIVED` rules and open conflicts.

### 2. Build the design tree

One branch per:

- `DERIVED` rule in the domain, lowest confidence first; above all, rules where the
  documents and the code disagree
- rule labelled `STATED` with no document reference (an I-05 problem)
- business conflict in `conflicts.md` still `open` (`rule-disagreement`,
  `ownership-unclear`), or marked `resolved-by-code` although it is about meaning rather
  than a structural fact
- L0/L1 boundary that looks wrong: a capability that fits two domains, or one that should be
  split or merged
- term the business and the code name differently, or that has no glossary note
- open question with no owner, or with the wrong one
- capability the domain should have but the map does not ("what does this domain do that is
  not listed here?")

### 3. Run the rounds

Use the grilling technique. Questions that work well here:

- "BR-003 is DERIVED from `<repo@sha:path:lines>`. Is it the intended rule?"
- "The policy document says 30 days; the code enforces 14 (CF-004). Is 30 days right, so
  the code is the defect?"
- "L1-007 Loyalty sits under Payments. Should it move to Customer?"
- "Docs say Member, code says `Account`. Is Member the canonical term?"
- "Q-012 has no owner. Is the Payments product owner the right one?"

### 4. Record each answer as it is settled

| Settled answer | Record with |
|---|---|
| The rule is wrong | `millwright baseline comment --run <RUN_ID> --domain <L0-ID> --capability <CAP-ID> --category rule-incorrect --severity <severity> --message "BR-003: <what is wrong, what is right, evidence>"` |
| A rule is missing | same, `--category rule-missing` |
| The boundary is wrong | `--category boundary-wrong`, or `capability-split` / `capability-merge` / `capability-missing` |
| A rule has no traceable source | `--category provenance-unclear` |
| An open question needs an owner | `--category owner-unassigned`, naming the owner the reviewer chose |
| A `DERIVED` rule is confirmed as intended | `--category other --severity suggestion --message "BR-003 (<CAP-ID>) confirmed as intended business behaviour by the reviewer of this comment. Relabel STATED with the reviewer as its source (I-05), or keep DERIVED if a document reference is required."` |
| A conflict is settled | `millwright baseline resolve --run <RUN_ID> --conflict CF-004 --resolution "<decision>. Evidence: <repo@sha:path:lines or document reference>."` |
| A conflict the reviewer cannot settle yet | `--category conflict-unresolved`, naming who decides |
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

**Confirming a `DERIVED` rule.** No command relabels a rule, and you never edit
`capability.md` or `rules-trace.md`. The confirmation is a comment the ba-agent applies when
the baseline goes back for modification. Tell the reviewer that if they approve the baseline
without rework, the rule stays `DERIVED` in this baseline.

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
