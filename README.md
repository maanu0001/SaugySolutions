# Saugy Solutions – Website

Statische Unternehmenswebsite für **Saugy Solutions**, gebaut mit [Astro](https://astro.build)
im vollständig statischen Modus.

Das fertige Ergebnis besteht aus gewöhnlichen HTML-, CSS-, JavaScript-, Bild- und
Schriftdateien plus einem schlanken PHP-Endpunkt für das Kontaktformular.
**Auf dem Produktivserver werden weder Node.js noch Composer benötigt** – ein
normaler Apache-Webspace mit PHP 8.1 oder neuer genügt.

---

## Inhalt

1. [Überblick](#1-überblick)
2. [Voraussetzungen](#2-voraussetzungen)
3. [Installation und Entwicklung](#3-installation-und-entwicklung)
4. [Befehle](#4-befehle)
5. [Projektstruktur](#5-projektstruktur)
6. [Deployment auf einen Apache-Webspace](#6-deployment-auf-einen-apache-webspace)
7. [Kontaktformular einrichten (PHP und SMTP)](#7-kontaktformular-einrichten-php-und-smtp)
8. [Kontaktformular testen](#8-kontaktformular-testen)
9. [Inhalte pflegen](#9-inhalte-pflegen)
10. [Logo austauschen](#10-logo-austauschen)
11. [Neues Projekt hinzufügen](#11-neues-projekt-hinzufügen)
12. [Vor der Veröffentlichung bestätigen](#12-vor-der-veröffentlichung-bestätigen)
13. [Go-live-Checkliste](#13-go-live-checkliste)
14. [Backups und Updates](#14-backups-und-updates)
15. [Technische Hinweise](#15-technische-hinweise)
16. [Fehlersuche](#16-fehlersuche)

---

## 1. Überblick

| Bereich | Umsetzung |
|---|---|
| Generator | Astro 7, `output: "static"` |
| Sprache | Deutsch, Schweizer Standardsprache (`de-CH`, „ss“ statt „ß“) |
| Schrift | Manrope Variable, **lokal** ausgeliefert (keine Google Fonts) |
| JavaScript | Vanilla, ca. 6 KB – die Website funktioniert vollständig auch ohne |
| Formular | PHP 8.1+ mit PHPMailer (SMTP) |
| Tracking | keines. Keine Cookies, keine externen Dienste, kein Cookie-Banner |
| Seiten | Start, Leistungen, Projekte (+3 Detailseiten), Ablauf, Über uns, Kontakt, Danke, Datenschutz, Impressum, 404 |

**Grundsatz zu Inhalten:** Die Website enthält ausschliesslich belegbare
Angaben. Es werden keine Kundenstimmen, Kennzahlen, Auszeichnungen,
Reaktionszeiten oder Verfügbarkeiten behauptet, die nicht zugesichert sind.
Bitte diesen Grundsatz bei künftigen Änderungen beibehalten.

---

## 2. Voraussetzungen

**Für die Entwicklung (lokaler Rechner):**

* Node.js **20 oder neuer** (`node --version`)
* npm (kommt mit Node.js)
* optional PHP 8.1+, um das Formular lokal zu testen
* optional Composer, falls PHPMailer aktualisiert werden soll

**Für den Betrieb (Webserver):**

* Apache mit `AllowOverride All` (damit `.htaccess` wirkt)
* PHP **8.1 oder neuer** mit den Erweiterungen `mbstring` und `openssl`
* SSL-Zertifikat (bei Schweizer Hostern in der Regel per Let's Encrypt kostenlos)
* **kein** Node.js, **kein** Composer

---

## 3. Installation und Entwicklung

```bash
# Repository holen
git clone https://github.com/maanu0001/SaugySolutions.git
cd SaugySolutions

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten -> http://localhost:4321
npm run dev
```

Änderungen an Dateien unter `src/` erscheinen sofort im Browser.

---

## 4. Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver mit automatischem Neuladen |
| `npm run build` | Reiner Astro-Build (nur statische Seiten) |
| **`npm run deploy:build`** | **Vollständiger, hochladbarer Build inklusive PHP und `.htaccess`** |
| `npm run serve:dist` | Lokale Vorschau des fertigen Builds auf Port 4321 |
| `npm run qa` | Qualitätsprüfung des Builds (Links, SEO, Struktur, Vorlagenreste) |
| `npm run qa:browser` | Browserprüfung (Responsivität, Tastatur, Formular, Bewegung) |
| `npm run check` | Typprüfung der Astro-Komponenten |
| `npm run assets:logo` | Logo, Favicons und App-Icons neu erzeugen |
| `npm run assets:og` | Social-Media-Vorschaubild neu erzeugen |
| `npm run assets:screenshots` | Echte Screenshots der Referenzprojekte aufnehmen |

**Der Befehl für die Veröffentlichung ist `npm run deploy:build`.**
`npm run build` allein erzeugt kein `.htaccess` und keinen PHP-Endpunkt.

Vollständiger Prüfdurchlauf vor einem Release:

```bash
npm run deploy:build   # bauen
npm run qa             # statische Prüfung
npm run serve:dist &   # Vorschau starten
npm run qa:browser     # Browserprüfung
```

---

## 5. Projektstruktur

```
SaugySolutions/
├── src/
│   ├── data/                 ← ZENTRALE INHALTE (hier wird gepflegt)
│   │   ├── site.mjs          ← Kontaktdaten, Navigation, rechtliche Angaben
│   │   ├── services.mjs      ← Leistungen
│   │   ├── projects.mjs      ← Referenzprojekte
│   │   ├── process.mjs       ← Projektablauf
│   │   ├── team.mjs          ← Manuel und Michael
│   │   ├── benefits.mjs      ← Vorteile auf der Startseite
│   │   ├── faq.mjs           ← häufige Fragen
│   │   └── form.mjs          ← Auswahllisten des Kontaktformulars
│   ├── components/           ← wiederverwendbare Bausteine
│   ├── layouts/              ← Grundgerüst aller Seiten
│   ├── pages/                ← eine Datei = eine Seite
│   ├── styles/               ← Designsystem (Tokens, Basis, Komponenten, Formulare)
│   ├── scripts/              ← Vanilla-JavaScript
│   └── assets/logo-original.png  ← Originaldatei des Logos
│
├── server/                   ← alles Serverseitige
│   ├── api/kontakt.php       ← Endpunkt des Kontaktformulars
│   ├── lib/                  ← Config, Validator, RateLimiter, Mailer
│   ├── config/config.example.php  ← Konfigurationsvorlage OHNE Zugangsdaten
│   ├── apache/               ← .htaccess-Vorlagen
│   └── vendor/               ← PHPMailer (per Composer installiert)
│
├── public/                   ← wird unverändert übernommen
│   ├── fonts/  img/  icons/  favicon.ico
│
├── scripts/                  ← Build- und Prüfwerkzeuge (nur lokal)
└── dist/                     ← ERGEBNIS – dieser Inhalt kommt auf den Server
```

---

## 6. Deployment auf einen Apache-Webspace

### Schritt 1 – Build erzeugen

```bash
npm run deploy:build
```

Am Ende erscheint eine Liste der Angaben, die noch ergänzt werden müssen
(siehe [Abschnitt 12](#12-vor-der-veröffentlichung-bestätigen)).

### Schritt 2 – Dateien hochladen

Den **Inhalt** von `dist/` in das Wurzelverzeichnis des Webspace laden – also
alles *innerhalb* des Ordners, nicht den Ordner selbst.

Je nach Hoster heisst dieses Verzeichnis `public_html`, `httpdocs`, `htdocs`
oder `www`.

```
public_html/
├── .htaccess
├── index.html
├── 404.html
├── robots.txt
├── sitemap-index.xml
├── site.webmanifest
├── favicon.ico
├── assets/   fonts/   img/   icons/
├── leistungen/  projekte/  ablauf/  ueber-uns/  kontakt/  danke/
├── datenschutz/  impressum/
└── api/
    ├── kontakt.php
    ├── lib/
    ├── vendor/
    ├── config/
    └── var/          ← muss beschreibbar sein
```

> **Wichtig:** `.htaccess` beginnt mit einem Punkt und wird von vielen
> FTP-Programmen standardmässig ausgeblendet. In FileZilla:
> *Server → Versteckte Dateien anzeigen erzwingen*.

### Schritt 3 – Konfiguration anlegen

Siehe [Abschnitt 7](#7-kontaktformular-einrichten-php-und-smtp).

### Schritt 4 – Dateiberechtigungen

| Pfad | Rechte | Zweck |
|---|---|---|
| Ordner allgemein | `755` | lesbar und ausführbar |
| Dateien allgemein | `644` | lesbar |
| `api/var/` | `755` (oder `750`) | PHP muss hier schreiben können |
| Konfigurationsdatei | `600` | enthält das SMTP-Passwort |

```bash
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 755 api/var
chmod 600 ../saugy-solutions-config.php
```

### Schritt 5 – Prüfen

* Startseite aufrufen – erscheint sie?
* Eine Unterseite direkt aufrufen, z. B. `/leistungen/`
* Eine erfundene Adresse aufrufen – erscheint die eigene 404-Seite?
* `https://` erzwungen? (Aufruf über `http://` muss umleiten)
* Formular absenden – siehe [Abschnitt 8](#8-kontaktformular-testen)

---

## 7. Kontaktformular einrichten (PHP und SMTP)

### 7.1 Konfigurationsdatei anlegen

`api/config/config.example.php` als Vorlage verwenden. Es gibt **drei mögliche
Ablageorte**, sie werden in dieser Reihenfolge gesucht:

| Priorität | Ort | Empfehlung |
|---|---|---|
| 1 | Umgebungsvariablen (`SAUGY_SMTP_HOST` usw.) | ideal, wenn der Hoster das unterstützt |
| 2 | `../saugy-solutions-config.php` (eine Ebene **über** dem Webroot) | **empfohlen** – über das Web gar nicht erreichbar |
| 3 | `api/config/config.php` (im Webroot) | nur, wenn (2) nicht möglich ist; Zugriff wird per `.htaccess` gesperrt |

```bash
# Empfohlene Variante
cp public_html/api/config/config.example.php ./saugy-solutions-config.php
chmod 600 ./saugy-solutions-config.php
```

### 7.2 Werte eintragen

```php
'mode'            => 'production',       // 'development' versendet keine echten E-Mails
'debug'           => false,              // im Produktivbetrieb IMMER false

'recipient_email' => 'manu@saugy-solutions.ch',
'sender_email'    => 'formular@saugy-solutions.ch',   // MUSS die eigene Domain sein

'use_smtp'        => true,
'smtp_host'       => 'smtp.ihr-hoster.ch',
'smtp_port'       => 587,                // 587 = tls, 465 = ssl
'smtp_security'   => 'tls',
'smtp_user'       => 'formular@saugy-solutions.ch',
'smtp_pass'       => 'DAS-ECHTE-PASSWORT',

'ip_hash_secret'  => '…',                // siehe unten
```

**Zufallswert für `ip_hash_secret` erzeugen:**

```bash
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

Dieser Wert verschlüsselt die IP-Adressen für die Ratenbegrenzung. Die
IP-Adresse selbst wird **nie** gespeichert.

### 7.3 Warum eine eigene Absenderadresse?

Die Absenderadresse muss zur eigenen Domain gehören. Würde dort die Adresse der
anfragenden Person stehen, werten SPF und DKIM die Nachricht als Fälschung und
sie landet im Spam. Die Adresse der anfragenden Person steht deshalb in
`Reply-To` – ein Klick auf „Antworten“ geht trotzdem direkt an sie.

### 7.4 Sicherheitsmassnahmen des Endpunkts

| Massnahme | Wirkung |
|---|---|
| Herkunftsprüfung | akzeptiert nur Anfragen von der eigenen Domain (`Origin`/`Referer`) |
| Honeypot | unsichtbares Feld; ausgefüllt = automatisiertes Skript |
| Zeitprüfung | Absenden unter 3 Sekunden oder nach über 12 Stunden wird abgewiesen |
| Ratenbegrenzung | standardmässig 5 Anfragen pro IP und Stunde |
| Feldlängen | serverseitig begrenzt |
| Header Injection | Zeilenumbrüche werden aus allen einzeiligen Feldern entfernt |
| Offene Weiterleitung | nur seiteninterne Ziele werden akzeptiert |
| Protokollierung | keine Formularinhalte in Logdateien |

Es wird bewusst **kein externer Captcha-Dienst** eingesetzt, weil das Daten an
Dritte übertragen würde.

---

## 8. Kontaktformular testen

### 8.1 Testmodus (verschickt keine echten E-Mails)

In der Konfiguration `'mode' => 'development'` setzen. Nachrichten landen dann
als Datei unter `api/var/mail/` statt im Postfach.

```bash
# Lokal
php -S localhost:8080 -t dist
# Dann http://localhost:8080/kontakt/ im Browser öffnen und absenden
ls dist/api/var/mail/
```

Nach dem Test wieder auf `'mode' => 'production'` stellen und die Testdateien
löschen.

### 8.2 Test im Produktivbetrieb

1. `/kontakt/` aufrufen und das Formular vollständig ausfüllen
2. Absenden – es erscheint eine Bestätigung direkt im Formular
3. Prüfen, ob die E-Mail bei `manu@saugy-solutions.ch` ankommt
   (auch den Spam-Ordner kontrollieren)
4. Auf „Antworten“ klicken – die Antwort muss an die anfragende Person gehen
5. Gegenprobe ohne JavaScript: Das Formular muss auf `/danke/` weiterleiten

### 8.3 Wenn keine E-Mail ankommt

| Ursache | Prüfung |
|---|---|
| Falsche SMTP-Daten | Zugangsdaten beim Hoster kontrollieren |
| Falscher Port | 587 mit `tls` oder 465 mit `ssl` |
| Absender fremd | `sender_email` muss zur eigenen Domain gehören |
| Spam-Filter | Spam-Ordner prüfen, SPF-Eintrag der Domain kontrollieren |
| Port gesperrt | manche Hoster verlangen ihren eigenen SMTP-Server |

Zur Eingrenzung kurzzeitig `'debug' => true` setzen – dann erscheint die
technische Fehlermeldung im Browser. **Danach unbedingt wieder auf `false`.**

---

## 9. Inhalte pflegen

Alle Texte liegen in `src/data/`. Nach jeder Änderung neu bauen und hochladen:

```bash
npm run deploy:build
```

### Kontaktdaten ändern

`src/data/site.mjs` → `CONTACT`. Telefonnummer und E-Mail werden **automatisch**
an allen Stellen übernommen (Header, Footer, Kontaktseite, Dankeseite,
Impressum, Datenschutz, strukturierte Daten).

```js
export const CONTACT = {
  person: 'Manuel Saugy',
  phone: '+41 79 516 30 41',
  phoneHref: 'tel:+41795163041',   // ohne Leerzeichen!
  email: 'manu@saugy-solutions.ch',
  emailHref: 'mailto:manu@saugy-solutions.ch',
};
```

### Navigation ändern

`src/data/site.mjs` → `NAV`. Der Eintrag erscheint danach in der Kopfzeile, im
mobilen Menü und im Footer.

### Leistung ändern oder ergänzen

`src/data/services.mjs`. Ein neuer Eintrag erscheint automatisch auf der
Startseite, auf `/leistungen/`, in der Sprungnavigation und im Footer.

### Häufige Fragen ändern

`src/data/faq.mjs`. Die Fragen werden zusätzlich als strukturierte Daten
(`FAQPage`) ausgegeben.

### Auswahlfelder des Formulars ändern

Diese müssen an **zwei** Stellen übereinstimmen, sonst weist der Server die
Eingabe ab:

1. `src/data/form.mjs`
2. `server/lib/Validator.php` → `ALLOWED_TOPICS`, `ALLOWED_SERVICES`,
   `ALLOWED_START`, `ALLOWED_BUDGET`

---

## 10. Logo austauschen

Das Logo wird **nicht** neu gestaltet; das Skript nimmt nur technische
Optimierungen vor (Freistellen, Zuschnitt, Grössen, Icons).

```bash
# 1. Neue Datei ablegen (möglichst gross, weisser oder transparenter Hintergrund)
cp mein-neues-logo.png src/assets/logo-original.png

# 2. Alle Ableitungen neu erzeugen
npm run assets:logo

# 3. Social-Media-Vorschaubild ebenfalls erneuern
npm run assets:og

# 4. Neu bauen
npm run deploy:build
```

Erzeugt werden: freigestelltes Logo in drei Grössen (PNG + WebP),
`favicon.ico`, `favicon-32/48`, `icon-192/512`, `apple-touch-icon` und ein
maskierbares Icon für Android.

Liegt bereits eine SVG-Fassung des Logos vor, ist diese vorzuziehen: Datei nach
`public/img/` legen und die Pfade in `src/components/Logo.astro` sowie
`src/components/HeroVisual.astro` anpassen.

---

## 11. Neues Projekt hinzufügen

Einen Eintrag in `src/data/projects.mjs` ergänzen. Übersichtsseite,
Detailseite, Navigation und Sitemap entstehen daraus automatisch – es muss
**keine** neue Datei angelegt werden.

```js
{
  slug: 'kundenname',                    // wird zur Adresse /projekte/kundenname/
  name: 'Kundenname',
  domain: 'kundenname.ch',
  url: 'https://kundenname.ch',
  category: 'Unternehmenswebsite',
  industry: 'Branche',
  metaTitle: 'Kundenname – Website | Saugy Solutions',   // bis ca. 70 Zeichen
  teaser: 'Ein Satz für die Übersichtskarte.',
  accent: '#24e6b2',                     // Farbe der Vorschau
  shotDesktop: null,                     // Pfad zum Screenshot oder null
  shotMobile: null,

  intro: '…',        // Worum geht es?
  situation: '…',    // Ausgangslage
  goals: ['…'],      // Zielsetzung
  delivered: ['…'],  // umgesetzte Leistungen
  challenges: [{ title: '…', text: '…' }],
  result: '…',       // sachlich beschriebenes Ergebnis
}
```

**Echte Screenshots hinzufügen:**

```bash
npm run assets:screenshots
```

Danach `shotDesktop` und `shotMobile` auf die erzeugten Dateien zeigen lassen.
Solange beide auf `null` stehen, zeigt die Website eine bewusst **stilisierte**
Darstellung – es wird also kein Screenshot vorgetäuscht.

> Screenshots fremder Websites im eigenen Portfolio sind üblich, sollten aber
> mit der jeweiligen Kundschaft abgesprochen sein.

---

## 12. Vor der Veröffentlichung bestätigen

### Rechtliche Angaben – vollständig hinterlegt

Alle rechtlich erforderlichen Angaben sind in `src/data/site.mjs` unter `LEGAL`
eingetragen. `npm run deploy:build` meldet keine offenen Platzhalter mehr.

| Angabe | Wert |
|---|---|
| Geschäftsadresse | Manuel Saugy, Bücklirain 8b, 5312 Döttingen, Schweiz |
| Rechtsform | Einzelunternehmen (nicht im Handelsregister eingetragen) |
| UID / MWST-Nummer | nicht vorhanden – die Zeile entfällt im Impressum |
| Hostinganbieter | Hostpoint AG, Rapperswil-Jona, Schweiz |
| Serverstandort | Schweiz |
| SMTP-Anbieter | Hostpoint AG, Rapperswil-Jona, Schweiz |

**Zur Rechtsform:** Wer in der Schweiz als natürliche Person selbstständig
erwerbstätig ist – auch nebenberuflich –, führt von Gesetzes wegen ein
**Einzelunternehmen**. Eine „keine Rechtsform“ gibt es rechtlich nicht. Ein
Eintrag im Handelsregister ist erst ab 100 000 CHF Jahresumsatz Pflicht; der
Klammerzusatz stellt klar, dass kein Registereintrag besteht. Das Impressum
ergänzt dazu einen erklärenden Satz, weshalb keine UID vorhanden ist.

**Zur Adresse:** Die angegebene Adresse erscheint öffentlich im Impressum und
in der Datenschutzerklärung – das ist für ein Impressum so vorgesehen und
notwendig, damit der Anbieter erreichbar ist.

**Falls sich etwas ändert:** ausschliesslich `LEGAL` in `src/data/site.mjs`
anpassen. Impressum, Datenschutzerklärung und die strukturierten Daten
übernehmen die Werte automatisch.

### Noch inhaltlich zu bestätigen

* **Projektbeschreibungen** (`src/data/projects.mjs`) – sie halten sich an das,
  was auf den öffentlich erreichbaren Websites erkennbar ist. Bitte einmal
  gegenlesen und, wo gewünscht, um projektinterne Details ergänzen.
* **Einverständnis der Kundschaft**, als Referenz genannt zu werden.
* **Rechtstexte** – Datenschutzerklärung und Impressum sind sorgfältig
  erstellte **Vorlagen**, die die tatsächlichen Funktionen der Website
  abbilden. Sie ersetzen keine Rechtsberatung und sollten vor der
  Veröffentlichung geprüft werden.
* **Social-Media-Profile** – `SOCIAL` in `site.mjs` ist leer. Nur echte,
  bestehende Profile eintragen; der Footer blendet den Bereich sonst aus.

### Hostpoint-spezifische Hinweise

Für die SMTP-Konfiguration (siehe [Abschnitt 7](#7-kontaktformular-einrichten-php-und-smtp))
gelten bei Hostpoint folgende Werte:

```php
'smtp_host'     => 'asmtp.mail.hostpoint.ch',
'smtp_port'     => 587,
'smtp_security' => 'tls',
'smtp_auth'     => true,
'smtp_user'     => 'formular@saugy-solutions.ch',   // vollständige Adresse
'smtp_pass'     => '…',                             // Passwort des Postfachs
```

Die Absenderadresse muss ein bei Hostpoint eingerichtetes Postfach der Domain
`saugy-solutions.ch` sein. Die aktuellen Serverdaten stehen im Hostpoint
Control Panel unter *E-Mail → Konto → Servereinstellungen*.

Bei Hostpoint liegt das Webroot im Ordner `www`. Die empfohlene
Konfigurationsdatei kommt daher **neben** diesen Ordner:

```
/home/<benutzer>/
├── saugy-solutions-config.php     ← hierhin (nicht über das Web erreichbar)
└── www/                           ← Inhalt von dist/ hierhin
    ├── index.html
    └── api/
```

---

## 13. Go-live-Checkliste

### Vor dem Hochladen

- [ ] Rechtliche Angaben in `LEGAL` geprüft (siehe [Abschnitt 12](#12-vor-der-veröffentlichung-bestätigen))
- [ ] `npm run deploy:build` läuft ohne Fehler und ohne Platzhalterwarnung
- [ ] `npm run qa` meldet keine Fehler
- [ ] `npm run qa:browser` meldet keine Fehler
- [ ] Rechtstexte gegengelesen
- [ ] Projektbeschreibungen bestätigt
- [ ] `SITE.url` in `src/data/site.mjs` zeigt auf die Produktivdomain

### Auf dem Server

- [ ] Inhalt von `dist/` vollständig hochgeladen (inklusive `.htaccess`)
- [ ] SSL-Zertifikat aktiv, `http://` leitet auf `https://` um
- [ ] Domainvariante vereinheitlicht (mit oder ohne `www`)
- [ ] Konfigurationsdatei ausserhalb des Webroots angelegt, Rechte `600`
- [ ] `ip_hash_secret` mit einem eigenen Zufallswert gesetzt
- [ ] `api/var/` ist beschreibbar
- [ ] `'mode' => 'production'` und `'debug' => false`

### Funktionsprüfung

- [ ] Alle elf Seiten erreichbar
- [ ] Navigation auf Desktop und Mobilgerät
- [ ] Mobiles Menü öffnet, schliesst und ist per Tastatur bedienbar
- [ ] Formular absenden – E-Mail kommt an
- [ ] „Antworten“ geht an die anfragende Person
- [ ] Erfundene Adresse zeigt die eigene 404-Seite
- [ ] `/api/lib/Config.php` direkt aufrufen → muss **403 Forbidden** liefern
- [ ] `/api/config/config.php` direkt aufrufen → muss **403 Forbidden** liefern
- [ ] Browser-Konsole ohne Fehler

### Nach dem Aufschalten

- [ ] `https://saugy-solutions.ch/robots.txt` erreichbar
- [ ] `https://saugy-solutions.ch/sitemap-index.xml` erreichbar
- [ ] Sitemap in der Google Search Console eingereicht
- [ ] Vorschaubild geprüft (Link in einem Messenger teilen)
- [ ] Lighthouse-Prüfung durchgeführt (Ziel: Performance ≥ 90, übrige ≥ 95)
- [ ] Strukturierte Daten geprüft: <https://search.google.com/test/rich-results>
- [ ] Erstes Backup erstellt

---

## 14. Backups und Updates

### Backup

Zu sichern sind:

1. **Das Repository** – enthält alle Inhalte und den gesamten Quellcode
2. **Die Konfigurationsdatei** (`saugy-solutions-config.php`) – liegt bewusst
   nicht im Repository und enthält die SMTP-Zugangsdaten
3. Eingegangene Anfragen liegen im E-Mail-Postfach, nicht auf dem Server

Die Website selbst lässt sich jederzeit aus dem Repository neu erzeugen.

### Updates

```bash
# Verfügbare Aktualisierungen anzeigen
npm outdated

# Astro und Abhängigkeiten aktualisieren
npm update

# PHPMailer aktualisieren (nur lokal, Composer nötig)
cd server && composer update --no-dev && cd ..

# Danach immer prüfen und neu bauen
npm run deploy:build && npm run qa
```

Empfohlen: zwei- bis viermal jährlich aktualisieren, mindestens aber bei
Sicherheitsmeldungen zu PHPMailer.

---

## 15. Technische Hinweise

### Warum statisch?

Statische Dateien sind schnell, brauchen keine Datenbank, lassen sich nicht
über eine veraltete CMS-Version angreifen und laufen auf jedem Webspace. Für
eine Unternehmenswebsite dieser Grösse ist das die robusteste Variante.

### Bewegung und Barrierefreiheit

Sämtliche Animationen sind in `@media (prefers-reduced-motion: no-preference)`
gekapselt oder werden über `--motion-scale` abgeschaltet. Wer im Betriebssystem
reduzierte Bewegung eingestellt hat, erhält dieselbe Website ohne Bewegung –
Inhalte bleiben dabei immer sichtbar.

Weiter umgesetzt: Sprungmarke, sichtbare Fokuszustände, semantische
Landmarken, Fokusfalle im mobilen Menü, mit Feldern verknüpfte
Fehlermeldungen, Kontraste über WCAG AA (Fliesstext 9,5:1).

### Content Security Policy

Die CSP in `.htaccess` erlaubt ausschliesslich eigene Inhalte. `'unsafe-inline'`
ist nötig für das kleine Inline-Skript im `<head>`, die strukturierten Daten und
einzelne `style`-Attribute. Da keine fremden und keine von Nutzenden erzeugten
Inhalte ausgegeben werden, ist das Restrisiko gering.

Wer die Vorgabe verschärfen möchte: die Hashes der Inline-Skripte berechnen
(`openssl dgst -sha256 -binary | openssl base64`) und `'unsafe-inline'` durch
`'sha256-…'` ersetzen. Die Hashes ändern sich bei jedem Build, in dem sich der
Inhalt strukturierter Daten ändert.

### HSTS

`Strict-Transport-Security` ist in `.htaccess` **auskommentiert**. Erst
aktivieren, wenn HTTPS dauerhaft und für alle Subdomains läuft – die Vorgabe
lässt sich nicht kurzfristig zurücknehmen.

### Kein Cookie-Banner

Die Website setzt keine Cookies und speichert nichts im Browser. Es gibt daher
nichts, dem zugestimmt werden müsste. Ein Banner wäre irreführend.
**Wird später ein Dienst eingebunden, der Cookies setzt (Analyse,
Kartendienst, eingebettete Videos), müssen Datenschutzerklärung und
Einwilligung entsprechend ergänzt werden.**

---

## 16. Fehlersuche

| Problem | Ursache und Lösung |
|---|---|
| **500 Internal Server Error** | `.htaccess` nicht kompatibel. Datei kurz umbenennen; erscheint die Seite, die Blöcke einzeln auskommentieren. Meist fehlt `AllowOverride All`. |
| **Unterseiten nicht erreichbar** | `.htaccess` fehlt oder `mod_rewrite` ist aus. Beim Hoster nachfragen. |
| **`.htaccess` nicht sichtbar** | Versteckte Dateien im FTP-Programm einblenden. |
| **Formular meldet „Verbindung nicht möglich“** | `/api/kontakt.php` fehlt oder PHP ist nicht aktiv. Direkt aufrufen – erwartet wird eine JSON-Antwort mit Status 405. |
| **Formular meldet „stammt nicht von der Website“** | `allowed_hosts` in der Konfiguration ergänzen (mit und ohne `www`). |
| **„Das ging uns etwas zu schnell“** | Bot-Schutz. Bei echten Personen unkritisch; notfalls `min_fill_seconds` senken. |
| **Keine E-Mail trotz Erfolgsmeldung** | `mode` steht auf `development`. Auf `production` umstellen. |
| **Schriften werden nicht geladen** | `fonts/` wurde nicht hochgeladen oder die CSP blockiert sie. |
| **Logo unscharf** | `npm run assets:logo` mit einer grösseren Originaldatei erneut ausführen. |
| **Änderung nicht sichtbar** | Browser-Cache leeren (Strg/Cmd + Shift + R). HTML wird nicht zwischengespeichert, CSS und JS tragen einen Hash im Namen. |

---

## Lizenz und Urheberrecht

Inhalte, Gestaltung und Bildmarke gehören Saugy Solutions.
Die Schriftart Manrope steht unter der SIL Open Font License
(`public/fonts/manrope-OFL.txt`), PHPMailer unter der LGPL-2.1.

---

**Kontakt bei Fragen zu diesem Projekt:**
Manuel Saugy · <manu@saugy-solutions.ch> · +41 79 516 30 41
