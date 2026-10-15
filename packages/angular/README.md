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

| Input      | Type                                   | Default     | Notes                                                                               |
| ---------- | -------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Rendered as `data-variant`.                                                         |
| `disabled` | `boolean`                              | `false`     | Native `disabled` on `<button>`; `aria-disabled="true"` and no navigation on `<a>`. |

The component works without zone.js, uses `OnPush` and `ViewEncapsulation.None`, and adds no styles.
