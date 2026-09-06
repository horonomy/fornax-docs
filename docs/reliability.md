---
title: Reliability & drift
sidebar_position: 21
---

# Reliability & drift

`fornax reliability` renders a context-scoped historical reliability signal
for a given provider/model/adapter/task combination — plus, optionally, a
drift check comparing that context against a second model or adapter
version (FORNX-105). This subcommand is a pure display/wiring layer: it
computes no new statistic itself, only renders what `compute_reliability`/
`detect_drift` (FORNX-104) already produced from `ReliabilityContextKey`
(FORNX-103).

## Why would I use it?

To answer "historically, how often has this exact provider/model/adapter
combination, on this kind of task, actually been right?" — and, when
evaluating a model or adapter bump, "did reliability actually change, or is
this just noise?"

## When to use it

Before trusting a model/adapter version for a risk-sensitive task class, or
right after bumping one, to check for drift rather than assuming the new
version behaves the same as the old one.

:::warning Off by default — a real privacy gate, not a bug
Historical reliability aggregation is **disabled by default**. The daemon
refuses to aggregate at all unless
`[reliability].historical_aggregation_enabled = true` is set in
`$FORNAX_HOME/config.toml`. This is a local/SaaS privacy policy gate, not an
"insufficient data" state — the two are rendered as distinct, never
conflated messages.
:::

## How

Enable it first:

```toml
# $FORNAX_HOME/config.toml
[reliability]
historical_aggregation_enabled = true
```

Then, every context dimension is required (there's no partial/default
context — an empty toolset must be passed explicitly as `""`, not omitted,
so it's always a stated fact rather than an accidental broader cohort):

```bash
fornax reliability <SESSION> \
  --provider claude_code \
  --model-family claude \
  --model-version claude-sonnet-5 \
  --adapter-version 0.0.4 \
  --task-class test_execution \
  --toolset shell,file_edit \
  --repository-class public_oss \
  --policy-version policy-v3 \
  --verifier-version verifier-v2 \
  --fusion-version fusion-v1
```

Real-shaped output (values drawn from the CLI's own reliability test
fixtures):

```
session: s1
  context: provider=claude_code model_family=claude model_version=claude-sonnet-5
   adapter_version=0.0.4 task_class=test_execution toolset=[shell,file_edit]
   repository_class=public_oss policy_version=policy-v3 verifier_version=verifier-v2
   fusion_version=fusion-v1
  sample support: confident (40 observations)
  reliability estimate: 90.0% (CI [80.0%, 100.0%] @ 95% confidence)
```

A bare percentage is never shown alone — the full context always prints in
the same output before the estimate, structurally, not just by convention.
A sparse cohort renders an explicit message instead of a number:

```
  sample support: insufficient data -- 3 of 30 needed
```

### Drift check

Add `--compare-model-version` and/or `--compare-adapter-version` to compare
against a second version instead of a plain read — either flag alone is a
legitimate drift query; anything unspecified falls back to the baseline's
own value:

```bash
fornax reliability <SESSION> ... --compare-model-version claude-sonnet-4
```

```
  drift: ⚠ drift detected -- reliability changed between versions
  baseline:
    context: ... model_version=claude-sonnet-4 ...
    sample support: confident (40 observations)
    ⚠ stale -- superseded by drift, not shown as current confidence
  comparison:
    context: ... model_version=claude-sonnet-5 ...
    sample support: confident (40 observations)
    reliability estimate: 55.0% (CI [45.0%, 65.0%] @ 95% confidence)
```

When it's actually stable, both estimates print plainly with no stale
marker (`✓ stable -- no meaningful reliability change detected`). When the
two cohorts differ in a dimension that makes them not comparable at all,
every differing dimension is named explicitly:

```
  drift: ✕ not comparable -- this historical prior does not apply: differs in task_class
```

And when there isn't enough data on either side to judge:

```
  drift: ? insufficient data for comparison -- at least one side lacks sample support
```

## What happens internally

`fornax reliability` reads `GET /api/reliability` on the daemon, which reads
the session's announced capabilities to build the context key's capability
fingerprint, looks up (or compares) the reliability cohort matching every
supplied dimension, and returns the signal (or drift assessment) — the CLI
only renders it.

## Constraints

- Aggregation is off by default (privacy gate above).
- A `ReliabilityContextKey` has no default/partial constructor — every
  dimension is required on every call.
- Requires the session to have at least one capability announcement on
  record; without one, a context key can't be built at all.

## What can go wrong

| Symptom | Cause |
|---|---|
| `reliability aggregation unavailable: historical reliability aggregation is disabled by local policy` | The `[reliability]` config gate is off — this is expected out of the box. |
| `no capabilities announced yet ...` | The session hasn't announced any adapter capabilities — a context key can't be built without one. |
| `insufficient data -- N of M needed` | Not enough historical samples for this exact cohort — narrowing dimensions won't help; you need more history. |
| `⚠ drift detected` | Reliability genuinely changed between the two compared versions — the baseline's confidence is marked stale, not silently reused. |
| `✕ not comparable` | The two contexts differ in a dimension beyond just model/adapter version — check the named dimensions. |

## Where to go next

- [Capabilities](./capabilities.md) — what "capabilities announced" means and how to check it for a session.
- [Fusion & decision](./fusion-and-decision.md) — the live, per-claim verdict this historical signal complements but never replaces.
- [Privacy & Redaction](./privacy-redaction.md) — the broader local-first/opt-in stance this gate follows.
