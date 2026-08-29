---
title: Self-host / local development
sidebar_position: 15
---

# Self-host / local development

Fornax is local-first by construction — there's no separate "self-hosting"
mode to opt into, running it yourself from source *is* the normal way to run
it in v0.0.1. This page covers two things: running `fornax-core` from
source, and how it dogfoods its own status-line integration on itself
(useful as a template for wiring Fornax into any project).

## Building fornax-core from source

Covered fully in [Installation](./installation.md) — clone, `cargo build
--workspace`, run `fornax-daemon`. There's no separate "dev mode" build; the
same binaries you build are what you run.

## Project-scoped dogfooding (fornax-core's own setup)

`fornax-core` wires Fornax into its own Claude Code sessions using
**project-scoped**, not global, configuration — a pattern worth copying for
your own projects.

### Why project-scoped, not global

A Fornax integration bug must not make Claude Code sessions in unrelated
repositories misbehave, and the integration shouldn't be imposed on other
contributors who clone the repo. Claude Code's `.claude/settings.local.json`
is scoped to exactly one project, is never committed (Claude Code adds it to
your global git excludes automatically the first time it writes there), and
takes precedence over both the shared project `.claude/settings.json` and
your user-global `~/.claude/settings.json`.

### Setup

1. Build the binaries: `cargo build --workspace` from the repo root.
2. Start the daemon once per session: `./target/debug/fornax-daemon &`
3. Create `.claude/settings.local.json` in the repo root (the main checkout,
   not a worktree), wiring `fornax-hook-claude` into `PreToolUse`/
   `PostToolUse`/`Stop` and pointing `statusLine` at a wrapper script — see
   [Claude Code integration](./claude-code-integration.md) and
   [Status-line integration](./status-line-integration.md) for the exact
   JSON. If you already have other hooks configured globally, copy them
   forward into the same file — Claude Code doesn't guarantee project-level
   `hooks` merge with global ones.

### Verifying isolation

From inside the project: run a Bash tool call, confirm the Fornax segment
appears in the status line and `fornax detail` shows real findings after a
session ends.

From an unrelated repo: confirm the status line looks exactly as it did
before, and no Fornax wrapper script ever runs — project-local settings
never apply outside the one project they're defined in (a Claude Code
platform guarantee, not something Fornax enforces itself).

## Contributing to fornax-core

See [`CONTRIBUTING.md`](https://github.com/horonomy/fornax-core/blob/main/CONTRIBUTING.md)
in `fornax-core` for the full development workflow: one ticket per branch
and PR, Gitmoji commits, `cargo fmt`/`clippy`/`test` before every commit, and
merge-commit-only PRs.
