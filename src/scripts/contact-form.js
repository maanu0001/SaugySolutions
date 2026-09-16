/**
 * ============================================================================
 *  KONTAKTFORMULAR – CLIENTSEITIGE ERGÄNZUNG
 * ============================================================================
 *  Ohne JavaScript sendet das Formular ganz normal an den PHP-Endpunkt und
 *  der Browser folgt der Weiterleitung. Dieses Skript verbessert nur den
 *  Ablauf:
 *
 *    - verständliche Fehlermeldungen direkt beim Feld
 *    - Ladezustand während des Sendens
 *    - Rückmeldung ohne Seitenwechsel
 *    - Schutz vor doppeltem Absenden
 *
 *  Die verbindliche Prüfung erfolgt weiterhin serverseitig in kontakt.php.
 * ============================================================================
 */

const form = document.querySelector('[data-contact-form]');

if (form) {
  const statusBox = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const loadedAt = form.querySelector('[data-loaded-at]');

  let isSending = false;
  let hasSucceeded = false;

  // Zeitstempel für den Bot-Schutz: echte Besuchende brauchen ein paar
  // Sekunden zum Ausfüllen, automatisierte Skripte meist nicht.
  if (loadedAt) loadedAt.value = String(Date.now());

  /* ------------------------------------------------------------------------
     Validierungsregeln
     ---------------------------------------------------------------------- */
  const RULES = {
    'kf-name': (value) =>
      value.trim().length < 2 ? 'Bitte geben Sie Ihren Vor- und Nachnamen an.' : '',
    'kf-email': (value) => {
      const v = value.trim();
      if (!v) return 'Bitte geben Sie Ihre E-Mail-Adresse an.';
      // Bewusst einfache Prüfung – die verbindliche erfolgt serverseitig.
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) {
        return 'Diese E-Mail-Adresse scheint nicht zu stimmen. Bitte prüfen Sie die Schreibweise.';
      }
      return '';
    },
    'kf-telefon': (value) => {
      const v = value.trim();
      if (!v) return '';
      if (!/^[0-9+().\/\s-]{6,40}$/.test(v)) {
        return 'Bitte geben Sie eine gültige Telefonnummer an – oder lassen Sie das Feld leer.';
      }
      return '';
    },
    'kf-anliegen': (value) => (value ? '' : 'Bitte wählen Sie aus, worum es geht.'),
    'kf-leistung': (value) => (value ? '' : 'Bitte wählen Sie die gewünschte Leistung.'),
    'kf-nachricht': (value) =>
      value.trim().length < 10
        ? 'Bitte beschreiben Sie Ihr Anliegen kurz – ein bis zwei Sätze genügen.'
        : '',
    'kf-datenschutz': (_value, field) =>
      field.checked ? '' : 'Bitte stimmen Sie der Verwendung Ihrer Angaben zu.',
  };

  /** Zeigt bzw. entfernt die Fehlermeldung eines Feldes. */
  function setFieldError(field, message) {
    const target = form.querySelector(`[data-error-for="${field.id}"]`);
    if (target) target.textContent = message;

    if (message) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
  }

  /** Prüft ein einzelnes Feld. */
  function validateField(field) {
    const rule = RULES[field.id];
    if (!rule) return true;

    const message = rule(field.value, field);
    setFieldError(field, message);
    return message === '';
  }

  /** Prüft das gesamte Formular und liefert das erste fehlerhafte Feld. */
  function validateForm() {
    let firstInvalid = null;

    Object.keys(RULES).forEach((id) => {
      const field = form.querySelector(`#${id}`);
      if (!field) return;
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });

    return firstInvalid;
  }

  /* ------------------------------------------------------------------------
     Rückmeldung beim Verlassen eines Feldes
     ---------------------------------------------------------------------- */
  Object.keys(RULES).forEach((id) => {
    const field = form.querySelector(`#${id}`);
    if (!field) return;

    field.addEventListener('blur', () => validateField(field));

    // Eine bereits angezeigte Fehlermeldung verschwindet, sobald der Fehler
    // behoben ist – nicht erst beim erneuten Absenden.
    field.addEventListener('input', () => {
      if (field.hasAttribute('aria-invalid')) validateField(field);
    });

    field.addEventListener('change', () => {
      if (field.hasAttribute('aria-invalid')) validateField(field);
    });
  });

  /* ------------------------------------------------------------------------
     Statusmeldungen
     ---------------------------------------------------------------------- */
  function showStatus(type, html) {
    if (!statusBox) return;
    statusBox.className = `form__status form__status--${type}`;
    statusBox.innerHTML = html;
    statusBox.hidden = false;
  }

  function hideStatus() {
    if (!statusBox) return;
    statusBox.hidden = true;
    statusBox.innerHTML = '';
  }

  function setSending(sending) {
    isSending = sending;
    form.classList.toggle('is-sending', sending);
    if (submit) submit.disabled = sending;
    if (submitLabel) submitLabel.textContent = sending ? 'Wird gesendet …' : 'Anfrage senden';
  }

  /* ------------------------------------------------------------------------
     Absenden
     ---------------------------------------------------------------------- */
  form.addEventListener('submit', async (event) => {
    // Nach erfolgreichem Versand keine zweite Anfrage zulassen.
    if (hasSucceeded || isSending) {
      event.preventDefault();
      return;
    }

    const firstInvalid = validateForm();
    if (firstInvalid) {
      event.preventDefault();
      showStatus(
        'error',
        '<strong>Bitte prüfen Sie Ihre Angaben.</strong><span>Einzelne Felder sind noch nicht vollständig ausgefüllt. Die betroffenen Felder sind unten markiert.</span>',
      );
      firstInvalid.focus();
      return;
    }

    // fetch nicht verfügbar? Dann übernimmt der Browser den normalen Versand.
    if (typeof window.fetch !== 'function') return;

    event.preventDefault();
    hideStatus();
    setSending(true);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        // Antwort war kein JSON – wird unten als Fehler behandelt.
      }

      if (response.ok && data.ok) {
        hasSucceeded = true;
        setSending(false);
        if (submit) {
          submit.disabled = true;
          submit.setAttribute('aria-disabled', 'true');
        }
        if (submitLabel) submitLabel.textContent = 'Anfrage gesendet';

        showStatus(
          'success',
          '<strong>Vielen Dank für Ihre Anfrage.</strong><span>Ihre Nachricht ist eingegangen. Manuel Saugy meldet sich persönlich bei Ihnen.</span>',
        );
        statusBox?.focus?.();
        form.reset();
        return;
      }

      // Serverseitige Feldfehler den passenden Feldern zuordnen.
      if (data.errors && typeof data.errors === 'object') {
        Object.entries(data.errors).forEach(([name, message]) => {
          const field = form.querySelector(`[name="${name}"]`);
          if (field) setFieldError(field, String(message));
        });
      }

      const message =
        data.message ||
        'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später noch einmal.';

      showStatus(
        'error',
        `<strong>Senden nicht möglich.</strong><span>${message} Sie erreichen uns jederzeit direkt per <a href="mailto:manu@saugy-solutions.ch">E-Mail</a> oder telefonisch.</span>`,
      );
    } catch {
      showStatus(
        'error',
        '<strong>Verbindung nicht möglich.</strong><span>Ihre Anfrage konnte nicht übermittelt werden. Bitte prüfen Sie Ihre Internetverbindung – oder melden Sie sich direkt per <a href="mailto:manu@saugy-solutions.ch">E-Mail</a>.</span>',
      );
    } finally {
      if (!hasSucceeded) setSending(false);
    }
  });

  /* ------------------------------------------------------------------------
     Hinweis nach einer Weiterleitung ohne JavaScript
     ---------------------------------------------------------------------- */
  const params = new URLSearchParams(window.location.search);
  if (params.get('status') === 'fehler') {
    showStatus(
      'error',
      '<strong>Die Anfrage konnte nicht gesendet werden.</strong><span>Bitte versuchen Sie es noch einmal oder melden Sie sich direkt per E-Mail an <a href="mailto:manu@saugy-solutions.ch">manu@saugy-solutions.ch</a>.</span>',
    );
  }
}
