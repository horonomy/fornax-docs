---
title: OpenCode integration
sidebar_position: 6.5
---

# OpenCode integration

**Status: PARTIAL.** OpenCode is a real, shipped Fornax integration —
architecture-fitness-tested against a live opencode session — but it is
genuinely narrower than the Claude Code and Codex adapters, and set up
manually rather than by a CLI installer. This page states that honestly
instead of implying parity that doesn't exist.

## Why this integration looks different

OpenCode's integration mechanism is a third, distinct shape — not an
external hook-script process spawned per event (Claude Code), and not a
poll/tail of a transcript file the provider writes on its own schedule
(Codex). OpenCode loads a small **in-process JavaScript/TypeScript
plugin** (the `@opencode-ai/plugin` `Plugin`/`Hooks` API), and its own
runtime invokes that plugin's hooks synchronously around real events.

Fornax's side of that plugin, `plugin/fornax-capture.js`, forwards each
hook invocation verbatim as one NDJSON line —
`{"hook": "<name>", "at": "<ISO8601>", "payload": <the hook's real
input/output>}` — over stdin to this crate's binary,
`fornax-hook-opencode`, which is spawned once when the plugin initializes
and kept alive for the life of the opencode process. `fornax-hook-opencode`
never talks to opencode's JS/TS runtime directly; the plugin is the only
thing that does.

## Set it up (manual — no CLI installer yet)

Unlike Claude Code and Codex, there is no `fornax install-opencode` /
`fornax uninstall-opencode` subcommand — `fornax --help` confirms this:
the CLI only offers `install-claude`/`uninstall-claude` and
`install-codex`/`uninstall-codex`. Wiring OpenCode up is a manual,
one-time step for now (whether it should ever become a one-command
installer, like the other two providers, is a separate product decision
outside the scope of this page):

1. Build `fornax-core` per [Installation](./installation.md) and make sure
   `fornax-hook-opencode` is on `PATH` — opencode's plugin runtime spawns
   it by name.
2. Add `plugin/fornax-capture.js` (from your `fornax-core` checkout) to
   the project's opencode config:

   ```json
   {
     "plugin": ["<path to your fornax-core checkout>/crates/fornax-adapter-opencode/plugin/fornax-capture.js"]
   }
   ```

3. Start an opencode session as usual. The plugin spawns
   `fornax-hook-opencode` on load and pipes hook events to it for the
   life of the process; it degrades to a no-op (never crashes your
   opencode session) if the binary is missing or dies.

## What's actually translated (and what isn't)

Per the adapter's own scope decision (FORNX-161's acceptance criteria was
"one real event path, not broad parity," not full coverage of every
opencode hook):

| opencode hook | Translated as | Notes |
|---|---|---|
| `tool.execute.before` | `PreToolUse` event | Tool name + args, before execution. |
| `tool.execute.after` | `PostToolUse` event + evidence | See below — this is the one hook with a real advantage over the other two adapters. |
| `event` → `session.created` | `SessionStart` | Session lifecycle only. |
| `event` → `session.idle` | `SessionEnd` | Session lifecycle only. |
| `chat.message`, `permission.ask`, `plugin.init`, and every other `event` bus type (`message.updated`, `session.updated`, ...) | **Recognized, but `Ignored`** | A real, recognized shape with no canonical signal class mapped to it yet — not a parse failure, and not evidence of a broken adapter. A future adapter version may translate more of these; this one deliberately doesn't. |
| Any hook name this adapter has never seen | `Unrecognized` | Reported as such, never silently dropped. |

The standout finding from building this adapter: opencode's
`tool.execute.after` payload carries a **literal**
`output.metadata.exit` integer exit code. Claude Code's `Bash` tool result
has no such field (Fornax derives a heuristic there — see
[Claude Code integration](./claude-code-integration.md)), and Codex's
rollout shape usually doesn't either (Fornax falls back to a text-marker
heuristic there — see [Codex integration](./codex-integration.md)).
OpenCode is the first of the three providers where `ProcessResult`
evidence is genuinely non-heuristic.

## Explicit capability gaps (reported, never inferred around)

`OpenCodeAdapter::probe()` declares these conservatively, matching what
this adapter version actually translates — confirmed against a real, live
opencode v1.18.25 session:

- **`SubagentLifecycle` — `Unsupported`.** The `@opencode-ai/plugin` Hooks
  interface has no subagent-specific hook at all in this version —
  structurally absent, not merely unobserved this session.
- **`FinalResponse` — `Unavailable`.** The `event` hook's
  `message.updated`/`message.part.updated` payloads genuinely carry the
  agent's final response text, but this adapter version doesn't translate
  them yet — scoped out per FORNX-161's single-event-path AC, not a
  structural gap.
- **`ReasoningSummary` / `RawReasoning` / `TokenLogprobs` — `Unsupported`.**
  No such hook or message-part type was observed in the Hooks interface
  for a local tool-calling model session.
- **`InternalModelSignals` — `Unavailable`.** `message.updated` events
  carry token/cost telemetry in principle; this adapter version doesn't
  translate it.

A claim that needs one of these to check resolves `UNAVAILABLE` on
OpenCode, the same honest-gap behavior described for Codex in
[Claims, Evidence & Findings](./concepts.md) — never inferred as a pass.

## Going deeper

This page covers the setup and translation story a user needs. For the
full empirical evidence behind these claims — the live-session capture,
the fitness-test methodology, and the exact opencode v1.18.25 behavior
this adapter was verified against — see, under **Reference → Research**:

- [Third-provider fitness report](./reference/research/0002-third-provider-fitness-report.md)
- [OpenCode live-transport verification](./reference/research/0003-opencode-live-transport-verification.md)
