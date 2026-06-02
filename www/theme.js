'use strict';
/* HA theme sync — shared by index.html and files.html.
   HA sets --primary-background-color on :root for every theme.
   We read that CSS variable and check its luminance. That is the only
   signal that reliably signals dark/light in HA 2026.x.              */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';

  /* ---- parse hex or rgb color → luminance ---- */
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
    if (isNaN(r)) return null;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  /* ---- detection ---- */
  function detect() {
    // 1. Manual override (toggle button)
    var m = localStorage.getItem(LS_MANUAL);
    if (m === 'dark' || m === 'light') return m;

    try {
      var root = window.parent.document.documentElement;

      // 2. --primary-background-color  (confirmed working in HA 2026.x)
      //    #fafafa = light, #111111 = dark
      var bg  = getComputedStyle(root).getPropertyValue('--primary-background-color').trim();
      var lum = luminance(bg);
      if (lum !== null) return lum < 0.5 ? 'dark' : 'light';

      // 3. data-color-scheme attribute (older HA)
      var attr = root.getAttribute('data-color-scheme');
      if (attr === 'dark' || attr === 'light') return attr;

      // 4. dark attribute (some HA versions)
      if (root.hasAttribute('dark')) return 'dark';
    } catch (_) {}

    // 5. OS fallback (HA "Auto" mode)
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
      // HA changes --primary-background-color by adding/swapping a <style> in <head>
      new MutationObserver(onHAChange).observe(
        window.parent.document.head,
        { childList: true, subtree: true, characterData: true }
      );
      // Also watch html element for any attribute HA might toggle
      new MutationObserver(onHAChange).observe(root, {
        attributes: true,
        attributeFilter: ['dark', 'class', 'data-color-scheme']
      });
    } catch (_) {}

    // OS preference (HA "Auto" mode)
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
