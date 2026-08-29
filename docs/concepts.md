---
title: "Concepts: Claim, Evidence, Finding"
sidebar_position: 13
---

# Concepts: Claim, Evidence, Finding

Three types carry the whole model. A verifier is a pure function from the
first two to the third:

```
Claim + Evidence[] + RuntimeCapabilities  →  Finding
```

## Claim

A statement extracted from the agent's own transcript — e.g. "All tests
passed." Claim extraction in v0.0.1 is deliberately literal (a small
heuristic on the claim text plus a `subject` tag like `test_result`), not a
general-purpose NLP layer. Getting claim extraction fancier is future scope,
tracked separately from verification itself.

## Evidence

An immutable, timestamped record of something that was actually observed —
a tool call's arguments, a tool's result, a transcript event. Evidence is
persisted before any claim extraction or verification runs against it (ADR
0001, D3): the record of what happened is never derived from, or mixed
with, an interpretation of what it means.

Evidence can also be marked **heuristic**: when the runtime doesn't expose a
literal signal a verifier wants (e.g. Claude Code's `Bash` tool result has
no `exit_code` field), Fornax derives one from what is available and marks
the provenance as heuristic — so downstream consumers know it isn't a
literal exit code, rather than presenting a guess as fact. See the
[First finding walkthrough](./first-finding-walkthrough.md).

## RuntimeCapabilities

What the current adapter/session can actually observe — e.g.
`supports_post_tool_use`, `supports_transcript_tail`. Declared conservatively,
matching what an adapter actually reads, never inferred as more capable than
confirmed. A verifier checks capabilities before evidence: if the runtime
can't expose what it needs, the finding is `UNAVAILABLE`, not a guess.

## Finding

The output: a verdict, the evidence IDs it was based on, which verifier
produced it, a human-readable rationale, and a timestamp. Verdicts are one
of exactly five states, never collapsed to a binary pass/fail:

| Verdict | When a verifier returns it |
|---|---|
| `VERIFIED` | Evidence directly confirms the claim. |
| `CONTRADICTED` | Evidence directly contradicts the claim. |
| `UNVERIFIED` | No relevant evidence was observed in this session at all. |
| `REVIEW` | Evidence exists but is ambiguous or partial. |
| `UNAVAILABLE` | The runtime doesn't expose what this check needs — reported explicitly, never inferred as a pass. |

## Verifier

A verifier declares which claims it applies to (`applies_to`) and computes a
finding (`verify`). It must be **deterministic**: the same claim and the
same evidence always produce the same finding, with no I/O and no hidden
state — this is what makes findings replayable against previously captured
evidence, without a live agent session.

The first verifier, `test_result_verifier_v1`, checks a claim that tests
passed against the most recent test-runner evidence observed in the session,
most recent first. It never invents evidence: with no relevant evidence
found, it returns `UNVERIFIED` with an explicit rationale, not `VERIFIED` by
default.
