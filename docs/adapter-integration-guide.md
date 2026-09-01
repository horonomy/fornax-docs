---
title: Provider & Sensor Integration Guide
sidebar_position: 17
---

# Provider & sensor integration guide

This guide is for anyone adding a new agent provider (a "Claude Code", a
"Codex CLI", an "opencode") to Fornax, or adding a new evidence sensor to an
existing provider adapter. It answers the questions a contributor hits
before they've reverse-engineered the internals: what contract does an
adapter implement, where does new evidence live, when do you reach for the
schemaless escape hatch instead of a typed field, what must you redact
yourself, and how do you prove your adapter is correct.

It is a synthesis of source-of-truth material that lives next to the code
it describes in `fornax-core`, not a replacement for it:

- `fornax-core`'s `docs/contributing/adding-an-adapter.md` — the practical
  step-by-step checklist.
- `fornax-core`'s ADR 0004 (adapter contract) and ADR 0005 (schema
  evolution) — the binding decisions, synced verbatim into this site's
  **Reference → Architecture Decisions** section when built against a
  `fornax-core` checkout.
- `fornax-core`'s adapter capability matrix and evidence sensor contract
  research docs — the empirically-grounded per-provider tables, synced
  into **Reference → Research**.
- [Privacy & Redaction](./privacy-redaction.md) — the local redaction
  boundary, authored in this repo.

If this guide and the synced `fornax-core` reference material ever
disagree, the reference material (synced verbatim from `fornax-core` at
build time) wins — it lives next to the code and is regenerated on every
build.

## 1. Adapter lifecycle and capability contract

Every provider adapter is a crate under `crates/fornax-adapter-<provider>/`
in `fornax-core`, implementing two traits from `fornax-types`:

- **`CapabilityProbe::probe()`** — declares, conservatively, what this
  adapter's runtime can actually observe. Never declare a `SignalClass` as
  `Available` unless you have confirmed it against a real captured payload.
  Every signal your adapter cannot expose is either:
  - `Unsupported` — this runtime **fundamentally** cannot expose the
    signal (a structural gap in the provider itself), or
  - `Unavailable` — the signal exists in principle for this provider, but
    this adapter version/session/config doesn't confirm or translate it.

  `Unknown` is what a signal class reads as when an adapter declares no
  opinion about it at all — distinct from both of the above; it means "not
  yet assessed," not "assessed and found absent." Undeclared is not the
  same claim as `Unsupported`.

- **`AgentAdapter::normalize(session_hint, native) -> NormalizationOutcome`**
  — one match over the provider's native discriminator field, producing
  `Messages(Vec<AgentEvent>)`, `Ignored { reason }`, or `Unrecognized {
  discriminator }` per case. Rules that hold for every adapter:
  - **Never** panic or return an `Err` — malformed/unexpected native input
    is expected input, not a bug.
  - **Never** forward a raw, un-vetted native payload body into any
    downstream shape as a way of "not losing information" for something you
    don't recognize. `Unrecognized` carries only a type-tag
    `discriminator`, deliberately never the payload itself — this is what
    keeps a future upstream breaking change *reported*, not silently
    misinterpreted or leaked.
  - If your transport needs to correlate two native payloads (a
    start/end pair, matched by call id), hold that state as a field on your
    adapter struct — `normalize` takes `&mut self` for exactly this.

Three concrete integration shapes exist today, matching the three real
providers, and a new adapter should pick whichever actually matches its
provider's integration point rather than forcing one of the others:

| Provider | Integration point | Pattern |
|---|---|---|
| Claude Code | External hook-script process, spawned per event | Stateless, one-shot binary reading a single JSON payload from stdin per invocation. See [Claude Code integration](./claude-code-integration.md). |
| Codex CLI | On-disk session transcript ("rollout" file) the provider writes on its own schedule | Long-lived process tailing the active `rollout-*.jsonl`. See [Codex integration](./codex-integration.md). |
| opencode | In-process plugin/callback API the provider's own runtime loads and invokes synchronously | A small companion script in the provider's plugin language, loaded in-process by the provider, spawns your adapter's binary **once** as a long-lived child and pipes one line per hook invocation to its stdin for the life of that process. |

A fourth pattern will exist the day a fourth genuinely different
integration mechanism shows up — don't force a new provider into hooks or
file-tailing if its real integration point is neither.

