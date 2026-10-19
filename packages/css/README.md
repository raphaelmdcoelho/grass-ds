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

## Card

`.gr-card` goes on **any element**: use a `div`, an `article`, a `section` or an `li`, whichever the content means. Its parts are optional, in this order, each a class on any element (so the heading level is yours):

```html
<article class="gr-card" data-variant="elevated" aria-labelledby="plan-title">
  <div class="gr-card__header">
    <h3 class="gr-card__title" id="plan-title">Team plan</h3>
    <div class="gr-card__actions">
      <button class="gr-button" data-variant="secondary">Edit</button>
    </div>
  </div>
  <div class="gr-card__media"><img src="meadow.jpg" alt="" /></div>
  <div class="gr-card__body">...</div>
  <div class="gr-card__footer"><button class="gr-button">Choose plan</button></div>
</article>
```

- **`header` and `footer` elements**: use `div`s for the header and footer, as above. A `<header>` or `<footer>` that is not inside an `<article>`, `<section>` or `role="article"` becomes a **banner** or **contentinfo landmark**, and ten cards would add ten of each. Use the semantic elements only when the card itself is an `article`, a `section` or has `role="article"`.
- **Variants**: `data-variant="outlined"` (the default) or `"elevated"` (a soft shadow from the per-theme elevation token). Both keep the border, which is what shows in forced colours.
- **Layout**: the card is a flex column, so it works in `.gr-stack` and `.gr-grid`; the body takes the spare height, so footers line up across a grid row. The media is full width and rounded only at the card's corners (the card does not clip its content, so focus rings of controls inside are never cut off).
- **Query container**: add `data-query` to make the card a container for `@container` queries. It is opt-in because `container-type` makes the element a containing block for `position: fixed` descendants and a stacking context.
- **Accessibility**: put a heading in the header and pick its level for the page. A card has no role: add `role` (or use `article`/`section`) **only together with an accessible name** (`aria-labelledby` the title), because an unnamed region is noise for screen readers. Do not make the whole card a link or button, and do not nest interactive cards: put the actions in the header or footer. Text on the card is contrast-checked against `surface.raised` in both themes.
- **Not included, on purpose**: a clickable or selectable whole card (it needs a stretched-link or radio/checkbox pattern with its own focus and nesting rules), a horizontal layout (a media-beside-body variant: it needs container-driven rules and a second contract), and a muted subtitle part. They can be added without breaking this contract.

## Dialog

`dialog.gr-dialog` is a native `<dialog>` that you open with `showModal()`. It is **modal only**. The browser provides the top layer, the backdrop, making the page behind it inert, Escape, and moving focus in and back to the control that opened it, so this layer adds no script. Its parts are optional, in this order; the footer can be a `<form method="dialog">` to return a value.

```html
<button class="gr-button" id="open">Delete project</button>

<dialog class="gr-dialog" id="confirm" data-size="sm" aria-labelledby="confirm-title">
  <div class="gr-dialog__header">
    <h2 class="gr-dialog__title" id="confirm-title">Delete project?</h2>
  </div>
  <div class="gr-dialog__body">This permanently deletes "Meadow". This cannot be undone.</div>
  <form method="dialog" class="gr-dialog__footer">
    <button class="gr-button" data-variant="secondary" type="submit" value="cancel" autofocus>
      Cancel
    </button>
    <button class="gr-button" data-variant="danger" type="submit" value="delete">
      Delete project
    </button>
  </form>
</dialog>

<script>
  const dialog = document.getElementById('confirm');
  document.getElementById('open').addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'delete') deleteProject();
  });
</script>
```

