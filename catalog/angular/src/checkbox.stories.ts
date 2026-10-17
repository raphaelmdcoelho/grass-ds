import type { Meta, StoryObj } from '@storybook/angular';
import { userEvent } from 'storybook/test';
import { GrCheckbox } from '@grass-ds/angular/checkbox';

// Mirrors catalog/reference/src/checkbox.stories.js: same title, story names and visible output.
const meta: Meta = {
  title: 'Components/Checkbox',
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

interface ItemOptions {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  attrs?: string;
}

// The Angular side of the same contract: the directive adds the class; `indeterminate` sets the
// DOM property and `grInvalid` adds aria-invalid.
const item = ({ id, label, hint, error, attrs = '' }: ItemOptions) => {
  const describedby = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return `
    <div class="gr-field">
      <label class="gr-checkbox-label">
        <input type="checkbox" grCheckbox id="${id}" ${describedby ? `aria-describedby="${describedby}"` : ''} ${attrs} />
        <span>${label}</span>
      </label>
      ${hint ? `<p class="gr-field__hint" id="${id}-hint">${hint}</p>` : ''}
      ${error ? `<p class="gr-field__error" id="${id}-error">${error}</p>` : ''}
    </div>`;
};

const page = (...content: string[]) => ({
  moduleMetadata: { imports: [GrCheckbox] },
  template: `<div class="catalog-page gr-stack" data-gap="loose" style="max-inline-size: 28rem">${content.join('')}</div>`,
});

export const Unchecked: Story = {
  render: () => page(item({ id: 'unchecked', label: 'Subscribe to the newsletter' })),
};

export const Checked: Story = {
  render: () =>
    page(item({ id: 'checked', label: 'Subscribe to the newsletter', attrs: 'checked' })),
};

export const Indeterminate: Story = {
  render: () => page(item({ id: 'mixed', label: 'Select all', attrs: '[indeterminate]="true"' })),
};

export const Disabled: Story = {
  render: () =>
    page(
      item({ id: 'disabled', label: 'Unchecked and disabled', attrs: 'disabled' }),
      item({ id: 'disabled-checked', label: 'Checked and disabled', attrs: 'checked disabled' }),
      item({
        id: 'disabled-mixed',
        label: 'Mixed and disabled',
        attrs: '[indeterminate]="true" disabled',
      }),
    ),
};

export const Invalid: Story = {
  name: 'Invalid with error',
  render: () =>
    page(
      item({
        id: 'invalid',
        label: 'I accept the terms',
        error: 'Accept the terms to continue.',
        attrs: 'grInvalid',
      }),
    ),
};

export const WithHint: Story = {
  name: 'With hint',
  render: () =>
    page(
      item({
        id: 'hint',
        label: 'Subscribe to the newsletter',
        hint: 'One email a month. You can unsubscribe at any time.',
        attrs: 'checked',
      }),
    ),
};

export const Group: Story = {
  name: 'Group with legend',
  render: () =>
    page(`
    <fieldset class="gr-field-group" aria-describedby="topics-hint">
      <legend class="gr-field-group__legend">Topics</legend>
      <p class="gr-field__hint" id="topics-hint">Choose any that apply.</p>
      ${item({ id: 'topic-tokens', label: 'Design tokens', attrs: 'checked' })}
      ${item({ id: 'topic-css', label: 'Style layer' })}
      ${item({ id: 'topic-angular', label: 'Angular components' })}
    </fieldset>`),
};

/** Tab onto the first checkbox so the keyboard focus ring is on show; Space toggles it. */
export const KeyboardFocus: Story = {
  name: 'Keyboard focus',
  render: () =>
    page(
      '<p class="catalog-note">The first checkbox is focused with the Tab key. Press Space to toggle it and Tab to move on.</p>',
      item({ id: 'focus', label: 'Subscribe to the newsletter' }),
      item({ id: 'focus-checked', label: 'Subscribe to the newsletter', attrs: 'checked' }),
    ),
  play: async () => {
    await userEvent.tab();
  },
};