Stamp identity on every capability declaration and every evidence record:

```rust
fn stamped_capabilities(adapter: &WidgetAdapter, session_id: &str) -> RuntimeCapabilities {
    let mut caps = adapter.probe();
    caps.notes.insert("session_id".to_string(), session_id.to_string());
    caps.notes.insert("adapter_version".to_string(), adapter.adapter_version().to_string());
    caps
}
```

`fornax-types` is the **only** Fornax crate an adapter crate may depend on
— adapters stay thin translators, never reaching into `fornax-store`,
`fornax-daemon`, or `fornax-verify` directly.

## 2. EvidenceSensor / EvidenceSource contract and provenance

Before an adapter existed, evidence collection was ad-hoc code inline in
each adapter's translation function. `EvidenceSensor` gives every
collector — a Bash exit-code heuristic, a Git-outcome parser, a future
CI-webhook or reasoning-summary sensor — one shared shape:

```rust
trait EvidenceSensor {
    fn name(&self) -> &'static str;
    fn required_capabilities(&self) -> &'static [SignalClass];
    fn trust_class(&self) -> TrustClass;
    fn collect(&self, event: &AgentEvent, caps: &RuntimeCapabilities) -> SensorOutcome;
}
```

`SensorOutcome` is a **struct** (`evidence: Vec<Evidence>`, `state:
SignalAvailability`, `detail: Option<String>`), not an enum — this lets a
sensor report *partial* availability (some evidence collected, then a
capability gap or a real collection failure) without lying in either
direction. A sensor-internal timeout is reported as `state:
SignalAvailability::CollectionFailed` with a `detail` naming it, reusing
the same taxonomy rather than a separate error type.

Every collected `Evidence` carries structured provenance on
`Evidence::source: Option<EvidenceSource>`, complementary to (not a
replacement for) the free-text `Evidence::provenance` breadcrumb:

| Field | Answers |
|---|---|
| `sensor_name` | Which sensor produced this |
| `trust_class` | *How much* to trust it (see table below) |
| `collection_method` | *How* it was observed — a distinct axis from trust class |
| `collector_version` | The producing sensor implementation's own version |
| `freshness` | Which clock a timestamp came from, plus a caveat for clock disagreement |
| `tamper_boundary` | A human/UI-readable explanation of the trust boundary crossed |
| `collected_at` / `provider` | When and from which provider |

Trust classes (`TrustClass`):

| Class | Meaning | Example |
|---|---|---|
| `AgentAdjacent` | The provider's own account of what happened, not independently measured | Bash exit-code heuristic, Codex `exec_command_end` |
| `HostObserved` | Fornax measured it itself | none yet |
| `IndependentExternal` | A system outside both agent and host | none yet |
| `HumanReviewed` | Confirmed/entered by a person | none yet |
| `ModelInternal` | The model's own internals (reasoning, logprobs) | worked-example sensor only |

Collection method and trust class vary **independently** — two sensors can
share a trust class (both `AgentAdjacent`) while differing in collection
method (`HookCallback` for an in-process callback vs. `FilePoll` for tailing
a transcript file). Don't conflate the two axes when writing a new sensor:
pick each based on what actually happened, not on what "feels similar" to
an existing sensor.

Missing provenance is never fabricated. A pre-provenance record (written
before a field existed) deserializes each new field to an honest,
explicitly-named unknown (`CollectionMethod::PreProvenance`,
`ClockSource::PreProvenance`, a literal "unknown (record predates
tamper-boundary tracking)" description) — never a plausible-looking guess
reconstructed from other fields that happen to be known.

## 3. Canonical payload vs. `ExtensionEnvelope` — when to use which

`Evidence::payload` is where evidence normally lives, and it comes in two
forms with genuinely different guarantees:

### Canonical (`EvidenceKind` + a typed payload struct)

One typed Rust struct per `EvidenceKind` variant
(`ExitCodePayload`, `ToolResultPayload`, `FileDiffPayload`,
`ProcessObservationPayload`, `TranscriptExcerptPayload`, ...), all
`#[serde(deny_unknown_fields)]` — **closed** shapes. `EvidenceKind` itself
is a closed enum. `validate_canonical_payload(kind, payload)` checks that a
given `(EvidenceKind, payload)` pair actually matches its declared shape.
This is the default, common-case path: a canonical field is a
**cross-provider commitment** — core code, verifiers, and storage all get
to assume it means the same thing regardless of which provider produced
it.

