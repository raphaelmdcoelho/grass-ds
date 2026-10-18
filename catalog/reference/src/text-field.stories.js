import { userEvent } from 'storybook/test';

export default { title: 'Components/TextField', parameters: { layout: 'fullscreen' } };

/**
 * The markup contract: a required label tied by for/id, optional hint and error tied by
 * aria-describedby, aria-invalid="true" on the control while the error shows.
 */
const field = ({ id, label, hint, error, attrs = '', tag = 'input' }) => {
  const describedby = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  const control =
    tag === 'textarea'
      ? `<textarea class="gr-text-field" id="${id}" rows="3" ${describedby ? `aria-describedby="${describedby}"` : ''} ${attrs}></textarea>`
      : `<input class="gr-text-field" id="${id}" ${describedby ? `aria-describedby="${describedby}"` : ''} ${attrs} />`;
  return `
    <div class="gr-field">
      <label class="gr-field__label" for="${id}">${label}</label>
      ${hint ? `<p class="gr-field__hint" id="${id}-hint">${hint}</p>` : ''}
      ${control}
      ${error ? `<p class="gr-field__error" id="${id}-error">${error}</p>` : ''}
    </div>`;
};

const page = (...fields) =>
  `<div class="catalog-page gr-stack" data-gap="loose" style="max-inline-size: 28rem">${fields.join('')}</div>`;

export const Default = {
  render: () =>
    page(field({ id: 'default', label: 'Full name', attrs: 'type="text" value="Ada Lovelace"' })),
};

export const WithHint = {
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

export const Invalid = {
  name: 'Invalid with error',
  render: () =>
    page(
      field({
        id: 'invalid',
        label: 'Email',
        hint: 'We only use it to sign you in.',
        error: 'Enter an address like name@example.com.',
        attrs: 'type="email" value="ada@" spellcheck="false" aria-invalid="true"',
      }),
    ),
};

export const Disabled = {
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

export const ReadOnly = {
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

export const Placeholder = {
  render: () =>
    page(
      field({
        id: 'placeholder',
        label: 'Search',
        attrs: 'type="search" placeholder="Search the docs"',
      }),
    ),
};

export const Types = {
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

/**
 * An error that appears after the page loaded (here, on blur) is only announced if its element is
 * inserted with role="alert". A pre-rendered error (see "Invalid with error") must not have one.
 */
export const DynamicError = {
  name: 'Error added on blur',
  render: () =>
    page(
      '<p class="catalog-note">Focus the field and leave it empty: the error is added and announced.</p>',
      field({ id: 'dynamic', label: 'Full name', attrs: 'type="text"' }),
    ),
  play: ({ canvasElement }) => {
    const input = canvasElement.querySelector('#dynamic');
    input.addEventListener('blur', () => {
      const error = canvasElement.querySelector('#dynamic-error');
      if (input.value) {
        error?.remove();
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        return;
      }
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', 'dynamic-error');
      if (!error) {
        input.insertAdjacentHTML(
          'afterend',
          '<p class="gr-field__error" id="dynamic-error" role="alert">Enter your name.</p>',
        );
      }
    });
  },
};

/** Tab onto the field so the keyboard focus ring (outer ring plus inner band) is on show. */
export const KeyboardFocus = {
  name: 'Keyboard focus',
  render: () =>
    page(
      '<p class="catalog-note">The first field is focused with the Tab key. Press Tab to move through the others.</p>',
      field({ id: 'focus', label: 'Full name', attrs: 'type="text" value="Ada Lovelace"' }),
      field({
        id: 'focus-invalid',
        label: 'Email',
        error: 'Enter an address like name@example.com.',
        attrs: 'type="email" value="ada@" spellcheck="false" aria-invalid="true"',
      }),
    ),
  play: async () => {
    await userEvent.tab();
  },
};
