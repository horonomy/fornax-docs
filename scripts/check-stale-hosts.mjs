#!/usr/bin/env node
// Stale-hostname regression check (FORNX-334).
//
// FORNX-328 made docs.fornax.horonom.com the canonical docs/website
// hostname, superseding the earlier docs.fornax.horo.run convention (see
// docusaurus.config.ts's own comment on `url`). `horo.run` itself remains
// legitimate and intentional for API/ingest boundaries (device
// registration, cloud sync, etc.) and for prose that explicitly explains
// the migration/aliasing history — this script must not flag either of
// those. It exists only to catch prose that wrongly presents `horo.run` as
// the current canonical docs/website surface, the defect class found in
// FORNX-333.
//
// Deliberately a small grep-shaped script, not a new docs QA framework
// (FORNX-334 non-goals) — reuses the same style as sync-core-content.mjs.
//
// Scope: authored docs/**/*.md and the repo README. `docs/reference/` is
// excluded — it's synced at build time from fornax-core (gitignored, not
// authored here; see sync-core-content.mjs), so any stale reference living
// there is fornax-core's own ADR content to fix, not this repo's.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

// Lines mentioning horo.run alongside one of these markers are treated as
// legitimate (API/ingest boundary, or prose that explicitly explains the
// hostname is an alias / no longer canonical / historical), not stale.
const SAFE_MARKERS =
  /\b(canonical|alias(?:es)?|api|ingest|supersed(?:e|ing|ed)|no longer|not canonical|boundary|historical|migrat)/i;

const HORO_RUN = /horo\.run/i;

/** Strip fenced code blocks and inline code spans so command examples that
 * legitimately reference horo.run API endpoints don't need special-casing
 * line by line. */
function stripCode(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');
}

/** Recursively collect `.md` files under `dir` (repo-root-relative paths),
 * skipping the given directory names entirely (used to exclude the
 * generated/gitignored `docs/reference/` tree). */
function walkMarkdown(dir, skipDirNames) {
  const absDir = join(repoRoot, dir);
  let entries;
  try {
    entries = readdirSync(absDir);
  } catch {
    return [];
  }
  let results = [];
  for (const entry of entries) {
    const relPath = join(dir, entry);
    const absPath = join(repoRoot, relPath);
    const stat = statSync(absPath);
    if (stat.isDirectory()) {
      if (skipDirNames.includes(entry)) continue;
      results = results.concat(walkMarkdown(relPath, skipDirNames));
    } else if (entry.endsWith('.md')) {
      results.push(relPath);
    }
  }
  return results;
}

function findTargetFiles() {
  const docFiles = walkMarkdown('docs', ['reference']);
  const readme = 'README.md';
  return [...docFiles, readme];
}

function checkFile(relPath) {
  const absPath = join(repoRoot, relPath);
  let raw;
  try {
    raw = readFileSync(absPath, 'utf8');
  } catch {
    return [];
  }
  const cleaned = stripCode(raw);
  const lines = cleaned.split('\n');
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    if (!HORO_RUN.test(lines[i])) continue;
    // Check a small window (previous/current/next line) since qualifying
    // context sometimes spans a wrapped sentence.
    const window = [lines[i - 1], lines[i], lines[i + 1]].filter(Boolean).join(' ');
    if (SAFE_MARKERS.test(window)) continue;
    violations.push({ file: relPath, line: i + 1, text: lines[i].trim() });
  }
  return violations;
}

function main() {
  const files = findTargetFiles();
  const violations = files.flatMap(checkFile);
  if (violations.length > 0) {
    console.error('Stale horo.run-as-canonical-docs-host reference(s) found:\n');
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}: ${v.text}`);
    }
    console.error(
      '\nhoro.run is no longer the canonical docs host (docs.fornax.horonom.com is, per FORNX-328).\n' +
        'If this is a legitimate API/ingest reference or historical/migration note, add a qualifying\n' +
        'word (e.g. "API", "ingest", "alias", "superseded", "no longer canonical") near the mention.',
    );
    process.exit(1);
  }
  console.log(`check-stale-hosts: ${files.length} file(s) scanned, no stale horo.run references found.`);
}

main();