### `ExtensionEnvelope` — the schemaless escape hatch

```rust
pub struct ExtensionEnvelope {
    pub schema_version: u32,
    pub provider: Provider,
    pub adapter_version: String,
    pub content_class: ContentClass, // ToolTelemetry | ProviderDiagnostic | ExperimentalSignal | RawProviderMetadata | Unrecognized(String)
    pub fields: serde_json::Value,   // the only schemaless field in this split
    pub unknown: serde_json::Map<String, serde_json::Value>, // #[serde(flatten)]
}
```

Attached as `Evidence::extension: Option<ExtensionEnvelope>`, `None` in the
common case. This is where genuinely provider-specific evidence lives
before (or instead of) becoming a canonical field — e.g. the opencode
adapter's tool-call title/timing telemetry, which doesn't fit any existing
`EvidenceKind`.

**Decision rule — use `ExtensionEnvelope` only when all of these hold:**

1. The data is real, native evidence your sensor **recognizes and
   deliberately chooses** to carry — never a laundering path for a native
   shape `normalize()` didn't recognize at all. (`NormalizationOutcome::Unrecognized`
   carries only a discriminator tag, never a payload body, precisely to
   keep this boundary intact.)
2. No existing canonical `EvidenceKind`/payload struct already expresses
   it.
3. You are not confident yet that this shape is stable and cross-provider
   — if it is, go straight to a canonical field instead (see promotion
   criteria below).

**Version compatibility.** `SUPPORTED_EXTENSION_SCHEMA_VERSIONS` is a plain
allow-list (currently `&[1, 2]`), not a packed major/minor scheme — an
additive change (new field) within a version needs no version bump at all,
because unknown fields are already tolerated and preserved (see below). A
version outside the supported set fails deserialization **loudly and
specifically**, naming both the offending version and the supported set,
before an `ExtensionEnvelope` value is ever constructed. Bump the version
only for a genuinely non-additive change (a field's type or meaning
changes under the same name).

**Unknown-field tolerance is preserve-and-ignore, not delete-on-read.**
`unknown` (`#[serde(flatten)]`) catches any top-level key not named by the
struct's own fields and re-emits it verbatim on serialize — a binary
reading a newer envelope keeps what it doesn't understand rather than
dropping it, so data survives a round trip through e.g. `fornax export-spool`
even when the reading binary is older than the writer.

**Promote an extension field to a canonical field when all four hold**
(never fewer):

1. **Cross-provider** — at least two distinct `Provider` values have
   produced the same *semantic* field (same meaning, not just the same
   JSON key), through the extension envelope.
2. **Stable shape** — the field's type and meaning survived at least one
   full `schema_version` bump's worth of usage without changing shape.
3. **Consumed by core logic** — something in `fornax-verify`/`fornax-daemon`
   wants to depend on the field's presence/type directly, not just pass it
   through untouched.
4. **No canonical field already covers it.**

When promoted: add the typed struct in `fornax-types`, add it to
`validate_canonical_payload`, migrate producing sensors to emit the
canonical shape going forward, and leave `extension` empty for new data —
existing rows with the data still under `extension` are **not**
backfilled; both states are valid and a consumer must tolerate both.

**Non-goals, stated explicitly:** no generic schemaless event lake (the
envelope is the deliberate, bounded exception, not the default), and no
arbitrary code or plugin execution driven by envelope content — `fields`/
`unknown` are inert JSON, read only by whatever typed consumer later
chooses to interpret a specific `content_class`.

## 4. Privacy and redaction obligations

See [Privacy & Redaction](./privacy-redaction.md) for the full local
redaction boundary. What matters specifically for adapter/sensor authors:

**What is redacted automatically**, once, at the ingest boundary in
`fornax-daemon`'s `handle_message` — not re-derived by any downstream
reader:

| Data | Field(s) redacted |
|---|---|
| `AgentEvent` | `tool_input`, `tool_response`, `raw` |
| `Evidence` | `payload`, `extension.fields`, `extension.unknown` |
| `Claim` | `text` |

