import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const src = new URL('../src/', import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, src), 'utf8'));

/** Flatten a DTCG document into `{ path: token }`, skipping `$`-prefixed group metadata. */
function leaves(node, path = [], out = {}) {
  if ('$value' in node) out[path.join('.')] = node;
  else
    for (const [key, child] of Object.entries(node))
      if (!key.startsWith('$')) leaves(child, [...path, key], out);
  return out;
}

const light = leaves(await read('semantic/light.json'));
const dark = leaves(await read('semantic/dark.json'));
const shared = leaves(await read('semantic/shared.json'));
const contrast = await read('contrast.json');

test('light and dark define exactly the same semantic tokens', () => {
  assert.deepEqual(Object.keys(dark).sort(), Object.keys(light).sort());
});

test('every semantic foreground is covered by at least one contrast pair', () => {
  const isForeground = (path) =>
    /^color\.text\./.test(path) ||
    /\.(foreground|on-solid|text)$/.test(path) ||
    /^color\.link\./.test(path);
  // Inactive components are exempt from WCAG contrast (1.4.3), so disabled text is not paired.
  const exempt = new Set(['color.action.disabled.foreground']);
  const covered = new Set(contrast.pairs.map((pair) => pair.fg));
  const missing = Object.keys(light).filter(
    (path) => isForeground(path) && !exempt.has(path) && !covered.has(path),
  );
  assert.deepEqual(missing, []);
});

test('every contrast pair names tokens that exist in both themes', () => {
  for (const { fg, bg } of contrast.pairs) {
    for (const path of [fg, bg]) {
      assert.ok(path in light && path in dark, `${path} is missing from a theme`);
    }
  }
});

test('tiers only point downwards: semantic -> primitive, component -> semantic', async () => {
  const semanticPaths = new Set([...Object.keys(light), ...Object.keys(shared)]);
  const literalAllowed = new Set(['color.overlay.backdrop']); // translucent black has no palette step
  for (const [path, token] of Object.entries({ ...light, ...dark, ...shared })) {
    const isRef = typeof token.$value === 'string' && /^\{.+\}$/.test(token.$value);
    assert.ok(isRef || literalAllowed.has(path), `semantic ${path} must reference a primitive`);
  }

  const files = (await readdir(new URL('component/', src))).filter((file) =>
    file.endsWith('.json'),
  );
  for (const file of files) {
    for (const [path, token] of Object.entries(leaves(await read(`component/${file}`)))) {
      const ref = /^\{(.+)\}$/.exec(token.$value)?.[1];
      assert.ok(ref, `component ${path} must reference a semantic token, found a literal`);
      assert.ok(
        semanticPaths.has(ref),
        `component ${path} points at ${ref}, which is not semantic`,
      );
    }
  }
});
