/**
 * Read `{ name, value }` for every custom property of the default (light) `:root` block of the
 * generated tokens.css. Comments are stripped and the block is found by brace matching, so the
 * result does not depend on how the build indents or annotates its output.
 */
export function parseTokens(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const match = /:root\s*\{/.exec(stripped);
  if (!match) throw new Error('tokens.css has no :root block');
  const open = match.index + match[0].length - 1;
  let depth = 0;
  let end = -1;
  for (let i = open; i < stripped.length; i++) {
    if (stripped[i] === '{') depth++;
    else if (stripped[i] === '}' && --depth === 0) {
      end = i;
      break;
    }
  }
  if (end === -1) throw new Error('tokens.css has an unbalanced :root block');
  const block = stripped.slice(open + 1, end);
  return [...block.matchAll(/(--gr-[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => ({
    name,
    value: value.trim(),
  }));
}
