import '@grass-ds/tokens/tokens.css';
import '@grass-ds/css/fonts.css';
import '@grass-ds/css/grass.css';
import './catalog.css';

/** @type {import('@storybook/html-vite').Preview} */
export default {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        dynamicTitle: true,
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  initialGlobals: { theme: 'system' },
  decorators: [
    (story, { globals }) => {
      // Same switch consumers use: data-theme on <html>; absent means follow the OS.
      const root = document.documentElement;
      if (globals.theme === 'light' || globals.theme === 'dark') root.dataset.theme = globals.theme;
      else delete root.dataset.theme;
      return story();
    },
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    options: { storySort: { order: ['Foundations'] } },
  },
};
