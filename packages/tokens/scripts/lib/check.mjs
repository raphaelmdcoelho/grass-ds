import { readFile } from 'node:fs/promises';
import { THEMES, resolvedTokens } from './dictionary.mjs';
import { checkPairs, formatResult } from './contrast.mjs';

const config = JSON.parse(
  await readFile(new URL('../../src/contrast.json', import.meta.url), 'utf8'),
);

/** Runs the AA check in every theme. Returns the failures (empty when everything passes). */
export async function runContrastCheck({ log = console.log } = {}) {
  const failures = [];
  for (const theme of THEMES) {
    const results = checkPairs(await resolvedTokens(theme), config);
    log(`\n${theme} theme: ${results.filter((r) => r.pass).length}/${results.length} pairs pass`);
    for (const result of results) {
      if (!result.pass) failures.push({ theme, ...result });
      if (!result.pass || process.env.CONTRAST_VERBOSE) log(`  ${formatResult(result)}`);
    }
  }
  return failures;
}
