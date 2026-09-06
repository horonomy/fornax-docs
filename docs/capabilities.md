---
title: Capabilities
sidebar_position: 24
---

# Capabilities

`fornax capabilities` shows, per `SignalClass`, which signals the runtime(s)
that announced for a session actually exposed this session — one of six
distinct states, never collapsed into a boolean (FORNX-85, ADR-0001 D4).

This is a different thing from the `RuntimeCapabilities` concept described
in [Concepts](./concepts.md#runtimecapabilities): that page covers the
coarser boolean capability checks a *verifier* uses internally before it
runs (`supports_post_tool_use`, etc.). This command renders the newer,
richer per-`SignalClass` taxonomy an adapter *announces* for a session —
six states per class, not a single yes/no per capability.

## Why would I use it?

To answer "what could Fornax actually see in this session?" before you
trust — or question — a finding that says `UNAVAILABLE`, or before relying
on a [reliability](./reliability.md) or [judge](./semantic-judge.md) result
that itself depends on a capability being announced.

## When to use it

Any time a finding looks suspiciously absent or `UNAVAILABLE`, or when
debugging a new provider/adapter integration to confirm it announced what
you expect it to announce.

## How

```bash
fornax capabilities <SESSION>
```

Real-shaped output (values drawn from the CLI's own test fixture for this
response shape):

```
$ fornax capabilities s2
session: s2
  provider: claude_code
    ✓ tool_invocation: available
    ⛔ process_result: unsupported
    ▮ raw_reasoning: redacted (withheld by privacy boundary)
```

When nothing has been announced yet:

```
$ fornax capabilities s1
session: s1
  no capabilities announced yet (no capabilities announced yet by any adapter for this session)
```

## The six states

| State | Icon | Meaning |
|---|---|---|
| `available` | `✓` | The runtime actually exposed this signal this session. |
| `unsupported` | `⛔` | The runtime's provider integration cannot expose this signal at all. |
| `unavailable` | `—` | The runtime could support it, but it wasn't available this particular session. |
| `redacted` | `▮` | The signal exists but was withheld by a privacy boundary — see [Privacy & Redaction](./privacy-redaction.md). |
| `collection_failed` | `✕` | Fornax tried to collect it and failed. |
| *(not yet announced)* | `?` / `◌` | No adapter has announced anything for this session yet, or an unrecognized state tag was returned (forward-compat: shown verbatim, never mapped onto an existing icon). |

None of these collapse into each other: `unsupported` (this provider can
never expose this) reads differently from `unavailable` (could, but didn't
this session), which reads differently again from `redacted` (exists, but
withheld on purpose).

## What happens internally

`fornax capabilities` reads `GET /api/capabilities` on the daemon, which
returns every capability announcement on record for the session, grouped by
provider, each with its full per-`SignalClass` signal list. The CLI renders
every signal individually — never a summary count — the same
never-collapse-the-taxonomy discipline `evidence-graph`/`fusion` follow.

## Constraints

- Requires the daemon running and reachable.
- A signal class not present in the announcement at all is simply absent
  from the list — it is not rendered as `unknown`; only a class the adapter
  actually declared appears.

## What can go wrong

| Symptom | Cause |
|---|---|
| `no capabilities announced yet` | No adapter has sent a capability announcement for this session — check the adapter is actually running and wired up (see [Claude Code integration](./claude-code-integration.md) / [Codex integration](./codex-integration.md)). |
| `(no signal classes declared)` | The provider announced, but declared zero signal classes. |
| A finding renders `UNAVAILABLE` | Cross-check here first — it usually traces back to a signal class shown `unsupported`/`unavailable`/`redacted` for this session. |

## Where to go next

- [Reliability](./reliability.md) — depends on at least one capability announcement existing to build a context key.
- [Privacy & Redaction](./privacy-redaction.md) — what `redacted` actually withholds and why.
- [Concepts: Claim, Evidence, Finding](./concepts.md) — the coarser `RuntimeCapabilities` boolean checks a verifier uses internally.
