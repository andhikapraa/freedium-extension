import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Freedium',
    description: 'Redirect Medium articles to Freedium for free reading',
    permissions: ['webRequest', 'webRequestBlocking', 'storage'],
    host_permissions: ['*://*.medium.com/*'],
    browser_specific_settings: {
      gecko: {
        id: 'freedium@extension',
        // Firefox/Zen poll this daily; `pnpm release <version>` keeps it current.
        update_url:
          'https://raw.githubusercontent.com/andhikapraa/freedium-extension/main/updates.json',
      },
    },
  },
});
