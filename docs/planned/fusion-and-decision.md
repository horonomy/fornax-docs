---
title: Fusion & decision (planned)
sidebar_position: 2
---

# Fusion & decision (planned for v0.0.4)

:::info Planned — not yet in any released version
`fornax fusion` and `fornax decision` exist today only on Fornax's
in-progress `next/v0.0.4` development branch. No CHANGELOG entry, no epic
sign-off, not present in `main` or the `v0.0.3` release line. Everything
below describes the target shape from that branch's current source and its
own test fixtures — it is not runnable against any released `fornax`
binary today.
:::

Two commands, one underlying computation, once shipped: `fornax fusion` is
designed to compute and render the live fused verdict for a claim; `fornax
decision` will compute the exact same fusion, then apply a risk policy on
top to turn it into an actionable `PROCEED` / `REVIEW` / `BLOCK`
recommendation. `decision` is designed to never show the recommendation on
its own — it will always render the full fusion detail alongside it,
reusing the same rendering code `fusion` uses.

## What is fusion?

`BaselineFusionPolicy::fuse` (`fornax_verify::fusion`, FORNX-304) reads a
claim's real evidence graph — the same graph [`evidence-graph`](./evidence-graph.md)
shows you — and combines every linked-evidence relation and missing-evidence
note into one `FusedFinding`: a verdict, an uncertainty band, and a
rationale made of individual, itemized `RationaleEntry` rows.

If the real evidence graph for a claim is empty, fusion falls back to the
`project_graph` projection instead of just reporting no evidence — this is
documented today's actual production behavior (FORNX-93), not a bug. The
response tells you which source was used via `graph_source`: `"graph"` for
the claim's real evidence graph, `"projected"` when the fallback fired.

## What is decision?

`decision` applies `fornax_verify::decision::DefaultRiskPolicy` for a
requested risk class (`strict`, `balanced`, or `lenient` — `balanced` is the
default, and the class every hard safety floor in `fornax_verify::decision`
is written against) to the same fused finding, producing a recommendation.
Re-running with a different `--risk` on the same claim shows how the same
evidence can justify a different action — that comparison is exactly what
"user can inspect why the recommendation changed" means at the CLI layer.

## Why would I use these?

- `fusion` when you want the aggregated verdict for a claim without wading
  through the raw evidence graph link-by-link.
- `decision` when you need an actual go/no-go call for something downstream
  — a CI gate, an approval step — and you want to see exactly which
  evidence justified it in the same breath.

## How (target shape, not yet runnable)

```bash
fornax fusion <CLAIM> <SESSION>
```

Target output shape (fields and values below are drawn from the
in-development branch's own test fixture for this exact response shape,
`fusion_fixture` in `fornax-cli`'s test suite — not invented, but not a
live capture either, since the command doesn't exist in any released
binary yet):

```
$ fornax fusion c1 s1
claim: c1
session: s1
  graph_source: graph
  🛡 ✓ VERIFIED  (uncertainty: qualified)
  policy: deterministic_baseline_v1 v1  computed_at: 2026-09-02T00:00:00+00:00
  rationale (2):
    ⚠ independence_unverified [caveat]: link link-1's evidence carries no recorded correlation group
      link_ids: link-1
      evidence_ids: ev-1
    🛡 verdict_decided [decided]: 1 distinct supporting vote(s) survived fusion, no contradicting votes
      link_ids: link-1
```

Every rationale entry shows its rule name, effect (`counted`, `discounted`,
`caveat`, or `decided` — each with its own icon), the id(s) it references,
and a detail string; nothing is collapsed into a summary count. When a claim
carries an unresolved supports/contradicts conflict, an additional
`⚠ unresolved conflict: not auto-resolved` line appears right under the
verdict.

```bash
fornax decision <CLAIM> <SESSION> [--risk strict|balanced|lenient]
```

Same claim, applying `DefaultRiskPolicy` (`default_risk_policy_v1`) on top —
note the decision policy's identity is deliberately distinct from the
fusion policy's:

```
$ fornax decision c1 s1 --risk balanced
recommendation: ! REVIEW  (risk: balanced, policy: default_risk_policy_v1 v1)
  verdict=Verified uncertainty=Qualified risk=Balanced -> Review

claim: c1
session: s1
  graph_source: graph
  🛡 ✓ VERIFIED  (uncertainty: qualified)
  policy: deterministic_baseline_v1 v1  computed_at: 2026-09-02T00:00:00+00:00
  rationale (2):
    ...
```

The `recommendation:` block only appears when the claim was found and no
daemon error occurred — otherwise you get exactly the same not-found/error
output `fusion` would show, because `decision` shares that code path.

## What will happen internally

Both are designed to read `GET /api/fusion` / `GET /api/decision` on the
daemon. The daemon computes `fuse()` over the claim's evidence graph (or
falls back to `project_graph`); `decision` additionally runs
`DefaultRiskPolicy` over the resulting `FusedFinding` for the requested
risk class. No computation happens in the CLI — it only renders what the
daemon returns.

## Constraints (as designed)

- Will require the daemon running and reachable, same as `evidence-graph`.
- `decision`'s `--risk` defaults to `balanced`; the hard safety floors in
  `fornax_verify::decision` are written against that class specifically, so
  don't assume `lenient` simply loosens every rule uniformly.

:::warning Unresolved conflicts are shown, not silently resolved
When linked evidence both supports and contradicts a claim, fusion surfaces
an explicit `⚠ unresolved conflict` banner rather than picking a side. A
`decision` recommendation computed on top of an unresolved conflict is real
input for a downstream gate, but it is not the same thing as a clean,
unanimous evidence trail — always read the rationale, not just the verdict
word.
:::

## What can go wrong

| Symptom | Cause |
|---|---|
| `no such claim on record` | Wrong claim/session id. |
| `error: ...` | Daemon-side failure computing fusion — check daemon logs; `decision` shows no recommendation block in this case. |
| `graph_source: projected` | The claim's real evidence graph was empty; fusion fell back to the `project_graph` projection (FORNX-93) — treat the verdict as weaker evidence than a `graph`-sourced one. |
| Recommendation flips between risk classes | Expected — that's the point of `--risk`; check the rationale for which entries the risk policy weighted differently. |

## Where to go next

- [Evidence graph](./evidence-graph.md) — planned, the raw graph fusion is computed from.
- [Semantic judge](./semantic-judge.md) — planned, an additional opt-in opinion rendered alongside this same fusion detail.
- [Concepts: Claim, Evidence, Finding](../concepts.md) — the underlying data model and the five verdict states, shipped today.
