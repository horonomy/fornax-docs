---
title: Local runtime & daemon
sidebar_position: 8
---

# Local runtime & daemon

`fornax-daemon` is the one local process Fornax runs. It is a modular
monolith by design (ADR 0001, D1) — adapters, storage, and verifiers are
Rust module boundaries inside this one process, never separate services or
network hops between them.

## What it does, on startup

1. Creates `~/.fornax/` (override with `FORNAX_HOME`) if it doesn't exist.
2. Opens (or creates) the evidence store at `~/.fornax/fornax.db`
   (SQLite, WAL mode, append-only).
3. Removes and recreates a Unix Domain Socket at `~/.fornax/fornax.sock`.
4. Starts two listeners concurrently:
   - The **UDS server**, accepting newline-delimited JSON `IngestMessage`s
     from adapters.
   - An **HTTP server on `127.0.0.1:4317`** (override with
     `FORNAX_HTTP_PORT`), serving `/api/status`, `/api/findings/recent`, and
     `/dashboard`.

## Why a Unix Domain Socket, not HTTP, for adapters

ADR 0001 (D6) rules out an HTTP hop for adapter → daemon events specifically
— it's local IPC, not a service boundary, so it uses the cheaper, simpler
primitive. The HTTP server exists only for the localhost-only surfaces a
browser or the CLI needs (dashboard, status, findings).

## Evidence before interpretation

Raw adapter events are persisted before any claim extraction or
verification runs against them (ADR 0001, D3). This is what makes findings
replayable: a verifier can be re-run against previously captured evidence
without a live agent session, which is also how the ablation/ regression
testing for verifiers themselves works.

## Failure containment

If the daemon isn't running, both the CLI and the adapters degrade
gracefully instead of erroring the agent's turn:

- `fornax status` prints `🛡 fornax: daemon unreachable`.
- `fornax detail` prints `fornax: daemon unreachable (is 'fornax-daemon'
  running?)`.
- The Claude Code / Codex adapters swallow the connection error entirely —
  a coding agent's turn must never be blocked or slowed by Fornax being
  unavailable.

## No cloud dependency on this path

Every piece described here — intake, storage, verification, and the
localhost API — works with all network access disabled except the loopback
interface. Cloud sync is a separate, opt-in, best-effort path; see
[Privacy & Redaction](./privacy-redaction.md).
