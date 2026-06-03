<img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/eink_studio/icon.png" width="110" align="right" alt="E-ink Studio">

# Home Assistant Add-on: E-ink Studio

WYSIWYG editor for ESPHome e-ink displays — design your layout and generate the
lambda + YAML.

![Supports aarch64][aarch64-badge]
![Supports amd64][amd64-badge]
![Supports armv7][armv7-badge]
![Supports armhf][armhf-badge]
![Supports i386][i386-badge]

---

## About

E-ink Studio is a visual designer for ESPHome e-paper / e-ink displays, running
right inside Home Assistant. Instead of hand-writing and pixel-counting
`it.print()` / `it.image()` lambdas, you **drag elements onto a paper-accurate
canvas**, bind them to **live Home Assistant sensor values**, preview the 1-bit
(or tri-colour red) result, and **generate ready-to-paste ESPHome YAML**.

It is deliberately **preview-only** towards Home Assistant and ESPHome: nothing
is written to your device config or your HA states — you copy the generated YAML
yourself. Everything runs offline; all libraries and fonts are bundled.

**Highlights**

- 🎨 Drag-and-drop canvas: text, values, MDI icons, lines, rectangles,
  circles/ovals, triangles, Wi-Fi icons, refresh clocks, graphs and widgets.
- 🔄 Rotate, resize, fill and multi-select shapes with on-canvas handles.
- 📡 Live HA data: pick real entities from a searchable list and preview them.
- 🖤 True 1-bit e-ink preview (black/white + tri-colour red).
- 🔤 Manage Google/local fonts and the colour palette.
- 🗂️ Built-in file manager with a text editor (undo/redo), reachable over SAMBA.
- 🌓 Light/dark theme and 🇬🇧 English / 🇳🇱 Dutch — follow Home Assistant or fix
  them in the options.
- 📴 Fully offline (Konva, js-yaml, Material Design Icons, fonts all bundled).

---

## Installation

1. Add this repository to your add-on store (button on the GitHub README), or go
   to **Settings → Add-ons → Add-on Store → ⋮ → Repositories** and add
   `https://github.com/Cl3tus/HA-Eink-Studio-App`.
2. Find **E-ink Studio** in the store and click **Install**.
3. Start the add-on and open it from the sidebar.

---

## How to use

1. Open **E-ink Studio** in the sidebar.
2. Click **○ Live** (top bar) to pull your real Home Assistant entities.
3. In **Value sources → From Home Assistant**, search and add the sensors you
   want to show.
4. Drag elements onto the canvas and bind each value element to a source.
5. Click **&lt;/&gt; Generate YAML**, then **Copy** or **Download** and paste it
   into your ESPHome device config.

### Example output

```yaml
font:
  - file: "fonts/Roboto-Regular.ttf"
    id: font_klein
    size: 25

display:
  - platform: waveshare_epaper
    model: 7.50in-bv3
    lambda: |-
      it.printf(120, 60, id(font_klein), color_text, TextAlign::TOP_CENTER,
                "%.1f °C", id(aquarium_temp).state);
```

The editor also emits the matching `sensor:`, `color:` and (for graphs)
`graph:` blocks.

---

## Configuration

| Option | Values | Description |
|--------|--------|-------------|
| `Language` | `Auto` · `Nederlands` · `English` | UI language. `Auto` follows Home Assistant. |
| `Theme` | `Auto` · `Light` · `Dark` | Colour theme. `Auto` follows Home Assistant. |

Both can also be toggled on the fly from inside the editor; that is a temporary
(session-only) override — on the next launch the add-on option applies again.

---

## Storage & SAMBA

Projects, fonts and profiles live in the add-on config folder, reachable over
SAMBA at `\\<HA-IP>\addon_configs\<slug>_eink_studio\`:

```
projects/   ← saved designs (.json)
fonts/      ← uploaded fonts
profiles/   ← profile settings (.json)
```

---

## Good to know

- The add-on does **not** write to your ESPHome config — you copy the generated
  YAML yourself (preview-only by design).
- The graph preview shows a sample wave; the **real history is drawn on the
  device** by ESPHome. Y-axis numbers appear once you set a fixed Y-min/Y-max.
- For an exact font preview, upload your TTF via **Fonts & colours**. Material
  Design Icons (v7.4.47) is built in.

---

## Support

Got a question or found a bug? Open an issue on
[GitHub](https://github.com/Cl3tus/HA-Eink-Studio-App/issues).

## License

Distributed under the terms of the repository's license. UI available in English
and Dutch. Built with [Konva](https://konvajs.org/),
[js-yaml](https://github.com/nodeca/js-yaml) and
[Material Design Icons](https://pictogrammers.com/library/mdi/).

[aarch64-badge]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-badge]: https://img.shields.io/badge/amd64-yes-green.svg
[armv7-badge]: https://img.shields.io/badge/armv7-yes-green.svg
[armhf-badge]: https://img.shields.io/badge/armhf-yes-green.svg
[i386-badge]: https://img.shields.io/badge/i386-yes-green.svg
