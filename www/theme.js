'use strict';
/* HA theme sync — zelfde aanpak als ESPHome dashboard (v2023.6.0+).
   Gebruikt prefers-color-scheme van de browser/OS.
   HA "Donker" zet ook de OS dark mode voorkeur, waardoor dit automatisch klopt. */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';
  var _mq       = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---- huidige kleurvoorkeur ---- */
  function detect() {
    var m = localStorage.getItem(LS_MANUAL);
    if (m === 'dark' || m === 'light') return m;
    return _mq.matches ? 'dark' : 'light';
  }

  /* ---- toepassen op editor én bestandsbeheer ---- */
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

  /* ---- handmatige toggle (bestandsbeheer-knop) ---- */
  function toggle() {
    var cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS_MANUAL, cur === 'light' ? 'dark' : 'light');
    apply(detect());
  }

  /* ---- volg OS/browser-voorkeur live ---- */
  function init() {
    apply(detect());
    _mq.addEventListener('change', function () {
      localStorage.removeItem(LS_MANUAL); // OS-wijziging wint van handmatige override
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
