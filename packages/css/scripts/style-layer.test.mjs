import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import postcss from 'postcss';
import { buildCss } from './build.mjs';

const css = await buildCss();
/** One component's source, so assertions about order and last-of-kind do not read its neighbours. */
const section = (name, next) =>
  css.slice(css.indexOf(`${name}. Markup contract`), css.indexOf(`${next}. Markup contract`));
const root = postcss.parse(css);
const tokensCss = await readFile(new URL('../../tokens/dist/tokens.css', import.meta.url), 'utf8');

// Primitive tokens are never used directly by the style layer (CONTEXT.md).
const PRIMITIVE = /^--gr-(palette|space|corner|size|font|duration|easing|shadow|border-width)-/;

const layerNames = (rule) => rule.params.split(',').map((name) => name.trim());

test('the layer order is declared first and covers every grass.* layer', () => {
  const first = root.nodes.find((node) => node.type === 'atrule');
  assert.equal(first.name, 'layer');
  const order = layerNames(first);
  assert.deepEqual(order[0], 'grass.tokens');
  for (const node of root.nodes) {
    if (node.type === 'atrule' && node.name === 'layer' && node.nodes) {
      assert.ok(order.includes(node.params), `layer ${node.params} is not in the declared order`);
    }
  }
});

test('every rule sits inside an @layer grass.* block', () => {
  for (const node of root.nodes) {
    if (node.type === 'comment') continue;
    assert.equal(node.type, 'atrule', `unlayered ${node.type}: ${node.toString().slice(0, 60)}`);
    assert.equal(node.name, 'layer');
    assert.match(node.params, /^grass\.[a-z]+(, grass\.[a-z]+)*$/);
  }
});

test('every class selector uses the gr- prefix', () => {
  root.walkRules((rule) => {
    for (const [, name] of rule.selector.matchAll(/\.([\w-]+)/g)) {
      assert.match(name, /^gr-/, `class .${name} lacks the gr- prefix`);
    }
  });
});

test('only semantic and component tokens are used, and every token exists', () => {
  const declared = new Set([...tokensCss.matchAll(/^\s*(--gr-[\w-]+):/gm)].map((m) => m[1]));
  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--gr-')) declared.add(decl.prop); // local knobs such as --gr-stack-gap
  });
  root.walkDecls((decl) => {
    for (const [, name] of decl.value.matchAll(/var\((--gr-[\w-]+)/g)) {
      assert.ok(declared.has(name), `${name} is not defined by the tokens or locally`);
      assert.doesNotMatch(name, PRIMITIVE, `${name} is a primitive token`);
    }
  });
});

test('layout utilities exist', () => {
  for (const name of ['gr-container', 'gr-stack', 'gr-cluster', 'gr-grid']) {
    assert.match(css, new RegExp(`\\.${name}\\b`));
  }
});

test('container queries are opt-in so .gr-container does not trap fixed descendants', () => {
  root.walkRules(/\.gr-container/, (rule) => {
    assert.ok(
      rule.nodes.every((node) => node.prop !== 'container-type') ||
        rule.selector.includes('[data-query]'),
      `${rule.selector} sets container-type unconditionally`,
    );
  });
});

test('every url() in fonts.css points at a file in dist/fonts', async () => {
  const fonts = await readFile(new URL('../src/fonts.css', import.meta.url), 'utf8');
  const urls = [...fonts.matchAll(/url\(["']?\.\/([^"')]+)["']?\)/g)].map((m) => m[1]);
  assert.ok(urls.length > 0);
  for (const url of urls) await access(new URL(`../dist/${url}`, import.meta.url));
});

test('component rules that set box-shadow compose --gr-focus-inner', () => {
  // grass.base owns the focus ring; every later layer would replace its band with its own shadow.
  root.walkAtRules('layer', (layer) => {
    if (!layer.nodes || layer.params === 'grass.base') return;
    layer.walkDecls('box-shadow', (decl) => {
      assert.match(
        decl.value,
        /^var\(--gr-focus-inner\)(,|$)/,
        `${decl.parent.selector} sets box-shadow without leading with var(--gr-focus-inner)`,
      );
    });
  });
});

test('the focus band is transparent unless the element itself is focused', () => {
  const base = root.nodes.find((n) => n.type === 'atrule' && n.params === 'grass.base');
  const resets = [];
  base.walkRules((rule) => {
    if (rule.selector.split(',').some((s) => s.trim() === '*'))
      rule.walkDecls('--gr-focus-inner', (decl) => resets.push(decl.value));
  });
  assert.deepEqual(resets, ['0 0 0 0 transparent']);
});

