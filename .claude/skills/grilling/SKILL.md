---
name: grilling
description: Interview a human reviewer in numbered rounds, with a recommended answer per question, until you share one understanding. The core technique the baseline review grilling skills use.
allowed-tools: [Read, Grep, Glob, Task]
---

# Grilling

Interview a human reviewer in numbered rounds, with a recommended answer per question, until you share one understanding. The core technique the baseline review grilling skills use.

## Usage

Adapted from the `grilling` and `domain-modeling` skills in github.com/mattpocock/skills (MIT License, Copyright (c) 2026 Matt Pocock). See THIRD_PARTY_NOTICES.md in the Millwright repository.

### What a session is

You interview the human reviewer of an Activity 01 baseline, relentlessly, until you and they
share one understanding of what the context agents derived. You bring the evidence; the
reviewer makes the decisions. A context skill (`grill-business-context`,
`grill-architecture-context`) says what to cover and where each answer is recorded.

### The design tree

Every item under review is a branch: a `DERIVED` rule, a conflict, an unmapped region, an
orphan, an unparsed repository, a fuzzy term, an open question without an owner. Branches
depend on each other: deciding that a capability belongs to another domain settles who owns
its unmapped paths. Keep the tree in your working notes and show the open branches whenever
the reviewer asks.

### Rounds

1. The **frontier** is every question whose prerequisites are settled: what you can ask now
   without guessing at an answer you have not heard yet. A question that depends on another
   question in the same round waits for a later round.
2. Ask the whole frontier in one round, numbered (Q1, Q2, …) so the reviewer can answer by
   number. If the frontier is too large for one sitting (dozens of rules), say how large it
   is and ask it in parts, starting with the questions that unblock the most branches.
3. Give your recommended answer for every question, with its evidence:
   `repo@sha:path:lines` where the code says it, otherwise the artifact path or document
   reference.
4. Word each question so that "yes" accepts your recommendation.
5. Say what each answer will record (the command, or the glossary note).
6. Stop and wait. Do not assume an answer, and do not move on without one.
7. Record each settled answer the moment it is given, one record per answer, then recompute
   the frontier and ask the next round.

A round looks like this:

```
Round 2 · L0-002 Payments

Q1 · Refund approval threshold
BR-003 (L1-004 Refunds) says refunds above 500 GBP need a second approver. It is DERIVED
from payments@4f2a9c1:src/refund/RefundPolicy.java:41-58; no document states it.
Is this the intended business rule?
Recommended: yes, and record the confirmation for the BA agent.
Records: millwright baseline comment … --category other --severity suggestion

Q2 · …
```

### Facts are yours, decisions are theirs

Never ask the reviewer for something you can look up: what the code does, which repository
calls which, what a document says, whether a file exists at the pinned SHA. Read the
artifacts and the code yourself, or send a read-only sub-agent to find it. A lookup in
flight blocks only the questions that depend on it; ask the rest of the frontier now. Put to
the reviewer only what needs their judgement: intent, meaning, ownership, severity, and
whether a boundary is right.

### Sharpen the language

- **Challenge terms against the glossary** in `.mw/notes/glossary/`. When the reviewer
  uses a term differently from its note, say so at once: "The glossary defines Account as the
  billing entity, but you seem to mean the login. Which is it?"
- **Replace fuzzy words with one canonical term**: "Customer or User? The code has both."
- **Stress-test with concrete scenarios** that probe the edges: "An order is part-shipped
  and the customer cancels. Does BR-004 refund the shipped lines too?"
- **Cross-check what the reviewer says against the code.** When they disagree, show the
  evidence and ask which is right. Never silently prefer either; a disagreement the reviewer
  cannot settle now becomes an open question with an owner.

### Ground rules

- Activity 01 writes only under `.mw/` (I-01). You never edit source repositories, and you
  never edit `.mw/context/` artifacts directly: answers go through the review commands
  the context skill names.
- Behaviour read from code stays `DERIVED` (I-05). Never relabel a rule `STATED`
  yourself; a reviewer's confirmation is recorded as a comment naming them.
- You never decide a gate (I-23, I-27). Never run `millwright baseline signoff`,
  `millwright baseline submit` or `millwright transition`. You may show the reviewer the
  exact command to run themselves.
- The session ends when the frontier is empty for the scope the reviewer chose: every branch
  visited, nothing silently assumed. Summarise what was recorded and what is left, and ask the
  reviewer to confirm you share one understanding before anything else acts on it.
