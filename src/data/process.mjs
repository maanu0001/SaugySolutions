/**
 * Projektablauf von der Anfrage bis zum laufenden Betrieb.
 *
 * Felder pro Schritt:
 *   title      – Bezeichnung des Schritts
 *   summary    – Kurzfassung für die Startseite
 *   whatHappens – Was in diesem Schritt geschieht
 *   yourPart   – Was die Kundschaft beiträgt
 *   outcome    – Was am Ende des Schritts vorliegt
 */

export const PROCESS = [
  {
    title: 'Unverbindliche Anfrage',
    summary: 'Sie melden sich mit Ihrer Idee – telefonisch, per E-Mail oder über das Formular.',
    whatHappens:
      'Sie schildern kurz, worum es geht. Eine grobe Vorstellung genügt vollständig; ein fertiges Konzept ist nicht nötig.',
    yourPart:
      'Eine kurze Beschreibung Ihres Anliegens und Ihrer Situation. Technische Vorkenntnisse brauchen Sie nicht.',
    outcome: 'Wir melden uns bei Ihnen und schlagen einen Termin für ein Gespräch vor.',
  },
  {
    title: 'Persönliches Erstgespräch',
    summary: 'Wir klären gemeinsam, was Sie brauchen – und was Sie nicht brauchen.',
    whatHappens:
      'Im Gespräch gehen wir Ihr Vorhaben durch: Ziel, Zielgruppe, Umfang und bestehende Voraussetzungen wie Domain, E-Mail oder eine vorhandene Website. Wir sagen auch, wenn etwas aus unserer Sicht nicht nötig ist.',
    yourPart:
      'Ihre Fragen und Erwartungen sowie Angaben zu allem, was bereits vorhanden ist.',
    outcome: 'Ein gemeinsames Verständnis des Projekts und eine realistische Einschätzung des Umfangs.',
  },
  {
    title: 'Konzept und transparente Offerte',
    summary: 'Sie erhalten eine nachvollziehbare Offerte mit klarem Leistungsumfang.',
    whatHappens:
      'Wir halten schriftlich fest, was umgesetzt wird, wie der Aufbau aussieht und was das kostet. Einmalige Kosten und allfällige laufende Kosten werden getrennt ausgewiesen.',
    yourPart: 'Die Offerte prüfen, Rückfragen stellen und freigeben.',
    outcome: 'Eine verbindliche Grundlage: Umfang, Termine und Kosten sind vor Projektbeginn geklärt.',
  },
  {
    title: 'Design und technische Umsetzung',
    summary: 'Gestaltung und Entwicklung entstehen – Sie sehen den Fortschritt.',
    whatHappens:
      'Wir gestalten die Seiten und setzen sie technisch um. Sie sehen den Stand während der Umsetzung und nicht erst am Schluss.',
    yourPart:
      'Inhalte wie Texte, Bilder und Logo, sofern vorhanden. Wenn nichts vorhanden ist, klären wir vorher, wer was übernimmt.',
    outcome: 'Eine funktionsfähige Vorschauversion Ihrer Website.',
  },
  {
    title: 'Feedback und Optimierung',
    summary: 'Sie prüfen in Ruhe, wir passen an.',
    whatHappens:
      'Sie schauen die Vorschauversion durch und melden Anpassungen. Wir korrigieren Inhalte, Gestaltung und Details und prüfen die Darstellung auf verschiedenen Geräten.',
    yourPart: 'Ihre Rückmeldungen – gesammelt und in Ihren Worten, Fachbegriffe sind nicht nötig.',
    outcome: 'Eine abgenommene Version, die inhaltlich und gestalterisch stimmt.',
  },
  {
    title: 'Veröffentlichung',
    summary: 'Die Website geht unter Ihrer Domain online.',
    whatHappens:
      'Wir richten Hosting und Domain ein, veröffentlichen die Website und kontrollieren nach dem Aufschalten Erreichbarkeit, Formulare und Darstellung.',
    yourPart: 'Die Freigabe für den Aufschaltungstermin und Zugang zur Domain, falls diese bereits besteht.',
    outcome: 'Ihre Website ist öffentlich erreichbar und funktioniert.',
  },
  {
    title: 'Optionale Betreuung und Wartung',
    summary: 'Auf Wunsch übernehmen wir den laufenden Betrieb.',
    whatHappens:
      'Hosting, Updates, Sicherungen und inhaltliche Anpassungen im vereinbarten Rahmen. Sie haben weiterhin dieselbe Ansprechperson.',
    yourPart: 'Sie melden sich, wenn etwas geändert werden soll oder nicht funktioniert.',
    outcome: 'Eine Website, die technisch aktuell bleibt – ohne dass Sie sich darum kümmern müssen.',
  },
];

/** Hinweise, die den Ablauf für Kundschaft ohne technische Vorkenntnisse einordnen. */
export const PROCESS_NOTES = [
  'Technische Vorkenntnisse sind zu keinem Zeitpunkt erforderlich.',
  'Für die Kontaktaufnahme genügt eine erste grobe Projektidee.',
  'Sie werden während der Umsetzung regelmässig einbezogen und sehen Zwischenstände.',
  'Umfang, Termine und Kosten werden vor Projektbeginn transparent vereinbart.',
  'Hosting, Wartung und Support lassen sich passend zum Projekt ergänzen – verpflichtend ist das nicht.',
];
