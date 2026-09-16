/**
 * ============================================================================
 *  LOGO- UND ICON-PIPELINE
 * ============================================================================
 *
 *  Quelle: src/assets/logo-original.png (Originaldatei von Saugy Solutions)
 *
 *  Das Logo wird NICHT neu gestaltet. Form, Proportionen und
 *  Wiedererkennungsmerkmale bleiben unverändert. Das Skript führt
 *  ausschliesslich technische Optimierungen durch:
 *
 *    1. Freistellen des weissen Hintergrunds (Flood-Fill von den Rändern,
 *       damit helle Flächen INNERHALB des Logos erhalten bleiben)
 *    2. Zuschnitt auf den tatsächlichen Bildinhalt
 *    3. Export als transparentes PNG und WebP in mehreren Grössen
 *    4. Ableitung von Favicon, App-Icons und Apple-Touch-Icon
 *
 *  Aufruf:  npm run assets:logo
 * ============================================================================
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'src/assets/logo-original.png');
const IMG_DIR = join(ROOT, 'public/img');
const ICON_DIR = join(ROOT, 'public/icons');

/** Hintergrundfarbe der Website – für Icons mit undurchsichtiger Fläche. */
const BRAND_DARK = { r: 6, g: 17, b: 15, alpha: 1 };

/** Ab diesem Luminanzwert gilt ein Randpixel als weisser Hintergrund. */
const BG_LUMA = 246;
/** Luminanzspanne, über die der Rand weich ausläuft (Anti-Aliasing). */
const FEATHER_RANGE = 44;

/**
 * Entfernt den weissen Hintergrund per Flood-Fill von den Bildrändern.
 * Helle Bereiche im Inneren des Logos (Cursor, Glanzkanten) bleiben erhalten,
 * weil sie von dunkleren Konturen umschlossen sind.
 *
 * @returns {Promise<{data: Buffer, info: sharp.OutputInfo, bbox: {left:number,top:number,width:number,height:number}}>}
 */
async function removeWhiteBackground() {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const luma = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    luma[i] = Math.round(data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114);
  }

  // --- Flood-Fill von allen vier Rändern -----------------------------------
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

  // --- Alphakanal setzen ---------------------------------------------------
  // Hintergrund -> vollständig transparent.
  // Vordergrundpixel direkt an der Kante werden anhand ihrer Helligkeit weich
  // ausgeblendet, damit auf dunklem Untergrund kein weisser Saum entsteht.
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

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

      if (touchesBg) {
        const ratio = Math.min(1, Math.max(0, (BG_LUMA + 8 - luma[idx]) / FEATHER_RANGE));
        data[o + 3] = Math.round(ratio * 255);
      } else {
        data[o + 3] = 255;
      }

      if (data[o + 3] > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) throw new Error('Im Logo wurde kein Bildinhalt gefunden.');

  return {
    data,
    info,
    bbox: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
  };
}

/** Baut eine .ico-Datei aus mehreren PNG-Buffern (ICO erlaubt eingebettete PNGs). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserviert
  header.writeUInt16LE(1, 2); // Typ 1 = Icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;

  entries.forEach((entry, i) => {
    const o = i * 16;
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, o + 0);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, o + 1);
    dir.writeUInt8(0, o + 2); // Farbpalette
    dir.writeUInt8(0, o + 3); // reserviert
    dir.writeUInt16LE(1, o + 4); // Farbebenen
    dir.writeUInt16LE(32, o + 6); // Bits pro Pixel
    dir.writeUInt32LE(entry.buffer.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += entry.buffer.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.buffer)]);
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  await mkdir(ICON_DIR, { recursive: true });

  const { data, info, bbox } = await removeWhiteBackground();

  // Freigestelltes und zugeschnittenes Logo als Grundlage aller Ableitungen.
  const base = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .extract(bbox)
    .png()
    .toBuffer();

  const baseMeta = await sharp(base).metadata();
  console.log(`Logo freigestellt: ${baseMeta.width}×${baseMeta.height} px`);

  // --- Transparentes Logo in mehreren Breiten -----------------------------
  for (const width of [640, 320, 160]) {
    const suffix = width === 640 ? '' : `-${width}`;
    const resized = sharp(base).resize({ width, fit: 'inside', withoutEnlargement: true });
    await resized
      .clone()
      .png({ compressionLevel: 9, palette: true, quality: 88, effort: 10 })
      .toFile(join(IMG_DIR, `logo-saugy-solutions${suffix}.png`));
    await resized
      .clone()
      .webp({ quality: 92, effort: 6 })
      .toFile(join(IMG_DIR, `logo-saugy-solutions${suffix}.webp`));
  }

  // --- Favicons (transparent) ---------------------------------------------
  const icoEntries = [];
  for (const size of [16, 32, 48]) {
    const buffer = await sharp(base)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    icoEntries.push({ size, buffer });
    if (size !== 16) {
      await writeFile(join(ICON_DIR, `favicon-${size}.png`), buffer);
    }
  }
  await writeFile(join(ROOT, 'public/favicon.ico'), buildIco(icoEntries));

  // --- App-Icons (transparent, für maskable/any) ---------------------------
  for (const size of [192, 512]) {
    await sharp(base)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
      .toFile(join(ICON_DIR, `icon-${size}.png`));
  }

  // --- Apple-Touch-Icon (benötigt eine deckende Fläche) --------------------
  const appleSize = 180;
  const appleInner = Math.round(appleSize * 0.74);
  const appleLogo = await sharp(base)
    .resize(appleInner, appleInner, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: appleSize, height: appleSize, channels: 4, background: BRAND_DARK },
  })
    .composite([{ input: appleLogo, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toFile(join(ICON_DIR, 'apple-touch-icon.png'));

  // --- Maskable Icon (Sicherheitsabstand für Android-Masken) ---------------
  const maskSize = 512;
  const maskInner = Math.round(maskSize * 0.62);
  const maskLogo = await sharp(base)
    .resize(maskInner, maskInner, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: maskSize, height: maskSize, channels: 4, background: BRAND_DARK },
  })
    .composite([{ input: maskLogo, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toFile(join(ICON_DIR, 'icon-maskable-512.png'));

  console.log('Logo- und Icon-Dateien erzeugt.');
}

main().catch((error) => {
  console.error('Fehler in der Logo-Pipeline:', error);
  process.exit(1);
});
