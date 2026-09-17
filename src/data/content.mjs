/**
 * ============================================================================
 *  INHALTE LADEN
 * ============================================================================
 *
 *  Sämtliche Inhalte liegen als YAML unter `content/`. Diese Dateien werden im
 *  Adminbereich (/admin/) von Decap CMS bearbeitet und beim Veröffentlichen
 *  direkt ins Git-Repository geschrieben.
 *
 *  Dieses Modul liest die Dateien zur Bauzeit ein und stellt sie den Seiten
 *  und Komponenten zur Verfügung. Zur Laufzeit im Browser passiert nichts
 *  davon – das Ergebnis ist reines statisches HTML.
 *
 *  Struktur:
 *    content/settings/*.yml   – Einstellungen und Listen (je eine Datei)
 *    content/projects/*.yml   – ein Projekt pro Datei
 * ============================================================================
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { load } from 'js-yaml';

/**
 * Sucht das Verzeichnis `content/`.
 *
 * Nötig, weil dieses Modul in zwei Umgebungen ausgewertet wird: einmal direkt
 * aus `src/` (Konfiguration, Node-Skripte) und einmal aus dem Server-Bundle,
 * das Astro beim statischen Build nach `dist/` schreibt und anschliessend
 * ausführt. Ein modulrelativer Pfad würde im zweiten Fall ins Leere zeigen.
 *
 * Gesucht wird darum ausgehend vom Arbeitsverzeichnis und vom Modulpfad
 * aufwärts, bis ein Ordner mit `settings/site.yml` gefunden ist.
 */
function findContentDir() {
  const starts = [process.cwd(), dirname(fileURLToPath(import.meta.url))];

  for (const start of starts) {
    let current = start;

    // Maximal zehn Ebenen nach oben – verhindert eine Endlosschleife.
    for (let depth = 0; depth < 10; depth++) {
      const candidate = join(current, 'content');
      if (existsSync(join(candidate, 'settings', 'site.yml'))) return candidate;

      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  throw new Error(
    'Das Verzeichnis content/ wurde nicht gefunden. Erwartet wird content/settings/site.yml '
      + 'im Projektstammverzeichnis.'
  );
}

const CONTENT = findContentDir();

/**
 * Liest eine YAML-Datei aus `content/`.
 *
 * @param {string} relativePath Pfad unterhalb von content/
 * @param {unknown} [fallback] Rückgabewert, falls die Datei fehlt
 */
function readYaml(relativePath, fallback = {}) {
  const file = join(CONTENT, relativePath);

  if (!existsSync(file)) {
    console.warn(`[content] Datei fehlt, verwende Standardwerte: content/${relativePath}`);
    return fallback;
  }

  try {
    return load(readFileSync(file, 'utf8')) ?? fallback;
  } catch (error) {
    throw new Error(`content/${relativePath} ist kein gültiges YAML: ${error.message}`);
  }
}

/**
 * Sortiert nach dem Feld `order` und entfernt ausgeblendete Einträge.
 * Einträge ohne `visible` gelten als sichtbar.
 *
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
export function activeSorted(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.visible !== false)
    .sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));
}

// ---------------------------------------------------------------------------
//  Rohdaten
// ---------------------------------------------------------------------------

export const siteData = readYaml('settings/site.yml');
export const homeData = readYaml('settings/home.yml');
export const pagesData = readYaml('settings/pages.yml');
export const servicesData = readYaml('settings/services.yml', { items: [] });
export const benefitsData = readYaml('settings/benefits.yml', { items: [] });
export const processData = readYaml('settings/process.yml', { items: [], notes: [] });
export const teamData = readYaml('settings/team.yml', { items: [] });
export const faqData = readYaml('settings/faq.yml', { home: [], services: [] });

/** Alle Projektdateien aus content/projects/. */
export const projectsData = (() => {
  const directory = join(CONTENT, 'projects');
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter((file) => /\.ya?ml$/i.test(file))
    .map((file) => {
      const data = load(readFileSync(join(directory, file), 'utf8')) ?? {};
      // Fällt der Slug weg, dient der Dateiname als Rückfallebene.
      return { ...data, slug: data.slug || file.replace(/\.ya?ml$/i, '') };
    });
})();

// ---------------------------------------------------------------------------
//  Hilfsfunktionen für die Darstellung
// ---------------------------------------------------------------------------

/** Maskiert HTML-Sonderzeichen. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wandelt die Hervorhebung `**Wort**` in eine farbig abgesetzte Auszeichnung um.
 *
 * Redaktion schreibt im Adminbereich zum Beispiel:
 *     Websites, die Ihr Unternehmen **weiterbringen**
 *
 * Der Text wird vorher maskiert, damit aus dem CMS kein HTML eingeschleust
 * werden kann.
 *
 * @param {string} text
 * @returns {string} HTML
 */
export function renderAccent(text) {
  if (!text) return '';
  return escapeHtml(text).replace(
    /\*\*(.+?)\*\*/g,
    '<span class="accent-text">$1</span>'
  );
}

/** Entfernt die Hervorhebungszeichen – für Titel, Meta-Angaben und Alt-Texte. */
export function plainText(text) {
  return text ? String(text).replace(/\*\*(.+?)\*\*/g, '$1') : '';
}
