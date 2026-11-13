# One-pager: REBUILD-MINIDON, story 1 of 6 - Accounts

Status: DRAFT for PRD review. Owner: planning-agent. Label key: STATED means a person or the ticket said it. DERIVED means inferred by an agent and open to challenge (I-05).

## 1. What we are doing

STATED: Minidon, today written in Python, is rebuilt in Rust as a lift and shift. Same behaviour, same data, no new features. The Python version stays unchanged and is the reference. The Rust version lives in a new repository, minidon-rust.

DERIVED: The work is one epic split into six stories, one per capability. This one-pager covers story 1, the Accounts capability (registration, sign-in, profile). Accounts goes first because every other capability depends on knowing who a user is.

## 2. Capability and scope

- Capability: Accounts (L1-accounts). DERIVED: it is the only capability this story touches (one story, one capability).
- STATED: 14 live Accounts rules are in scope, BR-001 to BR-014. None is retired.
- DERIVED: of the 14, 12 were inferred from the code and 2 are purely STATED (BR-001 and BR-009 in the Accounts list). STATED: the domain sign-off at the baseline gate on 2026-11-10 is treated as human confirmation of the inferred rules.
- STATED: Accounts owns the stable "find a user by username" service that other capabilities use. Its Rust shape is decided at design.
- Out of scope: new behaviour, cutover, parallel running and retiring the Python version (separate ticket).

## 3. Whole epic at a glance

- STATED: the parity target is 80 rules. That is 81 baseline rules minus one retired rule (Posting BR-009, retired at the baseline gate).
- DERIVED follow-on order after Accounts: Following, Posting, Timelines, Notifications, Moderation. Plus a platform story (app wiring, errors, configuration, data layer) and a parity-harness story. The exact order is open (see open points OP-04).
- DERIVED effort, a judgement and not calibrated (no delivery history exists): agentic 16 to 34 person-days, traditional 34 to 79 person-days, human effort only. Accounts is one of six capability slices at about 2 to 4 human days each.

## 4. How we will know it works (acceptance)

- STATED: every live rule has a parity test that passes against the Rust build. For this story: 14 of 14 Accounts rules.
- DERIVED: each parity test must first pass against the Python reference, so the Python version acts as the judge of correct behaviour.
- STATED: the Rust build runs on existing data with zero migrations.
- STATED (human decision, 2026-11-13): a username with one trailing newline is accepted in Rust exactly as Python accepts it. This looks like a defect (it lets look-alike accounts exist next to the plain one), but it is copied on purpose for parity. A parity test for it is required, and the Rust code must say it is deliberate. Rejecting such names is a follow-up fix after cutover, outside this story.

## 5. Known weaknesses copied on purpose

STATED (baseline gate decisions): parity copies today's behaviour, including weak points. These are recorded as follow-ups and not built here: how the first admin is created, an 8-character minimum password, the current password hashing strength, no audit trail for staff deletes.

DERIVED (from the security review, accepted into design): no sign-in throttling, a way to discover which usernames exist, no limit on request size, and some cases where Python returns a server error. These are carried forward as design inputs, not fixed here.

## 6. Decisions already made by a human

1. Parity target is 80 rules (BR-009 of Posting retired).
2. Baseline gate answers are the authority for what "current behaviour" means.
3. Trailing-newline username is copied (section 4).
4. Eight major findings from the security and flows reviews are accepted into design and planning. STATED: this does not mean they are fixed. They must be worked through before the build starts.

## 7. Main risks (DERIVED, from research)

- Data stored by the Python version could be read or written differently by Rust (enum values, date text, password hash format). Guard: zero migrations, checked on a real data copy.
- Text handling differs between Python and Rust (patterns, character counts, upper and lower case). Matters for username rules.
- Behaviour that is not a business rule (error message shapes, documentation pages) is not yet specified. Parity is undefined there until decided.
- About 31 of the 81 rules have no existing Python test, so tests are written from the rule descriptions.
- STATED: the business reason for moving to Rust is not recorded. The product owner must supply it.
- One person holds every decision and review role in this demo setup, which weakens independent review.

## 8. What happens next

PRD review (human gate) approves this plan or sends it back. Then design settles the Rust platform and the data-compatibility approach, then specification, code planning and build for Accounts. This one-pager does not decide any gate.

## 9. Open points

All open points are listed with an owner in the open points file for this run: 10 items, each routed to the BA, Tech Lead or PO.
