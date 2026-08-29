---
title: Custom detail command
sidebar_position: 12
---

# Custom detail command

`fornax detail` prints full evidence/finding detail for recent sessions —
the drill-down behind the compact `fornax status` line.

## Usage

```bash
fornax detail
```

```
🛡 ✕ CONTRADICTED
  claim:     All tests passed
  rationale: most recent test-runner evidence exit_code=1, contradicting the claim
  verifier:  test_result_verifier_v1
  when:      2026-08-29T03:14:07Z

🛡 ✓ VERIFIED
  claim:     The build succeeded
  rationale: most recent build evidence exit_code=0, matching the claim
  verifier:  test_result_verifier_v1
  when:      2026-08-29T02:58:41Z
```

If nothing has been recorded yet:

```
No findings recorded yet.
```

If the daemon isn't reachable:

```
fornax: daemon unreachable (is `fornax-daemon` running?)
```

## What each field means

| Field | Meaning |
|---|---|
| verdict (icon + word) | One of the five states — see [Claims, Evidence & Findings](./concepts.md). |
| `claim` | The literal claim text extracted from the agent's transcript. |
| `rationale` | Why the verifier reached this verdict — always present, never blank, so a `CONTRADICTED` or `UNAVAILABLE` finding is actionable rather than just a color. |
| `verifier` | The verifier's stable name (e.g. `test_result_verifier_v1`), recorded on every finding it produces — useful once more than one verifier exists. |
| `when` | UTC timestamp the finding was computed. |

## Wiring it into a custom keybinding or command

`fornax detail` is a plain CLI call reading from the daemon's localhost HTTP
API (`GET /api/findings/recent` on `FORNAX_HTTP_PORT`, default `4317`) — you
can wire it into an editor command, a shell alias, or a Claude Code custom
slash command exactly like any other local tool. There's nothing
Fornax-specific about the wiring itself; see
[Configuration](./configuration.md) for the two environment variables that
matter (`FORNAX_HOME`, `FORNAX_HTTP_PORT`).
