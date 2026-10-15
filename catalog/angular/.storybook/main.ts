import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  framework: '@storybook/angular',
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y'],
  core: { disableTelemetry: true },
};

export default config;
