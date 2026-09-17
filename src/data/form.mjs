/**
 * ============================================================================
 *  AUSWAHLMÖGLICHKEITEN DES KONTAKTFORMULARS
 * ============================================================================
 *
 *  WICHTIG: Diese Listen müssen mit der serverseitigen Validierung in
 *  `server/lib/Validator.php` übereinstimmen (Konstanten ALLOWED_TOPICS,
 *  ALLOWED_START, ALLOWED_BUDGET). Wird hier ein Eintrag ergänzt, ist er dort
 *  ebenfalls zu ergänzen – sonst weist der Server die Eingabe zurück.
 *
 *  Hinweis: Das frühere Feld „Gewünschte Leistung“ wurde entfernt. Es
 *  überschnitt sich inhaltlich zu stark mit „Art der Anfrage“.
 * ============================================================================
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