`Evidence::source` (`EvidenceSource`) is deliberately **not** passed
through redaction — every one of its fields is a short structured
identifier/enum (sensor name, trust class, timestamps, provider, collection
method) with no free-text content a secret could hide in. Do not start
putting free-text content into `EvidenceSource` fields expecting redaction
to catch it — it won't.

**What you must ensure yourself, as an adapter/sensor author:**

- The redaction classifier is pattern-based and conservative — biased
  toward false positives over false negatives, but with real, disclosed
  gaps: secrets embedded mid-sentence, multi-word/space-containing
  secrets, secrets shorter than 20 or longer than 200 characters,
  usernames embedded in file paths, and short CLI-argument-shaped secrets
  (`--password hunter2`) are **not** caught by the current detector set.
  Don't design a sensor that relies on the classifier to catch something
  it's documented not to catch — if your sensor's native payload is likely
  to carry raw secrets in a shape the classifier misses, consider whether
  the field belongs in evidence at all.
- Populate `ExtensionEnvelope::fields`/`unknown` with the same care you'd
  give a canonical payload — it goes through the same `redact_json` call,
  but only after your sensor puts it there; don't assume upstream
  filtering happened before your sensor ran.
- Never construct `AgentEvent`/`Evidence` fields by copying a raw native
  payload wholesale "just in case" — every field you populate is a
  deliberate choice to persist that data, redaction notwithstanding.

## 5. Conformance and replay fixture workflow

`crates/fornax-adapter-conformance` is the one place every adapter's
conformance is proven, and the entry point a new adapter author should
copy from. It has two required parts:

### a. The property suite (`tests/conformance.rs`)

Add your crate as a `[dev-dependencies]` entry in
`crates/fornax-adapter-conformance/Cargo.toml`, then add two tests
mirroring the existing `claude_*`/`codex_*`/`opencode_*` tests:

- `<provider>_adapter_satisfies_the_conformance_contract` — runs the
  generic property checks (`probe_provider_matches_declared_provider`,
  `provider_is_stamped_consistently`,
  `every_message_round_trips_through_the_wire_protocol`) against real
  native fixtures.
- `<provider>_adapter_handles_an_unrecognized_native_event_per_policy` — a
  synthetic, never-seen shape must come back `Unrecognized` with a
  non-empty `discriminator`, never a panic.

### b. Golden fixtures (`fixtures/<provider>/*.json`)

One JSON file per fixture, replayed by `tests/golden_fixtures.rs` and
`tests/contract.rs`:

```json
{
  "provider": "opencode",
  "provider_runtime_version": "1.18.25",
  "description": "One sentence: what real (or deliberately synthetic) shape this captures and why it matters.",
  "sanitized": true,
  "historical_schema_drift_ticket": null,
  "native_events": [ { "...": "one or more native payloads, replayed in order" } ]
}
```

Required contents:

- **One fixture per real, distinct native shape your adapter recognizes**
  (a "happy path" per event kind you translate), sanitized per the
  fixtures `README.md` (no real usernames/paths/tokens/session data —
  `load_fixtures` panics on any fixture missing `sanitized: true` or set
  to `false`).
- **One `unrecognized_future_*.json` synthetic breaking-change probe** — a
  shape you fabricate, never observed live, that your adapter has no
  mapping for. This proves a real future upstream break would come back as
  an actionable `Unrecognized` error, not silent data loss.
- If you find a **real** shape your adapter previously assumed wrong (a
  genuine historical schema-drift bug, not a hypothetical one), fixture
  the exact real shape and set `historical_schema_drift_ticket` to the
  ticket that fixed it. Never fabricate one.
- Run your fixtures through the shared contract checks
  (`capability_declaration_is_well_formed`, `evidence_sources_are_valid`,
  `evidence_payloads_validate_against_their_canonical_schema`) — these are
  generic over any `AgentAdapter` and need no new harness code per
  provider.

### Runnable commands

