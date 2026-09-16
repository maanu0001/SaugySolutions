<?php

declare(strict_types=1);

namespace SaugySolutions;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/**
 * Baut die Anfrage-E-Mail und versendet sie.
 *
 * Im Entwicklungsmodus wird KEINE E-Mail versendet; die Nachricht wird
 * stattdessen als Datei abgelegt. So lässt sich das Formular gefahrlos testen.
 */
final class Mailer
{
    private Config $config;

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    /**
     * Versendet die Anfrage.
     *
     * @param array<string, string> $data Bereinigte Formulardaten
     * @return array{ok: bool, error?: string}
     */
    public function send(array $data): array
    {
        $subject = $this->buildSubject($data);
        $plain = $this->buildPlainText($data);
        $html = $this->buildHtml($data);

        if ($this->config->isDevelopment()) {
            return $this->writeToFile($subject, $plain, $html, $data);
        }

        try {
            $mail = new PHPMailer(true);
            $mail->CharSet = PHPMailer::CHARSET_UTF8;
            $mail->Encoding = PHPMailer::ENCODING_QUOTED_PRINTABLE;
            $mail->setLanguage('de');

            if ($this->config->bool('use_smtp')) {
                $mail->isSMTP();
                $mail->Host = $this->config->string('smtp_host');
                $mail->Port = $this->config->int('smtp_port');
                $mail->SMTPAuth = $this->config->bool('smtp_auth');
                $mail->Username = $this->config->string('smtp_user');
                $mail->Password = $this->config->string('smtp_pass');

                $security = $this->config->string('smtp_security');
                if ($security === 'tls') {
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                } elseif ($security === 'ssl') {
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                } else {
                    $mail->SMTPSecure = '';
                    $mail->SMTPAutoTLS = false;
                }

                $mail->Timeout = 15;
            } else {
                $mail->isMail();
            }

            // Absender IMMER auf die eigene Domain setzen. Die Adresse der
            // anfragenden Person kommt in Reply-To – sonst wird die Nachricht
            // als Fälschung eingestuft und landet im Spam.
            $mail->setFrom(
                $this->config->string('sender_email'),
                $this->config->string('sender_name')
            );
            $mail->addAddress(
                $this->config->string('recipient_email'),
                $this->config->string('recipient_name')
            );

            if ($data['email'] !== '') {
                $mail->addReplyTo($data['email'], $data['name'] !== '' ? $data['name'] : $data['email']);
            }

            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body = $html;
            $mail->AltBody = $plain;

            $mail->send();

            return ['ok' => true];
        } catch (PHPMailerException $exception) {
            // Technische Details bleiben serverseitig; nach aussen geht nur
            // eine allgemeine Meldung (siehe kontakt.php).
            return ['ok' => false, 'error' => $exception->getMessage()];
        } catch (\Throwable $exception) {
            return ['ok' => false, 'error' => $exception->getMessage()];
        }
    }

    /** Betreffzeile mit Art der Anfrage und Name. */
    private function buildSubject(array $data): string
    {
        $topic = $data['topic'] !== '' ? $data['topic'] : 'Anfrage';
        $name = $data['name'] !== '' ? $data['name'] : 'unbekannt';

        return sprintf('Neue Anfrage: %s – %s', $topic, $name);
    }

    /**
     * Felder in der Reihenfolge, in der sie in der E-Mail erscheinen.
     *
     * @return array<int, array{0: string, 1: string}>
     */
    private function fields(array $data): array
    {
        $fields = [
            ['Name', $data['name']],
            ['E-Mail', $data['email']],
        ];

        if ($data['phone'] !== '') {
            $fields[] = ['Telefon', $data['phone']];
        }
        if ($data['company'] !== '') {
            $fields[] = ['Unternehmen', $data['company']];
        }

        $fields[] = ['Art der Anfrage', $data['topic']];
        $fields[] = ['Gewünschte Leistung', $data['service']];

        if ($data['start'] !== '') {
            $fields[] = ['Gewünschter Start', $data['start']];
        }
        if ($data['budget'] !== '') {
            $fields[] = ['Budgetrahmen', $data['budget']];
        }

        return $fields;
    }

