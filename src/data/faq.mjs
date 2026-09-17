/**
 * Häufige Fragen – bearbeitet im Adminbereich unter „FAQ“.
 * Quelle: content/settings/faq.yml
 *
 * Beide Listen werden zusätzlich als strukturierte Daten (FAQPage) ausgegeben.
 */
import { faqData, activeSorted } from './content.mjs';

const toEntries = (items) =>
  activeSorted(items).map((item) => ({ q: item.question ?? '', a: item.answer ?? '' }));

export const FAQ_HOME = toEntries(faqData.home);
export const FAQ_SERVICES = toEntries(faqData.services);
