# Human decisions for the research revision

Recorded on 2026-11-12 in response to research review 001 (`research/reviews/research-review-001.md`).
Decision owner: kurtis. DEMO ASSUMPTION: in a real team these would come from the named PO, BA and
Tech Lead.

## 1. Parity target

- The parity denominator is **80 rules**: 81 baseline rules minus the retired `L1-posting/BR-009`.
- Rules are counted and cited by capability plus id (for example `L1-accounts/BR-006`), because ids
  repeat across capabilities.
- The earlier CON-002 ("Notifications has 10 rules") is withdrawn. Notifications has 9.

## 2. The authority for baseline decisions

- The human baseline gate record is the authority: `.mw/runs/BASELINE-2026-10-30/baseline-review-report.json`
  and `.mw/context/baseline-review-report.md`.
- The earlier DEMO answers in `baseline.json` have been replaced with the gate answers. Where the
  pack deferred a question to design (OQ-005, OQ-017, OQ-018), the gate answer applies instead.
- `baseline.json` fields `status`, `confirmedBy` and the conflicts list were not updated after the
  gate. That is a known housekeeping gap and does not change the decisions.

## 3. Follow-ups from the gate answers (out of scope for this lift and shift)

Parity copies today's behaviour, so these are recorded, not built here:
- Secure admin seeding by env or CLI (OQ-001, instance takeover risk).
- Raise the minimum password length from 8 to 12 (OQ-002).
- Raise password hashing to OWASP level, or argon2id, with rehash on login (OQ-003).
- Audit trail for staff deletes (OQ-009).
- Test guard for new notification kinds (OQ-012).
- README updates (OQ-010, OQ-015, CF-007) and repair of ADR-001 (CF-001).
- Delete the dead `minidon/lists/` code (CF-002). It is not ported.
- Adopt "Relationship" as the official business term (OQ-006).

Decisions from the gate that the Rust build must honour: `L1-accounts` owns the stable identity API
`get_by_username` (CF-004); Moderation may call Posting's `soft_delete` directly and the boost
cascade is intended (CF-006); `social/queries.py` stays a plain import owned by `L1-following` (CF-003).

## 4. DERIVED rules

- 64 of the 81 rules are DERIVED or mixed, and 17 are purely STATED (see `baseline-metrics.md`).
- Decision: the L0-minidon domain sign-off at the baseline gate on 2026-11-10 is treated as human
  confirmation of the DERIVED rules. Parity tests check what the Python code does, so this does not
  change the test approach.

## 5. Username with a trailing newline (review 002, N-01)

- Finding: Python's username pattern `^[a-z0-9_]{1,30}$` lets `"alice\n"` register as a separate
  account from `"alice"`, because `$` also matches before a final newline
  (`minidon/accounts/service.py:17`). This breaks the STATED rule `L1-accounts/BR-001` in spirit and
  allows look-alike accounts.
- Decision (DEMO, made on 2026-11-13 by kurtis): **copy the behaviour for parity.** The Rust build
  accepts a username with one trailing newline, as Python does. This is a lift and shift, and the
  same reasoning applies as for the other known weaknesses in section 3.
- Required: a parity test with a username that has a trailing newline, and an explicit note in the
  Rust implementation that this is deliberate (a pattern ending in an optional newline before end
  of input).
- Follow-up (out of scope here): reject usernames with a trailing newline in both builds, as a
  defect fix after cutover.
- Design input: the regex engine choice (ADR candidate 1) must be able to express this.

## 6. Still open

- **The business reason for moving to Rust is not stated.** The PO needs to supply it. Until then it
  stays a recorded risk (RISK-005).
