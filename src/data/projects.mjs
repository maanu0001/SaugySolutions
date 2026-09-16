/**
 * ============================================================================
 *  REFERENZPROJEKTE
 * ============================================================================
 *
 *  WICHTIG – Inhaltliche Sorgfalt:
 *  Die Beschreibungen halten sich bewusst an das, was auf den öffentlich
 *  erreichbaren Websites erkennbar bzw. aus den vorhandenen Projektangaben
 *  ableitbar ist. Es werden keine Besucherzahlen, Umsätze, Kundenstimmen oder
 *  technischen Funktionen behauptet, die nicht belegt sind.
 *
 *  Vor der Veröffentlichung: Bitte die Texte einmal gegenlesen und bei Bedarf
 *  um projektinterne Details ergänzen (siehe README, Abschnitt „Vor der
 *  Veröffentlichung bestätigen“).
 *
 *  Screenshots:
 *  Sobald echte Aufnahmen vorliegen, unter `public/img/projekte/` ablegen und
 *  die Felder `shotDesktop` / `shotMobile` setzen. Ohne diese Felder wird eine
 *  bewusst stilisierte Vorschau gerendert – es wird also kein Screenshot
 *  vorgetäuscht. Hilfsskript: `node scripts/capture-screenshots.mjs`
 * ============================================================================
 */

