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

**Manual verification for 1.0** (by the owner, a 22-point checklist run on 2026-10-19; a cell that says "Not yet verified" has not been checked):

| Browser / assistive technology | Version      | Result           | Date       | Notes                                                                                                                                                                                                                                                     |
| ------------------------------ | ------------ | ---------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Safari (macOS)                 | not recorded | Pass             | 2026-10-19 | Reference and Angular stories, all 22 checks: Dialog, TextField, Checkbox, Button, Card. Forced colours / Windows contrast themes cannot run on macOS: they are verified only in Chromium (CI parity in forced-colours mode).                             |
| Safari (iOS)                   |              | Not yet verified |            |                                                                                                                                                                                                                                                           |
| Firefox                        |              | Not yet verified |            |                                                                                                                                                                                                                                                           |
| VoiceOver (Safari)             | not recorded | Pass             | 2026-10-19 | Same run as Safari (macOS): named dialog announced, focus returns to the opener, errors announced (pre-rendered as invalid, dynamic ones immediately through `role="alert"`), indeterminate announced as mixed, headings and no stray landmarks in cards. |
| NVDA (Firefox)                 |              | Not yet verified |            |                                                                                                                                                                                                                                                           |

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

Releases are automatic with semantic-release (see [ADR 0003](docs/adr/0003-publish-packages-to-npm.md)). Every push to `main` runs [`release.yml`](.github/workflows/release.yml): it derives the next version from the Conventional Commits since the last tag (merge commits such as "Merge pull request #1" are not conventional and are ignored), builds, sets that version on every package, publishes `@grass-ds/tokens`, `@grass-ds/css` and `@grass-ds/angular` to npm through trusted publishing, tags `vX.Y.Z` and creates the GitHub release. The private catalogs are never published. `@grass-ds/angular` is built by ng-packagr, so it publishes its `dist/` folder (`publishConfig.directory`); the version is therefore set on every package before the build, so that the generated `dist/package.json` carries it. The first publish of a new package name cannot use trusted publishing (a trusted publisher is configured on an existing package), so it needs the token fallback described below or a manual first publish. The history starts at `v0.0.0` on the first commit of `main` (semantic-release never creates that tag), and the project was versioned 0.x until the 1.0.0 release, which was triggered by a commit with a `BREAKING CHANGE:` footer even though no code broke: semantic-release's default preset only recognises that footer, not the `!` shorthand, so a major version needs one. A future major is triggered the same way, and the footer should say what actually breaks.

The Catalog is one site: the Reference Storybook at the root and the Angular Storybook at `/angular/`, assembled by `catalog/compose.mjs` into `catalog/site`. It is deployed to GitHub Pages by [`pages.yml`](.github/workflows/pages.yml) on every push to `main` (it documents `main`, so it does not wait for an npm release). The repository's Pages source must be set to "GitHub Actions". The site lives under `/grass-ds/`; Both Storybooks build with relative asset paths and the Reference lists the Angular one by a relative URL, so no base setting is needed.

### Trusted publishing (npm OIDC)

