'use strict';
/* HA theme sync — shared by index.html and files.html.
   HA's applyThemesOnElement() toggles a "dark" attribute on <html>:
     element.toggleAttribute("dark", darkMode)
   That is the canonical signal. We watch it with a MutationObserver.
   Fallbacks cover the case where the attribute isn't set yet on first load. */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';

  /* ---- detection ---- */
  function detect() {
    // 1. Manual override (toggle button)
    var m = localStorage.getItem(LS_MANUAL);
    if (m === 'dark' || m === 'light') return m;

    try {
      var root = window.parent.document.documentElement;

      // 2. HA primary signal: 'dark' attribute on <html>
      //    Set by applyThemesOnElement(document.documentElement, …, {dark: bool})
      if (root.hasAttribute('dark')) return 'dark';

      // 3. If HA has already applied a theme (CSS vars present) but no 'dark' attr → light
      var hasBg = getComputedStyle(root)
        .getPropertyValue('--primary-background-color').trim();
      if (hasBg) return 'light';

      // 4. color-scheme stylesheet value (some HA versions)
      var cs = getComputedStyle(root).colorScheme;
      if (cs === 'dark' || cs === 'light') return cs;

      // 5. <home-assistant> custom element also gets the attribute
      var ha = window.parent.document.querySelector('home-assistant');
      if (ha && ha.hasAttribute('dark')) return 'dark';
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
    var cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS_MANUAL, cur === 'light' ? 'dark' : 'light');
    apply(detect());
  }

  /* ---- HA changed: clear manual override ---- */
  function onHAChange() {
    localStorage.removeItem(LS_MANUAL);
    apply(detect());
  }

  /* ---- watchers ---- */
  function watch() {
    try {
      var root = window.parent.document.documentElement;
      // Watch for the 'dark' attribute being added / removed by HA
      new MutationObserver(onHAChange).observe(root, {
        attributes: true,
        attributeFilter: ['dark', 'class']
      });
      // Also watch <home-assistant> element
      var ha = window.parent.document.querySelector('home-assistant');
      if (ha) {
        new MutationObserver(onHAChange).observe(ha, {
          attributes: true,
          attributeFilter: ['dark']
        });
      }
    } catch (_) {}

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
