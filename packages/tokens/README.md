# @grass-ds/tokens

Design tokens of the Grass Design System: the [W3C DTCG](https://www.designtokens.org/) JSON source and the generated CSS custom properties (`--gr-*`). Every other package takes its values from here.

Browse them in the [Catalog](https://raphaelmdcoelho.github.io/grass-ds/).

## Install

```sh
npm install @grass-ds/tokens
```

## Use

Load the stylesheet once, before `@grass-ds/css` (it declares the `grass.tokens` cascade layer first):

```css
@import '@grass-ds/tokens/tokens.css';
@import '@grass-ds/css/fonts.css'; /* optional: self-hosted Figtree */
@import '@grass-ds/css/grass.css';
```

In `angular.json` use the specifier too: `"styles": ["@grass-ds/tokens/tokens.css", ...]`. Without a bundler, link `node_modules/@grass-ds/tokens/dist/tokens.css` (the file behind that export).

## Theming

There are two themes, light and dark. The OS preference (`prefers-color-scheme`) applies by default. Force a theme with `data-theme="light"` or `data-theme="dark"` on the `<html>` element:

```html
<html data-theme="dark"></html>
```

Themes switch only on `<html>`; per-subtree themes are not supported. Only semantic tokens change between themes, and the build fails if a foreground/background pair misses WCAG 2.2 AA.

## Public API

Semver covers the **semantic** tokens (`--gr-color-*`, `--gr-text-*`, `--gr-layout-*`, `--gr-radius-*`, `--gr-motion-*`, ...) and the **component** tokens (`--gr-button-*`, `--gr-text-field-*`, `--gr-checkbox-*`, `--gr-card-*`, `--gr-dialog-*`): their names and roles are stable, their values are tuned in minor releases, and a semantic colour always keeps WCAG AA contrast. **Primitive** tokens (`--gr-palette-*`, `--gr-space-*`, `--gr-font-*`, ...) are internal and may change in a minor release; build on the semantic tier. The full list is in [docs/public-api.md](https://github.com/raphaelmdcoelho/grass-ds/blob/main/docs/public-api.md), and the rules in [Versioning and support](https://github.com/raphaelmdcoelho/grass-ds#versioning-and-support).

All `@grass-ds/*` packages share one version, so upgrade them together.
