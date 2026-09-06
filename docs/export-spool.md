---
title: Export spool
sidebar_position: 23
---

# Export spool

`fornax export-spool` exports one session's events, claims, evidence, and
capability announcements out of the local store into a directory-based
spool — one wire-compatible JSON envelope file per message, laid out the
way a consumer like `fornax-cloud`'s uploader spool expects (FORNX-60,
FORNX-62).

## Why would I use it?

This is the local half of getting your evidence somewhere else — a Beta
cloud sync uploader, a colleague's machine, an offline archive — without
requiring the daemon to be running or reachable. It reads
`$FORNAX_HOME/fornax.db` directly.

## When to use it

- Preparing a session's data for upload to a `fornax-cloud`-style consumer.
- Archiving a session's full evidence trail before cleaning up local state.
- Debugging what the daemon actually persisted for a session, file by file.

:::note Works while the daemon is stopped
Unlike `evidence-graph`/`fusion`/`decision`/`judge`/`reliability`/`capabilities`,
this command reads the SQLite store directly and needs no running daemon —
the same precedent [`fornax experiment`](./experiment.md) follows for the
same reason.
:::

## How

```bash
fornax export-spool --session <SESSION> --out <OUT>
```

```
$ fornax export-spool --session s-aha --out /tmp/fornax-spool
exported session s-aha: 4 event(s), 2 claim(s), 6 evidence, 1 capabilities -> /tmp/fornax-spool/pending
```

Each exported row becomes one file at `<out>/pending/<id>.json`, internally
tagged with `"type"`: `"event"`, `"claim"`, `"evidence"`, or `"capabilities"`.
`<out>/pending/` is created if it doesn't already exist.

A `capabilities` file is only written when the session has at least one
capability announcement on record — a session with none produces the same
3-category output export produced before capability export existed
(FORNX-62).

## What happens internally

`export_spool_from_store` reads events, claims, evidence, and capabilities
for the session straight from the store, then writes each row as its own
envelope file (write-then-rename, so a reader never sees a partially
written file). The exported `capabilities` envelope stays wire-compatible
with `fornax-cloud`'s original nine-key legacy shape — `session_id`,
`schema_version`, and the full per-signal `signals` array are added
**additively** on top (FORNX-301), never replacing the frozen legacy keys a
downstream `device_capabilities` consumer already reads:

```
notes, provider, supports_post_tool_use, supports_pre_tool_use,
supports_session_stop_event, supports_subagent_lifecycle,
supports_tool_response_capture, supports_transcript_tail
```

## Constraints

- Reads `$FORNAX_HOME/fornax.db` directly — no daemon, no HTTP call.
- If some evidence rows fail to deserialize, they're skipped and reported to
  stderr by count and id — the export still completes for everything that
  did deserialize:

  ```
  fornax: 1 of 7 evidence rows for session s-aha failed to deserialize and were not exported: ev-bad (unknown variant)
  ```

## What can go wrong

| Symptom | Cause |
|---|---|
| `exported session ...: 0 event(s), 0 claim(s), 0 evidence, 0 capabilities` | The session id has no recorded data at all — check you passed the right session id. |
| Evidence row skip warning on stderr | A stored evidence row didn't deserialize against the current schema — the export still proceeds for the rest. |
| No `capabilities` file appears | Expected when the session never received a capabilities announcement — see [Capabilities](./capabilities.md). |

## Where to go next

- [Capabilities](./capabilities.md) — what the exported `capabilities` envelope's `signals` array actually means.
- [Privacy & Redaction](./privacy-redaction.md) — what leaves your machine if you point an uploader at this spool.
- [Concepts: Claim, Evidence, Finding](./concepts.md) — the data model of what's being exported.
