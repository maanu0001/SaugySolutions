<?php

declare(strict_types=1);

namespace SaugySolutions;

/**
 * Serverseitige Prüfung und Bereinigung der Formulardaten.
 *
 * Diese Prüfung ist die verbindliche: Die Prüfung im Browser dient nur der
 * schnellen Rückmeldung und kann umgangen werden.
 */
final class Validator
{
    /**
     * Zulässige Werte der Auswahlfelder.
     * MUSS mit src/data/form.mjs übereinstimmen.
     */
    public const ALLOWED_TOPICS = [
        'Neue Website',
        'Bestehende Website überarbeiten',
        'Hosting und Wartung',
        'E-Mail-Lösung',
        'Nextcloud',
        'Individuelle digitale Lösung',
        'Allgemeine Frage',
    ];

    public const ALLOWED_START = [
        'So bald wie möglich',
        'In den nächsten 1–3 Monaten',
        'In 3–6 Monaten',
        'Später / noch offen',
    ];

    public const ALLOWED_BUDGET = [
        'Noch offen',
        'Bis 2 000 CHF',
        '2 000 – 5 000 CHF',
        '5 000 – 10 000 CHF',
        'Über 10 000 CHF',
        'Möchte ich im Gespräch klären',
    ];

    /** Maximale Feldlängen. */
    private const MAX_LENGTHS = [
        'name' => 120,
        'email' => 180,
        'phone' => 40,
        'company' => 140,
        'message' => 4000,
    ];

    /** @var array<string, string> Fehlermeldungen je Feldname */
    private array $errors = [];

    /** @var array<string, string> Bereinigte Werte */
    private array $clean = [];

    /**
     * Prüft die übermittelten Daten.
     *
     * @param array<string, mixed> $input
     */
    public function validate(array $input): bool
    {
        $this->errors = [];
        $this->clean = [];

        // --- Pflichtfeld: Name ---------------------------------------------
        $name = $this->text($input['name'] ?? '', self::MAX_LENGTHS['name']);
        if (mb_strlen($name) < 2) {
            $this->errors['name'] = 'Bitte geben Sie Ihren Vor- und Nachnamen an.';
        }
        $this->clean['name'] = $name;

        // --- Pflichtfeld: E-Mail -------------------------------------------
        $email = $this->text($input['email'] ?? '', self::MAX_LENGTHS['email']);
        if ($email === '') {
            $this->errors['email'] = 'Bitte geben Sie Ihre E-Mail-Adresse an.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->errors['email'] = 'Diese E-Mail-Adresse ist nicht gültig. Bitte prüfen Sie die Schreibweise.';
        }
        $this->clean['email'] = $email;

        // --- Optional: Telefon ----------------------------------------------
        $phone = $this->text($input['phone'] ?? '', self::MAX_LENGTHS['phone']);
        if ($phone !== '' && preg_match('/^[0-9+().\/\s-]{6,40}$/', $phone) !== 1) {
            $this->errors['phone'] = 'Bitte geben Sie eine gültige Telefonnummer an – oder lassen Sie das Feld leer.';
        }
        $this->clean['phone'] = $phone;

        // --- Optional: Unternehmen ------------------------------------------
        $this->clean['company'] = $this->text($input['company'] ?? '', self::MAX_LENGTHS['company']);

        // --- Pflichtfeld: Art der Anfrage ------------------------------------
        $topic = $this->text($input['topic'] ?? '', 80);
        if (!in_array($topic, self::ALLOWED_TOPICS, true)) {
            $this->errors['topic'] = 'Bitte wählen Sie aus, worum es geht.';
            $topic = '';
        }
        $this->clean['topic'] = $topic;

        // --- Optional: Start und Budget ---------------------------------------
        // Unzulässige Werte werden verworfen statt bemängelt: Beide Felder sind
        // freiwillig, ein Fehler wäre hier nicht hilfreich.
        $start = $this->text($input['start'] ?? '', 80);
        $this->clean['start'] = in_array($start, self::ALLOWED_START, true) ? $start : '';

        $budget = $this->text($input['budget'] ?? '', 80);
        $this->clean['budget'] = in_array($budget, self::ALLOWED_BUDGET, true) ? $budget : '';

        // --- Pflichtfeld: Nachricht --------------------------------------------
        $message = $this->multiline($input['message'] ?? '', self::MAX_LENGTHS['message']);
        if (mb_strlen($message) < 10) {
            $this->errors['message'] = 'Bitte beschreiben Sie Ihr Anliegen kurz – ein bis zwei Sätze genügen.';
        }
        $this->clean['message'] = $message;

        // --- Pflichtfeld: Datenschutz -------------------------------------------
        $privacy = $this->text($input['privacy'] ?? '', 10);
        if ($privacy === '') {
            $this->errors['privacy'] = 'Bitte stimmen Sie der Verwendung Ihrer Angaben zu.';
        }

        return $this->errors === [];
    }

    /**
     * Bereinigt einen einzeiligen Wert.
     *
     * Entfernt Steuerzeichen inklusive Zeilenumbrüchen. Das verhindert das
     * Einschleusen zusätzlicher E-Mail-Kopfzeilen (Header Injection), denn
     * Kopfzeilen werden durch Zeilenumbrüche getrennt.
     */
    private function text(mixed $value, int $maxLength): string
    {
        if (!is_string($value)) {
            return '';
        }

        // Nur gültiges UTF-8 übernehmen.
        if (!mb_check_encoding($value, 'UTF-8')) {
            $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
        }

        // Alle Steuerzeichen entfernen (inkl. \r und \n).
        $value = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $value) ?? '';
        $value = preg_replace('/\s+/u', ' ', $value) ?? '';

        return mb_substr(trim($value), 0, $maxLength);
    }

    /**
     * Bereinigt einen mehrzeiligen Wert.
     * Zeilenumbrüche bleiben erhalten, andere Steuerzeichen werden entfernt.
     */
    private function multiline(mixed $value, int $maxLength): string
    {
        if (!is_string($value)) {
            return '';
        }

        if (!mb_check_encoding($value, 'UTF-8')) {
            $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
        }

        $value = str_replace(["\r\n", "\r"], "\n", $value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
        // Höchstens zwei aufeinanderfolgende Leerzeilen.
        $value = preg_replace('/\n{3,}/u', "\n\n", $value) ?? '';

        return mb_substr(trim($value), 0, $maxLength);
    }

    /** @return array<string, string> */
    public function errors(): array
    {
        return $this->errors;
    }

    /** @return array<string, string> */
    public function data(): array
    {
        return $this->clean;
    }
}
