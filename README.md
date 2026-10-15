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

## Status line

The committed Claude Code status line (`.claude/statusline.sh`) needs `jq` on the PATH.

## Conventions

- **Themes** switch only through `data-theme="light|dark"` on `<html>` (absent means follow the OS). Scoped themes on a subtree are not supported: component tokens resolve their `var()` references at `:root`.
- **Units** are `rem`, so the system follows the user's font size: 4px is `0.25rem` at the default size (`space.1`).
- **Token format** is W3C DTCG with mixed value forms: colours in the structured object form (OKLCH), dimensions as strings. See [ADR 0002](docs/adr/0002-w3c-dtcg-json-as-token-source.md).
- **`.gr-container`** is not a size container by default; add `data-query` when children use `@container` queries.

## Releasing

Releases are automatic with semantic-release (see [ADR 0003](docs/adr/0003-publish-packages-to-npm.md)). Every push to `main` runs [`release.yml`](.github/workflows/release.yml): it derives the next version from the Conventional Commits since the last tag (merge commits such as "Merge pull request #1" are not conventional and are ignored), builds, sets that version on every package, publishes `@grass-ds/tokens` and `@grass-ds/css` to npm with provenance, tags `vX.Y.Z` and creates the GitHub release. The private catalog is never published. Versions start at 0.x because a `v0.0.0` tag exists on the first commit of `main`; semantic-release never creates that tag.

The Catalog is deployed to GitHub Pages by [`pages.yml`](.github/workflows/pages.yml) on every push to `main` (it documents `main`, so it does not wait for an npm release). The repository's Pages source must be set to "GitHub Actions". The site lives under `/grass-ds/`; Storybook builds with relative asset paths, so no base setting is needed.

### npm token rotation

Publishing uses the repository secret `NPM_TOKEN`, a granular npm access token with read and write access to the `@grass-ds` packages, exposed to `semantic-release` as `NODE_AUTH_TOKEN` (the `.npmrc` is written by `actions/setup-node` through `registry-url`). npm limits write tokens to 90 days, so rotate it before it expires:

1. On npmjs.com, create a new granular access token (packages and scopes: `@grass-ds`, permission read and write, 90 days).
2. Replace the `NPM_TOKEN` secret under Settings, Secrets and variables, Actions.
3. Revoke the old token and put the next expiry date in your calendar.

An expired token makes the release job fail at the publish step after the tag may already exist; fix the secret and re-run the failed job.

**January 2027 deadline.** npm is removing direct publishing with tokens that bypass two-factor authentication in January 2027. After that, CI must publish through trusted publishing (OIDC), or through a stage-only token plus `npm stage approve`. The workflow already requests `id-token: write` and publishes with `--provenance`, so moving to trusted publishing is small:

1. Publish each package once with the token so it exists on npm (a trusted publisher can only be attached to an existing package).
2. On npmjs.com, open each package's settings, add a trusted publisher: GitHub Actions, repository `raphaelmdcoelho/grass-ds`, workflow `release.yml`.
3. In `release.yml`, remove the `NODE_AUTH_TOKEN` line (keep `registry-url`); npm then exchanges the job's OIDC token for a short-lived publish credential. This needs npm 11.5.1 or newer, which the Node 26 that `.nvmrc` pins ships.
4. Delete the `NPM_TOKEN` secret and revoke the token.

## Licence

MIT. Figtree is distributed under the SIL Open Font License 1.1.
