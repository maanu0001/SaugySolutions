/**
 * ============================================================================
 *  ASSETS VORBEREITEN
 * ============================================================================
 *
 *  Führt vor jedem Build die drei Schritte aus, die von den Inhalten im
 *  Adminbereich abhängen:
 *
 *    1. Bilder aus der Mediathek optimieren (AVIF/WebP, Manifest)
 *    2. Logo verarbeiten, Favicons und App-Icons ableiten
 *    3. Vorschaubild für Social Media erzeugen
 *
 *  Dadurch wirkt sich ein im Adminbereich ausgetauschtes Logo automatisch auf
 *  Kopfzeile, Hero, Footer, Favicon, App-Icons und Open-Graph-Bild aus.
 *
 *  Aufruf:  npm run assets   (läuft auch automatisch vor dev und build)
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const STEPS = [
  { name: 'Bilder optimieren', script: 'optimize-images.mjs', required: true },
  { name: 'Logo und Icons', script: 'generate-logo-assets.mjs', required: true },
  { name: 'Adminkonfiguration', script: 'generate-cms-config.mjs', required: true },
  { name: 'Adminbereich (Decap CMS)', script: 'prepare-admin.mjs', required: true },
  /*
    Das Vorschaubild wird im Browser gerendert, damit die echte Hausschrift
    verwendet wird. Steht kein Browser zur Verfügung, wird der Schritt
    übersprungen – das zuletzt erzeugte Bild bleibt dann bestehen.
  */
  { name: 'Vorschaubild (Open Graph)', script: 'generate-og-image.mjs', required: false },
];

let failed = false;

for (const step of STEPS) {
  process.stdout.write(`\n  ▸ ${step.name}\n`);

  const result = spawnSync(process.execPath, [join(ROOT, 'scripts', step.script)], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    if (step.required) {
      console.error(`\n  Schritt fehlgeschlagen: ${step.name}`);
      failed = true;
      break;
    }
    console.warn(`  ! Übersprungen: ${step.name} (nicht zwingend erforderlich)`);
  }
}

process.exit(failed ? 1 : 0);
