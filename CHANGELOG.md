# Changelog

Only the highlights are kept here. The full history lives in the
[Git commit log](https://github.com/Cl3tus/HA-Eink-Studio-App/commits/main).

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
