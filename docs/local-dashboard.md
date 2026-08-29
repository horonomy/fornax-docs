---
title: Local dashboard
sidebar_position: 10
---

# Local dashboard

`fornax-daemon` serves a browser view of the same data `fornax detail`
prints, at:

```
http://127.0.0.1:4317/dashboard
```

(replace `4317` with your `FORNAX_HTTP_PORT` if you changed it — see
[Configuration](./configuration.md)).

## What it's for

A quick way to glance at recent findings without leaving your browser, or to
share your screen with a teammate without them needing the CLI installed.
It reads from the same `/api/findings/recent` endpoint the `fornax` CLI
uses — one source of truth, not two interpretations of session integrity.

## It's localhost-only

The dashboard binds to `127.0.0.1`, not `0.0.0.0` — it is not reachable from
other machines on your network by default, consistent with Fornax's
local-first, no-cloud-dependency critical path (ADR 0001, D2). If you need
remote access (e.g. a headless dev box), put it behind your own SSH tunnel
or reverse proxy; Fornax does not do this for you and doing so is outside
v0.0.1's scope.

## Troubleshooting

If `/dashboard` doesn't load:

- Confirm the daemon is running: `fornax status` should not print
  `daemon unreachable`.
- Confirm the port matches: if you set `FORNAX_HTTP_PORT` for the daemon,
  browse to that same port.
- See [Troubleshooting](./troubleshooting.md) for more.
