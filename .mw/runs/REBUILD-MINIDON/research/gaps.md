# Gap Register: REBUILD-MINIDON

Research version 2. Generated from `gaps.json`; edit that, not this.

## BA

### GAP-003 · User and customer evidence not found

- Severity: **weakens** (optional, missing); weakens outcome.json
- Owner source: routed
- Do: Drop summaries of interviews, support themes or analytics
  - Drop a file at `research/inputs/user-evidence.md`
  - Answer: Evidence that the problem is real for the affected users
- Done when: Evidence that the problem is real for the affected users
- Discovery checked: research/inputs/ (no file named user-evidence / user-research / interviews)

### GAP-007 · Design assets not found

- Severity: **weakens** (optional, missing); weakens flows/journeys.md
- Owner source: routed
- Do: Link the Figma files or drop existing journey maps
  - Drop a file at `research/inputs/design-assets.md`
  - Answer: Links or files for the affected screens and journeys
- Done when: Links or files for the affected screens and journeys
- Discovery checked: research/inputs/ (no file named design-assets / figma-links / journeys); design/figma-context.json (missing)

## BA / Product (Discovery owner)

### GAP-010 · Is the first-registrant-becomes-Admin behaviour (BR-006) intended production behaviour, or a development convenience that should be environment-gated?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-001
- Do: Answer the discovery open question OQ-001
  - Answer: Is the first-registrant-becomes-Admin behaviour (BR-006) intended production behaviour, or a development convenience that should be environment-gated?
- Done when: OQ-001 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-001)

### GAP-011 · Are the undocumented numeric/algorithmic constants in Accounts (PBKDF2 params, 30-day token TTL, 30/500-char display name/bio limits, 8-char minimum password length) the intended business values, or implementation defaults nobody has reviewed?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-002
- Do: Answer the discovery open question OQ-002
  - Answer: Are the undocumented numeric/algorithmic constants in Accounts (PBKDF2 params, 30-day token TTL, 30/500-char display name/bio limits, 8-char minimum password length) the intended business values, or implementation defaults nobody has reviewed?
- Done when: OQ-002 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-002)

### GAP-013 · Is it intended business behaviour that blocking an account retroactively deletes any existing follow relationship between the two accounts, in both directions, not just future follows?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-004
- Do: Answer the discovery open question OQ-004
  - Answer: Is it intended business behaviour that blocking an account retroactively deletes any existing follow relationship between the two accounts, in both directions, not just future follows?
- Done when: OQ-004 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-004)

### GAP-015 · Does the business want to adopt "Relationship" (the code's own term for the five-field follow/block/mute status between two accounts) as the official business term, or prefer another name?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-006
- Do: Answer the discovery open question OQ-006
  - Answer: Does the business want to adopt "Relationship" (the code's own term for the five-field follow/block/mute status between two accounts) as the official business term, or prefer another name?
- Done when: OQ-006 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-006)

### GAP-016 · Which value is correct for the status edit window: README's documented 30 minutes, or the code's enforced 60 minutes? Should the documentation (and the 2026-10-01 decision record) change, or should the code change?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-007
- Do: Answer the discovery open question OQ-007
  - Answer: Which value is correct for the status edit window: README's documented 30 minutes, or the code's enforced 60 minutes? Should the documentation (and the 2026-10-01 decision record) change, or should the code change?
- Done when: OQ-007 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-007)

### GAP-017 · Should followers-only and direct statuses remain un-boostable even by a viewer who can see them, or should the documentation be updated to describe this restriction (and should README's "boost any status you can see" wording change)?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-008
- Do: Answer the discovery open question OQ-008
  - Answer: Should followers-only and direct statuses remain un-boostable even by a viewer who can see them, or should the documentation be updated to describe this restriction (and should README's "boost any status you can see" wording change)?
- Done when: OQ-008 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-008)

### GAP-018 · Is it intended that any staff member can delete any status directly via DELETE /statuses/{id}, independent of Moderation's report-resolve flow, or should staff deletions be expected to always go through a report?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-009
- Do: Answer the discovery open question OQ-009
  - Answer: Is it intended that any staff member can delete any status directly via DELETE /statuses/{id}, independent of Moderation's report-resolve flow, or should staff deletions be expected to always go through a report?
- Done when: OQ-009 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-009)

### GAP-019 · Is the 30-original-posts-per-rolling-hour rate limit (BR-020) an intended, business-reviewed limit?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-010
- Do: Answer the discovery open question OQ-010
  - Answer: Is the 30-original-posts-per-rolling-hour rate limit (BR-020) an intended, business-reviewed limit?
- Done when: OQ-010 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-010)

