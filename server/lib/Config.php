<?php

declare(strict_types=1);

namespace SaugySolutions;

/**
 * Lädt die Konfiguration des Kontaktformulars.
 *
 * Reihenfolge der Quellen (spätere überschreiben frühere):
 *   1. eingebaute Standardwerte
 *   2. Konfigurationsdatei (ausserhalb des Webroots bevorzugt)
 *   3. Umgebungsvariablen mit dem Präfix SAUGY_
 *
 * Es sind bewusst keine Zugangsdaten im Quellcode hinterlegt.
 */
final class Config
{
    /** @var array<string, mixed> */
    private array $values;

    /** @param array<string, mixed> $values */
    private function __construct(array $values)
    {
        $this->values = $values;
    }

    /**
     * Baut die Konfiguration zusammen.
     *
     * @param string $apiDir Verzeichnis, in dem kontakt.php liegt.
     */
    public static function load(string $apiDir): self
    {
        $values = self::defaults($apiDir);

        $file = self::locateConfigFile($apiDir);
        if ($file !== null) {
            /** @var mixed $fromFile */
            $fromFile = require $file;
            if (is_array($fromFile)) {
                $values = array_merge($values, $fromFile);
            }
        }

        $values = array_merge($values, self::fromEnvironment());

        // Ablageorte auflösen, falls sie leer gelassen wurden.
        if (empty($values['storage_dir'])) {
            $values['storage_dir'] = $apiDir . '/var';
        }
        if (empty($values['mail_log_dir'])) {
            $values['mail_log_dir'] = rtrim((string) $values['storage_dir'], '/') . '/mail';
        }

        return new self($values);
    }

    /**
     * Sucht die Konfigurationsdatei.
     * Ausserhalb des Webroots hat Vorrang, weil sie dort nicht über das Web
     * erreichbar ist.
     */
    private static function locateConfigFile(string $apiDir): ?string
    {
        $candidates = [
            // Zwei Ebenen über /api/ – also eine Ebene über dem Webroot.
            dirname($apiDir, 2) . '/saugy-solutions-config.php',
            dirname($apiDir) . '/saugy-solutions-config.php',
            $apiDir . '/config/config.php',
        ];

        foreach ($candidates as $candidate) {
            if (is_file($candidate) && is_readable($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    /**
     * Liest Werte aus Umgebungsvariablen (SAUGY_SMTP_HOST, SAUGY_MODE, …).
     *
     * @return array<string, mixed>
     */
    private static function fromEnvironment(): array
    {
        $keys = [
            'mode', 'debug', 'recipient_email', 'recipient_name', 'sender_email', 'sender_name',
            'use_smtp', 'smtp_host', 'smtp_port', 'smtp_security', 'smtp_auth', 'smtp_user',
            'smtp_pass', 'allowed_hosts', 'allow_missing_origin', 'rate_limit_max',
            'rate_limit_window', 'ip_hash_secret', 'min_fill_seconds', 'max_form_age_seconds',
            'storage_dir', 'mail_log_dir',
        ];

        $result = [];

        foreach ($keys as $key) {
            $raw = getenv('SAUGY_' . strtoupper($key));
            if ($raw === false || $raw === '') {
                continue;
            }

            $result[$key] = match ($key) {
                'debug', 'use_smtp', 'smtp_auth', 'allow_missing_origin'
                    => filter_var($raw, FILTER_VALIDATE_BOOLEAN),
                'smtp_port', 'rate_limit_max', 'rate_limit_window', 'min_fill_seconds', 'max_form_age_seconds'
                    => (int) $raw,
                // Mehrere Hosts durch Komma getrennt angeben.
                'allowed_hosts'
                    => array_values(array_filter(array_map('trim', explode(',', $raw)))),
                default => $raw,
            };
        }

        return $result;
    }

    /** @return array<string, mixed> */
    private static function defaults(string $apiDir): array
    {
        return [
            'mode' => 'production',
            'debug' => false,
            'recipient_email' => 'manu@saugy-solutions.ch',
            'recipient_name' => 'Manuel Saugy',
            'sender_email' => 'formular@saugy-solutions.ch',
            'sender_name' => 'Saugy Solutions – Kontaktformular',
            'use_smtp' => true,
            'smtp_host' => '',
            'smtp_port' => 587,
            'smtp_security' => 'tls',
            'smtp_auth' => true,
            'smtp_user' => '',
            'smtp_pass' => '',
            'allowed_hosts' => ['saugy-solutions.ch', 'www.saugy-solutions.ch'],
            'allow_missing_origin' => true,
            'rate_limit_max' => 5,
            'rate_limit_window' => 3600,
            'ip_hash_secret' => '',
            'min_fill_seconds' => 3,
            'max_form_age_seconds' => 43200,
            'storage_dir' => $apiDir . '/var',
            'mail_log_dir' => '',
        ];
    }

    public function get(string $key, mixed $fallback = null): mixed
    {
        return $this->values[$key] ?? $fallback;
    }

    public function string(string $key): string
    {
        return (string) ($this->values[$key] ?? '');
    }

    public function int(string $key): int
    {
        return (int) ($this->values[$key] ?? 0);
    }

    public function bool(string $key): bool
    {
        return (bool) ($this->values[$key] ?? false);
    }

    /** @return string[] */
    public function list(string $key): array
    {
        $value = $this->values[$key] ?? [];

        return is_array($value) ? array_values(array_map('strval', $value)) : [];
    }

    public function isDevelopment(): bool
    {
        return $this->string('mode') === 'development';
    }
}
