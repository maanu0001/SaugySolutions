/**
 * ============================================================================
 *  LOGO- UND ICON-PIPELINE
 * ============================================================================
 *
 *  Quelle ist das im Adminbereich hinterlegte Logo:
 *      content/settings/site.yml -> branding.logo
 *
 *  Unterstützt werden SVG, PNG und WebP. Fehlt die Datei oder ist sie
 *  unbrauchbar, greift die mitgelieferte Rückfalldatei
 *  `src/assets/logo-original.png`.
 *
 *  Das Logo wird NICHT neu gestaltet. Form, Proportionen und
 *  Wiedererkennungsmerkmale bleiben unverändert. Durchgeführt werden
 *  ausschliesslich technische Schritte:
 *
 *    1. unnötigen Rand entfernen (weisser Hintergrund oder transparenter Rand)
 *    2. Seitenverhältnis ermitteln und festhalten
 *    3. Rastergrössen als PNG und WebP erzeugen (bei SVG entfällt das)
 *    4. Favicon, App-Icons und Apple-Touch-Icon ableiten
 *    5. Manifest schreiben, aus dem Header, Hero und Footer die Masse lesen
 *
 *  Das Logo wird dadurch nie verzerrt und nie kreisförmig zugeschnitten.
 *
 *  Aufruf:  npm run assets:logo
 * ============================================================================
 */

