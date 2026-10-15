# W3C DTCG JSON is the token source

All tokens are authored as W3C Design Tokens Community Group JSON (`$value`, `$type`) and compiled into every output (CSS custom properties, TS, SCSS…); no package defines token values by hand. We picked a standard format over TypeScript objects or Figma Variables so the source stays tool-neutral and a Figma sync can be added later without changing the source.
