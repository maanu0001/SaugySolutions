/**
 * ============================================================================
 *  BROWSERGESTÜTZTE QUALITÄTSKONTROLLE
 * ============================================================================
 *
 *  Prüft die gebaute Website in einem echten Browser:
 *
 *     1. Konsolenfehler und Statuscodes
 *     2. Darstellung über alle geforderten Bildschirmgrössen (inkl. Querformat)
 *     3. Logo – Proportionen, keine Verzerrung, kein Zuschnitt
 *     4. Hero – Zentrierung und Textbreite
 *     5. Mobiler Header – dauerhaft erreichbar beim Scrollen
 *     6. Mobiles Menü – Maus und Tastatur, Fokusfalle, Fokusrückgabe
 *     7. Tastaturbedienung und Fokuszustände
 *     8. Kontaktformular – Validierung erst nach dem Absendeversuch
 *     9. Reduzierte Bewegung
 *    10. Betrieb ohne JavaScript
 *    11. Adminbereich
 *    12. Projektbilder und Projektseiten aus den CMS-Daten
 *
 *  Voraussetzung: `npm run serve:dist` läuft auf Port 4321.
 *
 *  Hinweis zu den Klicks: An Stellen, an denen die Scrollposition eine Rolle
 *  spielt, wird im Seitenkontext geklickt. Playwright würde das Element sonst
 *  zuerst in den sichtbaren Bereich scrollen und damit das Messergebnis
 *  verfälschen.
 * ============================================================================
 */

import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const BASE = 'http://localhost:4321';

/** Alle geforderten Bildschirmgrössen. */
const VIEWPORTS = [
  { w: 320, h: 568, label: '320 × 568 (kleinstes Telefon)' },
  { w: 360, h: 800, label: '360 × 800 (Android)' },
  { w: 375, h: 812, label: '375 × 812 (iPhone)' },
  { w: 390, h: 844, label: '390 × 844 (iPhone)' },
  { w: 430, h: 932, label: '430 × 932 (grosses iPhone)' },
  { w: 768, h: 1024, label: '768 × 1024 (Tablet)' },
  { w: 1024, h: 1366, label: '1024 × 1366 (grosses Tablet)' },
  { w: 1440, h: 900, label: '1440 × 900 (Notebook)' },
  { w: 1920, h: 1080, label: '1920 × 1080 (Desktop)' },
  // Querformat
  { w: 812, h: 375, label: '812 × 375 (Telefon quer)' },
  { w: 1024, h: 768, label: '1024 × 768 (Tablet quer)' },
];

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

/** Klickt im Seitenkontext – ohne vorheriges Scrollen durch den Testtreiber. */
const clickInPage = (page, selector) =>
  page.evaluate((s) => document.querySelector(s)?.click(), selector);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

// ===========================================================================
head('1. Konsolenfehler und Statuscodes');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const problems = [];

  // Die Adresse /gibt-es-nicht/ wird absichtlich aufgerufen, um die 404-Seite
  // zu prüfen. Der zugehörige Eintrag ist erwartet und kein Fehler.
  const expected404 = (text) => text.includes('/gibt-es-nicht/') || text.includes('404 (Not Found)');

  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const entry = `${m.location().url}: ${m.text()}`;
    if (!expected404(entry)) problems.push(entry);
  });
  page.on('pageerror', (e) => problems.push(`Skriptfehler: ${e.message}`));
  page.on('requestfailed', (r) => {
    if (!expected404(r.url())) problems.push(`Anfrage fehlgeschlagen: ${r.url()}`);
  });

  let saw404 = false;

  for (const path of PAGES) {
    const response = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const status = response?.status();
    const want = path === '/gibt-es-nicht/' ? 404 : 200;

    if (status !== want) bad(`${path}: Status ${status} statt ${want}`);
    else if (want === 404) saw404 = true;
  }

  if (saw404) ok('Unbekannte Adresse liefert Status 404 mit eigener Fehlerseite');
  if (problems.length === 0) ok(`${PAGES.length} Seiten ohne Konsolen- oder Ladefehler`);
  else problems.slice(0, 8).forEach(bad);

  await page.close();
}

