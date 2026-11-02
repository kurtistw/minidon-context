# L1-accounts: Accounts

> **Level:** L1
> **Domain:** L0-minidon (Minidon Social Network)
> **Last Updated:** 2026-10-30T18:00:00Z
> **Baseline Version:** BASELINE-2026-10-30

## Summary

Accounts covers sign-up, sign-in and session tokens, and the editable profile (display
name, bio, locked flag). It is the identity foundation every other capability relies on:
`get_by_username` is called from Following, Posting (indirectly via Timelines) and
Moderation, and `authenticate` backs the bearer-token session used across the whole API.
The first account ever registered on an instance automatically becomes its Admin.

## Business Context

### Purpose
Let people create an account, sign in to get an access token, and maintain a public
profile (display name, bio, and whether the account is "locked" - approving each new
follower by hand). `STATED` - README.md `## Accounts`.

### Stakeholders
| Role | Responsibility |
|------|----------------|
| End user | Registers, signs in, maintains their own profile |
| Instance operator (first registrant / Admin) | Runs the instance; is created automatically as Admin on first registration |
| Moderator / Admin (see `L1-moderation`) | Consumes Accounts' suspension and role data; does not own this capability |
| BA / Product | Owns the business rules for identity and profile limits |

### Business Rules

| ID | Rule | Source | Confidence |
|----|------|--------|------------|
| BR-001 | Usernames are 1-30 letters, digits or underscores, and are not case sensitive (stored lowercase). | README.md `## Accounts`; `minidon/accounts/service.py:17,39,41-42` | `STATED` |
| BR-002 | A registration email address must contain an `@` character to be accepted. | `minidon/accounts/service.py:40,43-44` | `DERIVED` (0.9) |
| BR-003 | A password must be at least 8 characters. | `minidon/accounts/service.py:18,45-46` | `DERIVED` (0.9) |
| BR-004 | Usernames must be unique, case-insensitively, including against suspended accounts. | `minidon/accounts/service.py:47-48,96-102` | `DERIVED` (0.9) |
| BR-005 | Email addresses must be unique across all accounts. | `minidon/accounts/service.py:49-50` | `DERIVED` (0.9) |
| BR-006 | The first account ever registered on a fresh instance is automatically granted the Admin role; every account after it gets the User role. | `minidon/accounts/service.py:52-58` | `DERIVED` (0.95) |
| BR-007 | Passwords are hashed with PBKDF2-HMAC-SHA256 (100,000 iterations, random 16-byte salt) and verified in constant time; plaintext passwords are never stored. | `minidon/accounts/service.py:17-21,24-35` | `DERIVED` (0.9) |
| BR-008 | Signing in with the wrong username or password is rejected without indicating which was wrong. | `minidon/accounts/service.py:65-68` | `DERIVED` (0.85) |
| BR-009 | Suspended accounts can no longer sign in, even with the correct password. | README.md `## Moderation`; `minidon/accounts/service.py:69-70` | `STATED` |
| BR-010 | An access token expires 30 days after issue (`token_ttl_days`, configurable). | `minidon/accounts/service.py:73-75`; `minidon/config.py:17` | `DERIVED` (0.9) |
| BR-011 | An expired token, or a token belonging to a now-suspended account, authenticates as "signed out" rather than raising an error. | `minidon/accounts/service.py:81-88` | `DERIVED` (0.85) |
| BR-012 | Suspended accounts are treated as not found by username lookups used throughout the app (they "look as if they do not exist"), except where a moderation action deliberately asks to include them. | `minidon/accounts/service.py:96-110` | `DERIVED` (0.9) |
| BR-013 | Display name is limited to 30 characters; bio is limited to 500 characters. | README.md `## Accounts` (states the fields exist, not the limits); `minidon/accounts/service.py:19-20,121-128` | `DERIVED` (0.9) for the numeric limits; field existence is `STATED` |
| BR-014 | An account can mark itself "locked"; locked accounts must manually approve each new follower (the approval mechanism itself is implemented in `L1-following`). | README.md `## Accounts`: "Locked accounts approve each new follower by hand."; `minidon/accounts/models.py:30` | `STATED` (field + behaviour name); `DERIVED` (exact mechanism, see `.mw/notes/glossary/locked-account.md`) |

## Technical Context