The release job publishes without a stored npm token. `pnpm -r publish` (pnpm 12) exchanges the job's GitHub OIDC token for a short-lived publish credential per package, and attaches provenance on its own for a public package from a public repository (see npm's [trusted publishing](https://docs.npmjs.com/trusted-publishers/) and pnpm's [`publish`](https://pnpm.io/cli/publish)). That is why `release.yml` has `id-token: write` and why `--provenance` is no longer passed. Requirements, all met: npm CLI 11.5.1 or later for npm's own flow (the Node 26 in `.nvmrc` ships npm 11.20), a cloud-hosted runner, and a trusted publisher on each package. pnpm does its own exchange and does not use npm for publishing.

How the pieces fit:

- **Trusted publisher** (npmjs.com, per package, set by the owner): provider GitHub Actions, user `raphaelmdcoelho`, repository `grass-ds`, workflow `release.yml`, environment `npm`. The environment is checked against the job's `environment: npm`, which `release.yml` declares; restrict that GitHub environment to the `main` branch and do not add required reviewers (releases are automatic).
- **Verify step**: `npm whoami` needs a token and says nothing about OIDC, so `verifyConditionsCmd` in `.releaserc.json` only checks that the job can request an OIDC token (`id-token: write`). Whether npm accepts the trusted publisher is only known at publish time.
- **Transition**: `release.yml` still passes the `NPM_TOKEN` secret as `NODE_AUTH_TOKEN`. pnpm tries OIDC first and uses the token only when OIDC does not apply, so the token does not defeat the purpose as long as it is deleted afterwards; with the secret deleted the value is empty and ignored. Because a silent fallback would hide a wrong trusted-publisher setting, the last step of the job (_Check how the release was authenticated_) reads the publisher npm recorded for each new version and raises a warning annotation unless it is `GitHub Actions <npm-oidc-no-reply@github.com>`. A publish through the token shows the owner's address instead, and carries no provenance.
- **A new trusted publisher expires** if it has not completed a successful publish within 2 days, so configure them right before merging the release that will use them, not weeks earlier.

#### Owner checklist (npmjs.com and GitHub; only the owner can do these)

Do the first four steps shortly before merging the first `fix`/`feat` that produces a release (within 2 days of it), and the last three after that release succeeded.

1. GitHub, Settings, Environments, New environment `npm`: deployment branches "Selected branches", add `main`. No required reviewers, no secrets.
2. npmjs.com, for **each** of `@grass-ds/tokens`, `@grass-ds/css`, `@grass-ds/angular`: package, Settings, Trusted publisher, GitHub Actions. Organization or user `raphaelmdcoelho`, repository `grass-ds`, workflow filename `release.yml` (the filename only, with the extension), environment name `npm`. npm does not validate the values when you save, mistakes only show at publish time. Existing entries cannot be edited, only deleted and recreated.
3. Keep the `NPM_TOKEN` secret until the first OIDC release is confirmed (it is the fallback, and the 2-day window means a failed attempt needs a quick retry).
4. Merge the release-producing PR, then check the run (below).
5. After the check passed: on npmjs.com, each package, Settings, Publishing access: "Require two-factor authentication and disallow tokens", save. (npm needs 2FA on the owner account for this.)
6. GitHub, Settings, Secrets and variables, Actions: delete `NPM_TOKEN`.
7. npmjs.com, Access tokens: revoke the old granular token.

#### Confirming the first OIDC release

After the release job runs on `main`:

1. The log of the **Release** step shows `pnpm -r publish` publishing the three packages with no "falling back"/OIDC warning, and the **Check how the release was authenticated** step prints `published by: GitHub Actions <npm-oidc-no-reply@github.com>` for all three with no warning annotation.
2. `npm view @grass-ds/css@X.Y.Z _npmUser dist.attestations` shows that publisher and an attestation, and each package's npm page shows the provenance and "Published via a trusted publisher" badge.
3. If a package was published with the token instead (warning annotation), fix its trusted publisher entry (step 2 above, it must be recreated if wrong) and let the next release prove it; do not delete the token yet.

If the release job fails after the tag was pushed (a rejected publish, a wrong trusted publisher), recover as below. With the token secret already deleted the publish fails closed; fix the trusted publisher entry first, then delete the tag and re-run.

### Token fallback and rotation (only while `NPM_TOKEN` exists)

Until the secret is deleted it is a granular npm access token with read and write access to the `@grass-ds` packages, written to the `.npmrc` that `actions/setup-node` creates (`registry-url`). npm limits how long write tokens live (90 days at the time of writing; see [About access tokens](https://docs.npmjs.com/about-access-tokens/)), and stops allowing granular tokens to publish in January 2027. Do not rotate it for its own sake: finish the checklist above and remove it. If it has to be replaced in the meantime, create a new granular token with read and write on the `@grass-ds` packages, replace the secret, and revoke the old one.

### Recovering from a failed release

semantic-release pushes the `vX.Y.Z` tag **before** it publishes. If the job fails after that point (for example a publish error), re-running it does nothing: the tag already exists, so semantic-release sees nothing new to release. Delete the tag first, then re-run the failed job:

```sh
git push origin :refs/tags/vX.Y.Z
```

`pnpm -r publish` skips versions that are already on npm, so a partly completed publish (one package out, one not) recovers the same way. If a GitHub release was already created for the tag, delete it as well.

## Licence

MIT. Figtree is distributed under the SIL Open Font License 1.1.
