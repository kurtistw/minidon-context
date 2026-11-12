# Baseline metrics: minidon (Python)

Measured on 2026-11-11 from the minidon repository at commit e1fbd3a (2026-10-28) and the
confirmed baseline in `.mw/context/`. Corrected on 2026-11-12 after research review 001
(findings F-01, F-02, F-07). These are the "today" values the Rust rebuild is compared to.

## Rule count (corrected)

Rule ids restart in every capability, so a rule is identified by capability plus id, for example
`L1-accounts/BR-006`. The count is the number of (capability, BR id) pairs. The earlier figure of 82
was wrong: it counted a reference to a Following rule inside the Notifications file as a tenth
Notifications rule.

| Capability | Rules | Purely STATED | DERIVED or mixed |
|---|---|---|---|
| L1-accounts | 14 | 2 | 12 |
| L1-following | 15 | 4 | 11 |
| L1-posting | 20 | 4 | 16 |
| L1-timelines | 8 | 2 | 6 |
| L1-notifications | 9 | 2 | 7 |
| L1-moderation | 15 | 3 | 12 |
| **Total** | **81** | **17** | **64** |

- **Retired rule:** `L1-posting/BR-009` (edit window of 30 minutes) was retired at the baseline gate
  (CF-001, resolved by kurtis on 2026-11-09). Python enforces 60 minutes, so no parity test for
  BR-009 can pass.
- **Parity denominator: 80** (81 rules minus the retired BR-009).
- **Source:** the Rules Index table and `### BR-` sections of `.mw/context/capabilities/*/rules-trace.md`.

## Other measurements

| Metric | Baseline value | Date | Source |
|---|---|---|---|
| Capabilities | 6 | 2026-11-11 | `.mw/context/baseline.json` |
| Python source lines (minidon/) | 2,123 | 2026-11-11 | line count of `minidon/**/*.py` |
| Test functions | 54 across 6 test files | 2026-11-11 | `def test_` count under `tests/` |
| Baseline open questions | 21, all answered at the baseline gate on 2026-11-10 | 2026-11-12 | `.mw/runs/BASELINE-2026-10-30/baseline-review-report.json` |
| Latency and throughput | not measured | - | no performance data exists; see note |

## Notes

- Performance parity is not required by the ticket, so latency and throughput are not measured.
  If the team adds it, someone needs to measure the Python version first.
- "Rules with an automated test" is a planning task. It can be roughly measured from the
  rules-trace test references.
