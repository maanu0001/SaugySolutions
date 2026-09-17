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

  /**
   * Geschäftsadresse, strukturiert hinterlegt. Die einzelnen Felder werden
   * sowohl für die Anzeige im Impressum als auch für die strukturierten Daten
   * (schema.org PostalAddress) verwendet.
   */
  address: {
    name: 'Manuel Saugy',
    street: 'Bücklirain 8b',
    postalCode: '5312',
    locality: 'Döttingen',
    country: 'Schweiz',
    countryCode: 'CH',
  },

  /**
   * Rechtsform.
   *
   * Hinweis: Wer in der Schweiz als natürliche Person selbstständig eine
   * Erwerbstätigkeit ausübt – auch nebenberuflich –, führt von Gesetzes wegen
   * ein Einzelunternehmen. Ein Eintrag im Handelsregister ist erst ab einem
   * Jahresumsatz von 100 000 CHF Pflicht. „Keine Rechtsform“ gibt es rechtlich
   * nicht; der Zusatz stellt klar, dass kein Registereintrag besteht.
   */
  legalForm: 'Einzelunternehmen (nicht im Handelsregister eingetragen)',

  /**
   * UID bzw. MWST-Nummer. `null` bedeutet: nicht vorhanden. Die Zeile wird
   * im Impressum dann gar nicht ausgegeben – eine nicht existierende Nummer
   * muss nicht angegeben werden.
   */
  uid: null,

  /** Webhosting. */
  hostingProvider: 'Hostpoint AG, Rapperswil-Jona, Schweiz',
  hostingLocation: 'Schweiz',

  /** Anbieter für den Versand der Formularnachrichten. */
  mailProvider: 'Hostpoint AG, Rapperswil-Jona, Schweiz',

  /** Datum der letzten inhaltlichen Überarbeitung der Rechtstexte. */
  lastUpdated: '2026-09-17',
};

/**
 * Setzt die Adresse zu einer einzeiligen Schreibweise zusammen.
 * Beispiel: „Manuel Saugy, Bücklirain 8b, 5312 Döttingen, Schweiz“
 */
export function formatAddress(address = LEGAL.address) {
  return [
    address.name,
    address.street,
    `${address.postalCode} ${address.locality}`,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Liefert die Adresse als Zeilen – für die mehrzeilige Darstellung im
 * Impressum und in der Datenschutzerklärung.
 *
 * @returns {string[]}
 */
export function addressLines(address = LEGAL.address) {
  return [
    address.name,
    address.street,
    `${address.postalCode} ${address.locality}`,
    address.country,
  ].filter(Boolean);
}

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
