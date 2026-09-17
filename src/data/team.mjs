/**
 * Team – bearbeitet im Adminbereich unter „Team“.
 * Quelle: content/settings/team.yml
 *
 * Liegt kein Foto vor, wird eine typografische Darstellung mit den Initialen
 * verwendet. Es werden keine künstlich erzeugten Porträts eingesetzt.
 */
import { teamData, activeSorted } from './content.mjs';

/** @type {import('./types').TeamMember[]} */
export const TEAM = activeSorted(teamData.items).map((item) => ({
  name: item.name ?? '',
  initials: item.initials || String(item.name ?? '').split(' ').map((w) => w[0]).join('').slice(0, 2),
  role: item.role ?? '',
  education: item.education ?? '',
  current: item.current ?? '',
  photo: item.photo || null,
  photoAlt: item.photo_alt || `Porträtfoto von ${item.name ?? ''}`,
  text: item.text ?? '',
  focus: item.focus ?? [],
  accent: item.accent ?? 'primary',
}));