```bash
# Your new adapter's own unit tests
cargo test -p fornax-adapter-<provider>

# The full conformance/golden-fixture suite (property tests + fixture replay)
cargo test -p fornax-adapter-conformance

# Workspace-wide type check and lint — a new Provider variant must not
# require any exhaustive-match change outside fornax-types itself
cargo check --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

If your adapter needs a new `Provider` variant, add it to
`fornax_types::Provider` only — there is no exhaustive `match` over
`Provider` anywhere in `fornax-daemon`, `fornax-store`, `fornax-verify`, or
`fornax-cli` (every reference is a literal constructor), so adding a third
or later variant requires zero changes anywhere else in the local
workspace. Note: this is local-only — `fornax-cloud`'s ingest boundary
separately enforces a closed, 2-variant `Provider` enum today; adding
cloud-sync support for a new provider is a prerequisite for
`fornax export-spool` to that service, not for local monitoring, and is
tracked in the separate `fornax-cloud` repo.

## 6. Minimal end-to-end adapter example

The real, shipped worked example is `crates/fornax-adapter-opencode/` — the
third provider added to Fornax, and deliberately the architecture-fitness
test for the whole adapter contract (it exercises a genuinely different
integration mechanism than either of the first two providers). Reading it
end to end is the fastest way to see every piece from this guide connected:

1. **`plugin/fornax-capture.js`** — the in-process companion script
   opencode's own runtime loads. It forwards each real hook invocation
   opencode fires, verbatim, as one NDJSON line
   (`{"hook": "<name>", "at": "<ISO8601>", "payload": <native payload>}`)
   to a single long-lived child process's stdin.
2. **`src/main.rs`** — the thin binary (`fornax-hook-opencode`). Reads one
   NDJSON line at a time from stdin, calls `normalize()`, and switches on
   `NormalizationOutcome` to decide what to send over the daemon's Unix
   Domain Socket. Contains no native field-name literals itself.
3. **`src/lib.rs`** — all translation logic:
   - `OpenCodeAdapter` is `#[derive(Default)]` and stateful (unlike the
     stateless Claude Code adapter), because opencode's plugin persists
     across many `normalize()` calls for the life of one opencode process
     and needs to remember the most recently observed session id.
   - `CapabilityProbe::probe()` declares `ProcessResult` as `Available` —
     the standout finding of this adapter: opencode's `tool.execute.after`
     hook carries a literal `output.metadata.exit` integer, the first of
     the three providers to expose a genuine (non-heuristic) exit code —
     while declaring `SubagentLifecycle` `Unsupported` (no such hook
     exists in the Hooks interface at all, a structural gap) and
     `FinalResponse` `Unavailable` (the signal exists in the real event
     stream via `message.updated`, this adapter version just doesn't
     translate it yet, deliberately scoped out). Three different states
     for three materially different reasons, on one adapter — see
     `fornax-core`'s adapter capability matrix (Reference → Research once
     built) for the full cross-provider table.
   - `AgentAdapter::normalize` translates `tool.execute.before`/
     `tool.execute.after` (the flagship path) and the `event` hook's
     `session.created`/`session.idle` pair; every other real hook
     (`chat.message`, `permission.ask`, `plugin.init`, ...) is
     deliberately `Ignored`, not translated — a recognized shape with no
     canonical signal mapped to it yet, not a parse failure.
4. **`crates/fornax-adapter-conformance/fixtures/opencode/*.json`** —
   real, sanitized captures of every shape this adapter recognizes,
   replayed by the shared conformance suite exactly as described in
   Section 5.

To sketch a brand-new adapter from scratch, follow
`docs/contributing/adding-an-adapter.md`'s numbered steps (create the
crate, implement `CapabilityProbe`, implement `normalize`, stamp
adapter/version metadata, write the thin `main.rs`, wire into the
conformance suite, verify) — it is the authoritative checklist this
section summarizes, kept next to the code it describes.

## 7. Checklist: dependency, version, and provider API changes

Providers change their own hook schemas, transcript formats, and plugin
APIs without notice — none of the three ships a stable, versioned public
schema Fornax can subscribe to. Drift is caught by comparison, not by a
change notice:

- [ ] **Know your baseline.** Every golden fixture carries the real
      `provider_runtime_version` it was captured against. That's the
      claim: "as of Claude Code v2.1.238 / codex-cli 0.147.0 / opencode
      v1.18.25, this is the exact shape this adapter relies on."
- [ ] **Re-capture before trusting a bump.** When moving to a newer
      provider CLI/runtime version, capture one real session (a hook
      payload dump, a fresh rollout JSONL, a live plugin log) and diff its
      shapes against the checked-in fixtures for the *same* event kinds.
      A renamed or removed field will not fail compilation — it fails a
      live diff, or shows up as `Unavailable`/`Unrecognized` in
      production first.
