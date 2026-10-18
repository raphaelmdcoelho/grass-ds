/**
 * Drift check: renders every `Components/*` story of the Reference Storybook and of the Angular
 * Storybook in headless Chromium, in both themes and in forced colours, and requires the two
 * screenshots to match exactly (no tolerance). Besides the first paint it drives the interaction
 * states listed in `states.mjs` (hover, active, keyboard focus, clicks, Escape, the backdrop) on
 * both sides with the same steps.
 *
 *   pnpm build:catalog && pnpm parity
 *
 * Needs the composed site in catalog/site (build:catalog) and a Chromium: set CHROMIUM_PATH to
 * a browser binary, or run `pnpm --filter @grass-ds/catalog-parity exec playwright-core install chromium` once.
 * It runs in CI as the `Parity` job. See README.md.
 *
 * Determinism: reduced motion is emulated, transitions, animations and the caret are switched off,
 * a story is captured only after Storybook reports it rendered (play function included) and the
 * fonts are loaded, GPU rasterisation and LCD text are off, and the device scale factor is fixed.
 * Every state starts from a freshly loaded story with the pointer outside the page, and is
 * captured as a full-page screenshot. Work is spread over PARITY_CONCURRENCY workers, one browser
 * context per story and side; results are collected and reported in a fixed order.
 */
import { createServer } from 'node:http';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { STATES } from './states.mjs';

const ONLY = process.env.PARITY_ONLY; // substring filter on the story id
const OUT = process.env.PARITY_OUT; // directory that receives the screenshots of every mismatch
const CONCURRENCY = Number(process.env.PARITY_CONCURRENCY) || Math.min(4, availableParallelism());
/** Interaction states run in these modes; the first paint always runs in all four. */
const STATE_MODES = (process.env.PARITY_STATE_MODES ?? 'light,dark-forced').split(',');
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

const FREEZE = `*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }
::spelling-error, ::grammar-error { text-decoration: none !important; }`;

/** Where a step went wrong on one side (a selector that matches nothing, a focus that never arrives). */
class StepError extends Error {}

/** The element a selector names, scrolled into view; a miss is a failure of that side. */
async function find(page, sel) {
  const locator = page.locator(sel).first();
  if ((await page.locator(sel).count()) === 0) throw new StepError(`selector not found: ${sel}`);
  return locator;
}

async function centre(page, sel) {
  const box = await (
    await find(page, sel)
  ).evaluate((el) => {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const { x, y, width, height } = el.getBoundingClientRect();
    return { x, y, width, height };
  });
  return [box.x + box.width / 2, box.y + box.height / 2];
}

const STEPS = {
  async hover(page, sel) {
    await page.mouse.move(...(await centre(page, sel)));
  },
  async down(page, sel) {
    await page.mouse.move(...(await centre(page, sel)));
    await page.mouse.down();
  },
  async click(page, sel) {
    await page.mouse.move(...(await centre(page, sel)));
    await page.mouse.down();
    await page.mouse.up();
  },
  async clickAt(page, [x, y]) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
  },
  press: (page, key) => page.keyboard.press(key),
  keyDown: (page, key) => page.keyboard.down(key),
  async tabTo(page, sel) {
    const target = await find(page, sel);
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      if (await target.evaluate((el) => el === el.ownerDocument.activeElement)) return;
    }
    throw new StepError(`Tab never reached: ${sel}`);
  },
  async expect(page, sel) {
    await settle(page);
    if ((await page.locator(sel).count()) === 0) throw new StepError(`expected to match: ${sel}`);
  },
  async expectGone(page, sel) {
    try {
      await page.locator(sel).first().waitFor({ state: 'detached', timeout: 2000 });
    } catch {
      throw new StepError(`still matches after 2s: ${sel}`);
    }
  },
};

const settle = (page) =>
  page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );

/**
 * After a state change (hover or active on an element that is already focused, say) Chromium
 * repaints only the invalidated region, and anti-aliased edges such as the ends of a focus ring can
 * come out one level different from a full paint, from run to run. Changing the root background
 * and putting it back invalidates the whole page, so every screenshot is of a full paint.
 */
const repaint = async (page) => {
  const flip = (on) =>
    page.evaluate((on) => {
      document.getElementById('parity-repaint')?.remove();
      if (!on) return;
      const style = document.createElement('style');
      style.id = 'parity-repaint';
      style.textContent = '*, *::before, *::after, ::backdrop { opacity: 0.99 !important; }';
      document.head.append(style);
    }, on);
  await flip(true);
  await settle(page);
  await flip(false);
  await settle(page);
};

/**
 * A focused text field blinks its caret. `caret-color: transparent` hides it, but forced colours
 * override that colour, so in forced colours the content box of the focused field (where the caret
 * is drawn, never the border, padding or focus ring) is blanked in the comparison on both sides.
 */
