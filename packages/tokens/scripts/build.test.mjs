import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCss } from './build.mjs';

const css = await buildCss();

test('everything lives in the grass.tokens layer', () => {
  assert.match(css, /@layer grass\.tokens \{/);
});

test('light is the default and dark is applied by media query and by attribute', () => {
  assert.match(css, /:root \{\n {4}color-scheme: light dark;/);
  assert.match(
    css,
    /@media \(prefers-color-scheme: dark\) \{\n {4}:root:not\(\[data-theme="light"\]\)/,
  );
  assert.match(css, /:root\[data-theme="dark"\] \{/);
});

test('the palette is emitted in OKLCH', () => {
  assert.match(css, /--gr-palette-grass-500: oklch\(/);
});

test('only semantic colours are overridden for dark; components keep var() references', () => {
  const dark = css.split(':root[data-theme="dark"] {')[1];
  assert.match(dark, /--gr-color-surface-default: var\(--gr-palette-/);
  assert.doesNotMatch(dark, /^\s*--gr-(button|space|palette)-[\w-]+:/m);
  assert.match(css, /--gr-button-primary-background: var\(--gr-color-action-primary-background\)/);
});

test('spacing follows the 4px grid', () => {
  assert.match(css, /--gr-space-1: 0\.25rem;/);
  assert.match(css, /--gr-space-16: 4rem;/);
});

test('motion collapses under prefers-reduced-motion', () => {
  const reduced = css.split('@media (prefers-reduced-motion: reduce) {')[1].split('}')[0];
  for (const step of ['100', '200', '300'])
    assert.match(reduced, new RegExp(`--gr-duration-${step}: 0ms;`));
});

test('dark overrides the overlay elevation so overlays keep visible depth', () => {
  assert.match(css, /--gr-elevation-overlay: var\(--gr-shadow-soft\);/);
  const dark = css.split(':root[data-theme="dark"] {')[1];
  assert.match(dark, /--gr-elevation-overlay: var\(--gr-shadow-soft-dark\);/);
  const media = css.split('@media (prefers-color-scheme: dark)')[1].split('@media')[0];
  assert.match(media, /--gr-elevation-overlay: var\(--gr-shadow-soft-dark\);/);
});