- [ ] **Never code a live parser from secondary sources.** Research
      (issues, PRs, third-party docs) motivates *where to look*; the
      adapter itself must be coded against a real captured payload, and
      the golden fixture for that payload is what proves it. (The
      capability matrix's own history has a case where a shape assumed
      from secondary research turned out to never occur in the installed
      CLI at all.)
- [ ] **On confirmed drift:** add a new fixture for the new real shape
      (keep the old one if the old shape can still occur against an older
      installed version — don't overwrite); fix the adapter to handle the
      new shape while keeping the old path working; mark any new
      heuristic as `heuristic: true` rather than inventing an
      authoritative field; add a `historical_schema_drift_ticket` fixture
      and regression test once the fix lands; update the adapter
      capability matrix's confirmed-shape tables (`fornax-core`'s
      `docs/research/adapter-capability-matrix.md`) to match.
- [ ] **`fornax-types` is the only allowed dependency** for an adapter
      crate — if a change would require your adapter to depend on
      `fornax-store`/`fornax-daemon`/`fornax-verify`, that's a sign the
      change belongs somewhere else, not a reason to add the dependency.
- [ ] **A new `Provider` variant needs no other workspace change** by
      design (Section 5) — if adding one *does* force a change outside
      `fornax-types`, treat that as a regression in the "adapters stay
      thin" invariant, not a normal cost of a new provider.
- [ ] **Re-run the full verification set** after any change: `cargo test
      -p fornax-adapter-<provider>`, `cargo test -p
      fornax-adapter-conformance`, `cargo clippy --workspace --all-targets
      -- -D warnings`.

## 8. Unsupported / unavailable / redacted semantics

Fornax represents "this data is absent" with more than one vocabulary,
chosen deliberately per what is absent and why — never conflate them.

**Signal availability** (`SignalAvailability`, gates whether a verifier may
even attempt verification):

| State | Meaning |
|---|---|
| `Available` | Confirmed observable this session — the only state that may gate a verifier into attempting verification. |
| `Unsupported` | This runtime fundamentally cannot expose this signal class. |
| `Unavailable` | The signal exists in principle for this provider, but this session/version/config didn't expose it. |
| `Redacted` | The signal was observed, then withheld by the privacy/redaction boundary before it could be reported as available. |
| `CollectionFailed` | Collection was attempted and failed (parse error, IO error, etc.) — distinct from never attempting collection. |
| `Unknown` | Ordinary absence: no adapter declared an opinion about this signal class. |
| `Unrecognized(String)` | Forward-compatibility catch-all for a state tag this binary doesn't recognize. |

Every state except `Available` reads as "not observable" for verification
purposes — there is no partial credit, and an adapter should never
downgrade a real `Unavailable`/`Unsupported` case to a fabricated
`Available` just because a heuristic can produce *some* value.

**Claim verdicts** (five states, never collapsed, ADR 0001): `VERIFIED` /
`UNVERIFIED` / `CONTRADICTED` / `REVIEW` / `UNAVAILABLE`. `UNAVAILABLE` at
this level is the claim-level outcome when the evidence needed to judge a
claim was never observable — often *because* the underlying signal was
`Unavailable`, `Unsupported`, or `Redacted` at the capability level above,
but the two vocabularies describe different layers and aren't
interchangeable.

**In-line text markers**, appearing inside redacted text/JSON itself:

- `[REDACTED]` — a single token replaced in place.
- `[REDACTED: possible secret assignment]` — a whole line replaced when it
  matched the env-assignment shape.

There is no separate `NOT_COLLECTED` string literal anywhere in the
codebase — "not collected" is represented by the `SignalAvailability`
states above (`Unavailable`, `Unsupported`, `Unknown`), never by inventing
a new marker string for it.

## Further reading

- [Claude Code integration](./claude-code-integration.md)
- [Codex integration](./codex-integration.md)
- [Privacy & Redaction](./privacy-redaction.md)
- **Reference → Architecture Decisions** in the sidebar (synced from
  `fornax-core`'s `docs/adr/` at build time when a `fornax-core` checkout
  is available, including ADR 0004 and ADR 0005) — not present in a build
  without `FORNAX_CORE_PATH` set.
- **Reference → Research** in the sidebar (synced from `fornax-core`'s
  `docs/research/` the same way, including the adapter capability matrix
  and the evidence sensor contract).
