# Grass Design System: plan

Outcome of the planning (grilling) session on 2026-10-15. Vocabulary is defined in [CONTEXT.md](../CONTEXT.md); the hard-to-reverse decisions are in [docs/adr/](./adr/).

## Architecture

- Tokens are the single source of truth: W3C DTCG JSON, compiled by Style Dictionary ([ADR 0002](./adr/0002-w3c-dtcg-json-as-token-source.md)).
- A framework-agnostic CSS style layer defines all appearance; framework implementations only render its markup contract and add behaviour ([ADR 0001](./adr/0001-shared-style-layer-with-per-framework-implementations.md)).
- Angular is the only implementation in scope. Any other framework (e.g. React) is undecided.
- Interactive behaviour uses the web platform first: `<dialog>`, Popover API, CSS anchor positioning ([ADR 0005](./adr/0005-web-platform-first-for-behaviour.md)).

## Packages (npm scope `@grass-ds`)

| Package             | Contents                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `@grass-ds/tokens`  | DTCG JSON source and the generated CSS custom properties (`--gr-*`). CSS output only for now; a TS/JSON export can be added later. |
| `@grass-ds/css`     | Style layer: foundations and component CSS, plus self-hosted Figtree via an optional `fonts.css`.                                  |
| `@grass-ds/angular` | Angular implementation.                                                                                                            |

All packages share one version number ([ADR 0003](./adr/0003-publish-packages-to-npm.md)).

## Tokens

- Three tiers: primitive → semantic → component. Only semantic tokens change between themes.
- Themes: light and dark only. The OS preference (`prefers-color-scheme`) applies by default, and `data-theme="light|dark"` on `<html>` forces a theme. Themes switch only on `<html>`; scoped (per-subtree) themes are not supported because component tokens resolve their `var()` references at `:root`.
- Build fails if any semantic foreground/background pair misses WCAG 2.2 AA contrast (4.5:1 for text, 3:1 for large text and UI) in either theme.

## Visual direction (grass-inspired)

- Primary/action: fresh grass green.
- Neutrals: grey with a faint olive/green tint.
- Feedback: sun yellow (warning), clay/poppy red (danger), sky blue (info), green (success, kept distinguishable from primary).
- Dark theme: near-black surfaces with a slight green tint ("night meadow").
- Colour scales generated in OKLCH for even perceived lightness.
- Shape: soft corners (8px base), pill-shaped buttons.
- Depth: mostly flat. Subtle soft shadows on overlays (e.g. Dialog) only.
- Typography: Figtree (variable, self-hosted) with a system-font fallback. Ratio-1.25 type scale, 16px body, fixed sizes.
- Spacing: 4px base (`space.1` = 4px … `space.16` = 64px).
- Motion: duration and easing tokens, all collapsed under `prefers-reduced-motion`.

## Style layer

- Plain modern CSS (native nesting), no preprocessor.
- Everything inside `@layer grass.*` so consumer CSS always wins.
- Component classes prefixed `gr-` (e.g. `.gr-button`). States and variants are expressed through ARIA/data attributes.
- Foundations: reset, typography, colour application, and layout utilities `.gr-stack`, `.gr-cluster`, `.gr-grid`, `.gr-container`. Responsive behaviour via container queries, with no breakpoint tokens.
- Browser support: current evergreen browsers only. Anchor positioning is a progressive enhancement with a fallback.

## Angular implementation

- Latest Angular major: standalone components, signal inputs, OnPush, works without zone.js, `ViewEncapsulation.None`.
- Native-backed components are attribute selectors (`<button grButton>`, `<input grTextField>`, `<input type="checkbox" grCheckbox>`). Composites are elements (`<gr-card>`, `<gr-dialog>`) ([ADR 0004](./adr/0004-attribute-selectors-on-native-elements.md)).
- v1 components: Button, TextField, Checkbox, Card, Dialog.
- Built with `ng-packagr`.

## Catalog

