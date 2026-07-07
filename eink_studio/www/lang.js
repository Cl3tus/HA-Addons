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
    'Kleuren': 'Colours',
    'Kleuren hernoemen': 'Rename colours',
    'Waardebronnen (sensoren) beheren': 'Manage value sources (sensors)',
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
    'Elementen inspector': 'Elements inspector',
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
    'Scherm toevoegen': 'Add screen',
    'Scherm dupliceren': 'Duplicate screen',
    'Scherm hernoemen': 'Rename screen',
    'Scherm verwijderen': 'Delete screen',
    'Eerste scherm': 'First screen',
    'Vorig scherm': 'Previous screen',
    'Volgend scherm': 'Next screen',
    'Laatste scherm': 'Last screen',
    'Schermrotatie': 'Screen rotation',
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
    'Base64 Herstel Code': 'Base64 Restore Code',
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
    'Bestanden uploaden naar deze map': 'Upload files to this folder',
    'Nieuwe map aanmaken': 'Create a new folder',
    'Geselecteerd item hernoemen': 'Rename the selected item',
    'Verplaatsen naar een andere map': 'Move to another folder',
    'Bestand downloaden': 'Download file',
    'Geselecteerde items verwijderen (Del)': 'Delete selected items (Del)',
    'Sleep om breder/smaller te maken': 'Drag to resize wider/narrower',
    /* --- tooltips: topbar --- */
    'ESPHome-YAML importeren': 'Import ESPHome YAML',
    'Waardebronnen (sensoren) beheren': 'Manage value sources (sensors)',
    'Fonts beheren': 'Manage fonts',
    'Project opslaan': 'Save project',
    'Project openen': 'Open project',
    'Genereer de ESPHome-YAML': 'Generate the ESPHome YAML',
    /* --- tooltips: palette --- */
    'Statische tekst': 'Static text',
    'Sensorwaarde met format & transform': 'Sensor value with format & transform',
    'Material Design Icon': 'Material Design Icon',
    'Rechthoek (open of gevuld)': 'Rectangle (outline or filled)',
    'Cirkel / ovaal': 'Circle / oval',
    'Regelmatige veelhoek': 'Regular polygon',
    'Ring (gevuld)': 'Ring (filled)',
    'Meter / voortgang': 'Gauge / progress',
    'Grafiek (sensor-history)': 'Graph (sensor history)',
    'Refresh-tijdstempel': 'Refresh timestamp',
    'WiFi-signaal icoon': 'Wi-Fi signal icon',
    /* --- tooltips: zoom + align --- */
    'Uitzoomen': 'Zoom out',
    'Inzoomen': 'Zoom in',
    'Passend in beeld': 'Fit to view',
    'Links uitlijnen': 'Align left',
    'Horizontaal centreren': 'Center horizontally',
    'Rechts uitlijnen': 'Align right',
    'Boven uitlijnen': 'Align top',
    'Verticaal centreren': 'Center vertically',
    'Onder uitlijnen': 'Align bottom',
    /* --- tooltips: guides --- */
    'Lineaal': 'Ruler',
    'Snap raster': 'Snap grid',
    'Snap lineaal': 'Snap ruler',
    /* --- tooltips: layer order --- */
    'Naar voren (bovenste laag)': 'Bring to front',
    'Één stap naar voren': 'Step forward',
    'Één stap naar achteren': 'Step backward',
    'Naar achteren (onderste laag)': 'Send to back',
    /* --- tooltips: actions --- */
    'Ongedaan maken (Ctrl+Z)': 'Undo (Ctrl+Z)',
    'Opnieuw (Ctrl+Y)': 'Redo (Ctrl+Y)',
    'Dupliceren (Ctrl+D)': 'Duplicate (Ctrl+D)',
    'Kopiëren (Ctrl+C)': 'Copy (Ctrl+C)',
    'Knippen (Ctrl+X)': 'Cut (Ctrl+X)',
    'Plakken (Ctrl+V)': 'Paste (Ctrl+V)',
    'Verwijderen (Del)': 'Delete (Del)',
    'Element verwijderen (Del)': 'Delete element (Del)',
    'Profiel opslaan': 'Save profile',
    'Profiel openen': 'Open profile',
    'Toon of verberg het raster': 'Show or hide the grid',
    'Toon of verberg de linealen': 'Show or hide the rulers',
    'Elementen tijdens slepen vastklikken op het raster': 'Snap elements to the grid while dragging',
    'Elementen tijdens slepen vastklikken op de hulplijnen': 'Snap elements to the guides while dragging',
    'Huidige pagina / scherm': 'Current page / screen',
    'Standaard config': 'Default config',
    'Code importeren': 'Import Code',
    'Code importeren (YAML en/of base64-herstelcode)': 'Import code (YAML and/or Base64 restore code)',
    'Naam': 'Name',
    'Grootte': 'Size',
    'Gewijzigd': 'Modified',
    'Deze map is leeg.': 'This folder is empty.',
    'Sleep bestanden hierheen of gebruik': 'Drop files here or use',
  };

  var _override = null;   // manual toggle — handed off across in-app navigation only

  /* session handoff (same rationale as theme.js): carry the manual NL/EN choice
     across editor <-> file-manager navigation, but reset to the configured
     default on a fresh entry via Home Assistant (no in-app link click). */
  function readLangHandoff() {
    try {
      var v = sessionStorage.getItem('eink:lang');
      sessionStorage.removeItem('eink:lang');
      return (v === 'nl' || v === 'en') ? v : null;
    } catch (_) { return null; }
  }
  function armLangHandoff() {
    try {
      if (_override === 'nl' || _override === 'en') sessionStorage.setItem('eink:lang', _override);
      else sessionStorage.removeItem('eink:lang');
    } catch (_) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/(?:^|\/)(?:index|files)\.html(?:[?#]|$)/.test(href)) armLangHandoff();
  }, true);

  /* ---- detect ----
     Priority:
       session handoff/toggle (in-app) → addon option (nl|en) → auto
     auto = Home Assistant's UI language, then the browser.
     A fresh entry has no handoff, so it follows the config again. */
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

  _override = readLangHandoff();   // honour a choice handed off from the other in-app page
  var _lang = detectLang();
  window.APP_LANG = _lang;

  /* ---- translate ---- */
  window.t = function (nl, en) {
    if (_lang === 'nl') return nl;
    if (en !== undefined) return en;
    return EN[nl] !== undefined ? EN[nl] : nl;
  };

  /* ---- inline SVG flags for the language toggle (the flag emoji 🇬🇧/🇳🇱 render
     as plain "GB"/"NL" letters on Windows, so we draw them ourselves) ---- */
  var FLAG_GB = '<svg class="flag" viewBox="0 0 60 30" aria-hidden="true">'
    + '<clipPath id="ujs"><path d="M0,0 v30 h60 v-30 z"/></clipPath>'
    + '<clipPath id="ujt"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>'
    + '<g clip-path="url(#ujs)">'
    + '<path d="M0,0 v30 h60 v-30 z" fill="#012169"/>'
    + '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>'
    + '<path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#ujt)" stroke="#c8102e" stroke-width="4"/>'
    + '<path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>'
    + '<path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6"/>'
    + '</g></svg>';
  var FLAG_NL = '<svg class="flag" viewBox="0 0 45 30" aria-hidden="true">'
    + '<rect width="45" height="30" fill="#fff"/>'
    + '<rect width="45" height="10" fill="#ae1c28"/>'
    + '<rect y="20" width="45" height="10" fill="#21468b"/></svg>';

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
    // language toggle buttons show the flag of the language you'll switch TO
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.innerHTML = _lang === 'nl' ? FLAG_GB : FLAG_NL;
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
    // notify app.js so it can re-render dynamic UI (inspector, modals, etc.)
    if (typeof window.onLangChanged === 'function') window.onLangChanged();
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