// ===========================================================================
head('2. Darstellung über alle Bildschirmgrössen');

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  const problems = [];

  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });

    const result = await page.evaluate(() => {
      const doc = document.documentElement;
      if (doc.scrollWidth <= doc.clientWidth + 1) return null;

      const culprits = [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);

      return { sw: doc.scrollWidth, cw: doc.clientWidth, culprits };
    });

    if (result) problems.push(`${path} (${result.sw} > ${result.cw}: ${result.culprits.join(', ')})`);
  }

  if (problems.length === 0) ok(`${vp.label}: kein waagrechtes Scrollen`);
  else problems.slice(0, 3).forEach((p) => bad(`${vp.label}: ${p}`));

  await page.close();
}

// ===========================================================================
head('3. Logo – Proportionen und Darstellung');

/*
  Wichtig zur Messung: `naturalWidth`/`naturalHeight` liefern bei gesetztem
  `srcset` die dichte-skalierten und auf ganze Pixel gerundeten Masse. Daraus
  ein Seitenverhältnis zu berechnen, ergibt Rundungsfehler von mehreren
  Prozent – das sähe nach Verzerrung aus, wo keine ist.

  Geprüft wird deshalb gegen das echte Verhältnis der Datei aus
  `src/data/logo-manifest.json`, mit einer Toleranz von einem Pixel.
*/
const logoManifest = JSON.parse(
  await readFile(new URL('../src/data/logo-manifest.json', import.meta.url), 'utf8')
);
const echtesVerhaeltnis = logoManifest.width / logoManifest.height;

