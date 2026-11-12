# Journeys: REBUILD-MINIDON

Drafted by research-agent on 2026-11-12. minidon is a backend API with no screens (GAP-007
waived), so these are API-client journeys over the 40 endpoints of the Python reference at
`e1fbd3a`. The journeys are DERIVED from the route files and the baseline capabilities. They do
not change in the rebuild: each one must behave the same on the Rust build, and each step is a
candidate for the differential run in NFR-003. Paths are shown without the `/api/v1` prefix the
routers mount under.

## J1. Join, sign in and post (L1-accounts, L1-posting)

```mermaid
sequenceDiagram
  actor U as API client (user)
  participant A as L1-accounts
  participant P as L1-posting
  U->>A: POST /accounts (username, email, password)
  Note over A: first account ever becomes Admin (BR-006)<br/>password stored as PBKDF2 salt$digest
  A-->>U: 201 account
  U->>A: POST /auth/token
  A-->>U: token (30-day TTL)
  U->>A: PATCH /accounts/me (display name 30, bio 500 chars max)
  U->>P: POST /statuses (max 500 chars, 30 originals per rolling hour)
  P-->>U: 201 status
  U->>P: PATCH /statuses/{id} (within 60 minutes only)
  U->>P: DELETE /statuses/{id} (soft delete, removes boosts)
```

## J2. Follow and read the home timeline (L1-following, L1-timelines, L1-notifications)

```mermaid
sequenceDiagram
  actor U as API client (user)
  participant F as L1-following
  participant T as L1-timelines
  participant N as L1-notifications
  U->>F: POST /accounts/{username}/follow
  alt target is locked
    F-->>U: pending follow request
    Note over F: target uses GET /follow_requests,<br/>POST /follow_requests/{username}/authorize or reject
  else
    F-->>U: relationship: following
  end
  F->>N: follow notification (not to self, not across a block, not while muted)
  U->>T: GET /timelines/home (20 default, 40 max)
  U->>F: POST /accounts/{username}/mute or /block
  Note over F: block deletes follows in both directions (OQ-004)
  U->>N: GET /notifications (40 default, 80 max), /unread_count, POST /read_all
```

## J3. Interact with a status (L1-posting, L1-notifications)

```mermaid
flowchart LR
  V[Viewer sees status] --> Q{Visibility}
  Q -- public or unlisted --> B[POST /statuses/id/reblog allowed]
  Q -- followers-only or direct --> X[reblog refused, CF-007 code behaviour kept]
  V --> Fav[POST /statuses/id/favourite]
  V --> R[POST /statuses with in_reply_to_id, GET /statuses/id/replies]
  B --> N[Notification to author, suppression rules apply]
  Fav --> N
  R --> N
```

## J4. Report and moderate (L1-moderation, L1-posting, L1-accounts)

```mermaid
sequenceDiagram
  actor U as API client (user)
  actor S as Staff (moderator or admin)
  participant M as L1-moderation
  participant P as L1-posting
  participant A as L1-accounts
  U->>M: POST /reports (category, comment up to 1000 chars)
  S->>M: GET /admin/reports
  S->>M: POST /admin/reports/{id}/resolve
  opt delete reported status
    M->>P: soft delete (OQ-017: shape decided in design)
  end
  S->>M: POST /admin/accounts/{username}/suspend
  Note over M,A: revokes all tokens, hides account and statuses<br/>moderator cannot suspend self, admin or moderator
  S->>M: POST /admin/accounts/{username}/unsuspend (admin only)
  S->>M: PUT /admin/accounts/{username}/role (admin only)
```

## J5. Prove parity for one rule (delivery journey, new in this run)

```mermaid
flowchart LR
  R[Rule BR-nnn in rules-trace.md] --> T[Write black-box parity test]
  T --> Py{Passes against Python e1fbd3a?}
  Py -- no --> Fix[Fix the test or raise the rule's meaning with BA]
  Fix --> T
  Py -- yes --> Rs{Passes against Rust build?}
  Rs -- no --> Impl[Change the Rust code, never the Python code]
  Impl --> Rs
  Rs -- yes --> C[Counts toward MET-001]
```