### GAP-020 · Are the timeline pagination defaults (20 default page size, 40 maximum) the intended product values, and should clients ever be able to request more than 40?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-011
- Do: Answer the discovery open question OQ-011
  - Answer: Are the timeline pagination defaults (20 default page size, 40 maximum) the intended product values, and should clients ever be able to request more than 40?
- Done when: OQ-011 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-011)

### GAP-021 · Do the three notification suppression rules (no self-notification, no notification across a block, no notification while the recipient mutes the actor) match intended product behaviour?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-012
- Do: Answer the discovery open question OQ-012
  - Answer: Do the three notification suppression rules (no self-notification, no notification across a block, no notification while the recipient mutes the actor) match intended product behaviour?
- Done when: OQ-012 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-012)

### GAP-022 · Are the notification list's numeric limits (40 default, 80 maximum) the intended product values?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-013
- Do: Answer the discovery open question OQ-013
  - Answer: Are the notification list's numeric limits (40 default, 80 maximum) the intended product values?
- Done when: OQ-013 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-013)

### GAP-023 · Is the 1000-character limit on moderation report comments (BR-004) the intended value?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-014
- Do: Answer the discovery open question OQ-014
  - Answer: Is the 1000-character limit on moderation report comments (BR-004) the intended value?
- Done when: OQ-014 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-014)

### GAP-024 · Is the full scope of suspension's effects (revokes all access tokens everywhere, hides the account and its statuses from everyone) as implemented, intended - beyond README's "can no longer sign in"?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-015
- Do: Answer the discovery open question OQ-015
  - Answer: Is the full scope of suspension's effects (revokes all access tokens everywhere, hides the account and its statuses from everyone) as implemented, intended - beyond README's "can no longer sign in"?
- Done when: OQ-015 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-015)

### GAP-025 · Does the implemented staff hierarchy - a moderator cannot suspend themselves, an admin, or another moderator; only an admin can lift a suspension or change roles - match intended policy?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-016
- Do: Answer the discovery open question OQ-016
  - Answer: Does the implemented staff hierarchy - a moderator cannot suspend themselves, an admin, or another moderator; only an admin can lift a suspension or change roles - match intended policy?
- Done when: OQ-016 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-016)

### GAP-028 · Does the domain-map's merge of README's "Posting" and "Interacting" sections into one L1-posting capability (because the code implements both in one package) match what the business means by "Posting"?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-019
- Do: Answer the discovery open question OQ-019
  - Answer: Does the domain-map's merge of README's "Posting" and "Interacting" sections into one L1-posting capability (because the code implements both in one package) match what the business means by "Posting"?
- Done when: OQ-019 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-019)

### GAP-029 · If the orphaned Lists feature (minidon/lists/) is ever completed, should it become a new L1 capability, or an L2 sub-capability of Following (since it curates accounts, like Following does)?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-020
- Do: Answer the discovery open question OQ-020
  - Answer: If the orphaned Lists feature (minidon/lists/) is ever completed, should it become a new L1 capability, or an L2 sub-capability of Following (since it curates accounts, like Following does)?
- Done when: OQ-020 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-020)

### GAP-030 · What should happen to the orphaned Lists feature (minidon/lists/models.py, minidon/lists/service.py): finish it, remove it, or leave it dormant and unowned?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-021
- Do: Answer the discovery open question OQ-021
  - Answer: What should happen to the orphaned Lists feature (minidon/lists/models.py, minidon/lists/service.py): finish it, remove it, or leave it dormant and unowned?
- Done when: OQ-021 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-021)

## BA / Product / Domain modelling (Discovery owner)

### GAP-014 · Should minidon/social/queries.py be formally documented as a stable cross-capability contract rather than an implicit shared import, given it is consumed directly by five of six capabilities?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-005
- Do: Answer the discovery open question OQ-005
  - Answer: Should minidon/social/queries.py be formally documented as a stable cross-capability contract rather than an implicit shared import, given it is consumed directly by five of six capabilities?
- Done when: OQ-005 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-005)

## PO

### GAP-001 · Baseline metrics not found

- Severity: **blocks** (required, missing); weakens outcome.json
- Owner source: routed
- Do: Drop the current measurements (value, date, source) into research/inputs/, or read them through a metrics provider
  - Drop a file at `research/inputs/baseline-metrics.md`
  - Answer: At least one numeric baseline with a date and a source
- Done when: At least one numeric baseline with a date and a source
- Discovery checked: research/inputs/ (no file named baseline-metrics / metrics-baseline / funnel); research/outcome.json (no metric has a sourced, non-weak baseline)

### GAP-002 · Decision-makers and reviewer roster not found

