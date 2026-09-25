---
title: Self-Integrity & Formal Checks
sidebar_position: 28
---

# Self-Integrity & Formal Checks

Fornax v0.0.8 asks the trust kernel to prove the invariants it depends on,
rather than relying only on hand-picked example tests.

## The invariant registry

A central registry maps 10 required invariants — things like "evidence
from one session cannot affect another," "an unavailable/failed collection
can never become support or contradiction," and "a monitor's confidence
can never override a hard contradiction" — to an owning test and a
release-gate mapping. A build-time check fails if a new invariant is added
without being registered.

Coverage today includes property-based tests (generalizing several
invariants beyond their original example-based tests), a deliberately
seeded regression proving a real, capable test can detect a removed safety
control, and a genuine 64-task concurrency stress test proving session
isolation under real concurrent access to the daemon's shared state.

**Known gap:** concurrent *acquisitions* and concurrent *policy changes*
were not separately exercised in this pass — a disclosed gap, not
fabricated as covered.

## Bounded formal verification

v0.0.8 also applies [Kani](https://model-checking.github.io/kani/) —
bounded model checking against the real Rust code, not a hand-written
separate spec — to two targeted state machines. **4 proofs are genuinely
verified** on receipt/delegation freshness logic. The second target
(the acquisition-authorization state machine) has written proof harnesses
that compile, but hit a real memory limit in the underlying model checker
and remain **unverified** — a tooling limitation, not a discovered defect.

This is a real, bounded result, not a claim that Fornax's trust kernel is
formally verified end-to-end. It is not.

## See also

- [Adversarial Evidence & Authenticity](./adversarial-evidence-and-authenticity.md)
  — the attack corpus these invariants are tested against.
