# Shared style layer with thin per-framework implementations

Components are styled once, in a framework-agnostic CSS style layer built from the shared tokens; each framework (Angular first; any other framework, e.g. React, is undecided and out of scope for now) gets its own thin implementation that only renders the style layer's markup contract and adds behaviour. We chose this over Web Components (Lit) because custom elements bring Shadow DOM styling friction, SSR/hydration rough edges and awkward Angular forms integration, and over fully separate implementations because those let appearance drift. Accepted cost: behaviour (keyboard handling, focus, ARIA) is written once per framework.

## Considered Options

- **Web Components as the single implementation**: rejected for the reasons above.
- **Tokens only, independent implementations**: rejected; only token values would be shared, so layout and states could drift.
