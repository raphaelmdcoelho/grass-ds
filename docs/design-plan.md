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
- Themes: light and dark only. The OS preference (`prefers-color-scheme`) applies by default, and `data-theme="light|dark"` on `<html>` forces a theme.
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

- One Storybook site, run locally and published to GitHub Pages. It composes a framework-free Reference Storybook (`@storybook/html`) with the Angular Storybook ([ADR 0006](./adr/0006-catalog-composes-reference-and-implementation-storybooks.md)).
- Drift check: Playwright visual snapshots compare Angular stories with the matching Reference stories in both themes. Added once the v1 components exist.

## Repo & tooling

- pnpm workspaces with plain `pnpm -r` scripts, no task runner (add Turborepo only if builds get slow).
- Node 26 (installed via nvm; becomes LTS in late October 2026), pinned in `.nvmrc` and `engines`. pnpm pinned through the `packageManager` field and activated with Corepack, which Node 25+ no longer bundles (`npm install -g corepack`).
- Public GitHub repo, MIT licence (Figtree keeps its OFL licence).
- Husky:
  - `commit-msg`: commitlint with Conventional Commits, scopes `tokens|css|angular|catalog|repo`.
  - `pre-commit`: lint-staged running Prettier, Stylelint and ESLint on staged files.

## CI/CD (GitHub Actions)

- Every PR: build, token contrast check, unit tests, commitlint over every commit in the PR (hooks can be bypassed locally), and later the drift check.
- Merges to `main` keep every commit (merge or rebase, no squash), so each commit must be a valid Conventional Commit.
- On merge to `main`: semantic-release derives the version from the commits, sets it on every package, tags, publishes to npm with provenance, and deploys the Catalog to GitHub Pages.

## Milestones

1. **0.1**: tokens, foundations, `@grass-ds/css`, Reference Catalog (no Angular yet).
2. **0.2–0.x**: Angular Button, TextField, Checkbox, Card, Dialog, then the drift check.
3. **1.0**: all five components stable in Angular.

## Open points

- The npm org `@grass-ds` still needs to be created on npmjs.com.
