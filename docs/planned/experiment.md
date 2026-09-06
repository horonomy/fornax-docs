---
title: Experiments (planned)
sidebar_position: 5
---

# Experiments (planned for v0.0.4, counterfactual verification)

:::info[Planned — not yet in any released version]
`fornax experiment` exists today only on Fornax's in-progress
`next/v0.0.4` development branch. No CHANGELOG entry, no epic sign-off,
not present in `main` or the `v0.0.3` release line. Everything below
describes the target shape from that branch's current source
(`experiment_ux.rs`) and its own test fixtures — it is not runnable
against any released `fornax` binary today.
:::

Once shipped, `fornax experiment` will preview, run, and render a bounded
counterfactual robustness experiment against a claim: revert something to
a baseline state, observe whether the claim's evidence changes the way the
hypothesis predicts, and get back causally-labeled evidence — never just an
LLM's opinion about causality (FORNX-101).

:::note[Designed to be client-side, no daemon involved]
`fornax experiment` is designed to run entirely against local filesystem
paths — it will never call the daemon. An experiment needs a real
working-tree `source_root` to stage an isolated copy under, and that's a
local filesystem argument, not something a daemon HTTP endpoint should
accept from a client. This follows the same precedent as the already-shipped
[`export-spool`](../export-spool.md): designed to work without the daemon
running at all.
:::

## Why would I use it?

A verifier or the semantic judge can tell you a claim looks contradicted.
An experiment lets you test *why*, causally: stage an isolated copy of the
working tree, revert the file the claim depends on, and observe whether the
claim's evidence actually changes as a result — evidence for causality, not
just correlation.

## When to use it

When you want to distinguish "this evidence happens to look bad" from "this
specific change is what caused the evidence to look bad" — and you're
willing to run a bounded, isolated mutation to find out.

## How (target shape, not yet runnable)

### 1. See what would actually be runnable once shipped

```bash
fornax experiment templates
```

The output below is the exact literal string `render_templates()` produces
in the in-development branch's source — not a live CLI run:

```
available experiment templates:

  revert_file_to_baseline  [ELIGIBLE]
    Reverts a named file, inside an ephemeral isolated copy of the working
    tree, to caller-supplied baseline content, then observes whether that
    file's content in the staged copy matches what was requested.
    requires: ephemeral_worktree_mutation
    intervention.params: {"path": <string>, "content": <string>}

  substitute_tool_result  [NOT ELIGIBLE]
    Defined by FORNX-99's contract; FORNX-100's executor has no built-in
    InterventionApplier for it -- reports unsupported if attempted.

  disable_sensor  [NOT ELIGIBLE]
    Defined by FORNX-99's contract; FORNX-100's executor has no built-in
    InterventionApplier for it -- reports unsupported if attempted.
```

Only `revert_file_to_baseline` has a built-in executor today — the other two
are real `ExperimentSpec` contract shapes (FORNX-99) with no
`InterventionApplier` behind them yet (FORNX-100).

### 2. Author a spec (FORNX-99's wire format), then preview it

```json
{
  "schema_version": 1,
  "id": "b3f6c1a2-9e4d-4a7f-8c3b-1d2e3f4a5b6c",
  "version": 1,
  "session_id": "session-1",
  "hypothesis": {
    "claim_id": "c1",
    "expected_observations": [
      {"signal_class": "process_result", "description": "exit code changes after reverting the file"}
    ],
    "narrative": "if the file caused the failure, reverting it fixes it"
  },
  "baseline": {"description": "file at HEAD before intervention", "evidence_ids": []},
  "intervention": {
    "kind": "revert_file_to_baseline",
    "description": "revert claimed.txt to baseline content",
    "params": {"path": "claimed.txt", "content": "after\n"}
  },
  "stop_conditions": [{"timeout_elapsed": {"max_seconds": 60}}],
  "allowed_side_effects": ["ephemeral_worktree_mutation"],
  "provenance": {
    "created_at": "2026-09-02T00:00:00Z",
    "created_by": "human-review",
    "environment": "worktree:/tmp/example",
    "tool_version": "fornax-cli 0.0.4",
    "runtime_versions": {}
  }
}
```

```bash
fornax experiment preview --spec spec.json
```

Preview is pure and read-only — it never stages a worktree, never touches
the store, never runs anything:

