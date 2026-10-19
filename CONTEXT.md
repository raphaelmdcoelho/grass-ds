# Grass Design System

A grass-inspired design system for personal frontend apps. One source of design tokens feeds a shared style layer and any number of framework implementations, so a token change never makes implementations drift apart.

## Language

### Tokens

**Token**:
A named design decision (a color, size, duration…) stored once in the token source and compiled into every output format.
_Avoid_: Variable, constant, design value

**Token source**:
The single, canonical set of token definitions from which every other artifact is generated. Nothing downstream defines its own token values.
_Avoid_: Theme file, config

**Primitive token**:
A raw value with no meaning attached (e.g. `palette.grass.500`, `space.4`); never used directly by the style layer.
_Avoid_: Base token, global token

**Semantic token**:
A token named for its purpose (e.g. `color.surface.default`, `color.action.primary.background`) that points at a primitive; the only tier whose values differ between themes.
_Avoid_: Alias token, role

**Component token**:
A token scoped to one component (e.g. `button.primary.background`) that points at a semantic token.
_Avoid_: Local variable, override

**Theme**:
A named set of token values applied together; the system has exactly two: light and dark.
_Avoid_: Mode, skin, brand

### Styling

**Style layer**:
The framework-agnostic CSS that turns tokens into the look of every component, addressed purely through class names and attributes.
_Avoid_: Stylesheet, CSS framework, skin

**Foundations**:
The base styles every app gets before any component: reset, typography, color application and layout utilities.
_Avoid_: Base, core, globals

### Components

**Component**:
A reusable UI element (Button, TextField…) whose appearance is defined once in the style layer.
_Avoid_: Widget, control

**Field**:
A form control together with its label and optional hint and error text, laid out by `.gr-field` and tied together with `for`/`id` and `aria-describedby`.
_Avoid_: Form group, input wrapper, form row

**Field group**:
A fieldset with a legend that names several related fields (a set of checkboxes), laid out by `.gr-field-group`. The legend is its label.
_Avoid_: Checkbox group, fieldset wrapper, section

**Composite**:
A component with no native element behind it (Card, Dialog). It is a custom element in an implementation (`<gr-card>`), with its parts as child classes in the Reference and as attribute directives in Angular. The opposite of a native-backed component, which is an attribute on the native element.
_Avoid_: Container component, widget

**Card**:
A bordered surface that groups related content and actions, made of optional parts: header (title and actions), media, body and footer. It has no role of its own and is never interactive as a whole.
_Avoid_: Tile, panel, box

**Dialog**:
A modal surface that interrupts the page to ask for a decision, made of optional parts (header with title, body, footer with actions) on a native `<dialog>` opened with `showModal()`. It is always named by its title and is the first component with behaviour, all of it native (Escape, backdrop, inert page, focus in and back). Non-modal dialogs, drawers and nested dialogs are not part of the Dialog.
_Avoid_: Modal, popup, lightbox, overlay

**Return value**:
What a Dialog reports when it closes: the `value` of the button that submitted its `<form method="dialog">` (`dialog.returnValue`), or empty when it was dismissed without one.
_Avoid_: Result, response

**Backdrop dismissal**:
Closing a Dialog by clicking outside it. Opt-in per dialog (`closedby="any"`), never the only way to close it.
_Avoid_: Light dismiss, click-away

**Public API**:
Everything a release number promises: the semantic and component tokens, the `.gr-*` classes with their data and ARIA hooks and the layer names, and the exports of each Angular entry point, as listed in `docs/public-api.md`. Removing or renaming any of it is a breaking change. The Markup contract is part of it; primitive tokens are not.
_Avoid_: Interface, surface, contract (the Markup contract is only one part)

**Markup contract**:
The exact elements, classes and attributes a component must render for the style layer to style it; every implementation renders the same markup contract.
_Avoid_: Template, API, structure

**Reference**:
The framework-free rendering of a component using only the style layer; the canonical example of its markup contract that every implementation is checked against.
_Avoid_: Spec, demo, HTML version

**Implementation**:
A framework-specific package (Angular today; others possible later) that renders components using the style layer's markup contract and adds behaviour. Owns behaviour, never appearance.
_Avoid_: Wrapper, binding, port

**Catalog**:
The browsable playground of every component, in each theme and state, run locally and published to GitHub Pages.
_Avoid_: Docs site, showcase, Storybook (the tool, not the concept)

**Consumer**:
An app, in its own repository, that installs the system's published packages.
_Avoid_: Client, host app
