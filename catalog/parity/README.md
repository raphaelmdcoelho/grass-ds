# @grass-ds/catalog-parity

Pixel parity between the **Reference** Storybook (framework-free HTML plus `@grass-ds/css`) and the **Angular** Storybook. Every `Components/*` story must look identical in both; this is the base of the plan's drift check.

## What it does

**Scope: what the user sees plus the accessibility tree.** It compares pixels and, per story, the accessibility tree (roles, names, descriptions, `aria-invalid`, checked and similar states). It does **not** compare DOM structure (an extra wrapper that changes neither is invisible, on purpose) or model state (a component's inputs, signals or form values), and it does not prove behaviour beyond the states it drives.

For every `Components/*` story present in both Storybooks it loads the story in headless Chromium and compares the two **full-page** screenshots **exactly**: no tolerance, no anti-aliasing allowance.

- **First paint**, in light and dark themes, in normal and forced colours (4 modes).
- **Accessibility tree**, once per story (light mode only, it does not depend on colours) for the first paint and for each state flagged `tree(...)` in `states.mjs` (dialog open or closed, a checkbox toggled, an error added or removed, a return value shown). Playwright's `ariaSnapshot()` of the story root plus the accessible description and `invalid`/`checked`/`disabled`/`readonly`/`required`/`modal` properties from Chrome's accessibility tree, compared as text; a failure prints a `-`/`+` diff. Checked by mutation: a dialog without `aria-labelledby` and a field without `aria-describedby` are caught.
- **A narrow viewport** (360 px, light, first paint) for the stories in `NARROW`: Dialog basic and long content, Card in a grid, TextField default and types.
- **Interaction states** declared in [`states.mjs`](states.mjs): hover, active (pointer or key held), keyboard focus, focus plus hover, clicks, Escape, a click on the backdrop. Each state runs on both sides with the same steps, in `light` and `dark-forced` (`PARITY_STATE_MODES`): the two together cover both axes, and the drift this check looks for (a missing class or attribute, a wrong host element) shows in any mode, since both sides share one stylesheet.

It fails (exit 1) on any difference (pixels or accessibility tree), on a capture that never settled ("unstable capture", with story, state, mode and side), on an infrastructure error that persisted after one retry, on a story that exists on one side only, on a story with no entry in `states.mjs`, on an entry with no story, on a step whose selector matches nothing, or several things without `>> nth=`, on a side, on a blank screenshot, and when no pair was compared at all. It prints a table of what was compared (story, states, pairs, result) and, in CI, the same table in the job summary.

### Why full-page screenshots for states

A state capture could be clipped to the element, but a full page also catches what the element's box hides: a focus ring or shadow that overflows it, a layout shift of the neighbours, a dialog's backdrop, an error message appearing. Pages are small (700x1000), so the extra cost is negligible, and a false match from a too-tight clip is the worse failure.

### How states are made deterministic

- Reduced motion is emulated, and a stylesheet switches off transitions, animations, the caret and the spell-check underline from the first paint.
- A capture waits for Storybook's `storyRendered` event (play functions included), for fonts, and then for a **full repaint**: after a state change Chromium repaints only the invalidated region, and anti-aliased edges (the ends of a focus ring) could come out one level different from run to run. A tiny change of the root `zoom`, put back, lays out and repaints everything, the top layer included (a background change does not reach a dialog, and an opacity change on every element made the rasteriser noisier), so every screenshot is of a full paint. Even then the software rasteriser very occasionally anti-aliases a rounded corner one level differently, so a capture is repeated, with a full repaint in between, until two consecutive screenshots are identical. If five in a row never agree the check **fails** as an unstable capture; the last shot is never used silently. A real drift is identical every time and is unaffected; noise does not repeat.
- **The stability counter**: every capture that needed more than two screenshots is listed at the end of the run and in the CI job summary (story, state, mode, side, shots). A rising count is the early warning of a flake, long before a capture reaches five.
- Every state starts from a freshly rendered story, with no pointer, held key or scroll left over: the first state loads the page, later ones remount the story through Storybook after releasing the mouse button and every held key and moving the pointer outside the page. The one thing a page cannot reset is the browser's input modality (after a key or mouse press, whether a script's `focus()` shows `:focus-visible`); it only matters to stories that move focus from a script (dialogs' autofocus, the keyboard-focus stories), so after a state that pressed a key or button those stories are reloaded instead of remounted.
- Chromium runs with `--disable-gpu --disable-lcd-text --font-render-hinting=none --force-device-scale-factor=1`.
- **Forced-colours caret**: the caret colour cannot be hidden by CSS in forced colours (they override it). In that mode the content box of a focused text field, where the caret is drawn and nothing else, is blanked in the comparison on both sides. The border, padding and focus ring are still compared; the field's text is not, in that one state.

### Speed

Work is split into one job per story, theme and colour mode, and spread over `PARITY_CONCURRENCY` workers (default `min(4, CPUs)`, which fits the 4-vCPU CI runner), **each with its own browser**: with GPU rasterisation off, the pages of one browser share a compositing thread and would queue. Results are collected and printed in a fixed order, so the output does not depend on which worker finished first.

## Run it

```sh
pnpm build:catalog     # builds both Storybooks and composes catalog/site
pnpm parity
```

It needs a Chromium. Either install the one Playwright manages:

```sh
pnpm --filter @grass-ds/catalog-parity exec playwright-core install chromium
```

or point `CHROMIUM_PATH` at an existing binary (for example `CHROMIUM_PATH=/usr/bin/chromium pnpm parity`).

| Variable             | Effect                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `CHROMIUM_PATH`      | Chromium executable to launch instead of Playwright's.                                                                                    |
| `PARITY_ONLY`        | Only stories whose id contains this text (`PARITY_ONLY=checkbox`).                                                                        |
| `PARITY_OUT`         | Directory that receives the Reference, Angular and red-overlay diff PNGs of every mismatch.                                               |
| `PARITY_CONCURRENCY` | Number of workers (and browsers). Default `min(4, CPUs)`.                                                                                 |
| `PARITY_STATE_MODES` | Comma-separated modes the interaction states run in. Default `light,dark-forced`; use `light,dark,light-forced,dark-forced` for all four. |

## Adding a state to a story

Every new or changed `Components/*` story must exist in **both** Storybooks with the same id and have an entry in `states.mjs`, keyed by story id (`components-button--variants`). An empty array means "first paint only, on purpose".

```js
'components-button--variants': [
  { name: 'hover danger', steps: [{ hover: '.gr-button >> nth=3' }] },
  s('active danger', down(nth('.gr-button', 3))), // the helpers at the top of the file
],
```

Steps: `hover`, `down` (held), `click`, `clickAt: [x, y]`, `press`, `keyDown` (held), `type: [selector, text]`, `tabTo` (Tab until the element has focus, so `:focus-visible` matches), and the assertions `expect`, `expectGone` and `expectFocus` (a dialog gives focus back to its opener). Wrap a state in `tree(...)` to compare the accessibility tree after it as well; do that wherever a state changes semantics. Selectors are Playwright selectors on markup both sides share (classes, attributes, ids, text), never on an Angular wrapper. A selector that matches several elements needs `>> nth=N`, and a missing index fails: a step never retargets. The full list is documented at the top of `states.mjs`.

## When it fails

```sh
pnpm build:catalog
PARITY_OUT=$PWD/catalog/site/pout PARITY_ONLY=button--variants pnpm parity
```

For each mismatch `PARITY_OUT` holds `<story>-<state>-<mode>-reference.png`, `-angular.png` and `-diff.png` (red where the pixels differ, the Reference faded elsewhere). In CI the `Parity` job uploads the same folder as the `parity-mismatches` artifact when it fails.

- A failing **selector** means the story markup differs between the sides, or a step is wrong; the message names the side.
- A diff that appears on the **Angular side only** is a drift in the implementation (a class, attribute or element). Fix the implementation with a `fix(angular)` commit.
- A diff that comes and goes between runs, a few anti-aliased pixels, is a flake: fix the cause in `parity.mjs` instead of re-running. The comparison is never re-run: a capture is repeated until it is stable (and fails if it cannot be), and only an infrastructure error (a render timeout, a closed page, a crashed browser) is retried once, on a fresh context; a pixel or accessibility-tree difference is never retried.
- An **accessibility tree** failure prints a `-` (Reference) / `+` (Angular) text diff in the log and the job summary.

## Blind spots

- It compares first paint and the states declared in `states.mjs`: a state nobody declared is not checked. Pointer states are Chromium's synthetic input; touch, drag and long press are not exercised.
- Both Storybooks use the **same CSS**. A bug in the shared style layer (a collapsed mark, a wrong colour) renders the same on both sides and is invisible to this check by design: it only catches the Angular implementation drifting from the markup contract. Look at the renders too.
- In forced colours the text of a focused text field is not compared in that state (see the caret above); first paint, hover and every other state compare it.
- Only Chromium; other engines may differ. No screen reader is involved: the accessibility tree is Chrome's, not what NVDA, JAWS or VoiceOver announce.
- Pointer input is Chromium's synthetic input; touch, drag, long press, zoom, text scaling and `prefers-contrast` are not exercised, and the narrow viewport covers first paint only.
- Interaction states run in two of the four modes on pull requests; the other two are covered weekly, not per pull request.
- The text of a focused field is not compared in forced colours in that state (see the caret).
- Only the stories that exist: a state with no story is not checked.

The weekly workflow [`parity-all-modes.yml`](../../.github/workflows/parity-all-modes.yml) ("Parity (all modes)", also `workflow_dispatch`, never a pull request check) runs the interaction states in all four modes (`PARITY_STATE_MODES=light,dark,light-forced,dark-forced`).

It runs in CI as the `Parity` job, meant to be a required check of the `Protect main` ruleset (the repository owner adds it there). Keep the job name `Parity`: the ruleset matches on it. A required `Parity` depends on the Playwright browser download (cached by playwright-core version) and on the runner's apt mirrors: if an outage of either blocks pull requests, re-run the job; the repository owner can also disable the ruleset temporarily in Settings → Rules.
