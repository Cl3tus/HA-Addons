'use strict';
/* HA theme sync — shared by index.html and files.html.
   styles.css sets: html { color-scheme: light dark }
   This makes the browser propagate HA's color-scheme into the Ingress
   iframe, so prefers-color-scheme correctly reflects HA's Light/Dark
   setting — the same technique as ESPHome webserver v3.               */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';
  var _mq       = window.matchMedia('(prefers-color-scheme: dark)');

  function detect() {
    var m = localStorage.getItem(LS_MANUAL);
    if (m === 'dark' || m === 'light') return m;
    return _mq.matches ? 'dark' : 'light';
  }

  function apply(scheme) {
    document.body.classList.toggle('light', scheme === 'light');
    if (window.state) window.state.theme = scheme;
    var btn   = document.getElementById('btn-theme');
    if (btn)   btn.textContent = scheme === 'light' ? '◑ Licht' : '◐ Donker';
    var btnFe = document.getElementById('btn-theme-fe');
    if (btnFe) btnFe.textContent = scheme === 'light' ? '◑ Licht' : '◐ Donker';
  }

  function toggle() {
    var cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS_MANUAL, cur === 'light' ? 'dark' : 'light');
    apply(detect());
  }

  function init() {
    apply(detect());
    // Update live when HA switches theme (propagated via color-scheme: light dark)
    _mq.addEventListener('change', function () {
      localStorage.removeItem(LS_MANUAL);
      apply(detect());
    });
  }

  window.haTheme = { toggle: toggle, detect: detect, apply: apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
