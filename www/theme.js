'use strict';
/* HA theme sync — shared by index.html and files.html.
   Ground truth (proven via console debug): HA sets
   --primary-background-color on its <html>:
     #fafafa (lum 0.98) → light    #111111 (lum 0.07) → dark
   This is correct even when the OS preference differs from HA's setting,
   which is exactly the case prefers-color-scheme gets wrong.
   We read that variable from whichever ancestor frame exposes it
   (HA can nest the ingress iframe), poll every 500 ms for live switches,
   and fall back to prefers-color-scheme only if nothing is readable.   */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';
  var _current  = null;

  /* ---- hex / rgb string → luminance 0‥1, or null ---- */
  function lum(c) {
    if (!c) return null;
    c = c.trim();
    var r, g, b, h;
    if (c.charAt(0) === '#') {
      h = c.slice(1);
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      if (h.length < 6) return null;
      r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16);
    } else {
      var m = c.match(/[\d.]+/g);          // rgb()/rgba()
      if (!m || m.length < 3) return null;
      r = +m[0]; g = +m[1]; b = +m[2];
    }
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return (0.299*r + 0.587*g + 0.114*b) / 255;
  }

  /* ---- read --primary-background-color from any ancestor frame ---- */
  function haBackgroundLuminance() {
    var frames = [];
    try { if (window.parent && window.parent !== window) frames.push(window.parent); } catch (_) {}
    try { if (window.top && window.top !== window && frames.indexOf(window.top) === -1) frames.push(window.top); } catch (_) {}
    for (var i = 0; i < frames.length; i++) {
      try {
        var doc = frames[i].document;
        // Try <html> first, then <body>
        for (var j = 0; j < 2; j++) {
          var el = j === 0 ? doc.documentElement : doc.body;
          if (!el) continue;
          var v = getComputedStyle(el).getPropertyValue('--primary-background-color');
          var l = lum(v);
          if (l !== null) return l;
        }
      } catch (_) {}
    }
    return null;
  }

  /* ---- detect ---- */
  function detect() {
    var manual = localStorage.getItem(LS_MANUAL);
    if (manual === 'dark' || manual === 'light') return manual;

    var l = haBackgroundLuminance();
    if (l !== null) return l < 0.5 ? 'dark' : 'light';

    // Last resort: OS preference (HA not readable, e.g. outside ingress)
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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

  /* ---- manual toggle ---- */
  function toggle() {
    var cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS_MANUAL, cur === 'light' ? 'dark' : 'light');
    _current = null;
    apply(detect());
  }

  /* ---- init ---- */
  function init() {
    apply(detect());
    setInterval(function () {
      if (localStorage.getItem(LS_MANUAL)) return;
      var s = detect();
      if (s !== _current) apply(s);
    }, 500);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!localStorage.getItem(LS_MANUAL)) { _current = null; apply(detect()); }
    });
  }

  window.haTheme = { toggle: toggle, detect: detect, apply: apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
