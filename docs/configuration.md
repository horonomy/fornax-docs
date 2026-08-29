---
title: Configuration
sidebar_position: 9
---

# Configuration

Fornax v0.0.1 is configured entirely through environment variables — there
is no config file yet.

## Environment variables

| Variable | Read by | Default | Purpose |
|---|---|---|---|
| `FORNAX_HOME` | `fornax-daemon`, adapters | `~/.fornax` | Root directory for the evidence database (`fornax.db`) and the Unix Domain Socket (`fornax.sock`). |
| `FORNAX_HTTP_PORT` | `fornax-daemon`, `fornax` CLI | `4317` | Port for the localhost-only HTTP API (`/api/status`, `/api/findings/recent`, `/dashboard`). Must match between the daemon and the CLI/dashboard. |
| `FORNAX_CLOUD_SYNC_ENABLED` | cloud-sync policy gate | unset (disabled) | Must be exactly `1` or `true` (case-insensitive) to permit any Fornax-originated data to leave the machine. Anything else — including other truthy-looking strings like `yes` — leaves sync disabled. See [Privacy & Redaction](./privacy-redaction.md). |

## Example: running multiple isolated instances

Useful for testing, or running Fornax against two unrelated projects without
their evidence mixing:

```bash
FORNAX_HOME=~/.fornax-project-a FORNAX_HTTP_PORT=4317 fornax-daemon &
FORNAX_HOME=~/.fornax-project-b FORNAX_HTTP_PORT=4318 fornax-daemon &

FORNAX_HTTP_PORT=4318 fornax status
```

## What's intentionally not configurable yet

There is no policy file for redaction rules, no per-project allowlist for
cloud sync, and no way to add a custom verifier without writing Rust and
rebuilding — all deliberate v0.0.1 scope cuts (ADR 0001, D6: no
infrastructure without measured need). If you need one of these, check
whether a Jira ticket already tracks it before assuming it's missing by
oversight.
