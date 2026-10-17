# @grass-ds/angular

Angular implementation of the Grass Design System. Components are standalone attribute components on native elements (`<button grButton>`), styled entirely by [`@grass-ds/css`](https://www.npmjs.com/package/@grass-ds/css); this package owns behaviour, never appearance.

## Install

```sh
npm install @grass-ds/angular @grass-ds/css @grass-ds/tokens
```

`@grass-ds/css` and `@angular/core` are peer dependencies. `@angular/forms` is an optional one, needed only by the entry points that touch forms (`@grass-ds/angular/text-field`, `@grass-ds/angular/checkbox`); an app created without it needs `npm install @angular/forms` before using them. Load the stylesheets once, for example in `angular.json` `styles`:

```json
[
  "node_modules/@grass-ds/tokens/dist/tokens.css",
  "node_modules/@grass-ds/css/dist/fonts.css",
  "node_modules/@grass-ds/css/dist/grass.css"
]
```

`fonts.css` is optional. All packages share one version, so upgrade them together.

## Button

```ts
import { GrButton } from '@grass-ds/angular';

@Component({
  imports: [GrButton],
  template: `
    <button grButton>Save</button>
    <button grButton variant="secondary">Cancel</button>
    <button grButton variant="danger" [disabled]="busy()">Delete</button>
    <a grButton href="/docs">Docs</a>
  `,
})
export class Example {}
```

| Input      | Type                                   | Default     | Notes                                                                     |
| ---------- | -------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Rendered as `data-variant`.                                               |
| `disabled` | `boolean`                              | `false`     | Native `disabled` on `<button>`; `aria-disabled="true"` on `<a>` (below). |

- **`type`**: `<button grButton>` defaults to `type="button"` (as in the Reference), so it does not submit a form by accident. Write `type="submit"` or `type="reset"` statically to override it.
- **Disabled links**: a disabled `<a grButton>` keeps its `href` but gets `aria-disabled="true"` and stays focusable. Click, Ctrl-click, middle-click and Enter are cancelled before any `(click)` handler runs, so handlers never fire while it is disabled.
- **Use the `disabled` input.** An `aria-disabled` or `type` written statically in the template is kept, but do not bind `[attr.aria-disabled]` or `[attr.type]` on the same element: the component owns those attributes.

## TextField

`@angular/forms` is an **optional** peer dependency: it is needed only by this entry point. `GrButton` comes from the package root, which never imports it, so a Button-only app does not need `@angular/forms` installed. Import the TextField from its own entry point:

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GrTextField } from '@grass-ds/angular/text-field';

@Component({
  selector: 'app-example',
  imports: [GrTextField, ReactiveFormsModule],
  template: `
    <div class="gr-field">
      <label class="gr-field__label" for="email">Email</label>
      <p class="gr-field__hint" id="email-hint">We only use it to sign you in.</p>
      <input
        grTextField
        id="email"
        type="email"
        [formControl]="email"
        [attr.aria-describedby]="showError() ? 'email-hint email-error' : 'email-hint'"
      />
      @if (showError()) {
        <p class="gr-field__error" id="email-error" role="alert">
          Enter an address like name@example.com.
        </p>
      }
    </div>
  `,
})
export class Example {
  readonly email = new FormControl('', [Validators.required, Validators.email]);
  protected showError = () => this.email.touched && this.email.invalid;
}
```

`<input grTextField>` and `<textarea grTextField>` stay native elements, so `formControl`, `formControlName`, `ngModel` and Signal Forms (`[formField]`) work with no setup and no `ControlValueAccessor` of ours. The label, hint and error are plain markup from `@grass-ds/css` (see its README for the contract). The label is required. List the hint in `aria-describedby`, and add the error id **only while the error is rendered**.

| Input       | Type      | Default | Notes                                                                |
| ----------- | --------- | ------- | -------------------------------------------------------------------- |
| `grInvalid` | `boolean` | `false` | Sets `aria-invalid="true"`. For errors the form does not know about. |

**How `aria-invalid` is set.** It is `"true"` when `grInvalid` is set, or when the form control the element is bound to is both **invalid and touched**, so a required field is not flagged before the user has reached it. That works for `formControl`, `formControlName`, `ngModel` and for Signal Forms `[formField]` (Angular exposes the field to the directive as an `NgControl`). So `grInvalid` is **optional**: use it for errors the form does not know about (a server message) or to show the error before the field is touched. `form.markAllAsTouched()` on a failed submit flags every field. `disabled` and `readonly` are the native attributes (use `formControl.disable()` for forms).

**Why `grInvalid` and not `invalid`.** `[formField]` writes the field's `invalid()` into any host input named `invalid`, touched or not, which would flag a pristine field on first render. `grInvalid` collides with nothing `[formField]` writes.

Do not bind `[attr.aria-invalid]` on the same element: the directive owns that attribute. An `aria-invalid` written statically in the template is kept.

**Announcing errors.** A screen reader announces an error that is **inserted after the page loaded** (on blur or submit) only if the element is a live region: give it `role="alert"`, as above. An error that is already in the page when it loads (server-rendered) must **not** have `role="alert"`, or it is announced on every load.

The components work without zone.js, use `OnPush` and `ViewEncapsulation.None`, and add no styles. Browse them in the [Catalog](https://raphaelmdcoelho.github.io/grass-ds/).
