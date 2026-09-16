/**
 * ============================================================================
 *  QUALITÄTSKONTROLLE
 * ============================================================================
 *
 *  Prüft den fertigen Build in dist/ auf:
 *
 *    1. interne Links (keine Verweise ins Leere)
 *    2. Überschriftenstruktur (genau eine h1, keine übersprungenen Ebenen)
 *    3. Alt-Texte bei Bildern
 *    4. Metadaten (Titel, Beschreibung, Canonical – vorhanden und eindeutig)
 *    5. strukturierte Daten (gültiges JSON)
 *    6. Reste aus Vorlagen und Platzhaltertexte
 *    7. Schweizer Schreibweise (kein „ß“)
 *    8. Sitemap und robots.txt
 *
 *  Aufruf:  npm run qa     (setzt einen abgeschlossenen Build voraus)
 * ============================================================================
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

let errors = 0;
let warnings = 0;
let checks = 0;

const fail = (text) => {
  console.log(`  \x1b[31m✗\x1b[0m ${text}`);
  errors++;
};
const warn = (text) => {
  console.log(`  \x1b[33m!\x1b[0m ${text}`);
  warnings++;
};
const pass = (text) => {
  console.log(`  \x1b[32m✓\x1b[0m ${text}`);
  checks++;
};
const section = (text) => console.log(`\n\x1b[1m${text}\x1b[0m`);

if (!existsSync(DIST)) {
  console.error('dist/ fehlt. Bitte zuerst „npm run deploy:build“ ausführen.');
  process.exit(1);
}

/** Sammelt alle HTML-Dateien des Builds. */
async function collectHtml(directory, found = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      // Abhängigkeiten des PHP-Endpunkts nicht prüfen.
      if (entry.name === 'vendor') continue;
      await collectHtml(full, found);
    } else if (entry.name.endsWith('.html')) {
      found.push(full);
    }
  }
  return found;
}

const files = await collectHtml(DIST);
const pages = [];

for (const file of files) {
  pages.push({
    file,
    url: '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/'),
    html: await readFile(file, 'utf8'),
  });
}

console.log(`\n\x1b[1mQualitätskontrolle – ${pages.length} Seiten\x1b[0m`);

// ---------------------------------------------------------------------------
//  1. Interne Links
// ---------------------------------------------------------------------------
section('1. Interne Links');

/** Prüft, ob ein Pfad im Build existiert. */
function resolves(path) {
  const clean = path.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return existsSync(join(DIST, 'index.html'));

  const target = join(DIST, clean);
  if (existsSync(target)) return true;
  if (existsSync(join(target, 'index.html'))) return true;
  if (existsSync(target.replace(/\/$/, '') + '.html')) return true;
  return false;
}

let brokenLinks = 0;
let internalLinks = 0;
const anchorTargets = new Map();

