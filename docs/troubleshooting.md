---
title: Troubleshooting
sidebar_position: 16
---

# Troubleshooting

## `fornax status` prints "daemon unreachable"

The CLI couldn't reach `http://127.0.0.1:<FORNAX_HTTP_PORT>/api/status`
(default port `4317`). Check:

```bash
ps aux | grep fornax-daemon
```

If nothing is running, start it: `fornax-daemon &`. If `FORNAX_HTTP_PORT` is
set differently for the CLI than for the daemon, they won't agree on a
port — see [Configuration](./configuration.md).

## `fornax status` prints "no findings yet" and never changes

This means the daemon and CLI are working, but no evidence relevant to a
verifier has been captured yet. Check:

- Is `fornax-hook-claude` (or `fornax-hook-codex`) actually wired into your
  agent's hook config? See [Claude Code integration](./claude-code-integration.md)
  / [Codex integration](./codex-integration.md).
- Is the binary on `PATH`, or referenced by absolute path in the hook
  config?
- Did the agent's turn actually include something a verifier checks for
  (currently: a claim about test results)? Other kinds of claims have no
  verifier yet in v0.0.1.

## Every finding says `UNAVAILABLE`

This is the exact failure mode documented in the
[First finding walkthrough](./first-finding-walkthrough.md) (FORNX-53): if
an adapter never announces its `RuntimeCapabilities`, every verifier treats
evidence as unusable and returns `UNAVAILABLE` regardless of what's actually
been captured. If you're running a build older than that fix, rebuild from
current `main`. If you're on current `main` and still seeing this
consistently, it may indicate a genuine capability gap for your provider —
see the capability matrix under **Reference** in the sidebar to check
whether the event you expected is actually confirmed available.

## Claude Code doesn't seem to run the hook at all

- Confirm the hook command resolves: run `fornax-hook-claude` in your shell
  directly — Claude Code invokes it the same way your shell would.
- If using project-scoped `.claude/settings.local.json`, confirm you're in
  the right repo and the file wasn't accidentally gitignored *out* of
  existing (it should exist locally, just not be committed).
- Check whether a global `hooks` config for the same event key is present —
  Claude Code doesn't guarantee project-level and global `hooks` merge; see
  [Self-host / local development](./self-host-local-development.md).

## The local dashboard won't load

See [Local dashboard](./local-dashboard.md#troubleshooting).

## Still stuck?

Fornax v0.0.1 is OSS and actively developed — open an issue on
[`horonomy/fornax-core`](https://github.com/horonomy/fornax-core/issues)
with your OS, the command you ran, and what you expected vs. what happened.
