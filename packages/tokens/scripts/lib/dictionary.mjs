import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { formattedVariables } from 'style-dictionary/utils';
import { formatCss, parse } from 'culori';

const src = (path) => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));

export const THEMES = ['light', 'dark'];
export const PREFIX = 'gr';

const isColorObject = (value) =>
  value !== null && typeof value === 'object' && 'colorSpace' in value && 'components' in value;

// DTCG colour objects become `oklch(L C H / A)`; style-dictionary's own transform would flatten them to hex.
function colorToCss({ colorSpace, components, alpha }) {
  if (colorSpace !== 'oklch')
    throw new Error(`Unsupported colour space "${colorSpace}": palette is authored in OKLCH.`);
  const [l, c, h] = components;
  const colour = { mode: 'oklch', l, c, h };
  if (alpha !== undefined && alpha !== 1) colour.alpha = alpha;
  return formatCss(colour);
}

StyleDictionary.registerTransform({
  name: 'grass/color/oklch',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'color',
  transform: (token) => {
    const value = token.$value ?? token.value;
    if (isColorObject(value)) return colorToCss(value);
    // strings such as "oklch(0 0 0 / 0.1)" pass through untouched, but must be parseable
    if (typeof value === 'string' && !parse(value))
      throw new Error(`Unparseable colour "${value}" in ${token.path.join('.')}`);
    return value;
  },
});

const transforms = StyleDictionary.hooks.transformGroups.css.map((t) =>
  t === 'color/css' ? 'grass/color/oklch' : t,
);

StyleDictionary.registerFormat({
  name: 'grass/css/declarations',
  format: ({ dictionary }) =>
    formattedVariables({
      format: 'css',
      dictionary,
      outputReferences: true,
      usesDtcg: true,
      formatting: { indentation: '' },
    }),
});

const fromFile = (token, file) => token.filePath.endsWith(file);

/**
 * One dictionary per theme: every shared tier plus that theme's semantic colours.
 * `scope: 'base'` keeps everything except the dark overrides (the default :root block);
 * `scope: 'theme'` keeps only that theme's semantic colours (the override blocks).
 */
export function createDictionary(theme, scope) {
  if (!THEMES.includes(theme)) throw new Error(`Unknown theme "${theme}"`);
  return new StyleDictionary({
    // The theme scope intentionally keeps references to palette tokens that it filters out of its own output.
    log: { verbosity: 'silent', warnings: scope === 'theme' ? 'disabled' : 'error' },
    usesDtcg: true,
    source: [
      src('primitive/**/*.json'),
      src('semantic/shared.json'),
      src(`semantic/${theme}.json`),
      src('component/**/*.json'),
    ],
    platforms: {
      css: {
        prefix: PREFIX,
        transforms,
        files: [
          {
            destination: `${theme}.${scope}.css`,
            format: 'grass/css/declarations',
            filter: (token) =>
              scope === 'theme' ? fromFile(token, `semantic/${theme}.json`) : true,
          },
        ],
      },
    },
  });
}

/** Resolved values of one theme, as a flat map of dot path -> css value (used by the contrast check). */
export async function resolvedTokens(theme) {
  const dictionary = createDictionary(theme, 'base');
  const exported = await dictionary.exportPlatform('css');
  const flat = {};
  const walk = (node, path) => {
    if (node && typeof node === 'object' && ('$value' in node || 'value' in node)) {
      flat[path.join('.')] = node.$value ?? node.value;
    } else if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node))
        if (!key.startsWith('$')) walk(child, [...path, key]);
    }
  };
  walk(exported, []);
  return flat;
}
