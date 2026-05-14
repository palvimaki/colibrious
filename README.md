# kuvankäsittely.fi

> Muunna kuvia, muuta kuvan kokoa, lisää vesileimoja — kaikki suoraan selaimessasi. Ei kirjautumista, toimii ilman verkkoa.

A privacy-first, client-side image processing PWA. Every byte stays on your device — there is no upload, no account, no cookie, no analytics. Install it to your home screen and it works offline.

🌐 Live: **[kuvankäsittely.fi](https://kuvankäsittely.fi/)**

## Features

- **Resize** — exact dimensions, percent, or fit-longest-side, batch + per-image
- **Crop** — free-form or 1:1, 4:3, 16:9, 3:2 aspect ratios
- **Rotate · Flip** — horizontal and vertical
- **Format conversion** — PNG, JPEG, WebP, with quality control
- **Filters** — brightness, grayscale, sepia
- **Watermarks** — custom text overlay
- **Batch processing** — apply settings to many images at once
- **Installable PWA** — works fully offline after first load

## Privacy

This app is fundamentally not a service. There is no backend.

- Images are decoded, processed, and re-encoded entirely in the browser via Canvas / OffscreenCanvas.
- No file ever leaves the device.
- No cookies. No localStorage. No analytics. No tracking pixels.
- No third-party requests beyond what the browser fetches to load the static bundle.

The source is open under MIT — verify it yourself.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · `browser-image-compression` · `vite-plugin-pwa`

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview the built bundle
npm run lint
```

### Generating PWA icons

Source logo is `public/logo.png`. To regenerate all icon sizes:

```bash
npx pwa-assets-generator --preset minimal-2023 public/logo.png
```

## Deployment

The app is a fully static SPA — drop `dist/` on any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, or your own nginx). No environment variables, no secrets, no server-side anything.

## Contributing

Issues and pull requests are welcome. Keep it minimal — this project deliberately stays small.

## License

[MIT](./LICENSE) © Esa-Pekka Pälvimäki
