---
title: Quick Start
sidebar_position: 3
---

# Quick Start

Zero to a real Fornax finding, local-only, no cloud account. This reproduces
the same local path used to validate Fornax's core loop (FORNX-34).

## Prerequisites

- Rust (stable) and Cargo — `rustc --version` should print something.
- macOS or Linux (Fornax uses a Unix Domain Socket for adapter → daemon
  transport; there is no Windows support in v0.0.1).
- Claude Code, if you want to see live findings from a real session (Codex
  works too — see [Codex integration](./codex-integration.md)).

## 1. Clone and build

```bash
git clone https://github.com/horonomy/fornax-core.git
cd fornax-core
cargo build --workspace
```

Expected output ends with something like:

```
   Compiling fornax-daemon v0.1.0 (.../fornax-core/crates/fornax-daemon)
   Compiling fornax-cli v0.1.0 (.../fornax-core/crates/fornax-cli)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 12.34s
```

## 2. Start the daemon

```bash
./target/debug/fornax-daemon &
```

The daemon creates `~/.fornax/` (override with `FORNAX_HOME`), opens a Unix
Domain Socket at `~/.fornax/fornax.sock` for adapter events, and serves a
localhost HTTP API on port `4317` (override with `FORNAX_HTTP_PORT`) for the
CLI and dashboard. Nothing here talks to the network beyond `127.0.0.1`.

## 3. Wire up the Claude Code adapter

See [Claude Code integration](./claude-code-integration.md) for the full
hook configuration. The short version — add to your Claude Code settings:

```json
{
  "hooks": {
    "PreToolUse": [{"hooks": [{"type": "command", "command": "fornax-hook-claude"}]}],
    "PostToolUse": [{"hooks": [{"type": "command", "command": "fornax-hook-claude"}]}],
    "Stop": [{"hooks": [{"type": "command", "command": "fornax-hook-claude"}]}]
  }
}
```

Put `target/debug` on your `PATH` (or use the absolute path to
`fornax-hook-claude`) so Claude Code can find the binary.

## 4. Do some real work, then check the verdict

Run a Claude Code session that does something checkable — e.g. ask it to run
your test suite and report the result. Then:

```bash
./target/debug/fornax status
```

```
🛡 ✓ VERIFIED
```

or, if the agent's claim didn't match the evidence:

```
🛡 ✕ CONTRADICTED
```

For the full story behind a verdict:

```bash
./target/debug/fornax detail
```

```
🛡 ✕ CONTRADICTED
  claim:     All tests passed
  rationale: most recent test-runner evidence exit_code=1, contradicting the claim
  verifier:  test_result_verifier_v1
  when:      2026-08-29T03:14:07Z
```

See [First finding walkthrough](./first-finding-walkthrough.md) for exactly
this scenario, reproduced end-to-end with a real captured payload.

## Next

- [Installation](./installation.md) for a persistent setup (PATH, running
  the daemon as a background service, project-scoped vs. global hooks).
- [Configuration](./configuration.md) for every environment variable Fornax
  reads.
- [Local dashboard](./local-dashboard.md) for the browser view of the same
  data `fornax detail` prints.
