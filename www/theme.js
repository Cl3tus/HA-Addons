'use strict';
/* HA theme sync — uses the SAME mechanism as ESPHome webserver v3.
   ESPHome relies on CSS system colors (Canvas/CanvasText) + the
   `color-scheme: light dark` property. The browser propagates HA's
   color-scheme from the embedding document into this ingress iframe,
   so a `Canvas`-coloured probe resolves to HA's ACTUAL theme — even
   when the OS preference differs (which is why prefers-color-scheme
   was always wrong here).                                            */
(function () {
  var _current  = null;
  var _override = null;   // session-only manual override (NOT persisted) — resets on reload

  /* ---- ESPHome mechanism: read a system-colour probe ----
     A hidden element with background-color:Canvas + color-scheme:light dark
     resolves to the USED color scheme propagated from HA.            */
  function detectFromCanvas() {
    try {
      var probe = document.createElement('div');
      probe.style.cssText =
        'background-color:Canvas;color-scheme:light dark;' +
        'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;';
      (document.body || document.documentElement).appendChild(probe);
      var bg = getComputedStyle(probe).backgroundColor;   // rgb(r,g,b)
      probe.parentNode.removeChild(probe);
      var m = bg.match(/[\d.]+/g);
      if (m && m.length >= 3) {
        var l = (0.299*+m[0] + 0.587*+m[1] + 0.114*+m[2]) / 255;
        return l < 0.5 ? 'dark' : 'light';
      }
    } catch (_) {}
    return null;
  }

  /* ---- fallback: HA's --primary-background-color (parent/top) ---- */
  function lum(c) {
    if (!c) return null;
    c = c.trim(); var r,g,b,h;
    if (c.charAt(0) === '#') {
      h = c.slice(1); if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      if (h.length < 6) return null;
      r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16);
    } else {
      var m = c.match(/[\d.]+/g); if (!m || m.length < 3) return null;
      r = +m[0]; g = +m[1]; b = +m[2];
    }
    if (isNaN(r)||isNaN(g)||isNaN(b)) return null;
    return (0.299*r + 0.587*g + 0.114*b) / 255;
  }
  function detectFromHAVar() {
    var frames = [];
    try { if (window.parent && window.parent !== window) frames.push(window.parent); } catch (_) {}
    try { if (window.top && window.top !== window && frames.indexOf(window.top) === -1) frames.push(window.top); } catch (_) {}
    for (var i = 0; i < frames.length; i++) {
      try {
        var el = frames[i].document.documentElement;
        var l = lum(getComputedStyle(el).getPropertyValue('--primary-background-color'));
        if (l !== null) return l < 0.5 ? 'dark' : 'light';
      } catch (_) {}
    }
    return null;
  }

  /* ---- detect (priority: session toggle → addon option → Canvas → HA var → OS) ---- */
  function detect() {
    // Session-only manual override (in-app button). Cleared on reload.
    if (_override === 'light' || _override === 'dark') return _override;

    // Add-on Configuration tab option (auto | light | dark)
    if (window.ADDON_THEME === 'light' || window.ADDON_THEME === 'dark') return window.ADDON_THEME;

    var s = detectFromCanvas();
    if (s) return s;

    s = detectFromHAVar();
    if (s) return s;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* ---- apply ---- */
  function apply(scheme) {
    _current = scheme;
    document.body.classList.toggle('light', scheme === 'light');
    if (window.state) window.state.theme = scheme;
    var t = window.t || function (nl, en) { return nl; };
    var label = scheme === 'light' ? ('◑ ' + t('Licht', 'Light')) : ('◐ ' + t('Donker', 'Dark'));
    var btn   = document.getElementById('btn-theme');
    if (btn)   btn.textContent = label;
    var btnFe = document.getElementById('btn-theme-fe');
    if (btnFe) btnFe.textContent = label;
  }

  /* ---- session-only manual toggle (not persisted) ---- */
  function toggle() {
    var cur = document.body.classList.contains('light') ? 'light' : 'dark';
    _override = cur === 'light' ? 'dark' : 'light';
    _current = null;
    apply(detect());
  }

  /* ---- init + poll for live HA switches ---- */
  function init() {
    apply(detect());

    // Fetch the add-on Configuration option (auto/light/dark)
    fetch('api/info').then(function (r) { return r.json(); }).then(function (info) {
      if (info && info.theme) { window.ADDON_THEME = info.theme; _current = null; apply(detect()); }
    }).catch(function () {});

    setInterval(function () {
      if (_override) return;          // honour the session override until reload
      var s = detect();
      if (s !== _current) apply(s);
    }, 500);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!_override) { _current = null; apply(detect()); }
    });
  }

  window.haTheme = { toggle: toggle, detect: detect, apply: apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
