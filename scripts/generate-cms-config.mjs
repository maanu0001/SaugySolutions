/**
 * ============================================================================
 *  KONFIGURATION DES ADMINBEREICHS ERZEUGEN
 * ============================================================================
 *
 *  Schreibt `public/admin/config.yml` für Decap CMS.
 *
 *  Die Konfiguration wird bewusst aus dieser Definition erzeugt und nicht von
 *  Hand gepflegt: So bleiben die Felder im Adminbereich und die Struktur der
 *  YAML-Dateien unter `content/` garantiert deckungsgleich.
 *
 *  Anpassbar über Umgebungsvariablen (für den Build):
 *    CMS_REPO    – GitHub-Repository im Format besitzer/name
 *    CMS_BRANCH  – Branch, in den veröffentlicht wird
 *    SITE_URL    – Basisadresse der Website
 *
 *  Aufruf:  npm run assets:cms
 * ============================================================================
 */

import { dump } from 'js-yaml';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SITE } from '../src/data/site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/admin/config.yml');

const REPO = process.env.CMS_REPO || 'maanu0001/SaugySolutions';
const BRANCH = process.env.CMS_BRANCH || 'claude/saugy-solutions-website-b62pey';
const BASE_URL = process.env.SITE_URL || SITE.url;

// ---------------------------------------------------------------------------
//  Wiederverwendbare Feldbausteine
// ---------------------------------------------------------------------------

/** Sichtbarkeit und Reihenfolge – für alle sortierbaren Listen. */
const visibility = [
  {
    label: 'Sichtbar auf der Website',
    name: 'visible',
    widget: 'boolean',
    default: true,
    hint: 'Ausschalten blendet den Eintrag aus, ohne ihn zu löschen.',
  },
  {
    label: 'Reihenfolge',
    name: 'order',
    widget: 'number',
    value_type: 'int',
    min: 1,
    default: 1,
    hint: 'Kleinere Zahl erscheint weiter oben.',
  },
];

/** Auswahl der verfügbaren Symbole. */
const ICON_OPTIONS = [
  'layout', 'shield', 'mail', 'cloud', 'spark', 'user', 'chat', 'stack',
  'target', 'receipt', 'lifebuoy', 'clock', 'compass', 'code', 'document',
  'rocket', 'handshake', 'check',
];

const iconField = (name = 'icon') => ({
  label: 'Symbol',
  name,
  widget: 'select',
  options: ICON_OPTIONS,
  default: 'check',
  hint: 'Bestimmt das Icon, das neben dem Titel erscheint.',
});

/** Überschrift mit Hervorhebung. */
const headingField = (name, label) => ({
  label,
  name,
  widget: 'string',
  hint: 'Einzelne Wörter grün hervorheben: **Wort** in doppelte Sternchen setzen.',
});

// ---------------------------------------------------------------------------
//  Sammlungen
// ---------------------------------------------------------------------------

