const DEFAULT_URL = 'https://freedium-mirror.cfd';

export default defineBackground(() => {
  let enabled = true;
  let redirectHost = new URL(DEFAULT_URL).hostname;

  // Load initial state
  browser.storage.local
    .get(['enabled', 'redirectUrl'])
    .then((data: Record<string, unknown>) => {
      if (typeof data.enabled === 'boolean') enabled = data.enabled;
      if (typeof data.redirectUrl === 'string') {
        redirectHost = new URL(data.redirectUrl).hostname;
      }
    });

  // Keep in sync when popup changes settings
  browser.storage.onChanged.addListener((changes) => {
    if (changes.enabled) enabled = changes.enabled.newValue as boolean;
    if (changes.redirectUrl) {
      redirectHost = new URL(changes.redirectUrl.newValue as string).hostname;
    }
  });

  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (!enabled) return {};

      const url = new URL(details.url);
      url.hostname = redirectHost;

      // Increment redirect count
      browser.storage.local
        .get('redirectCount')
        .then((d: Record<string, unknown>) => {
          const count = ((d.redirectCount as number) || 0) + 1;
          browser.storage.local.set({ redirectCount: count });
        });

      return { redirectUrl: url.toString() };
    },
    { urls: ['*://*.medium.com/*'], types: ['main_frame'] },
    ['blocking'],
  );
});
