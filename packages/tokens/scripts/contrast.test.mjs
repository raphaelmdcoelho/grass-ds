import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPairs } from './lib/contrast.mjs';
import { runContrastCheck } from './lib/check.mjs';

const thresholds = { text: 4.5, ui: 3 };

test('black on white is 21:1 and passes', () => {
  const [result] = checkPairs(
    { fg: 'oklch(0 0 0)', bg: 'oklch(1 0 0)' },
    { thresholds, pairs: [{ fg: 'fg', bg: 'bg', level: 'text' }] },
  );
  assert.equal(Math.round(result.ratio), 21);
  assert.equal(result.pass, true);
});

test('a low-contrast pair fails its threshold', () => {
  const [result] = checkPairs(
    { fg: 'oklch(0.7 0 0)', bg: 'oklch(0.75 0 0)' },
    { thresholds, pairs: [{ fg: 'fg', bg: 'bg', level: 'ui' }] },
  );
  assert.equal(result.pass, false);
});

test('a pair that references a missing token throws instead of passing silently', () => {
  assert.throws(
    () =>
      checkPairs(
        { bg: 'oklch(1 0 0)' },
        { thresholds, pairs: [{ fg: 'nope', bg: 'bg', level: 'text' }] },
      ),
    /not a colour token/,
  );
});

test('translucent colours are rejected', () => {
  assert.throws(
    () =>
      checkPairs(
        { fg: 'oklch(0 0 0 / 0.5)', bg: 'oklch(1 0 0)' },
        { thresholds, pairs: [{ fg: 'fg', bg: 'bg', level: 'text' }] },
      ),
    /translucent/,
  );
});

test('the real token source meets AA in both themes', async () => {
  const failures = await runContrastCheck({ log: () => {} });
  assert.deepEqual(failures, []);
});
