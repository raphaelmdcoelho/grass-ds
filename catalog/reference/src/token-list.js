import tokensCss from '@grass-ds/tokens/tokens.css?raw';
import { parseTokens } from './parse-tokens.js';

/** Every token as `{ name, value }`, read from the generated CSS so the catalog never restates a value. */
export const tokens = parseTokens(tokensCss);

export const tokensWithPrefix = (prefix) => tokens.filter(({ name }) => name.startsWith(prefix));
