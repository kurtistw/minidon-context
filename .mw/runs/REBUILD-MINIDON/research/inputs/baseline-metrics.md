# Baseline metrics: minidon (Python)

Measured on 2026-11-11 from the minidon repository at commit e1fbd3a (2026-10-28) and the
confirmed baseline in `.mw/context/`. These are the "today" values the Rust rebuild is compared to.

| Metric | Baseline value | Date | Source |
|---|---|---|---|
| Business rules in the baseline | 82 | 2026-11-11 | distinct BR ids across `.mw/context/capabilities/*/rules-trace.md` |
| Capabilities | 6 | 2026-11-11 | `.mw/context/baseline.json` (accounts, following, moderation, notifications, posting, timelines) |
| Rules with an automated test | not measured | - | to be derived in planning |
| Python source lines (minidon/) | 2,123 | 2026-11-11 | line count of `minidon/**/*.py` |
| Test functions | 54 across 6 test files | 2026-11-11 | `def test_` count under `tests/` |
| Baseline open questions | 21 | 2026-11-11 | `.mw/context/baseline.json` |
| Latency and throughput | not measured | - | no performance data exists; see note |

## Notes

- Performance parity is not required by the ticket, so latency and throughput are not measured.
  If the team adds it, someone needs to measure the Python version first.
- "Rules with an automated test" is the key parity measure. It is unmeasured here and is a
  planning task, not a research input.
