/**
 * ============================================================================
 *  ZENTRALE KONFIGURATION – SAUGY SOLUTIONS
 * ============================================================================
 *
 *  Diese Datei ist die einzige Quelle für Unternehmensdaten, Kontaktangaben,
 *  Navigation und rechtliche Informationen. Alle Seiten und Komponenten lesen
 *  ausschliesslich von hier. Kontaktdaten dürfen nirgends im Projekt
 *  dupliziert werden.
 *
 *  VOR DER VERÖFFENTLICHUNG:
 *  Alle Einträge, die unten mit `pending(...)` markiert sind, müssen durch die
 *  echten Angaben ersetzt werden. `npm run build` gibt eine Warnliste aus,
 *  solange noch Platzhalter vorhanden sind. Diese Angaben dürfen nicht
 *  erfunden werden.
 * ============================================================================
 */

/** Sammelt alle noch offenen Angaben, damit der Build sie melden kann. */
export const PENDING_FIELDS = [];

/**
 * Markiert eine noch nicht bestätigte Angabe. Der zurückgegebene Text ist
 * bewusst unmissverständlich als Platzhalter erkennbar und darf so niemals
 * live gehen – er wird im Build als Warnung gemeldet.
 *
 * @param {string} label Klartext-Bezeichnung der fehlenden Angabe
 * @param {string} [hint] Zusatzhinweis für die Dokumentation
 * @returns {string}
 */
function pending(label, hint = '') {
  PENDING_FIELDS.push({ label, hint });
  return `[noch zu ergänzen: ${label}]`;
}

/** Prüft, ob ein Wert noch ein Platzhalter ist. */
export function isPending(value) {
  return typeof value === 'string' && value.startsWith('[noch zu ergänzen:');
}

// ---------------------------------------------------------------------------
//  Basis
// ---------------------------------------------------------------------------

export const SITE = {
  /** Produktive Basis-URL ohne abschliessenden Schrägstrich. */
  url: 'https://saugy-solutions.ch',
  name: 'Saugy Solutions',
  claim: 'Wir bringen Ihr Business online.',
  locale: 'de-CH',
  lang: 'de',
  /** Standard-Vorschaubild für Social Media (wird im Build erzeugt). */
  ogImage: '/img/og-saugy-solutions.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  themeColor: '#06110f',
};

// ---------------------------------------------------------------------------
//  Kontakt
// ---------------------------------------------------------------------------

export const CONTACT = {
  person: 'Manuel Saugy',
  phone: '+41 79 516 30 41',
  /** Normalisiert für tel:-Links. */
  phoneHref: 'tel:+41795163041',
  email: 'manu@saugy-solutions.ch',
  emailHref: 'mailto:manu@saugy-solutions.ch',
  /** Ehrliche Formulierung ohne garantierte Reaktionszeit. */
  responseNote:
    'Anfragen beantwortet Manuel Saugy persönlich – in der Regel innerhalb weniger Arbeitstage.',
};

// ---------------------------------------------------------------------------
//  Rechtliche Angaben
// ---------------------------------------------------------------------------

export const LEGAL = {
  /** Offizieller Anbietername. */
  provider: 'Saugy Solutions',
  /** Verantwortliche und datenschutzrechtlich zuständige Person. */
  responsible: 'Manuel Saugy',

  // --- Noch zu bestätigende Angaben --------------------------------------
  address: pending('Geschäftsadresse', 'Strasse, Nr., PLZ und Ort des Anbieters'),
  legalForm: pending('Rechtsform', 'z. B. Einzelunternehmen'),
  uid: pending('UID / MWST-Nummer', 'nur angeben, falls tatsächlich vorhanden'),
  hostingProvider: pending('Hostinganbieter', 'Name und Sitz des Webhosters'),
  hostingLocation: pending('Serverstandort', 'Land, in dem die Website gehostet wird'),
  mailProvider: pending('SMTP-/E-Mail-Anbieter', 'Anbieter für den Versand der Formularnachrichten'),
  // -----------------------------------------------------------------------

  /** Datum der letzten inhaltlichen Überarbeitung der Rechtstexte. */
  lastUpdated: '2026-09-16',
};

// ---------------------------------------------------------------------------
//  Social Media
// ---------------------------------------------------------------------------

/**
 * Nur echte, bestätigte Profile eintragen. Leer lassen, solange keine
 * offiziellen Kanäle von Saugy Solutions bekannt sind – der Footer blendet den
 * Bereich dann automatisch aus.
 * Format: { label: 'LinkedIn', href: 'https://…' }
 */
export const SOCIAL = [];

// ---------------------------------------------------------------------------
//  Navigation
// ---------------------------------------------------------------------------

export const NAV = [
  { label: 'Startseite', href: '/' },
  { label: 'Leistungen', href: '/leistungen/' },
  { label: 'Projekte', href: '/projekte/' },
  { label: 'Ablauf', href: '/ablauf/' },
  { label: 'Über uns', href: '/ueber-uns/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

export const NAV_CTA = { label: 'Projekt anfragen', href: '/kontakt/' };

export const FOOTER_LEGAL = [
  { label: 'Datenschutz', href: '/datenschutz/' },
  { label: 'Impressum', href: '/impressum/' },
];

// ---------------------------------------------------------------------------
//  Formular-Endpunkt
// ---------------------------------------------------------------------------

export const FORM = {
  /** Pfad des PHP-Endpunkts im Deployment. */
  action: '/api/kontakt.php',
  successPage: '/danke/',
  errorPage: '/kontakt/?status=fehler',
  /** Maximale Länge des Nachrichtenfelds – identisch im PHP-Endpunkt. */
  messageMaxLength: 4000,
};
