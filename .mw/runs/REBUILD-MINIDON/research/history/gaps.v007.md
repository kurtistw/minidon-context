# Gap Register: REBUILD-MINIDON

Research version 4. Generated from `gaps.json`; edit that, not this.

## PO

### GAP-008 · Competitor or market material not found

- Severity: **weakens** (optional, missing); weakens outcome.json
- Owner source: routed
- Do: Drop competitor or market notes
  - Drop a file at `research/inputs/competitor-material.md`
  - Answer: Notes relevant to the outcome
- Done when: Notes relevant to the outcome
- Discovery checked: research/inputs/ (no file named competitor-material / market-scan / competitors)

## Tech Lead

### GAP-009 · Prior spikes and abandoned attempts not found

- Severity: **weakens** (optional, missing); weakens risks.json
- Owner source: routed
- Do: Drop notes on earlier spikes or attempts
  - Drop a file at `research/inputs/prior-spikes.md`
  - Answer: What was tried and what was learned
- Done when: What was tried and what was learned
- Discovery checked: research/inputs/ (no file named prior-spikes / spikes / abandoned-attempts)

## Closed

- GAP-001 · Baseline metrics not found: resolved at version 4 (research/inputs/baseline-metrics.md)
- GAP-002 · Decision-makers and reviewer roster not found: resolved at version 4 (research/inputs/decision-makers.md)
- GAP-003 · User and customer evidence not found: waived by kurtis.angell@thoughtworks.com: Lift and shift: the problem is the platform, not user need. No new user evidence required.
- GAP-004 · Incident and defect history not found: waived by kurtis.angell@thoughtworks.com: No incident history is available for this demo. Behaviour is copied as-is, so past defects are carried over, not fixed.
- GAP-005 · Compliance and data classification not found: waived by kurtis.angell@thoughtworks.com: Compliance and data classification are unchanged by a like-for-like rebuild. Revisit at cutover.
- GAP-006 · Delivery history not found: waived by kurtis.angell@thoughtworks.com: No prior delivery history exists for this system. The estimate uses stated ranges instead.
- GAP-007 · Design assets not found: waived by kurtis.angell@thoughtworks.com: minidon is a backend API with no screens. There are no designs to rebuild.
- GAP-010 · Is the first-registrant-becomes-Admin behaviour (BR-006) intended production behaviour, or a development convenience that should be environment-gated?: resolved at version 4 (.mw/context/baseline.json)
- GAP-011 · Are the undocumented numeric/algorithmic constants in Accounts (PBKDF2 params, 30-day token TTL, 30/500-char display name/bio limits, 8-char minimum password length) the intended business values, or implementation defaults nobody has reviewed?: resolved at version 4 (.mw/context/baseline.json)
- GAP-012 · Is PBKDF2-HMAC-SHA256 at 100,000 iterations (BR-007) an acceptable password-hashing parameter, given it is below current OWASP guidance for PBKDF2-SHA256 (recommended 600,000+)?: resolved at version 4 (.mw/context/baseline.json)
- GAP-013 · Is it intended business behaviour that blocking an account retroactively deletes any existing follow relationship between the two accounts, in both directions, not just future follows?: resolved at version 4 (.mw/context/baseline.json)
- GAP-014 · Should minidon/social/queries.py be formally documented as a stable cross-capability contract rather than an implicit shared import, given it is consumed directly by five of six capabilities?: resolved at version 4 (.mw/context/baseline.json)
- GAP-015 · Does the business want to adopt "Relationship" (the code's own term for the five-field follow/block/mute status between two accounts) as the official business term, or prefer another name?: resolved at version 4 (.mw/context/baseline.json)
- GAP-016 · Which value is correct for the status edit window: README's documented 30 minutes, or the code's enforced 60 minutes? Should the documentation (and the 2026-10-01 decision record) change, or should the code change?: resolved at version 4 (.mw/context/baseline.json)
- GAP-017 · Should followers-only and direct statuses remain un-boostable even by a viewer who can see them, or should the documentation be updated to describe this restriction (and should README's "boost any status you can see" wording change)?: resolved at version 4 (.mw/context/baseline.json)
- GAP-018 · Is it intended that any staff member can delete any status directly via DELETE /statuses/{id}, independent of Moderation's report-resolve flow, or should staff deletions be expected to always go through a report?: resolved at version 4 (.mw/context/baseline.json)
- GAP-019 · Is the 30-original-posts-per-rolling-hour rate limit (BR-020) an intended, business-reviewed limit?: resolved at version 4 (.mw/context/baseline.json)
- GAP-020 · Are the timeline pagination defaults (20 default page size, 40 maximum) the intended product values, and should clients ever be able to request more than 40?: resolved at version 4 (.mw/context/baseline.json)
- GAP-021 · Do the three notification suppression rules (no self-notification, no notification across a block, no notification while the recipient mutes the actor) match intended product behaviour?: resolved at version 4 (.mw/context/baseline.json)
- GAP-022 · Are the notification list's numeric limits (40 default, 80 maximum) the intended product values?: resolved at version 4 (.mw/context/baseline.json)
- GAP-023 · Is the 1000-character limit on moderation report comments (BR-004) the intended value?: resolved at version 4 (.mw/context/baseline.json)
- GAP-024 · Is the full scope of suspension's effects (revokes all access tokens everywhere, hides the account and its statuses from everyone) as implemented, intended - beyond README's "can no longer sign in"?: resolved at version 4 (.mw/context/baseline.json)
- GAP-025 · Does the implemented staff hierarchy - a moderator cannot suspend themselves, an admin, or another moderator; only an admin can lift a suspension or change roles - match intended policy?: resolved at version 4 (.mw/context/baseline.json)
- GAP-026 · Should Moderation's "delete reported status" resolution action keep calling Posting's soft_delete directly, or go through a narrower moderation-facing API, so the two capabilities' delete semantics can evolve independently?: resolved at version 4 (.mw/context/baseline.json)
- GAP-027 · Should accounts/service.py#get_by_username be formalised as a stable identity-resolution API, given it is the graph's highest in-degree hotspot (18 incoming edges, called from 5 of 6 capability modules)?: resolved at version 4 (.mw/context/baseline.json)
- GAP-028 · Does the domain-map's merge of README's "Posting" and "Interacting" sections into one L1-posting capability (because the code implements both in one package) match what the business means by "Posting"?: resolved at version 4 (.mw/context/baseline.json)
- GAP-029 · If the orphaned Lists feature (minidon/lists/) is ever completed, should it become a new L1 capability, or an L2 sub-capability of Following (since it curates accounts, like Following does)?: resolved at version 4 (.mw/context/baseline.json)
- GAP-030 · What should happen to the orphaned Lists feature (minidon/lists/models.py, minidon/lists/service.py): finish it, remove it, or leave it dormant and unowned?: resolved at version 4 (.mw/context/baseline.json)
