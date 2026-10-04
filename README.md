# Freedium

A Firefox/Zen browser extension that automatically redirects Medium articles to [Freedium](https://freedium-mirror.cfd) for free reading.

## Features

- Automatically redirects `medium.com` URLs to Freedium
- Toggle redirect on/off from the popup
- Customizable redirect URL (in case the Freedium mirror changes)
- Redirect counter to track articles freed
- Clean, dark popup UI with smooth animations

## Install

### From signed .xpi (recommended)

Download the latest `.xpi` from [Releases](../../releases) and install:

**Zen Browser:**
```bash
/Applications/Zen.app/Contents/MacOS/zen path/to/freedium.xpi
```

**Firefox:**
Open the `.xpi` file directly or go to `about:addons` → gear icon → "Install Add-on From File"

Installed copies auto-update from [`updates.json`](updates.json).

### From source

```bash
git clone https://github.com/user/freedium-extension.git
cd freedium-extension
pnpm install
pnpm dev:firefox
```

## Development

```bash
pnpm dev:firefox      # Dev mode with HMR
pnpm build:firefox    # Production build
pnpm compile          # TypeScript type-check
pnpm sign:firefox     # Build + sign via AMO (requires .env with API keys)
```

### Signing

1. Get API credentials from https://addons.mozilla.org/developers/addon/api/key/
2. Create a `.env` file:
   ```
   WEB_EXT_API_KEY=user:XXXXXXX:XXX
   WEB_EXT_API_SECRET=your_secret_here
   ```
3. Run `pnpm sign:firefox`

### Releasing

```bash
pnpm release 1.0.3
```

Bumps the version, signs it, publishes the `.xpi` as a GitHub Release, and updates `updates.json` so installed copies update themselves.

## Built with

- [WXT](https://wxt.dev) — Vite-based browser extension framework
- [React 19](https://react.dev)
- [TypeScript](https://typescriptlang.org)

## License

[MIT](LICENSE)
