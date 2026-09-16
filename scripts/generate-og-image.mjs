/**
 * ============================================================================
 *  VORSCHAUBILD FÜR SOCIAL MEDIA (Open Graph)
 * ============================================================================
 *
 *  Erzeugt public/img/og-saugy-solutions.png (1200 × 630 px).
 *
 *  Das Bild wird mit dem echten Logo und der echten Hausschrift gerendert.
 *  Das Ergebnis ist im Repository abgelegt – der normale Produktionsbuild
 *  benötigt dieses Skript also NICHT. Nur nach einer Änderung von Logo,
 *  Schrift oder Claim erneut ausführen:
 *
 *      npm run assets:og
 * ============================================================================
 */

import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/img/og-saugy-solutions.png');

/** Schrift und Logo als Data-URI einbetten, damit kein Server nötig ist. */
const font = await readFile(join(ROOT, 'public/fonts/manrope-latin-var.woff2'));
const logo = await readFile(join(ROOT, 'public/img/logo-saugy-solutions.png'));

const html = `<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Manrope';
    src: url(data:font/woff2;base64,${font.toString('base64')}) format('woff2-variations');
    font-weight: 200 800;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px;
    height: 630px;
    background: #06110f;
    font-family: 'Manrope', sans-serif;
    color: #f3faf8;
    position: relative;
    overflow: hidden;
  }

  /* Punktraster */
  .dots {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at center, rgba(255,255,255,.09) 1.4px, transparent 1.4px);
    background-size: 42px 42px;
    mask-image: radial-gradient(ellipse 80% 70% at 30% 0%, #000 10%, transparent 75%);
  }

  /* Farbschleier */
  .glow {
    position: absolute;
    width: 760px; height: 760px;
    border-radius: 50%;
    filter: blur(110px);
  }
  .glow-1 { top: -320px; right: -200px; background: radial-gradient(circle, #24e6b2 0%, transparent 66%); opacity: .3; }
  .glow-2 { bottom: -420px; left: -220px; background: radial-gradient(circle, #28c7d7 0%, transparent 68%); opacity: .2; }

  .frame {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72px 80px;
  }

  .top { display: flex; align-items: center; gap: 22px; }
  .top img { width: 84px; height: 84px; filter: drop-shadow(0 10px 26px rgba(0,0,0,.7)); }
  .brand { font-size: 34px; font-weight: 500; letter-spacing: -.02em; }
  .brand b { font-weight: 800; }

  h1 {
    font-size: 66px;
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -.028em;
    max-width: 17ch;
  }
  h1 span {
    background: linear-gradient(104deg, #24e6b2, #28c7d7);
    -webkit-background-clip: text;
    color: transparent;
  }

  .bottom { display: flex; align-items: center; justify-content: space-between; gap: 40px; }

  .tags { display: flex; gap: 12px; }
  .tag {
    padding: 11px 20px;
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 999px;
    font-size: 21px;
    font-weight: 600;
    color: #a6bbb5;
  }
  .tag:first-child { border-color: rgba(36,230,178,.4); background: rgba(36,230,178,.12); color: #24e6b2; }

  .url { font-size: 23px; font-weight: 700; color: #a6bbb5; white-space: nowrap; }

  /* Akzentlinie am unteren Rand */
  .bar {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 8px;
    background: linear-gradient(to right, #24e6b2, #28c7d7 55%, transparent);
  }
</style>
</head>
<body>
  <div class="dots"></div>
  <div class="glow glow-1"></div>
  <div class="glow glow-2"></div>

  <div class="frame">
    <div class="top">
      <img src="data:image/png;base64,${logo.toString('base64')}" alt="">
      <span class="brand"><b>Saugy</b> Solutions</span>
    </div>

    <h1>Websites und digitale Lösungen für <span>Schweizer KMU</span></h1>

    <div class="bottom">
      <div class="tags">
        <span class="tag">Webdesign</span>
        <span class="tag">Hosting &amp; Wartung</span>
        <span class="tag">E-Mail &amp; Cloud</span>
      </div>
      <span class="url">saugy-solutions.ch</span>
    </div>
  </div>

  <div class="bar"></div>
</body>
</html>`;

await mkdir(join(ROOT, 'public/img'), { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: OUT });
await browser.close();

console.log(`Vorschaubild erzeugt: ${OUT}`);
