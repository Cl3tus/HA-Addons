'use strict';
/* HA theme sync — shared by index.html and files.html.
   DEBUG MODE: logs what it finds in the parent document to the browser
   console (prefix [EinkTheme]) so we can see what HA actually sets. */
(function () {
  var LS_MANUAL = 'eink_studio_theme_manual';

  /* ---- debug: dump everything we can read from the parent ---- */
  function debugDump(label) {
    try {
      var root = window.parent.document.documentElement;
      var body = window.parent.document.body;
      var ha   = window.parent.document.querySelector('home-assistant');
      console.group('[EinkTheme] ' + label);
      console.log('html.hasAttribute(dark)          :', root.hasAttribute('dark'));
      console.log('html.getAttribute(dark)           :', root.getAttribute('dark'));
      console.log('html.getAttribute(data-color-scheme):', root.getAttribute('data-color-scheme'));
      console.log('html.className                    :', root.className);
      console.log('html.style.colorScheme            :', root.style.colorScheme);
      console.log('getComputed(html).colorScheme     :', getComputedStyle(root).colorScheme);
      console.log('body.hasAttribute(dark)           :', body.hasAttribute('dark'));
      console.log('body.className                    :', body.className);
      console.log('body.style.colorScheme            :', body.style.colorScheme);
      console.log('getComputed(body).colorScheme     :', getComputedStyle(body).colorScheme);
      console.log('--primary-background-color        :', getComputedStyle(root).getPropertyValue('--primary-background-color').trim());
      console.log('ha element dark attr              :', ha ? ha.hasAttribute('dark') : 'not found');
      console.log('ha element class                  :', ha ? ha.className : 'not found');
      console.groupEnd();
    } catch (e) {
      console.log('[EinkTheme] ERROR reading parent:', e);
    }
  }

  /* ---- detection ---- */
  function detect() {
    var m = localStorage.getItem(LS_MANUAL);
    if (m === 'dark' || m === 'light') return m;

    try {
      var root = window.parent.document.documentElement;
      var body = window.parent.document.body;
      var ha   = window.parent.document.querySelector('home-assistant');

      // Try every known mechanism
      if (root.hasAttribute('dark')) return 'dark';

      var attr = root.getAttribute('data-color-scheme');
      if (attr === 'dark' || attr === 'light') return attr;

      for (var el of [root, body]) {
        if (el.classList.contains('dark')) return 'dark';
        if (el.classList.contains('light')) return 'light';
      }

      var csRoot = getComputedStyle(root).colorScheme;
      if (csRoot === 'dark' || csRoot === 'light') return csRoot;

      var csBody = getComputedStyle(body).colorScheme;
      if (csBody === 'dark' || csBody === 'light') return csBody;

      if (ha && ha.hasAttribute('dark')) return 'dark';

      // --primary-background-color luminance
      var bg = getComputedStyle(root).getPropertyValue('--primary-background-color').trim();
      if (bg) {
        var nums = bg.match(/\d+/g);
        if (nums && nums.length >= 3) {
          var lum = (0.299 * +nums[0] + 0.587 * +nums[1] + 0.114 * +nums[2]) / 255;
          return lum < 0.5 ? 'dark' : 'light';
        }
      }
    } catch (_) {}

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* ---- apply ---- */
  function apply(scheme) {
    console.log('[EinkTheme] applying:', scheme);
    if (window.state) window.state.theme = scheme;
    if (window.applyTheme) {
      window.applyTheme();
    } else {
      document.body.classList.toggle('light', scheme === 'light');
    }
    var btn = document.getElementById('btn-theme-fe');
    if (btn) btn.textContent = scheme === 'light' ? '◑ Licht' : '◐ Donker';
  }

  function toggle() {
    var cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS_MANUAL, cur === 'light' ? 'dark' : 'light');
    apply(detect());
  }

  function onHAChange() {
    console.log('[EinkTheme] HA change detected');
    debugDump('after HA change');
    localStorage.removeItem(LS_MANUAL);
    apply(detect());
  }

  /* ---- watchers ---- */
  function watch() {
    try {
      var root = window.parent.document.documentElement;
      var body = window.parent.document.body;
      var ha   = window.parent.document.querySelector('home-assistant');
      var opts = { attributes: true, attributeFilter: ['dark', 'class', 'data-color-scheme', 'style'] };
      new MutationObserver(onHAChange).observe(root, opts);
      new MutationObserver(onHAChange).observe(body, opts);
      if (ha) new MutationObserver(onHAChange).observe(ha, { attributes: true });
    } catch (_) {}

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!localStorage.getItem(LS_MANUAL)) apply(detect());
    });
  }

  /* ---- init ---- */
  function init() {
    debugDump('on load');
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
