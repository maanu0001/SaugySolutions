/**
 * Auswahlmöglichkeiten des Kontaktformulars.
 *
 * WICHTIG: Diese Listen müssen mit der serverseitigen Validierung in
 * `server/api/kontakt.php` übereinstimmen. Beim Ergänzen eines Eintrags
 * ist dort dieselbe Liste anzupassen (Konstanten ALLOWED_TOPICS,
 * ALLOWED_SERVICES, ALLOWED_START, ALLOWED_BUDGET).
 */

export const REQUEST_TYPES = [
  'Neue Website',
  'Bestehende Website überarbeiten',
  'Hosting und Wartung',
  'E-Mail-Lösung',
  'Nextcloud',
  'Individuelle digitale Lösung',
  'Allgemeine Frage',
];

export const SERVICE_CHOICES = [
  'Website und Webentwicklung',
  'Hosting, Wartung und Sicherheit',
  'Geschäftliche E-Mail-Lösungen',
  'Nextcloud und sichere Datenablage',
  'Individuelle digitale Lösungen',
  'Noch unklar – bitte beraten',
];

export const START_CHOICES = [
  'So bald wie möglich',
  'In den nächsten 1–3 Monaten',
  'In 3–6 Monaten',
  'Später / noch offen',
];

export const BUDGET_CHOICES = [
  'Noch offen',
  'Bis 2 000 CHF',
  '2 000 – 5 000 CHF',
  '5 000 – 10 000 CHF',
  'Über 10 000 CHF',
  'Möchte ich im Gespräch klären',
];
