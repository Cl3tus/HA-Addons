'use strict';
/* i18n — E-ink Studio
   Auto-detects from navigator.language (nl-* → Dutch, else → English).
   Override: localStorage key 'eink_studio_lang' = 'nl' | 'en'.
   Usage in JS  : t('Nederlandse tekst', 'English text')
   Usage in HTML: data-i18n="Nederlandse tekst"  (NL text is the key)   */
(function () {
  var LS_LANG = 'eink_studio_lang';

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
    'MDI-icoon': 'MDI icon',
    'Lijn': 'Line',
    'Rechthoek': 'Rectangle',
    'Cirkel': 'Circle',
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
    'Naam': 'Name',
    'Grootte': 'Size',
    'Gewijzigd': 'Modified',
    'Deze map is leeg.': 'This folder is empty.',
    'Sleep bestanden hierheen of gebruik': 'Drop files here or use',
  };

  /* ---- detect / store ----
     Priority: addon Configuration option → in-app toggle → HA lang → browser */
  function detectLang() {
    // Add-on Configuration tab option (auto | nl | en)
    if (window.ADDON_LANGUAGE === 'nl' || window.ADDON_LANGUAGE === 'en') return window.ADDON_LANGUAGE;

    // In-app toggle (localStorage)
    var stored = localStorage.getItem(LS_LANG);
    if (stored === 'en' || stored === 'nl') return stored;

    // Auto: HA sets lang on <html> ("en", "en-GB", "nl", "nl-NL", …)
    try {
      var haLang = (window.parent.document.documentElement.getAttribute('lang') || '').toLowerCase();
      if (haLang) return haLang.startsWith('nl') ? 'nl' : 'en';
    } catch (_) {}

    // Browser fallback
    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return nav.startsWith('nl') ? 'nl' : 'en';
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
    // Update lang-toggle button labels
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.textContent = _lang === 'nl' ? 'EN' : 'NL';
      btn.title       = _lang === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands';
    });
  }

  /* ---- toggle ---- */
  window.setLang = function (l) {
    _lang = l;
    window.APP_LANG = l;
    localStorage.setItem(LS_LANG, l);
    applyTranslations();
  };
  window.toggleLang = function () {
    window.setLang(_lang === 'nl' ? 'en' : 'nl');
  };

  /* ---- re-evaluate language once the addon option is known ---- */
  function refresh() {
    var l = detectLang();
    if (l !== _lang) { _lang = l; window.APP_LANG = l; }
    applyTranslations();
  }
  window.haRefreshLang = refresh;

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
