/**
 * Browsergestützte Qualitätskontrolle.
 *
 * Prüft die gebaute Website in einem echten Browser auf:
 *   - Fehler in der Konsole
 *   - waagrechtes Scrollen bei 320 bis 1920 Pixeln Breite
 *   - Bedienung des mobilen Menüs per Tastatur
 *   - Fokuszustände und Sprungmarke
 *   - Validierung des Kontaktformulars
 *   - Verhalten bei „prefers-reduced-motion“
 *
 * Voraussetzung: `npm run serve:dist` läuft auf Port 4321.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4321';
const WIDTHS = [320, 375, 768, 1024, 1440, 1920];
const PAGES = [
  '/', '/leistungen/', '/projekte/', '/projekte/swisshub/',
  '/projekte/biohof-scheibler/', '/projekte/bibliothek-zurzach/',
  '/ablauf/', '/ueber-uns/', '/kontakt/', '/danke/',
  '/datenschutz/', '/impressum/', '/gibt-es-nicht/',
];

let errors = 0;
let passed = 0;
const ok = (t) => { console.log(`  \x1b[32m✓\x1b[0m ${t}`); passed++; };
const bad = (t) => { console.log(`  \x1b[31m✗\x1b[0m ${t}`); errors++; };
const head = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

// ---------------------------------------------------------------------------
head('1. Konsolenfehler und Statuscodes');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const problems = [];

  // Die Adresse /gibt-es-nicht/ wird absichtlich aufgerufen, um die 404-Seite
  // zu prüfen. Der zugehörige Konsoleneintrag ist erwartet und kein Fehler.
  const isExpected404 = (text) => text.includes('/gibt-es-nicht/') || text.includes('404 (Not Found)');

  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const entry = `${m.location().url}: ${m.text()}`;
    if (!isExpected404(entry)) problems.push(entry);
  });
  page.on('pageerror', (e) => problems.push(`Skriptfehler: ${e.message}`));
  page.on('requestfailed', (r) => {
    if (!isExpected404(r.url())) problems.push(`Anfrage fehlgeschlagen: ${r.url()}`);
  });

  let status404 = false;

  for (const path of PAGES) {
    const response = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const status = response?.status();
    const expected = path === '/gibt-es-nicht/' ? 404 : 200;

    if (status !== expected) bad(`${path}: Status ${status} statt ${expected}`);
    else if (expected === 404) status404 = true;
  }

  if (status404) ok('Unbekannte Adresse liefert Status 404 mit eigener Fehlerseite');

  if (problems.length === 0) ok(`${PAGES.length} Seiten ohne Konsolen- oder Ladefehler`);
  else problems.forEach(bad);

  await page.close();
}

// ---------------------------------------------------------------------------
head('2. Darstellung bei verschiedenen Breiten');

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  let overflow = 0;

  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const result = await page.evaluate(() => {
      const doc = document.documentElement;
      const scrolls = doc.scrollWidth > doc.clientWidth + 1;
      if (!scrolls) return null;

      // Das verursachende Element benennen, damit der Fehler auffindbar ist.
      const culprits = [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);

      return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, culprits };
    });

    if (result) {
      bad(`${width}px ${path}: waagrechtes Scrollen (${result.scrollWidth} > ${result.clientWidth}) – ${result.culprits.join(', ')}`);
      overflow++;
    }
  }

  if (overflow === 0) ok(`${width} px: kein waagrechtes Scrollen auf allen Seiten`);
  await page.close();
}

// ---------------------------------------------------------------------------
head('3. Mobiles Menü (Tastatur und Maus)');

{
  const page = await browser.newPage({ viewport: { width: 375, height: 760 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const toggle = page.locator('[data-nav-toggle]');
  const panel = page.locator('[data-nav-panel]');

  if (await toggle.isVisible()) ok('Menüschaltfläche auf Mobilbreite sichtbar');
  else bad('Menüschaltfläche fehlt auf Mobilbreite');

  if ((await toggle.getAttribute('aria-expanded')) === 'false') ok('aria-expanded ist anfangs false');
  else bad('aria-expanded ist anfangs nicht false');

  await toggle.click();
  await page.waitForTimeout(350);

  if (await panel.isVisible()) ok('Menü öffnet sich per Klick');
  else bad('Menü öffnet sich nicht');

  if ((await toggle.getAttribute('aria-expanded')) === 'true') ok('aria-expanded wechselt auf true');
  else bad('aria-expanded wechselt nicht');

  const focusInPanel = await page.evaluate(
    () => document.querySelector('[data-nav-panel]')?.contains(document.activeElement) ?? false
  );
  if (focusInPanel) ok('Fokus springt in das geöffnete Menü');
  else bad('Fokus springt nicht in das Menü');

  // Fokusfalle: mehrfach Tab darf den Fokus nicht aus dem Menü führen.
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  const stillInside = await page.evaluate(
    () => document.querySelector('[data-nav-panel]')?.contains(document.activeElement) ?? false
  );
  if (stillInside) ok('Fokus bleibt im geöffneten Menü gefangen');
  else bad('Fokus verlässt das geöffnete Menü');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);

  if (!(await panel.isVisible())) ok('Escape schliesst das Menü');
  else bad('Escape schliesst das Menü nicht');

  const focusBack = await page.evaluate(
    () => document.activeElement?.hasAttribute('data-nav-toggle') ?? false
  );
  if (focusBack) ok('Fokus kehrt zur Menüschaltfläche zurück');
  else bad('Fokus kehrt nicht zur Schaltfläche zurück');

  await page.close();
}

// ---------------------------------------------------------------------------
head('4. Tastaturbedienung und Fokus');

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({
    text: document.activeElement?.textContent?.trim(),
    cls: document.activeElement?.className,
  }));

  if (first.cls?.includes('skip-link')) ok(`Erstes Tab erreicht die Sprungmarke („${first.text}“)`);
  else bad(`Erstes Tab erreicht nicht die Sprungmarke (war: ${first.text})`);

  // Sichtbarer Fokusring auf den ersten Elementen prüfen.
  let withoutOutline = 0;
  for (let i = 0; i < 14; i++) {
    const visible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return true;
      const style = getComputedStyle(el);
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    });
    if (!visible) withoutOutline++;
    await page.keyboard.press('Tab');
  }

  if (withoutOutline === 0) ok('Alle geprüften Elemente zeigen einen sichtbaren Fokusring');
  else bad(`${withoutOutline} Element(e) ohne sichtbaren Fokusring`);

  // FAQ per Tastatur bedienen.
  await page.goto(BASE + '/leistungen/', { waitUntil: 'networkidle' });
  const summary = page.locator('.faq__question').nth(1);
  await summary.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const opened = await page.locator('.faq__item').nth(1).evaluate((el) => el.hasAttribute('open'));
  if (opened) ok('FAQ lässt sich per Tastatur öffnen');
  else bad('FAQ öffnet sich nicht per Tastatur');

  await page.close();
}

// ---------------------------------------------------------------------------
head('5. Kontaktformular im Browser');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + '/kontakt/', { waitUntil: 'networkidle' });

  // Leeres Formular absenden -> Fehlermeldungen, kein Seitenwechsel.
  await page.locator('[data-submit]').click();
  await page.waitForTimeout(300);

  const nameError = await page.locator('[data-error-for="kf-name"]').textContent();
  if (nameError?.trim()) ok(`Fehlermeldung beim Namensfeld: „${nameError.trim()}“`);
  else bad('Keine Fehlermeldung beim leeren Namensfeld');

  const invalid = await page.locator('#kf-name').getAttribute('aria-invalid');
  if (invalid === 'true') ok('aria-invalid wird am fehlerhaften Feld gesetzt');
  else bad('aria-invalid fehlt am fehlerhaften Feld');

  const focused = await page.evaluate(() => document.activeElement?.id);
  if (focused === 'kf-name') ok('Fokus springt zum ersten fehlerhaften Feld');
  else bad(`Fokus springt nicht zum ersten Fehler (war: ${focused})`);

  const statusVisible = await page.locator('[data-form-status]').isVisible();
  if (statusVisible) ok('Sammelmeldung über dem Absendebereich sichtbar');
  else bad('Sammelmeldung fehlt');

  // Ungültige E-Mail.
  await page.fill('#kf-email', 'keine-adresse');
  await page.locator('#kf-email').blur();
  await page.waitForTimeout(200);
  const mailError = await page.locator('[data-error-for="kf-email"]').textContent();
  if (mailError?.trim()) ok('Ungültige E-Mail-Adresse wird erkannt');
  else bad('Ungültige E-Mail-Adresse wird nicht erkannt');

  // Korrektur entfernt die Meldung wieder.
  await page.fill('#kf-email', 'maria@beispiel.ch');
  await page.waitForTimeout(200);
  const cleared = await page.locator('[data-error-for="kf-email"]').textContent();
  if (!cleared?.trim()) ok('Meldung verschwindet nach Korrektur');
  else bad('Meldung bleibt nach Korrektur bestehen');

  // Honeypot: liegt ausserhalb des sichtbaren Bereichs. Bewusst NICHT über
  // display:none, weil manche Bots solche Felder überspringen.
  const trap = await page.evaluate(() => {
    const el = document.querySelector('#kf-website');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { right: r.right, left: r.left, inViewport: r.right > 0 && r.left < window.innerWidth };
  });
  if (trap && !trap.inViewport) ok('Honeypot-Feld liegt ausserhalb des sichtbaren Bereichs');
  else bad(`Honeypot-Feld ist sichtbar (${JSON.stringify(trap)})`);

  // Zeitstempel wurde gesetzt.
  const loadedAt = await page.locator('[data-loaded-at]').inputValue();
  if (loadedAt && Number(loadedAt) > 0) ok('Zeitstempel für den Bot-Schutz wurde gesetzt');
  else bad('Zeitstempel fehlt');

  // Alle Felder haben ein verknüpftes Label.
  const unlabelled = await page.evaluate(() =>
    [...document.querySelectorAll('#kontaktformular input:not([type=hidden]), #kontaktformular select, #kontaktformular textarea')]
      .filter((el) => !document.querySelector(`label[for="${el.id}"]`))
      .map((el) => el.name || el.id)
  );
  if (unlabelled.length === 0) ok('Alle Formularfelder haben ein verknüpftes Label');
  else bad(`Felder ohne Label: ${unlabelled.join(', ')}`);

  await page.close();
}

// ---------------------------------------------------------------------------
head('6. Reduzierte Bewegung');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const hidden = await page.evaluate(
    () => [...document.querySelectorAll('[data-reveal]')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length
  );
  if (hidden === 0) ok('Bei reduzierter Bewegung sind alle Inhalte sofort sichtbar');
  else bad(`${hidden} Element(e) bleiben trotz reduzierter Bewegung ausgeblendet`);

  const animated = await page.evaluate(
    () => [...document.querySelectorAll('*')]
      .filter((el) => {
        const s = getComputedStyle(el);
        return s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.05;
      }).length
  );
  if (animated === 0) ok('Keine laufenden Animationen bei reduzierter Bewegung');
  else bad(`${animated} Element(e) animieren trotz reduzierter Bewegung`);

  await page.close();
}

// ---------------------------------------------------------------------------
head('7. Ohne JavaScript');

{
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

  const visible = await page.evaluate(
    () => [...document.querySelectorAll('[data-reveal]')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length
  ).catch(() => 0);

  // Ohne JavaScript greift die Klasse `no-js`; Inhalte dürfen nie versteckt sein.
  const bodyText = await page.locator('body').innerText();
  if (bodyText.includes('Kostenloses Erstgespräch')) ok('Startseite zeigt ihre Inhalte auch ohne JavaScript');
  else bad('Startseite ist ohne JavaScript unvollständig');

  await page.goto(BASE + '/kontakt/', { waitUntil: 'domcontentloaded' });
  const action = await page.locator('#kontaktformular').getAttribute('action');
  const method = await page.locator('#kontaktformular').getAttribute('method');
  if (action === '/api/kontakt.php' && method === 'post') ok('Formular sendet auch ohne JavaScript an den PHP-Endpunkt');
  else bad(`Formular ohne JavaScript nicht versandfähig (action=${action}, method=${method})`);

  const note = await page.locator('.noscript-note').count();
  if (note > 0) ok('Hinweis für deaktiviertes JavaScript vorhanden');
  else bad('Hinweis für deaktiviertes JavaScript fehlt');

  await context.close();
}

await browser.close();

console.log('\n' + '─'.repeat(74));
console.log(errors === 0
  ? `\x1b[32m\x1b[1m  Browserprüfung bestanden\x1b[0m – ${passed} Prüfungen`
  : `\x1b[31m\x1b[1m  ${errors} Fehler\x1b[0m – ${passed} Prüfungen bestanden`);
console.log('─'.repeat(74) + '\n');
process.exit(errors === 0 ? 0 : 1);