export const PROJECTS = [
  {
    slug: 'swisshub',
    name: 'SwissHub',
    domain: 'swisshub.gg',
    url: 'https://swisshub.gg',
    category: 'Community-Plattform',
    industry: 'Gaming und Online-Community',
    /** Knapper Seitentitel für die Suchergebnisse (Richtwert: bis 70 Zeichen). */
    metaTitle: 'SwissHub – Website für eine Gaming-Community | Saugy Solutions',
    /** Kurzbeschrieb für Karten und Übersichten. */
    teaser:
      'Öffentlicher Webauftritt für eine Schweizer Gaming-Community mit Turnieren, Sponsoren und Anlaufstelle für neue Mitglieder.',
    /** Farbliche Signatur der stilisierten Vorschau. */
    accent: '#24e6b2',
    shotDesktop: null,
    shotMobile: null,

    intro:
      'SwissHub ist eine Schweizer Gaming-Community, die sich über einen Discord-Server organisiert und regelmässig Turniere und Onlineanlässe durchführt. Die Website ist der öffentliche Auftritt dieser Community: Sie erklärt, worum es geht, und führt Interessierte auf die Community-Kanäle.',

    situation:
      'Die Community ist in erster Linie auf Discord aktiv. Ein Discord-Server allein ist für Aussenstehende jedoch schwer einzuschätzen und für Sponsoren wenig aussagekräftig. Es brauchte eine öffentlich erreichbare Seite, die das Angebot einordnet und als seriöse Visitenkarte dient.',

    goals: [
      'Die Community für Aussenstehende verständlich darstellen',
      'Turniere und Anlässe an einem öffentlich erreichbaren Ort bündeln',
      'Einen seriösen Anlaufpunkt für Sponsoren und Partner schaffen',
      'Einen klaren Weg in die Community-Kanäle anbieten',
    ],

    delivered: [
      'Konzept und Aufbau des öffentlichen Webauftritts',
      'Gestaltung passend zur bestehenden Bildsprache der Community',
      'Bereiche für Turniere, Anlässe und Partner',
      'Verbindung zu den bestehenden Community-Kanälen',
      'Technischer Betrieb der Website',
    ],

    challenges: [
      {
        title: 'Zwei Zielgruppen auf einer Seite',
        text: 'Mitglieder suchen Turniere und Termine, Sponsoren möchten wissen, wofür die Community steht. Beide Anliegen mussten auf derselben Seite Platz finden, ohne sich gegenseitig zu verdrängen.',
      },
      {
        title: 'Inhalte, die sich laufend ändern',
        text: 'Turniere, Anlässe und Partner wechseln regelmässig. Die Seite musste so aufgebaut werden, dass diese Inhalte gepflegt werden können, ohne dass jedes Mal am Code gearbeitet werden muss.',
      },
      {
        title: 'Ehrenamtliches Umfeld',
        text: 'Die Community wird in der Freizeit betrieben. Die Lösung musste entsprechend wartungsarm bleiben.',
      },
    ],

    result:
      'SwissHub verfügt über einen eigenständigen Webauftritt, der die Community nach aussen vertritt und die Inhalte an einem Ort bündelt. Der Auftritt ist unter swisshub.gg öffentlich erreichbar.',
  },

  {
    slug: 'biohof-scheibler',
    name: 'Biohof Scheibler',
    domain: 'biohof-scheibler.ch',
    url: 'https://biohof-scheibler.ch',
    category: 'Unternehmenswebsite',
    industry: 'Landwirtschaft und Direktvermarktung',
    metaTitle: 'Biohof Scheibler – Website für einen Hofladen | Saugy Solutions',
    teaser:
      'Webauftritt für einen Bio-Familienbetrieb mit Hofladen – mit Sortiment, Öffnungszeiten und dem Weg zum Hof.',
    accent: '#7cd992',
    shotDesktop: null,
    shotMobile: null,

    intro:
      'Der Biohof Scheibler in Oftringen ist ein Familienbetrieb mit Ackerbau, Gemüsebau und Mutterkuhhaltung. Ein Teil der Produkte wird über den eigenen Hofladen direkt vermarktet. Die Website stellt den Betrieb vor und informiert über den Hofladen.',

    situation:
      'Direktvermarktung lebt davon, dass Kundschaft den Hof findet und weiss, wann der Laden offen ist und was es gibt. Genau diese Informationen suchen Interessierte heute zuerst online – häufig unterwegs auf dem Mobiltelefon.',

    goals: [
      'Den Hofladen mit Öffnungszeiten und Sortiment verständlich präsentieren',
      'Den Betrieb und seine Arbeitsweise vorstellen',
      'Auf dem Mobiltelefon schnell die wichtigsten Angaben liefern',
      'Eine einfache Möglichkeit zur Kontaktaufnahme bieten',
    ],

    delivered: [
      'Aufbau und Struktur der Website',
      'Eigene Bereiche für Hofladen und Landwirtschaft',
      'Darstellung der Öffnungszeiten und Kontaktangaben',
      'Umsetzung für Mobiltelefon, Tablet und Desktop',
      'Technische Einrichtung und Betrieb',
    ],

    challenges: [
      {
        title: 'Breites Sortiment, begrenzter Platz',
        text: 'Der Hofladen führt ein sehr umfangreiches Sortiment. Auf der Website musste daraus eine verständliche Übersicht werden, statt einer vollständigen Produktliste.',
      },
      {
        title: 'Informationen, die aktuell bleiben müssen',
        text: 'Öffnungszeiten und Angaben zum Hofladen sind die meistgesuchten Inhalte. Sie mussten so platziert werden, dass sie sofort sichtbar und einfach anpassbar sind.',
      },
      {
        title: 'Zeit neben dem Betrieb',
        text: 'Ein Landwirtschaftsbetrieb hat keine Zeit für aufwendige Websitepflege. Die Lösung musste ohne laufenden Aufwand funktionieren.',
      },
    ],

    result:
      'Der Biohof Scheibler ist unter biohof-scheibler.ch mit einem eigenen Auftritt online. Interessierte finden dort den Betrieb, das Angebot des Hofladens und die Kontaktangaben.',
  },

  {
    slug: 'bibliothek-zurzach',
    name: 'Fleckenbibliothek Zurzach',
    domain: 'bibliothek-zurzach.ch',
    url: 'https://bibliothek-zurzach.ch',
    category: 'Website für eine öffentliche Einrichtung',
    industry: 'Bibliothek und öffentliche Institution',
    metaTitle: 'Fleckenbibliothek Zurzach – Website | Saugy Solutions',
    teaser:
      'Informationsauftritt für eine öffentliche Bibliothek – Öffnungszeiten, Medienangebot und der Weg zum Online-Katalog.',
    accent: '#28c7d7',
    shotDesktop: null,
    shotMobile: null,

    intro:
      'Die Fleckenbibliothek Zurzach in Bad Zurzach ist eine öffentliche Bibliothek mit einem breiten Medienangebot – von Belletristik und Sachbüchern über Kinderbücher und Comics bis zu Zeitschriften, DVDs und digitalen Medien. Die Website bündelt die Informationen rund um Besuch und Ausleihe.',

    situation:
      'Die Ausleihe selbst läuft über einen externen Bibliothekskatalog. Was fehlte, war ein eigener Auftritt, der Öffnungszeiten, Angebot und Hinweise an einem Ort zusammenfasst und den Weg in den Katalog klar aufzeigt.',

    goals: [
      'Öffnungszeiten und Standort auf einen Blick zeigen',
      'Das Medienangebot verständlich darstellen',
      'Den Zugang zum bestehenden Online-Katalog klar verlinken',
      'Aktuelle Hinweise einfach kommunizieren können',
    ],

    delivered: [
      'Struktur und Aufbau der Website',
      'Übersichtliche Darstellung von Öffnungszeiten und Standort',
      'Bereiche für Medienangebot und aktuelle Hinweise',
      'Verweis auf den externen Bibliothekskatalog',
      'Umsetzung für Mobiltelefon, Tablet und Desktop',
    ],

    challenges: [
      {
        title: 'Zusammenspiel mit einem externen Katalog',
        text: 'Die eigentliche Ausleihe findet in einem separaten Bibliothekssystem statt. Der Übergang dorthin musste klar erkennbar sein, ohne die Website mit fremder Technik zu überfrachten.',
      },
      {
        title: 'Sehr breites Publikum',
        text: 'Die Bibliothek wird von Kindern, Familien, Schulen und älteren Personen genutzt. Schrift, Kontraste und Navigation mussten entsprechend einfach und gut lesbar sein.',
      },
      {
        title: 'Pflege im Alltagsbetrieb',
        text: 'Hinweise wie geänderte Öffnungszeiten müssen kurzfristig angepasst werden können – ohne technische Vorkenntnisse.',
      },
    ],

    result:
      'Die Fleckenbibliothek Zurzach ist unter bibliothek-zurzach.ch online. Besucherinnen und Besucher finden dort Öffnungszeiten, das Angebot und den Weg zum Online-Katalog.',
  },
];

/** Findet ein Projekt anhand seines Slugs. */
export function getProject(slug) {
  return PROJECTS.find((p) => p.slug === slug);
}
