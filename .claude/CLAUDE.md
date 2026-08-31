# CLAUDE.md — fornax-docs

Read `~/.claude/CLAUDE.md` (global baseline) first. This file overrides it
where they conflict.

## Repository identity

- Repo: `horonomy/fornax-docs`. Public. Unified technical documentation
  site for Fornax, built with Docusaurus.
- Language: TypeScript, Node (`engines.node >= 20.0`).
- Jira: project `FORNX` (same project as `fornax-core`).
- This repo owns the Docusaurus shell (theme, navigation, sidebar, build)
  and aggregates public documentation content. Authored MVP pages live in
  `docs/`; `fornax-core`'s own ADRs and research docs are pulled in
  verbatim at build time under Reference via
  `scripts/sync-core-content.mjs` — a documented build-time copy step, not
  a multi-repo CI pipeline or git submodule (see README.md, "Content
  model").

## Architecture constraints

No dedicated ADR set lives in this repo — `docs/reference` (containing
`fornax-core`'s ADRs) is synced at build time and gitignored, not authored
here. The one standing architecture decision specific to this repo is the
build-time copy step described above: do not turn it into a submodule or a
cross-repo CI aggregation pipeline without revisiting that decision first
(see README.md).

## Commands

- Install: `npm install`
- Dev server: `npm start` (runs `sync-content` then `docusaurus start`,
  serves at `http://localhost:3000`)
- Build: `npm run build` (runs `sync-content` then `docusaurus build`,
  output in `./build`)
- Type check: `npm run typecheck` (`tsc`)
- Set `FORNAX_CORE_PATH` to a local `fornax-core` checkout to include its
  ADR/research docs under Reference; defaults to a sibling `../fornax` or
  `../fornax-core` checkout if unset.

No lint, format, or test script is currently defined in `package.json`.

## Merge strategy

PR-only to `main`, create-a-merge-commit (squash and rebase merge are
disabled at the repo level). Branch naming observed in this repo:
`<release-or-phase>/FORNX-<n>/<type>/<snake_case_slug>` (e.g.
`v0.0.2/FORNX-154/docs/beta_surface_accuracy`).

CI (`.github/workflows/ci.yml`) runs a single required status check named
`docs`, which checks out this repo and `fornax-core`, then runs
`npm run typecheck` and `npm run build` with `FORNAX_CORE_PATH` pointed at
the checked-out `fornax-core`.

## Source of truth

- Jira: `FORNX` project (same tracker as `fornax-core`).
- `fornax-core` is the upstream source of truth for architecture/ADR
  content surfaced under this site's Reference section — amend it there,
  not here.
