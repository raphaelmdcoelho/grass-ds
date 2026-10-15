/** @type {import('@storybook/html-vite').StorybookConfig} */
export default {
  framework: '@storybook/html-vite',
  stories: ['../src/**/*.stories.js'],
  addons: ['@storybook/addon-a11y'],
  core: { disableTelemetry: true },
};
