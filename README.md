# grass-ds

A grass-inspired design system. One DTCG token source feeds a framework-agnostic CSS style layer and framework implementations. See [CONTEXT.md](CONTEXT.md) for the vocabulary and [docs/design-plan.md](docs/design-plan.md) for the plan.

| Package            | Contents                                                 |
| ------------------ | -------------------------------------------------------- |
| `@grass-ds/tokens` | DTCG token source and generated `--gr-*` CSS properties  |
| `@grass-ds/css`    | Foundations and component CSS, optional self-hosted font |

## Development

Node 26 (`nvm use`) and pnpm (`corepack enable`; Node 25+ no longer bundles Corepack: `npm install -g corepack`).

```sh
pnpm install
pnpm build            # tokens, then css
pnpm lint
pnpm check:contrast   # WCAG AA check of semantic colour pairs
pnpm test
pnpm storybook        # Reference Catalog on http://localhost:6006
pnpm build:catalog
```

Commits follow Conventional Commits with scopes `tokens|css|angular|catalog|repo|deps|release`.

## Conventions

- **Themes** switch only through `data-theme="light|dark"` on `<html>` (absent means follow the OS). Scoped themes on a subtree are not supported: component tokens resolve their `var()` references at `:root`.
- **Units** are `rem`, so the system follows the user's font size: 4px is `0.25rem` at the default size (`space.1`).
- **Token format** is W3C DTCG with mixed value forms: colours in the structured object form (OKLCH), dimensions as strings. See [ADR 0002](docs/adr/0002-w3c-dtcg-json-as-token-source.md).
- **`.gr-container`** is not a size container by default; add `data-query` when children use `@container` queries.

## Releasing

Releases are automatic with semantic-release (see [ADR 0003](docs/adr/0003-publish-packages-to-npm.md)). Before the first run, a `v0.0.0` tag must exist on `main` so versions start at 0.x instead of 1.0.0; create it by hand, semantic-release never does. The `@grass-ds` npm organisation must exist before any publish. The release and GitHub Pages workflows are not added yet for that reason.

## Licence

MIT. Figtree is distributed under the SIL Open Font License 1.1.
