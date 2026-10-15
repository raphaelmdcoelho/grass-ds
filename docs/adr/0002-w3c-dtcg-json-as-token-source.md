# W3C DTCG JSON is the token source

All tokens are authored as W3C Design Tokens Community Group JSON (`$value`, `$type`) and compiled into every output (CSS custom properties, TS, SCSS…); no package defines token values by hand. We picked a standard format over TypeScript objects or Figma Variables so the source stays tool-neutral and a Figma sync can be added later without changing the source.

The source mixes two DTCG value forms on purpose: colours use the structured object form (`{"colorSpace": "oklch", "components": [...]}`) so the palette stays in OKLCH, while dimensions, durations and similar tokens use plain strings (`"0.25rem"`), which Style Dictionary 5 and today's tooling accept. A custom transform emits the colour objects as `oklch()` rather than letting Style Dictionary flatten them to hex. Dimensions can move to the structured form once the tools we depend on handle it.
