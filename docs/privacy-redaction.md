---
title: Privacy & Redaction
sidebar_position: 14
---

# Privacy & Redaction

## The invariant

Raw prompt content, source code, file contents, sensitive paths, shell/tool
arguments, secrets, and private API responses default to **local-only**
(ADR 0001, D7). The local critical path — evidence capture, verification,
status line, detail command, dashboard — works entirely with cloud network
access disabled. Cloud sync is strictly async, best-effort, and only after
policy explicitly approves it.

## Cloud sync defaults to off

```rust
pub fn cloud_sync_allowed() -> bool {
    std::env::var("FORNAX_CLOUD_SYNC_ENABLED")
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(false)
}
```

Unset, or set to anything other than `1`/`true` (case-insensitive) — including
other truthy-looking strings like `yes` — leaves sync disabled. A cloud
uploader now exists (in the separate `fornax-cloud` service, as an opt-in
**Beta** preview, not GA) and must consult this gate before any network
call, so a user can disable sync mid-session and have it take effect
immediately. A guided device-registration/connect flow for turning this on
without hand-wiring the environment variable and credentials yourself is
still being built (FORNX-151) — see [Quick Start](./quick-start.md#5-optional-connect-to-beta-coming-soon).

## Redaction at the ingest boundary

Before any evidence payload is persisted, Fornax scans it for recognizable
secret shapes and redacts them — a conservative, pattern-based classifier,
not a guarantee. Applied once, at the boundary, not re-derived per
downstream consumer:

- **GitHub tokens** (`ghp_`, `gho_`, `ghu_`, `ghs_` prefixes).
- **Env-style secret assignments** — a line containing
  `TOKEN=`/`API_KEY=`/`APIKEY=`/`SECRET=`/`PASSWORD=`/`PRIVATE_KEY=`
  (case-insensitive) is redacted in full, since the value sits on the same
  line as its name.
- **Generic high-entropy tokens** — a 20–200 character unbroken
  alphanumeric-ish run (letters, digits, `_-./+=`) with both letters and
  digits and no whitespace — the shape of an API key, not natural-language
  text.

```
input:  GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz
output: [REDACTED: possible secret assignment]

input:  7 failed, 1 passed in 3.21s
output: 7 failed, 1 passed in 3.21s        (untouched — not secret-shaped)
```

Redaction is deliberately biased toward false positives: redacting
something benign is far cheaper than missing a real secret. It applies
recursively through JSON payloads — only string *values* are scanned, field
names are left alone (a key isn't a secret).

## What "redacted" does not mean

Redacted is not the same as "safe to sync." Redaction removes recognizable
secret shapes from what gets stored; whether anything leaves the machine at
all is a separate, independent gate (`cloud_sync_allowed()` above). Both
checks exist, and neither substitutes for the other.

## Testing this claim, not just asserting it

The local critical path's independence from cloud availability is tested
explicitly with cloud config disabled — this isn't just written down in an
ADR, it's a real test condition Fornax's own CI runs against (FORNX-34).

Redaction at the ingest boundary — the point where evidence first reaches
the local daemon, before it is stored or spooled for upload — is covered by
an automated regression test and has been independently re-verified with a
live canary marker. What has **not** had the same depth of independent,
end-to-end re-verification is the further path an uploaded envelope takes
once it leaves that boundary: transport through `fornax-cloud`'s uploader,
ingest, and backend, into the hosted dashboard. That downstream path relies
on the uploader's own last-line-of-defense egress guard rather than a
second full pipeline re-check. This isn't rounded up to "fully verified" —
it's a real, disclosed gap, not a hidden one.
