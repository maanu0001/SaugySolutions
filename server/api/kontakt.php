<?php

declare(strict_types=1);

/**
 * ============================================================================
 *  KONTAKTFORMULAR – ENDPUNKT
 * ============================================================================
 *
 *  Der einzige serverseitige Bestandteil dieser Website. Alles Übrige sind
 *  statische Dateien. Benötigt PHP 8.1 oder neuer.
 *
 *  ABLAUF
 *    1. Methode prüfen (nur POST)
 *    2. Herkunft prüfen (Origin/Referer)
 *    3. Bot-Schutz: Honeypot und Ausfülldauer
 *    4. Ratenbegrenzung pro IP-Adresse
 *    5. Serverseitige Validierung
 *    6. Versand per SMTP (oder Ablage als Datei im Entwicklungsmodus)
 *    7. Antwort als JSON (mit JavaScript) oder Weiterleitung (ohne JavaScript)
 *
 *  KONFIGURATION
 *    siehe config/config.example.php – Zugangsdaten stehen NICHT in dieser
 *    Datei und nicht im Repository.
 *
 *  PROTOKOLLIERUNG
 *    Es werden keine Formularinhalte in Logdateien geschrieben. Im Fehlerfall
 *    wird lediglich vermerkt, DASS der Versand fehlgeschlagen ist.
 * ============================================================================
 */

// Technische Fehler nie an Besuchende ausgeben.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require __DIR__ . '/lib/Config.php';
require __DIR__ . '/lib/Validator.php';
require __DIR__ . '/lib/RateLimiter.php';
require __DIR__ . '/lib/Mailer.php';
require __DIR__ . '/vendor/autoload.php';

use SaugySolutions\Config;
use SaugySolutions\Mailer;
use SaugySolutions\RateLimiter;
use SaugySolutions\Validator;

$config = Config::load(__DIR__);

/** Erkennt, ob die Anfrage per JavaScript (fetch) gestellt wurde. */
function wantsJson(): bool
{
    $accept = (string) ($_SERVER['HTTP_ACCEPT'] ?? '');
    $requestedWith = (string) ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '');

    return str_contains($accept, 'application/json') || strtolower($requestedWith) === 'xmlhttprequest';
}

/**
 * Prüft, ob ein Weiterleitungsziel sicher ist.
 * Nur seiteninterne Pfade sind zulässig – so lässt sich der Endpunkt nicht
 * als offene Weiterleitung missbrauchen.
 */
function safeRedirect(mixed $target, string $fallback): string
{
    if (!is_string($target) || $target === '') {
        return $fallback;
    }

    // Muss mit genau einem Schrägstrich beginnen (kein "//host" und kein "http://").
    if (!preg_match('#^/(?!/)[A-Za-z0-9._~!$&\'()*+,;=:@%/?-]*$#', $target)) {
        return $fallback;
    }

    return $target;
}

/**
 * Beendet die Verarbeitung mit einer Antwort.
 *
 * Mit JavaScript: JSON und passender HTTP-Status.
 * Ohne JavaScript: Weiterleitung auf die Danke- bzw. Fehlerseite.
 *
 * @param array<string, string> $fieldErrors
 */
