---
title: Semantic judge (planned)
sidebar_position: 3
---

# Semantic judge (planned for v0.0.4)

:::info[Planned — not yet in any released version]
`fornax judge` exists today only on Fornax's in-progress `next/v0.0.4`
development branch. No CHANGELOG entry, no epic sign-off, not present in
`main` or the `v0.0.3` release line. Everything below describes the
target shape from that branch's current source and its own test fixtures
— it is not runnable against any released `fornax` binary today.
:::

Once shipped, `fornax judge` will send a claim plus a bounded, structured
excerpt of its evidence graph to a locally configured, self-hosted judge
model (an Ollama-compatible endpoint), and render the model's opinion
alongside the same full fusion detail the planned
[`fusion`](./fusion-and-decision.md)/[`decision`](./fusion-and-decision.md)
commands render (FORNX-94).

:::warning[The judge never replaces the deterministic trail]
The judge's opinion is one more evidence source, always shown *alongside*
the real evidence-graph-derived verdict, never instead of it. It is
**disabled by default** — a user who has never touched `$FORNAX_HOME/config.toml`
gets no judge calls at all.
:::

## Why would I use it?

Deterministic verifiers check what they were explicitly written to check.
A semantic judge can catch cases a literal rule doesn't cover — subtler
phrasing, indirect evidence — by reasoning over the same evidence a human
reviewer would read. It's a second opinion, not a replacement verifier.

## When to use it

Opt in when you want that second opinion on ambiguous or `REVIEW`-verdict
claims, and you're comfortable running a local model (or pointing at one
you already run). Skip it for anything where the deterministic trail alone
is sufficient — it adds a real network call and a real model dependency for
no benefit if you don't need the extra signal.

## How (target shape, not yet runnable)

Planned to be off by default, enabled via config first:

```toml
# $FORNAX_HOME/config.toml
[semantic_judge]
enabled = true
endpoint = "http://localhost:11434/v1"   # default; Ollama-compatible
model = "llama3.1"                        # default
timeout_ms = 5000                         # default
```

Then:

```bash
fornax judge <CLAIM> <SESSION> [--allow-raw-evidence]
```

Target output shape (drawn from the in-development branch's own test
fixture for this response shape — not a live capture):

```
$ fornax judge c1 s1
judge (model-derived, NOT independent evidence): ✓ SUPPORTED
  model: llama3.1  endpoint: http://localhost:11434/v1  called_at: 2026-09-02T00:00:00+00:00
  rationale: the evidence excerpt is consistent with the claim

claim: c1
session: s1
  graph_source: graph
  🛡 ✓ VERIFIED  (uncertainty: qualified)
  ...
```

A disabled, unreachable, or timed-out judge renders honestly as
`— UNAVAILABLE` — never a fabricated pass/fail:

```
judge (model-derived, NOT independent evidence): — UNAVAILABLE
  ...
  rationale: semantic judge disabled via [semantic_judge].enabled = false
```

When the judge's verdict disagrees with the deterministic evidence, that's
shown as an explicit banner, not silently dropped:

```
  ⚠ disagreement: the judge's verdict differs from the deterministic
    evidence for this claim -- shown, not resolved
```

## `--allow-raw-evidence`

By default, the excerpt sent to the judge is designed to be redacted the
same way any other Fornax evidence is (see
[Privacy & Redaction](../privacy-redaction.md)). `--allow-raw-evidence` is
planned as an explicit opt-in to send unredacted evidence content to the
judge instead — off by default per FORNX-94's "raw protected evidence"
acceptance criterion.

## What will happen internally

`fornax judge` is designed to read `GET /api/judge` on the daemon. The
daemon will build a bounded evidence-graph excerpt for the claim, call the
configured Ollama-compatible endpoint, and map the response into a
`verdict`/`rationale`/`disagreement` shape — one of `supported`,
`contradicted`, `inconclusive`, or `unavailable` (four distinct icons, never
collapsed: `✓`, `✕`, `?`, `—`). It will then reuse `fusion`'s own render
function to print the full evidence-graph detail underneath.

## Constraints (as designed)

- Disabled by default (`[semantic_judge].enabled = false`).
- Will require a reachable Ollama-compatible endpoint — a real network
  call to `localhost` by default, not a Fornax-hosted service.
- Raw evidence stays redacted unless `--allow-raw-evidence` is passed.

## What to watch for once it ships

| Symptom | Cause |
|---|---|
| `— UNAVAILABLE` | Judge disabled, endpoint unreachable, or the call timed out — the exact `rationale` string tells you which. |
| `⚠ disagreement` | The judge's opinion contradicts the deterministic fusion verdict — read both rationales, don't just trust one. |
| `error:` with no judge block | Daemon-side failure (e.g. the judge task panicked) — check daemon logs. |
| `no such claim on record` | Wrong claim/session id. |

## Where to go next

- [Fusion & decision](./fusion-and-decision.md) — planned, the deterministic trail the judge is shown alongside.
- [Privacy & Redaction](../privacy-redaction.md) — shipped today; what "redacted evidence" means before you'd reach for `--allow-raw-evidence`.
- [Reliability](./reliability.md) — planned, a different, purely historical-statistics signal, not to be confused with the judge's live model opinion.
