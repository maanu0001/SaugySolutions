/**
 * ============================================================================
 *  DEPLOYMENT-BUILD
 * ============================================================================
 *
 *  Erzeugt den vollständig hochladbaren Ordner dist/.
 *
 *  Ablauf:
 *    1. dist/ leeren
 *    2. statische Website bauen (Astro, output: "static")
 *    3. Apache-Konfiguration (.htaccess) ergänzen
 *    4. PHP-Endpunkt inklusive Abhängigkeiten kopieren
 *    5. Ergebnis prüfen und offene Angaben melden
 *
 *  Nach dem Durchlauf enthält dist/ alles, was auf den Webspace gehört – und
 *  nichts darüber hinaus. Auf dem Server werden weder Node.js noch Composer
 *  benötigt.
 *
 *  Aufruf:  npm run deploy:build
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm, writeFile, readdir, stat, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { PENDING_FIELDS } from '../src/data/site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SERVER = join(ROOT, 'server');

const log = {
  step: (n, text) => console.log(`\n\x1b[36m[${n}]\x1b[0m ${text}`),
  ok: (text) => console.log(`    \x1b[32m✓\x1b[0m ${text}`),
  warn: (text) => console.log(`    \x1b[33m!\x1b[0m ${text}`),
  fail: (text) => console.log(`    \x1b[31m✗\x1b[0m ${text}`),
};

/** Führt einen Befehl aus und bricht bei Fehler ab. */
function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\nBefehl fehlgeschlagen: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

/** Ermittelt Dateianzahl und Gesamtgrösse eines Ordners. */
async function measure(directory) {
  let files = 0;
  let bytes = 0;

  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        files++;
        bytes += (await stat(full)).size;
      }
    }
  }

  await walk(directory);
  return { files, bytes };
}

// ---------------------------------------------------------------------------

console.log('\n\x1b[1mSaugy Solutions – Deployment-Build\x1b[0m');

// --- 1. Aufräumen ----------------------------------------------------------
log.step(1, 'Vorherigen Build entfernen');
await rm(DIST, { recursive: true, force: true });
log.ok('dist/ geleert');

// --- 2. Statische Website --------------------------------------------------
log.step(2, 'Statische Website bauen');
run('npx', ['astro', 'build']);

// --- 3. Apache-Konfiguration ----------------------------------------------
log.step(3, 'Apache-Konfiguration ergänzen');
await cp(join(SERVER, 'apache/htaccess'), join(DIST, '.htaccess'));
log.ok('.htaccess im Wurzelverzeichnis');

// --- 4. PHP-Endpunkt -------------------------------------------------------
log.step(4, 'Kontaktformular-Endpunkt kopieren');

const API = join(DIST, 'api');
await mkdir(API, { recursive: true });

await cp(join(SERVER, 'api/kontakt.php'), join(API, 'kontakt.php'));
log.ok('api/kontakt.php');

await cp(join(SERVER, 'lib'), join(API, 'lib'), { recursive: true });
log.ok('api/lib/ (Hilfsklassen)');

// PHPMailer und Autoloader – damit auf dem Server kein Composer nötig ist.
if (!existsSync(join(SERVER, 'vendor/autoload.php'))) {
  log.fail('server/vendor/ fehlt. Bitte zuerst ausführen: cd server && composer install --no-dev');
  process.exit(1);
}
await cp(join(SERVER, 'vendor'), join(API, 'vendor'), { recursive: true });
log.ok('api/vendor/ (PHPMailer, ohne Composer nutzbar)');

// Konfigurationsvorlage – ohne echte Zugangsdaten.
await mkdir(join(API, 'config'), { recursive: true });
await cp(join(SERVER, 'config/config.example.php'), join(API, 'config/config.example.php'));
await cp(join(SERVER, 'apache/htaccess-deny'), join(API, 'config/.htaccess'));
log.ok('api/config/ (nur Vorlage, Zugriff gesperrt)');

// Ordner für Laufzeitdaten der Ratenbegrenzung.
await mkdir(join(API, 'var'), { recursive: true });
await cp(join(SERVER, 'apache/htaccess-deny'), join(API, 'var/.htaccess'));
await writeFile(
  join(API, 'var/.gitkeep'),
  '# Laufzeitdaten der Ratenbegrenzung. Muss für PHP beschreibbar sein.\n'
);
log.ok('api/var/ (Laufzeitdaten, Zugriff gesperrt)');

