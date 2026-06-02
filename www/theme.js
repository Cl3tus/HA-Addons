'use strict';
/* HA theme sync — shared by index.html (editor) and files.html (explorer).
   Detection order (first match wins):
     1. Manual override in localStorage
     2. getComputedStyle(root).colorScheme  ← HA sets this via stylesheet
     3. data-color-scheme attribute
     4. --primary-background-color luminance (HA CSS variable)
     5. localStorage 'selectedTheme'
     6. OS prefers-color-scheme (HA "Auto" fallback)                     */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';

  /* ---- luminance helper ---- */
  function isDarkColor(css) {
    if (!css) return null;
    var m = css.match(/\d+/g);
    if (!m || m.length < 3) return null;
    var lum = (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255;
    return lum < 0.5;
  }

  /* ---- detection ---- */
  function detect() {
    // 1. Manual override
    var manual = localStorage.getItem(LS_MANUAL);
    if (manual === 'dark' || manual === 'light') return manual;

    try {
      var root = window.parent.document.documentElement;
      var body = window.parent.document.body;

      // 2. color-scheme via computed style (HA injects :root { color-scheme: dark } stylesheet)
      var cs = getComputedStyle(root).colorScheme;
      if (cs === 'dark' || cs === 'light') return cs;
      // body fallback
      cs = getComputedStyle(body).colorScheme;
      if (cs === 'dark' || cs === 'light') return cs;

      // 3. data-color-scheme attribute (older HA versions)
      var attr = root.getAttribute('data-color-scheme');
      if (attr === 'dark' || attr === 'light') return attr;

      // 4. --primary-background-color luminance (HA always sets this CSS var)
      var bg = getComputedStyle(root).getPropertyValue('--primary-background-color').trim();
      if (!bg) bg = getComputedStyle(body).backgroundColor;
      var dark = isDarkColor(bg);
      if (dark !== null) return dark ? 'dark' : 'light';
    } catch (_) {}

    // 5. HA localStorage key (same origin in Ingress)
    try {
      var raw = localStorage.getItem('selectedTheme');
      if (raw) {
        var t = JSON.parse(raw);
        if (t && typeof t.dark === 'boolean') return t.dark ? 'dark' : 'light';
      }
    } catch (_) {}

    // 6. OS / browser preference (HA "Auto" mode)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* ---- apply ---- */
  function apply(scheme) {
    if (window.state) window.state.theme = scheme;
    if (window.applyTheme) {
      window.applyTheme();
    } else {
      document.body.classList.toggle('light', scheme === 'light');
    }
    var btn = document.getElementById('btn-theme-fe');
    if (btn) btn.textContent = scheme === 'light' ? '◑ Licht' : '◐ Donker';
  }

  /* ---- toggle (file-explorer button) ---- */
  function toggle() {
    var current = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS_MANUAL, current === 'light' ? 'dark' : 'light');
    apply(detect());
  }

  /* ---- HA change: clear manual override ---- */
  function onHAChange() {
    localStorage.removeItem(LS_MANUAL);
    apply(detect());
  }

  /* ---- watchers ---- */
  function watch() {
    try {
      var obs = new MutationObserver(onHAChange);
      // Watch <head> for stylesheet changes (HA injects theme styles here)
      obs.observe(window.parent.document.head, { childList: true, subtree: true });
      // Watch <html> and <body> for attribute / style changes
      var opts = { attributes: true, attributeFilter: ['style', 'class', 'data-color-scheme'] };
      obs.observe(window.parent.document.documentElement, opts);
      obs.observe(window.parent.document.body, opts);
    } catch (_) {}

    // localStorage change (HA selectedTheme key)
    window.addEventListener('storage', function (e) {
      if (e.key === 'selectedTheme') onHAChange();
    });

    // OS preference (HA Auto mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!localStorage.getItem(LS_MANUAL)) apply(detect());
    });
  }

  /* ---- init ---- */
  function init() {
    apply(detect());
    watch();
  }

  window.haTheme = { toggle: toggle, detect: detect, apply: apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
