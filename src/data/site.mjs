/**
 * ============================================================================
 *  ZENTRALE KONFIGURATION – SAUGY SOLUTIONS
 * ============================================================================
 *
 *  Die Werte stammen aus `content/settings/site.yml` und werden im
 *  Adminbereich (/admin/) unter „Allgemeine Einstellungen“ bearbeitet.
 *
 *  Dieses Modul bereitet sie auf: es bildet abgeleitete Werte (tel:-Links,
 *  Adresszeilen) und meldet fehlende Pflichtangaben an den Build.
 * ============================================================================
 */

import { siteData } from './content.mjs';

const company = siteData.company ?? {};
const branding = siteData.branding ?? {};
const contact = siteData.contact ?? {};
const legal = siteData.legal ?? {};
const seo = siteData.seo ?? {};
const footer = siteData.footer ?? {};
const form = siteData.form ?? {};

// ---------------------------------------------------------------------------
//  Basis
// ---------------------------------------------------------------------------

export const SITE = {
  url: (company.url ?? 'https://saugy-solutions.ch').replace(/\/$/, ''),
  name: company.name ?? 'Saugy Solutions',
  claim: company.claim ?? '',
  locale: 'de-CH',
  lang: 'de',
  ogImage: seo.og_image ?? '/img/og-saugy-solutions.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  themeColor: seo.theme_color ?? '#080a0a',
  defaultTitle: seo.default_title ?? company.name ?? 'Saugy Solutions',
  defaultDescription: seo.default_description ?? '',
};

// ---------------------------------------------------------------------------
//  Marke und Logo
// ---------------------------------------------------------------------------

/**
 * Zentrale Logo-Konfiguration. Header, Hero und Footer verwenden
 * ausschliesslich diese Werte – das Logo ist an keiner Stelle fest eingebaut.
 *
 * `src` kann eine SVG-, PNG- oder WebP-Datei sein. Fehlt der Wert, greift die
 * mitgelieferte Rückfalldatei.
 */
export const BRAND = {
  logo: branding.logo || '/img/logo-saugy-solutions.png',
  logoAlt: branding.logo_alt || `${company.name ?? 'Saugy Solutions'} Logo`,
  /** Fett gesetzter Teil des Schriftzugs. */
  wordmarkStrong: branding.wordmark_strong ?? 'Saugy',
  /** Normal gesetzter Teil des Schriftzugs. */
  wordmarkRest: branding.wordmark_rest ?? 'Solutions',
  /** true, wenn das Logo eine Vektordatei ist (keine Rastergrössen nötig). */
  isVector: /\.svg$/i.test(branding.logo || ''),
};

// ---------------------------------------------------------------------------
//  Kontakt
// ---------------------------------------------------------------------------

/** Erzeugt aus einer Telefonnummer einen tel:-Link. */
function telHref(phone) {
  return `tel:${String(phone ?? '').replace(/[^0-9+]/g, '')}`;
}

export const CONTACT = {
  person: contact.person ?? '',
  phone: contact.phone ?? '',
  phoneHref: telHref(contact.phone),
  email: contact.email ?? '',
  emailHref: `mailto:${contact.email ?? ''}`,
  responseNote: contact.response_note ?? '',
};

// ---------------------------------------------------------------------------
//  Rechtliche Angaben
// ---------------------------------------------------------------------------

export const LEGAL = {
  provider: legal.provider ?? company.name ?? '',
  responsible: legal.responsible ?? '',
  address: legal.address ?? {},
  legalForm: legal.legal_form ?? '',
  /** Leerer Wert bedeutet: nicht vorhanden – die Zeile entfällt dann. */
  uid: legal.uid || null,
  hostingProvider: legal.hosting_provider ?? '',
  hostingLocation: legal.hosting_location ?? '',
  mailProvider: legal.mail_provider ?? '',
  lastUpdated: legal.last_updated ?? '',
};

/** Setzt die Adresse zu einer einzeiligen Schreibweise zusammen. */
export function formatAddress(address = LEGAL.address) {
  return addressLines(address).join(', ');
}

/** Liefert die Adresse als einzelne Zeilen für die mehrzeilige Darstellung. */
export function addressLines(address = LEGAL.address) {
  return [
    address.name,
    address.street,
    [address.postalCode, address.locality].filter(Boolean).join(' ').trim(),
    address.country,
  ].filter((line) => line && String(line).trim() !== '');
}

// ---------------------------------------------------------------------------
//  Pflichtangaben prüfen
// ---------------------------------------------------------------------------

/**
 * Pflichtangaben, die vor der Veröffentlichung gesetzt sein müssen.
 * Fehlt eine davon, meldet `npm run deploy:build` das als Warnung.
 * Die UID gehört bewusst NICHT dazu – sie ist optional.
 */
export const PENDING_FIELDS = [
  { label: 'Geschäftsadresse', value: addressLines().join(''), hint: 'content/settings/site.yml → legal.address' },
  { label: 'Rechtsform', value: LEGAL.legalForm, hint: 'content/settings/site.yml → legal.legal_form' },
  { label: 'Hostinganbieter', value: LEGAL.hostingProvider, hint: 'content/settings/site.yml → legal.hosting_provider' },
  { label: 'Serverstandort', value: LEGAL.hostingLocation, hint: 'content/settings/site.yml → legal.hosting_location' },
  { label: 'SMTP-/E-Mail-Anbieter', value: LEGAL.mailProvider, hint: 'content/settings/site.yml → legal.mail_provider' },
  { label: 'Telefonnummer', value: CONTACT.phone, hint: 'content/settings/site.yml → contact.phone' },
  { label: 'E-Mail-Adresse', value: CONTACT.email, hint: 'content/settings/site.yml → contact.email' },
].filter((field) => !field.value || String(field.value).trim() === '');

/** Prüft, ob ein Wert leer ist und im Impressum als offen markiert werden muss. */
export function isPending(value) {
  return !value || String(value).trim() === '';
}

// ---------------------------------------------------------------------------
//  Social Media, Navigation, Footer
// ---------------------------------------------------------------------------

/** Nur Einträge mit Beschriftung und Adresse werden ausgegeben. */
export const SOCIAL = (siteData.social ?? []).filter((item) => item?.label && item?.href);

export const NAV = siteData.navigation ?? [];
export const NAV_CTA = siteData.navigation_cta ?? { label: 'Projekt anfragen', href: '/kontakt/' };
export const FOOTER_LEGAL = siteData.footer_legal ?? [];

export const FOOTER = {
  intro: footer.intro ?? '',
  copyrightSuffix: footer.copyright_suffix ?? 'Alle Rechte vorbehalten.',
};

// ---------------------------------------------------------------------------
//  Formular
// ---------------------------------------------------------------------------

export const FORM = {
  action: form.action ?? '/api/kontakt.php',
  successPage: form.success_page ?? '/danke/',
  errorPage: '/kontakt/?status=fehler',
  messageMaxLength: form.message_max_length ?? 4000,
};
