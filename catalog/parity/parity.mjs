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
import { NARROW, STATES } from './states.mjs';

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

/** A capture that never settled: five screenshots in a row, no two consecutive ones identical. */
class UnstableError extends Error {}

/**
 * The element a selector names. A selector that matches nothing is a failure of that side, and so
 * is one that matches several elements without an explicit `>> nth=`: a step never retargets.
 */
async function find(page, sel) {
  const matches = await page.locator(sel).count();
  if (matches === 0) throw new StepError(`selector not found: ${sel}`);
  if (matches > 1 && !/>> nth=-?\d+$/.test(sel))
    throw new StepError(`selector is ambiguous (${matches} matches, add >> nth=N): ${sel}`);
  return page.locator(sel).first();
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
  async keyDown(page, key) {
    await page.keyboard.down(key);
    (page.heldKeys ??= []).push(key);
  },
  async type(page, [sel, text]) {
    await STEPS.click(page, sel);
    await page.keyboard.type(text);
  },
  async expectFocus(page, sel) {
    await settle(page);
    const focused = await page
      .locator(sel)
      .first()
      .evaluate((el) => el === el.ownerDocument.activeElement)
      .catch(() => false);
    if (!focused) throw new StepError(`expected focus on: ${sel}`);
  },
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
 * come out one level different from a full paint, from run to run. A tiny change of the root zoom,
 * put back, lays out and repaints everything (the top layer included, which a background change does
 * not reach and an opacity change on every element makes noisier), so every screenshot is of a full
 * paint.
 */
const repaint = async (page) => {
  const flip = (on) =>
    page.evaluate((on) => {
      document.getElementById('parity-repaint')?.remove();
      if (!on) return;
      const style = document.createElement('style');
      style.id = 'parity-repaint';
      style.textContent = 'html { zoom: 1.0001 !important; }';
      document.head.append(style);
    }, on);
  await flip(true);
  await settle(page);
  await flip(false);
  await settle(page);
};

/**
 * Even after a full repaint, Chromium's software rasteriser very occasionally (a few captures in a
 * hundred) anti-aliases a rounded corner one level differently. A capture is therefore repeated,
 * with a full repaint in between, until two consecutive screenshots are identical. If five in a row
 * never agree the capture is unstable and fails; the last shot is never used silently.
 * A real drift is the same every time and is unaffected; noise does not repeat itself.
 */
const MAX_SHOTS = 5;
async function stableScreenshot(page) {
  const shoot = async () => {
    await repaint(page);
    return page.screenshot({ fullPage: true });
  };
  let previous = await shoot();
  for (let shots = 2; shots <= MAX_SHOTS; shots++) {
    const next = await shoot();
    if (Buffer.compare(previous, next) === 0) return { png: next, shots };
    previous = next;
  }
  throw new UnstableError(`unstable capture: ${MAX_SHOTS} screenshots in a row never agreed`);
}

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
 * Playwright's aria snapshot lists roles, names and a few states, but not the accessible
 * description (`aria-describedby`) or `aria-invalid`. This adds, for every node under the story root
 * that has one, its role, name, description and those properties, from Chrome's accessibility tree.
 */
const AX_PROPERTIES = new Set(['invalid', 'checked', 'disabled', 'readonly', 'required', 'modal']);
async function accessibilityDetails(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeId } = await cdp.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: '#storybook-root',
    });
    const { node } = await cdp.send('DOM.describeNode', { nodeId });
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const lines = [];
    const visit = (n) => {
      if (!n) return;
      const properties = (n.properties ?? [])
        .filter((p) => AX_PROPERTIES.has(p.name))
        .map((p) => `${p.name}=${p.value.value}`);
      const description = n.description?.value;
      if (!n.ignored && (properties.length || description)) {
        const label = `${n.role?.value} "${n.name?.value ?? ''}"`;
        lines.push(
          `${label}${description ? ` description="${description}"` : ''}${properties.length ? ` ${properties.join(' ')}` : ''}`,
        );
      }
      for (const id of n.childIds ?? []) visit(byId.get(id));
    };
    visit(nodes.find((n) => n.backendDOMNodeId === node.backendNodeId));
    return lines.join('\n');
  } finally {
    await cdp.detach();
  }
}

/**
 * Gets the story on screen in its initial state. The first state of a page loads it. A later state
 * remounts it through Storybook (a reload costs most of the run) after releasing the pointer and
 * every held key, moving the pointer outside the page and scrolling to the top.
 *
 * What a page cannot reset is the browser's input modality (after a key or a mouse press, whether a
 * script's `focus()` shows `:focus-visible`). It only matters to a story that moves focus from a
 * script (a dialog's autofocus, a play function pressing Tab), so after a state that pressed a key
 * or a mouse button such a story is reloaded instead (`reload`, decided by the caller).
 */
