---
title: Codex integration
sidebar_position: 6
---

# Codex integration

`fornax-hook-codex` targets a different primary integration point than the
Claude Code adapter, because Codex's own capability surface is genuinely
different — Fornax reports these differences truthfully rather than
assuming the two providers are symmetric.

## Primary integration point: rollout files, not hooks

Codex hooks (`PreToolUse`/`PostToolUse`/`Stop`/etc.) exist but are:

- **Opt-in** — require `[features].codex_hooks = true` in
  `~/.codex/config.toml`.
- **Under development** — the schema is actively changing.
- **Overridable by an org admin** — `allow_managed_hooks_only = true` in
  `requirements.toml` can lock them out entirely.

Codex's **on-disk session transcript ("rollout" files)** is always-on
instead, and is what `fornax-hook-codex` reads:

```
~/.codex/sessions/YYYY/MM/DD/rollout-<timestamp>-<uuid>.jsonl
```

One JSON `RolloutLine` (`{type, timestamp, payload: RolloutItem}`) per line
— user message, assistant reply, shell invocation, patch proposal, or
sandbox response. These files are world-readable (mode `0644`) and can grow
large (hundreds of MB to a few GB in long sessions), so a tailing reader
must handle rotation and size, not assume the file stays small.

Unlike the Claude Code adapter, `fornax-hook-codex` is not invoked by Codex
itself — Codex has nothing analogous to a hook that would launch it. Run it
yourself as a standalone, long-running process alongside your Codex session:

```bash
fornax-hook-codex &
```

It finds and tails the most recently modified rollout file under
`~/.codex/sessions/` automatically, or you can point it at a specific one
with `fornax-hook-codex --file <path-to-rollout.jsonl>`.

## What's confirmed vs. what isn't yet

Codex's rollout JSONL wire shape is version-dependent, and both shapes below
are confirmed against real captures rather than assumed:

- On Codex CLI 0.147.0 (live-captured 2026-08-29), a shell execution shows up
  as a `response_item` pair — `custom_tool_call` (the invocation) followed by
  `custom_tool_call_output` (the result), matched by `call_id` — and that
  shape carries **no literal exit code**. Fornax derives one heuristically
  there (looking for a `"Script completed"` marker in the output text) and
  marks the resulting evidence as heuristic, the same pattern used for Claude
  Code's `Bash` tool result (see the
  [First finding walkthrough](./first-finding-walkthrough.md)). On an
  unrecognized output shape, the adapter emits no evidence at all rather than
  guess at a verdict.
- Separately, an `event_msg{type: "exec_command_end"}` shape was confirmed
  against other captured rollout files and **does** carry a literal
  `exit_code` field; the adapter still recognizes it. Which shape a given
  Codex CLI version actually emits is not something Fornax controls, so both
  are handled — re-verify against your installed CLI version before treating
  either as the permanent one, since this surface is under active change.

## Explicit capability gaps (reported, never inferred around)

Fornax's `RuntimeCapabilities` for Codex mark these as unavailable rather
than silently assuming they work:

- Universal tool-call interception with input rewriting (no
  `updatedInput` rewrite support in Codex's `PreToolUse` today).
- A stable, versioned public hook JSON schema shipped with a release.
- Hooks enabled out-of-the-box (opt-in feature flag, and an org admin can
  disable them entirely).
- Guaranteed, non-suppressible hook execution.

A claim that needs one of these to check will resolve `UNAVAILABLE` on
Codex even where the equivalent claim resolves `VERIFIED`/`CONTRADICTED` on
Claude Code — see [Claims, Evidence & Findings](./concepts.md) for why that
asymmetry is reported explicitly instead of smoothed over.

## Legacy `notify` / `notify_command`

Codex also has a coarser, older mechanism: a single `agent-turn-complete`
event via `notify`/`notify_command` in `~/.codex/config.toml` (user-level
config only — project-local config is ignored for this). It's being
deprecated in favor of the `Stop` hook — don't build new integrations on it.

The full, living detail (exact fields, source citations, open questions) is
synced from `fornax-core`'s own capability-matrix research doc — see
**Reference → Research** in the sidebar.
