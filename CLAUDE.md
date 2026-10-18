# grass-ds

A grass-inspired design system: one DTCG token source feeds a framework-agnostic CSS style layer and framework implementations (Angular today). pnpm workspace, ESM, Node >= 26 (`.nvmrc`), pnpm 12.

Read [CONTEXT.md](CONTEXT.md) first: it is the glossary (Token tiers, Style layer, Composite, Reference, Implementation, Markup contract, Catalog…). Use those terms, and avoid the words each entry lists under _Avoid_. Design decisions live in [docs/adr](docs/adr) and the plan in [docs/design-plan.md](docs/design-plan.md).

## Layout

- `packages/tokens` (`@grass-ds/tokens`): DTCG JSON token source, built with style-dictionary into `--gr-*` CSS properties. Also `check:contrast` (WCAG AA on semantic colour pairs).
- `packages/css` (`@grass-ds/css`): foundations (`reset`, `base`, `layout`, `utilities`, `layers`) and one CSS file per component in `src/`.
- `packages/angular` (`@grass-ds/angular`): Angular implementation, built with ng-packagr (publishes `dist/`). Secondary entry points per component (`checkbox/`, `text-field/`…).
- `catalog/reference`: Reference Storybook (plain HTML + style layer). `catalog/angular`: Angular Storybook. `catalog/compose.mjs` merges both into `catalog/site`. `catalog/parity`: checks implementations against the Reference markup contract.

Build order matters: tokens, then css, then angular.

## Commands

```sh
pnpm install
pnpm build            # all packages, in dependency order
pnpm test             # per-package tests (node --test for tokens/css, ng test for angular)
pnpm lint             # eslint + stylelint + prettier --check
pnpm format           # prettier --write
pnpm check:contrast
pnpm storybook        # builds, then Reference on :6006 (and Angular)
pnpm build:catalog
pnpm parity
```

Single package: `pnpm --filter @grass-ds/css run test`.

## Conventions

- Tokens have three tiers: primitive, semantic (the only tier that differs per theme), component. The style layer uses semantic/component tokens, never primitives. Nothing downstream defines its own token values.
- Themes: only `data-theme="light|dark"` on `<html>` (absent follows the OS). No scoped themes.
- Units are `rem`.
- Native-backed components are attributes on the native element (`<button grButton>`); only composites (Card, Dialog) are custom elements (`<gr-card>`) ([ADR 0004](docs/adr/0004-attribute-selectors-on-native-elements.md)).
- Behaviour uses the web platform (`<dialog>`, Popover, anchor positioning), not Angular CDK ([ADR 0005](docs/adr/0005-web-platform-first-for-behaviour.md)). Implementations own behaviour, never appearance.
- A new or changed component must keep the Reference, the style layer and every implementation on the same markup contract; add stories in both catalogs, and declare their interaction states in `catalog/parity/states.mjs` (the `Parity` check fails on a story with no entry).
- Class prefix `.gr-`, CSS property prefix `--gr-`.
- Commits: Conventional Commits, scopes `tokens|css|angular|catalog|repo|deps|release` (commitlint + husky + lint-staged enforce this and formatting).
- Releases are automated by semantic-release on push to `main`; never hand-edit versions or tags. See README for npm token and failed-release recovery.
- `.claude/statusline.sh` needs `jq`.
