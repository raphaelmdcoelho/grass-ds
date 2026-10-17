/**
 * Drift check: renders every `Components/*` story of the Reference Storybook and of the Angular
 * Storybook in headless Chromium, in both themes and in forced colours, and requires the two
 * screenshots to match exactly (no tolerance).
 *
 *   pnpm build:catalog && pnpm parity
 *
 * Needs the composed site in catalog/site (build:catalog) and a Chromium: set CHROMIUM_PATH to
 * a browser binary, or run `pnpm --filter @grass-ds/catalog-parity exec playwright-core install chromium` once. Not part of `pnpm test`
 * or CI yet because it needs a browser and the built site.
 *
 * Determinism: reduced motion is emulated, transitions, animations and the caret are switched off,
 * a story is captured only after Storybook reports it rendered (play function included) and the
 * fonts are loaded, GPU rasterisation and LCD text are off, and the device scale factor is fixed.
 * Stories whose id ends in `keyboard-focus` are captured twice: as rendered (the play function has
 * pressed Tab) and again after Space has been pressed on the focused checkbox.
 */
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';

const ONLY = process.env.PARITY_ONLY; // substring filter on the story id
const OUT = process.env.PARITY_OUT; // directory that receives the screenshots of every mismatch
const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

function serve() {
  const server = createServer(async (request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
    const file = join(SITE, path.endsWith('/') ? `${path}index.html` : path);
    if (!file.startsWith(SITE)) return response.writeHead(403).end();
    try {
      const body = await readFile(file);
      response
        .writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
        .end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** Storybook announces `storyRendered` on its channel once the play function has finished. */
const WATCH_RENDER = () => {
  window.__rendered = false;
  window.__failed = null;
  const timer = setInterval(() => {
    const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
    if (!channel) return;
    clearInterval(timer);
    channel.on('storyRendered', () => (window.__rendered = true));
    for (const event of ['storyErrored', 'storyThrewException', 'playFunctionThrewException'])
      channel.on(event, (error) => (window.__failed = String(error?.message ?? event)));
  }, 2);
};

/** Present from the first paint, so nothing is ever mid-transition or promoted to its own layer. */
const FREEZE_AT_START = (css) => {
  const style = document.createElement('style');
  style.textContent = css;
  new MutationObserver((_, observer) => {
    if (!document.head) return;
    document.head.append(style);
    observer.disconnect();
  }).observe(document, { childList: true, subtree: true });
};

const FREEZE = `*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }`;

async function capture(page, base, id, { theme }, after) {
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  await page.waitForFunction(() => window.__rendered || window.__failed, null, { timeout: 30000 });
  const failed = await page.evaluate(() => window.__failed);
  if (failed) throw new Error(`${id}: ${failed}`);
  await page.addStyleTag({ content: FREEZE });
  await page.evaluate(() => document.fonts.ready);
  if (after) await after(page);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  return page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
}

const same = (a, b) => {
  if (Buffer.compare(a, b) === 0) return true;
  const x = PNG.sync.read(a);
  const y = PNG.sync.read(b);
  return x.width === y.width && x.height === y.height && Buffer.compare(x.data, y.data) === 0;
};

/** A page that failed to render (or a wrong URL) is blank: two blank shots would otherwise "match". */
const isBlank = (png) => {
  const { data } = PNG.sync.read(png);
  let different = 0;
  for (let i = 4; i < data.length; i += 4)
    if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) different++;
  return different < 50;
};

const space = async (page) => {
  const isCheckbox = await page.evaluate(() =>
    document.activeElement?.matches('input[type=checkbox]'),
  );
  if (isCheckbox) await page.keyboard.press('Space');
};

const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium
  .launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-lcd-text',
      '--font-render-hinting=none',
      '--force-device-scale-factor=1',
    ],
  })
  .catch((error) => {
    console.error(
      `Could not start Chromium: ${error.message.split('\n')[0]}\n` +
        'Set CHROMIUM_PATH to a Chromium binary, or install one with:\n' +
        '  pnpm --filter @grass-ds/catalog-parity exec playwright-core install chromium',
    );
    server.close();
    process.exit(1);
  });

const index = async (base) => (await (await fetch(`${origin}${base}/index.json`)).json()).entries;
const ids = (entries) =>
  Object.values(entries)
    .filter((e) => e.type === 'story' && e.title.startsWith('Components/'))
    .map((e) => e.id)
    .sort();
const [reference, angular] = [ids(await index('')), ids(await index('/angular'))];
const missing = [
  ...reference.filter((id) => !angular.includes(id)).map((id) => `${id} (no Angular story)`),
  ...angular.filter((id) => !reference.includes(id)).map((id) => `${id} (no Reference story)`),
];

const selected = reference.filter((id) => angular.includes(id) && (!ONLY || id.includes(ONLY)));
let compared = 0;
const pending = [];
const failures = [...missing];
for (const theme of ['light', 'dark']) {
  for (const forced of [false, true]) {
    for (const id of selected) {
      const steps = id.endsWith('keyboard-focus') ? [null, space] : [null];
      const shots = { '': [], '/angular': [] };
      for (const base of Object.keys(shots)) {
        const context = await browser.newContext({
          viewport: { width: 700, height: 1000 },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
          forcedColors: forced ? 'active' : 'none',
          colorScheme: theme,
        });
        const page = await context.newPage();
        await page.addInitScript(WATCH_RENDER);
        await page.addInitScript(FREEZE_AT_START, FREEZE);
        for (const step of steps)
          shots[base].push(await capture(page, `${origin}${base}`, id, { theme }, step));
        await context.close();
      }
      steps.forEach((_, i) => {
        compared++;
        const blank = isBlank(shots[''][i]) || isBlank(shots['/angular'][i]);
        if (!blank && same(shots[''][i], shots['/angular'][i])) return;
        const name = `${id}-${theme}${forced ? '-forced' : ''}${i ? '-space' : ''}`;
        failures.push(blank ? `${name} (blank screenshot)` : name);
        if (OUT)
          pending.push(
            mkdir(OUT, { recursive: true }).then(() =>
              Promise.all([
                writeFile(join(OUT, `${name}-reference.png`), shots[''][i]),
                writeFile(join(OUT, `${name}-angular.png`), shots['/angular'][i]),
              ]),
            ),
          );
      });
    }
  }
}
await Promise.all(pending);
await browser.close();
server.close();

if (compared === 0) {
  console.error(`No screenshot pair was compared (PARITY_ONLY=${ONLY ?? ''} matched no story).`);
  process.exit(1);
}
console.log(
  `${compared} screenshot pairs compared (${selected.length} stories x 2 themes x 2 colour modes, plus Space states).`,
);
if (failures.length) {
  console.error(`DRIFT in ${failures.length}:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('Reference and Angular are pixel-identical.');
