/**
 * Screenshots der eigenen Seiten für die visuelle Kontrolle.
 * Aufruf: node scripts/shoot.mjs <pfad> <breite> <ziel.png> [--full]
 */
import { chromium } from 'playwright';

const [path = '/', width = '1440', out = 'shot.png', ...flags] = process.argv.slice(2);
const full = flags.includes('--full');

const browser = await chromium.launch({
  // Vorinstalliertes Chromium dieser Umgebung nutzen (kein Download nötig).
  // Ohne CHROMIUM_PATH nutzt Playwright seine eigene Installation
  // (so läuft es auch auf einem GitHub-Runner).
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(width) > 800 ? 900 : 780 },
  deviceScaleFactor: 1,
});

const messages = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') messages.push(`${m.type()}: ${m.text()}`);
});
page.on('pageerror', (e) => messages.push(`pageerror: ${e.message}`));

await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle' });

// Einmal durch die Seite scrollen, damit die Einblend-Animationen ausgelöst
// werden, danach zurück nach oben.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(900);
await page.screenshot({ path: out, fullPage: full });
await browser.close();

if (messages.length) {
  console.log('KONSOLE:\n' + messages.join('\n'));
} else {
  console.log('Konsole: keine Fehler oder Warnungen.');
}
