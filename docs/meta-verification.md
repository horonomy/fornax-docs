---
title: Meta-Verification
sidebar_position: 32
---

# Meta-Verification

Semantic judges, monitors, and calibration revisions can themselves be
wrong. v0.0.8 adds a **meta-verification layer** that treats them as
fallible evidence sources rather than roots of trust.

## What a monitor's output carries

Every retained monitor output carries its full identity and provenance —
model/endpoint, prompt version, calibration revision, and when it was
called — and is represented as ordinary derived evidence, not as an
authoritative override. A disabled, stale, or out-of-scope monitor's
output is never silently counted as either supporting or contradicting
evidence.

## The one rule that never bends

**A confident monitor cannot force a verdict past a real, objective
contradiction.** This is tested directly: an overconfident, factually
wrong monitor claims a test suite passed, while a real host-observed exit
code says it failed. The fused verdict never reaches `Verified` — it stays
at `Review`, and the contradiction remains visible. The monitor's
confidence never overwrites it.

## Same-family monitors don't manufacture independence

If two monitors observe the same underlying agent turn, they are grouped
as one dependent source, not counted as two independent confirmations —
reusing the same source-independence machinery used across the rest of
the trust kernel.

## Honest performance reporting

A monitor's contextual performance is only reported when there's enough
sample support — below that threshold, the report says so explicitly
(`InsufficientSupport`) rather than emitting a number. **No global
"monitor X is N% trustworthy" claim exists anywhere in this release**;
there is no real human-adjudicated dataset yet to support one.

## See also

- [Epistemic Contracts](./epistemic-contracts.md)
- [Assurance Cases](./assurance-cases.md)
