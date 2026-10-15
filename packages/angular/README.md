# @grass-ds/angular

Angular implementation of the Grass Design System. Components are standalone attribute components on native elements (`<button grButton>`), styled entirely by [`@grass-ds/css`](https://www.npmjs.com/package/@grass-ds/css); this package owns behaviour, never appearance.

## Install

```sh
npm install @grass-ds/angular @grass-ds/css @grass-ds/tokens
```

`@grass-ds/css` and `@angular/core` are peer dependencies. Load the stylesheets once, for example in `angular.json` `styles`:

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

The component works without zone.js, uses `OnPush` and `ViewEncapsulation.None`, and adds no styles. Browse the components in the [Catalog](https://raphaelmdcoelho.github.io/grass-ds/).
