import { userEvent } from 'storybook/test';

export default { title: 'Components/Button', parameters: { layout: 'fullscreen' } };

const VARIANTS = ['primary', 'secondary', 'danger'];

/** The markup contract: one class, data-variant for the variant, native or aria disabled state. */
const button = (variant, label, attrs = '') =>
  `<button class="gr-button" type="button" data-variant="${variant}" ${attrs}>${label}</button>`;

const row = (title, content) => `
  <section class="gr-stack" data-gap="tight">
    <code>${title}</code>
    <div class="gr-cluster">${content}</div>
  </section>`;

export const Variants = {
  render: () => `
    <div class="catalog-page gr-stack" data-gap="loose">
      ${row('.gr-button (no data-variant is primary)', `<button class="gr-button" type="button">Primary</button>`)}
      ${VARIANTS.map((variant) => row(`data-variant="${variant}"`, button(variant, variant[0].toUpperCase() + variant.slice(1)))).join('')}
    </div>`,
};

export const Disabled = {
  render: () => `
    <div class="catalog-page gr-stack" data-gap="loose">
      ${row('disabled', VARIANTS.map((variant) => button(variant, variant, 'disabled')).join(''))}
      ${row('aria-disabled="true" (stays focusable)', VARIANTS.map((variant) => button(variant, variant, 'aria-disabled="true"')).join(''))}
    </div>`,
};

export const AsLink = {
  name: 'As a link',
  render: () => `
    <div class="catalog-page gr-stack" data-gap="loose">
      ${row('a.gr-button', VARIANTS.map((variant) => `<a class="gr-button" data-variant="${variant}" href="#">${variant} link</a>`).join(''))}
      ${row('a.gr-button[aria-disabled="true"]', `<a class="gr-button" data-variant="primary" href="#" aria-disabled="true">Disabled link</a>`)}
    </div>`,
};

/** Tab onto the first button so the keyboard focus ring (outer ring plus inner band) is on show. */
export const KeyboardFocus = {
  name: 'Keyboard focus',
  render: () => `
    <div class="catalog-page gr-stack" data-gap="loose">
      <p class="catalog-note">The first button is focused with the Tab key. Press Tab to move through the others.</p>
      <div class="gr-cluster">${VARIANTS.map((variant) => button(variant, variant)).join('')}</div>
    </div>`,
  play: async () => {
    await userEvent.tab();
  },
};
