---
title: First finding walkthrough
sidebar_position: 7
---

# First finding walkthrough: a CONTRADICTED verdict

This walks through a real, reproduced incident (FORNX-53) — not a
constructed demo — where Fornax caught exactly the gap it exists to catch:
an agent's claim not matching the evidence.

## Setup

A Claude Code v2.1.238 session was run against `fornax-core` itself, with
`fornax-hook-claude` wired in and `fornax-daemon` running. The scenario: the
agent claims a test run passed.

**Claim (from the assistant's turn):**

```
All tests passed
```

**Evidence (from the real `PostToolUse` payload for the Bash tool call that
ran the test suite):**

```json
{
  "tool_name": "Bash",
  "tool_response": {
    "stdout": "... 1 failed, 42 passed in 3.21s",
    "stderr": "",
    "interrupted": false,
    "isImage": false,
    "noOutputExpected": false
  }
}
```

## What went wrong first (and got fixed before this worked)

The first attempt to reproduce this returned `UNAVAILABLE` for every claim,
not `CONTRADICTED` — which was itself a bug, not the expected result:

1. **No capabilities declared.** `fornax-adapter-claude` never emitted an
   `IngestMessage::Capabilities` message. `TestResultVerifier` requires
   `caps.supports_post_tool_use || caps.supports_transcript_tail` before it
   will look at evidence at all — so with no capabilities ever announced,
   every claim resolved `UNAVAILABLE` regardless of what evidence existed.
2. **Wrong exit-code field guessed.** The adapter looked for
   `exit_code`/`exitCode`/`returncode`/`status` in `tool_response`. None of
   those keys exist in a real payload — the actual shape is
   `{stdout, stderr, interrupted, isImage, noOutputExpected}` shown above.
3. **Claim text missed.** The transcript parser read
   `message.content[0].text`, but a real assistant turn's `content` array
   often has a `tool_use` block at index 0 with no `text` field — so the
   claim was missed whenever a tool call preceded the final text block in
   the same turn.

All three were bugs in the adapter, not in the verifier's logic, and all
three were fixed with unit tests built from the real captured shapes
(values redacted, structure identical) before this scenario was retried.

## The result, once the adapter was correct

```bash
fornax detail
```

```
🛡 ✕ CONTRADICTED
  claim:     All tests passed
  rationale: most recent test-runner evidence exit_code=1 (heuristic: nonzero
             exit inferred from stdout/stderr shape), contradicting the claim
  verifier:  test_result_verifier_v1
  when:      2026-08-29T03:14:07Z
```

`test_result_verifier_v1` is deterministic: given the same claim and the
same evidence, it always returns the same finding — see
[Claims, Evidence & Findings](./concepts.md) for why that matters and how
the exit-code heuristic itself is derived (there is no literal exit code in
the payload — see [Claude Code integration](./claude-code-integration.md)).

## Why this is the whole point of Fornax

Nothing about this required a second AI model to "judge" the first one. The
verifier is plain code comparing a claim against captured evidence. The bug
that hid this the first time through — `UNAVAILABLE` everywhere — is itself
an instance of the invariant working correctly: when the runtime didn't
actually expose the evidence the verifier needed (because capabilities were
never declared), Fornax said so rather than defaulting to `VERIFIED`.
