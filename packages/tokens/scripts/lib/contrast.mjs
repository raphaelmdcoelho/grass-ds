import { parse, wcagContrast } from 'culori';

/**
 * Check every pair against its WCAG threshold.
 * @param {Record<string,string>} tokens dot path -> css colour
 * @param {{thresholds: Record<string,number>, pairs: {fg:string,bg:string,level:string}[]}} config
 * @returns {{fg:string,bg:string,level:string,ratio:number,required:number,pass:boolean}[]}
 */
export function checkPairs(tokens, { thresholds, pairs }) {
  return pairs.map(({ fg, bg, level }) => {
    const required = thresholds[level];
    if (required === undefined)
      throw new Error(`Unknown contrast level "${level}" for ${fg} on ${bg}`);
    const colours = [fg, bg].map((path) => {
      const value = tokens[path];
      const colour = value === undefined ? undefined : parse(value);
      if (!colour)
        throw new Error(`Contrast pair references "${path}", which is not a colour token`);
      if (colour.alpha !== undefined && colour.alpha < 1) {
        throw new Error(`"${path}" is translucent; its contrast depends on what is behind it`);
      }
      return colour;
    });
    const ratio = wcagContrast(colours[0], colours[1]);
    return { fg, bg, level, ratio, required, pass: ratio >= required };
  });
}

export const formatResult = ({ fg, bg, ratio, required, pass }) =>
  `${pass ? 'pass' : 'FAIL'}  ${ratio.toFixed(2)}:1 (needs ${required}:1)  ${fg} on ${bg}`;
