/**
 * ============================================================================
 *  KONTAKTFORMULAR – CLIENTSEITIGE ERGÄNZUNG
 * ============================================================================
 *  Ohne JavaScript sendet das Formular ganz normal an den PHP-Endpunkt und
 *  der Browser folgt der Weiterleitung. Dieses Skript verbessert nur den
 *  Ablauf: Fehlermeldungen beim Feld, Ladezustand, Rückmeldung ohne
 *  Seitenwechsel und Schutz vor doppeltem Absenden.
 *
 *  ZEITPUNKT DER VALIDIERUNG
 *  -------------------------
 *  Entscheidend ist der Status `hasAttemptedSubmit`:
 *
 *    VOR dem ersten Absenden
 *      Es erscheinen keinerlei Fehlermeldungen. Ein Feld zu fokussieren und
 *      leer wieder zu verlassen, markiert also nichts rot. Leere Pflichtfelder
 *      bleiben visuell neutral.
 *
 *    BEIM Absenden
 *      hasAttemptedSubmit wird gesetzt, alle Felder werden geprüft, fehlerhafte
 *      Felder werden markiert, eine Zusammenfassung erscheint und der Fokus
 *      springt auf das erste betroffene Feld.
 *
 *    NACH dem ersten Absenden
 *      Korrigiert jemand ein Feld, verschwindet dessen Fehler sofort bei
 *      `input` bzw. `change`. Andere fehlerhafte Felder bleiben markiert.
 *      Neue Fehler entstehen weiterhin nicht allein durch `blur`.
 *
 *  Die verbindliche Prüfung erfolgt in jedem Fall serverseitig in kontakt.php.
 * ============================================================================
 */

const form = document.querySelector('[data-contact-form]');