- One Storybook site, run locally and published to GitHub Pages. It composes a framework-free Reference Storybook (`@storybook/html-vite`, the Vite framework package for the HTML renderer) with the Angular Storybook ([ADR 0006](./adr/0006-catalog-composes-reference-and-implementation-storybooks.md)).
- Drift check (done): `pnpm parity` renders every `Components/*` story of both Storybooks in Chromium, in both themes and in forced colours, and requires identical pixels. Besides first paint it drives the interaction states each story declares in `catalog/parity/states.mjs` (hover, active, keyboard focus, clicks, Escape, backdrop) with the same steps on both sides, and compares each story's accessibility tree (Playwright aria snapshot plus accessible description and states) as text. It fails on a story missing from one side, a story with no declared states or a step a side cannot perform. It is the `Parity` job of CI, to be added to the required checks of the `main` ruleset by the owner once this has merged.

## Repo & tooling

- pnpm workspaces with plain `pnpm -r` scripts, no task runner (add Turborepo only if builds get slow).
- Node 26 (installed via nvm; becomes LTS in late October 2026), pinned in `.nvmrc` and `engines`. pnpm pinned through the `packageManager` field and activated with Corepack, which Node 25+ no longer bundles (`npm install -g corepack`).
- Public GitHub repo, MIT licence (Figtree keeps its OFL licence).
- Husky:
  - `commit-msg`: commitlint with Conventional Commits, scopes `tokens|css|angular|catalog|repo`.
  - `pre-commit`: lint-staged running Prettier, Stylelint and ESLint on staged files.

## CI/CD (GitHub Actions)

- Every PR: build, token contrast check, unit tests, commitlint over every commit in the PR (hooks can be bypassed locally), and the drift check (`Parity`, a required check once the owner adds it to the ruleset).
- Merges to `main` keep every commit (merge or rebase, no squash), so each commit must be a valid Conventional Commit.
- On merge to `main`: semantic-release derives the version from the commits, sets it on every package, tags, publishes to npm with provenance, and deploys the Catalog to GitHub Pages.

## Milestones

