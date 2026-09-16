/**
 * Erzeugt robots.txt zur Bauzeit, damit die Sitemap-Adresse automatisch zur
 * konfigurierten Domain passt.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../data/site.mjs';

export const GET: APIRoute = () => {
  const body = `# robots.txt – ${SITE.name}
# ${SITE.url}

User-agent: *
Allow: /

# Funktionsseiten ohne eigenständigen Inhalt.
Disallow: /danke/

# Endpunkt des Kontaktformulars – kein Inhalt zum Indexieren.
Disallow: /api/

Sitemap: ${SITE.url}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
