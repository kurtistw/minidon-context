---
name: research-estimate
description: Estimate agentic against traditional delivery as ranges with a stated basis
allowed-tools: [Write, Read]
---

# Research Estimate

Estimate agentic against traditional delivery as ranges with a stated basis

## Usage

Write `research/estimate.json`: person-day `low` and `high` for `agentic` and `traditional`, plus the `basis`.
Calibrate from the frozen numbers in `.mw/metrics/baseline.json` and the run ledger. A missing baseline widens the range and is named in `widenedBy`; it does not block.
