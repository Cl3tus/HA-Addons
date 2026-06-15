# Changelog

Only the highlights are kept here — minor version bumps are folded into the theme they
belong to. The full, per-commit history lives in the
[Git commit log](https://github.com/Cl3tus/HA-Eink-Studio-App/commits/main).

## 3.9.57 — Fix disabled-state on canvas selection + pen size

- The greyed-out toolbar buttons now update on **every** selection change, including
  clicking an element directly on the canvas (updateToolbarState moved into
  renderInspector, which all selection paths call).
- Fonts-modal edit pen is a bit smaller so it matches the delete button.

## 3.9.56 — Disabled-state toolbar buttons + icon sizing

- Canvas toolbar buttons now **grey out when there's nothing to do**: undo/redo follow
  their history, paste follows the clipboard, and copy/cut/duplicate/delete + the
  alignment and layer-order buttons disable when no element is selected.
- "Apply what HA detects" chip and the Fonts-modal **edit (pen)** button are sized to
  match the delete button; **Sources** uses mdi-database; **Download Fonts (.zip)** uses
  a zip PNG; the zoom **fit** button is an mdi-fit-to-page icon in HA primary.

## 3.9.55 — Ctrl+wheel zoom + more icon tweaks

- **Ctrl + mouse wheel** (and trackpad pinch) now zooms the canvas toward the cursor.
- File manager "back to editor" uses a bold left arrow in HA primary; the Fonts modal
  edit (✏️) / delete (recycle-bin) icons; **Download Fonts (.zip)** gets a zip icon;
  the per-row "apply what HA detects" chip uses the same 🔍 as Detect types.
- Top bar **Sources** (mdi-database-outline) and **Fonts** icons now follow HA's
  primary colour; the **Generate YAML** `</>` badge is a touch larger.

## 3.9.54 — Unified "+" buttons (mdi-plus-thick in HA primary)

- Every add/plus button now uses **mdi-plus-thick** in HA's primary colour: new
  profile, add screen, the trace/source/font "+" add buttons, and zoom-in. Zoom-out
  matches with mdi-minus-thick so the pair stays consistent.

## 3.9.53 — More icon polish (un-pixelate bin, HA-logo, sources + file menu)

- The recycle-bin delete icon is **smooth again** (un-pixelated).
- **Undo/redo** icons now follow HA's primary colour, like the screen nav.
- **File manager**: the far-right refresh button is a square ♻️ that matches the
  theme/flag buttons; the **right-click menu** uses emoji icons (and the recycle-bin
  for delete).
- **Sources (sensor mapping)**: the *Detect types* button (🔍), the per-row delete
  (recycle-bin) and the *From Home Assistant* button (the HA logo) got icons.

## 3.9.52 — Primary-colour screen nav + red hidden-eye

- The screen-navigation icons (« ‹ › ») now follow **HA's primary colour** (`--guide`).
- In the layers panel the **hidden** state (eye-off) is now **red** instead of grey;
  the visible eye stays blue.

## 3.9.51 — Replace tofu emoji with MDI icons; blue eye; icon tweaks

- The emoji that showed as empty squares on some systems are now crisp **MDI icons**:
  screen navigation (« ‹ › »), undo/redo (editor + file editor), Fonts, and the
  file-manager "back to editor" arrow.
- **Layers**: the visibility toggle is now a **blue MDI eye** (eye-off when hidden),
  and the drag-to-reorder handle is a ☰ menu icon.
- **Copy** uses 📑 and **Paste** uses 📋; **Duplicate** moved to 🗂️ (matching the
  screen-duplicate icon) so it stays distinct from copy.
- The recycle-bin delete icon now renders **pixelated** (crisp pixel-art look).

## 3.9.50 — Classic recycle-bin PNG on the delete buttons

- The delete/trash buttons now use the classic Windows-style **recycle-bin PNG**
  (`www/img/recyclebin.png`, transparent) in place of the drawn SVG, everywhere a
  delete control appears.

## 3.9.49 — SVG recycle-bin, square refresh, code badge

- **Delete buttons everywhere** now use a hand-drawn **recycle-bin SVG** (grey bucket
  + green arrows, transparent background) instead of the wastebasket emoji — canvas
  toolbar, screen delete, multi-select bar, layers row, context menu and file manager.
- The **Refresh** button is now a square icon button.
- The **Generate YAML** button uses an SVG `</>` code badge instead of plain text.

## 3.9.48 — Compacter top bar (fits the longer Dutch labels)

- Tighter spacing throughout the top bar (smaller gaps, button padding and profile
  picker) so the right-hand buttons — up to **Generate YAML** — stay on screen in
  Dutch instead of overflowing to the right.

## 3.9.47 — Top-bar sizing + nicer flags + recycle icon

- **Proper Union Jack** (counterchanged diagonals) and a correctly-proportioned Dutch
  flag, drawn larger so they match the other buttons.
- **All top-bar buttons share one height** now (icon-only ones no longer look smaller),
  and **Live + Refresh** are an equal-sized pair. The **Refresh** button uses a ♻️
  recycle icon.
- The **brand title** (E-ink Studio / Lambda Generator / version) no longer gets
  squeezed or shifted when switching to Dutch — it and the profile picker keep their
  size while the toolbar takes the slack.

## 3.9.46 — Crisp SVG flags + yin-yang (render the same on every OS)

- The **language toggle** now uses **hand-drawn SVG flags** (Union Jack / Dutch
  tricolour) instead of flag emoji — those showed as plain "GB"/"NL" letters on
  Windows. The **theme toggle** uses an **SVG yin-yang** with a subtle rim so it
  reads on both light and dark, replacing the flat ☯ emoji.

## 3.9.45 — Emoji polish: theme/language, paste, modal crosses, context menu

- **Theme toggle** now shows a ☯️ yin-yang; **language toggle** shows a flag (🇬🇧 / 🇳🇱).
- **Paste** uses 📥 instead of the pushpin; **Sources** is now 🛢️; the **new-profile (➕)**
  and **profile-settings (⚙️)** buttons got emoji too.
- **Modal/drawer close buttons** are now square instead of rectangular.
- **Right-click menu** items are aligned in clean icon + label columns, and **Rename**
  has an **F2** shortcut (works from the canvas and the layers panel).

## 3.9.44 — Colourful emoji toolbar icons

- The toolbar buttons now use **colourful emoji** instead of flat monochrome glyphs:
  top bar (import/sources/fonts/files/save/open/refresh), screen navigation (⏮️ ◀️ ▶️ ⏭️),
  screen add/duplicate/rename/delete, undo/redo, duplicate, copy/cut/paste, delete,
  and the file-manager toolbar + text editor.
- **Alignment and layer-order** buttons (which have no good emoji) switched to **tinted
  MDI icons** — alignment in blue, layer order in purple — so the groups read at a glance.
- Modal/drawer **close crosses** are now a red ❌.
- The left element palette and the layers panel are intentionally left unchanged.

## 3.9.43 — Guides: ruler-only dragging + per-screen

- Guides are now dragged **only on the ruler**; on the canvas the blue lines are decorative
  (no longer clickable, no hover cursor).
- **Guides are stored per screen** — each designed screen (and the waiting screen) keeps its
  own guides. With multiple screens you can place different guides per page.
- **Duplicating a page copies its guides** along with the elements.
- Existing profile-level guides are migrated onto the main screen.

## 3.9.42 — « stops at page 1 first

- The **« (first)** screen-nav button now jumps to **page 1** (the first designed screen)
  instead of straight to the waiting screen; you only reach the waiting screen by going back
  once more from page 1 (another « or a ‹).

## 3.9.41 — Drag guides on the canvas + page indicator

- **Guides are now grabbed and dragged directly on the canvas** — hover the blue line, then
  drag it (a wide hit area, exact Konva stage coordinates). This finally fixes the
  "can't move a guide / it keeps making new ones" problem; the ruler still drops new guides.
- **`|` separator between the « ‹ › » nav and the +/⧉/✎/🗑 screen buttons.**
- **Page indicator** in the bottom status bar, next to the rotation read-out: *Page: 2/4*
  (current designed screen / total), shown with multiple screens.

## 3.9.40 — Toolbar layout, refresh greying & guide grab

- **Ruler guides are reliably movable now** — each guide has a full-height invisible grab
  strip on the ruler, so picking one up never depends on hitting the tiny triangle (fixes the
  "first guide can't be moved / a new one appears instead" bug).
- **Refresh-logic field greying.** Boot priority / delay / wait timeout follow the **esphome
  on_boot** block; the interval follows the **time** block; everything greys when Refresh
  logic is off (values kept). Unticking all three sub-blocks turns Refresh logic off; turning
  it back on restores them.
- **Canvas toolbar tidy-up.** The «‹›» screen-nav buttons now sit before the +/⧉/✎/🗑 buttons,
  the two separators around the old rotation read-out are gone, and the **device-rotation
  read-out moved to the bottom status bar** (*Screen Rotation: 90°*).

## 3.9.39 — Mode-switch & screen-control tweaks

- **Screen Rotation** is generated **automatically** with ≥2 screens (the separate "Screen
  rotation" checkbox is gone). The **Screen controls in HA** dropdown moved **under Use
  multiple screens** (shown only when that's on) and is reordered to *None · Dropdown only ·
  Buttons only · Dropdown & buttons*.
- The HA mode switches (Auto Refresh / Static / Rotation) now carry **`entity_category:
  config`**, so they land under **Configuration** in Home Assistant.
- **Refresh logic** can be toggled per block — **esphome on_boot**, **script** and **time**
  each have their own checkbox (greyed out when Refresh logic is off, but remembered).
- **Screen-navigation buttons** in the canvas toolbar: « ‹ › » for first / previous / next /
  last screen, framed by separators with the rotation read-out after them.

## 3.9.38 — No duplicate main screen + docs

- The display lambda no longer emits the **main screen twice**: screens 1…N are explicit
  branches and the main screen is the `else` (which is also the safe fallback), so its code
  appears once.
- **Docs updated** — the Documentation tab and the bilingual wiki now describe multiple
  screens and the interlocked **Auto Refresh / Static / Rotation** mode switches.

## 3.9.37 — Time block: derive mode from Static

- **Fixed the interval doing nothing.** The `on_time` now keys off **Static** (`!static_display`)
  instead of `refresh_screen.state`, so Auto Refresh and Rotation actually run again (and any
  odd all-off state falls back to refreshing). Static still freezes the screen; Rotation
  advances + redraws; otherwise it refreshes when there's new sensor data.

## 3.9.36 — Mode-switch interlock fix (no loop)

- **Fixed the three mode switches.** Every interlock action is now guarded by an `if` on the
  target's state, so an optimistic ESPHome switch can't re-fire its own trigger — no more
  infinite `turn_on`/`turn_off` loop. The rules now hold reliably: Auto Refresh ↔ Static flip
  (rotation may ride along with Auto Refresh), Rotation forces Auto Refresh on + Static off,
  Static forces both off, and exactly one is always on (default Auto Refresh, restored on boot).
- The interval log now states whether it refreshed or skipped (no new sensor data).

## 3.9.35 — Interlocked display-mode switches + diagnostics

- **Three interlocked HA "display mode" switches** are generated with the refresh logic:
  **Auto Refresh** (periodic, default on), **Static Display** (freeze) and — with ≥2 screens
  and the rotation option — **Screen Rotation**. They're mutually exclusive and **exactly one
  is always on**: turning Static on turns the others off; turning Auto Refresh / Static off
  flips to the other; Rotation turns Static off and Auto Refresh on. The `on_time` only acts
  while Auto Refresh is on (Static = frozen), and Rotation advances + redraws.
- **Diagnostic `Profile` text_sensor** with the profile name, so you can still tell displays
  apart in Home Assistant.
- **Removed the profile-name prefix** from every generated entity name (select, buttons,
  switches and the diagnostic sensors) — ESPHome already prefixes with the device name.

## 3.9.34 — Static Display switch & rotation fix

- **New "Static Display" HA switch** (Profile settings → Generated YAML Blocks, needs refresh
  logic). When **on**, the screen freezes (no refresh); when **off**, the display refreshes
  **every interval — even without new sensor data**. Generated as a template `switch`
  (`static_display`), exposed to HA like the rotation switch.
- **Fixed screen rotation.** The rotation branch now advances the select *and* forces a
  redraw (`component.update`) instead of relying on the select's guarded `on_value`, so
  rotating actually changes the screen each interval. Rotation + static now share one
  `switch:` block.

## 3.9.33 — Escape closes modals

- **Escape now cancels/closes any popup** (the × or Cancel button) — pairs with Enter for the
  default action.

## 3.9.32 — Guide grabbing & Enter in modals

- **Moving an existing ruler guide is reliable now.** A click within ~12 px of a guide grabs
  and moves it (along the whole ruler, not just the tiny marker), so you no longer
  accidentally drop new guides; clicking further away still adds one. Both the marker and the
  ruler use the same drag path now.
- **Enter triggers a modal's default (accent) action.** In every popup, pressing Enter
  activates the highlighted button (Save / OK / …) — textareas keep their newline, and inputs
  that already handle Enter are respected.

## 3.9.31 — Negative-mode colour swatches

- In **negative mode** the inspector colour swatches now match what you actually see: the
  highlighted swatch reflects the on-screen colour, and picking *white* gives white text
  (the editor was showing/storing the un-swapped colour, so it looked inverted). Applies to
  every element, graph traces and condition colour overrides. The generated YAML is
  unchanged — only the editor display/picking was corrected.

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
