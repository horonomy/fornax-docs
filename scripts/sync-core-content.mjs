#!/usr/bin/env node
// Build-time content sync (FORNX-45).
//
// fornax-docs is the single Docusaurus shell (theme/nav/sidebar/build) for
// Fornax. Authored MVP pages live in this repo under docs/. This script
// additionally pulls fornax-core's own architecture/research docs in
// verbatim as reference material, so implementation-adjacent docs (ADRs,
// the adapter capability matrix) stay close to the code that changes them
// instead of being hand-copied and drifting.
//
// This is a documented build-time copy step, not a multi-repo CI
// aggregation pipeline or a git submodule — fornax-cloud and fornax-website
// have no docs content yet, so a bigger pipeline would be speculative
// (ADR 0002, FORNX-45). Revisit when a second real content source exists.
//
// Source resolution, in order:
//   1. FORNAX_CORE_PATH env var, if set.
//   2. ../fornax (sibling checkout) — the local-dev default, matching how
//      this repo's own worktree was laid out during development.
//   3. ../fornax-core (sibling checkout) — the canonical repo name, used by
//      CI, which checks out horonomy/fornax-core into this path.
//
// If none exist, the sync is skipped with a warning (non-fatal) — `npm run
// build` / `npm start` still work with just the authored MVP pages.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function resolveCorePath() {
  const candidates = [
    process.env.FORNAX_CORE_PATH,
    join(repoRoot, '..', 'fornax'),
    join(repoRoot, '..', 'fornax-core'),
  ].filter(Boolean);
  return candidates.find((p) => existsSync(join(p, 'docs')));
}

function titleFromMarkdown(content, fallback) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function copyMarkdownDir(srcDir, destDir, sidebarLabel, position, coreRelDir) {
  if (!existsSync(srcDir)) return 0;
  mkdirSync(destDir, { recursive: true });
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.md'));
  files.forEach((file, i) => {
    const raw = readFileSync(join(srcDir, file), 'utf8');
    const title = titleFromMarkdown(raw, file.replace(/\.md$/, ''));
    // Docusaurus's default "Edit this page" link uses this repo's own
    // editUrl (fornax-docs), but these files are gitignored here and only
    // ever committed in fornax-core — that default link 404s. Point
    // custom_edit_url at the real upstream source instead (FORNX-333).
    const editUrl = `https://github.com/horonomy/fornax-core/tree/main/docs/${coreRelDir}/${file}`;
    const frontmatter = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `sidebar_position: ${i + 1}`,
      `custom_edit_url: ${JSON.stringify(editUrl)}`,
      // fornax-core's own docs are plain Markdown, not MDX, and can contain
      // prose like `FORNX-<n>` outside of code spans — MDX's JSX parser
      // treats that as an unclosed tag and fails the build. `mdx.format: md`
      // renders this file with the CommonMark parser instead (no JSX/tag
      // parsing), matching how the source file is actually authored.
      'mdx:',
      '  format: md',
      '---',
      '',
      '> Synced verbatim from `fornax-core` at build time — edit it there, not here.',
      '',
    ].join('\n');
    writeFileSync(join(destDir, file), frontmatter + raw);
  });
  return files.length;
}

function writeCategory(destDir, label, position) {
  mkdirSync(destDir, { recursive: true });
  writeFileSync(
    join(destDir, '_category_.json'),
    JSON.stringify({ label, position, collapsible: true, collapsed: true }, null, 2) + '\n'
  );
}

const corePath = resolveCorePath();
const referenceRoot = join(repoRoot, 'docs', 'reference');

// Clean previously synced output so deleted upstream docs don't linger.
rmSync(referenceRoot, { recursive: true, force: true });

if (!corePath) {
  console.warn(
    '[sync-core-content] no fornax-core checkout found (checked $FORNAX_CORE_PATH, ../fornax, ../fornax-core) — skipping reference sync. Set FORNAX_CORE_PATH to a local fornax-core checkout to include it.'
  );
  process.exit(0);
}

writeCategory(referenceRoot, 'Reference (from fornax-core)', 90);
const adrCount = copyMarkdownDir(
  join(corePath, 'docs', 'adr'),
  join(referenceRoot, 'adr'),
  'Architecture Decisions',
  undefined,
  'adr'
);
writeCategory(join(referenceRoot, 'adr'), 'Architecture Decisions', 1);
const researchCount = copyMarkdownDir(
  join(corePath, 'docs', 'research'),
  join(referenceRoot, 'research'),
  'Research',
  undefined,
  'research'
);
writeCategory(join(referenceRoot, 'research'), 'Research', 2);

console.log(
  `[sync-core-content] synced ${adrCount} ADR doc(s) and ${researchCount} research doc(s) from ${corePath}`
);
