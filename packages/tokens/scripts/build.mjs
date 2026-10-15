import { mkdir, writeFile } from 'node:fs/promises';
import { createDictionary, THEMES } from './lib/dictionary.mjs';
import { runContrastCheck } from './lib/check.mjs';

const indent = (text, by) =>
  text
    .split('\n')
    .map((line) => (line ? by + line : line))
    .join('\n');

async function declarations(theme, scope) {
  const [file] = await createDictionary(theme, scope).formatPlatform('css');
  return file.output.trim();
}

/** Compose the final stylesheet; exported so tests can inspect it without touching disk. */
export async function buildCss() {
  const light = await declarations('light', 'base');
  const dark = await declarations('dark', 'theme');
  // Collapsing the primitive durations is enough: semantic and component durations reference them.
  const instant = light
    .split('\n')
    .filter((line) => /^--gr-duration-\w+:/.test(line))
    .map((line) => line.replace(/:.*;/, ': 0ms;'))
    .join('\n');
  return `${[
    '/**',
    ' * Do not edit directly: generated from the DTCG token source by @grass-ds/tokens.',
    ' * Light is the default. `prefers-color-scheme: dark` applies dark unless the page forces',
    ' * light with <html data-theme="light">; <html data-theme="dark"> forces dark.',
    ' */',
    '@layer grass.tokens {',
    '  :root {',
    '    color-scheme: light dark;',
    indent(light, '    '),
    '  }',
    '',
    '  @media (prefers-color-scheme: dark) {',
    '    :root:not([data-theme="light"]) {',
    '      color-scheme: dark;',
    indent(dark, '      '),
    '    }',
    '  }',
    '',
    '  @media (prefers-reduced-motion: reduce) {',
    '    :root {',
    indent(instant, '      '),
    '    }',
    '  }',
    '',
    '  :root[data-theme="light"] {',
    '    color-scheme: light;',
    '  }',
    '',
    '  :root[data-theme="dark"] {',
    '    color-scheme: dark;',
    indent(dark, '    '),
    '  }',
    '}',
  ].join('\n')}\n`;
}

export async function build() {
  const failures = await runContrastCheck();
  if (failures.length > 0) {
    throw new Error(
      `Build aborted: ${failures.length} semantic colour pair(s) miss WCAG AA contrast.`,
    );
  }
  const css = await buildCss();
  const outDir = new URL('../dist/', import.meta.url);
  await mkdir(outDir, { recursive: true });
  await writeFile(new URL('tokens.css', outDir), css);
  console.log(
    `\nWrote dist/tokens.css (${css.split('\n').length} lines, themes: ${THEMES.join(', ')})`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await build().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
