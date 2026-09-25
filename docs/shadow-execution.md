---
title: Shadow Execution
sidebar_position: 30
---

# Shadow Execution

For some actions, the fastest way to find out whether a change is safe is
to actually try it — somewhere it can't do damage. v0.0.8 adds **Shadow
Execution**: running a proposed change in a fully local, disposable copy
of its environment before recommending the real thing.

## Two supported domains

v0.0.8 ships two shadow-execution domains, both deliberately chosen
because they can be shadow-executed with zero real external systems
touched:

- **File mutation** — a proposed file change is applied to an isolated
  staged copy of the working tree, never the real one.
- **SQLite migration** — a proposed schema migration runs against a
  throwaway, file-backed database, never a real one.

Infrastructure-plan and deployment-configuration domains were explicitly
declined for this release, since either would need real credentials or
network reachability that this feature's own safety rules forbid by
default. That's a documented scope decision, not an oversight.

## What it actually caught

Shadow execution found two real fragilities in this release that passive
evidence alone would not have reliably caught: a syntactically-broken JSON
mutation that only surfaced when parsed inside the isolated copy, and a
unique-index migration that only failed against representative seeded
duplicate data.

## Safety, tested adversarially

Every shadow runner operates only against local, disposable resources —
temp directories, throwaway databases. Negative controls are real,
adversarial tests, not just happy-path checks: a path-traversal attempt is
refused rather than silently clamped; a symlink pointing outside the
sandbox is never followed (proven by placing a real secret file outside
the sandbox and confirming it stays untouched after an attempted write);
network-shaped and credential-shaped targets are refused outright,
regardless of how valuable the information would be.

A passing shadow run is explicitly not equivalent to a production proof —
every result carries fidelity/coverage metadata naming exactly what it
does and does not model.

## See also

- [Adaptive Verification Budgets](./adaptive-verification-budgets.md) —
  shadow execution is one verification tier a budget can escalate into.
