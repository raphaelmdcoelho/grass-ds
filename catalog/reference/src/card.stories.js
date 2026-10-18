export default { title: 'Components/Card', parameters: { layout: 'fullscreen' } };

/**
 * The markup contract: .gr-card on any element (an article with an accessible name here), parts in
 * order header, media, body, footer, all optional. The title is styled by class, so the heading
 * level is the page's choice.
 */
const MEDIA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 140'%3E%3Crect width='320' height='140' fill='%234b9a1f'/%3E%3Crect y='90' width='320' height='50' fill='%232f6b10'/%3E%3Ccircle cx='250' cy='42' r='20' fill='%23f5d54a'/%3E%3C/svg%3E";

const card = ({ id, variant, title, actions, media, body, footer }) => `
  <article class="gr-card" ${variant ? `data-variant="${variant}"` : ''} aria-labelledby="${id}-title">
    ${
      title
        ? `<header class="gr-card__header">
      <h3 class="gr-card__title" id="${id}-title">${title}</h3>
      ${actions ? `<div class="gr-card__actions">${actions}</div>` : ''}
    </header>`
        : ''
    }
    ${media ? `<div class="gr-card__media"><img src="${MEDIA}" alt="" /></div>` : ''}
    ${body ? `<div class="gr-card__body">${body}</div>` : ''}
    ${footer ? `<footer class="gr-card__footer">${footer}</footer>` : ''}
  </article>`;

const page = (...content) =>
  `<div class="catalog-page gr-stack" data-gap="loose" style="max-inline-size: 28rem">${content.join('')}</div>`;

const button = (label, variant = 'primary') =>
  `<button class="gr-button" type="button" data-variant="${variant}">${label}</button>`;

const TEXT =
  '<p style="margin: 0">Cards group related content and actions. The text inside keeps the surface contrast of the theme.</p>';

export const Basic = {
  render: () => page(card({ id: 'basic', title: 'Team plan', body: TEXT })),
};

export const WithHeaderActions = {
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

export const WithFooter = {
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

export const WithMedia = {
  name: 'With media',
  render: () =>
    page(
      card({ id: 'media-top', media: true, title: 'Meadow', body: TEXT }),
      card({ id: 'media-only', media: true, body: TEXT }),
      card({ id: 'media-last', title: 'Meadow', media: true }),
    ),
};

/** Without role="article" the parts are divs: a header or footer element would become a landmark. */
export const PlainDivs = {
  name: 'As plain divs',
  render: () =>
    page(`
    <div class="gr-card">
      <div class="gr-card__header"><h3 class="gr-card__title">Plain card</h3></div>
      <div class="gr-card__body">${TEXT}</div>
      <div class="gr-card__footer">${button('Choose plan')}</div>
    </div>`),
};

export const Variants = {
  name: 'Outlined and elevated',
  render: () =>
    page(
      card({ id: 'outlined', variant: 'outlined', title: 'Outlined', body: TEXT }),
      card({ id: 'elevated', variant: 'elevated', title: 'Elevated', body: TEXT }),
    ),
};

export const Form = {
  name: 'With a form',
  render: () =>
    page(
      card({
        id: 'form',
        title: 'Sign up',
        body: `
      <form class="gr-stack" data-gap="default" onsubmit="return false">
        <div class="gr-field">
          <label class="gr-field__label" for="form-email">Email</label>
          <input class="gr-text-field" id="form-email" type="email" />
        </div>
        <div class="gr-field">
          <label class="gr-checkbox-label">
            <input class="gr-checkbox" type="checkbox" checked />
            <span>Send me product news</span>
          </label>
        </div>
      </form>`,
        footer: button('Create account'),
      }),
    ),
};

export const InAGrid = {
  name: 'In a grid',
  render: () => `
    <div class="catalog-page">
      <div class="gr-grid" style="--gr-grid-min: 14rem">
        ${card({ id: 'g1', title: 'Free', body: TEXT, footer: button('Choose') })}
        ${card({ id: 'g2', variant: 'elevated', title: 'Team', body: `${TEXT}${TEXT}${TEXT}`, footer: button('Choose') })}
        ${card({ id: 'g3', title: 'Business', media: true, body: TEXT, footer: button('Choose') })}
        ${card({ id: 'g4', title: 'No body', footer: button('Choose') })}
      </div>
    </div>`,
};