const FOCUSED_TEXT_BOX = () => {
  const el = document.activeElement;
  if (
    !el?.matches('textarea, input:not([type=checkbox], [type=radio], [type=button], [type=submit])')
  )
    return null;
  const r = el.getBoundingClientRect();
  const c = getComputedStyle(el);
  const [t, rt, b, l] = ['Top', 'Right', 'Bottom', 'Left'].map(
    (side) => parseFloat(c[`border${side}Width`]) + parseFloat(c[`padding${side}`]),
  );
  return {
    x: Math.floor(r.left + scrollX + l),
    y: Math.floor(r.top + scrollY + t),
    width: Math.ceil(r.width - l - rt),
    height: Math.ceil(r.height - t - b),
  };
};

/**
 * Gets the story on screen in its initial state. The first state of a page loads it; later states
 * remount it through Storybook (a reload costs most of the run), after the previous state's pointer,
 * held keys and scroll are cleared.
 */
async function load(page, base, id, theme, reload) {
  if (reload) {
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  } else {
    await page.mouse.up();
    await page.mouse.move(-10, -10);
    await page.evaluate((storyId) => {
      window.__rendered = false;
      window.__failed = null;
      scrollTo(0, 0);
      window.__STORYBOOK_ADDONS_CHANNEL__.emit('forceRemount', { storyId, viewMode: 'story' });
    }, id);
  }
  await page.waitForFunction(() => window.__rendered || window.__failed, null, { timeout: 30000 });
  const failed = await page.evaluate(() => window.__failed);
  if (failed) throw new Error(`${id}: ${failed}`);
}

async function capture(page, base, id, { theme, forced }, state, reload) {
  await load(page, base, id, theme, reload);
  if (reload) await page.addStyleTag({ content: FREEZE });
  await page.evaluate(() => document.fonts.ready);
  for (const step of state?.steps ?? []) {
    const [[name, arg]] = Object.entries(step);
    await STEPS[name](page, arg);
  }
  await repaint(page);
  const mask = forced ? await page.evaluate(FOCUSED_TEXT_BOX) : null;
  const png = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
  return { png, mask };
}

const decode = ({ png, mask }) => {
  const image = PNG.sync.read(png);
  if (mask)
    for (let y = Math.max(mask.y, 0); y < Math.min(mask.y + mask.height, image.height); y++)
      for (let x = Math.max(mask.x, 0); x < Math.min(mask.x + mask.width, image.width); x++)
        image.data.writeUInt32LE(0xffff00ff, (y * image.width + x) * 4);
  return image;
};

const same = (x, y) =>
  x.width === y.width && x.height === y.height && Buffer.compare(x.data, y.data) === 0;

/** Red where the sides differ, the Reference faded elsewhere; a size mismatch is padded. */
const diffImage = (x, y) => {
  const width = Math.max(x.width, y.width);
  const height = Math.max(x.height, y.height);
  const out = new PNG({ width, height });
  const px = (image, ox, oy) =>
    ox < image.width && oy < image.height
      ? image.data.readUInt32LE((oy * image.width + ox) * 4)
      : null;
  for (let oy = 0; oy < height; oy++)
    for (let ox = 0; ox < width; ox++) {
      const a = px(x, ox, oy);
      const b = px(y, ox, oy);
      const at = (oy * width + ox) * 4;
      if (a === b) {
        const grey =
          a === null ? 255 : 178 + (((a & 255) + ((a >> 8) & 255) + ((a >> 16) & 255)) / 3) * 0.3;
        out.data.set([grey, grey, grey, 255], at);
      } else out.data.set([255, 0, 0, 255], at);
    }
  return PNG.sync.write(out);
};

/** A page that failed to render (or a wrong URL) is blank: two blank shots would otherwise "match". */
const isBlank = ({ data }) => {
  let different = 0;
  for (let i = 4; i < data.length; i += 4)
    if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) different++;
  return different < 50;
};

const slug = (text) =>
  text
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
/**
 * One browser per worker: with GPU rasterisation off every page of a browser is composited and read
 * back on one shared thread, so pages of a single browser would queue behind each other.
 */
const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-lcd-text',
      '--font-render-hinting=none',
      '--force-device-scale-factor=1',
    ],
  });
