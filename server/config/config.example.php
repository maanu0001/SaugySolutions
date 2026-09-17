<?php

/**
 * ============================================================================
 *  KONFIGURATION DES KONTAKTFORMULARS – VORLAGE
 * ============================================================================
 *
 *  ANLEITUNG
 *  ---------
 *  1. Diese Datei kopieren und in `config.php` umbenennen.
 *  2. Die Werte unten ausfüllen.
 *  3. `config.php` NIEMALS ins Git-Repository aufnehmen (steht in .gitignore).
 *
 *  ABLAGEORT (in dieser Reihenfolge wird gesucht)
 *  ----------------------------------------------
 *  1. Umgebungsvariablen des Servers (bevorzugt, siehe unten)
 *  2. EINE EBENE ÜBER DEM WEBROOT:      ../saugy-solutions-config.php
 *     -> empfohlen, weil die Datei dann gar nicht über das Web erreichbar ist
 *     -> bei Hostpoint: /home/<benutzer>/saugy-solutions-config.php
 *        (das Webroot ist dort der Ordner `www`)
 *  3. Innerhalb des Webroots:           /api/config/config.php
 *     -> nur verwenden, wenn (2) beim Hosting nicht möglich ist. Der Zugriff
 *        wird über die .htaccess im Ordner /api/config/ gesperrt.
 *
 *  ALTERNATIVE: UMGEBUNGSVARIABLEN
 *  -------------------------------
 *  Statt dieser Datei können alle Werte als Umgebungsvariablen gesetzt werden.
 *  Die Namen entsprechen den Schlüsseln in Grossbuchstaben mit dem Präfix
 *  SAUGY_, zum Beispiel:
 *
 *      SAUGY_SMTP_HOST=smtp.example.ch
 *      SAUGY_SMTP_USER=formular@saugy-solutions.ch
 *      SAUGY_SMTP_PASS=…
 *
 *  Umgebungsvariablen haben Vorrang vor den Werten in dieser Datei.
 * ============================================================================
 */

return [

    // -----------------------------------------------------------------------
    //  Betriebsmodus
    // -----------------------------------------------------------------------

    /**
     * 'production' – Nachrichten werden per SMTP wirklich versendet.
     * 'development' – es wird KEINE E-Mail versendet. Die Nachricht wird
     *                 stattdessen in den Ordner `mail_log_dir` geschrieben.
     *                 So lässt sich das Formular gefahrlos testen.
     */
    'mode' => 'production',

    /**
     * Ausführliche Fehlermeldungen in der Antwort.
     * Im Produktivbetrieb IMMER false – sonst gelangen technische Interna
     * zu den Besucherinnen und Besuchern.
     */
    'debug' => false,

    // -----------------------------------------------------------------------
    //  Empfänger und Absender
    // -----------------------------------------------------------------------

    /** Adresse, an die Anfragen zugestellt werden. */
    'recipient_email' => 'manu@saugy-solutions.ch',
    'recipient_name'  => 'Manuel Saugy',

    /**
     * Absenderadresse. MUSS eine Adresse der eigenen Domain sein, sonst
     * landen die Nachrichten mit hoher Wahrscheinlichkeit im Spam.
     * Auf keinen Fall die Adresse der anfragenden Person eintragen –
     * diese wird als Reply-To gesetzt.
     */
    'sender_email' => 'formular@saugy-solutions.ch',
    'sender_name'  => 'Saugy Solutions – Kontaktformular',

    // -----------------------------------------------------------------------
    //  SMTP-Zugang
    // -----------------------------------------------------------------------

    /**
     * true  = Versand über SMTP (empfohlen, zuverlässiger)
     * false = Versand über die PHP-Funktion mail() (nur als Notlösung)
     */
    'use_smtp'      => true,

    /**
     * Werte für Hostpoint (aktuelle Angaben im Control Panel unter
     * E-Mail -> Konto -> Servereinstellungen).
     */
    'smtp_host'     => 'asmtp.mail.hostpoint.ch',
    'smtp_port'     => 587,
    /** 'tls' für Port 587 (STARTTLS), 'ssl' für Port 465, '' für unverschlüsselt. */
    'smtp_security' => 'tls',
    'smtp_auth'     => true,
    /** Vollständige E-Mail-Adresse des Postfachs, nicht nur der Benutzername. */
    'smtp_user'     => 'formular@saugy-solutions.ch',
    'smtp_pass'     => '',

    // -----------------------------------------------------------------------
    //  Sicherheit
    // -----------------------------------------------------------------------

    /**
     * Erlaubte Absender-Hosts (Herkunftsprüfung gegen Origin/Referer).
     * Nur Anfragen von diesen Hosts werden angenommen.
     */
    'allowed_hosts' => [
        'saugy-solutions.ch',
        'www.saugy-solutions.ch',
    ],

    /**
     * Anfragen ohne Origin- und Referer-Kopfzeile zulassen.
     * true ist die sichere Standardeinstellung für ältere Browser und
     * Datenschutz-Erweiterungen, die den Referer entfernen.
     */
    'allow_missing_origin' => true,

    /** Höchstzahl an Anfragen pro IP-Adresse im unten definierten Zeitfenster. */
    'rate_limit_max'    => 5,
    /** Zeitfenster der Begrenzung in Sekunden (3600 = eine Stunde). */
    'rate_limit_window' => 3600,

    /**
     * Zufälliger, geheimer Wert. Wird verwendet, um IP-Adressen für die
     * Ratenbegrenzung zu verschlüsseln (die Adresse selbst wird nie
     * gespeichert). Einmal setzen und nicht mehr ändern.
     *
     * Erzeugen mit:  php -r "echo bin2hex(random_bytes(32));"
     */
    'ip_hash_secret' => 'BITTE-EIGENEN-ZUFALLSWERT-EINTRAGEN',

    /** Mindestzeit in Sekunden zwischen Seitenaufruf und Absenden. */
    'min_fill_seconds' => 3,
    /** Höchstalter des Formulars in Sekunden (43200 = 12 Stunden). */
    'max_form_age_seconds' => 43200,

    // -----------------------------------------------------------------------
    //  Ablageorte für Laufzeitdaten
    // -----------------------------------------------------------------------

    /**
     * Ordner für die Zähler der Ratenbegrenzung. Muss für PHP beschreibbar
     * sein. Wird automatisch erstellt, falls er fehlt.
     * Leer lassen für den Standard: <api>/var/
     */
    'storage_dir' => '',

    /**
     * Ordner für Testnachrichten im Entwicklungsmodus.
     * Leer lassen für den Standard: <api>/var/mail/
     */
    'mail_log_dir' => '',
];
