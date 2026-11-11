# REBUILD-MINIDON: Rebuild minidon in Rust with feature parity

## Summary

Rebuild the minidon backend (currently Python) in Rust as a lift and shift. The goal is
feature parity with the existing system, not new functionality.

## Why

Move minidon from Python to Rust. The rebuild is done from specs derived from the confirmed
baseline (BASELINE-2026-10-30), not by translating the Python code line by line.

## Scope

- Reimplement every capability recorded in the confirmed baseline in Rust.
- Same external behaviour: same inputs produce the same outputs for every baseline rule.
- Same data: the Rust version reads and writes the existing data and storage formats, so it
  can run against current data.
- The Rust code lives in a new repository (minidon-rust).

## Out of scope

- New features or behaviour changes.
- Cutover, parallel running and retirement of the Python version (separate ticket).
- The Python minidon repository stays unchanged and serves as the reference.

## Acceptance (initial, to be sharpened in research)

- Every baseline rule has a parity test that passes against the Rust build.
- The Rust build works against existing data without migration.

## Open questions

- Definition of the Rust target platform and runtime constraints.
- Which baseline rules are DERIVED and still unconfirmed by a human.
- Whether performance parity is required (not requested so far).
