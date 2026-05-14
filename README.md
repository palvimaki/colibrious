# Colibrious · kuvankäsittely.fi

> **Fast, private image conversion in a wingbeat.**
> Edit, resize, rotate, convert to PDF, add watermarks. All in your browser. No sign-up. Works offline.

A privacy-first, client-side image processing PWA. Every byte stays on your device — no upload, no account, no cookie, no analytics. Install it to your home screen and it works offline.

🌐 Live (English): **[colibrious.com](https://colibrious.com/)**
🌐 Live (suomeksi): **[kuvankäsittely.fi](https://kuvankäsittely.fi/)**

Both sites are served from the same `dist/`. Locale is chosen from the request hostname (`*.fi → fi`, `*.com → en`, override with `?lang=fi|en`).

## Features

- **Resize** — exact dimensions, percent, or fit-longest-side, batch + per-image
- **Crop** — free-form or 1:1, 4:3, 16:9, 3:2 aspect ratios
- **Rotate · Flip** — horizontal and vertical
- **Format conversion** — PNG, JPEG, WebP, with quality control
- **PDF export** — combine all images into one multi-page A4 PDF (client-side via `pdf-lib`, lazy-loaded)
- **Filters** — brightness, grayscale, sepia
- **Watermarks** — custom text overlay
- **Batch processing** — apply settings to many images at once
- **Installable PWA** — works fully offline after first load
- **Whole-window drop** — drop images anywhere in the tab; no missed drops opening the file in the browser

## Privacy

This app is fundamentally not a service. There is no backend.

- Images are decoded, processed, and re-encoded entirely in the browser via Canvas / OffscreenCanvas.
- No file ever leaves the device.
- No cookies. No localStorage. No analytics. No tracking pixels.
- No third-party requests beyond what the browser fetches to load the static bundle.

The source is open under MIT — verify it yourself.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · `vite-plugin-pwa` · `pdf-lib`

## i18n architecture

- All user-facing strings live in [`src/i18n/strings.ts`](./src/i18n/strings.ts) keyed by locale.
- [`src/i18n/useStrings.ts`](./src/i18n/useStrings.ts) detects the locale from `window.location.hostname` (with a `?lang=` override for testing).
- `vite build` emits the English `index.html` + `manifest.webmanifest` as the canonical (Colibrious) build.
- `scripts/post-build.mjs` then writes Finnish companions:
  - `dist/index.fi.html` — Finnish `<title>`, OG, Twitter, canonical
  - `dist/manifest.fi.webmanifest` — Finnish PWA manifest (so the installed-app name reads correctly)
- nginx for `kuvankäsittely.fi` rewrites `/ → /index.fi.html` and `/manifest.webmanifest → /manifest.fi.webmanifest`. nginx for `colibrious.com` serves the defaults as-is.

## Development

```bash
npm install
npm run dev          # http://localhost:5173 (default English)
npm run dev          # http://localhost:5173/?lang=fi (Finnish override)
npm run build        # production build → dist/ (incl. .fi companion files)
npm run preview      # preview the built bundle
npm run lint
```

### Generating PWA icons

Source logo is `assets/logo.png` (outside `public/` so the 1.6 MB original isn't shipped). To regenerate all icon sizes:

```bash
npx pwa-assets-generator --preset minimal-2023 assets/logo.png
```

## Deployment

The app is a fully static SPA — drop `dist/` on any static host. No environment variables, no secrets, no server-side anything.

For the production setup (haukka, nginx + certbot, Cloudflare):
1. Both `colibrious.com` and `kuvankäsittely.fi` (Punycode `xn--kuvanksittely-gfb.fi`) are served from the same `dist/` (typically symlinked from one webroot to the other).
2. The `kuvankäsittely.fi` server block adds:
   ```nginx
   location = / { try_files /index.fi.html =404; }
   location = /manifest.webmanifest { try_files /manifest.fi.webmanifest =404; }
   ```

## Contributing

Issues and pull requests are welcome. Keep it minimal — this project deliberately stays small.

## License

[MIT](./LICENSE) © Esa-Pekka Pälvimäki