for (const [label, width] of [['Mobil', 375], ['Desktop', 1440]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const logos = await page.evaluate(() =>
    [...document.querySelectorAll('img.logo__mark')].map((img) => {
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      return {
        ort: img.closest('.site-header') ? 'Header'
          : img.closest('.nav-drawer') ? 'Menü'
          : img.closest('.hero') ? 'Hero'
          : img.closest('.site-footer') ? 'Footer' : 'sonstiger Ort',
        breite: Math.round(r.width),
        hoehe: Math.round(r.height),
        sichtbar: r.width > 0 && r.height > 0,
        objectFit: cs.objectFit,
        borderRadius: cs.borderRadius,
        clipPath: cs.clipPath,
        geladen: img.complete && img.naturalWidth > 0,
        datei: (img.currentSrc || '').split('/').pop(),
      };
    })
  );

  const sichtbare = logos.filter((l) => l.sichtbar);

  if (sichtbare.length === 0) {
    bad(`${label}: kein sichtbares Logo gefunden`);
  } else {
    if (logos.every((l) => l.geladen)) {
      ok(`${label}: alle ${logos.length} Logos geladen (${sichtbare.length} sichtbar)`);
    } else {
      bad(`${label}: mindestens ein Logo wurde nicht geladen`);
    }

    // Verzerrung: dargestellte Breite muss zur Höhe mal echtem Verhältnis passen.
    const verzerrt = sichtbare.filter(
      (l) => Math.abs(l.breite - l.hoehe * echtesVerhaeltnis) > 1
    );
    if (verzerrt.length === 0) {
      ok(`${label}: Seitenverhältnis überall korrekt (${sichtbare.map((l) => `${l.ort} ${l.breite}×${l.hoehe}`).join(', ')})`);
    } else {
      bad(`${label}: verzerrt – ${verzerrt.map((l) => `${l.ort} ${l.breite}×${l.hoehe}`).join(', ')}`);
    }

    // Einpassen statt beschneiden.
    const falschesFit = sichtbare.filter((l) => l.objectFit !== 'contain');
    if (falschesFit.length === 0) ok(`${label}: Logo wird eingepasst (object-fit: contain)`);
    else bad(`${label}: falsches object-fit – ${falschesFit[0].ort}: ${falschesFit[0].objectFit}`);

    // Kein runder oder sonstiger Zuschnitt.
    const beschnitten = sichtbare.filter(
      (l) => l.borderRadius !== '0px' || (l.clipPath !== 'none' && l.clipPath !== '')
    );
    if (beschnitten.length === 0) ok(`${label}: kein kreisförmiger Zuschnitt, kein Beschnitt`);
    else bad(`${label}: Logo wird beschnitten – ${beschnitten[0].ort}`);

    // Sinnvolle Grösse der sichtbaren Logos.
    const zuKlein = sichtbare.filter((l) => l.hoehe < 24);
    if (zuKlein.length === 0) ok(`${label}: Logogrössen sinnvoll (${sichtbare.map((l) => l.hoehe + 'px').join(', ')})`);
    else bad(`${label}: Logo zu klein – ${zuKlein[0].ort}: ${zuKlein[0].hoehe} px`);
  }

  await page.close();
}

// ===========================================================================
head('4. Hero – Zentrierung');

for (const [label, width] of [['Mobil', 375], ['Desktop', 1440]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const hero = await page.evaluate(() => {
    const section = document.querySelector('.hero');
    const content = document.querySelector('.hero__content');
    const title = document.querySelector('.hero__title');
    if (!section || !content || !title) return null;

    const sr = section.getBoundingClientRect();
    const tr = title.getBoundingClientRect();

    return {
      textAlign: getComputedStyle(content).textAlign,
      // Abstand der Überschrift zu beiden Rändern des Bereichs.
      leftGap: Math.round(tr.left - sr.left),
      rightGap: Math.round(sr.right - tr.right),
      titleWidth: Math.round(tr.width),
      sectionWidth: Math.round(sr.width),
    };
  });

  if (!hero) {
    bad(`${label}: Hero nicht gefunden`);
  } else {
    if (hero.textAlign === 'center') ok(`${label}: Hero-Inhalt ist zentriert ausgerichtet`);
    else bad(`${label}: Hero ist nicht zentriert (text-align: ${hero.textAlign})`);

    // Gleiche Abstände links und rechts = optisch mittig.
    const diff = Math.abs(hero.leftGap - hero.rightGap);
    if (diff <= 2) ok(`${label}: Überschrift exakt mittig (Abweichung ${diff} px)`);
    else bad(`${label}: Überschrift nicht mittig (links ${hero.leftGap}, rechts ${hero.rightGap})`);

    // Textbreite begrenzt – kontrollierter Zeilenumbruch.
    if (hero.titleWidth <= hero.sectionWidth) ok(`${label}: Textbreite begrenzt (${hero.titleWidth} px)`);
    else bad(`${label}: Überschrift breiter als der Bereich`);
  }

  await page.close();
}

// ===========================================================================
head('5. Mobiler Header bleibt beim Scrollen erreichbar');

{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo({ top: 2500, behavior: 'instant' }));
  await page.waitForTimeout(400);

  const state = await page.evaluate(() => {
    const header = document.querySelector('[data-header]');
    const toggle = document.querySelector('[data-nav-toggle]');
    if (!header || !toggle) return null;

    const hr = header.getBoundingClientRect();
    const tr = toggle.getBoundingClientRect();
    const cs = getComputedStyle(header);

    return {
      sichtbar: hr.top >= -1 && hr.bottom > 0,
      position: cs.position,
      zIndex: cs.zIndex,
      hatHintergrund: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent',
      buttonGroesse: Math.round(Math.min(tr.width, tr.height)),
      buttonImBild: tr.top >= 0 && tr.bottom <= window.innerHeight,
    };
  });

  if (!state) {
    bad('Header oder Menübutton nicht gefunden');
  } else {
    if (state.sichtbar && ['sticky', 'fixed'].includes(state.position)) {
      ok(`Header bleibt beim Scrollen sichtbar (position: ${state.position})`);
    } else {
      bad(`Header nicht dauerhaft sichtbar (position: ${state.position})`);
    }

    if (state.hatHintergrund) ok('Header ist mit eigenem Hintergrund abgesetzt');
    else bad('Header hat keinen abgesetzten Hintergrund – Menübutton schwer erkennbar');

    if (state.buttonImBild) ok('Menübutton ist auch beim Scrollen erreichbar');
    else bad('Menübutton ist beim Scrollen nicht erreichbar');

    if (state.buttonGroesse >= 44) ok(`Menübutton gross genug (${state.buttonGroesse} px)`);
    else bad(`Menübutton zu klein (${state.buttonGroesse} px, empfohlen mindestens 44)`);

    if (Number(state.zIndex) >= 10) ok(`Header liegt über dem Inhalt (z-index ${state.zIndex})`);
    else bad(`Header-z-index zu niedrig (${state.zIndex})`);
  }

  await page.close();
}

// ===========================================================================
head('6. Mobiles Menü');

{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  // Weit scrollen: Das Menü muss auch mitten in der Seite funktionieren.
  await page.evaluate(() => window.scrollTo({ top: 1400, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const scrollVorher = await page.evaluate(() => Math.round(window.scrollY));

  const toggle = page.locator('[data-nav-toggle]');
  const drawer = page.locator('[data-nav-panel]');

  if ((await toggle.getAttribute('aria-expanded')) === 'false') ok('aria-expanded ist anfangs false');
  else bad('aria-expanded ist anfangs nicht false');

  await clickInPage(page, '[data-nav-toggle]');
  await page.waitForTimeout(450);

  if (await drawer.isVisible()) ok('Menü öffnet sich');
  else bad('Menü öffnet sich nicht');

  if ((await toggle.getAttribute('aria-expanded')) === 'true') ok('aria-expanded wechselt auf true');
  else bad('aria-expanded wechselt nicht');

  const ariaModal = await page.locator('.nav-drawer__panel').getAttribute('aria-modal');
  if (ariaModal === 'true') ok('Menü ist als Dialog ausgezeichnet (aria-modal)');
  else bad('aria-modal fehlt am Menü');

  if (await page.locator('[data-nav-close]').isVisible()) ok('Beschrifteter Schliessen-Button vorhanden');
  else bad('Schliessen-Button fehlt');

  // Hintergrund darf sich nicht mitbewegen.
  const gesperrt = await page.evaluate(
    () => getComputedStyle(document.documentElement).overflow === 'hidden'
  );
  if (gesperrt) ok('Hintergrund ist gegen Scrollen gesperrt');
  else bad('Hintergrund lässt sich weiterhin scrollen');

  const fokusDrin = await page.evaluate(
    () => document.querySelector('.nav-drawer__panel')?.contains(document.activeElement) ?? false
  );
  if (fokusDrin) ok('Fokus springt in das geöffnete Menü');
  else bad('Fokus springt nicht in das Menü');

  // Fokusfalle prüfen.
  for (let i = 0; i < 14; i++) await page.keyboard.press('Tab');
  const nochDrin = await page.evaluate(
    () => document.querySelector('.nav-drawer__panel')?.contains(document.activeElement) ?? false
  );
  if (nochDrin) ok('Fokus bleibt im geöffneten Menü gefangen');
  else bad('Fokus verlässt das geöffnete Menü');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);

  if (!(await drawer.isVisible())) ok('Escape schliesst das Menü');
  else bad('Escape schliesst das Menü nicht');

  const fokusZurueck = await page.evaluate(
    () => document.activeElement?.hasAttribute('data-nav-toggle') ?? false
  );
  if (fokusZurueck) ok('Fokus kehrt zur Menüschaltfläche zurück');
  else bad('Fokus kehrt nicht zur Schaltfläche zurück');

  const scrollNachher = await page.evaluate(() => Math.round(window.scrollY));
  if (Math.abs(scrollNachher - scrollVorher) <= 2) {
    ok(`Scrollposition bleibt erhalten (${scrollVorher} px)`);
  } else {
    bad(`Scrollposition verschoben: ${scrollVorher} → ${scrollNachher}`);
  }

  // Öffnen und über einen Menüpunkt schliessen.
  await clickInPage(page, '[data-nav-toggle]');
  await page.waitForTimeout(400);
  await clickInPage(page, '.nav-drawer__link');
  await page.waitForTimeout(400);
  const nachKlick = await page.evaluate(
    () => getComputedStyle(document.documentElement).overflow !== 'hidden'
  );
  if (nachKlick) ok('Klick auf einen Menüpunkt schliesst das Menü und löst die Sperre');
  else bad('Sperre bleibt nach einem Klick auf einen Menüpunkt bestehen');

  await page.close();
}

// ===========================================================================
head('7. Tastaturbedienung und Fokus');

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

  let ohneRing = 0;
  for (let i = 0; i < 16; i++) {
    const sichtbar = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return true;
      const s = getComputedStyle(el);
      return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
    });
    if (!sichtbar) ohneRing++;
    await page.keyboard.press('Tab');
  }

  if (ohneRing === 0) ok('Alle geprüften Elemente zeigen einen sichtbaren Fokusring');
  else bad(`${ohneRing} Element(e) ohne sichtbaren Fokusring`);

  await page.goto(BASE + '/leistungen/', { waitUntil: 'networkidle' });
  await page.locator('.faq__question').nth(1).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const offen = await page.locator('.faq__item').nth(1).evaluate((el) => el.hasAttribute('open'));
  if (offen) ok('FAQ lässt sich per Tastatur öffnen');
  else bad('FAQ öffnet sich nicht per Tastatur');

  await page.close();
}