async function load(page, base, id, theme, reload) {
  if (reload) {
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  } else {
    for (const key of page.heldKeys ?? []) await page.keyboard.up(key);
    page.heldKeys = [];
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

const INPUT_STEPS = new Set(['down', 'click', 'clickAt', 'press', 'keyDown', 'tabTo', 'type']);
const usedInput = (state) =>
  (state?.steps ?? []).some((step) => INPUT_STEPS.has(Object.keys(step)[0]));

async function capture(page, base, id, { theme, forced, aria }, state, reload) {
  await load(page, base, id, theme, reload);
  if (reload) await page.addStyleTag({ content: FREEZE });
  await page.evaluate(() => document.fonts.ready);
  for (const step of state?.steps ?? []) {
    const [[name, arg]] = Object.entries(step);
    await STEPS[name](page, arg);
  }
  const mask = forced ? await page.evaluate(FOCUSED_TEXT_BOX) : null;
  const { png, shots } = await stableScreenshot(page);
  // The accessibility tree is the same in every colour mode: taken once, in the light run. It is
  // read after the repaints, so work an implementation finishes asynchronously (Angular renders a
  // `closed` output a tick later) has landed, as it has in the screenshot.
  const tree =
    aria && (state === null || state.aria)
      ? `${await page.locator('#storybook-root').ariaSnapshot()}\n\nname, description and properties:\n${await accessibilityDetails(page)}`
      : undefined;
  const scriptedFocus =
    state === null && (await page.evaluate(() => document.activeElement !== document.body));
  return { png, mask, shots, tree, scriptedFocus };
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
const NARROW_WIDTH = 360;
const BLANK_MAX_BYTES = 20_000;
const jobs = [
  ...selected.flatMap((id) => MODES.map((mode) => ({ id, ...mode, width: 700 }))),
  ...NARROW.filter((id) => selected.includes(id)).map((id) => ({
    id,
    theme: 'light',
    forced: false,
    width: NARROW_WIDTH,
    narrow: true,
  })),
];
const results = jobs.map(() => null);
const SIDES = { reference: '', angular: '/angular' };

const firstLine = (error) => String(error?.message ?? error).split('\n')[0];

/**
 * Every state of one story on one side, in a fresh browser context. A step or stability failure is
 * recorded for its state. Anything else (a render timeout, a closed page, a crashed browser) is an
 * infrastructure error: the story is retried once from scratch on that side, and if it fails again
 * the state it died in is reported, never a raw stack.
 */
async function captureSide(browser, base, id, job, states) {
  const attempt = async (out) => {
    const context = await browser.newContext({
      viewport: { width: job.width, height: 1000 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      forcedColors: job.forced ? 'active' : 'none',
      colorScheme: job.theme,
    });
    try {
      await context.addInitScript(WATCH_RENDER);
      await context.addInitScript(FREEZE_AT_START, FREEZE);
      const page = await context.newPage();
      let reload = true;
      let scriptedFocus = true;
      for (const state of states) {
        const label = state?.name ?? 'first paint';
        try {
          const shot = await capture(page, `${origin}${base}`, id, job, state, reload);
          out.push(shot);
          if (state === null) scriptedFocus = shot.scriptedFocus;
          reload = scriptedFocus && usedInput(state);
        } catch (error) {
          if (error instanceof StepError || error instanceof UnstableError) {
            out.push({ error: error.message });
            reload = true;
          } else throw Object.assign(error, { label });
        }
      }
    } finally {
      await context.close().catch(() => {});
    }
    return out;
  };
  try {
    return await attempt([]);
  } catch {
    const out = [];
    try {
      return await attempt(out);
    } catch (error) {
      const failed = states.slice(out.length);
      return [
        ...out,
        ...failed.map((state, i) => ({
          error:
            i === 0
              ? `infrastructure error, retried once: ${firstLine(error)}`
              : 'not run: the story aborted on an infrastructure error',
        })),
      ];
    }
  }
}

/** Lines only in `a` as `- `, only in `b` as `+ `, by longest common subsequence. */
function textDiff(a, b) {
  const x = a.split('\n');
  const y = b.split('\n');
  const lcs = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--)
      lcs[i][j] = x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      out.push(`  ${x[i]}`);
      i++;
      j++;
    } else if (j >= y.length || (i < x.length && lcs[i + 1][j] >= lcs[i][j + 1]))
      out.push(`- ${x[i++]}`);
    else out.push(`+ ${y[j++]}`);
  }
  return out.join('\n');
}

/** All the states of one story in one theme and colour mode (or one narrow first paint), both sides. */
async function run(browser, job) {
  const { id, theme, forced } = job;
  const modeName = `${theme}${forced ? '-forced' : ''}`;
  const states = [
    null,
    ...(!job.narrow && STATE_MODES.includes(modeName) ? (STATES[id] ?? []) : []),
  ];
  const aria = !job.narrow && modeName === 'light';
  const shots = {};
  for (const [side, base] of Object.entries(SIDES))
    shots[side] = await captureSide(browser, base, id, { ...job, aria }, states);
  const outcome = [];
  states.forEach((state, i) => {
    const label = state?.name ?? 'first paint';
    const [a, b] = [shots.reference[i], shots.angular[i]];
    const slow = Object.entries({ reference: a, angular: b })
      .filter(([, shot]) => shot.shots > 2)
      .map(([side, shot]) => ({ side, shots: shot.shots }));
    const errors = Object.entries({ reference: a, angular: b })
      .filter(([, shot]) => shot.error)
      .map(([side, shot]) => `${side}: ${shot.error}`);
    if (errors.length) return outcome.push({ label, slow, problem: errors.join('; ') });
    const entry = { label, slow, trees: a.tree === undefined ? 0 : 1 };
    // Decoding a PNG is the heaviest thing the main thread does and every worker waits for it, so
    // byte-identical screenshots (the usual case) are not decoded; only a small one, which could be
    // a blank page, is checked for blankness.
    const identicalBytes = !a.mask && !b.mask && a.png.equals(b.png);
    const [x, y] = identicalBytes
      ? [a.png.length < BLANK_MAX_BYTES ? decode(a) : null, null]
      : [decode(a), decode(b)];
    if ((x && isBlank(x)) || (y && isBlank(y)))
      return outcome.push({ ...entry, problem: 'blank screenshot', a, b });
    if (!identicalBytes && !same(x, y))
      outcome.push({ ...entry, problem: 'pixels differ', a, b, diff: diffImage(x, y) });
    else if (a.tree !== b.tree)
      outcome.push({
        ...entry,
        problem: `accessibility tree differs (- Reference, + Angular):\n${textDiff(a.tree, b.tree)}`,
      });
    else outcome.push(entry);
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
let trees = 0;
const table = new Map();
const writes = [];
const slowCaptures = [];
jobs.forEach((job, i) => {
  const key = job.narrow ? `${job.id} @${job.width}px` : job.id;
  const row = table.get(key) ?? { pairs: 0, states: new Set(), bad: 0 };
  table.set(key, row);
  for (const o of results[i]) {
    row.states.add(o.label);
    row.pairs++;
    compared++;
    trees += o.trees ?? 0;
    const mode = `${job.theme}${job.forced ? '-forced' : ''}${job.narrow ? `-${job.width}px` : ''}`;
    for (const { side, shots } of o.slow ?? [])
      slowCaptures.push(`${job.id} | ${o.label} | ${mode} | ${side} | ${shots} shots`);
    if (!o.problem) continue;
    row.bad++;
    const name = `${job.id}--${o.label}--${mode}`;
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
const slowReport = slowCaptures.length
  ? `${slowCaptures.length} capture(s) needed more than 2 screenshots to settle (story | state | mode | side | shots):\n  ${slowCaptures.join('\n  ')}`
  : 'No capture needed more than 2 screenshots to settle.';
console.log(`\n${slowReport}`);
const seconds = ((Date.now() - started) / 1000).toFixed(0);
const summary = `${compared} screenshot pairs compared (first paints, interaction states and narrow first paints), ${trees} accessibility-tree comparisons, ${CONCURRENCY} workers, ${seconds}s.`;
if (process.env.GITHUB_STEP_SUMMARY)
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    [
      `### Parity\n\n${failures.length ? `**${failures.length} failure(s)**\n\n\`\`\`\n${failures.join('\n')}\n\`\`\`\n\n` : ''}${summary}\n`,
      `| ${header.join(' | ')} |\n| --- | ---: | ---: | --- |\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`,
      `\n#### Capture stability\n\n${slowCaptures.length ? `\`\`\`\n${slowCaptures.join('\n')}\n\`\`\`` : 'Every capture settled in two screenshots.'}\n\n`,
    ].join('\n'),
  );

if (compared === 0) {
  console.error(`No screenshot pair was compared (PARITY_ONLY=${ONLY ?? ''} matched no story).`);
  process.exit(1);
}
console.log(`\n${summary}`);
if (failures.length) {
  console.error(`DRIFT in ${failures.length}:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('Reference and Angular are identical in pixels and in the accessibility tree.');
