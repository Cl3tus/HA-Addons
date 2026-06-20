<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/eink_studio/banner.png" alt="E-ink Studio" width="100%">
</p>

# E-ink Studio

[![GitHub release](https://img.shields.io/badge/version-3.9.96-blue)](https://github.com/Cl3tus/HA-Eink-Studio-App)
[![Project Stage](https://img.shields.io/badge/project%20stage-experimental-yellow.svg)](https://github.com/Cl3tus/HA-Eink-Studio-App)
[![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen.svg)](https://github.com/Cl3tus/HA-Eink-Studio-App/commits/main)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Cl3tus/HA-Eink-Studio-App/blob/main/LICENSE)

![Supports aarch64](https://img.shields.io/badge/aarch64-yes-green.svg)
![Supports amd64](https://img.shields.io/badge/amd64-yes-green.svg)

## About

E-ink Studio is a **visual editor for ESPHome e-paper displays**, running right
inside Home Assistant. Instead of hand-writing and pixel-counting
`it.print()` / `it.printf()` lambdas, you **drag elements onto a paper-accurate
canvas**, bind them to **live Home Assistant sensor values**, and **generate
ready-to-paste ESPHome YAML**.

It is deliberately preview-only towards Home Assistant and ESPHome — nothing is
written to your device config or your HA states; you copy the generated YAML
yourself. Everything runs offline, with all libraries and fonts bundled.

**What you get**

- A drag-and-drop canvas with text, **sensor values** (with format & transforms),
  MDI icons, lines, rectangles, circles, triangles, polygons, rings, gauges,
  QR codes, graphs, a Wi-Fi icon and a refresh clock.
- **Pixel-accurate placement** — text/icons are anchored on the real font baseline,
  so the editor matches the e-paper 1-to-1.
- **Figma-style rulers & guide lines** with **pixel-perfect snapping** to the
  visible ink — snap an element's **edges or centre** into the cross of two guides,
  with **live snap indicators** (a red bullseye marks the locked anchor), plus a
  grid + grid snap.
- **Layer order** controls (front/back/forward/backward) and a sticky **status bar**
  with editable zoom up to 500 %.
- **Live HA data** preview, value transforms (numbers, on/off labels, time, dates,
  weekday/month names NL & EN, and a custom date/time format), prefix/suffix.
- **Multiple screens** (up to 10) switchable from Home Assistant (a generated `select`,
  per-screen `button`s and an optional rotation `switch`), plus a separate
  **waiting-for-data** screen — with **Conditions (if/else)** per element, multi-select,
  alignment, undo/redo and **cut/copy/paste**.
- **Negative mode** per profile (a black screen with white content), and **source type
  detection** (number / bool / time / string) that flags a lambda↔HA mismatch.
- **Graphs** with a configurable **legend** (custom per-trace labels, fonts, units).
- **Fonts** (Google + local TTF, with live preview, a named **weight** dropdown and an
  **Italic** toggle) — plus a **Download Fonts (.zip)** button to grab them all for your
  ESPHome `config/fonts/` — colours by display type, and a **per-block YAML generator**
  with a base64 **recovery code** for round-tripping.
- **YAML import** that reads font/color/sensor blocks and reverse-engineers the
  display lambda back into editable elements.
- A built-in **file manager** (tree, text editor, font preview), also over SAMBA.
- **Light / dark** and **English / Dutch**, following Home Assistant or fixed in the
  options. Custom 1-px tooltips throughout.

See the **Documentation** tab for the full feature guide and a quick start.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/E-ink-Studio-Editor-Screenshot-Dark-Light.png" alt="E-ink Studio editor — dark & light" width="100%">
</p>

[version-badge]: https://img.shields.io/github/v/release/Cl3tus/HA-Eink-Studio-App?label=version&color=ff9800
[maintained-badge]: https://img.shields.io/badge/maintained-yes-brightgreen.svg
[aarch64-badge]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-badge]: https://img.shields.io/badge/amd64-yes-green.svg
[armv7-badge]: https://img.shields.io/badge/armv7-yes-green.svg
[armhf-badge]: https://img.shields.io/badge/armhf-yes-green.svg
[i386-badge]: https://img.shields.io/badge/i386-yes-green.svg