// ===========================================================================
head('8. Kontaktformular');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + '/kontakt/', { waitUntil: 'networkidle' });

  // --- Das entfernte Feld darf nirgends mehr auftauchen --------------------
  const html = await page.content();
  const rest = ['kf-leistung', 'Gewünschte Leistung', 'name="service"'].filter((t) => html.includes(t));
  if (rest.length === 0) ok('Feld „Gewünschte Leistung“ ist vollständig entfernt');
  else bad(`Reste des entfernten Feldes gefunden: ${rest.join(', ')}`);

  // --- Vor dem ersten Absenden: keine Fehler -------------------------------
  const startzustand = await page.evaluate(() => ({
    meldungen: [...document.querySelectorAll('[data-error-for]')].filter((e) => e.textContent.trim()).length,
    invalid: document.querySelectorAll('[aria-invalid="true"]').length,
    summary: !document.querySelector('[data-error-summary]')?.hidden,
  }));

  if (startzustand.meldungen === 0 && startzustand.invalid === 0 && !startzustand.summary) {
    ok('Beim Laden sind keine Fehlermeldungen sichtbar');
  } else {
    bad(`Beim Laden bereits Fehler sichtbar: ${JSON.stringify(startzustand)}`);
  }

  // --- Feld fokussieren und leer verlassen: weiterhin keine Fehler ---------
  await page.locator('#kf-name').focus();
  await page.locator('#kf-email').focus();
  await page.locator('#kf-nachricht').focus();
  await page.locator('#kf-firma').focus();
  await page.waitForTimeout(250);

  const nachBlur = await page.evaluate(() => ({
    meldungen: [...document.querySelectorAll('[data-error-for]')].filter((e) => e.textContent.trim()).length,
    invalid: document.querySelectorAll('[aria-invalid="true"]').length,
  }));

  if (nachBlur.meldungen === 0 && nachBlur.invalid === 0) {
    ok('Leeres Feld verlassen erzeugt keine Fehlermeldung');
  } else {
    bad(`Fehler allein durch Verlassen des Feldes: ${JSON.stringify(nachBlur)}`);
  }

  // --- Optionale Felder dürfen nie bemängelt werden ------------------------
  await page.fill('#kf-telefon', '');
  await page.locator('#kf-telefon').blur();
  await page.waitForTimeout(150);
  const telefonFehler = await page.locator('[data-error-for="kf-telefon"]').textContent();
  if (!telefonFehler?.trim()) ok('Leeres optionales Feld wird nicht bemängelt');
  else bad(`Optionales Feld bemängelt: ${telefonFehler}`);

  // --- Leer absenden: jetzt erscheinen Fehler ------------------------------
  await clickInPage(page, '[data-submit]');
  await page.waitForTimeout(350);

  const nachSubmit = await page.evaluate(() => ({
    meldungen: [...document.querySelectorAll('[data-error-for]')].filter((e) => e.textContent.trim()).length,
    invalid: document.querySelectorAll('[aria-invalid="true"]').length,
    summaryOffen: !document.querySelector('[data-error-summary]')?.hidden,
    summaryEintraege: document.querySelectorAll('[data-summary-list] li').length,
    fokus: document.activeElement?.id,
  }));

  if (nachSubmit.meldungen >= 4) ok(`Nach dem Absenden erscheinen Fehlermeldungen (${nachSubmit.meldungen})`);
  else bad(`Zu wenige Fehlermeldungen nach dem Absenden: ${nachSubmit.meldungen}`);

  if (nachSubmit.summaryOffen && nachSubmit.summaryEintraege >= 4) {
    ok(`Fehlerzusammenfassung mit ${nachSubmit.summaryEintraege} Einträgen`);
  } else {
    bad('Fehlerzusammenfassung fehlt oder ist unvollständig');
  }

  if (nachSubmit.fokus === 'kf-name') ok('Fokus springt auf das erste fehlerhafte Feld');
  else bad(`Fokus springt nicht auf das erste Feld (war: ${nachSubmit.fokus})`);

  // Auswahlfeld mit „Bitte wählen“ gilt als leer.
  const anliegenFehler = await page.locator('[data-error-for="kf-anliegen"]').textContent();
  if (anliegenFehler?.trim()) ok('Auswahlfeld ohne Auswahl wird als fehlend erkannt');
  else bad('Auswahlfeld ohne Auswahl wird nicht bemängelt');

  // --- Korrektur lässt den Fehler sofort verschwinden ----------------------
  await page.fill('#kf-name', 'Maria Muster');
  await page.waitForTimeout(250);

  const nachKorrektur = await page.evaluate(() => ({
    nameFehler: document.querySelector('[data-error-for="kf-name"]')?.textContent.trim(),
    nameInvalid: document.querySelector('#kf-name')?.getAttribute('aria-invalid'),
    emailFehler: document.querySelector('[data-error-for="kf-email"]')?.textContent.trim(),
  }));

  if (!nachKorrektur.nameFehler && !nachKorrektur.nameInvalid) {
    ok('Korrigiertes Feld verliert seine Fehlermarkierung sofort');
  } else {
    bad('Korrigiertes Feld bleibt fehlerhaft markiert');
  }

  if (nachKorrektur.emailFehler) ok('Andere fehlerhafte Felder bleiben markiert');
  else bad('Andere Felder verlieren ihre Markierung fälschlich');

  // --- Verknüpfung für Screenreader ----------------------------------------
  const verknuepfung = await page.evaluate(() => {
    const field = document.querySelector('#kf-email');
    const described = (field?.getAttribute('aria-describedby') || '').split(/\s+/);
    return {
      verweist: described.includes('kf-email-fehler'),
      zielVorhanden: !!document.getElementById('kf-email-fehler'),
      summaryRolle: document.querySelector('[data-error-summary]')?.getAttribute('role'),
    };
  });

  if (verknuepfung.verweist && verknuepfung.zielVorhanden) {
    ok('Fehlermeldung ist über aria-describedby mit dem Feld verknüpft');
  } else {
    bad('Fehlermeldung ist nicht mit dem Feld verknüpft');
  }

  if (verknuepfung.summaryRolle === 'alert') ok('Fehlerzusammenfassung wird angesagt (role="alert")');
  else bad('Fehlerzusammenfassung hat keine passende Rolle');

  // --- Alle Felder haben ein Label -----------------------------------------
  const ohneLabel = await page.evaluate(() =>
    [...document.querySelectorAll('#kontaktformular input:not([type=hidden]), #kontaktformular select, #kontaktformular textarea')]
      .filter((el) => !document.querySelector(`label[for="${el.id}"]`))
      .map((el) => el.name || el.id)
  );
  if (ohneLabel.length === 0) ok('Alle Formularfelder haben ein verknüpftes Label');
  else bad(`Felder ohne Label: ${ohneLabel.join(', ')}`);

  await page.close();
}