import sharp from 'sharp';
import { mkdir, writeFile, readFile, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { BRAND } from '../src/data/site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const OUT_DIR = join(PUBLIC, 'img/generated');
const ICON_DIR = join(PUBLIC, 'icons');
const MANIFEST = join(ROOT, 'src/data/logo-manifest.json');
const FALLBACK = join(ROOT, 'src/assets/logo-original.png');

/** Hintergrundfarbe für Icons, die eine deckende Fläche brauchen. */
const BRAND_DARK = { r: 8, g: 10, b: 10, alpha: 1 };

/** Ab diesem Luminanzwert gilt ein Randpixel als weisser Hintergrund. */
const BG_LUMA = 246;
const FEATHER_RANGE = 44;

/** Breiten, in denen das Rasterlogo bereitgestellt wird. */
const WIDTHS = [640, 320, 160];

// ---------------------------------------------------------------------------
//  Weissen Hintergrund freistellen
// ---------------------------------------------------------------------------

/**
 * Entfernt einen weissen Hintergrund per Flood-Fill von den Bildrändern.
 * Helle Bereiche im Inneren des Logos bleiben erhalten, weil sie von
 * dunkleren Konturen umschlossen sind.
 */
async function removeWhiteBackground(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const luma = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    luma[i] = Math.round(data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114);
  }

  const isBg = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const push = (idx) => {
    if (!isBg[idx] && luma[idx] >= BG_LUMA) {
      isBg[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) push(idx - 1);
    if (x < width - 1) push(idx + 1);
    if (y > 0) push(idx - width);
    if (y < height - 1) push(idx + width);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const o = idx * channels;

      if (isBg[idx]) {
        data[o + 3] = 0;
        continue;
      }

      let touchesBg = false;
      for (let dy = -1; dy <= 1 && !touchesBg; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (isBg[ny * width + nx]) {
            touchesBg = true;
            break;
          }
        }
      }

      // Randpixel weich ausblenden, damit auf Dunkel kein weisser Saum bleibt.
      data[o + 3] = touchesBg
        ? Math.round(Math.min(1, Math.max(0, (BG_LUMA + 8 - luma[idx]) / FEATHER_RANGE)) * 255)
        : 255;
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

/** Prüft, ob das Bild deckend ist und weisse Ecken hat. */
async function needsWhiteRemoval(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const corner = (x, y) => {
    const o = (y * width + x) * channels;
    return { r: data[o], g: data[o + 1], b: data[o + 2], a: data[o + 3] };
  };

  const corners = [corner(0, 0), corner(width - 1, 0), corner(0, height - 1), corner(width - 1, height - 1)];

  // Alle Ecken deckend und nahezu weiss -> weisser Hintergrund.
  return corners.every((c) => c.a > 250 && c.r > 240 && c.g > 240 && c.b > 240);
}

// ---------------------------------------------------------------------------
//  SVG-Masse auslesen
// ---------------------------------------------------------------------------

/** Ermittelt Breite und Höhe einer SVG-Datei aus viewBox oder Attributen. */
function readSvgSize(svg) {
  const viewBox = svg.match(/viewBox\s*=\s*["']\s*[\d.+-]+[\s,]+[\d.+-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (viewBox) return { width: parseFloat(viewBox[1]), height: parseFloat(viewBox[2]) };

  const w = svg.match(/\bwidth\s*=\s*["']([\d.]+)/i);
  const h = svg.match(/\bheight\s*=\s*["']([\d.]+)/i);
  if (w && h) return { width: parseFloat(w[1]), height: parseFloat(h[1]) };

  // Quadratisch als letzte Rückfallebene – besser als eine Verzerrung.
  return { width: 100, height: 100 };
}

// ---------------------------------------------------------------------------
//  Icons
// ---------------------------------------------------------------------------

/** Baut eine .ico-Datei aus mehreren PNG-Buffern. */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;

  entries.forEach((entry, i) => {
    const o = i * 16;
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, o + 0);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(entry.buffer.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += entry.buffer.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.buffer)]);
}

/**
 * Erzeugt Favicons und App-Icons aus einem quadratisch eingepassten Logo.
 * Das Logo wird dabei EINGEPASST (fit: contain), nie beschnitten.
 */
async function generateIcons(rasterBuffer) {
  const icoEntries = [];

  for (const size of [16, 32, 48]) {
    const buffer = await sharp(rasterBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    icoEntries.push({ size, buffer });
    if (size !== 16) await writeFile(join(ICON_DIR, `favicon-${size}.png`), buffer);
  }
  await writeFile(join(PUBLIC, 'favicon.ico'), buildIco(icoEntries));

  for (const size of [192, 512]) {
    await sharp(rasterBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
      .toFile(join(ICON_DIR, `icon-${size}.png`));
  }

  // Apple-Touch-Icon und maskierbares Icon brauchen eine deckende Fläche.
  for (const [name, size, inner] of [
    ['apple-touch-icon.png', 180, 0.74],
    ['icon-maskable-512.png', 512, 0.62],
  ]) {
    const logo = await sharp(rasterBuffer)
      .resize(Math.round(size * inner), Math.round(size * inner), {
        fit: 'inside',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    await sharp({ create: { width: size, height: size, channels: 4, background: BRAND_DARK } })
      .composite([{ input: logo, gravity: 'center' }])
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
      .toFile(join(ICON_DIR, name));
  }
}

// ---------------------------------------------------------------------------
//  Hauptablauf
// ---------------------------------------------------------------------------

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(ICON_DIR, { recursive: true });

  // --- Quelle bestimmen ----------------------------------------------------
  const configured = join(PUBLIC, BRAND.logo.replace(/^\//, ''));
  let source = configured;
  let usedFallback = false;

  if (!existsSync(source)) {
    console.warn(`  ! Logo nicht gefunden: ${BRAND.logo} – verwende Rückfalldatei`);
    source = FALLBACK;
    usedFallback = true;
  }

  const isVector = extname(source).toLowerCase() === '.svg';
  console.log(`  Quelle: ${usedFallback ? 'src/assets/logo-original.png (Rückfall)' : BRAND.logo}`);

  /** @type {{src:string,width:number,height:number,isVector:boolean,srcset:string|null,webp:string|null}} */
  let manifest;

  if (isVector) {
    // --- SVG: unverändert übernehmen ---------------------------------------
    const svg = await readFile(source, 'utf8');
    const { width, height } = readSvgSize(svg);

    const target = join(OUT_DIR, 'logo.svg');
    await copyFile(source, target);

    // Für Icons wird das SVG gerastert – das Original bleibt unangetastet.
    const raster = await sharp(source, { density: 384 })
      .resize({ width: 1024, height: 1024, fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const trimmed = await sharp(raster).trim({ threshold: 1 }).png().toBuffer();

    await generateIcons(trimmed);

    manifest = {
      src: '/img/generated/logo.svg',
      width: Math.round(width),
      height: Math.round(height),
      isVector: true,
      srcset: null,
      webp: null,
    };
    console.log(`  Vektorlogo übernommen (${Math.round(width)} × ${Math.round(height)} Einheiten)`);
  } else {
    // --- Rasterbild: freistellen und zuschneiden ---------------------------
    let buffer = await readFile(source);

    if (await needsWhiteRemoval(buffer)) {
      buffer = await removeWhiteBackground(buffer);
      console.log('  Weisser Hintergrund freigestellt');
    }

    // Transparenten Rand entfernen – verhindert unnötigen Leerraum.
    buffer = await sharp(buffer).ensureAlpha().trim({ threshold: 1 }).png().toBuffer();

    const meta = await sharp(buffer).metadata();
    console.log(`  Zugeschnitten auf ${meta.width} × ${meta.height} px`);

    // Alte Ableitungen entfernen, damit keine verwaisten Dateien bleiben.
    for (const width of [...WIDTHS, meta.width]) {
      await rm(join(OUT_DIR, `logo-${width}.png`), { force: true });
      await rm(join(OUT_DIR, `logo-${width}.webp`), { force: true });
    }

    /*
      Nur Breiten erzeugen, die das Original tatsächlich hergibt. Sonst würde
      im srcset eine Breite stehen, die die Datei gar nicht hat – der Browser
      würde dann die falsche Grösse auswählen.
    */
    const targetWidths = [...new Set(WIDTHS.filter((w) => w < meta.width).concat(meta.width))]
      .sort((a, b) => b - a);

    const srcset = [];
    const webpset = [];

    for (const width of targetWidths) {
      const resized = sharp(buffer).resize({ width, fit: 'inside', withoutEnlargement: true });

      await resized.clone().png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
        .toFile(join(OUT_DIR, `logo-${width}.png`));
      await resized.clone().webp({ quality: 92, effort: 6 })
        .toFile(join(OUT_DIR, `logo-${width}.webp`));

      srcset.push(`/img/generated/logo-${width}.png ${width}w`);
      webpset.push(`/img/generated/logo-${width}.webp ${width}w`);
    }

    await generateIcons(buffer);

    manifest = {
      src: `/img/generated/logo-${targetWidths[0]}.png`,
      width: meta.width,
      height: meta.height,
      isVector: false,
      srcset: srcset.join(', '),
      webp: webpset.join(', '),
    };
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`  Seitenverhältnis: ${(manifest.width / manifest.height).toFixed(4)}`);
  console.log('  Logo-, Icon- und Manifestdateien erzeugt.');
}

main().catch((error) => {
  console.error('Fehler in der Logo-Pipeline:', error);
  process.exit(1);
});
