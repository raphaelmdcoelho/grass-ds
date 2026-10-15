import { tokensWithPrefix } from './token-list.js';

export default { title: 'Foundations/Colors', parameters: { layout: 'fullscreen' } };

const swatch = ({ name }) => `
  <div class="catalog-swatch">
    <div class="catalog-swatch__chip" style="background-color: var(${name})"></div>
    <span class="catalog-swatch__name">${name.replace('--gr-', '')}</span>
  </div>`;

const section = (title, items) => `
  <section class="catalog-section gr-stack" data-gap="tight">
    <h3>${title}</h3>
    <div class="catalog-swatches gr-grid" data-gap="tight">${items.map(swatch).join('')}</div>
  </section>`;

export const Semantic = {
  name: 'Semantic',
  render: () => {
    const colors = tokensWithPrefix('--gr-color-');
    const groups = Map.groupBy(colors, ({ name }) => name.split('-')[4]);
    return `
      <div class="catalog-page">
        <p class="catalog-note gr-lead">Semantic colours are the only tier that changes between themes. Switch the theme in the toolbar.</p>
        ${[...groups].map(([group, items]) => section(group, items)).join('')}
      </div>`;
  },
};

export const Palette = {
  name: 'Palette (primitive)',
  render: () => {
    const palette = tokensWithPrefix('--gr-palette-');
    const scales = Map.groupBy(palette, ({ name }) => name.split('-')[4]);
    return `
      <div class="catalog-page">
        <p class="catalog-note gr-lead">Primitive scales generated in OKLCH for even perceived lightness. Components never use these directly.</p>
        ${[...scales].map(([scale, items]) => section(scale, items)).join('')}
      </div>`;
  },
};
