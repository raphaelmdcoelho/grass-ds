import { tokensWithPrefix } from './token-list.js';

export default { title: 'Foundations/Typography', parameters: { layout: 'fullscreen' } };

export const Scale = {
  render: () => `
    <div class="catalog-page gr-stack" data-gap="loose">
      <div class="gr-stack">
        <p class="gr-display">Display, Figtree</p>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <p class="gr-lead">Lead paragraph for introductions and summaries.</p>
        <p>Body text is 16px with a 1.5 line height. Grass grows where the light is, and so does readable text:
          <a href="#">a link</a>, <strong>strong text</strong>, <code>inline code</code> and <kbd>Ctrl</kbd> + <kbd>K</kbd>.</p>
        <p class="gr-text-muted">Muted text for secondary information.</p>
        <p class="gr-text-small">Small text for captions and legal notes.</p>
        <pre><code>const grass = 'green';</code></pre>
      </div>
      <section class="gr-stack" data-gap="tight">
        <h3>Weights</h3>
        ${[300, 400, 500, 600, 700, 800, 900]
          .map((weight) => `<p style="font-weight: ${weight}">Figtree ${weight}</p>`)
          .join('')}
      </section>
      <section class="gr-stack" data-gap="tight">
        <h3>Sizes</h3>
        ${tokensWithPrefix('--gr-text-size-')
          .map(
            ({ name }) =>
              `<div class="catalog-row"><span class="catalog-swatch__name">${name.replace('--gr-text-size-', '')}</span><span style="font-size: var(${name})">Sphinx of black quartz</span></div>`,
          )
          .join('')}
      </section>
    </div>`,
};
