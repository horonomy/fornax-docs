---
title: Introduction
sidebar_position: 1
slug: /intro
---

# What is Fornax?

Fornax is an **evidence-first agent-integrity system** for coding agents
(Claude Code, Codex, and — with narrower coverage —
[OpenCode](./opencode-integration.md)). It answers one question:

> What should I believe about what this agent is telling me, given the
> evidence currently available?

Coding agents narrate their own work — "all tests pass," "I fixed the bug,"
"the build is green." That narration is sometimes wrong, and it is never
independently checked by default. Fornax watches a session in real time,
captures immutable evidence (tool calls, exit codes, transcripts), and checks
the agent's claims against that evidence.

## The five-state verdict

Every claim Fornax checks resolves to exactly one of five states — never a
made-up trust score, and never silently collapsed into a binary pass/fail:

| Verdict | Icon | Meaning |
|---|---|---|
| `VERIFIED` | 🛡 ✓ | Evidence confirms the claim. |
| `CONTRADICTED` | 🛡 ✕ | Evidence directly contradicts the claim. |
| `UNVERIFIED` | 🛡 ? | No relevant evidence was observed this session. |
| `REVIEW` | 🛡 ! | Evidence is ambiguous or partial — a human should look. |
| `UNAVAILABLE` | 🛡 — | The runtime can't expose the evidence this check needs (a missing capability is reported honestly, never guessed around). |

## How it fits together

```
Coding agent session
   │  (hook / transcript tail)
   ▼
Adapter (thin, provider-specific)  ──▶  translates provider events
   │                                    into a canonical AgentEvent
   ▼
fornax-daemon (one local process)
   ├─ immutable evidence store (SQLite/WAL, append-only)
   ├─ verifiers: Claim + Evidence[] + Capabilities → Finding
   └─ localhost API: status line, detail command, dashboard
```

Everything on this path runs locally. There is no cloud dependency in the
critical path — evidence capture, verification, and the status line all work
with network access disabled. See [Privacy & Redaction](./privacy-redaction.md)
for what that guarantee actually covers.

## Where to go next

- New to Fornax? Start with [Why Fornax?](./why-fornax.md) for the problem
  it solves, then [Quick Start](./quick-start.md) to get a finding in your
  terminal in a few minutes.
- Already sold? Jump straight to [Installation](./installation.md).
- Want to see the "aha" moment first? Read the
  [First finding walkthrough](./first-finding-walkthrough.md) — a real,
  reproduced case of an agent claiming tests passed while they hadn't.

## Project status

Fornax is v0.0.1, OSS, local-first. The Rust workspace (`fornax-daemon`,
`fornax-cli`, the Claude Code and Codex adapters, the store, and the
verifier) is implemented and tested; cloud/SaaS sync is opt-in and disabled
by default (see [Privacy & Redaction](./privacy-redaction.md)). Source:
[`horonomy/fornax-core`](https://github.com/horonomy/fornax-core).
