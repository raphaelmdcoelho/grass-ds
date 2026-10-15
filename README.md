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

Publishing uses the repository secret `NPM_TOKEN`, a granular npm access token with read and write access to the `@grass-ds` packages. It is exposed to `semantic-release` as `NODE_AUTH_TOKEN`, and the `.npmrc` that reads it is written by `actions/setup-node` through `registry-url`. npm limits how long write tokens live (90 days at the time of writing; see [About access tokens](https://docs.npmjs.com/about-access-tokens/) for the current rule), so rotate it before it expires:

1. On npmjs.com, create a new granular access token with read and write permission on the `@grass-ds` packages and the longest expiry npm allows.
2. Replace the `NPM_TOKEN` secret under Settings, Secrets and variables, Actions.
3. Revoke the old token and put the next expiry date in your calendar.

A bad or expired token is caught before anything is tagged: `verifyConditionsCmd` in `.releaserc.json` runs `npm whoami` with the same `NODE_AUTH_TOKEN`, so the release job fails at the start and no tag is created.

### Recovering from a failed release

semantic-release pushes the `vX.Y.Z` tag **before** it publishes. If the job fails after that point (for example a publish error), re-running it does nothing: the tag already exists, so semantic-release sees nothing new to release. Delete the tag first, then re-run the failed job:

```sh
git push origin :refs/tags/vX.Y.Z
```

`pnpm -r publish` skips versions that are already on npm, so a partly completed publish (one package out, one not) recovers the same way. If a GitHub release was already created for the tag, delete it as well.

### January 2027: trusted publishing

npm has announced that it removes direct publishing with access tokens in January 2027 (see the [npm documentation](https://docs.npmjs.com/about-access-tokens/) for the exact scope and date). After that, CI has to publish through trusted publishing (OIDC), or through the stage-only token plus `npm stage approve` flow. The release workflow already requests `id-token: write` and publishes with `--provenance`, so the move to [trusted publishing](https://docs.npmjs.com/trusted-publishers/) is small:

1. Follow the npm documentation to add a trusted publisher to each package: provider GitHub Actions, repository `raphaelmdcoelho/grass-ds`, workflow `release.yml`. npm may require the package to exist before one can be configured; if so, publish the first version with the token.
2. In `release.yml`, remove the `NODE_AUTH_TOKEN` line and keep `registry-url`. npm then exchanges the job's OIDC token for a short-lived publish credential, which needs a recent npm (the documentation states the minimum; the Node 26 pinned in `.nvmrc` ships npm 11).
3. Replace `verifyConditionsCmd` (`npm whoami` does not work with OIDC) or drop it.
4. Delete the `NPM_TOKEN` secret and revoke the token.

## Licence

MIT. Figtree is distributed under the SIL Open Font License 1.1.
