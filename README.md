<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/eink_studio/banner.png" alt="E-ink Studio" width="100%">
</p>

# Home Assistant Add-on: E-ink Studio

[![GitHub release](https://img.shields.io/badge/version-3.2.1-blue)](https://github.com/Cl3tus/HA-Eink-Studio-App/releases)
[![Project Stage](https://img.shields.io/badge/project%20stage-experimental-yellow.svg)](https://github.com/Cl3tus/HA-Eink-Studio-App/releases)
[![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen.svg)](https://github.com/Cl3tus/HA-Eink-Studio-App/commits/main)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Cl3tus/HA-Eink-Studio-App/blob/main/LICENSE)

![Supports aarch64](https://img.shields.io/badge/aarch64-yes-green.svg)
![Supports amd64](https://img.shields.io/badge/amd64-yes-green.svg)

## About

E-ink Studio is a **WYSIWYG editor for ESPHome e-paper displays**, running right
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
- **Live HA data** preview, value transforms (numbers, on/off labels, time, dates,
  weekday/month names NL & EN, and a custom date/time format), prefix/suffix.
- **Conditions (if/else)** per element, a separate **waiting-for-data** screen,
  multi-select, alignment, undo/redo and **cut/copy/paste**.
- **Fonts** (Google + local TTF, with preview), colours by display type, and a
  **per-block YAML generator** with a base64 **recovery code** for round-tripping.
- **YAML import** that reads font/color/sensor blocks and reverse-engineers the
  display lambda back into editable elements.
- A built-in **file manager** (tree, text editor, font preview), also over SAMBA.
- **Light / dark** and **English / Dutch**, following Home Assistant or fixed in the
  options. Custom 1-px tooltips throughout.

See the **Documentation** tab for the full feature guide and a quick start.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/E-ink-Studio-Editor-Screenshot-Dark-Light.png" alt="E-ink Studio editor — dark & light" width="100%">
</p>

[version-badge]: https://img.shields.io/github/v/release/Cl3tus/HA-Eink-Studio-App?label=version&color=ff9800
[maintained-badge]: https://img.shields.io/badge/maintained-yes-brightgreen.svg
[aarch64-badge]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-badge]: https://img.shields.io/badge/amd64-yes-green.svg
[armv7-badge]: https://img.shields.io/badge/armv7-yes-green.svg
[armhf-badge]: https://img.shields.io/badge/armhf-yes-green.svg
[i386-badge]: https://img.shields.io/badge/i386-yes-green.svg
