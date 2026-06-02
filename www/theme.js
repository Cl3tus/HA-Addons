'use strict';
/* HA theme sync — shared by index.html and files.html.
   Polls --primary-background-color every 500 ms.
   That CSS variable is reliably set on :root for every HA theme:
     #fafafa (and similar light colors) → light mode
     #111111 (and similar dark  colors) → dark  mode               */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';
  var _current  = null;   // last applied scheme so we only act on changes

  /* ---- hex / rgb → 0‥1 luminance, or null if unparseable ---- */
  function luminance(bg) {
    if (!bg) return null;
    bg = bg.trim();
    var r, g, b;
    if (bg.charAt(0) === '#') {
      var h = bg.slice(1);
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      r = parseInt(h.slice(0,2), 16);
      g = parseInt(h.slice(2,4), 16);
      b = parseInt(h.slice(4,6), 16);
    } else {
      var m = bg.match(/\d+/g);
      if (m && m.length >= 3) { r = +m[0]; g = +m[1]; b = +m[2]; }
    }
    if (r === undefined || isNaN(r)) return null;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  /* ---- read the current HA theme from the parent document ---- */
  function detect() {
    var manual = localStorage.getItem(LS_MANUAL);
    if (manual === 'dark' || manual === 'light') return manual;

    try {
      var root = window.parent.document.documentElement;

      // Primary: --primary-background-color (confirmed in HA 2026.x)
      var bg  = getComputedStyle(root).getPropertyValue('--primary-background-color').trim();
      var lum = luminance(bg);
      if (lum !== null) return lum < 0.5 ? 'dark' : 'light';

      // Fallback A: data-color-scheme attribute
      var attr = root.getAttribute('data-color-scheme');
      if (attr === 'dark' || attr === 'light') return attr;

      // Fallback B: dark attribute
      if (root.hasAttribute('dark')) return 'dark';
    } catch (_) {}

    // Fallback C: OS preference (HA "Auto" mode)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* ---- apply scheme to both pages ---- */
  function apply(scheme) {
    _current = scheme;
    if (window.state) window.state.theme = scheme;
    if (window.applyTheme) {
      window.applyTheme();                            // editor: handles class + btn label
    } else {
      document.body.classList.toggle('light', scheme === 'light');
    }
    var btn = document.getElementById('btn-theme-fe');
    if (btn) btn.textContent = scheme === 'light' ? '◑ Licht' : '◐ Donker';
  }

  /* ---- manual toggle (file-explorer button) ---- */
  function toggle() {
    var cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS_MANUAL, cur === 'light' ? 'dark' : 'light');
    apply(detect());
  }

  /* ---- poll every 500 ms — catches HA stylesheet swaps ---- */
  function startPolling() {
    setInterval(function () {
      if (localStorage.getItem(LS_MANUAL)) return;  // manual override active
      var s = detect();
      if (s !== _current) apply(s);
    }, 500);
  }

  /* ---- OS preference watcher (HA "Auto" mode) ---- */
  function watchOS() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!localStorage.getItem(LS_MANUAL)) {
        var s = detect();
        if (s !== _current) apply(s);
      }
    });
  }

  /* ---- init ---- */
  function init() {
    apply(detect());
    startPolling();
    watchOS();
  }

  window.haTheme = { toggle: toggle, detect: detect, apply: apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