for (const page of pages) {
  // Anker-Ziele dieser Seite erfassen (id="…").
  anchorTargets.set(page.url, new Set([...page.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

for (const page of pages) {
  for (const match of page.html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];

    // Externe Ziele, Sonderprotokolle und reine Anker überspringen.
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;

    if (href.startsWith('#')) {
      const targets = anchorTargets.get(page.url) ?? new Set();
      if (href !== '#' && !targets.has(href.slice(1))) {
        fail(`${page.url}: Anker ohne Ziel – ${href}`);
        brokenLinks++;
      }
      continue;
    }

    if (!href.startsWith('/')) continue;

    internalLinks++;
    if (!resolves(href)) {
      // Der PHP-Endpunkt wird erst beim Deployment-Build ergänzt.
      if (href.startsWith('/api/')) continue;
      fail(`${page.url}: Link ins Leere – ${href}`);
      brokenLinks++;
    }

    // Anker auf einer anderen Seite prüfen.
    const [path, hash] = href.split('#');
    if (hash) {
      const targetUrl = path.endsWith('/') ? path : `${path}/`;
      const targets = anchorTargets.get(targetUrl);
      if (targets && !targets.has(hash)) {
        fail(`${page.url}: Anker ${hash} existiert nicht auf ${targetUrl}`);
        brokenLinks++;
      }
    }
  }
}

if (brokenLinks === 0) pass(`${internalLinks} interne Links geprüft, alle erreichbar`);

// ---------------------------------------------------------------------------
//  2. Überschriftenstruktur
// ---------------------------------------------------------------------------
section('2. Überschriftenstruktur');

let headingProblems = 0;

for (const page of pages) {
  const headings = [...page.html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  const h1Count = headings.filter((level) => level === 1).length;

  if (h1Count !== 1) {
    fail(`${page.url}: ${h1Count} h1-Überschriften (genau eine erwartet)`);
    headingProblems++;
  }

  // Keine Ebene überspringen (h2 -> h4).
  let previous = 0;
  for (const level of headings) {
    if (previous !== 0 && level > previous + 1) {
      warn(`${page.url}: Sprung von h${previous} zu h${level}`);
      headingProblems++;
      break;
    }
    previous = level;
  }
}

if (headingProblems === 0) pass('Alle Seiten haben genau eine h1 und eine lückenlose Gliederung');

// ---------------------------------------------------------------------------
//  3. Alt-Texte
// ---------------------------------------------------------------------------
section('3. Alt-Texte bei Bildern');

let imageProblems = 0;
let imageCount = 0;

for (const page of pages) {
  for (const match of page.html.matchAll(/<img\b[^>]*>/g)) {
    imageCount++;
    const tag = match[0];
    // Astro kürzt alt="" zu einem blossen `alt` – das ist gültiges HTML5 und
    // wird von Screenreadern als „dekorativ“ behandelt. Beide Formen zählen.
    if (!/\salt(=|[\s/>])/.test(tag)) {
      fail(`${page.url}: <img> ohne alt-Attribut – ${tag.slice(0, 90)}`);
      imageProblems++;
    }
  }
}

if (imageProblems === 0) pass(`${imageCount} Bilder, alle mit alt-Attribut (leer = dekorativ)`);

// ---------------------------------------------------------------------------
//  4. Metadaten
// ---------------------------------------------------------------------------
section('4. Metadaten');

const titles = new Map();
const descriptions = new Map();
let metaProblems = 0;

for (const page of pages) {
  const title = page.html.match(/<title>([^<]*)<\/title>/)?.[1];
  const description = page.html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const canonical = page.html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];

  if (!title) {
    fail(`${page.url}: kein <title>`);
    metaProblems++;
  } else {
    if (title.length > 70) warn(`${page.url}: Titel ist ${title.length} Zeichen lang (Richtwert: bis 70)`);
    if (titles.has(title)) {
      fail(`${page.url}: Titel identisch mit ${titles.get(title)}`);
      metaProblems++;
    }
    titles.set(title, page.url);
  }

  if (!description) {
    fail(`${page.url}: keine Meta-Description`);
    metaProblems++;
  } else {
    if (description.length > 165) {
      warn(`${page.url}: Beschreibung ist ${description.length} Zeichen lang (Richtwert: bis 165)`);
    }
    if (descriptions.has(description)) {
      fail(`${page.url}: Beschreibung identisch mit ${descriptions.get(description)}`);
      metaProblems++;
    }
    descriptions.set(description, page.url);
  }

  if (!canonical) {
    fail(`${page.url}: keine Canonical-URL`);
    metaProblems++;
  }

  if (!/lang="de-CH"/.test(page.html)) {
    fail(`${page.url}: Sprache ist nicht de-CH`);
    metaProblems++;
  }
}

if (metaProblems === 0) pass('Titel, Beschreibung, Canonical und Sprache auf allen Seiten gesetzt und eindeutig');

// ---------------------------------------------------------------------------
//  5. Strukturierte Daten
// ---------------------------------------------------------------------------
section('5. Strukturierte Daten');

let schemaProblems = 0;
let schemaBlocks = 0;

for (const page of pages) {
  for (const match of page.html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )) {
    schemaBlocks++;
    try {
      const parsed = JSON.parse(match[1]);
      if (!parsed['@context'] && !parsed['@type'] && !parsed['@graph']) {
        fail(`${page.url}: JSON-LD ohne @context/@type`);
        schemaProblems++;
      }
    } catch (error) {
      fail(`${page.url}: JSON-LD ist kein gültiges JSON – ${error.message}`);
      schemaProblems++;
    }
  }
}

if (schemaProblems === 0) pass(`${schemaBlocks} JSON-LD-Blöcke, alle gültig`);

// ---------------------------------------------------------------------------
//  6. Reste aus Vorlagen und Platzhalter
// ---------------------------------------------------------------------------
section('6. Vorlagenreste und Platzhalter');

/** Begriffe, die im Ergebnis nicht vorkommen dürfen. */
const forbidden = [
  { pattern: /srrafi/i, label: 'srrafi (Vorlage der alten Website)' },
  { pattern: /pictech/i, label: 'PicTech (Vorlage der alten Website)' },
  { pattern: /\+41\s*79\s*000\s*00\s*00/, label: 'falsche Platzhalternummer +41 79 000 00 00' },
  { pattern: /lorem ipsum/i, label: 'Lorem-Ipsum-Text' },
  { pattern: />\s*Read More\s*</i, label: '„Read More“ (englischer Vorlagentext)' },
  { pattern: /Recent Posts/i, label: '„Recent Posts“ (WordPress-Rest)' },
  { pattern: /Leave a (Reply|Comment)/i, label: 'Kommentarformular-Rest' },
  { pattern: /Applikationsenwicklung/, label: 'Schreibfehler „Applikationsenwicklung“' },
  { pattern: /\bTODO\b|\bFIXME\b|\bXXX\b/, label: 'Bearbeitungsvermerk im Quelltext' },
  { pattern: /Platzhalter-Text|placeholder text/i, label: 'Platzhaltertext' },
];

let leftovers = 0;

for (const page of pages) {
  for (const { pattern, label } of forbidden) {
    if (pattern.test(page.html)) {
      fail(`${page.url}: ${label}`);
      leftovers++;
    }
  }
}

if (leftovers === 0) pass('Keine Vorlagenreste, Platzhalter oder englischen Textbausteine gefunden');

// ---------------------------------------------------------------------------
//  7. Schweizer Schreibweise
// ---------------------------------------------------------------------------
section('7. Schweizer Schreibweise');

let sharpS = 0;

for (const page of pages) {
  // Sichtbaren Text prüfen (ohne Tags), damit Attribute nicht stören.
  const text = page.html.replace(/<[^>]+>/g, ' ');
  const matches = [...text.matchAll(/\S*ß\S*/g)].map((m) => m[0]);

  if (matches.length > 0) {
    fail(`${page.url}: „ß“ statt „ss“ – ${[...new Set(matches)].slice(0, 5).join(', ')}`);
    sharpS++;
  }
}

if (sharpS === 0) pass('Durchgehend Schweizer Schreibweise („ss“ statt „ß“)');

// ---------------------------------------------------------------------------
//  8. Sitemap, robots.txt und Seitenbestand
// ---------------------------------------------------------------------------
section('8. Sitemap und robots.txt');

const robotsPath = join(DIST, 'robots.txt');
if (!existsSync(robotsPath)) {
  fail('robots.txt fehlt');
} else {
  const robots = await readFile(robotsPath, 'utf8');
  if (!robots.includes('Sitemap:')) fail('robots.txt verweist nicht auf die Sitemap');
  else pass('robots.txt vorhanden und verweist auf die Sitemap');
}

const sitemapPath = join(DIST, 'sitemap-0.xml');
if (!existsSync(sitemapPath)) {
  fail('sitemap-0.xml fehlt');
} else {
  const sitemap = await readFile(sitemapPath, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  // Funktionsseiten dürfen nicht in der Sitemap stehen.
  const unwanted = urls.filter((url) => /\/(danke|404)\/?$/.test(url));
  if (unwanted.length > 0) fail(`Sitemap enthält Funktionsseiten: ${unwanted.join(', ')}`);
  else pass(`Sitemap enthält ${urls.length} Seiten, keine Funktionsseiten`);

  // Jede indexierbare Seite muss enthalten sein.
  const indexable = pages.filter((p) => !/noindex/.test(p.html)).map((p) => p.url);
  const missing = indexable.filter(
    (url) => !urls.some((loc) => new URL(loc).pathname === url)
  );
  if (missing.length > 0) fail(`Nicht in der Sitemap: ${missing.join(', ')}`);
  else pass('Alle indexierbaren Seiten sind in der Sitemap enthalten');

  // Umgekehrt: keine noindex-Seite in der Sitemap.
  const noindexPages = pages.filter((p) => /noindex/.test(p.html)).map((p) => p.url);
  const wrongly = urls.filter((loc) => noindexPages.includes(new URL(loc).pathname));
  if (wrongly.length > 0) fail(`noindex-Seiten in der Sitemap: ${wrongly.join(', ')}`);
  else pass('Keine noindex-Seite in der Sitemap');
}

// ---------------------------------------------------------------------------
//  9. Deployment-Hygiene
// ---------------------------------------------------------------------------
section('9. Deployment');

const mustExist = ['.htaccess', 'api/kontakt.php', 'api/vendor/autoload.php', 'site.webmanifest'];
let deployProblems = 0;

for (const entry of mustExist) {
  if (!existsSync(join(DIST, entry))) {
    warn(`${entry} fehlt – wird erst durch „npm run deploy:build“ ergänzt`);
    deployProblems++;
  }
}

if (existsSync(join(DIST, 'api/config/config.php'))) {
  fail('api/config/config.php liegt im Build – Zugangsdaten dürfen nie ausgeliefert werden!');
}

if (deployProblems === 0) pass('Serverdateien vollständig, keine Konfigurationsdatei im Build');

// Gesamtgrösse der Startseite als grober Performance-Anhaltspunkt.
const homeSize = (await stat(join(DIST, 'index.html'))).size;
pass(`Startseite: ${(homeSize / 1024).toFixed(1)} KB HTML`);

// ---------------------------------------------------------------------------
//  Ergebnis
// ---------------------------------------------------------------------------
console.log('\n' + '─'.repeat(74));
console.log(
  errors === 0
    ? `\x1b[32m\x1b[1m  Qualitätskontrolle bestanden\x1b[0m – ${checks} Prüfungen, ${warnings} Hinweis(e)`
    : `\x1b[31m\x1b[1m  ${errors} Fehler gefunden\x1b[0m – ${checks} Prüfungen bestanden, ${warnings} Hinweis(e)`
);
console.log('─'.repeat(74) + '\n');

process.exit(errors === 0 ? 0 : 1);
