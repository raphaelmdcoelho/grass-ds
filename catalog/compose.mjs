// Assembles the Catalog site: the Reference Storybook at the root with each implementation's
// Storybook in a subfolder that the Reference lists in `refs` (ADR 0006).
import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const site = here('site/');

await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp(here('reference/storybook-static/'), site, { recursive: true });
await cp(here('angular/storybook-static/'), `${site}angular/`, { recursive: true });
console.log('Composed the Catalog into catalog/site (Reference at /, Angular at /angular/)');