// --- Fehlermeldungen auf Mobilgeräten ---------------------------------------
{
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  await page.goto(BASE + '/kontakt/', { waitUntil: 'networkidle' });
  await clickInPage(page, '[data-submit]');
  await page.waitForTimeout(350);

  const mobil = await page.evaluate(() => {
    const doc = document.documentElement;
    const summary = document.querySelector('[data-error-summary]');
    const r = summary?.getBoundingClientRect();
    return {
      ueberlauf: doc.scrollWidth > doc.clientWidth + 1,
      summarySichtbar: !!r && r.width > 0,
      summaryPasst: !!r && r.right <= doc.clientWidth + 1,
    };
  });

  if (!mobil.ueberlauf) ok('Mobil: kein waagrechtes Scrollen trotz Fehlermeldungen');
  else bad('Mobil: Fehlermeldungen verursachen waagrechtes Scrollen');

  if (mobil.summarySichtbar && mobil.summaryPasst) ok('Mobil: Fehlerzusammenfassung passt in die Breite');
  else bad('Mobil: Fehlerzusammenfassung ragt heraus oder fehlt');

  await page.close();
}

// ===========================================================================
head('9. Reduzierte Bewegung');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const versteckt = await page.evaluate(
    () => [...document.querySelectorAll('[data-reveal]')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length
  );
  if (versteckt === 0) ok('Alle Inhalte sind sofort sichtbar');
  else bad(`${versteckt} Element(e) bleiben ausgeblendet`);

  const animiert = await page.evaluate(
    () => [...document.querySelectorAll('*')].filter((el) => {
      const s = getComputedStyle(el);
      return s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.05;
    }).length
  );
  if (animiert === 0) ok('Keine laufenden Animationen');
  else bad(`${animiert} Element(e) animieren trotzdem`);

  // Die Mausbewegung im Hero darf nichts verschieben.
  await page.mouse.move(200, 300);
  await page.mouse.move(1000, 600);
  await page.waitForTimeout(300);
  const verschoben = await page.evaluate(
    () => [...document.querySelectorAll('[data-parallax]')]
      .filter((el) => el.style.transform && el.style.transform !== 'none').length
  );
  if (verschoben === 0) ok('Mausbewegung verschiebt nichts');
  else bad(`${verschoben} Element(e) reagieren trotzdem auf die Maus`);

  await page.close();
}

