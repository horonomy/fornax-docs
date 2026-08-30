# fornax-docs

Unified technical documentation site for [Fornax](https://github.com/horonomy/fornax-core),
built with [Docusaurus](https://docusaurus.io/). This repo owns the
Docusaurus shell — theme, navigation, sidebar, and build — and aggregates
public documentation content.

## Status and known scope limitation (FORNX-45 / FORNX-154)

This is the MVP shell plus authored content, built from `fornax-core`'s
actual architecture and implementation. It does **not** yet configure a
deploy workflow, and DNS for its canonical hostname is not live yet.

The canonical hostname is `docs.fornax.horo.run`, per FORNX-43 ("Fornax
Cloudflare product-domain topology") and FORNX-154's Beta-surface scope —
a dedicated docs subdomain, matching this repo's actual dedicated-docs-site
shape. `fornax-core`'s ADR 0002 (`docs/adr/0002-repo-and-ci-conventions.md`)
originally recorded a different pattern (one site per product at
`<product>.horo.run`, docs served at `/docs`, no separate `docs.*`
subdomain) and explicitly flags itself as not yet reconciled with FORNX-43.
That reconciliation/amendment belongs to `fornax-core`, not this repo — it
is not made here. Actual Cloudflare routing for `docs.fornax.horo.run` is
still FORNX-43's open work; nothing in this repo claims it is live.

## Content model

Authored MVP pages (Introduction, Quick Start, integrations, concepts,
privacy, troubleshooting, etc.) live directly in this repo's `docs/`
directory. `fornax-core`'s own architecture decision records and research
docs are pulled in verbatim at build time under **Reference** — see
[`scripts/sync-core-content.mjs`](./scripts/sync-core-content.mjs) — so
implementation-adjacent documentation stays close to the code that changes
it instead of being hand-copied and drifting.

This is a documented **build-time copy step**, not a multi-repo CI
aggregation pipeline or a git submodule. `fornax-cloud` and `fornax-website`
have no docs content yet, so a bigger pipeline would be speculative
infrastructure ahead of actual need (ADR 0001, D6). Revisit this decision
once a second real content source exists.

## Local development

```bash
npm install

# Point at a local fornax-core checkout to include its ADR/research docs
# under Reference. Defaults to ../fornax or ../fornax-core (a sibling
# checkout) if unset.
export FORNAX_CORE_PATH=/path/to/your/fornax-core/checkout

npm start          # dev server at http://localhost:3000
npm run build      # production build into ./build
npm run typecheck  # tsc
```

Without `FORNAX_CORE_PATH` set and no sibling checkout found, the sync step
skips the Reference section with a warning — the authored MVP pages still
build and serve fine on their own.

## CI

`.github/workflows/ci.yml` checks out both this repo and `fornax-core`
(public, no auth needed), then runs `npm run typecheck` and `npm run build`
with `FORNAX_CORE_PATH` pointed at the checked-out `fornax-core`, so the
Reference section is exercised in CI the same way it would be for a real
deploy.

## License

MIT.
