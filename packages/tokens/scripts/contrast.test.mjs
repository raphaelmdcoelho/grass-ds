import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkPairs } from './lib/contrast.mjs';
import { runContrastCheck } from './lib/check.mjs';
import { THEMES, resolvedTokens } from './lib/dictionary.mjs';

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

test('no action state background equals a surface in either theme', async () => {
  for (const theme of THEMES) {
    const tokens = await resolvedTokens(theme);
    const surfaces = Object.entries(tokens).filter(([path]) => path.startsWith('color.surface.'));
    const states = Object.entries(tokens).filter(([path]) =>
      /^color\.action\..+\.background/.test(path),
    );
    assert.ok(states.length > 0 && surfaces.length > 0);
    for (const [statePath, state] of states) {
      for (const [surfacePath, surface] of surfaces) {
        assert.notEqual(state, surface, `${theme}: ${statePath} is identical to ${surfacePath}`);
      }
    }
  }
});

test('every enabled text-field colour is contrast-paired and no border state equals a surface', async () => {
  const field = JSON.parse(
    await readFile(new URL('../src/component/text-field.json', import.meta.url), 'utf8'),
  )['text-field'];
  const contrast = JSON.parse(
    await readFile(new URL('../src/contrast.json', import.meta.url), 'utf8'),
  );
  const paired = new Set(contrast.pairs.map((pair) => pair.fg));
  const refs = (names) => names.map((name) => /^\{(.+)\}$/.exec(field[name].$value)[1]);

  // Disabled is exempt from contrast (WCAG 1.4.3/1.4.11); everything a user can read or aim at is held to it.
  const enabled = [
    'foreground',
    'placeholder',
    'label',
    'hint',
    'error',
    'border',
    'border-hover',
    'border-focus',
    'border-invalid',
    'border-read-only',
  ];
  for (const ref of refs(enabled)) assert.ok(paired.has(ref), `${ref} has no contrast pair`);

  for (const theme of THEMES) {
    const tokens = await resolvedTokens(theme);
    const surfaces = Object.entries(tokens).filter(([path]) => path.startsWith('color.surface.'));
    for (const name of Object.keys(field).filter((key) => key.startsWith('border'))) {
      const ref = /^\{(.+)\}$/.exec(field[name].$value)[1];
      for (const [surfacePath, surface] of surfaces)
        assert.notEqual(tokens[ref], surface, `${theme}: text-field ${name} equals ${surfacePath}`);
    }
  }
});
