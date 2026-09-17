/**
 * Vorteile auf der Startseite – bearbeitet im Adminbereich unter „Vorteile“.
 * Quelle: content/settings/benefits.yml
 */
import { benefitsData, activeSorted } from './content.mjs';

/** @type {import('./types').Benefit[]} */
export const BENEFITS = activeSorted(benefitsData.items).map((item) => ({
  icon: item.icon ?? 'check',
  title: item.title ?? '',
  text: item.text ?? '',
}));
