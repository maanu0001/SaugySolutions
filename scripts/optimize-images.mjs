/**
 * ============================================================================
 *  BILDER AUS DER MEDIATHEK OPTIMIEREN
 * ============================================================================
 *
 *  Alle im Adminbereich hochgeladenen Bilder landen in `public/img/uploads/`.
 *  Dieses Skript erzeugt daraus beim Build moderne, kleinere Fassungen:
 *
 *    - AVIF und WebP in mehreren Breiten
 *    - ein Manifest mit den echten Massen jedes Bildes
 *
 *  Das Manifest wird von `src/components/Picture.astro` gelesen. Dadurch
 *  bekommt jedes Bild korrekte `width`/`height`-Angaben (kein Layoutsprung)
 *  und ein passendes `srcset`.
 *
 *  Die Originaldateien bleiben unangetastet und dienen als Rückfallebene.
 *
 *  Aufruf:  npm run assets:images
 * ============================================================================
 */

import sharp from 'sharp';
import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = join(ROOT, 'public/img/uploads');
const DERIVED = join(ROOT, 'public/img/derived');
const MANIFEST = join(ROOT, 'src/data/image-manifest.json');

/** Breiten, in denen Bilder bereitgestellt werden. */
const WIDTHS = [480, 800, 1200, 1600];

/** Formate, die verarbeitet werden. SVG wird unverändert durchgereicht. */
const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function main() {
  await mkdir(UPLOADS, { recursive: true });
  await mkdir(DERIVED, { recursive: true });

  const manifest = {};
  let processed = 0;
  let skipped = 0;

  const entries = existsSync(UPLOADS) ? await readdir(UPLOADS) : [];

  for (const file of entries) {
    const ext = extname(file).toLowerCase();
    const source = join(UPLOADS, file);
    const publicPath = `/img/uploads/${file}`;

    if ((await stat(source)).isDirectory()) continue;

    // SVG: unverändert übernehmen, keine Rastergrössen nötig.
    if (ext === '.svg') {
      manifest[publicPath] = { src: publicPath, width: null, height: null, vector: true };
      skipped++;
      continue;
    }

    if (!RASTER.has(ext)) {
      skipped++;
      continue;
    }

    const meta = await sharp(source).metadata();
    if (!meta.width || !meta.height) {
      console.warn(`  ! Masse nicht lesbar, übersprungen: ${file}`);
      skipped++;
      continue;
    }

    const name = basename(file, ext);
    const avif = [];
    const webp = [];
    const fallback = [];

    // Nur Breiten erzeugen, die das Original hergibt – sonst stimmen die
    // Angaben im srcset nicht mit den Dateien überein.
    const targets = [...new Set(WIDTHS.filter((w) => w < meta.width).concat(meta.width))]
      .sort((a, b) => a - b);

    for (const width of targets) {
      const resized = sharp(source).resize({ width, withoutEnlargement: true });

      await resized.clone().avif({ quality: 55, effort: 4 })
        .toFile(join(DERIVED, `${name}-${width}.avif`));
      await resized.clone().webp({ quality: 80, effort: 5 })
        .toFile(join(DERIVED, `${name}-${width}.webp`));

      avif.push(`/img/derived/${name}-${width}.avif ${width}w`);
      webp.push(`/img/derived/${name}-${width}.webp ${width}w`);
      fallback.push(`${publicPath} ${width}w`);
    }

    manifest[publicPath] = {
      src: publicPath,
      width: meta.width,
      height: meta.height,
      vector: false,
      avif: avif.join(', '),
      webp: webp.join(', '),
    };

    processed++;
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(
    `  ${processed} Bild(er) optimiert, ${skipped} übersprungen (Vektor oder nicht unterstützt).`
  );
}

main().catch((error) => {
  console.error('Fehler bei der Bildoptimierung:', error);
  process.exit(1);
});
