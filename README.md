# Home Assistant Add-on: E-ink Studio

<img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/eink_studio/icon.png" width="110" align="right" alt="E-ink Studio">

![Version][version-badge]
![Maintained][maintained-badge]

![Supports aarch64][aarch64-badge]
![Supports amd64][amd64-badge]
![Supports armv7][armv7-badge]
![Supports armhf][armhf-badge]
![Supports i386][i386-badge]

## About

E-ink Studio is a **WYSIWYG editor for ESPHome e-ink / e-paper displays**,
running right inside Home Assistant. Instead of hand-writing and pixel-counting
`it.print()` / `it.image()` lambdas, you drag elements onto a paper-accurate
canvas, bind them to **live Home Assistant sensor values**, preview the 1-bit
(or tri-colour red) result, and **generate ready-to-paste ESPHome YAML**.

It is deliberately preview-only towards Home Assistant and ESPHome — nothing is
written to your device config or your HA states; you copy the generated YAML
yourself. Everything runs offline, with all libraries and fonts bundled.

Design text, values, MDI icons, lines, rectangles, circles/ovals, triangles,
Wi-Fi icons, refresh clocks, graphs and icon+value widgets. Rotate, resize, fill
and multi-select with on-canvas handles. Manage fonts and colours, pick real HA
entities from a searchable list, and switch light/dark and English/Dutch — all
following Home Assistant, or fixed in the options.

A built-in file manager (with a text editor) gives you access to the add-on
storage, which is also reachable over SAMBA.

[version-badge]: https://img.shields.io/github/v/release/Cl3tus/HA-Eink-Studio-App?label=version
[maintained-badge]: https://img.shields.io/badge/maintained-yes-green.svg
[aarch64-badge]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-badge]: https://img.shields.io/badge/amd64-yes-green.svg
[armv7-badge]: https://img.shields.io/badge/armv7-yes-green.svg
[armhf-badge]: https://img.shields.io/badge/armhf-yes-green.svg
[i386-badge]: https://img.shields.io/badge/i386-yes-green.svg
