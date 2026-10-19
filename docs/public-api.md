# Public API of 1.0

This is what the `1.0.0` release of `@grass-ds/tokens`, `@grass-ds/css` and `@grass-ds/angular` promises. Anything listed here follows the semver rules in [Versioning and support](../README.md#versioning-and-support): removing or renaming it, or changing what it means, is a breaking change and waits for the next major. Anything **not** listed is internal and may change in any release.

The vocabulary is in [CONTEXT.md](../CONTEXT.md). The list was audited against the built packages (`dist/tokens.css`, `dist/grass.css`, the `.d.ts` files and `package.json` `exports`) for 1.0; items that look like they should change before they freeze are collected under [Open questions](#open-questions-before-the-freeze).

## `@grass-ds/tokens`

### Package surface

| Part         | Public                                                        |
| ------------ | ------------------------------------------------------------- |
| `exports`    | `./tokens.css` (`dist/tokens.css`) and `./package.json` only. |
| CSS layer    | `grass.tokens` (the stylesheet puts every declaration in it). |
| Dependencies | None are needed at run time (see open question 11).           |
| Themes       | `light` and `dark`; see [Themes](#themes-and-the-html-hooks). |

The package also ships its DTCG JSON under `src/`, but the `exports` map does not expose it: nothing can `import` it by package path, and its **file layout is not API**. What is stable is the **token name**: the DTCG path `color.surface.default` is the custom property `--gr-color-surface-default` (dots become dashes, prefix `gr`). See [open question 5](#open-questions-before-the-freeze).

### Which tiers are public

A custom property is public API when it is a **semantic token** or a **component token**, plus the few hooks listed under [Hooks set by the style layer](#hooks-set-by-the-style-layer). **Primitive tokens are not public API.** They are in the stylesheet (the semantic tier points at them), you can read them, and a rename or removal would be announced in the release notes, but they may change in a minor release: their names, their scale steps and their values.

Why: the style layer, and therefore every component, uses semantic and component tokens only ([CLAUDE.md](../CLAUDE.md)), and only the semantic tier changes between themes, so a consumer that reads a primitive opts out of theming. And a tier that is internal can be made public in a minor release; a public one can only be narrowed in a major. (If you want a spacing scale, see open question 1.)

| Tier      | Public | Names                                                                                                                                                                                     |
| --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive | no     | `--gr-palette-*`, `--gr-duration-*`, `--gr-easing-*`, `--gr-shadow-*`, `--gr-corner-*`, `--gr-border-width-thin`, `--gr-border-width-thick`, `--gr-size-*`, `--gr-space-*`, `--gr-font-*` |
| Semantic  | yes    | Below.                                                                                                                                                                                    |
| Component | yes    | Below.                                                                                                                                                                                    |

"Frozen" covers the **name** and the **meaning** (a `color.text.default` stays the default text colour, and keeps meeting WCAG 2.2 AA on the surfaces it is paired with, which `check:contrast` enforces). It does not cover the **value**: values are tuned in minor releases, see the visual-change policy in the README.

### Semantic tokens (90)

Colours (48), each defined in both themes:

- `--gr-color-overlay-backdrop`
- `--gr-color-surface-{default,raised,sunken}`
- `--gr-color-text-{default,muted}`
- `--gr-color-border-{default,strong,strong-hover}`
- `--gr-color-action-primary-{background,background-hover,background-active,foreground}`
- `--gr-color-action-secondary-{background,background-hover,background-active,foreground}`
- `--gr-color-action-danger-{background,background-hover,background-active,foreground}`
- `--gr-color-action-disabled-{background,foreground,border}`
- `--gr-color-link-{default,hover}`
- `--gr-color-focus-ring`, `--gr-color-focus-ring-inner`
- `--gr-color-feedback-{success,warning,danger,info}-{surface,text,border,solid,on-solid}` (20; no component uses them yet, they are there for the consumer's own alerts and badges)

Elevation, per theme: `--gr-elevation-overlay`.

Shared by both themes:

- `--gr-layout-gap-{tight,default,loose}`, `--gr-layout-gutter`, `--gr-layout-container`, `--gr-layout-inset-{tight,default,loose}`, `--gr-layout-measure-{sm,md,lg}`
- `--gr-radius-{control,surface,pill,small}`
- `--gr-border-width`, `--gr-border-focus-width`
- `--gr-text-family-{body,heading,code}`
- `--gr-text-size-{small,body,lead,heading-4,heading-3,heading-2,heading-1,display}`
- `--gr-text-weight-{body,emphasis,heading}`
- `--gr-text-line-height-{body,heading,compact}`
- `--gr-motion-duration-{fast,default,slow}`, `--gr-motion-easing-{default,enter,exit}`
- `--gr-control-indicator-size`

Under `prefers-reduced-motion: reduce` the three `--gr-motion-duration-*` collapse to `0ms`; that behaviour is part of the contract.

### Component tokens (89)

| Component  | Count | Names (prefix `--gr-`)                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button     | 22    | `button-{radius,padding-block,padding-inline,gap,font-weight,transition-duration}`; `button-{primary,secondary,danger}-{background,background-hover,background-active,foreground}`; `button-secondary-border`; `button-disabled-{background,foreground,border}`                                                                                |
| Text field | 20    | `text-field-{background,foreground,placeholder,border,border-hover,border-focus,border-invalid}`; `text-field-{background,foreground,border}-disabled`; `text-field-{background,border}-read-only`; `text-field-{label,hint,error}`; `text-field-{radius,padding-block,padding-inline,gap,transition-duration}`                                |
| Checkbox   | 18    | `checkbox-{size,radius,gap,transition-duration}`; `checkbox-{background,border,border-hover}`; `checkbox-{background,border}-checked`, `checkbox-{background,border}-checked-hover`, `checkbox-foreground-checked`; `checkbox-border-invalid`; `checkbox-{background,border,foreground}-disabled`; `checkbox-label`, `checkbox-label-disabled` |
| Card       | 11    | `card-{background,foreground,border,divider,radius,padding,gap,shadow-elevated}`; `card-title-{size,weight,line-height}`                                                                                                                                                                                                                       |
| Dialog     | 18    | `dialog-{backdrop,background,foreground,border,divider,radius,padding,gap,shadow,gutter}`; `dialog-width-{sm,md,lg}`; `dialog-title-{size,weight,line-height}`; `dialog-transition-{duration,offset}`                                                                                                                                          |

Component tokens are the supported way to restyle one component: override them on `:root` (or `:root[data-theme]`) in your own, unlayered CSS. They resolve at `:root`, so a value set on a subtree does not reach the component ([Themes](#themes-and-the-html-hooks)).

### Hooks set by the style layer

These custom properties are not in the token source; the style layer defines them on the element and you may override them on that element.

| Property                                              | Set on                                 | Meaning                                                                                                  |
| ----------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `--gr-focus-inner`                                    | any focusable element                  | The inner band of the focus ring. Custom controls must write `box-shadow: var(--gr-focus-inner), <own>`. |
| `--gr-stack-gap`, `--gr-cluster-gap`, `--gr-grid-gap` | `.gr-stack`, `.gr-cluster`, `.gr-grid` | The gap; `data-gap` sets it from the layout tokens.                                                      |
| `--gr-grid-min`                                       | `.gr-grid`                             | Minimum column width (default `16rem`).                                                                  |
| `--gr-container-gutter`                               | `.gr-container`                        | Side gutter (default `--gr-layout-gutter`).                                                              |

**Internal**, never to be read or written by a consumer: `--gr-focus-band`, `--gr-checkbox-mark-size`, and every `--gr-<component>-current-*` property (`button`, `checkbox`, `text-field`: the per-state plumbing the component rules compute). See open question 3.

## `@grass-ds/css`

### Package surface

| Part           | Public                                                                                                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exports`      | `./grass.css`, `./fonts.css`, `./fonts/*` (the Figtree `woff2` files and `OFL.txt`), `./package.json`. `style` points at `grass.css`.                                                                                                                                                                     |
| Peer           | `@grass-ds/tokens`, at the same version.                                                                                                                                                                                                                                                                  |
| Cascade layers | `grass.tokens`, `grass.reset`, `grass.base`, `grass.layout`, `grass.components`, `grass.utilities`, in that order. The six names and their order are frozen; `grass.tokens` is filled by `@grass-ds/tokens`. Everything else in `grass.css` is inside one of them, so unlayered consumer CSS always wins. |
| `fonts.css`    | Declares `font-family: Figtree` (variable, weights 300 to 900, latin and latin-ext, normal and italic) with `font-display: swap`. The family name `Figtree` and the file names under `fonts/` are frozen.                                                                                                 |

### Foundations

Bare elements are styled by the `grass.reset` and `grass.base` layers: `html`, `body`, `h1` to `h6`, `p`, `small`, `b`, `a`, `pre`/`code`, `hr`, `::selection` and the global `:focus-visible` ring. That the foundations style bare elements is part of the contract; their exact appearance follows the visual-change policy. `[hidden]` is honoured (`hidden="until-found"` excepted), and a list with `role="list"` has its markers removed.

| Class                              | Layer             | Purpose                                                                                       |
| ---------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `.gr-display`, `.gr-lead`          | `grass.base`      | Display and lead text sizes.                                                                  |
| `.gr-text-small`, `.gr-text-muted` | `grass.base`      | Small and muted text.                                                                         |
| `.gr-container`                    | `grass.layout`    | Centred, max-width column. `data-query` makes it a size container.                            |
| `.gr-stack`                        | `grass.layout`    | Vertical flow with a gap. `data-gap="tight\|loose"`.                                          |
| `.gr-cluster`                      | `grass.layout`    | Wrapping row. `data-gap="tight\|loose"`, `data-justify="end\|between"`, `data-align="start"`. |
| `.gr-grid`                         | `grass.layout`    | Auto-fit columns. `data-gap="tight\|loose"`.                                                  |
| `.gr-visually-hidden`              | `grass.utilities` | Hidden visually, still read by assistive technology.                                          |

### Components: the markup contract

Each row is part of the contract: the element, class, attribute and state hooks that the style layer styles and that every implementation renders. Both the Reference and `@grass-ds/angular` produce exactly this markup; the `Parity` check enforces it.

| Component  | Root                                      | Parts (classes)                                                                                                                                         | Attributes and states                                                                                                       |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Button     | `.gr-button` on `button` or `a`           | none                                                                                                                                                    | `data-variant="secondary\|danger"` (absent is primary); `disabled` (button) or `aria-disabled="true"` (link)                |
| Text field | `.gr-text-field` on `input` or `textarea` | in `.gr-field`: `.gr-field__label`, `.gr-field__hint`, `.gr-field__error`                                                                               | `aria-invalid="true"`, `disabled`, `readonly`; label tied by `for`/`id`, hint and error by `aria-describedby`               |
| Checkbox   | `.gr-checkbox` on `input[type=checkbox]`  | `.gr-checkbox-label` (wraps the input), `.gr-field` and its `__hint`/`__error`, `.gr-field-group` with `.gr-field-group__legend` on `fieldset`/`legend` | `:checked`, `:indeterminate` (DOM property), `disabled`, `aria-invalid="true"`                                              |
| Card       | `.gr-card` on any element                 | `.gr-card__header`, `__title`, `__actions`, `__media`, `__body`, `__footer`                                                                             | `data-variant="elevated"` (absent is outlined); `data-query` (opt-in size container)                                        |
| Dialog     | `dialog.gr-dialog`                        | `.gr-dialog__header`, `__title`, `__actions`, `__body`, `__footer`                                                                                      | `data-size="sm\|lg"` (absent is md); `[open]`/`:modal`; `aria-labelledby` or `aria-label` required; `closedby="any"` opt-in |

Also frozen with the markup contract: the accessibility behaviour each README documents (invalid is `aria-invalid` and never `:user-invalid`, the dialog is modal and native, no component adds a role of its own, forced-colours and reduced-motion handling).

## `@grass-ds/angular`

### Package surface

| Part        | Public                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `exports`   | `.`, `./text-field`, `./checkbox`, `./package.json`. Nothing else is importable.                                                                       |
| Peers       | `@angular/core` `^22.0.0`; `@angular/forms` `^22.0.0` (optional, needed by `./text-field` and `./checkbox` only); `@grass-ds/css` at the same version. |
| Build       | ng-packagr, partial-Ivy `fesm2022` plus `.d.ts`; `sideEffects: false`.                                                                                 |
| Conventions | Standalone, signal inputs, `OnPush`, `ViewEncapsulation.None`, no zone.js required, no styles of its own.                                              |

### Root entry (`@grass-ds/angular`)

| Symbol                                                                                      | Kind       | Selector                                                                                                | Inputs / models / outputs                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GrButton`                                                                                  | component  | `button[grButton], a[grButton]`                                                                         | input `variant: GrButtonVariant` (default `'primary'`); input `disabled: boolean` (coerced)                                                                                                                                                                             |
| `GrButtonVariant`                                                                           | type       |                                                                                                         | `'primary' \| 'secondary' \| 'danger'`                                                                                                                                                                                                                                  |
| `GrCard`                                                                                    | component  | `gr-card`                                                                                               | input `variant: GrCardVariant \| undefined` (default `'outlined'`)                                                                                                                                                                                                      |
| `GrCardVariant`                                                                             | type       |                                                                                                         | `'outlined' \| 'elevated'`                                                                                                                                                                                                                                              |
| `GrCardHeader`, `GrCardTitle`, `GrCardActions`, `GrCardMedia`, `GrCardBody`, `GrCardFooter` | directives | `[grCardHeader]`, `[grCardTitle]`, `[grCardActions]`, `[grCardMedia]`, `[grCardBody]`, `[grCardFooter]` | none                                                                                                                                                                                                                                                                    |
| `GR_CARD`                                                                                   | const      |                                                                                                         | Readonly tuple of the seven Card symbols, for `imports`                                                                                                                                                                                                                 |
| `GrDialog`                                                                                  | component  | `gr-dialog`                                                                                             | model `open: boolean` (`[(open)]`); input `size: GrDialogSize \| undefined` (default `'md'`); input `label: string \| undefined`; input `closeOnBackdrop: boolean` (coerced); output `closed: string`; methods `showModal(): void`, `close(returnValue?: string): void` |
| `GrDialogSize`                                                                              | type       |                                                                                                         | `'sm' \| 'md' \| 'lg'`                                                                                                                                                                                                                                                  |
| `GrDialogHeader`, `GrDialogActions`, `GrDialogBody`, `GrDialogFooter`                       | directives | `[grDialogHeader]`, `[grDialogActions]`, `[grDialogBody]`, `[grDialogFooter]`                           | none                                                                                                                                                                                                                                                                    |
| `GrDialogTitle`                                                                             | directive  | `[grDialogTitle]`                                                                                       | input `id: string \| undefined`                                                                                                                                                                                                                                         |
| `GR_DIALOG`                                                                                 | const      |                                                                                                         | Readonly tuple of the six Dialog symbols, for `imports`                                                                                                                                                                                                                 |

### `@grass-ds/angular/text-field`

| Symbol        | Kind      | Selector                                    | Inputs                                                |
| ------------- | --------- | ------------------------------------------- | ----------------------------------------------------- |
| `GrTextField` | component | `input[grTextField], textarea[grTextField]` | input `grInvalid: boolean` (coerced, default `false`) |

### `@grass-ds/angular/checkbox`

| Symbol       | Kind      | Selector                           | Inputs / models                                                                  |
| ------------ | --------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `GrCheckbox` | component | `input[type=checkbox][grCheckbox]` | model `indeterminate: boolean` (`[(indeterminate)]`); input `grInvalid: boolean` |

### What is not public in Angular

`protected` and `private` members that show up in the `.d.ts` files (`GrButton.type`, `GrDialog.onClose`, `GrCheckbox.element`, `ariaInvalid()`, ...) are an artefact of how Angular declares host bindings and templates; they are not API. The one `@internal` member (`GrDialog`'s title registration, used by `GrDialogTitle`) is removed from the typings, as intended. The generated `ɵfac`, `ɵcmp` and `ɵdir` fields are Angular's. There are no other exports, no barrel re-exports of Angular symbols, and no deep import paths.

### Behaviour that is part of the contract

- `<button grButton>` defaults to `type="button"`; a disabled `<a grButton>` keeps its `href`, gets `aria-disabled="true"` and cancels every click before consumer handlers run.
- `grInvalid` is the only invalid input; `aria-invalid` is `"true"` when it is set or when the bound `NgControl` is invalid **and** touched (reactive, template-driven and Signal Forms). The directive owns `aria-invalid`.
- `<gr-dialog>` renders exactly the Reference markup (`display: contents` host, `<dialog class="gr-dialog">`), adds no focus handling, and emits the return value on every close.
- `<gr-card>` renders no wrapper and no role.

## Themes and the `<html>` hooks

- Only `data-theme="light"` and `data-theme="dark"` on `<html>` force a theme; without it `prefers-color-scheme` applies. `color-scheme` follows.
- Scoped themes (on a subtree) are not supported.
- `prefers-reduced-motion`, `forced-colors` and `prefers-color-scheme` are honoured as documented in the component sections of the READMEs.

## Open questions before the freeze

These are not changed in this branch. Each one is cheap before `1.0.0` and a major release afterwards. A "keep" answer needs no action.

1. **Spacing scale for consumers.** Primitives are internal (above), but `--gr-space-*` is the only spacing scale and a consumer building a layout will reach for it, while the semantic `--gr-layout-gap-*` and `--gr-layout-inset-*` are only three steps. Options: keep it internal and accept the lock-in risk, add semantic spacing tokens, or make `--gr-space-*` (and maybe `--gr-corner-*`) public. Promoting later is a minor release, so "keep internal" is the reversible default.
2. **`--gr-border-width` next to `--gr-border-width-thin`/`-thick`.** The semantic `--gr-border-width` is a prefix of two primitives with similar names. It is correct but easy to confuse; renaming either is breaking for the semantic one.
3. **Layout and focus hooks as public.** This document freezes `--gr-focus-inner`, `--gr-stack-gap`, `--gr-cluster-gap`, `--gr-grid-gap`, `--gr-grid-min` and `--gr-container-gutter` because the style layer exposes them on purpose. If you would rather freeze fewer, say so and they move to the internal list; `--gr-focus-inner` has to stay (the READMEs tell custom controls to use it).
4. **Class naming inconsistency: `.gr-checkbox-label` and `.gr-field-group__legend`.** Parts elsewhere are BEM-style `__part` of their block (`.gr-card__title`, `.gr-field__label`), but the checkbox wrapper is `.gr-checkbox-label` (a sibling block, not `.gr-checkbox__label`), and the group is `.gr-field-group`. Candidate rename: `.gr-checkbox__label`. It changes the markup contract in the style layer, the Reference, Angular's docs and every consumer, so it is only possible now.
5. **DTCG source as a public path.** `@grass-ds/tokens` ships `src/**/*.json` but cannot be imported by package path. Either add `"./src/*"` to `exports` (a new surface, so a deliberate decision) or stop shipping `src` in `files`. As it stands, tooling can only read it by file path, and this document says the layout is not API.
6. **Text-field tokens live under `--gr-text-*`.** `--gr-text-field-*` (component) shares its prefix with `--gr-text-family-*`, `--gr-text-size-*` (semantic typography). A future semantic token named `field` would collide. Renaming the component to `--gr-field-*` would also match `.gr-field`, but `.gr-field` is the wrapper and `.gr-text-field` the control, so it would be ambiguous too.
7. **Exact peer pins between our packages.** `pnpm publish` turns `workspace:*` into the exact version, so `@grass-ds/angular@1.0.0` requires `@grass-ds/css@1.0.0` and `@grass-ds/css` requires `@grass-ds/tokens@1.0.0`. Because every release bumps all three this is consistent ("upgrade them together", as documented), but a consumer cannot hold `css@1.0.0` with `angular@1.0.1`, and a package manager will warn. Using `workspace:^` would publish `^1.0.0` ranges instead. It is a config change in two `package.json` files and should be decided before the first 1.x.
8. **`GrDialogTitle` input named `id`.** It shadows the native attribute so that a static or bound `id` is kept and the dialog can point `aria-labelledby` at it. It works and is documented, but an input called `id` on a directive is unusual; the alternative is reading the attribute (as `GrCard` does for `data-variant`).
9. **`aria-describedby` and `role` on `<gr-dialog>` do nothing.** They land on the `display: contents` host, not the native dialog (documented, tracked as "a forwarding input can be added later"). A forwarding input is an addition (minor), but the current silent no-op could be a footgun; a dev-mode warning would be the cheapest fix.
10. **Unverified in the browser matrix.** Firefox, Safari and screen readers are being checked by hand; see the table in the README. Findings from that checklist may add items here.
11. **`@grass-ds/tokens` installs its build tools.** `culori` and `style-dictionary` are listed under `dependencies` (published 0.6.0 does the same), so every consumer downloads them, although `dist/tokens.css` is prebuilt and nothing imports them at run time. Moving them to `devDependencies` changes no API and shrinks the install; it is not done here only because it is a packaging change outside this task's scope.
