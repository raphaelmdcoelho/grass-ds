/**
 * The interaction states the drift check drives on BOTH sides of every `Components/*` story.
 *
 * One list for both Storybooks, so the Reference and the Angular story are always driven by the
 * same steps; a story that needs a state adds it here, never in one catalog only. Every
 * `Components/*` story must have an entry (an empty array says "first paint only, on purpose"), and
 * an entry for a story that no longer exists is an error.
 *
 * A state is a name plus steps, performed in order on a freshly loaded story, after its play
 * function has run. The pointer starts outside the page, so a story is never hovered by accident.
 * Each state is then captured as a full-page screenshot and compared exactly.
 *
 *   { hover: sel }       move the pointer to the centre of the element and leave it there
 *   { down: sel }        move there and press the primary button, held while the capture is taken
 *   { click: sel }       move there, press and release
 *   { clickAt: [x, y] }  press and release at a viewport position (a backdrop, say)
 *   { press: key }       press and release a key (`Tab`, `Space`, `Enter`, `Escape`)
 *   { keyDown: key }     press a key and hold it
 *   { tabTo: sel }       press Tab until the element has focus, so :focus-visible matches
 *   { expect: sel }      the selector matches at least one element
 *   { expectGone: sel }  the selector matches nothing (within two seconds)
 *
 * `sel` is a Playwright selector: CSS, optionally `>> nth=2` to pick one of several matches.
 * A selector that matches nothing on a side is reported as a failure of that side, not skipped.
 */

const s = (name, ...steps) => ({ name, steps });
const hover = (sel) => ({ hover: sel });
const down = (sel) => ({ down: sel });
const tabTo = (sel) => ({ tabTo: sel });

const BUTTON = '.gr-button';
const nth = (sel, index) => `${sel} >> nth=${index}`;
/** Hover and held-down states of the first four buttons (default primary, primary, secondary, danger). */
const pressStates = (sel, count, labels) =>
  labels
    .slice(0, count)
    .flatMap((label, i) => [
      s(`hover ${label}`, hover(nth(sel, i))),
      s(`active ${label}`, down(nth(sel, i))),
    ]);

const FIELD = '.gr-text-field';
const CHECKBOX = '.gr-checkbox';

/** Dialog: Escape and the backdrop are exercised by the stories that make them meaningful. */
const dialogButtons = [
  s('hover first footer button', hover(nth('.gr-dialog__footer .gr-button', 0))),
  s('hover last footer button', hover(nth('.gr-dialog__footer .gr-button', -1))),
  s('active last footer button', down(nth('.gr-dialog__footer .gr-button', -1))),
  s('keyboard focus 1', { press: 'Tab' }),
  s('keyboard focus 2', { press: 'Tab' }, { press: 'Tab' }),
];

