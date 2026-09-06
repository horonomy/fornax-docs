---
title: Evidence graph (planned)
sidebar_position: 1
---

# Evidence graph (planned for v0.0.4)

:::info[Planned — not yet in any released version]
`fornax evidence-graph` exists today only on Fornax's in-progress
`next/v0.0.4` development branch. It has no CHANGELOG entry, no epic
sign-off, and is **not present** in `main` or in the `v0.0.3` release line
(engineering-complete/QA-signed-off but not yet tagged). Everything below
describes the target shape from that branch's current source and its own
test fixtures — it is not runnable against any released `fornax` binary
today. This page will be updated (and this notice removed) once the
command actually ships.
:::

Once shipped, `fornax evidence-graph` will show every typed link between
one claim and the evidence the daemon has connected to it — plus every note
recording that evidence was looked for and explicitly could not be
collected. It's designed as the Evidence Explorer's local half (FORNX-90),
backed by `fornax_store::Store::evidence_graph_for_claim` (FORNX-89).

## Why would I use it?

`fornax detail` gives you a verdict and one rationale line. When you need to
see the raw material behind that verdict — every piece of evidence that was
linked, how it relates to the claim, and whether anything is known to be
missing rather than just absent — this will be the command that shows it.
It's designed for "why does this claim say `CONTRADICTED` — show me the
actual evidence," and it's also what the planned
[`fusion`](./fusion-and-decision.md) command computes its verdict from.

## When would I use it

Once available: any time a finding's rationale isn't enough on its own —
debugging a verifier, auditing a `REVIEW`/`CONTRADICTED` result before
trusting it, or checking whether a signal you expected to be captured
actually was.

## How (target shape, not yet runnable)

```bash
fornax evidence-graph <CLAIM> <SESSION>
```

Both `CLAIM` and `SESSION` will be ids, not text — pulled from `fornax
detail` output or from the daemon's event stream. Below is the target
output shape, drawn honestly from the in-development branch's own
`render_evidence_graph` test fixtures — not a live capture, since the
command doesn't exist in any released binary yet:

```
$ fornax evidence-graph claim-42 session-abc
claim: claim-42
session: session-abc
  ✚ supports (2)
    evidence: ev-9f1  linked_at: 2026-08-29T03:14:02Z
    evidence: ev-9f4  linked_at: 2026-08-29T03:14:05Z
  ✕ contradicts (1)
    evidence: ev-9f7  linked_at: 2026-08-29T03:14:07Z
  ⚠ conflict: 2 supports vs 1 contradicts (unresolved)
```

The three relation types are planned as `supports`, `contradicts`, and
`neutral`; each group is designed to render with a distinct icon (`✚`, `✕`,
`•`) with every individual link listed — never collapsed into a count. A
relation type the daemon returns that isn't one of these three is designed
to still show, tagged `◌`, rather than being silently dropped.

If evidence was sought but couldn't be collected, it's designed to show up
separately:

```
  ◌ missing (1)
    tool_result: unavailable (adapter does not report exit_code for this tool)
```

:::note[Three distinct "nothing to show" outcomes (by design)]
This command is designed to deliberately render three different situations
that could otherwise look identical:
- the claim id is unknown to the daemon at all,
- the claim exists but nobody has linked or noted anything for it
  ("nobody has looked"), and
- the claim exists with evidence explicitly noted missing even though no
  link was made ("looked, but it could not be collected").

Collapsing any of these into a generic "no evidence" message would erase a
real distinction — see [Concepts](../concepts.md#evidence) for why
immutable, honestly-labeled evidence is a project invariant, not a nicety.
:::

## What will happen internally

The CLI will call `GET /api/evidence-graph` on the local daemon, which
reads `evidence_graph_for_claim` directly from the store — no computation
happens in the CLI itself, it only renders what the daemon returns.

## Constraints (as designed)

- Will require the daemon running and reachable (`FORNAX_HTTP_PORT`,
  default `4317`) — no offline/file-based mode, unlike
  [`export-spool`](../export-spool.md), which is already shipped.
- A daemon-side read failure is designed to report as its own `error:`
  line, distinct from "no such claim on record."

## What to watch for once it ships

| Symptom | Cause |
|---|---|
| `no such claim on record` | The claim id doesn't exist for this session, or the wrong session id was passed. |
| `error: ...` | The daemon hit a store-level failure reading the graph. |
| A conflict banner (`⚠ conflict`) | Real evidence disagrees. Designed to be surfaced, not resolved — see [Fusion & decision](./fusion-and-decision.md) for how fusion is designed to handle it. |

## Where to go next

- [Fusion & decision](./fusion-and-decision.md) — planned, the verdict computed from this same graph.
- [Concepts: Claim, Evidence, Finding](../concepts.md) — the underlying data model, shipped today.
- [Custom detail command](../custom-detail-command.md) — the higher-level, human-readable finding view, shipped today.
