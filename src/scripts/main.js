/**
 * ============================================================================
 *  INTERAKTIONEN
 * ============================================================================
 *  Bewusst schlankes Vanilla-JavaScript ohne Animationsbibliothek:
 *
 *    1. Mobile Navigation (vollständig per Tastatur bedienbar)
 *    2. Kompakter Header beim Scrollen
 *    3. Einblenden von Abschnitten über den Intersection Observer
 *
 *  Die Website funktioniert vollständig auch ohne JavaScript. Dieses Skript
 *  ergänzt lediglich Komfort.
 * ============================================================================
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------------------------------------------------------------------
   1. Mobile Navigation
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');
  const header = document.querySelector('[data-header]');
  if (!toggle || !panel || !header) return;

  /** Alle fokussierbaren Elemente im geöffneten Menü. */
  const focusables = () =>
    Array.from(
      panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => el.offsetParent !== null);

  let isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;
    panel.hidden = false;
    // Erzwingt einen Layout-Durchlauf, damit der Übergang greift.
    void panel.offsetHeight;
    header.classList.add('is-nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Menü schliessen');
    document.body.style.overflow = 'hidden';

    const first = focusables()[0];
    if (first) first.focus();
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    header.classList.remove('is-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menü öffnen');
    document.body.style.overflow = '';

    const hide = () => {
      if (!isOpen) panel.hidden = true;
    };
    if (prefersReducedMotion.matches) {
      hide();
    } else {
      window.setTimeout(hide, 220);
    }

    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => (isOpen ? close() : open()));

  // Nach einem Klick auf einen Menüpunkt schliesst sich das Menü.
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) close({ restoreFocus: false });
  });

  // Escape schliesst das Menü, der Fokus kehrt zur Schaltfläche zurück.
  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    // Fokus bleibt im geöffneten Menü gefangen.
    if (event.key === 'Tab') {
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Wird das Fenster auf Desktopbreite vergrössert, wird das Menü geschlossen.
  const desktop = window.matchMedia('(min-width: 62rem)');
  const onBreakpoint = (event) => {
    if (event.matches) close({ restoreFocus: false });
  };
  if (typeof desktop.addEventListener === 'function') {
    desktop.addEventListener('change', onBreakpoint);
  }
}

/* ---------------------------------------------------------------------------
   2. Header beim Scrollen
   -------------------------------------------------------------------------- */
function initHeaderState() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  let ticking = false;

  /**
   * Hinterlegt die aktuelle Header-Höhe als CSS-Variable. Das mobile Menü
   * beginnt dadurch exakt unterhalb des Headers, unabhängig davon, ob dieser
   * bereits in den kompakten Zustand gewechselt hat.
   */
  const measure = () => {
    document.documentElement.style.setProperty(
      '--header-height',
      `${Math.round(header.getBoundingClientRect().height)}px`,
    );
  };

  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    measure();
    ticking = false;
  };

  window.addEventListener('resize', measure, { passive: true });

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    },
    { passive: true },
  );

  update();
}

/* ---------------------------------------------------------------------------
   3. Einblenden beim Scrollen
   -------------------------------------------------------------------------- */
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (items.length === 0) return;

  const showAll = () => items.forEach((el) => el.classList.add('is-visible'));

  // Ohne Beobachter-Unterstützung oder bei reduzierter Bewegung wird alles
  // sofort angezeigt – der Inhalt darf nie unsichtbar bleiben.
  if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  items.forEach((el) => observer.observe(el));

  // Sicherheitsnetz: Inhalte dürfen nie dauerhaft unsichtbar bleiben.
  //
  //  a) Elemente im sichtbaren Bereich werden auf jeden Fall eingeblendet.
  //  b) Hat der Beobachter nach kurzer Zeit überhaupt nichts ausgelöst, ist
  //     er offenbar nicht funktionsfähig – dann wird alles angezeigt.
  window.setTimeout(() => {
    const anyVisible = Array.from(items).some((el) => el.classList.contains('is-visible'));

    if (!anyVisible) {
      showAll();
      return;
    }

    items.forEach((el) => {
      if (!el.classList.contains('is-visible') && el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('is-visible');
      }
    });
  }, 1200);
}

/* ---------------------------------------------------------------------------
   Start
   -------------------------------------------------------------------------- */
function init() {
  initMobileNav();
  initHeaderState();
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
