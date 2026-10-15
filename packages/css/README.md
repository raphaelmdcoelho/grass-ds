# @grass-ds/css

The framework-agnostic style layer of the Grass Design System: foundations (reset, typography, colour, layout utilities) and component CSS such as `.gr-button`. Everything sits in `@layer grass.*`, so your own CSS always wins. Appearance comes from [`@grass-ds/tokens`](https://www.npmjs.com/package/@grass-ds/tokens), a peer dependency.

Browse every component, theme and state in the [Catalog](https://raphaelmdcoelho.github.io/grass-ds/).

## Install

```sh
npm install @grass-ds/css @grass-ds/tokens
```

## Use

Import order matters: tokens first, then the optional fonts, then the style layer.

```css
@import '@grass-ds/tokens/tokens.css';
@import '@grass-ds/css/fonts.css'; /* optional: self-hosted Figtree */
@import '@grass-ds/css/grass.css';
```

```html
<button class="gr-button">Save</button>
<button class="gr-button" data-variant="secondary">Cancel</button>
<a class="gr-button" data-variant="danger" href="/delete">Delete</a>
```

Variants and states are expressed with data and ARIA attributes (`data-variant`, `disabled`, `aria-disabled="true"`).

## Theming

The OS preference applies by default; force a theme with `data-theme="light"` or `data-theme="dark"` on the `<html>` element. Scoped themes are not supported.

## Focus ring

The focus ring is an outline plus an inner band drawn with `box-shadow`. Custom components built on this layer must write `box-shadow: var(--gr-focus-inner), <own shadow>` so the band is kept.

All `@grass-ds/*` packages share one version, so upgrade them together.
