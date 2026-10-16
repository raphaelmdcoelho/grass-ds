import type { Meta, StoryObj } from '@storybook/angular';
import { userEvent } from 'storybook/test';
import { GrTextField } from '@grass-ds/angular';

// Mirrors catalog/reference/src/text-field.stories.js: same title, story names and visible output.
const meta: Meta = {
  title: 'Components/TextField',
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

interface FieldOptions {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  attrs?: string;
  tag?: 'input' | 'textarea';
}

// The Angular side of the same contract: the directive adds the class, `invalid` adds aria-invalid.
const field = ({ id, label, hint, error, attrs = '', tag = 'input' }: FieldOptions) => {
  const describedby = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  const describedAttr = describedby ? `aria-describedby="${describedby}"` : '';
  const control =
    tag === 'textarea'
      ? `<textarea grTextField id="${id}" rows="3" ${describedAttr} ${attrs}></textarea>`
      : `<input grTextField id="${id}" ${describedAttr} ${attrs} />`;
  return `
    <div class="gr-field">
      <label class="gr-field__label" for="${id}">${label}</label>
      ${hint ? `<p class="gr-field__hint" id="${id}-hint">${hint}</p>` : ''}
      ${control}
      ${error ? `<p class="gr-field__error" id="${id}-error">${error}</p>` : ''}
    </div>`;
};

const page = (...fields: string[]) => ({
  moduleMetadata: { imports: [GrTextField] },
  template: `<div class="catalog-page gr-stack" data-gap="loose" style="max-inline-size: 28rem">${fields.join('')}</div>`,
});

export const Default: Story = {
  render: () =>
    page(field({ id: 'default', label: 'Full name', attrs: 'type="text" value="Ada Lovelace"' })),
};

export const WithHint: Story = {
  name: 'With hint',
  render: () =>
    page(
      field({
        id: 'hint',
        label: 'Email',
        hint: 'We only use it to sign you in.',
        attrs: 'type="email" value="ada@example.com"',
      }),
    ),
};

export const Invalid: Story = {
  name: 'Invalid with error',
  render: () =>
    page(
      field({
        id: 'invalid',
        label: 'Email',
        hint: 'We only use it to sign you in.',
        error: 'Enter an address like name@example.com.',
        attrs: 'type="email" value="ada@" invalid',
      }),
    ),
};

export const Disabled: Story = {
  render: () =>
    page(
      field({
        id: 'disabled',
        label: 'Full name',
        attrs: 'type="text" value="Ada Lovelace" disabled',
      }),
      field({
        id: 'disabled-empty',
        label: 'Nickname',
        attrs: 'type="text" placeholder="Optional" disabled',
      }),
    ),
};

export const ReadOnly: Story = {
  name: 'Read-only',
  render: () =>
    page(
      field({
        id: 'read-only',
        label: 'Account number',
        attrs: 'type="text" value="0042-1337" readonly',
      }),
    ),
};

export const Placeholder: Story = {
  render: () =>
    page(
      field({
        id: 'placeholder',
        label: 'Search',
        attrs: 'type="search" placeholder="Search the docs"',
      }),
    ),
};

export const Types: Story = {
  name: 'Input types and textarea',
  render: () =>
    page(
      ...['text', 'email', 'password', 'search', 'url', 'tel', 'number'].map((type) =>
        field({ id: `type-${type}`, label: type, attrs: `type="${type}"` }),
      ),
      field({
        id: 'type-textarea',
        label: 'textarea',
        tag: 'textarea',
        attrs: 'placeholder="Tell us more"',
      }),
    ),
};

/** Tab onto the field so the keyboard focus ring (outer ring plus inner band) is on show. */
export const KeyboardFocus: Story = {
  name: 'Keyboard focus',
  render: () =>
    page(
      '<p class="catalog-note">The first field is focused with the Tab key. Press Tab to move through the others.</p>',
      field({ id: 'focus', label: 'Full name', attrs: 'type="text" value="Ada Lovelace"' }),
      field({
        id: 'focus-invalid',
        label: 'Email',
        error: 'Enter an address like name@example.com.',
        attrs: 'type="email" value="ada@" invalid',
      }),
    ),
  play: async () => {
    await userEvent.tab();
  },
};
