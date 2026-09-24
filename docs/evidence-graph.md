---
title: Evidence graph
sidebar_position: 20
---

# Evidence graph

`fornax evidence-graph` renders the full evidence graph behind a claim —
every linked-evidence relation and every missing-evidence note — instead of
just the single collapsed verdict `fornax status`/`fornax detail` show
(FORNX-89, shipped in v0.0.4).

## Why would I use it?

`fornax status`/`fornax detail` give you the verdict Fornax landed on.
`evidence-graph` gives you the trail that verdict was built from: which
evidence supports the claim, which contradicts it, and — just as
important — which evidence the graph expected but doesn't have. That third
category exists specifically so "no evidence recorded" is never silently
indistinguishable from "evidence was checked and found supportive."

## How

```bash
fornax evidence-graph <CLAIM> <SESSION>
```

```
$ fornax evidence-graph c1 s1
claim: c1
session: s1
  ✚ supports    ev-1  test_result_verifier_v1
  ✕ contradicts ev-2  test_result_verifier_v1
  ◌ missing     expected_test_run  no matching test-runner evidence recorded
```

Every rationale line shows its relation type, the evidence/expectation id,
and (for supports/contradicts) which verifier produced it — never
collapsed into a single count. When a claim's evidence carries an
unresolved supports/contradicts conflict, that's surfaced explicitly rather
than resolved silently.

### Three distinct "nothing to show" outcomes

A blank-looking result can mean three genuinely different things, and
`evidence-graph` never conflates them:

- **Error** — the daemon failed to compute the graph (check daemon logs).
- **Not found** — no claim with this id is on record for this session.
- **Empty but recorded** — the claim exists and the graph was computed, but
  no evidence has been linked to it yet.

## What happens internally

`fornax evidence-graph` reads `GET /api/evidence-graph` on the daemon. All
computation happens daemon-side; the CLI only renders what's returned.

## What can go wrong

| Symptom | Cause |
|---|---|
| `no such claim on record` | Wrong claim/session id. |
| `error: ...` | Daemon-side failure computing the graph — check daemon logs. |
| Graph present but empty | The claim exists but no evidence has been linked to it yet — not an error. |

## Where to go next

- [Fusion & decision](./fusion-and-decision.md) — the aggregated verdict computed from this same graph.
- [Concepts: Claim, Evidence, Finding](./concepts.md) — the underlying data model and the five verdict states.
