import type { Meta, StoryObj } from '@storybook/angular';
import { userEvent } from 'storybook/test';
import { GrButton } from '@grass-ds/angular';

// Mirrors catalog/reference/src/button.stories.js: same title, story names and visible output.
const meta: Meta = {
  title: 'Components/Button',
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

const VARIANTS = ['primary', 'secondary', 'danger'] as const;

const row = (title: string, content: string) => `
  <section class="gr-stack" data-gap="tight">
    <code>${title}</code>
    <div class="gr-cluster">${content}</div>
  </section>`;

const buttons = (attrs = '') =>
  VARIANTS.map(
    (variant) => `<button grButton variant="${variant}" ${attrs}>${variant}</button>`,
  ).join('');

export const Variants: Story = {
  render: () => ({
    moduleMetadata: { imports: [GrButton] },
    template: `
    <div class="catalog-page gr-stack" data-gap="loose">
      ${row('.gr-button (no data-variant is primary)', '<button grButton>Primary</button>')}
      ${VARIANTS.map((variant) => row(`data-variant="${variant}"`, `<button grButton variant="${variant}">${variant[0].toUpperCase() + variant.slice(1)}</button>`)).join('')}
    </div>`,
  }),
};

export const Disabled: Story = {
  render: () => ({
    moduleMetadata: { imports: [GrButton] },
    template: `
    <div class="catalog-page gr-stack" data-gap="loose">
      ${row('disabled', buttons('disabled'))}
      ${row('aria-disabled="true" (stays focusable)', buttons('aria-disabled="true"'))}
    </div>`,
  }),
};

export const AsLink: Story = {
  name: 'As a link',
  render: () => ({
    moduleMetadata: { imports: [GrButton] },
    template: `
    <div class="catalog-page gr-stack" data-gap="loose">
      ${row('a.gr-button', VARIANTS.map((variant) => `<a grButton variant="${variant}" href="#">${variant} link</a>`).join(''))}
      ${row('a.gr-button[aria-disabled="true"]', '<a grButton href="#" disabled>Disabled link</a>')}
    </div>`,
  }),
};

/** Tab onto the first button so the keyboard focus ring (outer ring plus inner band) is on show. */
export const KeyboardFocus: Story = {
  name: 'Keyboard focus',
  render: () => ({
    moduleMetadata: { imports: [GrButton] },
    template: `
    <div class="catalog-page gr-stack" data-gap="loose">
      <p class="catalog-note">The first button is focused with the Tab key. Press Tab to move through the others.</p>
      <div class="gr-cluster">${buttons()}</div>
    </div>`,
  }),
  play: async () => {
    await userEvent.tab();
  },
};