function respond(int $status, bool $ok, string $message, array $fieldErrors = []): never
{
    if (wantsJson()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');

        $payload = ['ok' => $ok, 'message' => $message];
        if ($fieldErrors !== []) {
            $payload['errors'] = $fieldErrors;
        }

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $target = $ok
        ? safeRedirect($_POST['redirect_success'] ?? null, '/danke/')
        : safeRedirect($_POST['redirect_error'] ?? null, '/kontakt/?status=fehler#kontaktformular');

    http_response_code(303);
    header('Location: ' . $target);
    exit;
}

// ---------------------------------------------------------------------------
//  1. Methode
// ---------------------------------------------------------------------------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    // Hier bewusst keine Weiterleitung: Ein GET ist keine Formularsendung,
    // deshalb wird in jedem Fall der korrekte Status zurückgegeben.
    http_response_code(405);
    header('Allow: POST');
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(
        ['ok' => false, 'message' => 'Dieser Endpunkt nimmt ausschliesslich Formularsendungen entgegen.'],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

// ---------------------------------------------------------------------------
//  2. Herkunftsprüfung (CSRF-Schutz, soweit statisch umsetzbar)
// ---------------------------------------------------------------------------
//  Eine statische Website kann kein serverseitig erzeugtes Token in das
//  Formular einbetten. Stattdessen wird geprüft, ob die Anfrage von der
//  eigenen Domain stammt.

$allowedHosts = array_map('strtolower', $config->list('allowed_hosts'));

// Der eigene Host ist immer zulässig – damit funktioniert auch eine
// Testumgebung ohne zusätzliche Konfiguration.
$ownHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
if ($ownHost !== '') {
    $allowedHosts[] = preg_replace('/:\d+$/', '', $ownHost) ?? $ownHost;
}

$originHeader = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$refererHeader = (string) ($_SERVER['HTTP_REFERER'] ?? '');
$sourceUrl = $originHeader !== '' ? $originHeader : $refererHeader;

if ($sourceUrl === '') {
    // Manche Browser und Datenschutz-Erweiterungen senden keinen Referer.
    if (!$config->bool('allow_missing_origin')) {
        respond(403, false, 'Die Herkunft der Anfrage konnte nicht überprüft werden.');
    }
} else {
    $sourceHost = strtolower((string) (parse_url($sourceUrl, PHP_URL_HOST) ?? ''));

    if ($sourceHost === '' || !in_array($sourceHost, $allowedHosts, true)) {
        respond(403, false, 'Diese Anfrage stammt nicht von der Website von Saugy Solutions.');
    }
}

// ---------------------------------------------------------------------------
//  3. Bot-Schutz
// ---------------------------------------------------------------------------

// 3a) Honeypot: Das Feld ist für Menschen unsichtbar. Ist es ausgefüllt,
//     handelt es sich um ein automatisiertes Skript.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    // Bewusst als Erfolg antworten: Das Skript erhält keinen Hinweis darauf,
    // dass die Nachricht verworfen wurde.
    respond(200, true, 'Vielen Dank für Ihre Anfrage.');
}

// 3b) Ausfülldauer: Menschen brauchen ein paar Sekunden. Der Zeitstempel wird
//     beim Laden der Seite per JavaScript gesetzt. Ohne JavaScript ist das
//     Feld leer – dann wird diese Prüfung übersprungen.
$loadedAt = (string) ($_POST['loaded_at'] ?? '');

if ($loadedAt !== '' && ctype_digit($loadedAt)) {
    // Der Wert stammt aus Date.now() und ist in Millisekunden.
    $elapsed = time() - (int) ((int) $loadedAt / 1000);

    if ($elapsed < $config->int('min_fill_seconds')) {
        respond(429, false, 'Das ging uns etwas zu schnell. Bitte senden Sie die Anfrage noch einmal.');
    }

    if ($elapsed > $config->int('max_form_age_seconds')) {
        respond(
            419,
            false,
            'Das Formular war zu lange geöffnet. Bitte laden Sie die Seite neu und senden Sie die Anfrage erneut.'
        );
    }
}

// ---------------------------------------------------------------------------
//  4. Ratenbegrenzung
// ---------------------------------------------------------------------------

$ipAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt');

$limiter = new RateLimiter(
    $config->string('storage_dir'),
    $config->int('rate_limit_max'),
    $config->int('rate_limit_window'),
    $config->string('ip_hash_secret')
);

// Gelegentlich aufräumen, damit der Ordner nicht unbegrenzt wächst.
if (random_int(1, 50) === 1) {
    $limiter->cleanup();
}

if (!$limiter->allow($ipAddress)) {
    respond(
        429,
        false,
        'Es wurden bereits mehrere Anfragen von diesem Anschluss gesendet. Bitte versuchen Sie es später noch einmal oder melden Sie sich direkt per E-Mail.'
    );
}

// ---------------------------------------------------------------------------
//  5. Validierung
// ---------------------------------------------------------------------------

$validator = new Validator();

if (!$validator->validate($_POST)) {
    respond(
        422,
        false,
        'Bitte prüfen Sie die markierten Felder.',
        $validator->errors()
    );
}

// ---------------------------------------------------------------------------
//  6. Versand
// ---------------------------------------------------------------------------

$mailer = new Mailer($config);
$result = $mailer->send($validator->data());

if (!$result['ok']) {
    // Nur den Umstand protokollieren, keine Formularinhalte.
    error_log('[saugy-kontaktformular] Versand fehlgeschlagen: ' . ($result['error'] ?? 'unbekannt'));

    $message = $config->bool('debug') && isset($result['error'])
        ? 'Versand fehlgeschlagen: ' . $result['error']
        : 'Die Anfrage konnte im Moment nicht zugestellt werden. Bitte versuchen Sie es später noch einmal.';

    respond(502, false, $message);
}

// ---------------------------------------------------------------------------
//  7. Erfolg
// ---------------------------------------------------------------------------

respond(200, true, 'Vielen Dank für Ihre Anfrage. Wir melden uns persönlich bei Ihnen.');
