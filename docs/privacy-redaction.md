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
immediately. Device registration is self-service (FORNX-137) — see
[Quick Start](./quick-start.md#5-optional-connect-to-beta).

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

## What v0.0.9 enforces about egress

Nothing leaves the machine until you choose an egress profile
(`fornax egress profile-set personal|corporate`). One persisted, audited,
fail-closed decision is asked before **every** outbound attempt — the
audit-checkpoint push, the policy poll, the semantic judge and the monthly
metadata upload:

- **Unconfigured** (the default) ships nothing.
- **Corporate is local-only on this install.** It never uploads evidence or
  checkpoints, and no consent, allowlist entry or environment variable
  overrides that. Entering it revokes every consent. The monthly upload never
  schedules under it. It has exactly two optional outbound paths, both off until you
  configure them: an explicitly allowlisted policy fetch (a GET that carries no
  local data), and an allowlisted semantic-judge gateway that requires a
  recorded corporate processing-authorization reference (a judge sends the
  claim text and redacted evidence you authorize it to receive, so it is not
  metadata-only). With neither configured it makes no request to a
  non-loopback host. **This is a
  setting on the machine, held in a local database its user can edit — it is
  not organization-enforced policy.** A signed organisation policy's
  `egress.cloud_sync_allowed` is not yet consulted, so do not rely on this as
  enterprise-enforced no-egress.
- **Personal** can upload only under a live, expiring, revocable consent, only
  to an allowlisted destination, only while `FORNAX_CLOUD_SYNC_ENABLED=1`
  (that variable can now only tighten the decision, never loosen it), and only
  the classes you consented to.

### Monthly batch upload (personal profile)

Once a personal consent for `evidence_batch_upload` exists, closed months are
uploaded automatically by the daemon (or on demand with `fornax upload run`;
`fornax upload preview` shows the exact bytes first). The upload is
**metadata only**: ids, kinds, providers, timestamps, verdict enums and bounded
labels. Claim text, tool input/output and evidence payloads are never part of
it, and no client follows redirects. Records are copied into a local outbox
*before* the 30-day retention sweep can purge them, each batch is sealed with a
hash that is persisted before the first send, a retry resends identical bytes
under the same idempotency key, and anything that can never be uploaded
(consent ended, size or age bound) is recorded as a gap you can see in
`fornax upload status`. The receiver (`fornax-cloud`) rejects any member key
outside the allowlist and re-checks the hash.

### What is still not enforced

- Policy lives in the local database a local user can edit, so a local user can
  bypass it; a root-owned managed policy file is not implemented.
- A signed organisation policy's `egress.cloud_sync_allowed=false` is not yet
  folded into the decision.
- Raw evidence and claim text are purged after 30 days (findings later); the
  `fornax export-spool` path is manual and its files carry no integrity manifest.
- Local legal hold, a cloud-side retention floor and a local user-deletion
  command are not implemented.

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