- **Name (required)**: a dialog always has an accessible name: `aria-labelledby` pointing at the title, or `aria-label`. The heading level of `.gr-dialog__title` is yours to pick; it is styled by class.
- **Sizes**: `data-size="sm"`, `"md"` (the default) or `"lg"`. The width never exceeds the viewport minus the gutter, and the body scrolls (the header and footer stay in view) when the dialog is taller than the viewport.
- **Return value**: a `<form method="dialog">` closes the dialog when submitted and sets `dialog.returnValue` to the `value` of the submit button. Give the buttons `type="submit"` (`.gr-button` on a `<button>` without a `type` submits, but Angular's `grButton` defaults to `type="button"`, so be explicit in both). The form may wrap the body and the footer, as a direct child of the dialog, instead of being the footer itself. Browsers keep the previous `returnValue` when a dialog is closed without one (Escape, `close()`): reset it before opening if you rely on it (`dialog.returnValue = ''`).
- **Escape** closes the dialog (the native `cancel` and `close` events fire). Do not call `preventDefault()` on `cancel` without giving the user another way out.
- **Backdrop click** does not close the dialog unless you opt in with `closedby="any"`. `closedby` is not yet Baseline: Chromium-based browsers support it (134+), others ignore it and the dialog then closes only by Escape or its buttons, so never make a backdrop click the only way out. Leave the default (`closerequest`) alone; `closedby="none"` would remove Escape. The dialog has no padding of its own (its parts have), so if you add your own fallback, a click whose target is the dialog element itself is a click on the backdrop.
- **Initial focus**: the browser focuses the first focusable element, or the one marked `autofocus`. Put `autofocus` on the safe action in a destructive confirmation (Cancel) so that a stray Enter does not delete. In a dialog whose body scrolls, the scrolling body can be the first focusable element: put `autofocus` on the control you want instead, or on the title with `tabindex="-1"`.
- **Focus return**: closing returns focus to the element that was focused when `showModal()` ran. Open the dialog from a user action on a control, never on page load: a dialog nobody asked for is a dead end for a screen-reader user, and focus has nowhere to return to. If that control was removed, move focus yourself in the `close` handler.
- **Destructive confirmation**: say what will happen in the title (a question) and name the action on the button ("Delete project", not "OK" or "Yes"); use `data-variant="danger"` for it and keep Cancel next to it.
- **Enter in a form**: Enter in a field submits the form with its first submit button. Order the buttons accordingly and `autofocus` the least destructive one.
- **Layers**: the scroll lock is in the `grass.components` layer, so an unlayered `html { overflow: ... }` rule of your own overrides it.
- **Tested in**: Chromium in CI. Manual results for Firefox, Safari and screen readers are in the [support table](https://github.com/raphaelmdcoelho/grass-ds#versioning-and-support).
- **Scroll lock**: while a modal dialog is open the page does not scroll (`overflow: hidden` on `html`). The page's own scrollbar disappearing shifts it sideways by the scrollbar width on platforms with classic scrollbars; add `scrollbar-gutter: stable` to `html` if that matters to you.
- **Motion**: the dialog fades and slides in and out with `@starting-style` and `transition-behavior: allow-discrete` (`display` and the top-layer `overlay` transition too, so the exit is visible). Durations are tokens and collapse to 0 under `prefers-reduced-motion`.
- **Forced colours**: the backdrop and the shadow vanish, so the border (and the header and footer dividers) is drawn in `CanvasText`.
- **Not included, on purpose**: non-modal dialogs (`show()`, which needs positioning and focus rules of its own), drawers and side sheets, nested dialogs (a second `showModal()` works natively but has no designed stacking), `role="alertdialog"` (add it yourself on a confirmation if you want it announced as an alert; the styles do not change), and a close icon button (the library has no icons yet: use a text button in `.gr-dialog__actions` or the footer).

## Theming

The OS preference applies by default; force a theme with `data-theme="light"` or `data-theme="dark"` on the `<html>` element. Scoped themes are not supported.

## Focus ring

The focus ring is an outline plus an inner band drawn with `box-shadow`. Custom components built on this layer must write `box-shadow: var(--gr-focus-inner), <own shadow>` so the band is kept.

## Public API

Semver covers the `.gr-*` classes and their parts, the `data-*` and ARIA state hooks, the six `grass.*` layer names and their order, the documented custom properties (`--gr-focus-inner`, `--gr-stack-gap`, `--gr-cluster-gap`, `--gr-grid-gap`, `--gr-grid-min`, `--gr-container-gutter`) and the files in `exports` (`grass.css`, `fonts.css`, `fonts/*`). The whole list is in [docs/public-api.md](https://github.com/raphaelmdcoelho/grass-ds/blob/main/docs/public-api.md), and the rules in [Versioning and support](https://github.com/raphaelmdcoelho/grass-ds#versioning-and-support).

### Layout and text helpers

All of them are in the `grass.layout` or `grass.base` layer. Variants are data attributes.

- `.gr-container`: a centred column no wider than `--gr-layout-container`, with `--gr-container-gutter` at the sides; add `data-query` to make it a size container for `@container` queries.
- `.gr-stack`: vertical flow; `data-gap="tight"` or `"loose"` (`--gr-stack-gap`).
- `.gr-cluster`: a wrapping row; `data-gap`, `data-justify="end"` or `"between"`, `data-align="start"` (`--gr-cluster-gap`).
- `.gr-grid`: auto-fit columns of at least `--gr-grid-min` (default `16rem`); `data-gap`.
- `.gr-display`, `.gr-lead`, `.gr-text-small`, `.gr-text-muted`: text styles. `.gr-visually-hidden`: hidden visually, still announced.

All `@grass-ds/*` packages share one version, so upgrade them together.
