# Public API of 1.0

This is what the `1.0.0` release of `@grass-ds/tokens`, `@grass-ds/css` and `@grass-ds/angular` promises. Anything listed here follows the semver rules in [Versioning and support](../README.md#versioning-and-support): removing or renaming it, or changing what it means, is a breaking change and waits for the next major. Anything **not** listed is internal and may change in any release.

The vocabulary is in [CONTEXT.md](../CONTEXT.md). The list was audited against the built packages (`dist/tokens.css`, `dist/grass.css`, the `.d.ts` files and `package.json` `exports`) for 1.0; the questions raised before the freeze and their decisions are under [Decisions](#decisions-on-the-open-questions).

## `@grass-ds/tokens`

### Package surface

| Part         | Public                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exports`    | `./tokens.css` and `./package.json` only. The file behind it, `dist/tokens.css`, is public too (for `<link>` and `angular.json` use without a bundler). |
| CSS layer    | `grass.tokens` (the stylesheet puts every declaration in it).                                                                                           |
| Dependencies | None (the build tools are `devDependencies`, decision 10).                                                                                              |
| Themes       | `light` and `dark`; see [Themes](#themes-and-the-html-hooks).                                                                                           |

The package also ships its DTCG JSON under `src/`, but the `exports` map does not expose it: nothing can `import` it by package path, and its **file layout is not API**. What is stable is the **token name**: the DTCG path `color.surface.default` is the custom property `--gr-color-surface-default` (dots become dashes, prefix `gr`). See [decision 5](#decisions-on-the-open-questions).

### Which tiers are public

A custom property is public API when it is a **semantic token** or a **component token**, plus the few hooks listed under [Hooks set by the style layer](#hooks-set-by-the-style-layer). **Primitive tokens are not public API.** They are in the stylesheet (the semantic tier points at them), you can read them, and a rename or removal would be announced in the release notes, but they may change in a minor release: their names, their scale steps and their values.

Why: the style layer, and therefore every component, uses semantic and component tokens only ([CLAUDE.md](../CLAUDE.md)), and only the semantic tier changes between themes, so a consumer that reads a primitive opts out of theming. And a tier that is internal can be made public in a minor release; a public one can only be narrowed in a major. (If you want a spacing scale, see decision 1.)

| Tier      | Public | Names                                                                                                                                                                                     |
| --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive | no     | `--gr-palette-*`, `--gr-duration-*`, `--gr-easing-*`, `--gr-shadow-*`, `--gr-corner-*`, `--gr-border-width-thin`, `--gr-border-width-thick`, `--gr-size-*`, `--gr-space-*`, `--gr-font-*` |
| Semantic  | yes    | Below.                                                                                                                                                                                    |
| Component | yes    | Below.                                                                                                                                                                                    |

"Frozen" covers the **name** and the **meaning** (a `color.text.default` stays the default text colour, and keeps meeting WCAG 2.2 AA on the surfaces it is paired with). It does not cover the **value**: values are tuned in minor releases, see the visual-change policy in the README.

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
- `--gr-color-feedback-{success,warning,danger,info}-{surface,text,border,solid,on-solid}` (20; **provisional**, see below)

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

**Provisional tokens (22).** No component or style-layer rule uses these yet, so their shape is only a guess about what a future Alert or Badge needs: 19 of the 20 `--gr-color-feedback-*` tokens (all but `danger-text`, which the TextField error uses), `--gr-motion-duration-slow`, `--gr-motion-easing-enter` and `--gr-motion-easing-exit`. They are public, the names exist and you may use them, but **until a component uses a token it may be renamed, reshaped or removed in a minor release**; the release notes say so. Once a component uses one, it is frozen like the rest. (Making them provisional is the reversible choice: freezing later is a minor, un-freezing is a major.)

**Contrast guarantee.** `check:contrast` enforces WCAG 2.2 AA on the 52 foreground/background pairs of `packages/tokens/src/contrast.json`, in both themes, and the build fails otherwise. Those pairs, and only those, are the guarantee. **Not covered** because they are in no pair: `--gr-color-border-default` (a deliberately subtle divider), `--gr-color-action-disabled-border` (disabled controls are exempt), the four `--gr-color-feedback-*-border`, and `--gr-color-overlay-backdrop` (decorative).

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

**Internal**, never to be read or written by a consumer: `--gr-focus-band`, `--gr-checkbox-mark-size`, and every `--gr-<component>-current-*` property (`button`, `checkbox`, `text-field`: the per-state plumbing the component rules compute). See decision 3.

## `@grass-ds/css`

### Package surface

| Part           | Public                                                                                                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exports`      | `./grass.css`, `./fonts.css`, `./fonts/*` (the Figtree `woff2` files and `OFL.txt`), `./package.json`. `style` points at `grass.css`. The files behind them (`dist/grass.css`, `dist/fonts.css`, `dist/fonts/*`) are public too, for `<link>` use without a bundler.                                      |
| Peer           | `@grass-ds/tokens` `^X.Y.Z` of the same release (published from `workspace:^`).                                                                                                                                                                                                                           |
| Cascade layers | `grass.tokens`, `grass.reset`, `grass.base`, `grass.layout`, `grass.components`, `grass.utilities`, in that order. The six names and their order are frozen; `grass.tokens` is filled by `@grass-ds/tokens`. Everything else in `grass.css` is inside one of them, so unlayered consumer CSS always wins. |
| `fonts.css`    | Declares `font-family: Figtree` (variable, weights 300 to 900, latin and latin-ext, normal and italic) with `font-display: swap`. The family name `Figtree` and the file names under `fonts/` are frozen.                                                                                                 |

### Foundations

Bare elements are styled by the `grass.reset` and `grass.base` layers: `html`, `body`, `h1` to `h6`, `p`, `small`, `b`, `a`, `pre`/`code`, `hr`, `::selection` and the global `:focus-visible` ring. That the foundations style bare elements is part of the contract; their exact appearance follows the visual-change policy. `[hidden]` is honoured (`hidden="until-found"` excepted), and a list with `role="list"` has its markers removed.

| Class                              | Layer             | Purpose                                                                                                |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `.gr-display`, `.gr-lead`          | `grass.base`      | Display and lead text sizes.                                                                           |
| `.gr-text-small`, `.gr-text-muted` | `grass.base`      | Small and muted text.                                                                                  |
| `.gr-container`                    | `grass.layout`    | Centred, max-width column. `data-query` makes it a size container.                                     |
| `.gr-stack`                        | `grass.layout`    | Vertical flow with a gap. `data-gap="default\|tight\|loose"`.                                          |
| `.gr-cluster`                      | `grass.layout`    | Wrapping row. `data-gap="default\|tight\|loose"`, `data-justify="end\|between"`, `data-align="start"`. |
| `.gr-grid`                         | `grass.layout`    | Auto-fit columns. `data-gap="default\|tight\|loose"`.                                                  |
| `.gr-visually-hidden`              | `grass.utilities` | Hidden visually, still read by assistive technology.                                                   |

### Components: the markup contract

Each row is part of the contract: the element, class, attribute and state hooks that the style layer styles and that every implementation renders. Both the Reference and `@grass-ds/angular` produce exactly this markup; the `Parity` check enforces it.

| Component  | Root                                      | Parts (classes)                                                                                                                                         | Attributes and states                                                                                                                                                          |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button     | `.gr-button` on `button` or `a`           | none                                                                                                                                                    | `data-variant="primary\|secondary\|danger"` (absent means primary; Angular and the Reference write `primary` explicitly); `disabled` (button) or `aria-disabled="true"` (link) |
| Text field | `.gr-text-field` on `input` or `textarea` | in `.gr-field`: `.gr-field__label`, `.gr-field__hint`, `.gr-field__error`                                                                               | `aria-invalid="true"`, `disabled`, `readonly`; label tied by `for`/`id`, hint and error by `aria-describedby`                                                                  |
| Checkbox   | `.gr-checkbox` on `input[type=checkbox]`  | `.gr-checkbox-label` (wraps the input), `.gr-field` and its `__hint`/`__error`, `.gr-field-group` with `.gr-field-group__legend` on `fieldset`/`legend` | `:checked`, `:indeterminate` (DOM property), `disabled`, `aria-invalid="true"`                                                                                                 |
| Card       | `.gr-card` on any element                 | `.gr-card__header`, `__title`, `__actions`, `__media`, `__body`, `__footer`                                                                             | `data-variant="outlined\|elevated"` (absent means outlined; Angular writes `outlined` explicitly); `data-query` (opt-in size container)                                        |
| Dialog     | `dialog.gr-dialog`                        | `.gr-dialog__header`, `__title`, `__actions`, `__body`, `__footer`                                                                                      | `data-size="sm\|md\|lg"` (absent means md; Angular writes the size, `md` included); `[open]`/`:modal`; `aria-labelledby` or `aria-label` required; `closedby="any"` opt-in     |

The default values are accepted values: `data-variant="primary"` on a button, `"outlined"` on a card, `data-size="md"` on a dialog and `data-gap="default"` on the layout classes are part of the contract and styled as the default (consumers may select on them).

Also frozen with the markup contract: the accessibility behaviour each README documents (invalid is `aria-invalid` and never `:user-invalid`, the dialog is modal and native, no component adds a role of its own, forced-colours and reduced-motion handling).

## `@grass-ds/angular`

### Package surface

| Part        | Public                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exports`   | `.`, `./text-field`, `./checkbox`, `./package.json`. Nothing else is importable.                                                                                                               |
| Peers       | `@angular/core` `^22.0.0`; `@angular/forms` `^22.0.0` (optional, needed by `./text-field` and `./checkbox` only); `@grass-ds/css` `^X.Y.Z` of the same release (published from `workspace:^`). |
| Build       | ng-packagr, partial-Ivy `fesm2022` plus `.d.ts`; `sideEffects: false`.                                                                                                                         |
| Conventions | Standalone, signal inputs, `OnPush`, `ViewEncapsulation.None`, no zone.js required, no styles of its own.                                                                                      |

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

## Naming conventions and what is not promised

- Classes: `.gr-<block>` for a component, `.gr-<block>__<part>` for a part inside it, `.gr-<block>-<sibling>` for a sibling block that belongs to it (`.gr-checkbox-label`, `.gr-field-group`). Text helpers are `.gr-display`, `.gr-lead` and `.gr-text-small`, `.gr-text-muted`. Variants and states are `data-*` or ARIA attributes, never modifier classes.
- Tokens: `--gr-<category>-<role>[-<variant>][-<state>]`. Component tokens put the variant before the property or the property before the state as the component reads best (`button-primary-background-hover`, `card-shadow-elevated`, `text-field-background-disabled`); the names are frozen as listed, not derived from a rule.
- Server-side rendering and hydration are neither promised nor tested.
- The release notes name visual tuning only when the commit message says so; nothing enforces it.

## Themes and the `<html>` hooks

- Only `data-theme="light"` and `data-theme="dark"` on `<html>` force a theme; without it `prefers-color-scheme` applies. `color-scheme` follows.
- Scoped themes (on a subtree) are not supported.
- `prefers-reduced-motion`, `forced-colors` and `prefers-color-scheme` are honoured as documented in the component sections of the READMEs.

## Decisions on the open questions

These were raised before the freeze and decided by the owner. The numbering is the one of the review on PR #12.

| #   | Question                                                                     | Decision                                                                                                                    |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Make `--gr-space-*` (and `--gr-corner-*`) public                             | **Later.** Primitives stay internal. Promoting is a minor release; add semantic spacing when a real need appears.           |
| 2   | `--gr-border-width` next to the primitives `--gr-border-width-thin`/`-thick` | **Frozen as is.** Only the semantic name is public.                                                                         |
| 3   | Freeze the six layout and focus hooks                                        | **Frozen as is**, all six.                                                                                                  |
| 4   | `.gr-checkbox-label` and `.gr-field-group` naming                            | **Kept.** The label that wraps the input is a sibling block, like `.gr-text-field` next to `.gr-field__label`. No rename.   |
| 5   | The DTCG source as a public path                                             | **Kept as is.** `src/` ships, is not exported, and its layout is not API. A `./tokens.json` export can be added in a minor. |
| 6   | `--gr-text-field-*` shares the `--gr-text-*` namespace                       | **Frozen as is.**                                                                                                           |
| 7   | Exact peer pins between our packages                                         | **Changed.** The peers are `workspace:^`, published as caret ranges of the same release.                                    |
| 8   | `GrDialogTitle` input named `id`                                             | **Frozen as is.**                                                                                                           |
| 9   | `aria-describedby` and `role` on `<gr-dialog>` do nothing                    | **Later.** A dev-mode warning in a 1.0.x patch, forwarding inputs in 1.1 (both additive).                                   |
| 10  | `culori` and `style-dictionary` under the tokens `dependencies`              | **Changed.** Moved to `devDependencies`: a tokens-only install went from 84 packages (62 MB) to 1.                          |

Still open after 1.0: the findings of the manual Safari, Firefox and screen-reader checklist (README, "Manual verification for 1.0") may add items here.
