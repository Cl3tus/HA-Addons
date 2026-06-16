# Changelog

Only the highlights are kept here — minor version bumps are folded into the theme they
belong to. The full, per-commit history lives in the
[Git commit log](https://github.com/Cl3tus/HA-Eink-Studio-App/commits/main).

## 3.9.82 — YAML drawer: click-outside closes, stops above the status bar; label tweaks

- Clicking anywhere outside the open Generate-YAML drawer now closes it (clicks inside it,
  on the Generate button, or in a popup don't count).
- The drawer now stops **above the status bar** (grid/ruler/snap stay visible) instead of
  covering it.
- The restore-code toggle is **Base64 Herstel Code** in Dutch (Base64 Restore Code in EN);
  its header comment is bilingual and dimmed grey like the rest of the restore code.

## 3.9.81 — Bilingual default-config comments + clearer button comment

- The **Default config** boilerplate's comments are now bilingual (NL/EN), with an added
  comment above `logger:`.
- The `button:` comment adapts: **Restart ESP Button** when there are no screen buttons,
  **restart and screen-switching buttons** when screen buttons are shown (Buttons or
  Buttons + Dropdown).

## 3.9.80 — Header text per mode, wrapped restore code, wider drawer, Import Code

- The header comment adapts to the **Default config** toggle (full config vs. "paste these
  blocks"), with Generated / Profile on separate lines.
- The **Base64 restore code** is wrapped over multiple `#~ ` comment lines so it no longer
  becomes one giant line in ESPHome; the importer reassembles it (legacy single-line still
  reads). The YAML drawer is **250px wider**.
- The **Import YAML** button is now **Import Code** — it imports YAML, the Base64 restore
  code, or both at once (the modal says so).

## 3.9.79 — Source sensors grouped; per-profile default-config; renamed toggle

- Source-bound entities are now grouped under an **"# Added source sensors"** comment in
  both the `sensor:` and `text_sensor:` blocks.
- The **Default config** checkbox is remembered per profile (like the restore code).
- Renamed the restore-code toggle to **Base64 Restore Code**.

## 3.9.78 — Generated YAML: default-config block, section comments, diagnostics

- New **"Standaard config / Default config"** checkbox in the YAML drawer: prepends a
  full device boilerplate (substitutions, esphome, esp32, logger, wifi, captive_portal,
  safe_mode, web_server, ota, api) and merges the refresh `on_boot` into that single
  `esphome:` block. Off = the previous standalone `esphome: on_boot` block. Live-updates.
- The **SPI block** now sits between `esphome:` and `globals:`.
- **Section `# comments`** added before each generated block.
- Always-included diagnostics: **uptime** sensors, **wifi_info** (IP/SSID), **version**
  text sensor, a **status binary_sensor**, and a **Restart** button.

## 3.9.77 — Keyboard shortcuts keep working after switching screens

- Switching screens via the dropdown left focus on the `<select>`, so Ctrl+C / Ctrl+V /
  Del were ignored (the keydown handler skips events on inputs/selects). The select now
  loses focus after a switch, so copy/paste works across screens and the paste button
  greys correctly with the clipboard.

## 3.9.76 — Readable generated-YAML text

- The code in the Generate-YAML drawer follows the theme text colour, so it's dark
  (readable) in light mode instead of a pale grey.

## 3.9.44 – 3.9.75 — Visual overhaul: icons, top bar, editor UX & add-on options

A long run of UI-polish releases, folded together:

**Icons & colour**
- Toolbar, menu and panel icons are now colourful **emoji** plus tinted **MDI** glyphs;
  emoji that showed as empty squares were swapped for MDI. The **« ‹ › »** screen-nav,
  undo/redo and every **+** button follow HA's **primary colour**.
- The **theme** toggle is an SVG yin-yang and the **language** toggle uses hand-drawn
  SVG flags (Union Jack / Dutch tricolour), so they render the same on every OS.
- Delete controls use the classic **recycle-bin PNG**; the layers / sources / fonts
  deletes are a red cross. **Generate YAML** got a `</>` badge, plus the HA-logo, zip
  and fit-to-page icons.

**Top bar**
- Rebalanced into a boxed **brand cell** (left) · **profile** picker + Save/Open · a
  horizontally **scrollable action strip** (right-aligned, with clickable edge arrows and
  gradient fades) · **theme / language** (right). A matching **Inspector** header bar was
  added on the right, panel titles are centred, and the profile dropdown lines up with
  the screen selector below it.

**Editor UX**
- Idle toolbar buttons **grey out** based on history / clipboard / selection (undo, redo,
  paste, copy, cut, duplicate, delete, align and layer-order).
- **Ctrl + mouse wheel** (and trackpad pinch) zooms toward the cursor.
- Dragging a guide shows a live **X: / Y: px** label on top; **F2** renames the selected
  element; and tooltips were added across the toolbar and status bar.

**Add-on options**
- New Configuration options: **Live data on start**, **Live refresh interval**, **Hide
  unavailable entities** and an **Entity domains filter** — the filter runs server-side,
  so the entity count reflects it.

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
