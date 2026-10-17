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

Variants and states are expressed with data and ARIA attributes (`data-variant`, `disabled`, `aria-disabled="true"`, `aria-invalid="true"`).

## TextField

`.gr-text-field` styles `<input>` (`text`, `email`, `password`, `search`, `url`, `tel`, `number`) and `<textarea>`. Wrap the control with its label, hint and error in `.gr-field`:

```html
<div class="gr-field">
  <label class="gr-field__label" for="email">Email</label>
  <p class="gr-field__hint" id="email-hint">We only use it to sign you in.</p>
  <input
    class="gr-text-field"
    id="email"
    type="email"
    aria-describedby="email-hint email-error"
    aria-invalid="true"
  />
  <p class="gr-field__error" id="email-error">Enter an address like name@example.com.</p>
</div>
```

- **The label is required** and tied to the control with `for`/`id`. A placeholder is not a label.
- **Hint and error** are optional. Give each an `id` and list them in the control's `aria-describedby` (omit the error id while there is no error), so a screen reader reads them with the field. The wrapper only lays them out.
- **Invalid** is `aria-invalid="true"`, set by your application together with the error message. The CSS deliberately does not use `:user-invalid`: it would colour a field that assistive technology was never told was invalid. Invalid is also shown by an inner edge, not by colour alone.
- **Announce a dynamic error.** An error added after the page loaded (on blur, on submit) is announced only if its element is a live region: insert it with `role="alert"` (and set `aria-invalid` and the `aria-describedby` entry at the same time). An error that is already in the markup on load must **not** have `role="alert"`.
- **Disabled and read-only** are the native `disabled` and `readonly` attributes. A read-only field that is also invalid shows the invalid border.
- **Forced colours**: fills are dropped, so invalid gets a thicker border and read-only a dashed one. Autofilled fields keep the theme's colours.

## Checkbox

`.gr-checkbox` styles `<input type="checkbox">` (the native control with `appearance: none`; the tick and dash are drawn in CSS and scale with the size token). The label **wraps** the input in `.gr-checkbox-label`, so the whole label is the click target (and meets the 24px target size):

```html
<div class="gr-field">
  <label class="gr-checkbox-label">
    <input class="gr-checkbox" type="checkbox" aria-describedby="terms-hint terms-error" />
    <span>Accept the terms</span>
  </label>
  <p class="gr-field__hint" id="terms-hint">You can withdraw at any time.</p>
  <p class="gr-field__error" id="terms-error">Accept the terms to continue.</p>
</div>
```

A group of related checkboxes is a **field group**: a `fieldset` with a `legend`, each checkbox in its own `.gr-field`. Describe the group with `aria-describedby` on the fieldset:

```html
<fieldset class="gr-field-group" aria-describedby="topics-hint">
  <legend class="gr-field-group__legend">Topics</legend>
  <p class="gr-field__hint" id="topics-hint">Choose any that apply.</p>
  <div class="gr-field">
    <label class="gr-checkbox-label"
      ><input class="gr-checkbox" type="checkbox" /><span>Design tokens</span></label
    >
  </div>
</fieldset>
```

- **States** are native or ARIA: `:checked`, the `indeterminate` DOM property (it has no attribute, so set `input.indeterminate = true`; the browser clears it when the user toggles), `disabled`, and `aria-invalid="true"` set by your application with the error message (an inner edge shows it, not colour alone). Error announcement rules are the same as for TextField.
- **Contrast**: the checked fill is not enough on its own to meet 3:1 on white, so the box keeps its strong border when checked; the border and the mark are contrast-checked in both themes.
- **Forced colours** use system colours (`Field`, `Highlight`, `HighlightText`) so an empty box, a tick and a dash stay distinct.

## Theming

The OS preference applies by default; force a theme with `data-theme="light"` or `data-theme="dark"` on the `<html>` element. Scoped themes are not supported.

## Focus ring

The focus ring is an outline plus an inner band drawn with `box-shadow`. Custom components built on this layer must write `box-shadow: var(--gr-focus-inner), <own shadow>` so the band is kept.

All `@grass-ds/*` packages share one version, so upgrade them together.
