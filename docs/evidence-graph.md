---
title: Evidence graph
sidebar_position: 18
---

# Evidence graph

`fornax evidence-graph` shows every typed link between one claim and the
evidence the daemon has connected to it — plus every note recording that
evidence was looked for and explicitly could not be collected. It is the
Evidence Explorer's local half (FORNX-90), backed by
`fornax_store::Store::evidence_graph_for_claim` (FORNX-89).

## Why would I use it?

`fornax detail` gives you a verdict and one rationale line. When you need to
see the raw material behind that verdict — every piece of evidence that was
linked, how it relates to the claim, and whether anything is known to be
missing rather than just absent — this is the command that shows it. It's
the tool for "why does this claim say `CONTRADICTED` — show me the actual
evidence," and it's also what [`fusion`](./fusion-and-decision.md) computes
its verdict from.

## When to use it

Any time a finding's rationale isn't enough on its own: debugging a verifier,
auditing a `REVIEW`/`CONTRADICTED` result before trusting it, or checking
whether a signal you expected to be captured actually was.

## How

```bash
fornax evidence-graph <CLAIM> <SESSION>
```

Both `CLAIM` and `SESSION` are ids, not text — pull them from `fornax
detail` output or from the daemon's event stream. Real, worked example:

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

The three relation types are `supports`, `contradicts`, and `neutral`; each
group is rendered with a distinct icon (`✚`, `✕`, `•`) and every individual
link is listed — never collapsed into a count. A relation type the daemon
returns that isn't one of these three is still shown, tagged `◌`, rather
than silently dropped.

If evidence was sought but couldn't be collected, it shows up separately:

```
  ◌ missing (1)
    tool_result: unavailable (adapter does not report exit_code for this tool)
```

:::note Three distinct "nothing to show" outcomes
This command deliberately renders three different situations that could
otherwise look identical:
- the claim id is unknown to the daemon at all,
- the claim exists but nobody has linked or noted anything for it
  ("nobody has looked"), and
- the claim exists with evidence explicitly noted missing even though no
  link was made ("looked, but it could not be collected").

Collapsing any of these into a generic "no evidence" message would erase a
real distinction — see [Concepts](./concepts.md#evidence) for why immutable,
honestly-labeled evidence is a project invariant, not a nicety.
:::

## What happens internally

The CLI calls `GET /api/evidence-graph` on the local daemon, which reads
`evidence_graph_for_claim` directly from the store — no computation happens
in the CLI itself, it only renders what the daemon returns.

## Constraints

- Requires the daemon to be running and reachable (`FORNAX_HTTP_PORT`,
  default `4317`) — this command has no offline/file-based mode, unlike
  [`export-spool`](./export-spool.md).
- A daemon-side read failure is reported as its own `error:` line, distinct
  from "no such claim on record" — don't conflate the two if you're scripting
  against this output.

## What can go wrong

| Symptom | Cause |
|---|---|
| `no such claim on record` | The claim id doesn't exist for this session, or you passed the wrong session id. |
| `error: ...` | The daemon hit a store-level failure reading the graph — check daemon logs. |
| A conflict banner (`⚠ conflict`) | Real evidence disagrees. This is surfaced, not resolved — see [Fusion & decision](./fusion-and-decision.md) for how fusion handles it. |

## Where to go next

- [Fusion & decision](./fusion-and-decision.md) — the verdict computed from
  this same graph.
- [Concepts: Claim, Evidence, Finding](./concepts.md) — the underlying data
  model.
- [Custom detail command](./custom-detail-command.md) — the higher-level,
  human-readable finding view.
