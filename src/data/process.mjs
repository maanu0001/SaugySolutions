/**
 * Projektablauf – bearbeitet im Adminbereich unter „Ablauf“.
 * Quelle: content/settings/process.yml
 */
import { processData, activeSorted } from './content.mjs';

export const PROCESS = activeSorted(processData.items).map((item) => ({
  title: item.title ?? '',
  summary: item.summary ?? '',
  whatHappens: item.what_happens ?? '',
  yourPart: item.your_part ?? '',
  outcome: item.outcome ?? '',
}));

/** Hinweise, die den Ablauf für Kundschaft ohne Vorkenntnisse einordnen. */
export const PROCESS_NOTES = processData.notes ?? [];
