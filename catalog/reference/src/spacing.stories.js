import { tokensWithPrefix } from './token-list.js';

export default { title: 'Foundations/Spacing and shape', parameters: { layout: 'fullscreen' } };

export const Spacing = {
  render: () => `
    <div class="catalog-page gr-stack" data-gap="tight">
      <p class="catalog-note gr-lead">A 4px base: space.1 is 4px, space.16 is 64px.</p>
      ${tokensWithPrefix('--gr-space-')
        .filter(({ value }) => value !== '0')
        .map(
          ({ name, value }) =>
            `<div class="catalog-row"><span class="catalog-swatch__name">${name.replace('--gr-', '')} · ${value}</span><div class="catalog-bar" style="inline-size: var(${name})"></div></div>`,
        )
        .join('')}
    </div>`,
};

export const RadiusAndElevation = {
  name: 'Radius and elevation',
  render: () => `
    <div class="catalog-page gr-stack" data-gap="loose">
      <section class="gr-grid">
        ${['control', 'surface', 'pill']
          .map(
            (kind) =>
              `<div class="catalog-tile" style="border-radius: var(--gr-radius-${kind})"><span class="catalog-swatch__name">radius-${kind}</span></div>`,
          )
          .join('')}
      </section>
      <section class="gr-grid">
        <div class="catalog-tile" style="border-radius: var(--gr-radius-surface)"><span class="catalog-swatch__name">flat (default)</span></div>
        <div class="catalog-tile" style="border-radius: var(--gr-radius-surface); box-shadow: var(--gr-elevation-overlay)"><span class="catalog-swatch__name">elevation-overlay</span></div>
      </section>
    </div>`,
};

export const Motion = {
  render: () => `
    <div class="catalog-page gr-stack">
      <p class="catalog-note gr-lead">Hover or focus a track. Durations collapse to zero when the OS asks for reduced motion.</p>
      ${['fast', 'default', 'slow']
        .map(
          (speed) =>
            `<div class="catalog-row"><span class="catalog-swatch__name">motion-duration-${speed}</span><div class="catalog-motion-track" tabindex="0" role="group" aria-label="motion-duration-${speed} demo"><div class="catalog-motion" style="--catalog-duration: var(--gr-motion-duration-${speed})"></div></div></div>`,
        )
        .join('')}
    </div>`,
};