- Severity: **blocks** (required, missing); weakens reviewers.json
- Owner source: routed
- Do: Name the decision-maker and a reviewer per expertise lane, including integration owners
  - Drop a file at `research/inputs/decision-makers.md`
  - Answer: A named accountable owner and at least one named reviewer
- Done when: A named accountable owner and at least one named reviewer
- Discovery checked: research/inputs/ (no file named decision-makers / reviewer-roster / stakeholders); research/outcome.json (no named decision-maker or reviewer)

### GAP-008 · Competitor or market material not found

- Severity: **weakens** (optional, missing); weakens outcome.json
- Owner source: routed
- Do: Drop competitor or market notes
  - Drop a file at `research/inputs/competitor-material.md`
  - Answer: Notes relevant to the outcome
- Done when: Notes relevant to the outcome
- Discovery checked: research/inputs/ (no file named competitor-material / market-scan / competitors)

## Security reviewer (Discovery owner)

### GAP-012 · Is PBKDF2-HMAC-SHA256 at 100,000 iterations (BR-007) an acceptable password-hashing parameter, given it is below current OWASP guidance for PBKDF2-SHA256 (recommended 600,000+)?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-003
- Do: Answer the discovery open question OQ-003
  - Answer: Is PBKDF2-HMAC-SHA256 at 100,000 iterations (BR-007) an acceptable password-hashing parameter, given it is below current OWASP guidance for PBKDF2-SHA256 (recommended 600,000+)?
- Done when: OQ-003 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-003)

## Tech Lead

### GAP-004 · Incident and defect history not found

- Severity: **weakens** (optional, missing); weakens risks.json
- Owner source: routed
- Do: Drop recent incidents and escaped defects for the affected capabilities
  - Drop a file at `research/inputs/incident-history.md`
  - Answer: A list of relevant incidents with dates
- Done when: A list of relevant incidents with dates
- Discovery checked: research/inputs/ (no file named incident-history / incidents / defects)

### GAP-005 · Compliance and data classification not found

- Severity: **weakens** (optional, missing); weakens security.md
- Owner source: routed
- Do: Drop the compliance regimes and the classification of the data this change touches
  - Drop a file at `research/inputs/compliance-context.md`
  - Answer: The regimes and data classes that apply
- Done when: The regimes and data classes that apply
- Discovery checked: research/inputs/ (no file named compliance-context / compliance / data-classification)

### GAP-006 · Delivery history not found

- Severity: **weakens** (optional, missing); weakens estimate.json
- Owner source: routed
- Do: Freeze pre-agentic numbers in .mw/metrics/baseline.json, or drop cycle-time and throughput history
  - Drop a file at `research/inputs/delivery-history.md`
  - Answer: Historical delivery numbers for comparable changes
- Done when: Historical delivery numbers for comparable changes
- Discovery checked: research/inputs/ (no file named delivery-history / cycle-time); .mw/metrics/baseline.json (not frozen yet)

### GAP-009 · Prior spikes and abandoned attempts not found

- Severity: **weakens** (optional, missing); weakens risks.json
- Owner source: routed
- Do: Drop notes on earlier spikes or attempts
  - Drop a file at `research/inputs/prior-spikes.md`
  - Answer: What was tried and what was learned
- Done when: What was tried and what was learned
- Discovery checked: research/inputs/ (no file named prior-spikes / spikes / abandoned-attempts)

## Tech Lead (Discovery owner)

### GAP-026 · Should Moderation's "delete reported status" resolution action keep calling Posting's soft_delete directly, or go through a narrower moderation-facing API, so the two capabilities' delete semantics can evolve independently?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-017
- Do: Answer the discovery open question OQ-017
  - Answer: Should Moderation's "delete reported status" resolution action keep calling Posting's soft_delete directly, or go through a narrower moderation-facing API, so the two capabilities' delete semantics can evolve independently?
- Done when: OQ-017 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-017)

### GAP-027 · Should accounts/service.py#get_by_username be formalised as a stable identity-resolution API, given it is the graph's highest in-degree hotspot (18 incoming edges, called from 5 of 6 capability modules)?

- Severity: **weakens** (optional, unverified); weakens outcome.json
- Owner source: discovery:open-question OQ-018
- Do: Answer the discovery open question OQ-018
  - Answer: Should accounts/service.py#get_by_username be formalised as a stable identity-resolution API, given it is the graph's highest in-degree hotspot (18 incoming edges, called from 5 of 6 capability modules)?
- Done when: OQ-018 is answered or deferred in .mw/context/baseline.json
- Discovery checked: .mw/context/baseline.json (open question OQ-018)
