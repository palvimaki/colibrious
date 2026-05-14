#!/usr/bin/env node
/**
 * After `vite build`, write the Finnish-locale companion files into dist/:
 *   - dist/manifest.fi.webmanifest  (Finnish PWA manifest)
 *   - dist/index.fi.html            (Finnish meta tags)
 *
 * nginx for kuvankäsittely.fi rewrites:
 *   /                       → /index.fi.html
 *   /manifest.webmanifest   → /manifest.fi.webmanifest
 *
 * The default English files are served as-is by colibrious.com.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

const FI_MANIFEST = {
  id: '/',
  name: 'kuvankäsittely.fi',
  short_name: 'kuvankäsittely',
  description:
    'Muokkaa, muuta kokoa, pyöritä, muuta PDF:ksi, lisää vesileimoja. Kaikki suoraan selaimessasi. Ei kirjautumista, toimii ilman verkkoa.',
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
};

await writeFile(
  join(DIST, 'manifest.fi.webmanifest'),
  JSON.stringify(FI_MANIFEST),
);

const enHtml = await readFile(join(DIST, 'index.html'), 'utf8');

const fiHtml = enHtml
  .replace(/<html lang="en">/, '<html lang="fi">')
  .replace(
    /<meta name="description" content="[^"]*" \/>/,
    '<meta name="description" content="Muokkaa, muuta kokoa, pyöritä, muuta PDF:ksi, lisää vesileimoja. Kaikki suoraan selaimessasi. Ei kirjautumista, toimii ilman verkkoa." />',
  )
  .replace(
    /<meta name="apple-mobile-web-app-title" content="[^"]*" \/>/,
    '<meta name="apple-mobile-web-app-title" content="kuvankäsittely.fi" />',
  )
  .replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    '<link rel="canonical" href="https://xn--kuvanksittely-gfb.fi/" />',
  )
  .replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    '<meta property="og:url" content="https://xn--kuvanksittely-gfb.fi/" />',
  )
  .replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    '<meta property="og:title" content="kuvankäsittely.fi — muokkaa kuvia selaimessa" />',
  )
  .replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    '<meta property="og:description" content="Muokkaa, muuta kokoa, pyöritä, muuta PDF:ksi, lisää vesileimoja. Kaikki suoraan selaimessasi. Ei kirjautumista, toimii ilman verkkoa." />',
  )
  .replace(
    /<meta property="og:image" content="[^"]*" \/>/,
    '<meta property="og:image" content="https://xn--kuvanksittely-gfb.fi/pwa-512x512.png" />',
  )
  .replace(
    /<meta property="og:locale" content="[^"]*" \/>/,
    '<meta property="og:locale" content="fi_FI" />',
  )
  .replace(
    /<meta property="og:locale:alternate" content="[^"]*" \/>/,
    '<meta property="og:locale:alternate" content="en_US" />',
  )
  .replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    '<meta name="twitter:title" content="kuvankäsittely.fi" />',
  )
  .replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    '<meta name="twitter:description" content="Privacy-first image processing in your browser. Ei kirjautumista, toimii ilman verkkoa." />',
  )
  .replace(
    /<meta name="twitter:image" content="[^"]*" \/>/,
    '<meta name="twitter:image" content="https://xn--kuvanksittely-gfb.fi/pwa-512x512.png" />',
  )
  // The two <link rel="manifest"> alternatives, swap so Finnish is "current"
  .replace(
    /<title>[^<]*<\/title>/,
    '<title>kuvankäsittely.fi — muokkaa kuvia selaimessa</title>',
  )
  // PWA manifest link (vite-plugin-pwa injects it after build)
  .replace(
    /<link rel="manifest" href="\/manifest\.webmanifest"[^>]*>/,
    '<link rel="manifest" href="/manifest.webmanifest">',
  );

await writeFile(join(DIST, 'index.fi.html'), fiHtml);

console.log('post-build: wrote dist/manifest.fi.webmanifest and dist/index.fi.html');
