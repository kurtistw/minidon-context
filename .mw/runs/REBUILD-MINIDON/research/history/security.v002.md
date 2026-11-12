# Security: REBUILD-MINIDON

> **Lane note.** This file belongs to the RESEARCH_SECURITY branch, owned by **design-agent**.
> It was drafted by **research-agent**, not by design-agent, and revised by research-agent on
> 2026-11-12 after research review 001. design-agent has not reviewed or extended it, and the
> RESEARCH_SECURITY branch is still open. A design-agent lane review should check:
> (1) that each STRIDE row's impact and likelihood hold up, with no threat missing for the
> Rust stack (for example unsafe code, panics as denial of service, header parsing);
> (2) that the controls are testable as written, especially the 409 and 429 cases and the
> Unicode visibility cases in rows 4 and 8; (3) that the gate follow-ups below are complete
> against the gate record; (4) the supply-chain controls in row 9 once DEP-003 picks a stack.

All content is DERIVED from the confirmed baseline (`.mw/context/`), the human baseline gate
record (`.mw/runs/BASELINE-2026-10-30/baseline-review-report.json`) and a read of the Python
reference at `minidon@e1fbd3a`, unless marked STATED. Rules are cited as capability/BR id.
Visibility is named by its wire value: `public`, `unlisted`, `private` (followers only) and
`direct` (stored as `PUBLIC`, `UNLISTED`, `PRIVATE`, `DIRECT`). The security reviewer named
in `research/inputs/decision-makers.md` (kurtis) is a DEMO assumption.

## What changes and what does not

A lift and shift does not change the attack surface on purpose: the same 40 HTTP endpoints,
the same authentication model and the same data. The security risk is that the rewrite changes
security behaviour by accident. The second risk is that known weaknesses are carried forward
and then forgotten. The table below covers both.

## Threat-model delta (STRIDE-lite)

| # | Concern | Impact | Likelihood | Control during execution | Links |
|---|---|---|---|---|---|
| 1 | **Spoofing:** Rust password check accepts a wrong password or rejects a right one (wrong salt decoding, iteration count, encoding of the password bytes) | High | Medium | Parity tests that sign in with accounts created by the Python build, including non-ASCII passwords; GRD-004 fixes the hash format `<salt hex>$<digest hex>`, PBKDF2-HMAC-SHA256, 100,000 iterations; keep a constant-time comparison (Python uses `hmac.compare_digest`) | GRD-004, OQ-003 |
| 2 | **Spoofing:** tokens issued by Python not accepted by Rust, or expiry compared differently (naive UTC datetimes, `expires_at <= now` means expired); the `Bearer` prefix is matched case-insensitively and the token trimmed (`deps.py:20-22`) | High | Medium | Compatibility test: token issued by Python is accepted by Rust until expiry and refused after it; the same boundary on the exact expiry instant; header case and whitespace cases | NFR-002, RISK-002 |
| 3 | **Elevation of privilege:** staff checks drift (moderator versus admin hierarchy, staff deleting any status, first-registrant-becomes-Admin) | High | Medium | A parity test per authorisation rule in Accounts and Moderation, including these negative cases from `moderation/service.py:104-129`: nobody can suspend an admin (not even another admin); nobody can suspend themself; a moderator cannot suspend another moderator; only an admin can unsuspend or change roles; an admin cannot change their own role | L1-accounts/BR-006, OQ-001, OQ-009, OQ-016 |
| 4 | **Information disclosure:** visibility rules drift (`private` and `direct` statuses, blocked and suspended accounts hidden, mutes) and leak statuses through timelines, replies or notifications. Who may read a `private` or `direct` status depends on mention parsing, so a regex or case-folding difference between Python and Rust (RISK-010) is a disclosure path | High | Medium | Parity tests for every visibility rule from the viewer's side on each read endpoint (timelines, status, replies, account statuses, notifications), with Unicode and edge-case mentions (NFR-010); differential run across all endpoints | ASM-001, RISK-003, RISK-010 |
| 5 | **Information disclosure:** error bodies or logs in Rust reveal more than Python (stack traces, SQL, token values) | Medium | Medium | Map errors only through the DomainError equivalents (400, 401, 403, 404, 409, 422, 429) with body `{"error": msg}`, and framework validation as Python does (422, `{"detail": [...]}`); never log token or password values; test that a 500 body has no internal detail | NFR-003 |
| 6 | **Tampering:** Rust writes rows Python reads differently (enum columns stored as upper-case names, datetime text format), so a role, visibility or report state changes meaning | High | Low | Round-trip tests in both directions on a copy of a Python-created database | RISK-002, MET-004 |
| 7 | **Repudiation:** moderation actions stop being recorded the same way. The only record of a report resolution is the `Report` fields `action_taken`, `moderator_note`, `resolved_by_id` and `resolved_at` (`moderation/service.py:79-82`; `ModerationAction` is the enum of actions, not a record). The direct suspend, unsuspend and role-change endpoints leave no record beyond `suspended_at` and `role`, and staff status deletes leave none (audit trail is a gate follow-up, OQ-009) | Medium | Low | Parity tests that read those four `Report` fields after each resolve action, and `suspended_at` and `role` after the direct actions | L1-moderation, OQ-009 |
| 8 | **Denial of service:** rate limit (30 original posts per rolling hour, 429) or pagination caps (timelines 40, notifications 80) not enforced the same way; length limits counted in bytes instead of code points | Medium | Medium | Parity tests at and just over each limit, with controlled timestamps, including the 429 response body; length tests with multi-byte characters | GRD-008, NFR-010, OQ-010, OQ-011, OQ-013 |
| 9 | **Supply chain:** new Rust dependencies (web framework, SQLite driver, regex and crypto crates) | Medium | Medium | Pin versions in Cargo.lock, run `cargo audit` and `cargo deny` in CI, prefer well-maintained crates for PBKDF2 and HMAC | NFR-006, DEP-003 |

