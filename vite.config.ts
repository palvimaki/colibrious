import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * The build emits a single dist/ that is served from two domains:
 *   - colibrious.com         (English UI, default)
 *   - kuvankäsittely.fi      (Finnish UI)
 *
 * The default manifest emitted here is English (Colibrious). The post-build
 * script in scripts/post-build.mjs additionally writes:
 *   - dist/manifest.fi.webmanifest  (Finnish translation)
 *   - dist/index.fi.html            (Finnish meta tags)
 *
 * nginx on kuvankäsittely.fi is responsible for serving the .fi files.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'Colibrious',
        short_name: 'Colibrious',
        description:
          'Edit, resize, rotate, convert to PDF, add watermarks. All in your browser. No sign-up. Works offline.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#A52A2A',
        background_color: '#fcf9f2',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
