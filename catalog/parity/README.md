# @grass-ds/catalog-parity

Pixel parity between the **Reference** Storybook (framework-free HTML plus `@grass-ds/css`) and the **Angular** Storybook. Every `Components/*` story must look identical in both; this is the base of the plan's drift check.

## What it does

For every `Components/*` story present in both Storybooks, in light and dark themes, in normal and forced colours, it loads the story in headless Chromium and compares the two full-page screenshots **exactly**: no tolerance, no anti-aliasing allowance. Stories whose id ends in `keyboard-focus` are captured twice: as rendered (the story's play function has pressed Tab) and again after pressing Space on the focused checkbox.

It fails (exit 1) on any difference, on a story that exists on one side only, on a blank screenshot, and when no pair was compared at all.

Captures are made deterministic by emulating reduced motion, injecting a stylesheet that switches off transitions, animations and the caret from the first paint, waiting for Storybook's `storyRendered` event (play functions included), fonts and two animation frames, and by launching Chromium with `--disable-gpu --disable-lcd-text --font-render-hinting=none --force-device-scale-factor=1`.

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

| Variable        | Effect                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------- |
| `CHROMIUM_PATH` | Chromium executable to launch instead of Playwright's.                                    |
| `PARITY_ONLY`   | Only stories whose id contains this text (`PARITY_ONLY=checkbox`).                        |
| `PARITY_OUT`    | Directory that receives the Reference and Angular PNGs of every mismatch, for inspection. |

## Blind spots

- It compares **first paint**, plus **Space** on the keyboard-focus stories. Hover, active, pointer and other keyboard interactions are not exercised.
- Both Storybooks use the **same CSS**. A bug in the shared style layer (a collapsed mark, a wrong colour) renders the same on both sides and is invisible to this check by design: it only catches the Angular implementation drifting from the markup contract. Look at the renders too.
- Only Chromium; other engines may differ.
- Only the stories that exist: a state with no story is not checked.

It runs in CI as the `Parity` job, which is not a required check yet.
