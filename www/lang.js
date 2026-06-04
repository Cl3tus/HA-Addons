'use strict';
/* i18n — E-ink Studio
   Language is controlled by the add-on Configuration option:
     auto (follow Home Assistant / browser) | nl | en
   Usage in JS  : t('Nederlandse tekst', 'English text')
   Usage in HTML: data-i18n="Nederlandse tekst"  (NL text is the key)   */
(function () {

  /* ---- translations: NL key → EN value ---- */
  var EN = {
    /* --- shared --- */
    'Thema': 'Theme',
    'Taal': 'Language',

    /* --- index.html topbar --- */
    'Profiel': 'Profile',
    'Nieuw profiel': 'New profile',
    'Profiel-instellingen': 'Profile settings',
    'YAML importeren': 'Import YAML',
    'Waardebronnen': 'Value sources',
    'Bronnen': 'Sources',
    'Bron': 'Source',
    'Bronnen (sensor-mapping)': 'Sources (sensor mapping)',
    'Fonts & kleuren': 'Fonts & colours',
    "Scenario's": 'Scenarios',
    'Live': 'Live',
    'Opslaan': 'Save',
    'Openen': 'Open',
    'Genereer YAML': 'Generate YAML',
    'Bestanden': 'Files',

    /* --- index.html left panel --- */
    'Elementen toevoegen': 'Add elements',
    'Tekst / waarde': 'Text / value',
    'Tekst': 'Text',
    'Waarde': 'Value',
    'Sleep om te verplaatsen': 'Drag to reorder',
    'MDI-icoon': 'MDI icon',
    'Lijn': 'Line',
    'Rechthoek': 'Rectangle',
    'Cirkel': 'Circle',
    'Driehoek': 'Triangle',
    'Veelhoek': 'Polygon',
    'Meter': 'Gauge',
    'QR-code': 'QR code',
    'Hoofdscherm': 'Main screen',
    'Wachtscherm': 'Waiting screen',
    'Wachtscherm aan': 'Waiting screen on',
    'Auto-vernieuwen uit': 'Auto-refresh off',
    'Aangepast…': 'Custom…',
    'Live data': 'Live data',
    'Vernieuw live data nu': 'Refresh live data now',
    'Live data automatisch vernieuwen': 'Auto-refresh live data',
    'Scherm': 'Screen',
    'Rastergrootte': 'Grid size',
    "Voegt onderaan een herstelcode toe. Plak die YAML later terug via 'YAML importeren' om je volledige ontwerp te herstellen.":
      "Adds a restore code at the bottom. Paste that YAML back via 'Import YAML' to restore your whole design.",
    'kleuren': 'colours',
    'Widget (icoon+waarde)': 'Widget (icon+value)',
    'WiFi-icoon': 'Wi-Fi icon',
    'Refresh-klok': 'Refresh clock',
    'Grafiek': 'Graph',
    'Lagen': 'Layers',

    /* --- index.html canvas toolbar --- */
    'Passend': 'Fit',
    'Raster': 'Grid',
    'E-ink 1-bit preview': 'E-ink 1-bit preview',
    'Afleidingsvrij': 'Focus',
    'Ongedaan maken': 'Undo',
    'Opnieuw': 'Redo',
    'Dupliceren': 'Duplicate',
    'Verwijderen': 'Delete',

    /* --- code drawer --- */
    'Gegenereerde YAML': 'Generated YAML',
    'base64-herstelcode': 'base64 restore code',
    'Kopieer': 'Copy',
    'Download .yaml': 'Download .yaml',

    /* --- file explorer --- */
    'Bestandsbeheer': 'File Manager',
    'Terug naar editor': 'Back to editor',
    'Add-on data': 'Add-on data',
    'Uploaden': 'Upload',
    'Nieuwe map': 'New folder',
    'Hernoemen': 'Rename',
    'Verplaatsen': 'Move',
    'Downloaden': 'Download',
    'Vernieuwen': 'Refresh',
    'Vernieuwen (F5)': 'Refresh (F5)',
    'Alles selecteren': 'Select all',
    'Naam': 'Name',
    'Grootte': 'Size',
    'Gewijzigd': 'Modified',
    'Deze map is leeg.': 'This folder is empty.',
    'Sleep bestanden hierheen of gebruik': 'Drop files here or use',
  };

  var _override = null;   // session-only manual toggle (NOT persisted) — resets on reload

  /* ---- detect ----
     Priority:
       session toggle (in-app button) → addon option (nl|en) → auto
     auto = Home Assistant's UI language, then the browser.
     Nothing is persisted, so after a reload it follows the config again. */
  function detectLang() {
    if (_override === 'nl' || _override === 'en') return _override;
    if (window.ADDON_LANGUAGE === 'nl' || window.ADDON_LANGUAGE === 'en') return window.ADDON_LANGUAGE;

    // auto: read HA's <html lang> from whichever ancestor frame exposes it
    var frames = [];
    try { if (window.parent && window.parent !== window) frames.push(window.parent); } catch (_) {}
    try { if (window.top && window.top !== window && frames.indexOf(window.top) === -1) frames.push(window.top); } catch (_) {}
    for (var i = 0; i < frames.length; i++) {
      try {
        var l = (frames[i].document.documentElement.getAttribute('lang') || '').toLowerCase();
        if (l) return l.indexOf('nl') === 0 ? 'nl' : 'en';
      } catch (_) {}
    }

    // browser fallback (standalone / outside ingress)
    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return nav.indexOf('nl') === 0 ? 'nl' : 'en';
  }

  var _lang = detectLang();
  window.APP_LANG = _lang;

  /* ---- translate ---- */
  window.t = function (nl, en) {
    if (_lang === 'nl') return nl;
    if (en !== undefined) return en;
    return EN[nl] !== undefined ? EN[nl] : nl;
  };

  /* ---- apply to DOM ---- */
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = window.t(key);
    });
    // tooltips: data-i18n-title="<NL text>" → translated title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.title = window.t(el.getAttribute('data-i18n-title'));
    });
    // language toggle buttons show the OTHER language as their label
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.textContent = _lang === 'nl' ? 'EN' : 'NL';
      btn.title = _lang === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands';
    });
  }

  /* ---- re-evaluate language once the addon option is known ---- */
  function refresh() {
    var l = detectLang();
    if (l !== _lang) { _lang = l; window.APP_LANG = l; }
    applyTranslations();
  }
  window.haRefreshLang = refresh;

  /* ---- session-only manual toggle (not persisted) ---- */
  window.toggleLang = function () {
    _override = (_lang === 'nl') ? 'en' : 'nl';
    refresh();
  };

  // Fetch the add-on Configuration option (auto/nl/en)
  fetch('api/info').then(function (r) { return r.json(); }).then(function (info) {
    if (info && info.language) { window.ADDON_LANGUAGE = info.language; refresh(); }
  }).catch(function () {});

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
  } else {
    applyTranslations();
  }
})();
