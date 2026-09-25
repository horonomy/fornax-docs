---
title: Epistemic Contracts
sidebar_position: 25
---

# Epistemic Contracts

Fornax v0.0.8 adds **Epistemic Contracts** — a versioned schema that says,
for a given class of claim (`tests_passed`, `deployment_healthy`,
`security_defect_fixed`, and others), exactly what evidence would need to
exist for that claim to be justified.

## The core idea

Before v0.0.8, Fornax's five-state verdict (`VERIFIED` / `UNVERIFIED` /
`CONTRADICTED` / `REVIEW` / `UNAVAILABLE`) told you *whether* a claim
matched the evidence. It didn't tell you *what evidence a claim of that
type should have had in the first place*.

An Epistemic Contract makes that explicit:

- A **claim class** (e.g. `tests_passed`, versioned — `v1`, `v2`, ...).
- A list of **proof obligations** — each one names a required evidence
  kind, a minimum trust class, a freshness window, and (new in v0.0.8) an
  independence rule so that two pieces of evidence that ultimately trace
  back to the same underlying observation don't get counted as two
  separate confirmations.
- A **satisfaction state** for each obligation — one of seven, never
  collapsed into fewer: `Satisfied`, `Unsatisfied`, `Unavailable`, `Stale`,
  `Contradicted`, `NotApplicable`, `Unknown`.

## Contract satisfaction

Given a claim, its contract, and the evidence actually captured, Fornax's
contract-satisfaction engine produces a `SatisfactionReport`: which
obligations are met, which aren't, and why. This report feeds a
**critical-obligation safety floor** — a recommendation can never reach
`PROCEED` merely because *aggregate* evidence looks strong while a single
required obligation is unsatisfied.

Six representative claim classes ship in v0.0.8: `tests_passed`,
`build_succeeded`, `file_changed`, `commit_push_completed`,
`deployment_healthy`, and `security_defect_fixed`.

## What this does not do

- It does not invent evidence. An obligation with no matching evidence
  reads as `Unavailable`, never as an implicit pass.
- It does not imply calibrated real-world accuracy. Whether a satisfied
  contract correlates with real-world correctness at some measured rate is
  a separate, harder question this release does not claim to answer (see
  [Reliability](./reliability.md)).

## See also

- [Adaptive Verification Budgets](./adaptive-verification-budgets.md) —
  how much verification effort a claim gets is informed by its contract's
  obligation-satisfaction state.
- [Assurance Cases](./assurance-cases.md) — a human-readable explanation
  built directly from a contract's satisfaction report.
