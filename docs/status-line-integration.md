---
title: Status-line integration
sidebar_position: 11
---

# Status-line integration

Claude Code's `statusLine` setting can show Fornax's latest verdict inline,
right where you already look for session state.

## Direct approach

If Fornax is the only thing you want in your status line for a given
project, point `statusLine` straight at the CLI:

```json
{
  "statusLine": {
    "type": "command",
    "command": "fornax status",
    "padding": 1
  }
}
```

```
🛡 ✓ VERIFIED
```

## Wrapper approach (when you already have a status line)

A project-level `statusLine` fully **replaces** the global one — it's a
single command, not a mergeable list. If you already have a global status
line (e.g. showing git branch, context usage, cost), don't overwrite it:
write a small wrapper script that calls your existing status line first,
then appends the Fornax segment as an extra line.

`fornax-core` does exactly this for its own dogfooding — see
`scripts/fornax-statusline.sh` in
[`horonomy/fornax-core`](https://github.com/horonomy/fornax-core), which
calls the existing global status-line script with the same stdin JSON, then
appends the Fornax segment. Wire it up as:

```json
{
  "statusLine": {
    "type": "command",
    "command": "<REPO_ROOT>/scripts/fornax-statusline.sh",
    "padding": 1,
    "refreshInterval": 3
  }
}
```

replacing `<REPO_ROOT>` with this project's absolute path — `settings.local.json`
is per-machine and gitignored, so a hardcoded local path there is correct
(unlike in a committed file).

## Failure containment

The wrapper script fails safe: if `fornax` isn't built or the daemon isn't
running, it degrades to a plain message rather than erroring — a Fornax
problem never breaks your status line, let alone the rest of Claude Code.

## See also

[Self-host / local development](./self-host-local-development.md) has the
complete project-scoped hook + status-line configuration `fornax-core` uses
on itself, including why it's project-scoped rather than global.
