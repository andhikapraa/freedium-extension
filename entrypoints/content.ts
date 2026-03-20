const DEFAULT_URL = 'https://freedium-mirror.cfd';

export default defineContentScript({
  matches: ['*://*.medium.com/*'],
  async main() {
    const data: Record<string, unknown> = await browser.storage.local.get([
      'enabled',
      'redirectUrl',
    ]);
    if (data.enabled === false) return;

    const target = (data.redirectUrl as string) || DEFAULT_URL;
    const targetHost = new URL(target).hostname;

    const url = new URL(window.location.href);
    url.hostname = targetHost;
    window.location.replace(url.toString());
  },
});