test('Button supports variants, disabled and aria-disabled, forced colours and keyboard focus', () => {
  assert.match(css, /\.gr-button\b/);
  for (const variant of ['secondary', 'danger'])
    assert.match(css, new RegExp(`\\[data-variant=["']${variant}["']\\]`));
  assert.match(css, /&:disabled,\s*&\[aria-disabled=["']true["']\]/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /&:focus-visible/);
});

test('Button disabled styles come after the variants so they win at equal specificity', () => {
  const at = (needle) => css.indexOf(needle);
  assert.ok(at('&:disabled,') > at("&[data-variant='danger']"));
  assert.ok(at('&:disabled,') > at('&:active'));
});

test('TextField covers the field wrapper, states, textarea and forced colours', () => {
  for (const name of ['gr-field', 'gr-field__label', 'gr-field__hint', 'gr-field__error'])
    assert.match(css, new RegExp(`\\.${name}\\b`));
  assert.match(css, /\.gr-text-field\b/);
  assert.match(css, /&\[aria-invalid=["']true["']\]/);
  assert.match(css, /&\[readonly\]/);
  assert.match(css, /&:disabled/);
  assert.match(css, /&:is\(textarea\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
});

test('TextField disabled and read-only styles come after hover and focus so they win', () => {
  const field = section('TextField', 'Checkbox');
  const at = (needle) => field.lastIndexOf(needle);
  assert.ok(at('&:disabled {') > at('&[readonly]'));
  assert.ok(at('&[readonly]') > at('&:focus-visible'));
  assert.ok(at('&:focus-visible') > at('&:hover'));
});

test('TextField keeps the theme colours on autofill and gives invalid and read-only a forced-colours cue', () => {
  assert.match(css, /&:autofill/);
  assert.match(css, /inset 0 0 0 100rem/);
  const forced = section('TextField', 'Checkbox').slice(
    section('TextField', 'Checkbox').lastIndexOf('@media (forced-colors: active)'),
  );
  assert.match(forced, /\[aria-invalid=["']true["']\][^}]*border-width/);
  assert.match(forced, /\[readonly\][^}]*border-style: dashed/);
  // The thicker border is paid for out of the padding on both axes, so text does not move.
  assert.match(forced, /padding-inline: calc\(/);
});

test('TextField: invalid is declared after read-only, so an invalid read-only field shows invalid', () => {
  assert.ok(css.indexOf("&[aria-invalid='true'] {") > css.indexOf('&[readonly] {'));
});

test('Checkbox draws its mark in CSS, covers every state and keeps the three states apart in forced colours', () => {
  const checkbox = css.slice(css.indexOf('Checkbox. Markup contract'));
  assert.match(checkbox, /appearance: none/);
  assert.doesNotMatch(checkbox, /url\(/);
  for (const state of ['&:checked', '&:indeterminate', '&:focus-visible', '&:disabled'])
    assert.ok(checkbox.includes(state), `${state} is missing`);
  assert.match(checkbox, /&\[aria-invalid=["']true["']\]/);
  const forced = checkbox.slice(checkbox.lastIndexOf('@media (forced-colors: active)'));
  assert.doesNotMatch(forced, /forced-color-adjust/);
  assert.match(forced, /\[aria-invalid=["']true["']\][^}]*border-width/);
  for (const colour of ['Highlight', 'HighlightText', 'FieldText', 'GrayText'])
    assert.ok(forced.includes(colour));
  // Mixed has its own shape and is declared after checked.
  assert.ok(checkbox.indexOf('&:indeterminate::before {') > checkbox.indexOf('&:checked::before'));
  assert.ok(checkbox.indexOf('&:disabled {') > checkbox.indexOf("&[aria-invalid='true']"));
});

test('Checkbox: only the box and its text are the click target, not the whole row', () => {
  const label = css.slice(css.indexOf('.gr-checkbox-label {'), css.indexOf('.gr-checkbox-label ~'));
  assert.match(label, /inline-size: fit-content/);
  assert.match(label, /align-self: flex-start/);
});

test('Focus in forced colours uses a system colour and drops the inner band', () => {
  const base = root.nodes.find((n) => n.type === 'atrule' && n.params === 'grass.base');
  let found = false;
  base.walkAtRules('media', (media) => {
    if (!/forced-colors/.test(media.params)) return;
    media.walkRules(/focus-visible/, (rule) => {
      found = true;
      assert.match(rule.toString(), /outline-color: Highlight/);
      assert.match(rule.toString(), /--gr-focus-inner: 0 0 0 0 transparent/);
    });
  });
  assert.ok(found);
});
