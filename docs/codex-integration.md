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

## What's confirmed vs. what isn't yet

Codex's rollout JSONL field names (e.g. whether tool results carry a literal
`exit_code` key) were not confirmed against a live session as of this
writing — the adapter's field-name assumptions must be verified against a
real captured `rollout-*.jsonl` before being treated as settled, the same
way the Claude Code adapter's exit-code guess turned out to be wrong (see
the [First finding walkthrough](./first-finding-walkthrough.md)).

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
