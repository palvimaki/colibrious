import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'kuvankäsittely.fi',
        short_name: 'kuvankäsittely',
        description:
          'Muokkaa, muuta kokoa, pyöritä, muuta PDF:ksi, lisää vesileimoja — kaikki suoraan selaimessasi. Ei kirjautumista, toimii ilman verkkoa.',
        lang: 'fi',
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
