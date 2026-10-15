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

Commits follow Conventional Commits with scopes `tokens|css|angular|catalog|repo`.

## Licence

MIT. Figtree is distributed under the SIL Open Font License 1.1.