1. **0.1**: tokens, foundations, `@grass-ds/css`, Reference Catalog (no Angular yet).
2. **0.2–0.x**: one component per release, each with its style layer CSS, Reference story, Angular directive or component and Angular story: 0.2 Angular foundations and Button, then TextField, Checkbox, Card and Dialog, then the drift check.
   - Focus ring composition (done in 0.2): the foundations focus ring is an outline plus an inner band drawn with `box-shadow`, so a component's own `box-shadow` would replace the band. The band is exposed as `--gr-focus-inner` (transparent unless the element itself has focus) and components must write `box-shadow: var(--gr-focus-inner), <own>`; a css test enforces it.
   - Dark elevation (done in 0.2): `elevation.overlay` is defined per theme; dark uses a stronger shadow plus a faint light edge.
   - TextField (done in 0.3): `.gr-text-field` on `input` and `textarea` with a `.gr-field` wrapper (`__label`, `__hint`, `__error`) tied by `for`/`id` and `aria-describedby`. Invalid is `aria-invalid="true"` only (never `:user-invalid`, which assistive technology is not told about); in Angular it comes from a `grInvalid` input (not `invalid`, which Signal Forms write into) or from a touched, invalid `NgControl`. TextField lives in the `@grass-ds/angular/text-field` entry point so `@angular/forms` stays an optional peer. Native-backed, so forms need no `ControlValueAccessor`.
   - Checkbox (done in 0.4): `.gr-checkbox` on `input[type=checkbox]` (`appearance: none`, CSS-drawn tick and dash), wrapped by `.gr-checkbox-label` so the whole label is the target; a group is a fieldset with a legend (`.gr-field-group`). The checked box keeps its strong border as the WCAG 1.4.11 boundary. In Angular, `indeterminate` is a model that sets the DOM property, and the directive lives in `@grass-ds/angular/checkbox` (anything importing `@angular/forms` goes in a secondary entry point).
   - Parity (0.4): `pnpm parity` (catalog/parity) renders Reference and Angular stories in Chromium and requires identical pixels; it is the base of the drift check.
   - Drift check (after 0.6): interaction states per story in `catalog/parity/states.mjs`, a coverage guard, parallel workers with one browser each, full-repaint screenshots and red diff images on failure; `Parity` becomes a required check.
   - Card (done in 0.5): the first composite. `.gr-card` goes on any element (the consumer picks article, section, div, li) with optional `__header`, `__title`, `__actions`, `__media`, `__body` and `__footer` parts styled by class (so the heading level is the consumer's); `data-variant` is outlined (default) or elevated; `data-query` makes it an opt-in query container. In Angular `<gr-card>` is an element in the root entry point (no forms) with attribute directives for the parts and no role or wrapper. Left out of 1.0: clickable or selectable cards, horizontal layout.
   - Dialog (done in 0.6): the second composite and the first with behaviour, all of it native (ADR 0005). `dialog.gr-dialog` opened with `showModal()` and named by `aria-labelledby` on `.gr-dialog__title` (the consumer picks the heading level), with optional `__header`, `__actions`, `__body` and `__footer` parts; `data-size` is sm, md (default) or lg; the body scrolls between a fixed header and footer; the footer can be a `<form method="dialog">` that returns a value; backdrop click is opt-in with `closedby="any"` (Chromium only for now, never the only way out); the page scroll lock is CSS (`html:has(.gr-dialog:modal)`); open and close are `@starting-style` plus `allow-discrete` transitions that collapse under reduced motion. In Angular `<gr-dialog>` wraps the native dialog (`open` model, `closed` output with the return value, `showModal()`/`close()`, part directives, `GR_DIALOG`) and adds no focus handling. Left out of 1.0: non-modal, drawers, nested dialogs, an alertdialog variant, a close icon.
3. **1.0** (done): all five components stable in Angular, and the public API frozen. What it promises is listed in [public-api.md](./public-api.md); the semver rules, the supported Angular versions and browsers, and the deprecation policy are in the README ([Versioning and support](../README.md#versioning-and-support)). 1.0 contains no code change from 0.6.0: it is the commitment, triggered by a commit with a `BREAKING CHANGE:` footer because the default commit-analyzer preset only reads that footer.

## Stability and support (from 1.0)

- **Public API**: semantic and component tokens, `.gr-*` classes with their `data-*`/ARIA hooks and the six `grass.*` layer names, and the exports of the three Angular entry points. Primitive tokens are internal and may change in a minor, so the reversible default holds: making something public later is a minor, narrowing it is a major.
- **Semver per artefact**: removing or renaming public API, changing a markup contract, dropping an Angular major or a browser is a major; new tokens, components, variants and inputs are a minor; fixes (accessibility and security included) are a patch or a minor. Visual tuning that keeps the contract and WCAG AA is a minor, listed in the release notes; a redesign is a major.
- **Deprecation**: deprecate in a minor, remove no earlier than the next major.
- **Angular**: peer range `^22.0.0` (CI tests 22.2.x; 22.0.0 was checked by hand for 1.0); a new major is added in a minor after the tests pass on it, with no promised date; dropping one is a major.
- **Browsers**: current evergreen, with a floor per component derived from feature support (README). The floor of an existing component never rises in a minor; a new component may need newer features (Popover, anchor positioning). CI verifies Chromium only; the rest is verified by hand, with results recorded in the README table: macOS Safari with VoiceOver passed on 2026-10-19; Safari on iOS, Firefox and NVDA are not yet verified, and forced colours only in Chromium.
- **One version for all three packages**, with caret peer ranges between them (`workspace:^`): a sibling may be one release behind, never ahead of the packages it depends on.

## Next (ideas only, nothing is committed)

- A React implementation (undecided; the markup contract and the `Parity` check were designed so a second implementation can be checked against the Reference).
- More components, as the need appears (non-modal dialog and drawers, Select, Tabs, Alert/Toast, clickable cards), each following the same path: tokens, style layer, Reference, Angular, interaction states.
- npm trusted publishing (OIDC) before January 2027 ([README](../README.md#january-2027-trusted-publishing)).
- A guard test that fails when a public token, class or exported symbol disappears (a snapshot of `docs/public-api.md`).
- A dev-mode warning for `aria-describedby`/`role` on `<gr-dialog>` in a 1.0.x patch, and forwarding inputs for them in 1.1.
- Move the Angular Storybook off the legacy webpack builder; an `@grass-ds/angular/button` subpath; semantic spacing tokens (and promoting `--gr-space-*`) when a need appears; a CI job on the Angular floor.
- More browsers in CI once Playwright can drive them reliably (Firefox, WebKit).

## Open points

- Manual checks still to do: Safari on iOS, Firefox, NVDA with Firefox, and forced colours on Windows (macOS Safari with VoiceOver passed). Results go in the README table; fixes land as patches.
- The decisions on the pre-1.0 questions are recorded in [public-api.md](./public-api.md#decisions-on-the-open-questions); the ones marked "later" are additive and can ship in 1.x.