const settingsFiles = [
  // ======================================================= Allgemeine Angaben
  {
    label: 'Allgemeine Einstellungen',
    name: 'site',
    file: 'content/settings/site.yml',
    description: 'Unternehmensangaben, Logo, Kontaktdaten, Navigation und rechtliche Angaben.',
    fields: [
      {
        label: 'Unternehmen', name: 'company', widget: 'object',
        fields: [
          { label: 'Unternehmensname', name: 'name', widget: 'string' },
          { label: 'Claim', name: 'claim', widget: 'string', required: false },
          {
            label: 'Adresse der Website', name: 'url', widget: 'string',
            hint: 'Vollständig mit https:// und ohne Schrägstrich am Ende.',
          },
        ],
      },
      {
        label: 'Logo und Marke', name: 'branding', widget: 'object',
        fields: [
          {
            label: 'Logo', name: 'logo', widget: 'image',
            media_library: { config: { multiple: false } },
            hint:
              'SVG, PNG oder WebP. SVG wird bevorzugt, weil es in jeder Grösse scharf bleibt. '
              + 'Das Logo wird nie verzerrt oder beschnitten. Nach dem Veröffentlichen werden '
              + 'Favicon, App-Icons und das Social-Media-Bild automatisch neu erzeugt.',
          },
          {
            label: 'Alternativtext des Logos', name: 'logo_alt', widget: 'string',
            hint: 'Wird vorgelesen, wenn das Bild nicht angezeigt werden kann.',
          },
          { label: 'Schriftzug – fetter Teil', name: 'wordmark_strong', widget: 'string' },
          { label: 'Schriftzug – normaler Teil', name: 'wordmark_rest', widget: 'string', required: false },
        ],
      },
      {
        label: 'Kontakt', name: 'contact', widget: 'object',
        fields: [
          { label: 'Ansprechperson', name: 'person', widget: 'string' },
          {
            label: 'Telefonnummer', name: 'phone', widget: 'string',
            hint: 'Internationale Schreibweise, z. B. +41 79 516 30 41.',
          },
          { label: 'E-Mail-Adresse', name: 'email', widget: 'string' },
          {
            label: 'Hinweis zur Rückmeldung', name: 'response_note', widget: 'text',
            hint: 'Bitte keine garantierte Reaktionszeit versprechen, die nicht eingehalten werden kann.',
          },
        ],
      },
      {
        label: 'Rechtliche Angaben', name: 'legal', widget: 'object',
        fields: [
          { label: 'Anbieter', name: 'provider', widget: 'string' },
          { label: 'Verantwortliche Person', name: 'responsible', widget: 'string' },
          {
            label: 'Geschäftsadresse', name: 'address', widget: 'object',
            fields: [
              { label: 'Name', name: 'name', widget: 'string' },
              { label: 'Strasse und Nummer', name: 'street', widget: 'string' },
              { label: 'Postleitzahl', name: 'postalCode', widget: 'string' },
              { label: 'Ort', name: 'locality', widget: 'string' },
              { label: 'Land', name: 'country', widget: 'string', default: 'Schweiz' },
              { label: 'Ländercode', name: 'countryCode', widget: 'string', default: 'CH' },
            ],
          },
          { label: 'Rechtsform', name: 'legal_form', widget: 'string' },
          {
            label: 'UID / MWST-Nummer', name: 'uid', widget: 'string', required: false,
            hint: 'Leer lassen, wenn keine vorhanden ist – die Zeile entfällt dann im Impressum.',
          },
          { label: 'Hostinganbieter', name: 'hosting_provider', widget: 'string' },
          { label: 'Serverstandort', name: 'hosting_location', widget: 'string' },
          { label: 'E-Mail-/SMTP-Anbieter', name: 'mail_provider', widget: 'string' },
          {
            label: 'Stand der Rechtstexte', name: 'last_updated', widget: 'string',
            hint: 'Format JJJJ-MM-TT. Bei inhaltlichen Änderungen aktualisieren.',
          },
        ],
      },
      {
        label: 'Social Media', name: 'social', widget: 'list', required: false, label_singular: 'Profil',
        hint: 'Nur echte, bestehende Profile eintragen. Bleibt die Liste leer, wird der Bereich ausgeblendet.',
        fields: [
          { label: 'Bezeichnung', name: 'label', widget: 'string' },
          { label: 'Adresse', name: 'href', widget: 'string' },
        ],
      },
      {
        label: 'SEO-Standardwerte', name: 'seo', widget: 'object',
        fields: [
          { label: 'Standard-Seitentitel', name: 'default_title', widget: 'string' },
          { label: 'Standard-Beschreibung', name: 'default_description', widget: 'text' },
          {
            label: 'Social-Media-Vorschaubild', name: 'og_image', widget: 'image', required: false,
            hint: 'Wird beim Build automatisch aus Logo und Claim erzeugt. Nur ändern, wenn ein eigenes Bild gewünscht ist.',
          },
          { label: 'Themenfarbe', name: 'theme_color', widget: 'string' },
        ],
      },
      {
        label: 'Footer', name: 'footer', widget: 'object',
        fields: [
          { label: 'Kurzbeschreibung', name: 'intro', widget: 'text' },
          { label: 'Zusatz beim Copyright', name: 'copyright_suffix', widget: 'string' },
        ],
      },
      {
        label: 'Navigation', name: 'navigation', widget: 'list', label_singular: 'Menüpunkt',
        fields: [
          { label: 'Beschriftung', name: 'label', widget: 'string' },
          { label: 'Ziel', name: 'href', widget: 'string', hint: 'z. B. /leistungen/' },
        ],
      },
      {
        label: 'Hervorgehobener Menüpunkt', name: 'navigation_cta', widget: 'object',
        fields: [
          { label: 'Beschriftung', name: 'label', widget: 'string' },
          { label: 'Ziel', name: 'href', widget: 'string' },
        ],
      },
      {
        label: 'Rechtliche Links im Footer', name: 'footer_legal', widget: 'list', label_singular: 'Link',
        fields: [
          { label: 'Beschriftung', name: 'label', widget: 'string' },
          { label: 'Ziel', name: 'href', widget: 'string' },
        ],
      },
      {
        label: 'Kontaktformular', name: 'form', widget: 'object',
        fields: [
          { label: 'Ziel des Formulars', name: 'action', widget: 'string' },
          { label: 'Bestätigungsseite', name: 'success_page', widget: 'string' },
          {
            label: 'Maximale Zeichenzahl der Nachricht', name: 'message_max_length',
            widget: 'number', value_type: 'int', min: 200,
          },
        ],
      },
    ],
  },

  // ================================================================ Startseite
  {
    label: 'Startseite',
    name: 'home',
    file: 'content/settings/home.yml',
    description: 'Hero, Abschnitte und Abschluss-Aufruf der Startseite.',
    fields: [
      {
        label: 'Hero', name: 'hero', widget: 'object',
        fields: [
          { label: 'Kleine Auszeichnung', name: 'eyebrow', widget: 'string', required: false },
          headingField('title', 'Hauptaussage'),
          { label: 'Unterzeile', name: 'subtitle', widget: 'text' },
          {
            label: 'Primärer Button', name: 'primary_cta', widget: 'object',
            fields: [
              { label: 'Beschriftung', name: 'label', widget: 'string' },
              { label: 'Ziel', name: 'href', widget: 'string' },
            ],
          },
          {
            label: 'Sekundärer Button', name: 'secondary_cta', widget: 'object',
            fields: [
              { label: 'Beschriftung', name: 'label', widget: 'string' },
              { label: 'Ziel', name: 'href', widget: 'string' },
            ],
          },
          {
            label: 'Vertrauenspunkte', name: 'trust_points', widget: 'list',
            label_singular: 'Punkt', max: 3,
            fields: [iconField(), { label: 'Text', name: 'text', widget: 'string' }],
          },
        ],
      },
      {
        label: 'Abschnitte', name: 'sections', widget: 'object',
        hint: 'Jeder Abschnitt lässt sich einzeln ein- und ausblenden sowie umsortieren.',
        fields: [
          ...['benefits', 'services', 'projects', 'process', 'team', 'trust', 'faq'].map((key) => {
            const labels = {
              benefits: 'Vorteile', services: 'Leistungen', projects: 'Projekte',
              process: 'Ablauf', team: 'Team', trust: 'Qualität', faq: 'Häufige Fragen',
            };

            const fields = [
              { label: 'Sichtbar', name: 'visible', widget: 'boolean', default: true },
              { label: 'Reihenfolge', name: 'order', widget: 'number', value_type: 'int', min: 1 },
              { label: 'Kleine Auszeichnung', name: 'eyebrow', widget: 'string', required: false },
              headingField('title', 'Überschrift'),
              { label: 'Einleitung', name: 'lead', widget: 'text', required: false },
            ];

            if (['services', 'projects', 'process', 'team', 'faq'].includes(key)) {
              fields.push({ label: 'Beschriftung des Links', name: 'cta_label', widget: 'string', required: false });
            }
            if (key === 'process') {
              fields.push({
                label: 'Angezeigte Schritte', name: 'steps_shown', widget: 'number',
                value_type: 'int', min: 1, max: 7, default: 5,
              });
            }
            if (key === 'trust') {
              fields.push(
                { label: 'Punkte', name: 'points', widget: 'list', field: { label: 'Punkt', name: 'point', widget: 'string' } },
                { label: 'Titel der Nebenspalte', name: 'aside_title', widget: 'string' },
                {
                  label: 'Punkte der Nebenspalte', name: 'aside_points', widget: 'list', label_singular: 'Punkt',
                  fields: [
                    { label: 'Fetter Anfang', name: 'strong', widget: 'string' },
                    { label: 'Text', name: 'text', widget: 'string' },
                  ],
                },
              );
            }

            return { label: labels[key], name: key, widget: 'object', collapsed: true, fields };
          }),
        ],
      },
      {
        label: 'Abschluss-Aufruf', name: 'cta', widget: 'object',
        fields: [
          { label: 'Sichtbar', name: 'visible', widget: 'boolean', default: true },
          { label: 'Kleine Auszeichnung', name: 'eyebrow', widget: 'string', required: false },
          { label: 'Überschrift', name: 'title', widget: 'string' },
          { label: 'Text', name: 'text', widget: 'text' },
        ],
      },
    ],
  },

  // ================================================================ Leistungen
  {
    label: 'Leistungen',
    name: 'services',
    file: 'content/settings/services.yml',
    description: 'Die Leistungen erscheinen auf der Startseite, der Leistungsseite und im Footer.',
    fields: [
      {
        label: 'Leistungen', name: 'items', widget: 'list', label_singular: 'Leistung',
        fields: [
          { label: 'Titel', name: 'title', widget: 'string' },
          {
            label: 'Anker', name: 'slug', widget: 'string',
            pattern: ['^[a-z0-9-]+$', 'Nur Kleinbuchstaben, Zahlen und Bindestriche.'],
            hint: 'Teil der Adresse, z. B. /leistungen/#webdesign-webentwicklung',
          },
          iconField(),
          { label: 'Kurzfassung', name: 'teaser', widget: 'text' },
          { label: 'Einleitung', name: 'lead', widget: 'text' },
          { label: 'Kundennutzen', name: 'benefit', widget: 'text' },
          {
            label: 'Was dazugehört', name: 'includes', widget: 'list', label_singular: 'Punkt',
            fields: [
              { label: 'Titel', name: 'title', widget: 'string' },
              { label: 'Text', name: 'text', widget: 'text' },
            ],
          },
          {
            label: 'Einsatzbeispiele', name: 'use_cases', widget: 'list',
            field: { label: 'Beispiel', name: 'case', widget: 'string' },
          },
          ...visibility,
        ],
      },
    ],
  },

  // =================================================================== Vorteile
  {
    label: 'Vorteile',
    name: 'benefits',
    file: 'content/settings/benefits.yml',
    description: 'Die Vorteile auf der Startseite.',
    fields: [
      {
        label: 'Vorteile', name: 'items', widget: 'list', label_singular: 'Vorteil',
        fields: [
          iconField(),
          { label: 'Titel', name: 'title', widget: 'string' },
          { label: 'Text', name: 'text', widget: 'text' },
          ...visibility,
        ],
      },
    ],
  },

  // ===================================================================== Ablauf
  {
    label: 'Ablauf',
    name: 'process',
    file: 'content/settings/process.yml',
    description: 'Die Schritte von der Anfrage bis zum laufenden Betrieb.',
    fields: [
      {
        label: 'Schritte', name: 'items', widget: 'list', label_singular: 'Schritt',
        fields: [
          { label: 'Titel', name: 'title', widget: 'string' },
          { label: 'Kurzfassung (Startseite)', name: 'summary', widget: 'text' },
          { label: 'Was passiert', name: 'what_happens', widget: 'text' },
          { label: 'Beitrag der Kundschaft', name: 'your_part', widget: 'text' },
          { label: 'Ergebnis', name: 'outcome', widget: 'text' },
          ...visibility,
        ],
      },
      {
        label: 'Hinweise', name: 'notes', widget: 'list',
        field: { label: 'Hinweis', name: 'note', widget: 'string' },
      },
    ],
  },

  // ======================================================================= Team
  {
    label: 'Team & Arbeitsweise',
    name: 'team',
    file: 'content/settings/team.yml',
    description: 'Die Personen hinter Saugy Solutions und die Werte auf der Seite „Über uns“.',
    fields: [
      {
        label: 'Personen', name: 'items', widget: 'list', label_singular: 'Person',
        fields: [
          { label: 'Name', name: 'name', widget: 'string' },
          { label: 'Initialen', name: 'initials', widget: 'string', required: false },
          { label: 'Rolle', name: 'role', widget: 'string' },
          { label: 'Ausbildung', name: 'education', widget: 'string' },
          { label: 'Aktuelle Tätigkeit', name: 'current', widget: 'string' },
          {
            label: 'Foto', name: 'photo', widget: 'image', required: false,
            hint: 'Nur echte Fotos verwenden. Ohne Foto erscheinen die Initialen.',
          },
          { label: 'Alternativtext des Fotos', name: 'photo_alt', widget: 'string', required: false },
          { label: 'Beschreibung', name: 'text', widget: 'text' },
          {
            label: 'Schwerpunkte', name: 'focus', widget: 'list',
            field: { label: 'Schwerpunkt', name: 'item', widget: 'string' },
          },
          {
            label: 'Farbliche Kennzeichnung', name: 'accent', widget: 'select',
            options: [
              { label: 'Grün', value: 'primary' },
              { label: 'Türkis', value: 'secondary' },
            ],
            default: 'primary',
          },
          ...visibility,
        ],
      },
      {
        label: 'Arbeitsweise („Über uns“)', name: 'values', widget: 'list', label_singular: 'Wert',
        fields: [
          iconField(),
          { label: 'Titel', name: 'title', widget: 'string' },
          { label: 'Text', name: 'text', widget: 'text' },
          ...visibility,
        ],
      },
    ],
  },

  // ======================================================================== FAQ
  {
    label: 'Häufige Fragen',
    name: 'faq',
    file: 'content/settings/faq.yml',
    description: 'Fragen auf der Startseite und auf der Leistungsseite.',
    fields: [
      {
        label: 'Fragen auf der Startseite', name: 'home', widget: 'list', label_singular: 'Frage',
        fields: [
          { label: 'Frage', name: 'question', widget: 'string' },
          { label: 'Antwort', name: 'answer', widget: 'text' },
          ...visibility,
        ],
      },
      {
        label: 'Fragen auf der Leistungsseite', name: 'services', widget: 'list', label_singular: 'Frage',
        fields: [
          { label: 'Frage', name: 'question', widget: 'string' },
          { label: 'Antwort', name: 'answer', widget: 'text' },
          ...visibility,
        ],
      },
    ],
  },

  // ============================================================ Seiten und SEO
  {
    label: 'Seiten & SEO',
    name: 'pages',
    file: 'content/settings/pages.yml',
    description: 'Seitentitel, Meta-Beschreibungen und Überschriften der Unterseiten.',
    fields: [
      ...[
        ['home', 'Startseite', false],
        ['services', 'Leistungen', true],
        ['projects', 'Projekte', true],
        ['process', 'Ablauf', true],
        ['about', 'Über uns', true],
        ['contact', 'Kontakt', true],
      ].map(([name, label, withHeading]) => ({
        label, name, widget: 'object', collapsed: true,
        fields: [
          {
            label: 'Seitentitel', name: 'title', widget: 'string',
            hint: 'Erscheint im Browsertab und in den Suchergebnissen. Richtwert: bis 70 Zeichen.',
          },
          {
            label: 'Meta-Beschreibung', name: 'description', widget: 'text',
            hint: 'Erscheint in den Suchergebnissen. Richtwert: bis 165 Zeichen.',
          },
          ...(withHeading
            ? [
                headingField('heading', 'Überschrift der Seite'),
                { label: 'Einleitung', name: 'lead', widget: 'text' },
              ]
            : []),
        ],
      })),
    ],
  },
];

