# Changelog

Only the highlights are kept here. The full history lives in the
[Git commit log](https://github.com/Cl3tus/HA-Eink-Studio-App/commits/main).

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
