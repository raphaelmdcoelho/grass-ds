# grass-ds

A grass-inspired design system: one set of design tokens, a framework-agnostic CSS style layer built on them, and an Angular implementation. **Status: 1.0, stable.** The public API is frozen under semver (see [Versioning and support](#versioning-and-support) and [docs/public-api.md](docs/public-api.md)).

Browse every component, theme and state in the **[Catalog](https://raphaelmdcoelho.github.io/grass-ds/)** (Reference at the root, Angular under `/angular/`). The vocabulary is in [CONTEXT.md](CONTEXT.md) and the plan in [docs/design-plan.md](docs/design-plan.md).

| Package                                 | What it is                                                                              | npm                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`@grass-ds/tokens`](packages/tokens)   | DTCG token source, compiled to `--gr-*` CSS custom properties (light/dark)              | [npm](https://www.npmjs.com/package/@grass-ds/tokens)  |
| [`@grass-ds/css`](packages/css)         | Foundations and component CSS (`.gr-*`), optional self-hosted Figtree                   | [npm](https://www.npmjs.com/package/@grass-ds/css)     |
| [`@grass-ds/angular`](packages/angular) | Angular components: `grButton`, `grTextField`, `grCheckbox`, `<gr-card>`, `<gr-dialog>` | [npm](https://www.npmjs.com/package/@grass-ds/angular) |

Components in 1.0: Button, TextField, Checkbox, Card, Dialog. All three packages share one version number: install and upgrade them together.

## Quick start: CSS only

```sh
npm install @grass-ds/css @grass-ds/tokens
```

Load the stylesheets in this order: tokens, then the optional fonts, then the style layer. In a bundler (Vite, esbuild, webpack...) import them from a CSS file:

```css
@import '@grass-ds/tokens/tokens.css';
@import '@grass-ds/css/fonts.css'; /* optional: self-hosted Figtree */
@import '@grass-ds/css/grass.css';
```

Without a bundler, serve the files and link them (these `dist/` paths are the files behind the package `exports`, so they are public API):

```html
<link rel="stylesheet" href="/node_modules/@grass-ds/tokens/dist/tokens.css" />
<link rel="stylesheet" href="/node_modules/@grass-ds/css/dist/fonts.css" />
<link rel="stylesheet" href="/node_modules/@grass-ds/css/dist/grass.css" />

<main class="gr-container gr-stack">
  <h1>Hello, meadow</h1>
  <div class="gr-cluster">
    <button class="gr-button">Save</button>
    <button class="gr-button" data-variant="secondary">Cancel</button>
  </div>
</main>
```

The markup of every component (TextField, Checkbox, Card, Dialog...) is in the [`@grass-ds/css` README](packages/css/README.md).

## Quick start: Angular

Angular 22 (`^22.0.0`). In a new app (`npx @angular/cli@22 new my-app`, accept the defaults):

```sh
cd my-app
npm install @grass-ds/angular @grass-ds/css @grass-ds/tokens
```

Replace `src/styles.css` with the three imports, so the styles load once:

```css
@import '@grass-ds/tokens/tokens.css';
@import '@grass-ds/css/fonts.css'; /* optional: self-hosted Figtree */
@import '@grass-ds/css/grass.css';
```

Replace `src/app/app.ts` (and delete `app.html`, `app.css` and `app.spec.ts`, which the new component does not use):

```ts
import { Component } from '@angular/core';
import { GrButton } from '@grass-ds/angular';

@Component({
  selector: 'app-root',
  imports: [GrButton],
  template: `
    <main class="gr-container gr-stack">
      <h1>Hello, meadow</h1>
      <div class="gr-cluster">
        <button grButton>Save</button>
        <button grButton variant="secondary">Cancel</button>
      </div>
    </main>
  `,
})
export class App {}
```

Then `npx ng serve`. The Card and Dialog (`GR_CARD`, `GR_DIALOG`) come from the same root entry. The TextField and Checkbox live in `@grass-ds/angular/text-field` and `@grass-ds/angular/checkbox` because they use `@angular/forms`. All inputs, outputs and accessibility notes are in the [`@grass-ds/angular` README](packages/angular/README.md).

## Themes

Light and dark. The OS preference applies by default; force one with `data-theme="light"` or `data-theme="dark"` on `<html>`. Scoped (per-subtree) themes are not supported.

## Versioning and support

The three packages are released together under one [semver](https://semver.org/) version, from the Conventional Commits on `main`. What the version number promises is the **public API**, listed per package in [docs/public-api.md](docs/public-api.md). Anything not listed there is internal.

### What each kind of release may contain

|                                                                                                                                                       | Patch (`1.0.x`) | Minor (`1.x.0`)                  | Major (`x.0.0`) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------- | --------------- |
| Bug fixes that make the documented behaviour true (including accessibility and security fixes)                                                        | yes             | yes                              | yes             |
| New tokens, classes, variants, components, inputs, entry points                                                                                       | no              | yes                              | yes             |
| Visual tweaks to existing components: values of tokens, spacing, radii, shades (same intent, still WCAG AA)                                           | no              | yes, listed in the release notes | yes             |
| Deprecating something                                                                                                                                 | no              | yes                              | yes             |
| Removing or renaming a public token, class, `data-*`/ARIA hook, `@layer` name, selector, input, output, model, method, exported symbol or entry point | no              | no                               | yes             |
| Changing a markup contract (an element, class or attribute a component renders, or the order of its parts)                                            | no              | no                               | yes             |
| Changing the meaning of a semantic token (a token stays the same role) or removing a theme                                                            | no              | no                               | yes             |
| Making a pair in `contrast.json` (the semantic text, control and focus pairs) fall below WCAG 2.2 AA                                                  | no              | no                               | no              |
| Dropping a supported Angular major or browser                                                                                                         | no              | no                               | yes             |

- **Tokens** (`@grass-ds/tokens`): the semantic and component custom properties are public; primitive tokens (`--gr-palette-*`, `--gr-space-*`...) are not and may change in a minor release. A token keeps its name and role; its value may be tuned in a minor. The 22 tokens no component uses yet (most `--gr-color-feedback-*`, `--gr-motion-duration-slow`, `--gr-motion-easing-enter`/`-exit`) are provisional until one does.
- **CSS** (`@grass-ds/css`): public are the `.gr-*` classes, their parts and `data-*`/ARIA state hooks, the six `grass.*` layer names and order, the files in `exports` and the documented hooks. Selectors outside `.gr-*` and internal custom properties are not.
- **Angular** (`@grass-ds/angular`): public are the exports of the three entry points (`.`, `./text-field`, `./checkbox`), their selectors, inputs, outputs, models and methods. Members marked `private`/`protected` in the typings and the generated `ɵ` fields are not.
- **Visual changes** are not breaking as long as they keep the markup contract and the contrast guarantee: a green that shifts a few points, a radius from 8px to 10px. A _redesign_ (a different palette, a different component shape) is a major. A fix that changes the output because the old output was wrong (focus not visible, a missing label, a failed contrast pair) is a patch or a minor, never held for a major.
- **Deprecation**: a feature is deprecated in a minor release (`@deprecated` in the typings, a note in the README and the release notes, and a comment in the CSS) and removed no earlier than the next major. It keeps working until then.
- **Shared version**: every release bumps all three packages to the same number, even one with no change of its own. The peer dependencies between them are caret ranges (`@grass-ds/css` 1.2.0 requires `@grass-ds/tokens ^1.2.0`, `@grass-ds/angular` 1.2.0 requires `@grass-ds/css ^1.2.0`), so a package may be one release behind a sibling (updating `@grass-ds/tokens` alone is fine), but never ahead of the packages it depends on. Update all three together (tokens first if you do it one by one).

### Supported Angular versions

`@grass-ds/angular` has peer ranges `@angular/core ^22.0.0` (and an optional `@angular/forms ^22.0.0`). A new Angular major is added to the range in a **minor** release after the components pass their tests on it; no date is promised. Dropping an Angular major from the range is a **major** release. The components use standalone components, signal inputs, `OnPush` and work without zone.js. **What is tested:** CI builds and tests against Angular 22.2.x. The `^22.0.0` floor was checked once, by hand, for 1.0 (a new app pinned to Angular 22.0.0 builds every example of the Angular README and opens and closes a Dialog), but it is not in CI.

### Supported browsers

The current versions of Chrome, Edge, Firefox and Safari (desktop and mobile). The floor is **per component**, derived from the support data of the CSS features each one uses (not tested by this project):

| Part                                 | Needs                                                                                      | Floor                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Foundations, Button, TextField, Card | cascade layers, native CSS nesting, `oklch()`, `lh` unit, container queries (Card, opt-in) | Chrome/Edge 120, Firefox 120, Safari 17.2 |
| Checkbox                             | the above plus `:has()`                                                                    | Chrome/Edge 120, Firefox 121, Safari 17.2 |
| Dialog                               | the above plus `@starting-style` and `transition-behavior: allow-discrete`                 | Chrome/Edge 120, Firefox 129, Safari 17.5 |

One stylesheet serves all of them, so for the whole of 1.0 read the highest row: **Chrome and Edge 120, Firefox 129, Safari 17.5**.

The rule: **the floor of an existing component never rises in a minor release.** A new component may need newer features (the plan uses the Popover API and CSS anchor positioning for later components, [ADR 0005](docs/adr/0005-web-platform-first-for-behaviour.md)); it states its own floor and degrades gracefully where it can, and a minor release that adds it does not change the floors above. Raising the floor of an existing component is a major release. Features that are not yet Baseline are progressive: for instance, backdrop click on a Dialog (`closedby="any"`) only works where the browser supports it, and is never the only way to close it. Server-side rendering and hydration are neither promised nor tested.

| Where                  | What is checked                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CI, every pull request | Chromium only: the Reference and Angular Catalog are rendered in light, dark and forced-colours modes, pixel for pixel and by accessibility tree (see `catalog/parity`), plus unit tests and the WCAG AA contrast check of the semantic colours. |
| By hand, for 1.0       | See the table below.                                                                                                                                                                                                                             |

**Manual verification for 1.0** (to be filled in from the owner's checklist; an empty cell is not verified):

| Browser / assistive technology | Version | Result | Date | Notes |
| ------------------------------ | ------- | ------ | ---- | ----- |
| Safari (macOS)                 |         |        |      |       |
| Safari (iOS)                   |         |        |      |       |
| Firefox                        |         |        |      |       |
| VoiceOver (Safari)             |         |        |      |       |
| NVDA (Firefox)                 |         |        |      |       |

Browser and assistive-technology problems found later are bug fixes (patch or minor), not breaking changes.

## Development

Node 26 (`nvm use`) and pnpm (`corepack enable`; Node 25+ no longer bundles Corepack: `npm install -g corepack`).

```sh
pnpm install
pnpm build            # tokens, then css
pnpm lint
pnpm check:contrast   # WCAG AA check of semantic colour pairs
pnpm test
pnpm storybook        # Reference Catalog on http://localhost:6006
pnpm build:catalog
pnpm parity           # drift check: Reference vs Angular, needs build:catalog and a Chromium
```

Commits follow Conventional Commits with scopes `tokens|css|angular|catalog|repo|deps|release`.

## Status line

The committed Claude Code status line (`.claude/statusline.sh`) needs `jq` on the PATH.

## Conventions

- **Themes** switch only through `data-theme="light|dark"` on `<html>` (absent means follow the OS). Scoped themes on a subtree are not supported: component tokens resolve their `var()` references at `:root`.
- **Units** are `rem`, so the system follows the user's font size: 4px is `0.25rem` at the default size (`space.1`).
- **Token format** is W3C DTCG with mixed value forms: colours in the structured object form (OKLCH), dimensions as strings. See [ADR 0002](docs/adr/0002-w3c-dtcg-json-as-token-source.md).
- **Drift check**: every `Components/*` story must exist in both the Reference and the Angular Storybook with the same id, and declare its interaction states in [`catalog/parity/states.mjs`](catalog/parity/states.mjs) (`[]` for first paint only). The `Parity` job fails otherwise; see [its README](catalog/parity/README.md).
- **`.gr-container`** is not a size container by default; add `data-query` when children use `@container` queries.

## Releasing

Releases are automatic with semantic-release (see [ADR 0003](docs/adr/0003-publish-packages-to-npm.md)). Every push to `main` runs [`release.yml`](.github/workflows/release.yml): it derives the next version from the Conventional Commits since the last tag (merge commits such as "Merge pull request #1" are not conventional and are ignored), builds, sets that version on every package, publishes `@grass-ds/tokens`, `@grass-ds/css` and `@grass-ds/angular` to npm with provenance, tags `vX.Y.Z` and creates the GitHub release. The private catalogs are never published. `@grass-ds/angular` is built by ng-packagr, so it publishes its `dist/` folder (`publishConfig.directory`); the version is therefore set on every package before the build, so that the generated `dist/package.json` carries it. The first publish of a new package needs a token that may create packages in the `@grass-ds` scope, which the granular `NPM_TOKEN` below must allow. The history starts at `v0.0.0` on the first commit of `main` (semantic-release never creates that tag), and the project was versioned 0.x until the 1.0.0 release, which was triggered by a commit with a `BREAKING CHANGE:` footer even though no code broke: semantic-release's default preset only recognises that footer, not the `!` shorthand, so a major version needs one. A future major is triggered the same way, and the footer should say what actually breaks.

The Catalog is one site: the Reference Storybook at the root and the Angular Storybook at `/angular/`, assembled by `catalog/compose.mjs` into `catalog/site`. It is deployed to GitHub Pages by [`pages.yml`](.github/workflows/pages.yml) on every push to `main` (it documents `main`, so it does not wait for an npm release). The repository's Pages source must be set to "GitHub Actions". The site lives under `/grass-ds/`; Both Storybooks build with relative asset paths and the Reference lists the Angular one by a relative URL, so no base setting is needed.

### npm token rotation

Publishing uses the repository secret `NPM_TOKEN`, a granular npm access token with read and write access to the `@grass-ds` packages. It is exposed to `semantic-release` as `NODE_AUTH_TOKEN`, and the `.npmrc` that reads it is written by `actions/setup-node` through `registry-url`. npm limits how long write tokens live (90 days at the time of writing; see [About access tokens](https://docs.npmjs.com/about-access-tokens/) for the current rule), so rotate it before it expires:

1. On npmjs.com, create a new granular access token with read and write permission on the `@grass-ds` packages and the longest expiry npm allows.
2. Replace the `NPM_TOKEN` secret under Settings, Secrets and variables, Actions.
3. Revoke the old token and put the next expiry date in your calendar.

A bad or expired token is caught before anything is tagged: `verifyConditionsCmd` in `.releaserc.json` runs `npm whoami` with the same `NODE_AUTH_TOKEN`, so the release job fails at the start and no tag is created.

### Recovering from a failed release

semantic-release pushes the `vX.Y.Z` tag **before** it publishes. If the job fails after that point (for example a publish error), re-running it does nothing: the tag already exists, so semantic-release sees nothing new to release. Delete the tag first, then re-run the failed job:

```sh
git push origin :refs/tags/vX.Y.Z
```

`pnpm -r publish` skips versions that are already on npm, so a partly completed publish (one package out, one not) recovers the same way. If a GitHub release was already created for the tag, delete it as well.

### January 2027: trusted publishing

npm has announced that it removes direct publishing with access tokens in January 2027 (see the [npm documentation](https://docs.npmjs.com/about-access-tokens/) for the exact scope and date). After that, CI has to publish through trusted publishing (OIDC), or through the stage-only token plus `npm stage approve` flow. The release workflow already requests `id-token: write` and publishes with `--provenance`, so the move to [trusted publishing](https://docs.npmjs.com/trusted-publishers/) is small:

1. Follow the npm documentation to add a trusted publisher to each package: provider GitHub Actions, repository `raphaelmdcoelho/grass-ds`, workflow `release.yml`. npm may require the package to exist before one can be configured; if so, publish the first version with the token.
2. In `release.yml`, remove the `NODE_AUTH_TOKEN` line and keep `registry-url`. npm then exchanges the job's OIDC token for a short-lived publish credential, which needs a recent npm (the documentation states the minimum; the Node 26 pinned in `.nvmrc` ships npm 11).
3. Replace `verifyConditionsCmd` (`npm whoami` does not work with OIDC) or drop it.
4. Delete the `NPM_TOKEN` secret and revoke the token.

## Licence

MIT. Figtree is distributed under the SIL Open Font License 1.1.
