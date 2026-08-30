---
title: Installation
sidebar_position: 4
---

# Installation

Fornax v0.0.1 is source-only — build from `fornax-core` with Cargo. There is
no published crate or package manager release yet.

## Build the workspace

```bash
git clone https://github.com/horonomy/fornax-core.git
cd fornax-core
cargo build --workspace --release
```

This produces four binaries under `target/release/`:

| Binary | Crate | Purpose |
|---|---|---|
| `fornax-daemon` | `fornax-daemon` | The one local process: event intake, evidence store, verifiers, localhost API. |
| `fornax` | `fornax-cli` | `fornax status` / `fornax detail` — reads from the daemon's localhost API. |
| `fornax-hook-claude` | `fornax-adapter-claude` | Claude Code hook adapter. |
| `fornax-hook-codex` | `fornax-adapter-codex` | Codex rollout-tail adapter. |

## Put the binaries on your PATH

```bash
export PATH="$(pwd)/target/release:$PATH"
```

Add that line to your shell profile to make it persistent. Claude Code
invokes `fornax-hook-claude` by name as a hook command, so it must be
resolvable on `PATH` (or referenced by absolute path in your hook config —
see [Claude Code integration](./claude-code-integration.md)). Codex does not
invoke `fornax-hook-codex` at all — it's a standalone process you run
yourself (`fornax-hook-codex &`) that tails Codex's rollout transcript; see
[Codex integration](./codex-integration.md) for why, and how to start it.

## Run the daemon

The daemon is a single long-lived process, started once per machine (not per
project, not per session):

```bash
fornax-daemon &
```

For a persistent setup, run it under your OS's service manager (`launchd` on
macOS, `systemd --user` on Linux) instead of a background shell job — Fornax
does not ship a service unit yet, so this is a manual step. If the daemon
isn't running, the CLI and adapters degrade gracefully (see
[Local runtime & daemon](./local-runtime-daemon.md)) rather than erroring.

## Verify the install

```bash
fornax status
```

```
🛡 fornax: no findings yet
```

That message — not an error — means the binary, PATH, and daemon connection
are all working; you just haven't produced a finding yet. Continue with the
[Quick Start](./quick-start.md).

## Project-scoped vs. global setup

Fornax adapters can be wired into Claude Code's **global** settings
(`~/.claude/settings.json`, applies to every project) or **project-local**
settings (`.claude/settings.local.json`, applies to one repo only, never
committed). Project-scoped is recommended while you're evaluating Fornax: a
bug in the integration can't affect unrelated sessions, and it isn't
imposed on other contributors who clone the repo. See
[Self-host / local development](./self-host-local-development.md) for the
full project-scoped example fornax-core uses on itself.
