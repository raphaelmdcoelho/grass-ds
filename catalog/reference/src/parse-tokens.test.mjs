import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseTokens } from './parse-tokens.js';

const css = await readFile(
  new URL('../../../packages/tokens/dist/tokens.css', import.meta.url),
  'utf8',
);

test('the catalog sees every token the build declares', () => {
  const declared = new Set([...css.matchAll(/^\s*(--gr-[\w-]+)\s*:/gm)].map((m) => m[1]));
  const parsed = new Set(parseTokens(css).map(({ name }) => name));
  assert.deepEqual(
    [...declared].filter((name) => !parsed.has(name)),
    [],
  );
  assert.ok(parsed.has('--gr-corner-md'));
});

test('comments and odd indentation do not hide tokens', () => {
  const sample =
    ':root{/* note */\n--gr-a:1;\n  /* --gr-hidden: 2; */\n\t--gr-b : 3 ;}\n:root[data-theme="dark"]{--gr-c:4;}';
  assert.deepEqual(parseTokens(sample), [
    { name: '--gr-a', value: '1' },
    { name: '--gr-b', value: '3' },
  ]);
});
