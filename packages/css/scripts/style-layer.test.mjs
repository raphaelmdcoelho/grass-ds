import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import postcss from 'postcss';
import { buildCss } from './build.mjs';

const css = await buildCss();
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
