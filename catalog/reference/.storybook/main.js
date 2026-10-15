/** @type {import('@storybook/html-vite').StorybookConfig} */
export default {
  framework: '@storybook/html-vite',
  stories: ['../src/**/*.stories.js'],
  addons: ['@storybook/addon-a11y'],
  core: { disableTelemetry: true },
  // The Reference hosts the Catalog and composes one Storybook per implementation (ADR 0006).
  // Built, the Angular Storybook sits in ./angular next to this one (see catalog/compose.mjs); a
  // relative URL keeps the site working under any base path, such as /grass-ds/ on GitHub Pages.
  refs: (config, { configType }) => ({
    angular: {
      title: 'Angular',
      url: configType === 'DEVELOPMENT' ? 'http://localhost:6007' : './angular',
    },
  }),
};
