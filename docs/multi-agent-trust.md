---
title: Proof-Carrying Delegation & Multi-Agent Trust
sidebar_position: 29
---

# Proof-Carrying Delegation & Multi-Agent Trust

When one agent delegates a task to another, the parent shouldn't have to
trust the child's own prose summary of what it did. v0.0.8 adds a
**delegation envelope** that lets a parent verify a child's result from
serialized bytes alone.

## What a delegation envelope carries

- Parent/child identity and the exact delegated scope.
- The child's real obligation-satisfaction outcome (`Fulfilled`,
  `PartiallyFulfilled`, `Insufficient`, `Unavailable`) — derived from an
  actual [Epistemic Contract](./epistemic-contracts.md) assessment, never
  a self-reported flag.
- Freshness/expiry bounds, so a receipt valid for one task cannot
  authorize unrelated work.
- Lineage referencing prior receipts by digest only — raw evidence is
  never re-embedded, and free-text scope fields are fingerprinted, never
  stored raw.

## A real, tested scenario

This exact scenario is a real, passing test in v0.0.8
(`fornax-receipt::delegation::agent_a_delegates_to_agent_b_and_holds_an_insufficient_result_end_to_end`):
Agent A delegates a `tests_passed` claim to Agent B. Agent B's evidence
collection genuinely fails. Agent A's independent consumer — working from
serialized bytes alone, with no access to Agent B's internal state —
correctly refuses to authorize downstream work, regardless of what Agent B
might claim in its own prose. Stale, tampered (digest-mismatched), and
wrong-scope envelopes are rejected the same way, each with an explainable
reason.

## Multi-agent shared failure

Several agents can share one underlying root — the same model call, the
same poisoned retrieval source, the same parent task — without genuinely
being independent confirmations of each other. v0.0.8 extends this
dependency tracking across agents, not just across evidence rows from one
session.

A `CollusionHypothesis` signal is the strongest claim this system can
make, and it is **structurally impossible to construct without actual
supporting evidence** — never inferred from correlation or text similarity
alone. Weaker, evidence-agnostic signals (`SharedFailureRisk`,
`CommonSource`, `CoordinationSignal`) exist for exactly the cases where
correlation is observed but intent cannot be established.

## See also

- [Adversarial Evidence & Authenticity](./adversarial-evidence-and-authenticity.md)
- [Agent Evidence Protocol](./agent-evidence-protocol.md) — how a
  delegation envelope's wire format can be verified by a consumer outside
  this codebase entirely.