if (form) {
  const statusBox = form.querySelector('[data-form-status]');
  const summaryBox = form.querySelector('[data-error-summary]');
  const summaryTitle = form.querySelector('[data-summary-title]');
  const summaryList = form.querySelector('[data-summary-list]');
  const submit = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const loadedAt = form.querySelector('[data-loaded-at]');

  /** Erst nach dem ersten Absendeversuch werden Fehler sichtbar gemacht. */
  let hasAttemptedSubmit = false;
  let isSending = false;
  let hasSucceeded = false;

  // Zeitstempel für den Bot-Schutz: echte Besuchende brauchen ein paar
  // Sekunden zum Ausfüllen, automatisierte Skripte meist nicht.
  if (loadedAt) loadedAt.value = String(Date.now());

  /* ------------------------------------------------------------------------
     Validierungsregeln

     Jede Regel gibt eine Fehlermeldung zurück – oder einen leeren Text, wenn
     das Feld in Ordnung ist. Optionale Felder liefern bei leerem Inhalt immer
     einen leeren Text und werden dadurch nie bemängelt.
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

    // Optional: leer ist immer in Ordnung.
    'kf-telefon': (value) => {
      const v = value.trim();
      if (!v) return '';
      if (!/^[0-9+().\/\s-]{6,40}$/.test(v)) {
        return 'Bitte geben Sie eine gültige Telefonnummer an – oder lassen Sie das Feld leer.';
      }
      return '';
    },

    // Auswahlfeld: „Bitte wählen“ hat den Wert "" und gilt als nicht ausgefüllt.
    'kf-anliegen': (value) => (value ? '' : 'Bitte wählen Sie aus, worum es geht.'),

    'kf-nachricht': (value) =>
      value.trim().length < 10
        ? 'Bitte beschreiben Sie Ihr Anliegen kurz – ein bis zwei Sätze genügen.'
        : '',

    'kf-datenschutz': (_value, field) =>
      field.checked ? '' : 'Bitte stimmen Sie der Verwendung Ihrer Angaben zu.',
  };

  /** Alle Felder, für die es eine Regel gibt. */
  const fields = Object.keys(RULES)
    .map((id) => form.querySelector(`#${id}`))
    .filter(Boolean);

  /** Beschriftung eines Feldes – für die Fehlerzusammenfassung. */
  function labelFor(field) {
    const label = form.querySelector(`label[for="${field.id}"]`);
    if (!label) return field.name;
    // Zusätze wie „(optional)“ und „(Pflichtfeld)“ nicht mitnehmen.
    return label.textContent.replace(/\(optional\)|\(Pflichtfeld\)|\*/g, '').trim();
  }

  /* ------------------------------------------------------------------------
     Anzeige eines einzelnen Feldfehlers
     ---------------------------------------------------------------------- */

  /**
   * Setzt oder entfernt die Fehlermeldung eines Feldes.
   * `aria-invalid` wird ausschliesslich gesetzt, wenn wirklich eine sichtbare
   * Meldung vorhanden ist.
   */
  function setFieldError(field, message) {
    const target = form.querySelector(`[data-error-for="${field.id}"]`);
    if (target) target.textContent = message;

    if (message) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
  }

  /** Entfernt sämtliche Fehlerzustände. */
  function clearAllErrors() {
    fields.forEach((field) => setFieldError(field, ''));
    hideSummary();
  }

  /**
   * Prüft ein Feld und zeigt das Ergebnis an.
   * Vor dem ersten Absendeversuch wird nichts angezeigt.
   */
  function validateField(field, { show = true } = {}) {
    const rule = RULES[field.id];
    if (!rule) return true;

    const message = rule(field.value, field);
    if (show) setFieldError(field, message);
    return message === '';
  }

  /* ------------------------------------------------------------------------
     Fehlerzusammenfassung
     ---------------------------------------------------------------------- */
  function showSummary(invalidFields) {
    if (!summaryBox || !summaryTitle || !summaryList) return;

    const count = invalidFields.length;
    summaryTitle.textContent =
      count === 1
        ? 'Ein Feld muss noch ergänzt werden.'
        : `${count} Felder müssen noch ergänzt werden.`;

    summaryList.innerHTML = '';
    invalidFields.forEach((field) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${field.id}`;
      link.textContent = labelFor(field);
      link.addEventListener('click', (event) => {
        event.preventDefault();
        field.focus();
      });
      item.appendChild(link);
      summaryList.appendChild(item);
    });

    summaryBox.hidden = false;
  }

  function hideSummary() {
    if (!summaryBox) return;
    summaryBox.hidden = true;
    if (summaryList) summaryList.innerHTML = '';
  }

  /**
   * Prüft das gesamte Formular und zeigt alle Fehler an.
   * @returns {HTMLElement[]} die fehlerhaften Felder
   */
  function validateAll() {
    const invalid = fields.filter((field) => !validateField(field));

    if (invalid.length > 0) {
      showSummary(invalid);
    } else {
      hideSummary();
    }

    return invalid;
  }

  /* ------------------------------------------------------------------------
     Nachbesserung: erst NACH dem ersten Absendeversuch aktiv

     Bewusst kein `blur`-Listener. Ein Feld zu fokussieren und leer wieder zu
     verlassen, darf niemals eine Fehlermeldung auslösen.
     ---------------------------------------------------------------------- */
  fields.forEach((field) => {
    const recheck = () => {
      if (!hasAttemptedSubmit) return;

      validateField(field);

      // Zusammenfassung mitführen, damit dort nichts Erledigtes stehen bleibt.
      const stillInvalid = fields.filter((f) => f.hasAttribute('aria-invalid'));
      if (stillInvalid.length > 0) {
        showSummary(stillInvalid);
      } else {
        hideSummary();
      }
    };

    field.addEventListener('input', recheck);
    field.addEventListener('change', recheck);
  });

  /* ------------------------------------------------------------------------
     Statusmeldungen des Servers
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

    // Ab jetzt dürfen Fehler sichtbar werden.
    hasAttemptedSubmit = true;

    const invalid = validateAll();
    if (invalid.length > 0) {
      event.preventDefault();
      hideStatus();
      invalid[0].focus();
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

        // Nach erfolgreichem Versand sämtliche Fehlerzustände zurücksetzen.
        form.reset();
        hasAttemptedSubmit = false;
        clearAllErrors();

        showStatus(
          'success',
          '<strong>Vielen Dank für Ihre Anfrage.</strong><span>Ihre Nachricht ist eingegangen. Manuel Saugy meldet sich persönlich bei Ihnen.</span>',
        );
        statusBox?.focus?.();
        return;
      }

      // Serverseitige Feldfehler den passenden Feldern zuordnen.
      // Die Eingaben bleiben dabei erhalten – es wird nichts gelöscht.
      if (data.errors && typeof data.errors === 'object') {
        const serverInvalid = [];

        Object.entries(data.errors).forEach(([name, message]) => {
          const field = form.querySelector(`[name="${name}"]`);
          if (field) {
            setFieldError(field, String(message));
            serverInvalid.push(field);
          }
        });

        if (serverInvalid.length > 0) {
          showSummary(serverInvalid);
          serverInvalid[0].focus();
        }
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