### Components
| Component | Repository | Purpose |
|-----------|------------|---------|
| `minidon/accounts/models.py` | minidon | `Role` enum, `Account` and `AccessToken` ORM models |
| `minidon/accounts/service.py` | minidon | Registration, hashing, sign-in, token issuance/revocation, profile update, username lookup |
| `minidon/accounts/routes.py` | minidon | `POST /accounts`, `POST /auth/token`, `GET/PATCH /accounts/me`, `GET /accounts/{username}` |
| `minidon/accounts/schemas.py` | minidon | `AccountOut` response shape and `serialize_account`, which pulls follower/following/status counts from Following and Posting |

### Dependencies
- **Upstream:** None - Accounts is the identity foundation of the system.
- **Downstream:** `L1-following`, `L1-posting`, `L1-timelines`, `L1-notifications`, `L1-moderation` all call `minidon/accounts/service.py#get_by_username` or `#authenticate` (graph-report hotspot, 18 incoming edges); `L1-moderation` also calls `#revoke_tokens` when suspending.

### Contracts
| Contract | Type | Location |
|----------|------|----------|
| `AccountOut` | Schema | `minidon/accounts/schemas.py:15-26` |
| Bearer token session (`Authorization: Bearer <token>`) | API | `minidon/deps.py` (`optional_account`, `current_account`, `staff_account`) |

## Behavioural Specification

### Invariants
| ID | Invariant | Enforcement |
|----|-----------|-------------|
| INV-001 | Exactly one account (the first registered) holds Admin by default; no other registration path grants Admin. | `minidon/accounts/service.py:52-58` |
| INV-002 | A username, once taken (even by a suspended account), cannot be re-registered. | `minidon/accounts/service.py:47-48` |
| INV-003 | A suspended account cannot obtain a new access token or use an existing one. | `minidon/accounts/service.py:69-70,81-88` |

### State Transitions
```
Account.suspended_at: None -> <timestamp>   (via L1-moderation#suspend, see rules-trace)
Account.suspended_at: <timestamp> -> None   (via L1-moderation#unsuspend, admin only)
Account.locked: False <-> True              (via PATCH /accounts/me, self-service)
Account.role: user -> moderator -> admin    (via L1-moderation#set_role, admin only)
```

### Edge Cases
| Scenario | Expected Behaviour | Test Reference |
|----------|--------------------|-----------------|
| Register with an already-taken username (any case) | `409 Conflict` | `tests/test_accounts.py::test_usernames_are_unique_regardless_of_case` |
| Register with an already-registered email | `409 Conflict` | `tests/test_accounts.py::test_emails_are_unique` |
| Register with invalid username, too-long username, or short password | `422 Invalid` | `tests/test_accounts.py::test_register_rejects_invalid_input` |
| Sign in with wrong password | `401 Unauthorized` | `tests/test_accounts.py::test_sign_in_with_the_wrong_password_fails` |
| Request `/accounts/me` with no token | `401 Unauthorized` | `tests/test_accounts.py::test_requests_without_a_token_are_refused` |
| Display name over 30 characters | `422 Invalid` | `tests/test_accounts.py::test_display_names_are_limited` |
| First account ever registered | Gets Admin role automatically | `tests/test_accounts.py::test_the_first_account_runs_the_instance` |

## Integration Points

### APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/accounts` | POST | Register a new account |
| `/api/v1/auth/token` | POST | Sign in, receive an access token |
| `/api/v1/accounts/me` | GET | View your own profile |
| `/api/v1/accounts/me` | PATCH | Update display name, bio, or locked flag |
| `/api/v1/accounts/{username}` | GET | View another account's profile |

### Events
_(none - minidon has no event bus; all cross-capability interaction is in-process function calls, see domain-map.md Cross-Cutting Concerns)_

## Open Questions

- [ ] **BA / Product:** BR-006 (first registrant becomes Admin) is significant operational
  behaviour with no mention in README.md or any other documentation found. Confirm this is
  intended production behaviour and not a development convenience that should be
  environment-gated.
- [ ] **BA / Product:** BR-007 (password hashing algorithm/parameters), BR-010 (30-day token
  TTL), BR-013's exact numeric limits (30/500 chars), MIN_PASSWORD_LENGTH (8) are all
  undocumented numeric/algorithmic choices. Confirm these are the intended business values,
  not implementation defaults nobody has reviewed.
- [ ] **Security reviewer:** PBKDF2 at 100,000 iterations (BR-007) is below current
  OWASP guidance for PBKDF2-SHA256 (recommended 600,000+ as of recent guidance). Flagging
  for a security-focused review; this is an observation about the code, not a business rule
  dispute.

## Change History

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-10-30 | Initial capability document drafted from code-links.json, README.md and graph analysis for baseline BASELINE-2026-10-30. | ba-agent |