// ===========================================================================
head('10. Ohne JavaScript');

{
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const text = await page.locator('body').innerText();
  if (text.includes('Kostenloses Erstgespräch')) ok('Startseite zeigt ihre Inhalte auch ohne JavaScript');
  else bad('Startseite ist ohne JavaScript unvollständig');

  await page.goto(BASE + '/kontakt/', { waitUntil: 'domcontentloaded' });
  const action = await page.locator('#kontaktformular').getAttribute('action');
  const method = await page.locator('#kontaktformular').getAttribute('method');
  if (action === '/api/kontakt.php' && method === 'post') ok('Formular sendet auch ohne JavaScript');
  else bad(`Formular ohne JavaScript nicht versandfähig (action=${action}, method=${method})`);

  if ((await page.locator('.noscript-note').count()) > 0) ok('Hinweis für deaktiviertes JavaScript vorhanden');
  else bad('Hinweis für deaktiviertes JavaScript fehlt');

  await context.close();
}

// ===========================================================================
head('11. Adminbereich');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message.slice(0, 120)));

  const response = await page.goto(BASE + '/admin/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  if (response?.status() === 200) ok('Adminbereich ist unter /admin/ erreichbar');
  else bad(`Adminbereich antwortet mit Status ${response?.status()}`);

  const geladen = await page.evaluate(() => typeof window.CMS !== 'undefined');
  if (geladen) ok('Decap CMS wird geladen');
  else bad('Decap CMS wird nicht geladen');

  const text = await page.locator('body').innerText();
  if (/GitHub/i.test(text)) ok('Anmeldung über GitHub wird angeboten');
  else bad('Anmeldemaske fehlt');

  const robots = await page.evaluate(
    () => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''
  );
  if (/noindex/.test(robots)) ok('Adminbereich ist nicht indexierbar');
  else bad('Adminbereich ist nicht vor Indexierung geschützt');

  // Es darf kein Token und kein Secret im Seitenquelltext stehen.
  const quelltext = await page.content();
  const secretPattern = /(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|client_secret)/i;
  if (!secretPattern.test(quelltext)) ok('Keine Zugangsdaten im Adminbereich');
  else bad('Möglicherweise Zugangsdaten im Adminbereich gefunden');

  if (fehler.length === 0) ok('Adminbereich ohne Skriptfehler');
  else bad(`Skriptfehler im Adminbereich: ${fehler[0]}`);

  await page.close();
}

