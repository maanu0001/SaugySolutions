/**
 * Web-App-Manifest. Wird zur Bauzeit erzeugt, damit Name, Farben und Icons
 * aus der zentralen Konfiguration stammen.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../data/site.mjs';

export const GET: APIRoute = () => {
  const manifest = {
    name: `${SITE.name} – Webdesign und digitale Lösungen`,
    short_name: SITE.name,
    description:
      'Websites, Hosting, E-Mail und Cloud-Lösungen für kleine Unternehmen, Vereine und Selbstständige in der Schweiz.',
    lang: SITE.locale,
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
