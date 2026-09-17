<?php

declare(strict_types=1);

/**
 * ============================================================================
 *  ANMELDEBRÜCKE FÜR DEN ADMINBEREICH (GitHub OAuth)
 * ============================================================================
 *
 *  Decap CMS spricht direkt mit der GitHub-Schnittstelle. Damit das ohne
 *  Geheimnisse im Browser funktioniert, braucht es einen kleinen
 *  serverseitigen Vermittler – genau das ist diese Datei.
 *
 *  ABLAUF
 *    1. Der Adminbereich öffnet ein Fenster auf  /api/auth.php?provider=github
 *    2. Diese Datei erzeugt einen Zufallswert (state), legt ihn in einem
 *       HttpOnly-Cookie ab und leitet zu GitHub weiter.
 *    3. GitHub fragt die Freigabe ab und ruft danach dieselbe Adresse mit
 *       ?code=…&state=… auf.
 *    4. Diese Datei prüft den state, tauscht den Code gegen ein Zugriffstoken,
 *       prüft die angemeldete Person gegen die Freigabeliste und übergibt das
 *       Token per postMessage an den Adminbereich.
 *
 *  SICHERHEIT
 *    - Das Client-Secret verlässt den Server nie.
 *    - Der state-Wert schützt vor untergeschobenen Anmeldungen (CSRF).
 *    - Das state-Cookie ist HttpOnly, Secure und SameSite=Lax.
 *      (Lax ist nötig, damit das Cookie die Rückleitung von GitHub übersteht.)
 *    - Nur ausdrücklich freigegebene GitHub-Konten erhalten ein Token.
 *    - Fehlversuche sind pro IP-Adresse begrenzt.
 *    - Das Token wird ausschliesslich an die eigene Herkunft übergeben.
 *
 *  KONFIGURATION
 *    siehe config/config.example.php – Abschnitt „Adminbereich“.
 * ============================================================================
 */

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require __DIR__ . '/lib/Config.php';
require __DIR__ . '/lib/RateLimiter.php';

use SaugySolutions\Config;
use SaugySolutions\RateLimiter;

$config = Config::load(__DIR__);

const STATE_COOKIE = 'saugy_oauth_state';
const STATE_MAX_AGE = 900; // 15 Minuten

// ---------------------------------------------------------------------------
//  Hilfsfunktionen
// ---------------------------------------------------------------------------

/** Ermittelt die eigene Herkunft (Schema + Host). */
function selfOrigin(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');

    return ($https ? 'https://' : 'http://') . $host;
}