// ===========================================================================
head('12. Projektseiten und Bilder aus den CMS-Daten');

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Alle Projekte der Übersicht müssen eine erreichbare Unterseite haben.
  await page.goto(BASE + '/projekte/', { waitUntil: 'networkidle' });
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="/projekte/"]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h !== '/projekte/')
  );

  const unique = [...new Set(links)];
  if (unique.length > 0) ok(`${unique.length} Projekte auf der Übersicht verlinkt`);
  else bad('Keine Projekte auf der Übersicht');

  let defekt = 0;
  for (const href of unique) {
    const r = await page.goto(BASE + href, { waitUntil: 'domcontentloaded' });
    if (r?.status() !== 200) {
      bad(`Projektseite nicht erreichbar: ${href}`);
      defekt++;
      continue;
    }

    const seite = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      titel: document.title,
      beschreibung: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      schema: document.querySelectorAll('script[type="application/ld+json"]').length,
    }));

    if (seite.h1 !== 1 || !seite.titel || !seite.beschreibung || !seite.canonical || seite.schema === 0) {
      bad(`Projektseite unvollständig: ${href} – ${JSON.stringify(seite)}`);
      defekt++;
    }
  }

  if (defekt === 0) ok('Alle Projektseiten vollständig (h1, Titel, Beschreibung, Canonical, strukturierte Daten)');

  // Bilder auf den Projektseiten prüfen.
  await page.goto(BASE + '/projekte/', { waitUntil: 'networkidle' });
  const bilder = await page.evaluate(() =>
    [...document.querySelectorAll('img')].map((img) => ({
      src: img.getAttribute('src'),
      hatAlt: img.hasAttribute('alt'),
      hatMasse: img.hasAttribute('width') && img.hasAttribute('height'),
      geladen: img.complete && img.naturalWidth > 0,
    }))
  );

  const ohneAlt = bilder.filter((b) => !b.hatAlt);
  if (ohneAlt.length === 0) ok(`${bilder.length} Bilder auf der Projektübersicht, alle mit alt-Attribut`);
  else bad(`${ohneAlt.length} Bild(er) ohne alt-Attribut`);

  const ohneMasse = bilder.filter((b) => !b.hatMasse);
  if (ohneMasse.length === 0) ok('Alle Bilder haben feste Masse (kein Layoutsprung)');
  else bad(`${ohneMasse.length} Bild(er) ohne width/height`);

  const nichtGeladen = bilder.filter((b) => !b.geladen);
  if (nichtGeladen.length === 0) ok('Alle Bilder wurden geladen');
  else bad(`${nichtGeladen.length} Bild(er) nicht geladen: ${nichtGeladen[0]?.src}`);

  await page.close();
}

await browser.close();

console.log('\n' + '─'.repeat(74));
console.log(errors === 0
  ? `\x1b[32m\x1b[1m  Browserprüfung bestanden\x1b[0m – ${passed} Prüfungen`
  : `\x1b[31m\x1b[1m  ${errors} Fehler\x1b[0m – ${passed} Prüfungen bestanden`);
console.log('─'.repeat(74) + '\n');
process.exit(errors === 0 ? 0 : 1);
