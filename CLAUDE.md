# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Freedium is a Firefox browser extension built with **WXT** (wxt.dev) and **React 19**. WXT is a Vite-based framework that auto-generates the extension manifest from file-based entrypoints. The package manager is **pnpm**.

## Commands

```bash
pnpm dev              # Dev mode with HMR (default browser)
pnpm dev:firefox      # Dev mode targeting Firefox
pnpm build            # Production build (default browser)
pnpm build:firefox    # Production build for Firefox
pnpm zip:firefox      # Build + zip for AMO submission
pnpm compile          # TypeScript type-check (no emit)
```

## Architecture

This is a WXT extension with three entrypoints:

- **`entrypoints/background.ts`** — Background script (event page on Firefox, service worker on Chrome). Central hub for message handling and extension lifecycle events. Uses `defineBackground()`.
- **`entrypoints/content.ts`** — Content script injected into matched pages. Uses `defineContentScript()` with `matches` patterns.
- **`entrypoints/popup/`** — React app rendered as the browser action popup. Entry is `index.html` → `main.tsx` → `App.tsx`.

WXT auto-generates `manifest.json` from these entrypoints plus overrides in `wxt.config.ts`. The generated manifest and TypeScript config live in `.wxt/` (gitignored).

## WXT Conventions

- `defineBackground()`, `defineContentScript()`, and `browser.*` APIs are **auto-imported** by WXT — no explicit imports needed.
- `browser.*` is the unified API namespace (WXT polyfills it for Chrome compatibility).
- Adding new entrypoints: drop files in `entrypoints/` following WXT naming conventions (e.g., `entrypoints/options/index.html` creates an options page, `entrypoints/sidepanel.html` creates a sidebar).
- Manifest overrides (permissions, `browser_specific_settings`, etc.) go in `wxt.config.ts` under `manifest`.
- Build output goes to `.output/` (gitignored).
- `web-ext.config.ts` is for personal browser binary paths and is gitignored.

## Firefox-Specific Notes

- Firefox MV2 is the default WXT build target for Firefox. To target MV3, set `manifestVersion: 3` in `wxt.config.ts`.
- Firefox requires `browser_specific_settings.gecko.id` in the manifest for AMO submission and for `storage.sync` to work.
- Use `import.meta.env.BROWSER === 'firefox'` for browser-conditional code.
- Detailed research on Firefox extension architecture, security, and publishing is in `docs/firefox-extension-research.md`.
