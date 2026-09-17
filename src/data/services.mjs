/**
 * Leistungen – bearbeitet im Adminbereich unter „Leistungen“.
 * Quelle: content/settings/services.yml
 */
import { servicesData, activeSorted } from './content.mjs';

/** @type {import('./types').Service[]} */
export const SERVICES = activeSorted(servicesData.items).map((item) => ({
  slug: item.slug,
  icon: item.icon ?? 'layout',
  title: item.title ?? '',
  teaser: item.teaser ?? '',
  lead: item.lead ?? '',
  benefit: item.benefit ?? '',
  includes: item.includes ?? [],
  useCases: item.use_cases ?? [],
}));

/** Kurzform für Auswahllisten und Übersichten. */
export const SERVICE_OPTIONS = SERVICES.map((s) => s.title);
