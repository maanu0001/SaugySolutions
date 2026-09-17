/**
 * ============================================================================
 *  ADMINBEREICH VORBEREITEN
 * ============================================================================
 *
 *  Kopiert Decap CMS aus node_modules nach `public/admin/vendor/`.
 *
 *  Damit wird das CMS von der eigenen Domain ausgeliefert. Es ist kein
 *  externes CDN nötig – das passt zur Datenschutzerklärung (keine Daten an
 *  Dritte) und zur Content Security Policy (nur eigene Quellen).
 *
 *  Source-Maps werden bewusst nicht mitkopiert: Sie machen rund 80 % der
 *  Dateigrösse aus und werden im Betrieb nicht gebraucht.
 *
 *  Aufruf:  npm run assets:admin
 * ============================================================================
 */

import { readdir, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'node_modules/decap-cms/dist');
const TARGET = join(ROOT, 'public/admin/vendor');

if (!existsSync(SOURCE)) {
  console.error('  Decap CMS fehlt. Bitte "npm ci" ausführen.');
  process.exit(1);
}

/**
 * Das Paket liefert zwei Varianten desselben Bundles („decap-cms“ und „cms“).
 * Benötigt wird nur die erste – die zweite ist ein Alias und würde die
 * Dateimenge grundlos verdoppeln.
 */
const isAlias = (name) => /(^|\.)cms\.js$/.test(name) && !name.includes('decap-cms');

// Alten Stand entfernen, damit keine verwaisten Dateien zurückbleiben.
await rm(TARGET, { recursive: true, force: true });
await mkdir(TARGET, { recursive: true });

let copied = 0;
let bytes = 0;

for (const entry of await readdir(SOURCE)) {
  // Source-Maps, Alias-Bundle und Unterordner überspringen.
  if (entry.endsWith('.map')) continue;
  if (isAlias(entry)) continue;

  const source = join(SOURCE, entry);
  if ((await stat(source)).isDirectory()) continue;

  // Nur die tatsächlich benötigten Dateitypen.
  if (!['.js', '.wasm', '.txt', '.css'].includes(extname(entry))) continue;

  const target = join(TARGET, entry);
  await copyFile(source, target);
  bytes += (await stat(target)).size;
  copied++;
}

console.log(`  ${copied} Dateien kopiert (${(bytes / 1048576).toFixed(1)} MB), Source-Maps ausgelassen.`);
