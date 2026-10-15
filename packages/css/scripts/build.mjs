import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

/** Order matters: it is the source order inside the shared layers. */
export const PARTS = ['layers', 'reset', 'base', 'layout', 'button', 'utilities'];

export async function buildCss() {
  const parts = await Promise.all(PARTS.map((name) => readFile(here(`src/${name}.css`), 'utf8')));
  const banner =
    '/* @grass-ds/css: generated from src/*.css. Pair it with @grass-ds/tokens/tokens.css. */\n';
  return banner + parts.map((part) => part.trim()).join('\n\n') + '\n';
}

async function build() {
  await mkdir(here('dist/fonts'), { recursive: true });
  await writeFile(here('dist/grass.css'), await buildCss());
  await copyFile(here('src/fonts.css'), here('dist/fonts.css'));

  const fontsource = createRequire(import.meta.url).resolve(
    '@fontsource-variable/figtree/package.json',
  );
  const fontDir = fontsource.replace(/package\.json$/, '');
  const files = [
    ...['latin', 'latin-ext'].flatMap((subset) =>
      ['normal', 'italic'].map((style) => `files/figtree-${subset}-wght-${style}.woff2`),
    ),
  ];
  for (const file of files)
    await copyFile(fontDir + file, here(`dist/fonts/${file.split('/')[1]}`));
  await copyFile(fontDir + 'LICENSE', here('dist/fonts/OFL.txt'));
  console.log(`Wrote dist/grass.css, dist/fonts.css and ${files.length} font files`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await build();
