# Saugy Solutions – Website

Statische Unternehmenswebsite mit Adminbereich, gebaut mit [Astro](https://astro.build)
im vollständig statischen Modus und [Decap CMS](https://decapcms.org).

Das fertige Ergebnis besteht aus gewöhnlichen HTML-, CSS-, JavaScript-, Bild-
und Schriftdateien plus zwei schlanken PHP-Endpunkten (Kontaktformular und
Anmeldung am Adminbereich). **Auf dem Produktivserver werden weder Node.js noch
Composer benötigt** – ein normaler Hostpoint-Webspace mit PHP 8.1+ genügt.

> **Inhalte pflegen?** Dafür gibt es eine eigene, nicht technische Anleitung:
> [docs/ADMIN-ANLEITUNG.md](docs/ADMIN-ANLEITUNG.md)

---

## Inhalt

1. [Überblick](#1-überblick)
2. [Wie eine Änderung online geht](#2-wie-eine-änderung-online-geht)
3. [Voraussetzungen](#3-voraussetzungen)
4. [Installation und Entwicklung](#4-installation-und-entwicklung)
5. [Befehle](#5-befehle)
6. [Projektstruktur](#6-projektstruktur)
7. [Adminbereich einrichten](#7-adminbereich-einrichten)
8. [GitHub Secrets für das Deployment](#8-github-secrets-für-das-deployment)
9. [Deployment auf Hostpoint](#9-deployment-auf-hostpoint)
10. [Kontaktformular](#10-kontaktformular)
11. [Inhalte und Logo pflegen](#11-inhalte-und-logo-pflegen)
12. [Rollback und Backup](#12-rollback-und-backup)
13. [Fehlerbehebung](#13-fehlerbehebung)
14. [Qualitätskontrolle](#14-qualitätskontrolle)
15. [Technische Hinweise](#15-technische-hinweise)
16. [Go-live-Checkliste](#16-go-live-checkliste)

---

## 1. Überblick

| Bereich | Umsetzung |
|---|---|
| Generator | Astro 7, `output: "static"` |
| Adminbereich | Decap CMS 3, selbst gehostet unter `/admin/` |
| Inhalte | YAML-Dateien unter `content/`, versioniert in Git |
| Anmeldung | GitHub OAuth über eigene PHP-Brücke |
| Sprache | Deutsch, Schweizer Standardsprache (`de-CH`, „ss“ statt „ß“) |
| Schrift | Manrope Variable, **lokal** ausgeliefert |
| JavaScript | Vanilla, ca. 8 KB – die Website funktioniert auch ohne |
| Formular | PHP 8.1+ mit PHPMailer (SMTP) |
| Tracking | keines. Keine Cookies, keine externen Dienste, kein Cookie-Banner |
| Seiten | Start, Leistungen, Projekte (+ Detailseiten), Ablauf, Über uns, Kontakt, Danke, Datenschutz, Impressum, 404 |

**Grundsatz zu Inhalten:** Die Website enthält ausschliesslich belegbare
Angaben. Keine erfundenen Kundenstimmen, Kennzahlen oder Reaktionszeiten.
Bitte bei künftigen Änderungen beibehalten.

---

## 2. Wie eine Änderung online geht

```
  1. Anmeldung             saugy-solutions.ch/admin/  →  GitHub OAuth
                                      │
  2. Bearbeiten            Texte, Bilder, Projekte im Browser
                                      │
  3. Veröffentlichen       Decap schreibt die Änderung nach GitHub
                                      │
  4. GitHub Actions        npm ci → Build → statische QA → Browser-QA
                                      │
              ┌───────────────────────┴───────────────────────┐
         Prüfung grün                                  Prüfung rot
              │                                               │
  5. rsync über SSH nach Hostpoint            Es wird NICHTS veröffentlicht.
              │                               Die bisherige Website bleibt
  6. Nach 3–5 Minuten live                    unverändert online.
```

Der Build wird also **nur bei bestandener Prüfung** übertragen. Ein fehlerhafter
Inhalt kann die laufende Website nicht beschädigen.

---

## 3. Voraussetzungen

**Für die Entwicklung (lokaler Rechner):**

* Node.js **20 oder neuer** (`node --version`)
* npm
* optional PHP 8.1+, um die Endpunkte lokal zu testen
* optional Composer, falls PHPMailer aktualisiert werden soll

**Für den Betrieb (Hostpoint):**

* Apache mit `AllowOverride All`
* PHP **8.1 oder neuer** mit `mbstring`, `openssl` und `curl`
* SSH-Zugang (für das automatische Deployment)
* SSL-Zertifikat
* **kein** Node.js, **kein** Composer

---

## 4. Installation und Entwicklung

```bash
git clone https://github.com/maanu0001/SaugySolutions.git
cd SaugySolutions

npm install

# Entwicklungsserver -> http://localhost:4321
npm run dev
```

`npm run dev` und `npm run build` führen automatisch `scripts/prepare-assets.mjs`
aus. Dabei werden Bilder optimiert, das Logo verarbeitet, die Adminkonfiguration
erzeugt und Decap CMS bereitgestellt.

---

## 5. Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver mit automatischem Neuladen |
| `npm run build` | Reiner Astro-Build |
| **`npm run deploy:build`** | **Vollständiger, hochladbarer Build inklusive PHP und `.htaccess`** |
| `npm run serve:dist` | Lokale Vorschau des fertigen Builds auf Port 4321 |
| `npm run qa` | Statische Prüfung (Links, SEO, Struktur, Geheimnisse, Adminbereich) |
| `npm run qa:browser` | Browserprüfung (11 Bildschirmgrössen, Tastatur, Formular, Logo) |
| `npm run check` | Typprüfung der Astro-Komponenten |
| `npm run assets` | Alle Asset-Schritte auf einmal |
| `npm run assets:logo` | Logo, Favicons und App-Icons neu erzeugen |
| `npm run assets:images` | Bilder der Mediathek optimieren |
| `npm run assets:og` | Social-Media-Vorschaubild neu erzeugen |
| `npm run assets:cms` | Adminkonfiguration neu erzeugen |
| `npm run assets:admin` | Decap CMS aus node_modules bereitstellen |
| `npm run assets:screenshots` | Echte Screenshots der Referenzprojekte aufnehmen |

Vollständiger Prüfdurchlauf vor einem Release:

```bash
npm ci
npm run check
npm run deploy:build
npm run qa
npm run serve:dist &
npm run qa:browser
```

---

## 6. Projektstruktur

```
SaugySolutions/
├── content/                  ← INHALTE (vom Adminbereich bearbeitet)
│   ├── settings/
│   │   ├── site.yml          ← Unternehmen, Logo, Kontakt, Recht, Navigation
│   │   ├── home.yml          ← Startseite: Hero, Abschnitte, Reihenfolge
│   │   ├── pages.yml         ← Seitentitel und Meta-Beschreibungen
│   │   ├── services.yml      ← Leistungen
│   │   ├── benefits.yml      ← Vorteile
│   │   ├── process.yml       ← Ablauf
│   │   ├── team.yml          ← Team
│   │   └── faq.yml           ← Häufige Fragen
│   └── projects/*.yml        ← ein Projekt pro Datei
│
├── src/
│   ├── data/                 ← Ladeschicht: liest content/ ein
│   ├── components/           ← wiederverwendbare Bausteine
│   ├── layouts/  pages/  styles/  scripts/
│   └── assets/logo-original.png   ← Rückfalldatei für das Logo
│
├── server/                   ← alles Serverseitige
│   ├── api/kontakt.php       ← Kontaktformular
│   ├── api/auth.php          ← Anmeldebrücke des Adminbereichs
│   ├── lib/                  ← Config, Validator, RateLimiter, Mailer
│   ├── config/config.example.php  ← Vorlage OHNE Zugangsdaten
│   ├── apache/               ← .htaccess-Vorlagen
│   └── vendor/               ← PHPMailer
│
├── public/
│   ├── admin/index.html      ← Adminbereich
│   ├── img/uploads/          ← Mediathek (Uploads aus dem Adminbereich)
│   ├── fonts/  icons/
│
├── scripts/                  ← Build- und Prüfwerkzeuge (nur lokal und in CI)
├── docs/ADMIN-ANLEITUNG.md   ← Anleitung für die Redaktion
└── dist/                     ← ERGEBNIS – dieser Inhalt kommt auf den Server
```

Nicht eingecheckt (wird beim Build erzeugt): `public/admin/vendor/`,
`public/admin/config.yml`, `public/img/generated/`, `public/img/derived/`.

---

## 7. Adminbereich einrichten

Der Adminbereich liegt unter **<https://saugy-solutions.ch/admin/>**.

### 7.1 GitHub-OAuth-App anlegen

GitHub → **Settings** → **Developer settings** → **OAuth Apps** →
**New OAuth App**

| Feld | Wert |
|---|---|
| **Application name** | `Saugy Solutions Adminbereich` |
| **Homepage URL** | `https://saugy-solutions.ch` |
| **Authorization callback URL** | `https://saugy-solutions.ch/api/auth.php` |

Nach dem Anlegen:

1. Die **Client ID** notieren.
2. **„Generate a new client secret“** klicken und das Secret sofort kopieren –
   es wird nur einmal angezeigt.

> Die Callback-URL muss **exakt** stimmen, inklusive `https://` und `.php`.
> Weicht sie ab, lehnt GitHub die Anmeldung ab.

### 7.2 Zugangsdaten auf dem Server hinterlegen

In der Konfigurationsdatei (siehe [Abschnitt 10.1](#101-konfigurationsdatei-anlegen)):

```php
'github_client_id'     => 'Iv1.xxxxxxxxxxxx',
'github_client_secret' => 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

// Nur diese GitHub-Konten dürfen sich anmelden.
'github_allowed_users' => ['maanu0001'],
```

**Das Secret verlässt den Server nie** und steht nicht im Repository. Der
Browser bekommt ausschliesslich das fertige Zugriffstoken.

### 7.3 Weitere Person freigeben

GitHub-Benutzernamen in `github_allowed_users` ergänzen und die Datei speichern.
Zusätzlich braucht die Person Schreibrechte auf das Repository. Ein Neustart
ist nicht nötig.

Ist die Liste leer, wird **jede** Anmeldung abgelehnt.

### 7.4 Produktivbranch ändern

Aktuell wird auf `claude/saugy-solutions-website-b62pey` veröffentlicht. Beim
Umstieg auf einen anderen Branch (etwa `main`) sind drei Stellen anzupassen:

1. `.github/workflows/build-deployment.yml` → `on.push.branches`
2. `scripts/generate-cms-config.mjs` → Standardwert von `CMS_BRANCH`
3. Im Workflow wird `CMS_BRANCH` ohnehin aus `github.ref_name` gesetzt.

### 7.5 Sicherheitsmassnahmen

| Massnahme | Wirkung |
|---|---|
| Client-Secret nur serverseitig | Im Browser ist kein Geheimnis vorhanden |
| `state`-Wert + HttpOnly-Cookie | Schutz gegen untergeschobene Anmeldungen (CSRF) |
| Cookie `Secure` und `SameSite=Lax` | Nur über HTTPS, übersteht die Rückleitung von GitHub |
| Freigabeliste | Nur benannte GitHub-Konten erhalten ein Token |
| Begrenzung der Versuche | 10 Anmeldeversuche pro IP und Stunde |
| Ziel der Token-Übergabe | Ausschliesslich die eigene Herkunft |
| `noindex` | robots.txt, Meta-Angabe und `X-Robots-Tag` |
| Eigene CSP | `/admin/` darf mit GitHub sprechen, die Website nicht |

---

## 8. GitHub Secrets für das Deployment

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Beispiel | Beschreibung |
|---|---|---|
| `HOSTPOINT_SSH_HOST` | `s123.web.hostpoint.ch` | SSH-Server (im Hostpoint Control Panel) |
| `HOSTPOINT_SSH_PORT` | `22` | Optional, Standard ist 22 |
| `HOSTPOINT_SSH_USER` | `saugysol` | SSH-Benutzername |
| `HOSTPOINT_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----…` | Privater Schlüssel, vollständig |
| `HOSTPOINT_KNOWN_HOSTS` | Ausgabe von `ssh-keyscan` | Fingerabdruck des Servers |
| `HOSTPOINT_DOCUMENT_ROOT` | `/home/saugysol/www` | Absoluter Pfad zum Webroot |

### Deployment-Schlüssel erzeugen

```bash
# 1. Schlüsselpaar ohne Passwort erzeugen
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/saugy_deploy -N ""

# 2. Öffentlichen Teil auf Hostpoint hinterlegen
ssh-copy-id -i ~/.ssh/saugy_deploy.pub benutzer@s123.web.hostpoint.ch
#    (alternativ den Inhalt von saugy_deploy.pub in ~/.ssh/authorized_keys eintragen)

# 3. Privaten Teil als Secret HOSTPOINT_SSH_KEY hinterlegen
cat ~/.ssh/saugy_deploy

# 4. Fingerabdruck als Secret HOSTPOINT_KNOWN_HOSTS hinterlegen
ssh-keyscan -p 22 s123.web.hostpoint.ch
```

> `HOSTPOINT_KNOWN_HOSTS` ist nicht zwingend, aber empfohlen. Fehlt es, wird
> der Fingerabdruck ungeprüft übernommen und der Workflow gibt eine Warnung aus.

**Fehlen die Secrets**, läuft der Workflow trotzdem: Build und Prüfungen werden
ausgeführt, die Veröffentlichung wird übersprungen und im Protokoll vermerkt.
Der Build liegt dann als Artefakt zum manuellen Hochladen bereit.

---

## 9. Deployment auf Hostpoint

### Automatisch

Bei jedem Push auf den Produktivbranch – also auch bei jeder Veröffentlichung
aus dem Adminbereich. Zusätzlich manuell über
**Actions → „Build, Prüfung und Veröffentlichung“ → Run workflow**.

Eine `concurrency`-Sperre verhindert, dass zwei Veröffentlichungen gleichzeitig
laufen.

### Verzeichnisaufbau auf dem Server

```
/home/<benutzer>/
├── saugy-solutions-config.php     ← Zugangsdaten, NICHT über das Web erreichbar
└── www/                           ← Webroot (HOSTPOINT_DOCUMENT_ROOT)
    ├── .htaccess
    ├── index.html   404.html   robots.txt   sitemap-index.xml
    ├── assets/  fonts/  img/  icons/
    ├── admin/                     ← Adminbereich
    │   ├── index.html  config.yml  .htaccess  vendor/
    └── api/
        ├── kontakt.php  auth.php  lib/  vendor/
        ├── config/                ← nur Vorlage
        └── var/                   ← Laufzeitdaten, muss beschreibbar sein
```

### Was beim Übertragen geschützt ist

Die Übertragung nutzt `rsync --delete`, damit entfernte Dateien auch auf dem
Server verschwinden. Ausdrücklich **geschützt** sind:

| Pfad | Grund |
|---|---|
| `../saugy-solutions-config.php` | Liegt ausserhalb des Webroots und wird gar nicht berührt |
| `api/config/config.php` | Zugangsdaten, falls diese Variante genutzt wird |
| `api/var/rl_*` | Zähler der Ratenbegrenzung |
| `api/var/mail/` | Testnachrichten im Entwicklungsmodus |

**Die SMTP-Konfiguration wird also niemals überschrieben oder gelöscht.**

### Dateiberechtigungen

```bash
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 755 api/var
chmod 600 ../saugy-solutions-config.php
```

### Erstes Deployment von Hand

Falls SSH noch nicht eingerichtet ist:

1. Workflow manuell starten oder `npm run deploy:build` lokal ausführen.
2. Artefakt `saugy-solutions-deployment` herunterladen und entpacken.
3. Den **Inhalt** per FTP in das Webroot laden – inklusive der versteckten
   `.htaccess`-Dateien (in FileZilla:
   *Server → Versteckte Dateien anzeigen erzwingen*).

---

## 10. Kontaktformular

### 10.1 Konfigurationsdatei anlegen

`api/config/config.example.php` als Vorlage verwenden. Ablageorte, in dieser
Reihenfolge gesucht:

| Priorität | Ort | Empfehlung |
|---|---|---|
| 1 | Umgebungsvariablen (`SAUGY_…`) | Wenn der Hoster das unterstützt |
| 2 | `../saugy-solutions-config.php` | **Empfohlen** – über das Web nicht erreichbar |
| 3 | `api/config/config.php` | Nur als Notlösung; per `.htaccess` gesperrt |

```bash
cp www/api/config/config.example.php ./saugy-solutions-config.php
chmod 600 ./saugy-solutions-config.php
```

### 10.2 SMTP bei Hostpoint

```php
'use_smtp'        => true,
'smtp_host'       => 'asmtp.mail.hostpoint.ch',
'smtp_port'       => 587,
'smtp_security'   => 'tls',
'smtp_auth'       => true,
'smtp_user'       => 'formular@saugy-solutions.ch',   // vollständige Adresse
'smtp_pass'       => '…',

'sender_email'    => 'formular@saugy-solutions.ch',   // MUSS eigene Domain sein
'recipient_email' => 'manu@saugy-solutions.ch',

'ip_hash_secret'  => '…',   // php -r "echo bin2hex(random_bytes(32));"
```

Die aktuellen Serverdaten stehen im Hostpoint Control Panel unter
*E-Mail → Konto → Servereinstellungen*.

### 10.3 Felder

Name, E-Mail, Telefon (optional), Unternehmen (optional), Art der Anfrage,
gewünschter Projektstart (optional), Budgetrahmen (optional),
Projektbeschreibung, Datenschutz-Zustimmung.

> Das frühere Feld **„Gewünschte Leistung“** wurde entfernt – es überschnitt
> sich zu stark mit „Art der Anfrage“.

Auswahllisten müssen an **zwei** Stellen übereinstimmen:

1. `src/data/form.mjs`
2. `server/lib/Validator.php` → `ALLOWED_TOPICS`, `ALLOWED_START`, `ALLOWED_BUDGET`

### 10.4 Validierung

Rote Fehlermeldungen erscheinen **erst nach dem ersten Absendeversuch**. Ein
Feld zu fokussieren und leer wieder zu verlassen markiert nichts. Danach
verschwindet ein Fehler, sobald das Feld korrigiert wird.

### 10.5 Testen ohne echten Versand

`'mode' => 'development'` setzen. Nachrichten landen dann als Datei unter
`api/var/mail/` statt im Postfach. Danach wieder auf `'production'` stellen.

---

## 11. Inhalte und Logo pflegen

Für die tägliche Arbeit: **[docs/ADMIN-ANLEITUNG.md](docs/ADMIN-ANLEITUNG.md)**

Technisch liegen alle Inhalte als YAML unter `content/`. Sie lassen sich auch
direkt im Editor bearbeiten – der Adminbereich schreibt dieselben Dateien.

### Logo

Quelle ist `content/settings/site.yml` → `branding.logo`. Beim Build:

* SVG wird unverändert übernommen (bevorzugt).
* PNG/WebP: weisser Hintergrund wird freigestellt, transparenter Rand
  entfernt, Rastergrössen erzeugt.
* `src/data/logo-manifest.json` hält die echten Masse fest – dadurch wird das
  Logo **nie verzerrt** und es entsteht kein Layoutsprung.
* Favicon, App-Icons und das Open-Graph-Bild entstehen automatisch neu.

Header, Hero und Footer verwenden ausschliesslich `src/components/Logo.astro`.
Das Logo ist an keiner Stelle fest eingebaut.

### Bilder

Uploads landen in `public/img/uploads/`. Beim Build entstehen daraus AVIF- und
WebP-Fassungen in mehreren Breiten (`public/img/derived/`) plus ein Manifest
mit den echten Massen.

---

## 12. Rollback und Backup

### Eine frühere Fassung wiederherstellen

**Variante A – über GitHub (empfohlen):**

```bash
git log --oneline              # gewünschten Stand suchen
git revert <commit>            # Änderung rückgängig machen
git push
```

Der Push löst automatisch einen neuen Build samt Veröffentlichung aus.

**Variante B – über ein Artefakt:**

1. **Actions** → den letzten erfolgreichen Durchgang öffnen.
2. Artefakt `saugy-solutions-deployment` herunterladen (30 Tage verfügbar).
3. Inhalt per FTP/SFTP ins Webroot laden.

**Variante C – Notfall, letzter funktionierender Stand:**

```bash
git checkout <letzter-guter-commit> -- content/
git commit -m "Inhalte auf letzten funktionierenden Stand zurückgesetzt"
git push
```

### Backup

Zu sichern sind:

1. **Das Repository** – enthält Inhalte, Bilder und den gesamten Quellcode.
2. **`saugy-solutions-config.php`** – liegt bewusst nicht im Repository.
3. Eingegangene Anfragen liegen im E-Mail-Postfach.

Die Website selbst lässt sich jederzeit aus dem Repository neu erzeugen.

### Updates

```bash
npm outdated
npm update
cd server && composer update --no-dev && cd ..

npm run deploy:build && npm run qa
```

Empfohlen: zwei- bis viermal jährlich, mindestens bei Sicherheitsmeldungen zu
PHPMailer oder Decap CMS.

---

## 13. Fehlerbehebung

### Der Build schlägt fehl

1. **Actions** → fehlgeschlagenen Durchgang → roten Schritt aufklappen.
2. Häufige Ursachen:

| Meldung | Ursache und Lösung |
|---|---|
| `content/… ist kein gültiges YAML` | Eine Inhaltsdatei ist beschädigt. Im Adminbereich die letzte Änderung rückgängig machen. |
| `Link ins Leere` | Ein Menüpunkt zeigt auf eine Seite, die es nicht gibt. Ziel in den Einstellungen korrigieren. |
| `Titel identisch mit …` | Zwei Seiten haben denselben Seitentitel. Unter „Seiten & SEO“ ändern. |
| `Logo nicht gefunden` | Die Datei wurde gelöscht. Im Adminbereich neu hochladen. |
| `Mögliches Geheimnis` | Es wurde versehentlich ein Token eingecheckt. **Sofort widerrufen.** |

**Wichtig:** Bei einem fehlgeschlagenen Build wird nichts veröffentlicht. Die
Website bleibt auf dem letzten funktionierenden Stand.

### Das Deployment schlägt fehl

| Meldung | Ursache und Lösung |
|---|---|
| `Permission denied (publickey)` | Der öffentliche Schlüssel liegt nicht in `~/.ssh/authorized_keys` auf dem Server. |
| `Host key verification failed` | `HOSTPOINT_KNOWN_HOSTS` fehlt oder ist veraltet – mit `ssh-keyscan` neu erzeugen. |
| `No such file or directory` | `HOSTPOINT_DOCUMENT_ROOT` stimmt nicht. Pfad per SSH mit `pwd` prüfen. |
| `Veröffentlichung übersprungen` | Secrets fehlen. Artefakt herunterladen und von Hand hochladen. |

Nach der Korrektur genügt ein erneuter Start über **Run workflow**.

### Der Adminbereich

| Problem | Ursache und Lösung |
|---|---|
| „Anmeldung ist noch nicht eingerichtet“ | `github_client_id`/`github_client_secret` fehlen in der Konfiguration. |
| „Konto ist nicht freigegeben“ | GitHub-Benutzernamen in `github_allowed_users` ergänzen. |
| „Anmeldung konnte nicht überprüft werden“ | Das state-Cookie ging verloren. Ohne HTTPS oder bei blockierten Cookies. Erneut versuchen. |
| Fenster öffnet sich, bleibt leer | Callback-URL in der OAuth-App prüfen: exakt `https://saugy-solutions.ch/api/auth.php`. |
| „Zu viele Anmeldeversuche“ | Begrenzung greift. Eine Stunde warten oder `admin_rate_limit_max` erhöhen. |
| Adminbereich lädt nicht | `admin/vendor/` wurde nicht vollständig hochgeladen. Deployment wiederholen. |

### Die Website allgemein

| Problem | Ursache und Lösung |
|---|---|
| **500 Internal Server Error** | `.htaccess` nicht kompatibel. Datei kurz umbenennen; erscheint die Seite, Blöcke einzeln auskommentieren. Meist fehlt `AllowOverride All`. |
| **Unterseiten nicht erreichbar** | `mod_rewrite` ist aus. Beim Hoster nachfragen. |
| **Formular meldet „Verbindung nicht möglich“** | `/api/kontakt.php` fehlt oder PHP ist inaktiv. Direkt aufrufen – erwartet wird JSON mit Status 405. |
| **Keine E-Mail trotz Erfolgsmeldung** | `mode` steht auf `development`. |
| **Änderung nicht sichtbar** | Browser-Cache leeren (Strg/Cmd + Umschalt + R). |

---

## 14. Qualitätskontrolle

`npm run qa` – **20 statische Prüfungen**: interne Links und Anker,
Überschriftenstruktur, Alt-Texte, Metadaten und Eindeutigkeit, strukturierte
Daten, Vorlagenreste, Schweizer Schreibweise, Sitemap und robots.txt,
Deployment-Hygiene, Adminbereich, Suche nach Zugangsdaten.

`npm run qa:browser` – **81 Browserprüfungen**:

| Bereich | Umfang |
|---|---|
| Konsole und Status | 13 Seiten, eigene 404-Seite |
| Bildschirmgrössen | 320, 360, 375, 390, 430, 768, 1024, 1440, 1920 plus zwei Querformate |
| Logo | Seitenverhältnis, `object-fit`, kein Zuschnitt, Grösse, Ladezustand |
| Hero | Zentrierung mit Pixelmessung, begrenzte Textbreite |
| Mobiler Header | Sichtbarkeit beim Scrollen, Hintergrund, Touch-Ziel, z-index |
| Mobiles Menü | Öffnen, ARIA, Scroll-Sperre, Fokusfalle, Escape, Fokusrückgabe, Scrollposition |
| Tastatur | Sprungmarke, Fokusringe, FAQ per Tastatur |
| Formular | Keine Fehler vor dem Absenden, Fehler danach, Korrekturverhalten, Screenreader-Verknüpfung, mobile Darstellung |
| Reduzierte Bewegung | Inhalte sichtbar, keine Animation, keine Mausreaktion |
| Ohne JavaScript | Inhalte und Formularversand |
| Adminbereich | Erreichbar, lädt, `noindex`, keine Zugangsdaten |
| Projekte | Unterseiten aus CMS-Daten, Bildmasse und Alt-Texte |

---

## 15. Technische Hinweise

### Warum statisch mit Git-basiertem CMS?

Es gibt keine Datenbank und kein serverseitiges CMS, das angegriffen oder
veraltet sein könnte. Jede Inhaltsänderung ist ein Commit: nachvollziehbar,
mit Datum und Person, jederzeit umkehrbar.

### Bewegung und Barrierefreiheit

Alle Animationen sind in `@media (prefers-reduced-motion: no-preference)`
gekapselt oder werden über `--motion-scale` abgeschaltet. Weiter umgesetzt:
Sprungmarke, sichtbare Fokuszustände, semantische Landmarken, Fokusfalle im
mobilen Menü, mit Feldern verknüpfte Fehlermeldungen.

### Farbkontraste

Alle geprüften Kombinationen liegen zwischen 6.5:1 und 18.4:1 und erfüllen
damit WCAG AA (mindestens 4.5:1) deutlich.

### Content Security Policy

Die öffentliche Website erlaubt ausschliesslich eigene Inhalte. Der
Adminbereich hat unter `/admin/.htaccess` eine eigene, etwas weitere Vorgabe,
weil Decap CMS mit der GitHub-Schnittstelle sprechen muss.

### HSTS

`Strict-Transport-Security` ist in `.htaccess` **auskommentiert**. Erst
aktivieren, wenn HTTPS dauerhaft und für alle Subdomains läuft.

### Kein Cookie-Banner

Die öffentliche Website setzt keine Cookies. Der Adminbereich verwendet ein
technisch notwendiges Sitzungscookie – er ist nicht öffentlich und benötigt
keine Einwilligung.

**Wird später ein Dienst eingebunden, der Cookies setzt, müssen
Datenschutzerklärung und Einwilligung ergänzt werden.**

---

## 16. Go-live-Checkliste

### Einmalig einrichten

- [ ] GitHub-OAuth-App angelegt, Callback-URL exakt `https://saugy-solutions.ch/api/auth.php`
- [ ] `github_client_id`, `github_client_secret` und `github_allowed_users` in der Konfiguration
- [ ] SSH-Deployment-Schlüssel erzeugt und auf Hostpoint hinterlegt
- [ ] Alle sechs GitHub Secrets gesetzt
- [ ] `saugy-solutions-config.php` eine Ebene über dem Webroot, Rechte `600`
- [ ] `ip_hash_secret` mit eigenem Zufallswert
- [ ] SMTP-Daten eingetragen und getestet
- [ ] `api/var/` beschreibbar
- [ ] `'mode' => 'production'`, `'debug' => false`

### Vor dem ersten Aufschalten

- [ ] `npm run deploy:build` ohne Fehler und ohne Platzhalterwarnung
- [ ] `npm run qa` und `npm run qa:browser` fehlerfrei
- [ ] Rechtstexte gegengelesen (Vorlagen, keine Rechtsberatung)
- [ ] Projektbeschreibungen bestätigt
- [ ] Einverständnis der Kundschaft für die Nennung als Referenz

### Funktionsprüfung

- [ ] Alle Seiten erreichbar, auch direkt aufgerufen
- [ ] Mobiles Menü öffnet, schliesst, per Tastatur bedienbar
- [ ] Formular absenden – E-Mail kommt an, „Antworten“ geht an die anfragende Person
- [ ] Erfundene Adresse zeigt die eigene 404-Seite
- [ ] Anmeldung unter `/admin/` funktioniert
- [ ] Teständerung im Adminbereich veröffentlichen → nach wenigen Minuten live
- [ ] `/api/lib/Config.php` direkt aufrufen → **403 Forbidden**
- [ ] `/api/config/config.php` direkt aufrufen → **403 Forbidden**

### Nach dem Aufschalten

- [ ] `robots.txt` und `sitemap-index.xml` erreichbar
- [ ] Sitemap in der Google Search Console eingereicht
- [ ] Vorschaubild geprüft (Link in einem Messenger teilen)
- [ ] Lighthouse-Prüfung (Ziel: Performance ≥ 90, übrige ≥ 95)
- [ ] Strukturierte Daten geprüft: <https://search.google.com/test/rich-results>
- [ ] Erstes Backup erstellt

---

## Lizenz und Urheberrecht

Inhalte, Gestaltung und Bildmarke gehören Saugy Solutions.
Manrope steht unter der SIL Open Font License (`public/fonts/manrope-OFL.txt`),
PHPMailer unter der LGPL-2.1, Decap CMS unter der MIT-Lizenz.

---

**Kontakt:** Manuel Saugy · <manu@saugy-solutions.ch> · +41 79 516 30 41
