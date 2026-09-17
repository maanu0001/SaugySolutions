/**
 * ============================================================================
 *  REFERENZPROJEKTE
 * ============================================================================
 *
 *  Quelle: content/projects/*.yml – eine Datei pro Projekt.
 *  Bearbeitet im Adminbereich unter „Projekte“.
 *
 *  Nur veröffentlichte Projekte (`published: true`) erscheinen auf der
 *  Website, in der Sitemap und in den strukturierten Daten. Ein Projekt auf
 *  `published: false` zu setzen, entfernt es vollständig aus dem Build – die
 *  Unterseite wird dann gar nicht erst erzeugt.
 *
 *  Inhaltliche Sorgfalt: Es werden keine Besucherzahlen, Umsätze,
 *  Kundenstimmen oder technischen Funktionen behauptet, die nicht belegt sind.
 * ============================================================================
 */

import { projectsData } from './content.mjs';

/** Wandelt einen YAML-Eintrag in die von den Komponenten erwartete Form. */
function normalise(item) {
  return {
    slug: item.slug,
    name: item.title ?? item.name ?? '',
    domain: item.domain || String(item.url ?? '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
    url: item.url ?? '',
    category: item.category ?? '',
    industry: item.industry ?? '',
    metaTitle: item.seo_title || '',
    metaDescription: item.meta_description || item.teaser || '',
    teaser: item.teaser ?? '',
    accent: item.accent || '#24dfa8',
    featured: item.featured !== false,
    order: item.order ?? 999,

    cover: item.cover || null,
    coverAlt: item.cover_alt || `Vorschau der Website von ${item.title ?? ''}`,
    shotDesktop: item.shot_desktop || null,
    shotDesktopAlt: item.shot_desktop_alt || `Desktop-Ansicht der Website von ${item.title ?? ''}`,
    shotMobile: item.shot_mobile || null,
    shotMobileAlt: item.shot_mobile_alt || `Mobile Ansicht der Website von ${item.title ?? ''}`,
    gallery: (item.gallery ?? []).filter((g) => g?.image),

    intro: item.intro ?? '',
    situation: item.situation ?? '',
    goals: item.goals ?? [],
    delivered: item.delivered ?? [],
    challenges: item.challenges ?? [],
    result: item.result ?? '',
    ctaTitle: item.cta_title || `Ein Projekt wie ${item.title ?? ''} im Kopf?`,
    ctaText:
      item.cta_text ||
      'Schildern Sie uns kurz Ihre Ausgangslage. Im kostenlosen Erstgespräch klären wir, was für Ihren Betrieb sinnvoll ist.',
  };
}

/** Alle veröffentlichten Projekte, nach Sortierreihenfolge. */
/** @type {import('./types').Project[]} */
export const PROJECTS = projectsData
  .filter((item) => item?.published !== false && item?.slug)
  .map(normalise)
  .sort((a, b) => a.order - b.order);

/** Projekte, die zusätzlich auf der Startseite erscheinen sollen. */
/** @type {import('./types').Project[]} */
export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured);

/** Findet ein Projekt anhand seines Slugs. */
export function getProject(slug) {
  return PROJECTS.find((p) => p.slug === slug);
}