## Weaknesses carried forward on purpose

The baseline gate accepted these and named a follow-up for each (STATED, gate answers recorded
by kurtis on 2026-11-10; `research/inputs/human-decisions.md` section 3 puts them out of scope
for this lift and shift). They must become follow-up tickets. They are not fixed in this run.

- PBKDF2-HMAC-SHA256 at 100,000 iterations, below the OWASP figure of 600,000 or more.
  Follow-up (OQ-003): raise to OWASP level with rehash on login, or move to argon2id. The stored
  hash does not record the iteration count, so the upgrade needs a format change or a
  rehash-on-login scheme. Decide that format in the follow-up, not here.
- Minimum password length 8. Follow-up (OQ-002): raise to 12.
- The first account registered on an instance becomes Admin (`L1-accounts/BR-006`). The gate
  accepted it as a bootstrap mechanism but named an instance takeover risk. Follow-up (OQ-001):
  secure admin seeding by env or CLI. The check is COUNT based and can race (RISK-009).
- Staff can delete any status directly, outside the report flow (`L1-posting/BR-013`).
  Follow-up (OQ-009): an audit trail for staff deletes.
- Access tokens are stored in clear text as the primary key of the token table. A database
  read leaks working tokens. Hashing tokens at rest would be a data format change, so it is
  out of scope. No gate follow-up names this; DERIVED recommendation to raise one.

## Execution-time controls

- Agents never read or print real credentials. Compatibility tests use databases built by the
  tests through the Python API, or a sanitised copy of real data (DEP-005).
- No production data leaves its host for this run. If a real dataset is used, the data owner
  (DEMO: kurtis) approves it first. Compliance and data classification were waived as unchanged
  (GAP-005, condition "revisit at cutover", which belongs on the cutover ticket); that waiver
  rests on no new data being stored.
- Research and build agents never write to the Python repository (I-29, GRD-006, MET-005).
