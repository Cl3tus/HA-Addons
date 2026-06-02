'use strict';
/* HA theme sync — included in both index.html and files.html.
   Detects HA's dark/light setting via the parent document (same origin
   in Ingress) and applies body.light accordingly. Updates live via a
   MutationObserver so switching theme in HA is reflected immediately. */
(function () {

  function detect() {
    try {
      // HA sets data-color-scheme="dark"|"light" on <html> of the parent frame.
      // In Ingress the add-on runs on the same origin, so window.parent is accessible.
      const s = window.parent.document.documentElement.getAttribute('data-color-scheme');
      if (s === 'dark' || s === 'light') return s;
    } catch (_) {}
    // Fallback: OS / browser preference (covers HA "Auto" mode)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(scheme) {
    if (window.state) window.state.theme = scheme;   // sync app.js state if present
    if (window.applyTheme) {
      window.applyTheme();                           // app.js handles class + btn label
    } else {
      document.body.classList.toggle('light', scheme === 'light');
    }
  }

  function init() {
    apply(detect());

    // Watch HA parent for live theme switches
    try {
      new MutationObserver(() => apply(detect())).observe(
        window.parent.document.documentElement,
        { attributes: true, attributeFilter: ['data-color-scheme'] }
      );
    } catch (_) {}

    // Also watch OS preference (HA "Auto" mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => apply(detect()));
  }

  // Run after DOM + any preceding scripts (app.js / files.js) are done
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
