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

Or link `node_modules/@grass-ds/tokens/dist/tokens.css` from your bundler or `angular.json`.

## Theming

There are two themes, light and dark. The OS preference (`prefers-color-scheme`) applies by default. Force a theme with `data-theme="light"` or `data-theme="dark"` on the `<html>` element:

```html
<html data-theme="dark"></html>
```

Themes switch only on `<html>`; per-subtree themes are not supported. Only semantic tokens change between themes, and the build fails if a foreground/background pair misses WCAG 2.2 AA.

All `@grass-ds/*` packages share one version, so upgrade them together.