    /** Reine Textfassung – für E-Mail-Programme ohne HTML-Darstellung. */
    private function buildPlainText(array $data): string
    {
        $lines = ['NEUE ANFRAGE ÜBER DAS KONTAKTFORMULAR', str_repeat('=', 40), ''];

        foreach ($this->fields($data) as [$label, $value]) {
            $lines[] = $label . ': ' . $value;
        }

        $lines[] = '';
        $lines[] = 'PROJEKTBESCHREIBUNG';
        $lines[] = str_repeat('-', 40);
        $lines[] = $data['message'];
        $lines[] = '';
        $lines[] = str_repeat('=', 40);
        $lines[] = 'Eingegangen am ' . date('d.m.Y \u\m H:i') . ' Uhr';
        $lines[] = 'Antworten Sie direkt auf diese E-Mail – sie geht an ' . $data['email'] . '.';

        return implode("\n", $lines);
    }

    /** HTML-Fassung der Nachricht. */
    private function buildHtml(array $data): string
    {
        $rows = '';
        foreach ($this->fields($data) as [$label, $value]) {
            $safeLabel = $this->escape($label);
            $safeValue = $this->escape($value);

            // E-Mail-Adresse als Link ausgeben.
            if ($label === 'E-Mail') {
                $safeValue = '<a href="mailto:' . $safeValue . '" style="color:#0a7f63;">' . $safeValue . '</a>';
            } elseif ($label === 'Telefon') {
                $tel = preg_replace('/[^0-9+]/', '', $value) ?? '';
                $safeValue = '<a href="tel:' . $this->escape($tel) . '" style="color:#0a7f63;">' . $safeValue . '</a>';
            }

            $rows .= '<tr>'
                . '<th align="left" style="padding:8px 16px 8px 0;vertical-align:top;'
                . 'font:600 13px/1.5 Arial,sans-serif;color:#5b6b67;white-space:nowrap;">'
                . $safeLabel . '</th>'
                . '<td style="padding:8px 0;font:400 14px/1.5 Arial,sans-serif;color:#10201c;">'
                . $safeValue . '</td>'
                . '</tr>';
        }

        $message = nl2br($this->escape($data['message']));
        $received = $this->escape(date('d.m.Y \u\m H:i'));

        return <<<HTML
<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>Neue Anfrage</title></head>
<body style="margin:0;padding:24px;background:#f4f7f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e0e7e5;border-radius:10px;">
    <tr>
      <td style="padding:22px 28px;background:#06110f;border-radius:10px 10px 0 0;">
        <p style="margin:0;font:700 17px/1.3 Arial,sans-serif;color:#24e6b2;">Neue Anfrage über das Kontaktformular</p>
        <p style="margin:6px 0 0;font:400 13px/1.4 Arial,sans-serif;color:#a6bbb5;">saugy-solutions.ch</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">{$rows}</table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;">
        <p style="margin:0 0 8px;font:700 13px/1.5 Arial,sans-serif;color:#5b6b67;text-transform:uppercase;letter-spacing:.06em;">Projektbeschreibung</p>
        <div style="padding:16px 18px;background:#f4f7f6;border-left:3px solid #24e6b2;border-radius:0 6px 6px 0;font:400 14px/1.65 Arial,sans-serif;color:#10201c;">{$message}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 22px;border-top:1px solid #e0e7e5;font:400 12px/1.6 Arial,sans-serif;color:#7b8a86;">
        Eingegangen am {$received} Uhr. Sie können direkt auf diese E-Mail antworten – die Antwort geht an die anfragende Person.
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    /** Schreibt die Nachricht im Entwicklungsmodus in eine Datei. */
    private function writeToFile(string $subject, string $plain, string $html, array $data): array
    {
        $directory = $this->config->string('mail_log_dir');

        if (!is_dir($directory) && !@mkdir($directory, 0750, true) && !is_dir($directory)) {
            return ['ok' => false, 'error' => 'Testordner konnte nicht angelegt werden: ' . $directory];
        }

        $stamp = date('Ymd-His');
        $base = $directory . '/' . $stamp . '-' . substr(bin2hex(random_bytes(4)), 0, 8);

        $header = "An: {$this->config->string('recipient_email')}\n"
            . "Von: {$this->config->string('sender_email')}\n"
            . "Antwort an: {$data['email']}\n"
            . "Betreff: {$subject}\n"
            . str_repeat('-', 60) . "\n\n";

        $written = @file_put_contents($base . '.txt', $header . $plain);
        @file_put_contents($base . '.html', $html);

        if ($written === false) {
            return ['ok' => false, 'error' => 'Testnachricht konnte nicht geschrieben werden.'];
        }

        return ['ok' => true];
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
