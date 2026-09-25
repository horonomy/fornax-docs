---
title: Adversarial Evidence & Authenticity
sidebar_position: 27
---

# Adversarial Evidence & Authenticity

Fornax treats the monitored agent, and everything adjacent to it, as
potentially adversarial. v0.0.8 adds a documented threat model and a real
attack corpus, plus hardening so evidence strength reflects how hard it
would be for an agent to make that evidence lie.

## The threat model

The corpus covers attacker-controlled text, files, tests, logs, hooks,
tool output, environment variables, timestamps, version metadata, and
receipts. Failure classes tested include fake test success, test
tampering, stale or replayed evidence, same-source amplification, forged
provenance, capability/version spoofing, and more.

Every corpus label is structurally marked as synthetic
(`SyntheticMechanismTest`) — never treated as, or confusable with,
real human-adjudicated ground truth.

## What's actually verified today

The frozen corpus currently has 26 fixtures. As of the v0.0.8 gate
evaluation, **22 attacks are Detected or Prevented, and 4 genuinely
Escape**: forged trust-class label authenticity, cross-claim evidence
replay, and a known scalability limitation in the evidence-independence
module under very large evidence pools (a real performance issue, not an
exploit). This is disclosed honestly, not rounded up — an attack that
merely crashes the test harness is recorded as `Inconclusive`, never as
`Prevented`.

## Evidence authenticity hardening

An untrusted adapter cannot promote its own evidence to a higher trust
class, or to an independent-seeming source, purely by setting fields in
its own payload — authorization is checked against the actual collector's
known identity, not accepted from the payload. Evidence rejected for
trust, freshness, or dependency reasons stays visible with its rejection
reason; it is never silently dropped.

**Known gap:** there is no daemon/acquisition-identity binding yet, so
cross-session attribution at that specific layer is not yet provably
fail-closed. This is tracked, not hidden.

## What signatures and digests do not prove

Where Fornax digests or signs a record (a receipt, a delegation envelope),
that only proves the record wasn't tampered with in transit — it says
nothing about whether the underlying claim is semantically true. See
[Assurance Cases](./assurance-cases.md) for how Fornax keeps those two
ideas distinct throughout.

## See also

- [Shadow Execution](./shadow-execution.md) — isolation controls that keep
  adversarial input from ever touching a real system.
- [Multi-Agent Trust](./multi-agent-trust.md) — dependency-aware handling
  across multiple agents sharing one source.
