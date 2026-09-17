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
  const drawer = document.querySelector('[data-nav-panel]');
  if (!toggle || !drawer) return;

  const panel = drawer.querySelector('.nav-drawer__panel') ?? drawer;
  const closeButton = drawer.querySelector('[data-nav-close]');
  const backdrop = drawer.querySelector('[data-nav-backdrop]');
  const root = document.documentElement;

  /** Alle fokussierbaren Elemente im geöffneten Menü. */
  const focusables = () =>
    Array.from(
      panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => el.offsetParent !== null);

  let isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;

    drawer.hidden = false;
    // Erzwingt einen Layout-Durchlauf, damit der Übergang greift.
    void drawer.offsetHeight;

    root.classList.add('is-nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Menü schliessen');

    /*
      Scroll-Sperre am Dokument-Element.

      Bewusst NICHT über `position: fixed` am Körper: Dabei verliert das
      Dokument seine Höhe, die Scrollposition muss von Hand gesichert und
      wiederhergestellt werden – und landet dabei zuverlässig an der falschen
      Stelle. `overflow: hidden` am Dokument-Element hält die Position
      dagegen unverändert; es gibt nichts wiederherzustellen.

      Die Breite der Bildlaufleiste wird ausgeglichen, damit der Inhalt beim
      Öffnen nicht seitlich springt.
    */
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = 'hidden';
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;

    const first = focusables()[0];
    if (first) first.focus({ preventScroll: true });
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;

    root.classList.remove('is-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menü öffnen');

    // Scroll-Sperre lösen. Die Position blieb die ganze Zeit erhalten.
    root.style.overflow = '';
    root.style.paddingRight = '';

    const hide = () => {
      if (!isOpen) drawer.hidden = true;
    };
    if (prefersReducedMotion.matches) {
      hide();
    } else {
      window.setTimeout(hide, 260);
    }

    /*
      `preventScroll` ist hier entscheidend: Ohne diese Angabe scrollt der
      Browser die Schaltfläche in den sichtbaren Bereich und macht die soeben
      wiederhergestellte Scrollposition wieder zunichte.
    */
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => (isOpen ? close() : open()));
  closeButton?.addEventListener('click', () => close());
  backdrop?.addEventListener('click', () => close());

  // Nach einem Klick auf einen Menüpunkt schliesst sich das Menü.
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) close({ restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;

    // Escape schliesst das Menü, der Fokus kehrt zur Schaltfläche zurück.
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
   4. Dezente Mausbewegung im Hero

   Die Karten rund um den Hero folgen der Maus minimal. Das gibt dem Bereich
   Tiefe, ohne abzulenken.

   Bewusst eingeschränkt auf:
     - Geräte mit echtem Zeiger (kein Touch)
     - ausreichend breite Bildschirme
     - Nutzende ohne Wunsch nach reduzierter Bewegung

   Die Verschiebung beträgt wenige Pixel und wird über requestAnimationFrame
   geglättet, damit nichts ruckelt.
   -------------------------------------------------------------------------- */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const layers = hero.querySelectorAll('[data-parallax]');
  if (layers.length === 0) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const wideEnough = window.matchMedia('(min-width: 68rem)');

  /** Nur aktiv, wenn alle Bedingungen erfüllt sind. */
  const isEligible = () =>
    finePointer.matches && wideEnough.matches && !prefersReducedMotion.matches;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frame = null;

  /** Maximale Auslenkung in Pixeln. */
  const RANGE = 10;

  function render() {
    // Sanftes Nachziehen statt harter Sprünge.
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.parallax) || 1;
      layer.style.transform = `translate3d(${(currentX * depth).toFixed(2)}px, ${(currentY * depth).toFixed(2)}px, 0)`;
    });

    // Weiterlaufen, bis die Bewegung praktisch stillsteht.
    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      frame = window.requestAnimationFrame(render);
    } else {
      frame = null;
    }
  }

  function onMove(event) {
    if (!isEligible()) return;

    const rect = hero.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * RANGE * 2;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * RANGE * 2;

    if (frame === null) frame = window.requestAnimationFrame(render);
  }

  function reset() {
    targetX = 0;
    targetY = 0;
    if (frame === null) frame = window.requestAnimationFrame(render);
  }

  hero.addEventListener('mousemove', onMove, { passive: true });
  hero.addEventListener('mouseleave', reset, { passive: true });

  // Wechselt die Umgebung (Fensterbreite, Systemeinstellung), Auslenkung lösen.
  const onChange = () => {
    if (!isEligible()) {
      layers.forEach((layer) => {
        layer.style.transform = '';
      });
      targetX = 0;
      targetY = 0;
      currentX = 0;
      currentY = 0;
    }
  };

  if (typeof wideEnough.addEventListener === 'function') {
    wideEnough.addEventListener('change', onChange);
    prefersReducedMotion.addEventListener('change', onChange);
  }
}

/* ---------------------------------------------------------------------------
   Start
   -------------------------------------------------------------------------- */
function init() {
  initMobileNav();
  initHeaderState();
  initReveal();
  initHeroParallax();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
