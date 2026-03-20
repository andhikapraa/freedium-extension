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
      },
    },
  },
});
