---
title: Claude Code integration
sidebar_position: 5
---

# Claude Code integration

`fornax-hook-claude` is a thin adapter: it reads a Claude Code hook's JSON
payload from stdin, translates it into Fornax's canonical event format, and
forwards it to the local daemon over a Unix Domain Socket. It contains no
verification logic itself (adapters stay thin by design — the same rule
applies to the Codex adapter).

## Wire it into Claude Code

Add to `~/.claude/settings.json` (global) or `.claude/settings.local.json`
(project-scoped — see [Installation](./installation.md#project-scoped-vs-global-setup)):

```json
{
  "hooks": {
    "PreToolUse":   [{ "hooks": [{ "type": "command", "command": "fornax-hook-claude" }] }],
    "PostToolUse":  [{ "hooks": [{ "type": "command", "command": "fornax-hook-claude" }] }],
    "Stop":         [{ "hooks": [{ "type": "command", "command": "fornax-hook-claude" }] }],
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "fornax-hook-claude" }] }]
  }
}
```

If a project-local `hooks` object already exists (e.g. other tools' hooks),
add these entries alongside them under the same event keys — Claude Code
does not guarantee that project-level hooks merge with global ones, so
treat it as a full replace and copy every existing entry forward too.

## What Fornax actually observes

Confirmed empirically against a live Claude Code v2.1.238 session (not
assumed from docs) — see the capability matrix under **Reference** in the
sidebar for the full, living detail:

| Event | What it gives Fornax |
|---|---|
| `PreToolUse` | Exact tool name + args, before execution. |
| `PostToolUse` | The tool's result as Claude Code itself summarizes it — for `Bash`, this is `{stdout, stderr, interrupted, isImage, noOutputExpected}`, **not** a literal exit code. |
| `SessionStart` | Session lifecycle only — no tool evidence. |

Known gap: no hook fires when a *backgrounded* shell/Monitor/Workflow tool
call actually completes, and there's no raw unbuffered stdout tap
independent of `tool_response`. When evidence a verifier needs isn't
observable, the finding is `UNAVAILABLE` — reported, never guessed around.
See [Claims, Evidence & Findings](./concepts.md).

## A real bug this surfaced (and fixed)

Because `tool_response` for `Bash` has no `exit_code` field, an earlier
version of this adapter guessed at field names (`exit_code`, `exitCode`,
`returncode`, `status`) that never actually appear. The fix uses a
documented heuristic instead (stderr non-empty / interrupted / stdout
present with empty stderr) and marks the resulting evidence as
heuristic-derived, so downstream consumers know it isn't a literal exit
code. See the [First finding walkthrough](./first-finding-walkthrough.md)
for the full incident this came from.

## Isolating the integration to one project

If you don't want Fornax's hooks active in every Claude Code session, use
`.claude/settings.local.json` in one repo only — see
[Self-host / local development](./self-host-local-development.md) for
fornax-core's own dogfooding setup, including how it keeps this isolated
from your global config and from other repos.