```
experiment: b3f6c1a2-9e4d-4a7f-8c3b-1d2e3f4a5b6c v1  (session: session-1)
hypothesis claim: c1
  expects: ProcessResult -- exit code changes after reverting the file
  narrative: if the file caused the failure, reverting it fixes it
baseline: file at HEAD before intervention
intervention (RevertFileToBaseline): revert claimed.txt to baseline content
side effects requested:
  - ephemeral_worktree_mutation (granted by this host's global policy)
risk: low-risk -- eligible to auto-run
(preview only -- nothing was executed)
```

A spec naming a side-effect class this host's policy doesn't grant shows
that explicitly, before you ever try to run it:

```
side effects requested:
  - ephemeral_worktree_mutation (granted by this host's global policy)
  - network_call (NOT granted by this host's global policy)
risk: higher-risk -- requires explicit policy approval for:
  - network_call
```

A spec whose `intervention.kind` has no built-in executor (`substitute_tool_result`,
`disable_sensor`) previews as not eligible, never as a false "low-risk" pass:

```
kind: SubstituteToolResult -- NOT ELIGIBLE (no built-in executor support; running this would report unsupported)
(preview only -- nothing was executed)
```

### 3. Run it

```bash
fornax experiment run --spec spec.json --source /path/to/working/tree --staging-root /tmp/fornax-experiments
```

A spec whose allow-list needs only `ephemeral_worktree_mutation` auto-runs
end-to-end inside the isolation boundary — the source tree is staged as an
isolated copy first and is never mutated directly. A spec naming any other
side-effect class only runs if the host's global policy already grants that
class too:

```
BLOCKED: needs policy approval
  this experiment requires side-effect classes this host's global policy
  does not grant:
    - network_call
  the experiment was NOT run. grant the class(es) above in
  $FORNAX_HOME/config.toml's [experiment] table if this is intended, then re-run.
```

On completion, baseline and intervention evidence are shown as two
genuinely separate sections, never merged into one contradiction/verified
banner:

```
experiment: b3f6c1a2-9e4d-4a7f-8c3b-1d2e3f4a5b6c v1
computed_at: 2026-09-02T00:05:00+00:00

✓ COMPLETED -- hypothesis relation: Supports

--- baseline (observational, pre-intervention) ---
  evidence: ev-old  relation: Contradicts

--- intervention (interventional, post-intervention) ---
  evidence: ev-new  relation: Supports
```

Every other outcome (`Inconclusive`, `Blocked`, `Unsupported`) gets its own
honest, distinct label instead.

## What will happen internally

`fornax experiment run` is designed to stage an isolated copy of `--source`
under `--staging-root`, apply the intervention inside that copy only,
observe the result with a narrow, honest observer (it checks only whether
the targeted file now holds the requested content — it does not re-run
evidence collection or interpret what the change means for the hypothesis
at large), and map the outcome into causally-labeled evidence via
`causal_evidence_from_experiment_result` (FORNX-102).

## Constraints (as designed)

- Only `revert_file_to_baseline` is planned to have a built-in executor at
  first.
- The isolation boundary is designed to only ever auto-cover
  `ephemeral_worktree_mutation` — any other side-effect class named in a
  spec must already be granted by this host's `[experiment]` policy,
  checked independently before the executor ever runs.
- No daemon dependency planned — but also no daemon-backed persistence:
  results would be printed, not stored, unless separately exported/linked.

## What to watch for once it ships

| Symptom | Cause |
|---|---|
| `NOT ELIGIBLE (no built-in executor support ...)` | The intervention kind has no `InterventionApplier` yet — check `fornax experiment templates`. |
| `BLOCKED: needs policy approval` | The spec names a side-effect class beyond `ephemeral_worktree_mutation` that this host hasn't granted. |
| `INCONCLUSIVE` | The narrow observer couldn't confirm the intervention's effect (e.g. unreadable staged path, mismatched content) — never fabricated as a pass. |

## Where to go next

- [Fusion & decision](./fusion-and-decision.md) — planned, where the resulting causal evidence is designed to ultimately feed back into a verdict.
- [Concepts: Claim, Evidence, Finding](../concepts.md) — shipped today; the underlying evidence/claim model an experiment's observations would attach to.
