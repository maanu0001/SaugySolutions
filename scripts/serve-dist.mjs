/**
 * Kleiner statischer Server für die lokale Prüfung des Build-Ergebnisses.
 *
 * Wird NUR für Entwicklung und Qualitätskontrolle verwendet. Auf dem
 * Produktivserver läuft ausschliesslich Apache – dieses Skript wird dort
 * nicht benötigt und nicht mit ausgeliefert.
 *
 * Aufruf: npm run serve:dist
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT ?? 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

async function resolveFile(pathname) {
  // Verzeichnisdurchquerung verhindern.
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, clean);

  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    return file;
  } catch {
    // Pfad ohne abschliessenden Schrägstrich ebenfalls prüfen.
    try {
      const withIndex = join(ROOT, clean, 'index.html');
      await stat(withIndex);
      return withIndex;
    } catch {
      return null;
    }
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const file = await resolveFile(url.pathname);

  if (!file) {
    // Eigene 404-Seite ausliefern – wie später auf dem Apache-Server.
    try {
      const notFound = await readFile(join(ROOT, '404.html'));
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      res.end(notFound);
    } catch {
      res.writeHead(404, { 'Content-Type': TYPES['.txt'] });
      res.end('404');
    }
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(500, { 'Content-Type': TYPES['.txt'] });
    res.end('500');
  }
}).listen(PORT, () => {
  console.log(`Vorschau des Build-Ergebnisses: http://localhost:${PORT}`);
});