export const STATES = {
  'components-button--variants': pressStates(BUTTON, 4, [
    'default',
    'primary',
    'secondary',
    'danger',
  ]),
  'components-button--disabled': [
    s('hover disabled', hover(nth('[disabled]', 0))),
    s('hover disabled danger', hover(nth('[disabled]', 2))),
    s('hover aria-disabled', hover(nth('[aria-disabled=true]', 0))),
    s('active aria-disabled', down(nth('[aria-disabled=true]', 0))),
    s('hover aria-disabled danger', hover(nth('[aria-disabled=true]', 2))),
    s('keyboard focus aria-disabled', tabTo(nth('[aria-disabled=true]', 1))),
  ],
  'components-button--as-link': [
    s('hover link', hover(nth('a.gr-button', 0))),
    s('hover danger link', hover(nth('a.gr-button', 2))),
    s('active link', down(nth('a.gr-button', 1))),
    s('hover disabled link', hover(nth('a.gr-button', 3))),
    s('keyboard focus link', tabTo(nth('a.gr-button', 1))),
  ],
  'components-button--keyboard-focus': [
    s('hover focused primary', hover(nth(BUTTON, 0))),
    s('active by keyboard', { keyDown: 'Space' }),
    s('focus secondary', { press: 'Tab' }),
    s('focus danger', { press: 'Tab' }, { press: 'Tab' }),
    s('hover focused danger', tabTo(nth(BUTTON, 2)), hover(nth(BUTTON, 2))),
  ],

  'components-textfield--default': [
    s('hover', hover(FIELD)),
    s('keyboard focus', tabTo(FIELD)),
    s('pointer focus', { click: FIELD }),
    s('hover and focus', tabTo(FIELD), hover(FIELD)),
  ],
  'components-textfield--with-hint': [s('hover', hover(FIELD)), s('keyboard focus', tabTo(FIELD))],
  'components-textfield--invalid': [
    s('hover invalid', hover(FIELD)),
    s('invalid and keyboard focus', tabTo(FIELD)),
    s('invalid, hover and focus', tabTo(FIELD), hover(FIELD)),
  ],
  'components-textfield--disabled': [
    s('hover disabled', hover(nth(FIELD, 0))),
    s('hover disabled empty', hover(nth(FIELD, 1))),
  ],
  'components-textfield--read-only': [
    s('hover read-only', hover(FIELD)),
    s('keyboard focus read-only', tabTo(FIELD)),
  ],
  'components-textfield--placeholder': [
    s('hover', hover(FIELD)),
    s('keyboard focus', tabTo(FIELD)),
  ],
  'components-textfield--types': [
    s('keyboard focus number', tabTo('#type-number')),
    s('keyboard focus textarea', tabTo('#type-textarea')),
    s('hover textarea', hover('#type-textarea')),
  ],
  'components-textfield--dynamic-error': [
    s('focused', { click: '#dynamic' }),
    s('error added on blur', { click: '#dynamic' }, { press: 'Tab' }, { expect: '#dynamic-error' }),
    s(
      'error added, field focused again',
      { click: '#dynamic' },
      { press: 'Tab' },
      tabTo('#dynamic'),
    ),
  ],
  'components-textfield--keyboard-focus': [
    s('hover focused', hover('#focus')),
    s('focus invalid', tabTo('#focus-invalid')),
    s('hover invalid', hover('#focus-invalid')),
  ],

  'components-checkbox--unchecked': [
    s('hover', hover(CHECKBOX)),
    s('hover label text', hover('.gr-checkbox-label span')),
    s('active', down(CHECKBOX)),
    s('keyboard focus', tabTo(CHECKBOX)),
    s('toggled by click', { click: CHECKBOX }),
    s('toggled by Space', tabTo(CHECKBOX), { press: 'Space' }),
  ],
  'components-checkbox--checked': [
    s('hover checked', hover(CHECKBOX)),
    s('active checked', down(CHECKBOX)),
    s('unchecked by click', { click: CHECKBOX }),
  ],
  'components-checkbox--indeterminate': [
    s('hover mixed', hover(CHECKBOX)),
    s('active mixed', down(CHECKBOX)),
    s('keyboard focus mixed', tabTo(CHECKBOX)),
    s('mixed toggled', { click: CHECKBOX }),
  ],
  'components-checkbox--disabled': [
    s('hover disabled', hover(nth(CHECKBOX, 0))),
    s('hover disabled checked', hover(nth(CHECKBOX, 1))),
    s('hover disabled mixed', hover(nth(CHECKBOX, 2))),
    s('active disabled', down(nth(CHECKBOX, 0))),
  ],
  'components-checkbox--invalid': [
    s('hover invalid', hover(CHECKBOX)),
    s('invalid and keyboard focus', tabTo(CHECKBOX)),
    s('invalid, checked by click', { click: CHECKBOX }),
  ],
  'components-checkbox--with-hint': [
    s('hover', hover(CHECKBOX)),
    s('keyboard focus', tabTo(CHECKBOX)),
  ],
  'components-checkbox--group': [
    s('hover checked item', hover(nth(CHECKBOX, 0))),
    s('hover unchecked item', hover(nth(CHECKBOX, 1))),
    s('keyboard focus last', tabTo(nth(CHECKBOX, 2))),
    s('clicked last', { click: nth(CHECKBOX, 2) }),
  ],
  'components-checkbox--keyboard-focus': [
    s('toggled by Space', { press: 'Space' }),
    s('hover focused', hover(nth(CHECKBOX, 0))),
    s('active by keyboard', { keyDown: 'Space' }),
    s('focus checked', tabTo(nth(CHECKBOX, 1))),
    s('focus checked, hover', tabTo(nth(CHECKBOX, 1)), hover(nth(CHECKBOX, 1))),
  ],

  'components-card--basic': [],
  'components-card--with-header-actions': [
    s('hover secondary action', hover(nth(BUTTON, 0))),
    s('hover danger action', hover(nth(BUTTON, 1))),
    s('active danger action', down(nth(BUTTON, 1))),
    s('keyboard focus action', tabTo(nth(BUTTON, 1))),
  ],
  'components-card--with-footer': [
    s('hover primary', hover(nth(BUTTON, 0))),
    s('hover secondary', hover(nth(BUTTON, 1))),
    s('active primary', down(nth(BUTTON, 0))),
    s('keyboard focus', tabTo(nth(BUTTON, 1))),
  ],
  'components-card--with-media': [],
  'components-card--plain-divs': [
    s('hover button', hover(BUTTON)),
    s('keyboard focus', tabTo(BUTTON)),
  ],
  'components-card--variants': [
    s('hover outlined card', hover(nth('.gr-card', 0))),
    s('hover elevated card', hover(nth('.gr-card', 1))),
  ],
  'components-card--form': [
    s('hover field', hover(FIELD)),
    s('focus field', tabTo(FIELD)),
    s('focus checkbox', tabTo(CHECKBOX)),
    s('hover checkbox', hover(CHECKBOX)),
    s('hover button', hover(BUTTON)),
    s('active button', down(BUTTON)),
    s('focus button', tabTo(BUTTON)),
  ],
  'components-card--in-a-grid': [],

  'components-dialog--basic': [
    ...dialogButtons,
    s('Escape closes', { press: 'Escape' }, { expectGone: 'dialog[open]' }),
    s('backdrop click does not close', { clickAt: [4, 4] }, { expect: 'dialog[open]' }),
    s('click inside does not close', { click: '.gr-dialog__title' }, { expect: 'dialog[open]' }),
  ],
  'components-dialog--small': [
    s('hover last footer button', hover(nth('.gr-dialog__footer .gr-button', -1))),
  ],
  'components-dialog--large': [s('keyboard focus 1', { press: 'Tab' })],
  'components-dialog--form-with-return-value': [
    s('hover Invite', hover(nth('.gr-dialog__footer .gr-button', 1))),
    s('active Invite', down(nth('.gr-dialog__footer .gr-button', 1))),
    s('focus email', tabTo('#form-email')),
    s('hover email', hover('#form-email')),
    s('focus checkbox', tabTo(CHECKBOX)),
    s('hover checkbox', hover(CHECKBOX)),
    s('focus Invite', tabTo(nth('.gr-dialog__footer .gr-button', 1))),
    s(
      'Invite returns "invite"',
      { click: nth('.gr-dialog__footer .gr-button', 1) },
      { expectGone: 'dialog[open]' },
    ),
    s(
      'Cancel returns "cancel"',
      { click: nth('.gr-dialog__footer .gr-button', 0) },
      { expectGone: 'dialog[open]' },
    ),
  ],
  'components-dialog--long-content': [
    s('focus body (scrollable)', tabTo('.gr-dialog__body')),
    s('hover Accept', hover(nth('.gr-dialog__footer .gr-button', 1))),
    s('keyboard focus 2', { press: 'Tab' }, { press: 'Tab' }),
  ],
  'components-dialog--destructive-confirm': [
    s('hover Delete', hover(nth('.gr-dialog__footer .gr-button', 1))),
    s('active Delete', down(nth('.gr-dialog__footer .gr-button', 1))),
    s('keyboard focus Delete', tabTo(nth('.gr-dialog__footer .gr-button', 1))),
  ],
  'components-dialog--close-on-backdrop-click': [
    s('backdrop click closes', { clickAt: [4, 4] }, { expectGone: 'dialog[open]' }),
    s('click inside does not close', { click: '.gr-dialog__title' }, { expect: 'dialog[open]' }),
    s('hover Close', hover('.gr-dialog__footer .gr-button')),
  ],
};
