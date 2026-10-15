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
A raw value with no meaning attached (e.g. `green.500`, `space.4`); never used directly by the style layer.
_Avoid_: Base token, global token

**Semantic token**:
A token named for its purpose (e.g. `color.surface`, `color.action.primary`) that points at a primitive; the only tier whose values differ between themes.
_Avoid_: Alias token, role

**Component token**:
A token scoped to one component (e.g. `button.background`) that points at a semantic token.
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