/** Zeigt eine schlichte Fehlerseite ohne technische Interna. */
function fail(int $status, string $message): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, nofollow');

    $safe = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    echo <<<HTML
    <!doctype html>
    <html lang="de-CH"><head><meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <title>Anmeldung nicht möglich</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#080a0a;
           color:#f4f7f6;font-family:system-ui,sans-serif;padding:1.5rem;text-align:center}
      div{max-width:34rem;display:grid;gap:.7rem}
      strong{font-size:1.1rem;color:#ff6b67}
      span{font-size:.92rem;color:#a6b0ad;line-height:1.6}
      a{color:#24dfa8}
    </style></head>
    <body><div>
      <strong>Anmeldung nicht möglich</strong>
      <span>{$safe}</span>
      <span><a href="/admin/">Zurück zum Adminbereich</a></span>
    </div></body></html>
    HTML;

    exit;
}

/**
 * Übergibt das Ergebnis an den Adminbereich.
 *
 * Decap CMS wartet im öffnenden Fenster auf eine Nachricht. Der Ablauf ist
 * fest vorgegeben: Das Anmeldefenster meldet sich zuerst mit „authorizing“,
 * das Hauptfenster antwortet, und erst dann wird das Ergebnis übermittelt –
 * gezielt an die Herkunft der Antwort, nicht an beliebige Empfänger.
 */
function finish(string $status, array $payload): never
{
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, nofollow');

    $message = 'authorization:github:' . $status . ':' . json_encode(
        $payload,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
    );

    $json = json_encode($message, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $origin = json_encode(selfOrigin(), JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

    echo <<<HTML
    <!doctype html>
    <html lang="de-CH"><head><meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <title>Anmeldung abgeschlossen</title></head>
    <body>
    <p style="font-family:system-ui,sans-serif;padding:1.5rem;color:#333">
      Anmeldung abgeschlossen. Dieses Fenster kann geschlossen werden.
    </p>
    <script>
      (function () {
        var nachricht = {$json};
        var herkunft = {$origin};

        function senden(ziel) {
          window.opener.postMessage(nachricht, ziel);
        }

        if (!window.opener) { document.body.innerHTML = '<p>Bitte dieses Fenster schliessen.</p>'; return; }

        // Antwortet das Hauptfenster, wird das Ergebnis dorthin gesendet.
        window.addEventListener('message', function (event) {
          if (event.origin !== herkunft) return;
          senden(event.origin);
          window.close();
        }, false);

        // Handschlag: dem Hauptfenster mitteilen, dass die Anmeldung läuft.
        window.opener.postMessage('authorizing:github', herkunft);
      })();
    </script>
    </body></html>
    HTML;

    exit;
}

/** Führt eine HTTPS-Anfrage aus (cURL, sonst Stream-Kontext). */
function httpPost(string $url, array $data, array $headers = []): ?array
{
    $body = http_build_query($data);
    $defaultHeaders = array_merge([
        'Accept: application/json',
        'Content-Type: application/x-www-form-urlencoded',
        'User-Agent: saugy-solutions-admin',
    ], $headers);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $defaultHeaders,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
    } else {
        $response = @file_get_contents($url, false, stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $defaultHeaders),
                'content' => $body,
                'timeout' => 15,
                'ignore_errors' => true,
            ],
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
        ]));
    }

    if (!is_string($response) || $response === '') return null;

    $decoded = json_decode($response, true);

    return is_array($decoded) ? $decoded : null;
}

/** Ruft das GitHub-Profil zum Token ab. */
function githubUser(string $token): ?array
{
    $headers = [
        'Accept: application/vnd.github+json',
        'Authorization: Bearer ' . $token,
        'User-Agent: saugy-solutions-admin',
        'X-GitHub-Api-Version: 2022-11-28',
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init('https://api.github.com/user');
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
    } else {
        $response = @file_get_contents('https://api.github.com/user', false, stream_context_create([
            'http' => ['method' => 'GET', 'header' => implode("\r\n", $headers), 'timeout' => 15, 'ignore_errors' => true],
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
        ]));
    }

    if (!is_string($response) || $response === '') return null;

    $decoded = json_decode($response, true);

    return is_array($decoded) ? $decoded : null;
}

/** Setzt ein sicheres Cookie. */
function setStateCookie(string $value, int $maxAge): void
{
    setcookie(STATE_COOKIE, $value, [
        'expires' => $maxAge > 0 ? time() + $maxAge : 1,
        'path' => '/api/',
        'secure' => str_starts_with(selfOrigin(), 'https://'),
        'httponly' => true,
        // Lax statt Strict: Das Cookie muss die Rückleitung von GitHub überstehen.
        'samesite' => 'Lax',
    ]);
}

// ---------------------------------------------------------------------------
//  Vorprüfungen
// ---------------------------------------------------------------------------

$clientId = $config->string('github_client_id');
$clientSecret = $config->string('github_client_secret');

if ($clientId === '' || $clientSecret === '') {
    fail(503, 'Die Anmeldung ist auf diesem Server noch nicht eingerichtet. '
        . 'Es fehlen die Zugangsdaten der GitHub-OAuth-App.');
}

