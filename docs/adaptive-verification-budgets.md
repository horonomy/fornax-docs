---
title: Adaptive Verification Budgets
sidebar_position: 26
---

# Adaptive Verification Budgets

Not every claim deserves the same amount of scrutiny. Checking whether a
read-only status command ran is cheap and low-stakes; checking whether a
production deployment is healthy is not. v0.0.8 adds a **Verification
Budget Scheduler** that scales verification depth to risk instead of
running either minimal checks or maximum-depth monitoring for everything.

## How a budget is decided

Inputs include the claim's contract and current obligation-satisfaction
state, the action's reversibility and blast radius, existing evidence
coverage and source independence, and policy. The output is a bounded
`VerificationPlan` with explicit ceilings on latency, cost, resource use,
probe count, review burden, and execution risk.

Two things never bend, regardless of how much information value is at
stake:

- **Destructive, credential-bearing, or unapproved-network actions are
  never approved by a verification step**, no matter the budget.
- **A budget running out before a critical obligation is checked produces
  an explicit `Review` or `InsufficientVerification` result** — never a
  silent pass. This is the same non-relaxing-floor discipline used
  throughout the trust kernel: a verification plan can only ever step a
  recommendation *down* toward more caution, never up toward less.

## Measured, honestly

v0.0.8 includes a benchmark comparing the adaptive policy against
minimal-only and maximum-depth baselines — but **only on synthetic
fixtures**. There is no real production-workload benchmark yet, so no
claim is made about real-world cost savings in your environment. The
mechanism for promoting a future learned policy over this deterministic
baseline exists and is tested, but no learned policy has been trained or
deployed — v0.0.8 ships the deterministic baseline only.

## See also

- [Epistemic Contracts](./epistemic-contracts.md) — the obligation-
  satisfaction state a budget decision is built on.
- [Shadow Execution](./shadow-execution.md) — one of the verification
  tiers a budget can escalate into.
