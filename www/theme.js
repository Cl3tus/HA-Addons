'use strict';
/* HA theme sync — shared by index.html and files.html.
   Primary:  reads --primary-background-color from HA's parent document.
             This works for HA's EXPLICIT Light/Dark setting.
             #fafafa (lum≈0.98) → light,  #111111 (lum≈0.07) → dark.
   Fallback: prefers-color-scheme (covers HA "Auto" mode).
   Polls every 500 ms so live HA theme switches are picked up.          */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';
  var _current  = null;
  var _mq       = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---- hex / rgb → 0‥1 luminance, null if unparseable ---- */
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
      if (m && m.length >= 3) { r=+m[0]; g=+m[1]; b=+m[2]; }
    }
    if (r === undefined || isNaN(r)) return null;
    return (0.299*r + 0.587*g + 0.114*b) / 255;
  }

  /* ---- detect ---- */
  function detect() {
    var manual = localStorage.getItem(LS_MANUAL);
    if (manual === 'dark' || manual === 'light') return manual;

    // Primary: --primary-background-color from HA parent (explicit Light/Dark)
    try {
      var bg  = getComputedStyle(window.parent.document.documentElement)
                  .getPropertyValue('--primary-background-color').trim();
      var lum = luminance(bg);
      if (lum !== null) return lum < 0.5 ? 'dark' : 'light';
    } catch (_) {}

    // Fallback: OS preference (HA "Auto" mode)
    return _mq.matches ? 'dark' : 'light';
  }

  /* ---- apply ---- */
  function apply(scheme) {
    _current = scheme;
    document.body.classList.toggle('light', scheme === 'light');
    if (window.state) window.state.theme = scheme;
    var btn   = document.getElementById('btn-theme');
    if (btn)   btn.textContent = scheme === 'light' ? '◑ Licht' : '◐ Donker';
    var btnFe = document.getElementById('btn-theme-fe');
    if (btnFe) btnFe.textContent = scheme === 'light' ? '◑ Licht' : '◐ Donker';
  }

  /* ---- toggle (manual button) ---- */
  function toggle() {
    var cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS_MANUAL, cur === 'light' ? 'dark' : 'light');
    apply(detect());
  }

  /* ---- watchers ---- */
  function watch() {
    // Poll every 500 ms — catches HA Light/Dark switches reliably
    setInterval(function () {
      if (localStorage.getItem(LS_MANUAL)) return;
      var s = detect();
      if (s !== _current) apply(s);
    }, 500);

    // OS preference (HA "Auto" mode)
    _mq.addEventListener('change', function () {
      if (!localStorage.getItem(LS_MANUAL)) {
        var s = detect();
        if (s !== _current) apply(s);
      }
    });
  }

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
