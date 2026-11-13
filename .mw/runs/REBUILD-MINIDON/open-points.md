# Open points: REBUILD-MINIDON (story 1, Accounts)

Every open point has one owner and a role (I-22). Owners are named per the research pack, where one person (kurtis) holds all roles as a DEMO ASSUMPTION. The owner_role column shows who would own it in a real team. All items DERIVED unless marked STATED.

| ID | Open point | Owner | owner_role | Needed by | Source |
|---|---|---|---|---|---|
| OP-01 | Why move to Rust? The business reason is not recorded. Needed to judge success beyond parity. | kurtis | PO | before PRD approval | STATED: human decisions section 7, RISK-005 |
| OP-02 | Is performance parity required? Not requested so far, not measured. | kurtis | PO | before design | ticket open question, RISK-005 |
| OP-03 | Rust platform: toolchain, web framework, async runtime, SQLite driver, regex engine (must express the trailing-newline username behaviour), deployment target. | kurtis | Tech Lead | design | DEP-003, ADR candidate 1 |
| OP-04 | Build order: Following needs Notifications (follow triggers a notification) and Notifications needs Following queries. The proposed order has a cycle. Decide a stub or a different order. | kurtis | Tech Lead | before story 2 starts | flows lane F-09, impact.json dependencies |
| OP-05 | How Rust reproduces the existing stored formats (enum names, date text, hash format) and whether Rust may create the schema. | kurtis | Tech Lead | design | ASM-002, ADR candidate 2 |
| OP-06 | Which framework-level behaviours are contract: error body shapes, date format, 404 and 405 bodies, documentation routes. | kurtis | BA | design | RISK-003, ADR candidate 3 |
| OP-07 | Parity harness design: normalisation, control of time-dependent data, non-ASCII input. Must not write inside the Python reference repository. | kurtis | Tech Lead | design | ASM-003, security lane S-04 |
| OP-08 | Work through the 8 major lane findings (security S-01 to S-05, flows F-01 to F-03) before build. Includes journeys for the 15 endpoints not yet shown and reconciling the 19 to 38 day flow durations with the 16 to 34 day estimate (the estimate is the authority). | kurtis | BA | before build starts | human decisions section 6 |
| OP-09 | Provide a representative copy of existing data for compatibility testing. | kurtis | PO | before Accounts build | DEP-005 |
| OP-10 | Stale baseline record: status, confirmer and conflict list were not updated after the gate. Housekeeping, does not change decisions. | kurtis | BA | before release | CON-001, human decisions section 2 |
