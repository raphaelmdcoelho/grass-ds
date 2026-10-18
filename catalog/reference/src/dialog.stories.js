export default { title: 'Components/Dialog', parameters: { layout: 'fullscreen' } };

/**
 * The markup contract: a native <dialog class="gr-dialog"> opened with showModal(), named by
 * aria-labelledby on its title (the heading level is the page's choice). The browser owns Escape,
 * the backdrop, the inert page behind and moving focus in and back to the trigger. Every story opens
 * its dialog on load so that it can be seen and compared; a real page opens it from a user action.
 */
const TEXT =
  '<p style="margin: 0">Dialogs interrupt the page to ask for a decision. The text inside keeps the surface contrast of the theme.</p>';

const button = (label, variant = 'primary', extra = '') =>
  `<button class="gr-button" ${extra.includes('type=') ? '' : 'type="button"'} data-variant="${variant}" ${extra}>${label}</button>`;

const dialog = ({ id, size, closedby, title, body, footer, form = false }) => {
  const header = `<div class="gr-dialog__header"><h2 class="gr-dialog__title" id="${id}-title">${title}</h2></div>`;
  const content = `<div class="gr-dialog__body">${body}</div>`;
  const actions = (tag) =>
    `<${tag} class="gr-dialog__footer" ${tag === 'form' ? 'method="dialog"' : ''}>${footer}</${tag}>`;
  return `
  <dialog class="gr-dialog" id="${id}" aria-labelledby="${id}-title" ${size ? `data-size="${size}"` : ''} ${closedby ? `closedby="${closedby}"` : ''}>
    ${header}
    ${form ? `<form method="dialog">${content}${actions('div')}</form>` : `${content}${actions('form')}`}
  </dialog>`;
};

const page = (id, ...content) => `
  <div class="catalog-page gr-stack" data-gap="loose" style="max-inline-size: 40rem">
    <p style="margin: 0">The page behind the dialog. Press Escape to close it, then use the button to open it again.</p>
    <div>${button('Open dialog', 'primary', `data-opens="${id}"`)}</div>
    ${content.join('')}
  </div>`;

/** Wires the trigger (what a page's own script does) and opens the dialog for the screenshot. */
const open = async ({ canvasElement }) => {
  for (const trigger of canvasElement.querySelectorAll('[data-opens]'))
    trigger.addEventListener('click', () =>
      canvasElement.querySelector(`#${trigger.dataset.opens}`).showModal(),
    );
  for (const form of canvasElement.querySelectorAll('dialog form[method=dialog]'))
    form.closest('dialog').addEventListener('close', (event) => {
      const output = canvasElement.querySelector('output');
      if (output) output.textContent = event.target.returnValue || 'nothing';
    });
  canvasElement.querySelector('dialog').showModal();
};

const actionsOk = `${button('Cancel', 'secondary', 'type="submit" value="cancel"')}${button('Save', 'primary', 'type="submit" value="save"')}`;

export const Basic = {
  render: () =>
    page('basic', dialog({ id: 'basic', title: 'Edit profile', body: TEXT, footer: actionsOk })),
  play: open,
};

export const Small = {
  render: () =>
    page(
      'small',
      dialog({ id: 'small', size: 'sm', title: 'Small dialog', body: TEXT, footer: actionsOk }),
    ),
  play: open,
};

export const Large = {
  render: () =>
    page(
      'large',
      dialog({
        id: 'large',
        size: 'lg',
        title: 'Large dialog',
        body: TEXT + TEXT,
        footer: actionsOk,
      }),
    ),
  play: open,
};

/** The form wraps body and footer; the button that submits it sets returnValue. */
export const FormWithReturnValue = {
  name: 'Form with a return value',
  render: () =>
    page(
      'form',
      dialog({
        id: 'form',
        form: true,
        title: 'Invite a teammate',
        body: `
      <div class="gr-stack" data-gap="default">
        <div class="gr-field">
          <label class="gr-field__label" for="form-email">Email</label>
          <input class="gr-text-field" id="form-email" type="email" autocomplete="off" />
        </div>
        <div class="gr-field">
          <label class="gr-checkbox-label">
            <input class="gr-checkbox" type="checkbox" checked />
            <span>Send a welcome message</span>
          </label>
        </div>
      </div>`,
        footer: `${button('Cancel', 'secondary', 'type="submit" value="cancel" formnovalidate')}${button('Invite', 'primary', 'type="submit" value="invite"')}`,
      }) + '<p style="margin: 0">Closed with: <output>nothing</output></p>',
    ),
  play: open,
};

export const LongContent = {
  name: 'Long scrolling content',
  render: () =>
    page(
      'long',
      dialog({
        id: 'long',
        title: 'Terms of service',
        body: Array.from(
          { length: 14 },
          (_, i) =>
            `<p style="margin: 0 0 1rem">Section ${i + 1}. Dialogs interrupt the page to ask for a decision. The text inside keeps the surface contrast of the theme.</p>`,
        ).join(''),
        footer: `${button('Decline', 'secondary', 'type="submit" value="decline"')}${button('Accept', 'primary', 'type="submit" value="accept"')}`,
      }),
    ),
  play: open,
};

/** The safe choice has autofocus, so a stray Enter cancels instead of deleting. */
export const DestructiveConfirm = {
  name: 'Destructive confirmation',
  render: () =>
    page(
      'destructive',
      dialog({
        id: 'destructive',
        size: 'sm',
        title: 'Delete project?',
        body: '<p style="margin: 0">This permanently deletes “Meadow” and its 12 files. This cannot be undone.</p>',
        footer: `${button('Cancel', 'secondary', 'type="submit" value="cancel" autofocus')}${button('Delete project', 'danger', 'type="submit" value="delete"')}`,
      }),
    ),
  play: open,
};

/** closedby="any" also closes on a click outside, where the browser supports it. */
export const CloseOnBackdropClick = {
  name: 'Closes on backdrop click',
  render: () =>
    page(
      'backdrop',
      dialog({
        id: 'backdrop',
        closedby: 'any',
        title: 'Quick look',
        body: '<p style="margin: 0">Click outside this dialog to close it.</p>',
        footer: button('Close', 'secondary', 'type="submit" value="close"'),
      }),
    ),
  play: open,
};
