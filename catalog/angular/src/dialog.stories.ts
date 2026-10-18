import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { GR_DIALOG, GrButton } from '@grass-ds/angular';
import { GrCheckbox } from '@grass-ds/angular/checkbox';
import { GrTextField } from '@grass-ds/angular/text-field';

// Mirrors catalog/reference/src/dialog.stories.js: same title, story names and visible output.
const meta: Meta = {
  title: 'Components/Dialog',
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj;

const TEXT =
  '<p style="margin: 0">Dialogs interrupt the page to ask for a decision. The text inside keeps the surface contrast of the theme.</p>';

const button = (label: string, variant = 'primary', extra = '') =>
  `<button grButton variant="${variant}" ${extra}>${label}</button>`;

interface DialogOptions {
  size?: string;
  closedby?: boolean;
  title: string;
  body: string;
  footer: string;
  form?: boolean;
  closed?: string;
}

// The Angular side of the same contract: <gr-dialog>, opened on load by [open]="true" and reopened
// by the trigger through a template reference.
const dialog = ({ size, closedby, title, body, footer, form = false, closed }: DialogOptions) => `
  <gr-dialog #d [open]="true" ${size ? `size="${size}"` : ''} ${closedby ? 'closeOnBackdrop' : ''} ${closed ? `(closed)="${closed}"` : ''}>
    <div grDialogHeader><h2 grDialogTitle>${title}</h2></div>
    ${
      form
        ? `<form method="dialog"><div grDialogBody>${body}</div><div grDialogFooter>${footer}</div></form>`
        : `<div grDialogBody>${body}</div><form method="dialog" grDialogFooter>${footer}</form>`
    }
  </gr-dialog>`;

// A template reference is visible to the whole template, so the trigger can sit before the dialog.
const page = (content: string, extra: Record<string, unknown> = {}) => ({
  moduleMetadata: { imports: [GR_DIALOG, GrButton, GrTextField, GrCheckbox] },
  props: extra,
  template: `
  <div class="catalog-page gr-stack" data-gap="loose" style="max-inline-size: 40rem">
    <p style="margin: 0">The page behind the dialog. Press Escape to close it, then use the button to open it again.</p>
    <div><button grButton (click)="d.showModal()">Open dialog</button></div>
    ${content}
  </div>`,
});

// storyRendered must not fire before the dialog is open: showModal runs after the first render.
const opened: Story['play'] = async ({ canvasElement }) => {
  for (let i = 0; i < 200 && !canvasElement.querySelector('dialog[open]'); i++)
    await new Promise((resolve) => setTimeout(resolve, 10));
};

const actionsOk = `${button('Cancel', 'secondary', 'type="submit" value="cancel"')}${button('Save', 'primary', 'type="submit" value="save"')}`;

export const Basic: Story = {
  render: () => page(dialog({ title: 'Edit profile', body: TEXT, footer: actionsOk })),
  play: opened,
};

export const Small: Story = {
  render: () => page(dialog({ size: 'sm', title: 'Small dialog', body: TEXT, footer: actionsOk })),
  play: opened,
};

export const Large: Story = {
  render: () =>
    page(dialog({ size: 'lg', title: 'Large dialog', body: TEXT + TEXT, footer: actionsOk })),
  play: opened,
};

export const FormWithReturnValue: Story = {
  name: 'Form with a return value',
  render: () =>
    page(
      dialog({
        form: true,
        closed: "result.set($event || 'nothing')",
        title: 'Invite a teammate',
        body: `
      <div class="gr-stack" data-gap="default">
        <div class="gr-field">
          <label class="gr-field__label" for="form-email">Email</label>
          <input grTextField id="form-email" type="email" autocomplete="off" />
        </div>
        <div class="gr-field">
          <label class="gr-checkbox-label">
            <input grCheckbox type="checkbox" checked />
            <span>Send a welcome message</span>
          </label>
        </div>
      </div>`,
        footer: `${button('Cancel', 'secondary', 'type="submit" value="cancel" formnovalidate')}${button('Invite', 'primary', 'type="submit" value="invite"')}`,
      }) + '<p style="margin: 0">Closed with: <output>{{ result() }}</output></p>',
      { result: signal('nothing') },
    ),
  play: opened,
};

export const LongContent: Story = {
  name: 'Long scrolling content',
  render: () =>
    page(
      dialog({
        title: 'Terms of service',
        body: Array.from(
          { length: 14 },
          (_, i) =>
            `<p style="margin: 0 0 1rem">Section ${i + 1}. Dialogs interrupt the page to ask for a decision. The text inside keeps the surface contrast of the theme.</p>`,
        ).join(''),
        footer: `${button('Decline', 'secondary', 'type="submit" value="decline"')}${button('Accept', 'primary', 'type="submit" value="accept"')}`,
      }),
    ),
  play: opened,
};

export const DestructiveConfirm: Story = {
  name: 'Destructive confirmation',
  render: () =>
    page(
      dialog({
        size: 'sm',
        title: 'Delete project?',
        body: '<p style="margin: 0">This permanently deletes “Meadow” and its 12 files. This cannot be undone.</p>',
        footer: `${button('Cancel', 'secondary', 'type="submit" value="cancel" autofocus')}${button('Delete project', 'danger', 'type="submit" value="delete"')}`,
      }),
    ),
  play: opened,
};

export const CloseOnBackdropClick: Story = {
  name: 'Closes on backdrop click',
  render: () =>
    page(
      dialog({
        closedby: true,
        title: 'Quick look',
        body: '<p style="margin: 0">Click outside this dialog to close it.</p>',
        footer: button('Close', 'secondary', 'type="submit" value="close"'),
      }),
    ),
  play: opened,
};