// ---------------------------------------------------------------------------
//  Gesamtkonfiguration
// ---------------------------------------------------------------------------

const config = {
  backend: {
    name: 'github',
    repo: REPO,
    branch: BRANCH,
    // Eigene Anmeldebrücke auf dem Hostpoint-Server (PHP).
    base_url: BASE_URL,
    auth_endpoint: 'api/auth.php',
    commit_messages: {
      create: 'Inhalt: {{collection}} „{{slug}}“ erstellt',
      update: 'Inhalt: {{collection}} „{{slug}}“ bearbeitet',
      delete: 'Inhalt: {{collection}} „{{slug}}“ gelöscht',
      uploadMedia: 'Inhalt: Bild „{{path}}“ hochgeladen',
      deleteMedia: 'Inhalt: Bild „{{path}}“ gelöscht',
    },
  },

  // Entwurf -> Review -> Veröffentlichen (über Pull Requests, mit Historie).
  publish_mode: 'editorial_workflow',

  locale: 'de',
  media_folder: 'public/img/uploads',
  public_folder: '/img/uploads',
  site_url: BASE_URL,
  display_url: BASE_URL,
  // Relativ, damit es auf jedem Host funktioniert (auch in einer Vorschau).
  logo_url: '/icons/icon-192.png',

  // Schont die GitHub-Schnittstelle bei vielen Medien.
  slug: { encoding: 'ascii', clean_accents: true, sanitize_replacement: '-' },

  collections: [
    {
      label: 'Projekte',
      name: 'projects',
      label_singular: 'Projekt',
      description:
        'Referenzprojekte. Neue Projekte erscheinen automatisch auf der Projektübersicht, '
        + 'erhalten eine eigene Unterseite und werden in die Sitemap aufgenommen.',
      folder: 'content/projects',
      extension: 'yml',
      format: 'yaml',
      create: true,
      delete: true,
      slug: '{{fields.slug}}',
      summary: '{{title}} — {{category}}',
      sortable_fields: ['order', 'title', 'category'],
      fields: [
        { label: 'Projektname', name: 'title', widget: 'string' },
        {
          label: 'URL-Kürzel', name: 'slug', widget: 'string',
          pattern: ['^[a-z0-9-]+$', 'Nur Kleinbuchstaben, Zahlen und Bindestriche.'],
          hint: 'Ergibt die Adresse, z. B. /projekte/biohof-scheibler/',
        },
        {
          label: 'Veröffentlicht', name: 'published', widget: 'boolean', default: true,
          hint: 'Ausschalten entfernt das Projekt vollständig von der Website.',
        },
        {
          label: 'Auf der Startseite zeigen', name: 'featured', widget: 'boolean', default: true,
        },
        {
          label: 'Reihenfolge', name: 'order', widget: 'number', value_type: 'int', min: 1, default: 1,
        },
        { label: 'Kategorie', name: 'category', widget: 'string' },
        { label: 'Branche', name: 'industry', widget: 'string' },
        {
          label: 'Adresse der Website', name: 'url', widget: 'string',
          hint: 'Vollständig mit https://',
        },
        { label: 'Domain', name: 'domain', widget: 'string', required: false, hint: 'Ohne https://, z. B. biohof-scheibler.ch' },
        {
          label: 'Akzentfarbe', name: 'accent', widget: 'color', required: false,
          default: '#24dfa8', allowInput: true,
          hint: 'Farbliche Kennzeichnung der Projektkarte.',
        },
        { label: 'Kurzer Teaser', name: 'teaser', widget: 'text' },

        { label: 'SEO-Titel', name: 'seo_title', widget: 'string', required: false, hint: 'Richtwert: bis 70 Zeichen.' },
        { label: 'Meta-Beschreibung', name: 'meta_description', widget: 'text', required: false },

        { label: 'Vorschaubild', name: 'cover', widget: 'image', required: false },
        { label: 'Alternativtext Vorschaubild', name: 'cover_alt', widget: 'string', required: false },
        { label: 'Screenshot Desktop', name: 'shot_desktop', widget: 'image', required: false },
        { label: 'Alternativtext Desktop', name: 'shot_desktop_alt', widget: 'string', required: false },
        { label: 'Screenshot Mobil', name: 'shot_mobile', widget: 'image', required: false },
        { label: 'Alternativtext Mobil', name: 'shot_mobile_alt', widget: 'string', required: false },
        {
          label: 'Bildergalerie', name: 'gallery', widget: 'list', required: false, label_singular: 'Bild',
          fields: [
            { label: 'Bild', name: 'image', widget: 'image' },
            { label: 'Alternativtext', name: 'alt', widget: 'string' },
          ],
        },

        { label: 'Einleitung', name: 'intro', widget: 'text' },
        { label: 'Ausgangslage', name: 'situation', widget: 'text' },
        {
          label: 'Ziele', name: 'goals', widget: 'list',
          field: { label: 'Ziel', name: 'goal', widget: 'string' },
        },
        {
          label: 'Umgesetzte Leistungen', name: 'delivered', widget: 'list',
          field: { label: 'Leistung', name: 'item', widget: 'string' },
        },
        {
          label: 'Herausforderungen', name: 'challenges', widget: 'list', label_singular: 'Herausforderung',
          fields: [
            { label: 'Titel', name: 'title', widget: 'string' },
            { label: 'Text', name: 'text', widget: 'text' },
          ],
        },
        { label: 'Ergebnis', name: 'result', widget: 'text' },

        { label: 'Aufruf – Überschrift', name: 'cta_title', widget: 'string', required: false },
        { label: 'Aufruf – Text', name: 'cta_text', widget: 'text', required: false },
      ],
    },

    {
      label: 'Einstellungen und Inhalte',
      name: 'settings',
      files: settingsFiles.map((file) => ({ ...file, format: 'yaml' })),
    },
  ],
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(
  OUT,
  '# Automatisch erzeugt von scripts/generate-cms-config.mjs – nicht von Hand bearbeiten.\n'
    + `# Repository: ${REPO}  ·  Branch: ${BRANCH}\n\n`
    + dump(config, { lineWidth: 110, noRefs: true }),
  'utf8'
);

console.log(`  Adminkonfiguration geschrieben: ${REPO} (Branch ${BRANCH})`);
