import tokensCss from '@grass-ds/tokens/tokens.css?raw';

// The first :root block of the generated stylesheet holds the light/default value of every token.
const defaults = tokensCss.split(':root {')[1].split('\n  }')[0];

/** Every token as `{ name, value }`, read from the generated CSS so the catalog never restates a value. */
export const tokens = [...defaults.matchAll(/^\s*(--gr-[\w-]+):\s*(.+);$/gm)].map(
  ([, name, value]) => ({
    name,
    value,
  }),
);

export const tokensWithPrefix = (prefix) => tokens.filter(({ name }) => name.startsWith(prefix));
