// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { SITE } from './src/data/site.mjs';

/**
 * Saugy Solutions – vollstaendig statische Astro-Konfiguration.
 *
 * Wichtig: `output: 'static'` ist zwingend. Auf dem Produktivserver laeuft
 * ausschliesslich Apache (+ PHP fuer das Kontaktformular). Es darf keine
 * Node.js-Laufzeit und kein serverseitiges Astro-Feature benoetigt werden.
 */
export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
    assets: 'assets',
  },
  compressHTML: true,
  prefetch: false,
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      // Rechtliche Seiten und Funktionsseiten gehoeren nicht in die Sitemap.
      filter: (page) =>
        !/\/(danke|404)\/?$/.test(page),
      changefreq: 'monthly',
      lastmod: new Date(),
      serialize(item) {
        if (item.url === `${SITE.url}/`) {
          item.priority = 1.0;
          // `changefreq` erwartet einen Enum-Wert; die Zeichenkette entspricht ihm.
          item.changefreq = /** @type {any} */ ('monthly');
        } else if (/\/(leistungen|projekte|kontakt)\/$/.test(item.url)) {
          item.priority = 0.9;
        } else if (/\/(datenschutz|impressum)\/$/.test(item.url)) {
          item.priority = 0.2;
          item.changefreq = /** @type {any} */ ('yearly');
        } else {
          item.priority = 0.7;
        }
        return item;
      },
    }),
  ],
  vite: {
    build: {
      cssMinify: 'lightningcss',
      assetsInlineLimit: 2048,
    },
  },
});