const browsers = await Promise.all(Array.from({ length: CONCURRENCY }, launch)).catch((error) => {
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

// Coverage guard: a story on one side only, a story with no declared states, a stale declaration.
const failures = [
  ...reference.filter((id) => !angular.includes(id)).map((id) => `${id}: no Angular story`),
  ...angular.filter((id) => !reference.includes(id)).map((id) => `${id}: no Reference story`),
  ...reference
    .filter((id) => !(id in STATES))
    .map((id) => `${id}: no entry in states.mjs (use [] to compare the first paint only)`),
  ...Object.keys(STATES)
    .filter((id) => !reference.includes(id) && !angular.includes(id))
    .map((id) => `${id}: in states.mjs but no such story`),
];

const selected = reference.filter((id) => angular.includes(id) && (!ONLY || id.includes(ONLY)));
const MODES = [
  { theme: 'light', forced: false },
  { theme: 'dark', forced: false },
  { theme: 'light', forced: true },
  { theme: 'dark', forced: true },
];
const jobs = selected.flatMap((id) => MODES.map((mode) => ({ id, ...mode })));
const results = jobs.map(() => null);
const SIDES = { reference: '', angular: '/angular' };

/** All the states of one story in one theme and colour mode, on both sides. */
async function run(browser, { id, theme, forced }) {
  const modeName = `${theme}${forced ? '-forced' : ''}`;
  const states = [null, ...(STATE_MODES.includes(modeName) ? (STATES[id] ?? []) : [])];
  const shots = {};
  for (const [side, base] of Object.entries(SIDES)) {
    const context = await browser.newContext({
      viewport: { width: 700, height: 1000 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      forcedColors: forced ? 'active' : 'none',
      colorScheme: theme,
    });
    await context.addInitScript(WATCH_RENDER);
    await context.addInitScript(FREEZE_AT_START, FREEZE);
    shots[side] = [];
    const page = await context.newPage();
    for (const [n, state] of states.entries()) {
      try {
        const shot = await capture(page, `${origin}${base}`, id, { theme, forced }, state, n === 0);
        shots[side].push(shot);
      } catch (error) {
        if (!(error instanceof StepError)) throw error;
        shots[side].push({ error: error.message });
      }
    }
    await context.close();
  }
  const outcome = [];
  states.forEach((state, i) => {
    const label = state?.name ?? 'first paint';
    const [a, b] = [shots.reference[i], shots.angular[i]];
    const errors = Object.entries({ reference: a, angular: b })
      .filter(([, shot]) => shot.error)
      .map(([side, shot]) => `${side}: ${shot.error}`);
    if (errors.length) return outcome.push({ label, problem: errors.join('; ') });
    const [x, y] = [decode(a), decode(b)];
    if (isBlank(x) || isBlank(y)) return outcome.push({ label, problem: 'blank screenshot', a, b });
    if (same(x, y)) return outcome.push({ label });
    outcome.push({ label, problem: 'pixels differ', a, b, diff: diffImage(x, y) });
  });
  return outcome;
}

async function worker(browser, next) {
  for (let i = next(); i < jobs.length; i = next()) results[i] = await run(browser, jobs[i]);
}

const started = Date.now();
let cursor = 0;
await Promise.all(browsers.map((browser) => worker(browser, () => cursor++)));
await Promise.all(browsers.map((browser) => browser.close()));
server.close();

// Report in a fixed order, whatever order the workers finished in.
let compared = 0;
const table = new Map();
const writes = [];
jobs.forEach((job, i) => {
  const row = table.get(job.id) ?? { pairs: 0, states: new Set(), bad: 0 };
  table.set(job.id, row);
  for (const o of results[i]) {
    row.states.add(o.label);
    row.pairs++;
    compared++;
    if (!o.problem) continue;
    row.bad++;
    const name = `${job.id}--${o.label}--${job.theme}${job.forced ? '-forced' : ''}`;
    failures.push(`${name}: ${o.problem}`);
    if (OUT && o.a)
      writes.push(
        mkdir(OUT, { recursive: true }).then(() =>
          Promise.all([
            writeFile(join(OUT, `${slug(name)}-reference.png`), o.a.png),
            writeFile(join(OUT, `${slug(name)}-angular.png`), o.b.png),
            o.diff && writeFile(join(OUT, `${slug(name)}-diff.png`), o.diff),
          ]),
        ),
      );
  }
});
await Promise.all(writes);

const rows = [...table].map(([id, r]) => [
  id,
  String(r.states.size),
  String(r.pairs),
  r.bad ? `${r.bad} DIFFER` : 'identical',
]);
const header = ['story', 'states', 'pairs', 'result'];
const widths = header.map((h, c) => Math.max(h.length, ...rows.map((r) => r[c].length)));
const line = (cells) => cells.map((cell, c) => cell.padEnd(widths[c])).join('  ');
console.log([line(header), ...rows.map(line)].join('\n'));
if (process.env.GITHUB_STEP_SUMMARY)
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `### Parity\n\n| ${header.join(' | ')} |\n| --- | ---: | ---: | --- |\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n\n`,
  );

if (compared === 0) {
  console.error(`No screenshot pair was compared (PARITY_ONLY=${ONLY ?? ''} matched no story).`);
  process.exit(1);
}
const seconds = ((Date.now() - started) / 1000).toFixed(0);
console.log(
  `\n${compared} screenshot pairs compared: ${selected.length} stories: ${selected.length * 4} first paints (2 themes x 2 colour modes) and ${compared - selected.length * 4} interaction states (in ${STATE_MODES.join(', ')}) (${CONCURRENCY} workers, ${seconds}s).`,
);
if (failures.length) {
  console.error(`DRIFT in ${failures.length}:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('Reference and Angular are pixel-identical.');
