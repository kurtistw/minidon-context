# Security: REBUILD-MINIDON

Drafted by research-agent on 2026-11-12. All content is DERIVED from the confirmed baseline
(`.mw/context/`) and a read of the Python reference at `minidon@e1fbd3a`, unless marked STATED.
The security reviewer named in `research/inputs/decision-makers.md` (kurtis) is a DEMO assumption.

## What changes and what does not

A lift and shift does not change the attack surface on purpose: the same 40 HTTP endpoints,
the same authentication model and the same data. The security risk is that the rewrite changes
security behaviour by accident. The second risk is that known weaknesses are carried forward
and then forgotten. The table below covers both.

## Threat-model delta (STRIDE-lite)

| # | Concern | Impact | Likelihood | Control during execution | Links |
|---|---|---|---|---|---|
| 1 | **Spoofing:** Rust password check accepts a wrong password or rejects a right one (wrong salt decoding, iteration count, encoding of the password bytes) | High | Medium | Parity tests that sign in with accounts created by the Python build; GRD-004 fixes the hash format `<salt hex>$<digest hex>`, PBKDF2-HMAC-SHA256, 100,000 iterations; keep a constant-time comparison (Python uses `hmac.compare_digest`) | GRD-004, OQ-003 |
| 2 | **Spoofing:** tokens issued by Python not accepted by Rust, or expiry compared differently (naive UTC datetimes, `expires_at <= now` means expired) | High | Medium | Compatibility test: token issued by Python is accepted by Rust until expiry and refused after it; the same boundary on the exact expiry instant | NFR-002, RISK-002 |
| 3 | **Elevation of privilege:** staff checks drift (moderator versus admin hierarchy, staff deleting any status, first-registrant-becomes-Admin) | High | Medium | A parity test per authorisation rule in Accounts and Moderation, including negative cases (moderator cannot suspend an admin, another moderator or themself; only an admin unsuspends or changes roles) | OQ-001, OQ-009, OQ-016 |
| 4 | **Information disclosure:** visibility rules drift (followers-only and direct statuses, blocked and suspended accounts hidden, mutes) and leak statuses through timelines, replies or notifications | High | Medium | Parity tests for every visibility rule from the viewer's side on each read endpoint (timelines, status, replies, account statuses, notifications); differential run across all endpoints | ASM-001, RISK-003 |
| 5 | **Information disclosure:** error bodies or logs in Rust reveal more than Python (stack traces, SQL, token values) | Medium | Medium | Map errors only through the DomainError equivalents (400, 401, 403, 404, 422); never log token or password values; test that a 500 body has no internal detail | NFR-003 |
| 6 | **Tampering:** Rust writes rows Python reads differently (enum storage, datetime format), so a role, visibility or report state changes meaning | High | Low | Round-trip tests in both directions on a copy of a Python-created database | RISK-002, MET-004 |
| 7 | **Repudiation:** moderation actions (report resolve, suspend, role change) stop being recorded the same way | Medium | Low | Parity tests that read the ModerationAction records after each action | L1-moderation |
| 8 | **Denial of service:** rate limit (30 original posts per rolling hour) or pagination caps (timelines 40, notifications 80) not enforced the same way | Medium | Medium | Parity tests at and just over each limit, with controlled timestamps | GRD-008, OQ-010, OQ-011, OQ-013 |
| 9 | **Supply chain:** new Rust dependencies (web framework, SQLite driver, crypto crate) | Medium | Medium | Pin versions in Cargo.lock, run `cargo audit` and `cargo deny` in CI, prefer well-maintained crates for PBKDF2 and HMAC | NFR-006, DEP-003 |

## Weaknesses carried forward on purpose

These are accepted for parity (DEMO answers, pending human review) and must become follow-up
tickets. They are not fixed in this run.

- PBKDF2-HMAC-SHA256 at 100,000 iterations, below the OWASP figure of 600,000 or more (OQ-003,
  deferred). The stored hash does not record the iteration count, so a later upgrade needs a
  format change or a rehash-on-login scheme. Decide that format in the follow-up, not here.
- Access tokens are stored in clear text as the primary key of the token table. A database
  read leaks working tokens. Hashing tokens at rest would be a data format change, so it is
  out of scope.
- The first account registered on an instance becomes Admin (BR-006, OQ-001). The check is
  COUNT based and can race (RISK-009).
- Staff can delete any status directly, outside the report flow (OQ-009).

## Execution-time controls

- Agents never read or print real credentials. Compatibility tests use databases built by the
  tests through the Python API, or a sanitised copy of real data (DEP-005).
- No production data leaves its host for this run. If a real dataset is used, the data owner
  (DEMO: kurtis) approves it first. Compliance and data classification were waived as unchanged
  (GAP-005); that waiver rests on no new data being stored.
- Research and build agents never write to the Python repository (I-29, GRD-006).
