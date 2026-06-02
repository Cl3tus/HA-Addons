'use strict';
/* HA theme sync — shared by index.html (editor) and files.html (explorer).
   Detection order:
     1. Manual override stored in localStorage (set by toggle button)
     2. HA parent document: style.colorScheme on <html> or <body>
     3. HA localStorage key 'selectedTheme' (same origin in Ingress)
     4. OS / browser prefers-color-scheme  (covers HA "Auto" mode)
   Changes in HA are picked up live via MutationObserver + storage event. */

(function () {

  var LS_MANUAL = 'eink_studio_theme_manual';

  /* ---- detection ---- */
  function detect() {
    // 1. Manual override
    var m = localStorage.getItem(LS_MANUAL);
    if (m === 'dark' || m === 'light') return m;

    // 2. HA parent document (same origin in Ingress)
    try {
      var root = window.parent.document.documentElement;
      var body = window.parent.document.body;

      // HA sets color-scheme as inline style on <html> or <body>
      for (var el of [root, body]) {
        var cs = el && el.style && el.style.colorScheme;
        if (cs === 'dark' || cs === 'light') return cs;
      }

      // Some HA versions use data-color-scheme attribute
      var attr = root.getAttribute('data-color-scheme');
      if (attr === 'dark' || attr === 'light') return attr;
    } catch (_) {}

    // 3. HA localStorage key (shared with parent, same origin)
    try {
      var raw = localStorage.getItem('selectedTheme');
      if (raw) {
        var t = JSON.parse(raw);
        if (t && typeof t.dark === 'boolean') return t.dark ? 'dark' : 'light';
      }
    } catch (_) {}

    // 4. OS / browser fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* ---- apply ---- */
  function apply(scheme) {
    // Sync with app.js state if present (editor page)
    if (window.state) window.state.theme = scheme;
    if (window.applyTheme) {
      window.applyTheme();           // app.js handles body class + btn label
    } else {
      document.body.classList.toggle('light', scheme === 'light');
    }
    // Update file-explorer theme button label if present
    var btn = document.getElementById('btn-theme-fe');
    if (btn) btn.textContent = scheme === 'light' ? '◑ Licht' : '◐ Donker';
  }

  /* ---- toggle (called by file-explorer button) ---- */
  function toggle() {
    var current = document.body.classList.contains('light') ? 'light' : 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(LS_MANUAL, next);
    apply(next);
  }

  /* ---- HA-change clears manual override so HA wins ---- */
  function onHAChange() {
    localStorage.removeItem(LS_MANUAL);
    apply(detect());
  }

  /* ---- watchers ---- */
  function watch() {
    // MutationObserver on HA parent's <html> and <body> for style changes
    try {
      var obs = new MutationObserver(onHAChange);
      var opts = { attributes: true, attributeFilter: ['style', 'data-color-scheme'] };
      obs.observe(window.parent.document.documentElement, opts);
      obs.observe(window.parent.document.body, opts);
    } catch (_) {}

    // localStorage change (HA selectedTheme key, same origin)
    window.addEventListener('storage', function (e) {
      if (e.key === 'selectedTheme') onHAChange();
    });

    // OS preference change (HA Auto mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      // Only follow OS if no manual override and HA detection also fails
      if (!localStorage.getItem(LS_MANUAL)) apply(detect());
    });
  }

  /* ---- init ---- */
  function init() {
    apply(detect());
    watch();
  }

  // Expose toggle for files.js button
  window.haTheme = { toggle: toggle, detect: detect, apply: apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