// Zugriffsschutz für den gesamten api-Ordner.
await cp(join(SERVER, 'apache/htaccess-api'), join(API, '.htaccess'));
log.ok('api/.htaccess (nur kontakt.php erreichbar)');

// --- 5. Kontrolle -----------------------------------------------------------
log.step(5, 'Ergebnis prüfen');

let problems = 0;

/** Dateien, die im Deployment auf keinen Fall vorkommen dürfen. */
const forbidden = [
  'node_modules',
  '.astro',
  'src',
  'package.json',
  'package-lock.json',
  'astro.config.mjs',
  'tsconfig.json',
  'api/config/config.php',
  'api/vendor/phpmailer/phpmailer/.git',
];

for (const entry of forbidden) {
  if (existsSync(join(DIST, entry))) {
    log.fail(`Darf nicht im Deployment sein: ${entry}`);
    problems++;
  }
}

/** Dateien, die zwingend vorhanden sein müssen. */
const required = [
  'index.html',
  '404.html',
  'robots.txt',
  'sitemap-index.xml',
  'site.webmanifest',
  'favicon.ico',
  '.htaccess',
  'api/kontakt.php',
  'api/vendor/autoload.php',
  'api/lib/Mailer.php',
  'fonts/manrope-latin-var.woff2',
  'img/og-saugy-solutions.png',
  'kontakt/index.html',
  'danke/index.html',
  'impressum/index.html',
  'datenschutz/index.html',
];

for (const entry of required) {
  if (!existsSync(join(DIST, entry))) {
    log.fail(`Fehlt im Deployment: ${entry}`);
    problems++;
  }
}

if (problems === 0) {
  log.ok('Alle erwarteten Dateien vorhanden, keine Entwicklungsdateien enthalten');
}

// Sicherheitsnetz: keine Zugangsdaten im Deployment.
const configInDist = join(DIST, 'api/config/config.php');
if (existsSync(configInDist)) {
  log.fail('api/config/config.php ist im Build gelandet – enthält möglicherweise Zugangsdaten!');
  problems++;
}

const { files, bytes } = await measure(DIST);
log.ok(`${files} Dateien, ${(bytes / 1024 / 1024).toFixed(2)} MB`);

// --- 6. Offene Angaben ------------------------------------------------------
if (PENDING_FIELDS.length > 0) {
  console.log('\n\x1b[33m\x1b[1m  VOR DER VERÖFFENTLICHUNG ZWINGEND ERGÄNZEN\x1b[0m');
  console.log('  Die folgenden Angaben stehen noch als Platzhalter in src/data/site.mjs');
  console.log('  und erscheinen sichtbar markiert auf Impressum und Datenschutzseite:\n');

  for (const field of PENDING_FIELDS) {
    console.log(`    • ${field.label}${field.hint ? ` – ${field.hint}` : ''}`);
  }

  console.log('\n  Diese Angaben dürfen nicht erfunden werden. Details: README.md');
}

// --- 7. Abschluss -----------------------------------------------------------
console.log('\n' + '─'.repeat(74));

if (problems > 0) {
  console.log(`\x1b[31m  Build abgeschlossen, aber ${problems} Problem(e) gefunden.\x1b[0m`);
  process.exit(1);
}

console.log('\x1b[32m\x1b[1m  Deployment-Build erfolgreich.\x1b[0m');
console.log(`
  Nächste Schritte:

    1. Inhalt von ${relative(process.cwd(), DIST) || 'dist'}/ auf den Webspace laden
       (alles INNERHALB des Ordners, nicht den Ordner selbst)
    2. api/config/config.example.php kopieren nach
       ../saugy-solutions-config.php  (eine Ebene über dem Webroot)
    3. Darin SMTP-Zugangsdaten und ip_hash_secret eintragen
    4. Schreibrechte für api/var/ setzen (chmod 750 oder 755)
    5. Formular testen – Anleitung in README.md
`);
console.log('─'.repeat(74) + '\n');
