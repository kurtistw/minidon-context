# Discovery answer key (facilitator only)

Keep this file out of `.mw/`. Agents read everything under `.mw/docs/` and `.mw/notes/`, so an
answer key there would leak into the run.

The discovery inputs plant three disagreements. What a good run should find, and what this run found:

| Trap | Sources | Expected | Found in this run |
|---|---|---|---|
| Edit window | ADR-001 and the minidon README say 30 minutes, `config.py` says 60 | A conflict | Yes, CF-001. The gate chose 60 and retired Posting BR-009 |
| Suspending staff | The transcript says moderators can suspend any account, the code forbids suspending other staff | A conflict | Partly. Only as open question OQ-016, from the code. The transcript was not cited and no conflict was raised |
| Lists | The transcript says lists ship next month, `minidon/lists/` is half built | A gap, not a capability | Yes, CF-002 and Unmapped Code. The gate chose to delete it |

## Before rerunning discovery

During the original run both inputs were malformed (a broken shell heredoc, and this answer key
was inside the transcript). They are repaired in the current tree. For a clean rerun, also remove
the "Status: Superseded" line from ADR-001, because it gives away the CF-001 answer.
