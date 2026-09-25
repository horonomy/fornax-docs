---
title: Agent Evidence Protocol
sidebar_position: 33
---

# Agent Evidence Protocol

v0.0.8 publishes the **Agent Evidence Protocol** — a vendor-neutral wire
format for exchanging Fornax trust-kernel objects (starting with a
proof-carrying delegation result) between two parties that don't share a
Rust codebase.

The full wire specification, compatibility policy, and threat model live
in `fornax-core`:

- [`docs/protocol/agent-evidence-protocol.md`](https://github.com/horonomy/fornax-core/blob/main/docs/protocol/agent-evidence-protocol.md)
- [`docs/protocol/agent-evidence-protocol-compatibility-policy.md`](https://github.com/horonomy/fornax-core/blob/main/docs/protocol/agent-evidence-protocol-compatibility-policy.md)
- [`docs/protocol/agent-evidence-protocol-threat-model.md`](https://github.com/horonomy/fornax-core/blob/main/docs/protocol/agent-evidence-protocol-threat-model.md)

## What it is, and isn't

The protocol is a documented, versioned wire format — not a transport (it
works equally over a file, a local socket, an HTTP body, or a message bus)
and not a claim of formal standardization. No standards body has reviewed
it; "protocol" here means exactly "documented, versioned wire format,"
nothing more, until real external adoption changes that.

**A verified envelope's digest proves the bytes weren't tampered with — it
never proves the wrapped claim is semantically true.** Those two ideas are
kept structurally distinct throughout: authenticity is a property of the
message, truth is a property the message's own evidence has to earn.

## Genuinely independent, not just superficially separated

v0.0.8 ships two implementations of the wire format, and the second one
(`fornax-protocol-refclient`) has **zero dependency on any other crate in
this workspace** — it only knows the published JSON shape, exactly what an
external consumer would have. A real conformance test
(`two_independent_implementations.rs`) exchanges and verifies a
representative delegation result between the two, and a 9-case conformance
suite rejects malformed, stale, tampered, wrong-scope, and downgraded
messages with typed reasons.

## Running the conformance suite

```bash
cd fornax-core
cargo test -p fornax-protocol -p fornax-protocol-refclient
```

## See also

- [Proof-Carrying Delegation & Multi-Agent Trust](./multi-agent-trust.md)
  — the object this protocol's first version wraps.
