# Freedium Firefox Extension - Research & Implementation Guide

> Research compiled 2026-03-20 from MDN, Firefox Extension Workshop, Mozilla Add-ons Blog,
> WXT/Plasmo/CRXJS documentation, and community sources via Exa and Context7.

---

## Table of Contents

1. [Decision: Use WXT Framework](#1-decision-use-wxt-framework)
2. [Firefox Manifest V3 Architecture](#2-firefox-manifest-v3-architecture)
3. [Project Structure (WXT)](#3-project-structure-wxt)
4. [Getting Started](#4-getting-started)
5. [Manifest Configuration](#5-manifest-configuration)
6. [Background Scripts](#6-background-scripts)
7. [Content Scripts](#7-content-scripts)
8. [Message Passing](#8-message-passing)
9. [Storage](#9-storage)
10. [Security](#10-security)
11. [Cross-Browser Compatibility](#11-cross-browser-compatibility)
12. [TypeScript Setup](#12-typescript-setup)
13. [Testing](#13-testing)
14. [Debugging](#14-debugging)
15. [Publishing to AMO](#15-publishing-to-amo)
16. [Common Pitfalls](#16-common-pitfalls)

---

## 1. Decision: Use WXT Framework

**WXT** (wxt.dev) is the recommended framework based on comparative analysis:

| Criteria | WXT | Plasmo | CRXJS | Vanilla |
|---|---|---|---|---|
| Actively maintained | Yes | Maintenance mode | Partial | N/A |
| Firefox MV3 support | First-class | Experimental | None | Manual |
| Bundler | Vite (fast) | Parcel (slower) | Vite | Manual |
| Framework-agnostic | Yes | React-first | Yes | Yes |
| HMR | Yes | Partial | Yes | No |
| Auto-opens browser | Yes | No | No | No |
| Firefox Sources ZIP | Yes | No | No | No |
| Content Script UI helpers | Yes | Yes | No | No |
| Uses web-ext internally | Yes | No | No | Manual |

**Why WXT wins for Freedium:**
- Best Firefox support of any framework
- Vite-based = fast builds
- File-based entrypoints = auto-generated manifest
- Built-in cross-browser support if we ever target Chrome too
- Auto-generates Firefox Sources ZIP required by AMO for review
- Active maintenance (~5K+ stars, 230 contributors, latest release March 2026)

---

## 2. Firefox Manifest V3 Architecture

### MV3 Status in Firefox
- **GA since Firefox 109** (January 2023). Both MV2 and MV3 supported side-by-side.
- Mozilla has **not** announced plans to remove MV2 (unlike Chrome).
- Firefox preserves **blocking `webRequest`** in MV3 (Chrome removed it).

### Key Differences: Firefox vs Chrome MV3

| Aspect | Firefox MV3 | Chrome MV3 |
|---|---|---|
| Background | **Event Pages** (`background.scripts`) with DOM, `window`, full Web APIs | Service Workers only (no DOM) |
| API namespace | `browser.*` (Promise-based) | `chrome.*` |
| Blocking webRequest | Supported | Removed (use `declarativeNetRequest`) |
| Sidebar | `browser.sidebarAction` (exclusive) | Not available |
| Extension ID | Required via `browser_specific_settings.gecko.id` | Auto-assigned |
| Persistent background | Forbidden (`persistent: true` not allowed in MV3) | Forbidden |

### Cross-Browser Background Manifest Trick
Works on Chrome 121+ and Firefox 121+:
```json
"background": {
  "scripts": ["background.js"],
  "service_worker": "background.js"
}
```
Each browser ignores the key it doesn't understand. WXT handles this automatically.

---

## 3. Project Structure (WXT)

```
freedium-extension/
  wxt.config.ts              # WXT config: manifest overrides, plugins, permissions
  web-ext.config.ts           # Browser startup config (gitignored, personal prefs)
  package.json
  tsconfig.json
  entrypoints/
    background.ts             # Background event page / service worker
    content.ts                # Content script (or content/index.ts for multi-file)
    popup/
      index.html              # Popup HTML shell
      main.tsx                # React/Vue/Svelte entry (or main.ts for vanilla)
      App.tsx                 # Main popup component
      style.css
    options/
      index.html
      main.tsx
    sidepanel.html            # Side panel (Chrome) / sidebar (Firefox)
  components/                 # Shared UI components
  utils/                      # Shared utilities
  public/
    icon/                     # Extension icons (auto-detected by WXT)
      16.png
      32.png
      48.png
      96.png
      128.png
  assets/                     # CSS, images bundled by Vite
  docs/
    firefox-extension-research.md  # This file
```

### Entrypoint File Conventions (WXT)
WXT uses **file-based routing** for entrypoints. Drop files in `entrypoints/` and WXT auto-generates the manifest:

| File | Manifest Result |
|---|---|
| `entrypoints/background.ts` | `background.scripts` / `background.service_worker` |
| `entrypoints/content.ts` | `content_scripts` entry |
| `entrypoints/popup/index.html` | `action.default_popup` |
| `entrypoints/options/index.html` | `options_ui.page` |
| `entrypoints/sidepanel.html` | `sidebar_action` (Firefox) / `side_panel` (Chrome) |
| `entrypoints/newtab/index.html` | `chrome_url_overrides.newtab` |

---

## 4. Getting Started

### Initialize Project
```bash
npx wxt@latest init freedium-extension --template vanilla
# Or with a framework:
# npx wxt@latest init freedium-extension --template react
# npx wxt@latest init freedium-extension --template vue
# npx wxt@latest init freedium-extension --template svelte

cd freedium-extension
npm install
```

### Development
```bash
npm run dev                    # Opens Firefox with extension loaded + HMR
npm run dev:firefox            # Explicit Firefox target
npm run dev:chrome             # Chrome target
```

### Build
```bash
npm run build                  # Production build (default browser)
npm run build:firefox          # Firefox-specific build
wxt build --browser firefox    # Direct WXT command
```

### Key WXT Config
```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  // Use a frontend framework module (pick one):
  // modules: ['@wxt-dev/module-react'],
  // modules: ['@wxt-dev/module-vue'],
  // modules: ['@wxt-dev/module-svelte'],

  manifest: {
    name: 'Freedium',
    description: 'Freedium browser extension',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['*://medium.com/*'],
    browser_specific_settings: {
      gecko: {
        id: 'freedium@example.com',
        strict_min_version: '109.0',
      },
    },
  },
});
```

---

## 5. Manifest Configuration

### Required Firefox Fields

```json
{
  "manifest_version": 3,
  "name": "Freedium",
  "version": "1.0.0",
  "description": "...",
  "browser_specific_settings": {
    "gecko": {
      "id": "freedium@example.com",
      "strict_min_version": "109.0"
    }
  }
}
```

**`browser_specific_settings.gecko.id`** is required for:
- AMO submission
- `storage.sync` to work during development
- Storage persistence across reloads

**Version format**: 1-4 numbers separated by dots (e.g., `1.2.3.4`). No letters. Each number up to 9 digits, no leading zeros.

### Permissions Strategy

```json
{
  "permissions": ["storage", "activeTab"],
  "optional_permissions": ["tabs", "notifications"],
  "host_permissions": ["*://medium.com/*"],
  "optional_host_permissions": ["*://*.medium.com/*"]
}
```

**Rules:**
- Request **minimal** permissions. Each one triggers an install prompt.
- Use `activeTab` instead of `<all_urls>` when possible.
- Use `optional_permissions` for non-core features (requested at runtime via `browser.permissions.request()`).
- In MV3, host permissions are separate from API permissions.
- From Firefox 127+, users can individually grant/revoke host permissions.

### Content Security Policy (MV3)
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; upgrade-insecure-requests;"
  }
}
```
MV3 only allows `'self'` and `'wasm-unsafe-eval'` in `script-src`. Remote scripts, `eval()`, and inline JS are forbidden. Do not weaken the default CSP.

### Web Accessible Resources (MV3)
```json
{
  "web_accessible_resources": [{
    "resources": ["images/*", "styles/*"],
    "matches": ["*://medium.com/*"]
  }]
}
```

---

## 6. Background Scripts

### Key Rules for MV3 Background Scripts
1. **Non-persistent by default** — the background context can be terminated at any time.
2. **Register all event listeners synchronously** at the top level on every startup.
3. **Never store state in global variables** — use `browser.storage.session` or `browser.storage.local`.
4. **Use `browser.alarms`** instead of `setTimeout`/`setInterval`.
5. Firefox event pages retain DOM, `window`, `XMLHttpRequest` (unlike Chrome service workers).

### Example (WXT)
```typescript
// entrypoints/background.ts
export default defineBackground(() => {
  // Register listeners at top level (synchronous)
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      console.log('Extension installed');
    }
  });

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'FETCH_ARTICLE') {
      return fetchArticle(message.url);
    }
  });

  // Use alarms, not setTimeout
  browser.alarms.create('periodic-check', { periodInMinutes: 30 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'periodic-check') {
      // do periodic work
    }
  });
});

async function fetchArticle(url: string) {
  // business logic here
}
```

---

## 7. Content Scripts

### Declaration in WXT
```typescript
// entrypoints/content.ts
export default defineContentScript({
  matches: ['*://medium.com/*', '*://*.medium.com/*'],
  runAt: 'document_idle',   // Don't block page load
  allFrames: false,          // Only main frame unless needed
  main() {
    console.log('Freedium content script loaded on', window.location.href);
    // DOM manipulation here
  },
});
```

### Performance Best Practices
- **`runAt: 'document_idle'`** — avoids blocking page load.
- **Narrow `matches` patterns** — e.g., `*://medium.com/*` not `<all_urls>`.
- **`MutationObserver`** over `setInterval` for DOM monitoring (CPU: ~0.02% vs ~1.8%).
- **`allFrames: false`** unless iframes are needed.

### Content Script Isolation
- Content scripts share the page's **DOM** but not its **JavaScript environment**.
- Cannot access page variables directly; page cannot access content script variables.
- For injected UI, use **Shadow DOM** for CSS isolation (WXT provides `createShadowRootUi()` helper).

### Shadow Root UI (WXT)
```typescript
// entrypoints/content.ts
import { createShadowRootUi } from 'wxt/client';

export default defineContentScript({
  matches: ['*://medium.com/*'],
  cssInjectionMode: 'ui',
  main(ctx) {
    const ui = createShadowRootUi(ctx, {
      name: 'freedium-overlay',
      position: 'inline',
      onMount(container) {
        // Mount React/Vue/Svelte component or vanilla DOM
        container.innerHTML = '<div class="freedium-badge">Read free</div>';
      },
    });
    ui.mount();
  },
});
```

---

## 8. Message Passing

### One-Time Messages (Most Common)

**Content script -> Background:**
```typescript
// content script
const response = await browser.runtime.sendMessage({
  type: 'FETCH_ARTICLE',
  url: window.location.href,
});

// background
browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'FETCH_ARTICLE') {
    return fetchArticle(message.url); // Return a Promise
  }
});
```

**Background -> Content script:**
```typescript
const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
const response = await browser.tabs.sendMessage(tab.id!, {
  type: 'UPDATE_UI',
  data: { articleContent: '...' },
});
```

### Typed Message Pattern (Recommended)
```typescript
// utils/messages.ts
export type MessageType =
  | { type: 'FETCH_ARTICLE'; url: string }
  | { type: 'UPDATE_UI'; data: { articleContent: string } }
  | { type: 'GET_STATUS' };

export type MessageResponse<T extends MessageType['type']> =
  T extends 'FETCH_ARTICLE' ? { content: string } :
  T extends 'GET_STATUS' ? { active: boolean } :
  void;
```

### Best Practices
- Use typed `{ type, data }` message objects for dispatching.
- Return a **Promise** from `onMessage` listeners (not `sendResponse` callback).
- Don't create multiple listeners for the same message type.
- For long-lived connections, use `browser.runtime.connect()` with named ports.

---

## 9. Storage

### Storage Areas

| Area | Persistence | Sync | Limit | Use Case |
|---|---|---|---|---|
| `storage.local` | Until deleted/uninstall | No | ~10MB (unlimited with perm) | Large data, caches |
| `storage.sync` | Until deleted | Yes (across devices) | 100KB total, 8KB/item | User preferences |
| `storage.session` | Browser session only | No | 10MB | Temporary state |

### Usage
```typescript
// Save
await browser.storage.local.set({
  userPreferences: { theme: 'dark' },
  cachedArticles: { '/article-1': '...' },
});

// Retrieve
const { userPreferences } = await browser.storage.local.get('userPreferences');

// Listen for changes (reactive)
browser.storage.onChanged.addListener((changes, areaName) => {
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`${areaName}.${key} changed`);
  }
});
```

### WXT Storage Wrapper
WXT provides a typed storage API:
```typescript
import { storage } from 'wxt/storage';

const theme = storage.defineItem<string>('local:theme', { fallback: 'light' });
const value = await theme.getValue();
await theme.setValue('dark');
```

### Rules
- **Never use `window.localStorage`** — Firefox clears it when users clear browsing data, but `browser.storage.local` is preserved.
- **`storage.sync` requires `browser_specific_settings.gecko.id`** in manifest.
- Storage is **not encrypted** — don't store secrets.
- Use `storage.session` for state that should not persist across browser restarts.

---

## 10. Security

### Content Security Policy
- **Keep the default CSP.** Do not weaken it.
- MV3 forbids: remote scripts, `eval()`, inline JS, blob sources.
- Only `'self'` and `'wasm-unsafe-eval'` are permitted in `script-src`.
- AMO will **reject** extensions with weakened CSPs.

### XSS Prevention
1. **Never inject remote scripts.** Bundle all third-party libraries locally.
2. **Never use `innerHTML` with untrusted input.** Use `textContent`, `createElement`, `setAttribute`.
3. Use **DOMPurify** (v2.0.7+) when HTML insertion is unavoidable.
4. Use **`eslint-plugin-no-unsanitized`** to catch unsafe patterns.
5. Don't expose `moz-extension://{UUID}` to page scripts (fingerprinting risk).

### Permissions
- Request **minimal** permissions.
- Use `activeTab` over `<all_urls>`.
- Use `optional_permissions` for non-core features.
- From Firefox 140+ (November 2025): all new extensions must adopt Firefox's built-in data collection consent system.

---

## 11. Cross-Browser Compatibility

### webextension-polyfill
- Provides Promise-based `browser.*` namespace on Chrome.
- **No-op on Firefox** (browser.* already exists natively).
- WXT includes it by default.

### Strategies
1. **WXT handles most differences automatically** (manifest generation, background script config, API polyfill).
2. **Runtime feature detection** for Firefox-only APIs:
   ```typescript
   if (typeof browser.sidebarAction !== 'undefined') {
     // Firefox-only
   }
   ```
3. **Conditional code** via WXT:
   ```typescript
   if (import.meta.env.BROWSER === 'firefox') {
     // Firefox-specific logic
   }
   ```
4. **Build separate artifacts**: `wxt build --browser firefox` / `wxt build --browser chrome`.

### Key Compatibility Notes
- Firefox uses `browser_specific_settings` (Chrome ignores it).
- Firefox uses `*://*/*` where Chrome uses `<all_urls>` in some MV3 contexts.
- `runtime.onMessageExternal` is **not supported** in Firefox — use content scripts + `window.postMessage()` as intermediary.

---

## 12. TypeScript Setup

### With WXT (Zero Config)
WXT provides types automatically. No extra setup needed.

### Without WXT
```bash
npm install webextension-polyfill
npm install --save-dev @types/webextension-polyfill
```

```typescript
import browser from 'webextension-polyfill';
const tabs = await browser.tabs.query({ active: true });
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

---

## 13. Testing

### Unit Testing (Vitest)
Mock browser APIs and test logic in isolation.

```bash
npm install --save-dev vitest vitest-chrome
```

```typescript
// vitest.config.ts
export default defineConfig({
  test: { setupFiles: './vitest.init.ts' },
});

// vitest.init.ts
import * as chrome from 'vitest-chrome';
Object.assign(global, chrome);
```

**Best practice:** Separate business logic from browser API calls. Unit-test logic without mocks; only mock the `browser.*` boundary.

### Alternative Mocking Libraries
- **`jest-webextension-mock`** — for Jest users
- **`webextensions-api-fake`** — realistic fakes (storage actually stores/returns data)
- **`mockzilla-webextension`** — TypeScript-first with expectation-based API

### E2E Testing
- **Selenium WebDriver** — most established; load extension into real Firefox
- **WebdriverIO** — alternative browser automation
- **Playwright** — Chrome extension support good; Firefox extension loading limited

### Recommended Approach
1. Unit test business logic with Vitest (no browser mocks needed)
2. Unit test browser API interactions with `vitest-chrome` or `webextensions-api-fake`
3. E2E test with Selenium/WebdriverIO loading built `.xpi` into Firefox

---

## 14. Debugging

### Primary: `about:debugging`
1. Open `about:debugging` in Firefox
2. Click "This Firefox"
3. Find extension -> click **Inspect**
4. Full Toolbox: Console, Debugger, Inspector, Storage, Network

### By Component
| Component | How to Debug |
|---|---|
| Background script | Inspect from `about:debugging` |
| Content script | Regular page DevTools (F12), look under "Extensions" source group |
| Popup | Right-click popup -> "Inspect" (keep popup open) |
| Options page | Navigate to URL, use standard DevTools |

### web-ext Debugging
```bash
web-ext run --devtools              # Auto-open DevTools (Firefox 106+)
web-ext run --browser-console       # Open browser console
web-ext run --verbose               # Detailed logging
```

### Dev Tips
- Use Firefox Developer Edition or Nightly for unsigned extension testing
- Toggle `xpinstall.signatures.required` to `false` in `about:config`
- Set `keepStorageOnUninstall` and `keepUuidOnUninstall` in `about:config` to preserve data during development reloads

---

## 15. Publishing to AMO

### Signing is Mandatory
All extensions must be signed by Mozilla for release/beta Firefox. Unsigned only work in Developer Edition/Nightly with `xpinstall.signatures.required = false`.

### Channels
| Channel | Description |
|---|---|
| **Listed** | Published on addons.mozilla.org, discoverable, human-reviewed |
| **Unlisted** | Signed by Mozilla, not listed on AMO, you distribute the `.xpi` |

### CLI Signing
```bash
web-ext sign \
  --source-dir=./dist \
  --api-key=$AMO_JWT_ISSUER \
  --api-secret=$AMO_JWT_SECRET \
  --channel=listed \
  --upload-source-code=./source.zip
```

Get API credentials from: addons.mozilla.org/developers/addon/api/key/

### Source Code Requirement
If using build tools (Vite, TypeScript, etc.), you **must** provide original source code and build instructions. Reviewers need to reproduce your build. WXT auto-generates the sources ZIP.

### CI/CD (GitHub Actions)
```yaml
- name: Build extension
  run: npm run build:firefox
- name: Sign and publish
  run: |
    npx web-ext sign \
      --source-dir=./dist \
      --api-key=${{ secrets.AMO_API_KEY }} \
      --api-secret=${{ secrets.AMO_API_SECRET }} \
      --channel=listed \
      --upload-source-code=./source.zip
```

### AMO Policies
- No obfuscated code (minification OK with source submission)
- All permissions must be justified
- Third-party libraries must be identifiable
- Max upload: 200 MB
- Firefox 140+: must adopt built-in data collection consent system

---

## 16. Common Pitfalls

| Pitfall | Solution |
|---|---|
| `storage.sync` not working | Set `browser_specific_settings.gecko.id` in manifest |
| Content scripts not loading in MV3 | Check user has granted site permissions; use `*://*/*` not `<all_urls>` |
| Using `window.localStorage` | Use `browser.storage.local` instead (survives browsing data clears) |
| State lost in background script | Use `storage.session`/`storage.local`, not global variables |
| `browser is not defined` on Chrome | Ensure polyfill loads before other scripts |
| Extension data lost on dev reload | Set `keepStorageOnUninstall` in `about:config` |
| Background listeners not firing | Register all listeners synchronously at top level |
| `eval()` blocked | CSP forbids it in MV3; refactor code |
| `runtime.onMessageExternal` fails | Not supported in Firefox; use content script + `window.postMessage()` |
| Inline scripts blocked | CSP forbids inline JS in MV3; use external script files |
| Blocking `webRequest` listener can't return a Promise | Cache state in variables, sync via `storage.onChanged` listener |

---

## 17. Signing & Distribution Workflow

### Get AMO API Credentials
1. Go to https://addons.mozilla.org/developers/addon/api/key/
2. Save `JWT issuer` and `JWT secret` in a `.env` file (gitignored):
   ```
   WEB_EXT_API_KEY=user:XXXXXXX:XXX
   WEB_EXT_API_SECRET=your_secret_here
   ```

### Sign via CLI (Unlisted / Self-Distribution)
```bash
# One-command build + sign:
wxt build -b firefox && \
  export $(cat .env | xargs) && \
  npx web-ext sign \
    --source-dir .output/firefox-mv2 \
    --channel=unlisted \
    --api-key=$WEB_EXT_API_KEY \
    --api-secret=$WEB_EXT_API_SECRET
```
- `--channel=unlisted` = **automatic signing**, no review wait. Outputs a signed `.xpi`.
- `--channel=listed` = submitted to AMO for public listing, requires human review.
- Signed `.xpi` appears in `web-ext-artifacts/`.

### package.json Scripts
```json
{
  "sign:firefox": "wxt build -b firefox && export $(cat .env | xargs) && npx web-ext sign --source-dir .output/firefox-mv2 --channel=unlisted --api-key=$WEB_EXT_API_KEY --api-secret=$WEB_EXT_API_SECRET",
  "install:zen": "/Applications/Zen.app/Contents/MacOS/zen web-ext-artifacts/*.xpi"
}
```

### .gitignore Additions
```
.env
web-ext-artifacts
web-ext.config.ts
```

---

## 18. Zen Browser Notes

Zen is a Firefox-based browser. Extensions built for Firefox work in Zen with these caveats:

### Dev Mode
Set Zen's binary path in `web-ext.config.ts` (gitignored):
```typescript
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  binaries: {
    firefox: '/Applications/Zen.app/Contents/MacOS/zen',
  },
});
```
Then `pnpm dev:firefox` opens Zen automatically.

### Installing Signed .xpi
**Drag-and-drop and "Install Add-on From File" do NOT work in Zen.** The install prompt silently fails to appear.

**Working method** — open the `.xpi` via CLI:
```bash
/Applications/Zen.app/Contents/MacOS/zen /path/to/extension.xpi
```
This triggers the install prompt reliably.
