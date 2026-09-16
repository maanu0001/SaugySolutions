<?php

declare(strict_types=1);

namespace SaugySolutions;

/**
 * Einfache, dateibasierte Begrenzung der Anfragen pro IP-Adresse.
 *
 * Datenschutz: Die IP-Adresse selbst wird NIE gespeichert. Gespeichert wird
 * nur ein mit einem geheimen Schlüssel gebildeter Hash. Ein Rückschluss auf
 * die Adresse ist daraus praktisch nicht möglich.
 *
 * Bewusst ohne Datenbank, damit der Endpunkt auf gewöhnlichem Shared Hosting
 * ohne zusätzliche Dienste funktioniert.
 */
final class RateLimiter
{
    private string $directory;
    private int $maxRequests;
    private int $windowSeconds;
    private string $secret;

    public function __construct(string $directory, int $maxRequests, int $windowSeconds, string $secret)
    {
        $this->directory = rtrim($directory, '/');
        $this->maxRequests = max(1, $maxRequests);
        $this->windowSeconds = max(60, $windowSeconds);
        $this->secret = $secret;
    }

    /**
     * Prüft, ob eine weitere Anfrage zulässig ist, und zählt sie mit.
     *
     * Bei einem Dateisystemfehler wird die Anfrage NICHT blockiert – eine
     * kaputte Ratenbegrenzung darf das Formular nicht unbrauchbar machen.
     */
    public function allow(string $ipAddress): bool
    {
        if (!$this->ensureDirectory()) {
            return true;
        }

        $file = $this->directory . '/rl_' . $this->hash($ipAddress) . '.json';
        $now = time();

        $handle = @fopen($file, 'c+');
        if ($handle === false) {
            return true;
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                return true;
            }

            $contents = stream_get_contents($handle);
            /** @var array{count?: int, start?: int} $state */
            $state = is_string($contents) && $contents !== ''
                ? (json_decode($contents, true) ?: [])
                : [];

            $start = (int) ($state['start'] ?? 0);
            $count = (int) ($state['count'] ?? 0);

            // Zeitfenster abgelaufen -> neu beginnen.
            if ($start === 0 || ($now - $start) > $this->windowSeconds) {
                $start = $now;
                $count = 0;
            }

            $count++;
            $allowed = $count <= $this->maxRequests;

            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, json_encode(['start' => $start, 'count' => $count], JSON_THROW_ON_ERROR));
            fflush($handle);
            flock($handle, LOCK_UN);

            return $allowed;
        } catch (\Throwable) {
            return true;
        } finally {
            fclose($handle);
        }
    }

    /**
     * Entfernt abgelaufene Zählerdateien.
     * Wird nur gelegentlich aufgerufen, damit der Ordner nicht wächst.
     */
    public function cleanup(): void
    {
        if (!is_dir($this->directory)) {
            return;
        }

        $files = glob($this->directory . '/rl_*.json');
        if ($files === false) {
            return;
        }

        $threshold = time() - ($this->windowSeconds * 2);

        foreach ($files as $file) {
            $modified = @filemtime($file);
            if ($modified !== false && $modified < $threshold) {
                @unlink($file);
            }
        }
    }

    /** Bildet den Hash der IP-Adresse. */
    private function hash(string $ipAddress): string
    {
        $secret = $this->secret !== ''
            ? $this->secret
            // Notfallschlüssel, falls in der Konfiguration keiner gesetzt wurde.
            : (string) ($_SERVER['SERVER_NAME'] ?? 'saugy-solutions');

        return substr(hash_hmac('sha256', $ipAddress, $secret), 0, 32);
    }

    /** Stellt sicher, dass der Ablageordner existiert und geschützt ist. */
    private function ensureDirectory(): bool
    {
        if (is_dir($this->directory)) {
            return is_writable($this->directory);
        }

        if (!@mkdir($this->directory, 0750, true) && !is_dir($this->directory)) {
            return false;
        }

        // Zugriff über das Web sperren, falls der Ordner im Webroot liegt.
        $htaccess = $this->directory . '/.htaccess';
        if (!is_file($htaccess)) {
            @file_put_contents(
                $htaccess,
                "# Laufzeitdaten – kein Zugriff über das Web.\n"
                . "<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n"
                . "<IfModule !mod_authz_core.c>\n    Deny from all\n</IfModule>\n"
            );
        }

        return is_writable($this->directory);
    }
}
