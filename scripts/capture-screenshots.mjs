/**
 * ============================================================================
 *  ECHTE PROJEKT-SCREENSHOTS AUFNEHMEN
 * ============================================================================
 *
 *  Nimmt von jeder in src/data/projects.mjs hinterlegten Projektadresse eine
 *  Desktop- und eine Mobilansicht auf und legt sie optimiert unter
 *  public/img/projekte/ ab.
 *
 *  ANSCHLIESSEND von Hand in src/data/projects.mjs eintragen:
 *      shotDesktop: '/img/projekte/<slug>-desktop.webp',
 *      shotMobile:  '/img/projekte/<slug>-mobil.webp',
 *
 *  Solange diese Felder auf `null` stehen, zeigt die Website eine bewusst
 *  stilisierte Darstellung – es wird also kein Screenshot vorgetäuscht.
 *
 *  VORAUSSETZUNG
 *  Das Skript benötigt Zugriff auf die öffentlichen Projektwebsites. In
 *  abgeschotteten Umgebungen (z. B. hinter einer strengen Netzwerkrichtlinie)
 *  schlägt der Aufruf fehl; das Skript meldet das und bricht sauber ab.
 *
 *  HINWEIS ZUR NUTZUNG
 *  Screenshots fremder Websites im eigenen Portfolio sind üblich, sollten
 *  aber mit der Kundschaft abgesprochen sein.
 *
 *  Aufruf:  node scripts/capture-screenshots.mjs
 * ============================================================================
 */

import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PROJECTS } from '../src/data/projects.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/img/projekte');

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let done = 0;
let failed = 0;

for (const project of PROJECTS) {
  for (const [variant, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['mobil', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    const temp = join(OUT, `${project.slug}-${variant}.tmp.png`);

    try {
      await page.goto(project.url, { waitUntil: 'networkidle', timeout: 30000 });
      // Kurz warten, damit Schriften und Bilder sicher geladen sind.
      await page.waitForTimeout(1500);
      await page.screenshot({ path: temp });

      // Als WebP optimieren – deutlich kleiner als PNG.
      await sharp(temp)
        .resize({ width: variant === 'desktop' ? 1600 : 780, withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 })
        .toFile(join(OUT, `${project.slug}-${variant}.webp`));

      await unlink(temp);
      console.log(`  ✓ ${project.name} (${variant})`);
      done++;
    } catch (error) {
      console.log(`  ✗ ${project.name} (${variant}): ${error.message.split('\n')[0]}`);
      failed++;
    } finally {
      await page.close();
    }
  }
}

await browser.close();

console.log(`\n${done} Aufnahme(n) erstellt, ${failed} fehlgeschlagen.`);

if (done > 0) {
  console.log('\nJetzt in src/data/projects.mjs eintragen, zum Beispiel:');
  console.log("    shotDesktop: '/img/projekte/swisshub-desktop.webp',");
  console.log("    shotMobile:  '/img/projekte/swisshub-mobil.webp',");
}

process.exit(failed > 0 && done === 0 ? 1 : 0);