// Begrenzung der Anmeldeversuche pro IP-Adresse.
$limiter = new RateLimiter(
    $config->string('storage_dir') . '/auth',
    $config->int('admin_rate_limit_max'),
    $config->int('admin_rate_limit_window'),
    $config->string('ip_hash_secret')
);

if (random_int(1, 20) === 1) {
    $limiter->cleanup();
}

if (!$limiter->allow((string) ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt'))) {
    fail(429, 'Es wurden zu viele Anmeldeversuche unternommen. '
        . 'Bitte versuchen Sie es in einer Stunde noch einmal.');
}

$code = (string) ($_GET['code'] ?? '');

// ---------------------------------------------------------------------------
//  Schritt 1 – Anmeldung starten
// ---------------------------------------------------------------------------

if ($code === '') {
    $state = bin2hex(random_bytes(32));
    setStateCookie($state, STATE_MAX_AGE);

    $target = 'https://github.com/login/oauth/authorize?' . http_build_query([
        'client_id' => $clientId,
        // `repo` wird benötigt, damit das CMS Inhalte schreiben kann.
        'scope' => 'repo,user:email',
        'state' => $state,
        'redirect_uri' => selfOrigin() . '/api/auth.php',
        'allow_signup' => 'false',
    ]);

    http_response_code(302);
    header('Location: ' . $target);
    header('Cache-Control: no-store');
    exit;
}

// ---------------------------------------------------------------------------
//  Schritt 2 – Rückmeldung von GitHub
// ---------------------------------------------------------------------------

// Meldet GitHub einen Fehler (z. B. abgelehnte Freigabe), sauber anzeigen.
if (isset($_GET['error'])) {
    setStateCookie('', 0);
    fail(400, 'Die Freigabe wurde abgebrochen oder von GitHub abgelehnt.');
}

$state = (string) ($_GET['state'] ?? '');
$expected = (string) ($_COOKIE[STATE_COOKIE] ?? '');

// state-Cookie in jedem Fall entwerten – es ist nur einmal gültig.
setStateCookie('', 0);

if ($state === '' || $expected === '' || !hash_equals($expected, $state)) {
    fail(400, 'Die Anmeldung konnte nicht überprüft werden. '
        . 'Bitte starten Sie sie im Adminbereich erneut.');
}

$tokenResponse = httpPost('https://github.com/login/oauth/access_token', [
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'code' => $code,
    'redirect_uri' => selfOrigin() . '/api/auth.php',
]);

$token = is_array($tokenResponse) ? (string) ($tokenResponse['access_token'] ?? '') : '';

if ($token === '') {
    error_log('[saugy-admin] Token-Austausch fehlgeschlagen.');
    fail(502, 'Die Anmeldung bei GitHub ist fehlgeschlagen. Bitte versuchen Sie es erneut.');
}

// --- Freigabeliste prüfen ---------------------------------------------------
$user = githubUser($token);
$login = is_array($user) ? (string) ($user['login'] ?? '') : '';

if ($login === '') {
    error_log('[saugy-admin] GitHub-Profil konnte nicht gelesen werden.');
    fail(502, 'Das GitHub-Profil konnte nicht gelesen werden. Bitte versuchen Sie es erneut.');
}

$allowed = array_map('strtolower', $config->list('github_allowed_users'));

if ($allowed === []) {
    error_log('[saugy-admin] Keine Freigabeliste konfiguriert – Anmeldung abgelehnt.');
    fail(503, 'Für den Adminbereich ist noch keine Person freigegeben. '
        . 'Bitte tragen Sie das GitHub-Konto in der Konfiguration ein.');
}

if (!in_array(strtolower($login), $allowed, true)) {
    error_log('[saugy-admin] Nicht freigegebenes Konto abgewiesen: ' . $login);
    finish('error', [
        'message' => 'Dieses GitHub-Konto ist für den Adminbereich nicht freigegeben.',
    ]);
}

// --- Erfolg ------------------------------------------------------------------
finish('success', ['token' => $token, 'provider' => 'github']);
