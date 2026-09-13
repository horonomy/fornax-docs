import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const built = (page) => readFileSync(new URL(`../build/${page}`, import.meta.url), 'utf8');

test('built entry preserves product concepts with Quick Start first', () => {
  const html = built('index.html');
  const hero = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
  const quickStart = hero.search(/href="?\/quick-start[">\s]/);
  const introduction = hero.search(/href="?\/intro[">\s]/);
  assert.ok(quickStart >= 0);
  assert.ok(introduction > quickStart);
  for (const heading of ['Evidence, not narration', 'Five honest states', 'Local-first, no cloud required']) {
    assert.ok(html.includes(heading), heading);
  }
  for (const state of ['VERIFIED', 'UNVERIFIED', 'CONTRADICTED', 'REVIEW', 'UNAVAILABLE']) {
    assert.ok(html.includes(`<code>${state}</code>`), state);
  }
  assert.doesNotMatch(html, /undraw_docusaurus|img\/logo\.svg|docusaurus-social-card/);
  assert.ok(html.includes('https://fornax.horonom.com'));
  assert.ok(html.includes('https://horo.run'));
});

test('built missing-page surface has local recovery anchors', () => {
  const html = built('404.html');
  const recovery = html.match(/<nav aria-label="Documentation recovery"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(recovery, 'recovery navigation is rendered');
  assert.match(recovery, /href="?\/"?[^>]*>Docs home<\/a>/);
  assert.match(recovery, /href="?\/quick-start"?[^>]*>Quick Start<\/a>/);
});
