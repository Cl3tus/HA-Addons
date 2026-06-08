# Changelog

Only the highlights are kept here. The full history lives in the
[Git commit log](https://github.com/Cl3tus/HA-Eink-Studio-App/commits/main).

## 3.4.0
- **Figma-style rulers + guide lines**: ruler strips along the canvas edges; drag from ruler to create a guide line; right-click to remove; clear all via toolbar button.
- **Bring to front / send to back** + **step forward / step backward** buttons added to the canvas toolbar (between alignment and undo/redo).
- **Language toggle** now re-renders all open panels, inspector, and the font modal immediately — no reload needed.
- **Font editor**: Save now warns when the "Add font" form has unsaved data (filled but not yet clicked +).
- **Text alignment removed** from text, value, MDI icon, Refresh Time and Wi-Fi icon inspectors — anchor is always CENTER; section renamed to **Position**.
- **New profile defaults** simplified to two fonts: `font_small` (Roboto 400 25px) + `font_mdi_small` (MDI 30px).

## 3.3.1
- Profile dropdown re-sorts on every change (no reload needed).
- Refresh clock renamed to **Refresh Time** in palette + default element name.
- Clock text-offset X now auto-scales with the icon size; added dedicated X/Y offset fields.
- MDI path field greyed out in Font Source (path shown, not editable).
- Layer drag auto-scrolls the list near the top/bottom edge.
- Click-through uses pixel-accurate hit-test (getAllIntersections).
- QR: **Name & ID** section at the top of the inspector.
- Graph legend label is now a **dropdown of your sources** (or "no sources").
- Prefix/suffix presets localized (gem/avg etc.).

## 3.3.0
- Profiles are listed **alphabetically (numbers first)** in both the top-bar and
  Profile-settings dropdowns.
- **Layers**: drag-reorder now shows an **insertion line** above/below the row and
  can reach the very top/bottom reliably.
- **Click-through selection**: click again on the same spot to step to the element
  *under* the current one (cycles through everything stacked there).
- New elements default to **CENTER** alignment.
- **QR**: scale stepper, a custom **ID** field for the `qr_code:` component, and the
  preview inverts (dark bg) when the QR colour is white so it stays visible.
- **Graph**: trace colour via swatches, thickness stepper, duplicate Duration removed
  from “general”, clearer per-trace legend labels (Source → Label).
- **Value**: Round-to-N-decimals fixed (no longer fights the builder decimals),
  decimals/factor steppers, prefix/suffix list now has **Custom…** second + more
  prefixes, and a printf-format help link.
- **Refresh clock**: separate X/Y text offsets (steppers); horizontal offset
  auto-scales with the icon size so the time doesn’t overlap big icons; the time text
  now uses a text font (not the icon font).
- Adding an **MDI icon / clock / Wi-Fi** element auto-ensures an MDI font (size 30) so
  nothing shows as tofu. **MDI Fonts** is the 2nd Font-Source option.
- ▲/▼ steppers across all **Position & Size** fields and the font editor size/weight.

## 3.2.4
- **Real QR preview**: the editor now renders the actual QR code (bundled
  qrcode-generator), so both the pattern and the size match the device.
- **▲/▼ steppers everywhere on Position & Size** (X, Y, width, height, radii, sides)
  and on the **font editor** size/weight — fields stay editable.
- **Circle with lock ratio** keeps radius X and Y equal when you change one.
- **MDI icon font** is now a **Font Source** option (set your own id + size, fixed
  bundled path) instead of a separate button.
- Note: a mouse text-selection in the YAML drawer can still be dropped by the browser
  if you drag outside the window/iframe — use **Kopieer** for a reliable full copy.

## 3.2.3
- **Gauge** preview now matches the device: a 180° half-ring (top), outlined track,
  filling from the **left over the top** by the fill % (50% = left half). Gauges no
  longer show a rotation handle (they can't rotate).
- **QR code** preview is now sized like the device: the real module count (QR version
  for the content + ECC) × scale, with an estimated-size hint in the inspector.

## 3.2.2
- Generated-YAML drawer: copying now keeps the **blank lines** between blocks, and
  while the drawer is open only its text is selectable (a drag-copy can't grab the
  rest of the page).
- **▲/▼ stepper buttons** on the polygon **sides** and the **radius** fields (the
  field stays editable; sides stay ≥ 3).
- **Font Editor is transactional**: changes apply only on **Save**; **Cancel** or the
  **✕** discards them (so an accidental delete is no longer permanent).
- New **“+ MDI icon font”** button to re-add the bundled Material Design Icons font
  if it was deleted.

## 3.2.1
- Polygon **sides** field now shows up/down stepper arrows; minimum 3, no upper cap.
- **Drag-select over a big backdrop element** now rubber-bands the objects on top of
  it instead of moving the backdrop (click still selects it; once selected you can
  drag to move it).
- **Profile settings** stays open on **Save** (just refreshes the name + switch
  dropdown) and on **Delete** (switches to the first profile).
- Version number moved to sit after "Lambda Generator" (grey).
- Save/Open tooltips simplified to "Save project" / "Open project".
- Note: the YAML drawer can't physically slow the mouse selection near the base64
  line, so that line stays visually fenced off (gap + divider) as the stop cue.

## 3.2.0
- **Fix build error** on rotated polygons: `regular_polygon` now uses the correct
  ESPHome signature (`VARIATION_POINTY_TOP` + rotation degrees).
- **Layer order = draw order**: the generated lambda now emits elements in the
  layers-panel order, so reordering layers changes z-order on the canvas *and* in
  the YAML (drag the ⠿ handle in Layers).
- **Marquee select** now only grabs elements **fully inside** the box — a big
  background rectangle is no longer caught when selecting things on top of it.
- **Font usage**: only fonts actually used by an element are written to the YAML
  (fixes the "unable to determine height" error from unused icon fonts); the Font
  Editor shows an **in use / unused** column and lists unused fonts.
- **Profile switch dropdown** in Profile settings (no need to go back to the top bar).
- Version number shown (grey) under "E-ink Studio".
- Save toast/tooltips now say **profile** and show `profiles/<name>.json`.
- The base64 recovery line in the YAML drawer is fenced off (gap + divider + dimmed)
  so manual selection has a clear place to stop.
- Note: ESPHome's `line/rectangle/circle/triangle` are 1px only — outline thickness
  is not configurable, so it is left as-is.

## 3.1.8
- **No more tofu on typed text**: Google-Fonts and Web fonts now always include the
  full printable-ASCII set (ESPHome downloads them in full anyway), plus any special
  characters the design uses (e.g. `°`). Editing text no longer needs a clean rebuild
  to pick up newly-typed letters. Local TTF / icon / 7-segment fonts keep their exact
  glyph set.

## 3.1.7
- The main **Save / Open** now use the JSON **`profiles/`** folder (the editable
  design), not `projects/`. Open switches to a design if it's already loaded, else
  pulls it in.
- The **Generate YAML** drawer gained **Open** and **Save** buttons working on the
  **`projects/`** folder: Save writes `projects/<profile>.yaml`, Open browses saved
  `.yaml` files and restores the design from the recovery code.

## 3.1.6
- Lighter line-number gutter in the generated-YAML drawer for better readability.

## 3.1.5
- The generated YAML is now also saved to **`projects/<profile>.yaml`** (visible in
  the file manager / over SAMBA) when you open the code drawer or download — the
  editable design JSON already lives in `profiles/`.
- **Line numbers** in the generated-YAML drawer (a non-selectable gutter, so they're
  never copied or downloaded).
- **Legend labels** are now editable per trace right in the *Graph — legend* section
  (empty = the sensor id, e.g. `cubewatt`).
- The graph **duration (hours)** is mirrored into *Graph — axes & labels* with a note
  that the X-scale runs from −duration (start) to 0 (now).

## 3.1.4
- **NaN values now render `---`** instead of `nan`: numeric value elements emit an
  `isnan()` guard, so an unavailable sensor shows three dashes (which every digit /
  7-segment font has) — no more letters forced into number fonts.
- **Graph legend tofu fixed properly**: the legend fonts now get the full printable
  ASCII set (names/values/units are drawn by ESPHome itself), and the glyphs are
  collected into the exact font the generator emits (name_font falls back to the
  first font, value_font to the name font).

## 3.1.3
- **Fix build failure** introduced in 3.1.1: the legend glyph collection no longer
  force-adds guessed unit symbols (`² ³ µ Ω …`). ESPHome hard-fails when a font lacks
  a listed glyph, so a legend value font like GothamRnd broke the config.
- `nan`/`inf` glyphs are still added to text fonts, but **never** to digit/7-segment
  display fonts (which lack letters and would also fail the build).

## 3.1.2
- Font editor titled **“Font Editor”**; fonts are grouped by source (local/uploaded,
  Google, Web, MDI) under each other.
- The bundled **MDI** icon font is now editable (id + size) and its preview shows
  **real MDI icons** under a **Preview** heading.
- **Font Source** dropdown reordered & renamed: Local Fonts · Google Fonts · Web Fonts,
  with a note that `.ttf .otf .woff .pcf .bdf` are allowed.

## 3.1.1
- **Graph legend tofu fixed**: each trace now always gets a `name:` when the legend
  is on, and those glyphs (plus numbers/units) are added to the legend's fonts — no
  more boxes.
- **`nan` glyphs**: dynamic fonts always include the `nan`/`inf` letters, so an
  unavailable sensor shows `nan` instead of a missing-glyph box.
- **Font sources**: added **Web font (URL)** (`type: web`) next to Google Fonts and
  local TTF, with a browse link per source (Google Fonts / Fontsource).
- **Font editor**: the bundled MDI icon font is now editable too (size only).
- Add-font form: labels above size / family / weight and a **Font Source** label.
- Legend X/Y note that they are pixel numbers, not text.

## 3.1.0
- **Font editor**: edit existing fonts (id, size, weight, family, type, file). Renaming
  an id updates every element, graph axis and legend that uses it.
- **Graph legend**: full `legend:` support (name/value font, border, show_lines,
  show_values, show_units, direction) drawn with `it.legend()`, plus a per-trace
  **name** and a live legend preview on the canvas.
- **Raw printf glyphs**: literal characters in a raw format (e.g. `°` in `%.1f°C`) are
  now added to the font's `glyphs:`, so they no longer render as a missing-glyph box.
- Builder ↔ raw printf now clears the other mode's leftover prefix/suffix/format.
- Profile → Generated YAML Blocks: deselected pin/SPI values stay visible (greyed) and
  are remembered; `ignore_strap` / `inverted` are no longer auto-deselected.
- Tooltips on the font library (weight/family/id), boot params and the format fields.
- Removed the invalid `STEPLINE` graph line type (ESPHome only has SOLID/DOTTED/DASHED).

## 3.0.2
- New **app icon** and a **banner** header (shown in About, Documentation and the
  GitHub README).
- Added an MIT **LICENSE**, license badge, and a `.gitattributes` for consistent
  line endings.

## 3.0.1
- File manager: the tree now starts **fully expanded** (every folder open) on load.
- Supported architectures trimmed to **aarch64** and **amd64** (matches the badges).
- Docs: embedded all screenshots and a dark/light hero image.

## 3.0.0
First stable release. Highlights of everything that landed during 2.x:

- **Elements**: text, value (sensor + format/transform), MDI icon, line, rectangle,
  circle, triangle, polygon, ring, gauge, QR code, graph, refresh clock, Wi-Fi icon.
- **Editing**: grid snap to the visible pixels, multi-select, layers (reorder /
  hide / rename / delete), alignment of the whole selection, undo/redo, duplicate,
  and **cut/copy/paste** that also works between the main and waiting screen.
- **Values**: live HA data, number/bool/time/date transforms, weekday & month names
  (NL/EN), a **custom date/time format**, and prefix/suffix with auto-spacing.
- **Conditions (if/else)** per element and a separate **waiting-for-data** screen.
- **Fonts**: Google + local TTF (upload, dedupe, preview); MDI bundled and seeded
  into `fonts/`.
- **YAML generator** with **per-block toggles** (refresh logic, globals, font, color,
  sensor, text_sensor, SPI, and each display pin) and a **base64 recovery code** for
  round-tripping; resizable code drawer.
- **Import** of existing ESPHome configs, reverse-engineering the display lambda back
  into editable elements, with an import summary.
- Built-in **file manager** (tree, multi-select, text editor, font preview) + SAMBA.
- **Profiles** with duplicate and a model picker that fills native width/height.
- **NL/EN** + **light/dark** following Home Assistant, custom tooltips, fully offline.
- Hardening: date/time helper blocks are length-guarded so an empty/unknown value at
  boot can no longer crash the device.

## 2.x
Iterative development of all of the above. See the Git history for details.
