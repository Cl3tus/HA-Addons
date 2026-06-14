# Changelog

Only the highlights are kept here — minor version bumps are folded into the theme they
belong to. The full, per-commit history lives in the
[Git commit log](https://github.com/Cl3tus/HA-Eink-Studio-App/commits/main).

## 3.9.30 — Screenshots

- All documentation screenshots are in place: the **bilingual wiki** now embeds images on
  every page (English → `docs/screenshots/en/`, Nederlands → `docs/screenshots/nl/…-NL`),
  including detail shots (negative mode, type mismatch, weight preview, pre-flight, screen
  controls, settings footer). The README and Documentation tab were repointed to the new
  `en/` images.

## 3.9.29 — Upload button height (exact)

- The font-upload button now copies the **exact (sub-pixel) height** of the adjacent text
  input at runtime, so it lines up perfectly regardless of font/emoji rendering.

## 3.9.27 — Font Editor polish

- Font-upload button height nudged to line up with the *path* input.
- The font **preview** header now says *cursief* in Dutch (was "italic").

## 3.9.25 — Font Editor upload button

- The font-upload button (*Choose file / Bestand kiezen*) now matches the height of the
  adjacent *path* input, so the row lines up (the 📁 emoji no longer makes it taller).

## 3.9.24 — Screen button name & Dutch labels

- The generated per-screen **`button`** is now named *`<device> <screen>`* (e.g. *Scherm 1*)
  instead of *`<device> Show <screen>`* — the English "Show" is dropped so the Dutch name
  reads naturally.
- Font Editor: the **Italic** label is now *Cursief* in Dutch, and the *grootte (size)*
  label is just *grootte*.

## 3.9.23 — Fixes & Dutch polish

- **Ruler guides are easy to move again.** Clicking on (or right next to) an existing guide
  now grabs and moves it instead of dropping a second guide on top; clicking elsewhere on
  the ruler still adds a new one.
- **The main screen can no longer be deleted** in multi-screen mode, and **deleting a screen
  is undoable** — Ctrl+Z (or Undo) brings the whole screen back.
- **Switching profiles closes the Generate-YAML drawer** (it showed the old profile's code).
- **Profile settings:** the *Screen control in HA / rotation* block now sits above the
  *Refresh logic* block.
- **Negative mode round-trips on import** — it's stored in the recovery code and detected
  from an `it.fill(...)` in a foreign lambda.
- **Dutch/i18n polish in the Font Editor:** localized the file-upload button (no more native
  "Choose File / No file chosen"), *Weight → Gewicht* with translated options (Dun … Zwaar),
  and the *Font Source* field no longer truncates. Graph inspector dropdowns (line type, show
  values, direction) are translated, and the generated rotation `switch` is named *Scherm
  rotatie* in Dutch.

## 3.9.22 — Docs refresh

- Renamed the editor from a "WYSIWYG editor" to a **visual editor** throughout the docs,
  READMEs and add-on description (EN + NL).
- Brought the **Documentation tab, READMEs and wiki** up to date with the current
  features (multiple screens, negative mode, the HA screen controls & rotation switch,
  font weight/italic, source type detection).
- The **wiki is now split per language**: a language picker chooses English or Nederlands
  and every page exists as a single-language `-EN` / `-NL` page, with a one-click switch at
  the top and a per-language sidebar.

## 3.9.x — Multiple screens, negative mode, fonts & sources

- **Multiple screens** (up to 10), **switchable from Home Assistant**: the display lambda
  branches per screen and you pick the HA control — a template `select`, one `button` per
  screen, **both**, or **none** (the select stays `internal` so your own automations can
  drive it). An optional **screen rotation switch** advances to the next screen each
  refresh interval. Existing layouts migrate into the first screen and the recovery code
  round-trips every screen.
- **Negative mode** (per profile): a black screen with white content — `it.fill(...)` plus
  the two base colours swapped, with a dark canvas preview and a light grid.
- **Font weight & italic** are first-class now: a named **weight** dropdown
  (Thin 100 … Black 900) and an **Italic** toggle for Google Fonts. Roboto and Noto Sans
  Display ship as **variable fonts**, so every weight 100–900 (and italic) renders
  distinctly on the canvas and in the live edit preview.
- **Source type detection.** With Live on, each source shows the type Home Assistant
  detects (number / bool / time / string) next to your lambda type, with a one-click
  **↺ snap** and a **Detect types** button. A graph trace bound to a non-numeric source
  is flagged before flashing (that combination can crash the ESPHome graph). The Sources
  table was also tidied — reordered columns, a per-row snap icon, and an optional sample
  column saved per profile.
- **No native browser pop-ups left.** Every confirm/prompt (delete profile/font, file
  manager, screen rename, custom refresh interval) is an in-app dialog that matches the UI.
- **Profile-settings polish:** Save stays greyed out until you change something; the footer
  is Duplicate / Delete (left) and Close / Save (right); more canvas-background presets; the
  grid stays visible on dark/custom backgrounds; and the device rotation (↻ 90°) shows next
  to the screen selector.
- **Honest history:** the 3.9.3/3.9.4 "bootloop fix" turned out to be an unrelated ESPHome
  graph bug (a trace on a non-numeric `ai_task` entity), not a studio problem.

## 3.4–3.7 — Rulers, guides & a theme-aware UI

- **Figma-style rulers + guide lines** with **pixel-perfect snapping** to the visible ink —
  snap into the **cross** of a vertical and horizontal guide at once. Guides are per profile
  and sit behind your elements.
- **Sticky status bar** with editable zoom (to 500 %), grid size, ruler and snap toggles;
  snap-grid / snap-ruler are remembered per profile and survive a refresh.
- **Accent & guide colours follow the Home Assistant theme**, and selection styling is
  unified across every element type.
- **Pre-flight check on Generate YAML** — lists any layer with a missing source, condition/
  graph source or font before the code drawer opens.
- **Download Fonts (.zip)** — grab your whole `fonts/` folder for ESPHome's `config/fonts/`
  (the add-on never writes into another add-on's config).

## 3.6 — Pixel-accurate placement & MDI glyphs

- Text and icons are positioned on the font's **real baseline**, matching the e-paper 1-to-1;
  the refresh clock is optically centred next to its icon.
- **MDI icon fonts generate only their icons** (no text/digit glyphs) — fixes the
  *"Font … is missing N glyphs"* build error; older profiles auto-migrate, and the default
  text font id is the stable `font_small`.

## 3.1–3.3 — Fonts, graphs & YAML output

- **Font editor** — edit existing fonts (id, size, weight, family, type, file) with a live
  preview; Google / Web / local-upload / MDI sources.
- **Graph legend** (`it.legend`) with per-trace **custom labels**, name/value fonts, units
  and direction.
- **Layer order = draw order**, only used fonts are written, and NaN values render as `---`.
- **Real QR preview** and ▲/▼ steppers across every Position & Size field.

## 3.0.0 — First stable release

- **Elements**: text, value (sensor + format/transform), MDI icon, line, rectangle, circle,
  triangle, polygon, ring, gauge, QR code, graph, refresh clock, Wi-Fi icon.
- **Editing**: grid snap to the visible pixels, multi-select, layers (reorder / hide /
  rename / delete), alignment, undo/redo, duplicate, and cut/copy/paste that also works
  between screens.
- **Values**: live HA data, number/bool/time/date transforms, weekday & month names (NL/EN),
  a custom date/time format, and prefix/suffix with auto-spacing.
- **Conditions (if/else)** per element and a separate waiting-for-data screen.
- **Fonts**: Google + local TTF (upload, dedupe, preview); MDI bundled and seeded into
  `fonts/`.
- **YAML generator** with per-block toggles (refresh logic, globals, font, color, sensor,
  text_sensor, SPI, and each display pin) and a base64 recovery code for round-tripping.
- **Import** of existing ESPHome configs, reverse-engineering the display lambda into
  editable elements, with an import summary.
- Built-in **file manager** (tree, multi-select, text editor, font preview) + SAMBA.
- **Profiles** with duplicate and a model picker that fills native width/height.
- **NL/EN** + **light/dark** following Home Assistant, custom tooltips, fully offline.
- Hardening: date/time helper blocks are length-guarded so an empty/unknown value at boot
  can't crash the device.

## 2.x

Iterative development of all of the above. See the Git history for details.
