# @grass-ds/angular

Angular implementation of the Grass Design System. Components are standalone attribute components on native elements (`<button grButton>`), styled entirely by [`@grass-ds/css`](https://www.npmjs.com/package/@grass-ds/css); this package owns behaviour, never appearance.

## Install

```sh
npm install @grass-ds/angular @grass-ds/css @grass-ds/tokens
```

`@grass-ds/css`, `@angular/core` and `@angular/forms` are peer dependencies. Load the stylesheets once, for example in `angular.json` `styles`:

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

```ts
import { GrTextField } from '@grass-ds/angular';

@Component({
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
        aria-describedby="email-hint email-error"
      />
      @if (email.touched && email.invalid) {
        <p class="gr-field__error" id="email-error">Enter an address like name@example.com.</p>
      }
    </div>
  `,
})
export class Example {
  readonly email = new FormControl('', [Validators.required, Validators.email]);
}
```

`<input grTextField>` and `<textarea grTextField>` stay native elements, so `formControl`, `formControlName` and `ngModel` work with no setup and no `ControlValueAccessor` of ours. The label, hint and error are plain markup from `@grass-ds/css` (see its README for the contract); the label is required, and the hint and error are listed in `aria-describedby`.

| Input     | Type      | Default | Notes                                                                |
| --------- | --------- | ------- | -------------------------------------------------------------------- |
| `invalid` | `boolean` | `false` | Sets `aria-invalid="true"`. For errors the form does not know about. |

**How `aria-invalid` is set.** It is `"true"` when `invalid` is set, or when the control the element is bound to (`NgControl`) is both **invalid and touched**, so a required field is not flagged before the user has reached it. `form.markAllAsTouched()` on a failed submit flags every field. The error message itself is yours to render, as in the example. `disabled` and `readonly` are the native attributes (use `formControl.disable()` for forms).

Use the `invalid` input and do not bind `[attr.aria-invalid]` on the same element: the directive owns that attribute. An `aria-invalid` written statically in the template is kept.

The components work without zone.js, use `OnPush` and `ViewEncapsulation.None`, and add no styles. Browse them in the [Catalog](https://raphaelmdcoelho.github.io/grass-ds/).
