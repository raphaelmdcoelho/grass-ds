import type { Meta, StoryObj } from '@storybook/angular';
import { GR_CARD, GrButton } from '@grass-ds/angular';
import { GrCheckbox } from '@grass-ds/angular/checkbox';
import { GrTextField } from '@grass-ds/angular/text-field';

// Mirrors catalog/reference/src/card.stories.js: same title, story names and visible output.
const meta: Meta = {
  title: 'Components/Card',
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

const MEDIA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 140'%3E%3Crect width='320' height='140' fill='%234b9a1f'/%3E%3Crect y='90' width='320' height='50' fill='%232f6b10'/%3E%3Ccircle cx='250' cy='42' r='20' fill='%23f5d54a'/%3E%3C/svg%3E";

interface CardOptions {
  id: string;
  variant?: string;
  title?: string;
  actions?: string;
  media?: boolean;
  body?: string;
  footer?: string;
}

// The Angular side of the same contract: <gr-card> with part directives on elements the story picks.
const card = ({ id, variant, title, actions, media, body, footer }: CardOptions) => `
  <gr-card ${variant ? `variant="${variant}"` : ''} role="article" aria-labelledby="${id}-title">
    ${
      title
        ? `<header grCardHeader>
      <h3 grCardTitle id="${id}-title">${title}</h3>
      ${actions ? `<div grCardActions>${actions}</div>` : ''}
    </header>`
        : ''
    }
    ${media ? `<div grCardMedia><img src="${MEDIA}" alt="" /></div>` : ''}
    ${body ? `<div grCardBody>${body}</div>` : ''}
    ${footer ? `<footer grCardFooter>${footer}</footer>` : ''}
  </gr-card>`;

const page = (...content: string[]) => ({
  moduleMetadata: { imports: [GR_CARD, GrButton, GrTextField, GrCheckbox] },
  template: `<div class="catalog-page gr-stack" data-gap="loose" style="max-inline-size: 28rem">${content.join('')}</div>`,
});

const button = (label: string, variant = 'primary') =>
  `<button grButton variant="${variant}">${label}</button>`;

const TEXT =
  '<p style="margin: 0">Cards group related content and actions. The text inside keeps the surface contrast of the theme.</p>';

export const Basic: Story = {
  render: () => page(card({ id: 'basic', title: 'Team plan', body: TEXT })),
};

export const WithHeaderActions: Story = {
  name: 'With header actions',
  render: () =>
    page(
      card({
        id: 'actions',
        title: 'Team plan',
        actions: button('Edit', 'secondary') + button('Delete', 'danger'),
        body: TEXT,
      }),
    ),
};

export const WithFooter: Story = {
  name: 'With footer',
  render: () =>
    page(
      card({
        id: 'footer',
        title: 'Team plan',
        body: TEXT,
        footer: button('Choose plan') + button('Cancel', 'secondary'),
      }),
    ),
};

export const WithMedia: Story = {
  name: 'With media',
  render: () =>
    page(
      card({ id: 'media-top', media: true, title: 'Meadow', body: TEXT }),
      card({ id: 'media-only', media: true, body: TEXT }),
      card({ id: 'media-last', title: 'Meadow', media: true }),
    ),
};

export const Variants: Story = {
  name: 'Outlined and elevated',
  render: () =>
    page(
      card({ id: 'outlined', variant: 'outlined', title: 'Outlined', body: TEXT }),
      card({ id: 'elevated', variant: 'elevated', title: 'Elevated', body: TEXT }),
    ),
};

export const Form: Story = {
  name: 'With a form',
  render: () =>
    page(
      card({
        id: 'form',
        title: 'Sign up',
        body: `
      <form class="gr-stack" data-gap="default" (submit)="$event.preventDefault()">
        <div class="gr-field">
          <label class="gr-field__label" for="form-email">Email</label>
          <input grTextField id="form-email" type="email" />
        </div>
        <div class="gr-field">
          <label class="gr-checkbox-label">
            <input type="checkbox" grCheckbox checked />
            <span>Send me product news</span>
          </label>
        </div>
      </form>`,
        footer: button('Create account'),
      }),
    ),
};

export const InAGrid: Story = {
  name: 'In a grid',
  render: () => ({
    moduleMetadata: { imports: [GR_CARD, GrButton] },
    template: `
    <div class="catalog-page">
      <div class="gr-grid" style="--gr-grid-min: 14rem">
        ${card({ id: 'g1', title: 'Free', body: TEXT, footer: button('Choose') })}
        ${card({ id: 'g2', variant: 'elevated', title: 'Team', body: `${TEXT}${TEXT}${TEXT}`, footer: button('Choose') })}
        ${card({ id: 'g3', title: 'Business', media: true, body: TEXT, footer: button('Choose') })}
      </div>
    </div>`,
  }),
};
