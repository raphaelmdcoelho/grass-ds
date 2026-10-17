import { userEvent } from 'storybook/test';

export default { title: 'Components/Checkbox', parameters: { layout: 'fullscreen' } };

/**
 * The markup contract: the label wraps the input (the whole label is the target), hint and error
 * follow it and are tied by aria-describedby, aria-invalid="true" on the input while the error shows.
 * `indeterminate` has no attribute: data-indeterminate marks the inputs the story sets it on.
 */
const item = ({ id, label, hint, error, attrs = '' }) => {
  const describedby = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return `
    <div class="gr-field">
      <label class="gr-checkbox-label">
        <input class="gr-checkbox" type="checkbox" id="${id}" ${describedby ? `aria-describedby="${describedby}"` : ''} ${attrs} />
        <span>${label}</span>
      </label>
      ${hint ? `<p class="gr-field__hint" id="${id}-hint">${hint}</p>` : ''}
      ${error ? `<p class="gr-field__error" id="${id}-error">${error}</p>` : ''}
    </div>`;
};

const page = (...content) =>
  `<div class="catalog-page gr-stack" data-gap="loose" style="max-inline-size: 28rem">${content.join('')}</div>`;

const markMixed = ({ canvasElement }) => {
  for (const input of canvasElement.querySelectorAll('[data-indeterminate]'))
    input.indeterminate = true;
};

export const Unchecked = {
  render: () => page(item({ id: 'unchecked', label: 'Subscribe to the newsletter' })),
};

export const Checked = {
  render: () =>
    page(item({ id: 'checked', label: 'Subscribe to the newsletter', attrs: 'checked' })),
};

export const Indeterminate = {
  render: () => page(item({ id: 'mixed', label: 'Select all', attrs: 'data-indeterminate' })),
  play: markMixed,
};

export const Disabled = {
  render: () =>
    page(
      item({ id: 'disabled', label: 'Unchecked and disabled', attrs: 'disabled' }),
      item({ id: 'disabled-checked', label: 'Checked and disabled', attrs: 'checked disabled' }),
      item({
        id: 'disabled-mixed',
        label: 'Mixed and disabled',
        attrs: 'data-indeterminate disabled',
      }),
    ),
  play: markMixed,
};

export const Invalid = {
  name: 'Invalid with error',
  render: () =>
    page(
      item({
        id: 'invalid',
        label: 'I accept the terms',
        error: 'Accept the terms to continue.',
        attrs: 'aria-invalid="true"',
      }),
    ),
};

export const WithHint = {
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

export const Group = {
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
export const KeyboardFocus = {
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
