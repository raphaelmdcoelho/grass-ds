export default { title: 'Foundations/Layout', parameters: { layout: 'fullscreen' } };

const box = (label) => `<div class="catalog-box">${label}</div>`;

export const Stack = {
  render: () => `
    <div class="catalog-page gr-stack" data-gap="loose">
      ${[undefined, 'tight', 'loose']
        .map(
          (gap) => `
        <section class="gr-stack" data-gap="tight">
          <code>.gr-stack${gap ? ` [data-gap="${gap}"]` : ''}</code>
          <div class="gr-stack" ${gap ? `data-gap="${gap}"` : ''}>${box('One')}${box('Two')}${box('Three')}</div>
        </section>`,
        )
        .join('')}
    </div>`,
};

export const Cluster = {
  render: () => `
    <div class="catalog-page gr-stack" data-gap="loose">
      <section class="gr-stack" data-gap="tight">
        <code>.gr-cluster</code>
        <div class="gr-cluster">${['Grass', 'Meadow', 'Clover', 'Fern', 'Moss', 'Sedge', 'Reed'].map(box).join('')}</div>
      </section>
      <section class="gr-stack" data-gap="tight">
        <code>.gr-cluster [data-justify="between"]</code>
        <div class="gr-cluster" data-justify="between">${box('Left')}${box('Right')}</div>
      </section>
    </div>`,
};

export const Grid = {
  render: () => `
    <div class="catalog-page gr-stack">
      <p class="catalog-note">Columns are at least 16rem wide (<code>--gr-grid-min</code>) and as many as fit: resize the window.</p>
      <div class="gr-grid">${Array.from({ length: 6 }, (_, i) => box(`Cell ${i + 1}`)).join('')}</div>
    </div>`,
};

export const Container = {
  render: () => `
    <div class="gr-container gr-stack" style="padding-block: var(--gr-layout-inset-loose)">
      <p class="catalog-note">A centred column no wider than <code>--gr-layout-container</code>, with a gutter on small screens.</p>
      ${box('Inside .gr-container')}
    </div>`,
};
