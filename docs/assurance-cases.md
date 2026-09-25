---
title: Assurance Cases
sidebar_position: 31
---

# Assurance Cases

A bare verdict — `VERIFIED`, `CONTRADICTED`, `REVIEW` — doesn't explain
*why*. v0.0.8 adds **Assurance Cases**: a structured explanation of a
claim's justification, projected deterministically from its
[Epistemic Contract](./epistemic-contracts.md) satisfaction report.

## Four kinds of statement, never confused

Every statement in an assurance case is exactly one of four kinds, and
these are never blended together:

- **Observation** — a fact grounded in real evidence.
- **Inference** — a conclusion the trust kernel drew from observations.
- **Policy decision** — a rule the active policy applied.
- **Unverified assumption** — something assumed, explicitly marked as
  such, never presented as observed.

Every gap and limitation is visible in the case, not just the parts that
support the conclusion. Two cases built from the same frozen inputs
produce byte-identical output — the projection is deterministic.

## Resistant to injected text

Evidence can contain agent-controlled text, including text specifically
crafted to look like instructions or fake structure (a fabricated
`Assumption:` line, a fake markdown heading, an injected script tag). This
is tested directly: an assurance case built from evidence containing a
prompt-injection-shaped payload never lets that text become a new
argument step or gain any structural authority in the case — it stays
inert data.

## Known gap

As of v0.0.8, one of the four satisfaction states an assurance case should
be able to represent — `Contradicted` — has **no test coverage at all**,
because nothing upstream in this release actually produces that state yet
for the underlying assessment engine to project. This was caught during
release verification after an earlier internal draft rounded it up as
covered; it is disclosed here honestly instead.

## See also

- [Meta-Verification](./meta-verification.md) — how a monitor's own
  contribution is represented without ever overriding a hard contradiction.
