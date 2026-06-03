<img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/eink_studio/icon.png" width="120" align="right" alt="E-ink Studio">

# E-ink Studio

**A WYSIWYG editor for ESPHome e-ink displays — design your layout visually and
generate the ESPHome `lambda:` + matching YAML. No more hand-counting pixels.**

Drag elements onto a paper-accurate canvas, bind them to live Home Assistant
sensor values, preview the 1-bit (or tri-colour red) result, and copy the
generated code straight into your ESPHome device config.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/E-ink-Studio-Editor-Screenshot.png" alt="E-ink Studio editor — dark mode" width="100%">
</p>

---

## ✨ What you can do

- 🎨 **Drag-and-drop canvas** — text, values, MDI icons, lines, rectangles,
  circles/ovals, triangles, Wi-Fi icons, refresh clocks, graphs and combined
  icon+value widgets.
- 🔄 **Rotate & resize** shapes with on-canvas handles; fill them or keep them
  outlined.
- 📡 **Live Home Assistant data** — pick real entities from a searchable list
  and preview their current values while you design (read-only).
- 🖤 **1-bit e-ink preview** — see exactly how it renders on a black/white or
  tri-colour panel.
- 🔤 **Fonts & colours** — manage Google/local fonts and the tri-colour palette.
- 🧩 **Value sources** — map entities to placeholders and preview their states.
- 📐 **Multi-select** — Ctrl/Shift-click and rubber-band selection to move,
  duplicate or delete groups at once.
- 🗂️ **Built-in file manager** with a text editor (undo/redo) for the add-on
  storage, reachable over SAMBA.
- 🌓 **Light / dark** and 🇬🇧 **English / 🇳🇱 Dutch** — follow Home Assistant
  automatically or fix them in the options.
- 📴 **Fully offline** — Konva, js-yaml, MDI and all fonts are bundled.

---

## 🚀 Quick start

1. Open **E-ink Studio** from the sidebar.
2. Click **○ Live** (top bar) to pull your real Home Assistant entities.
3. In **Value sources → From Home Assistant**, search and add the sensors you
   want to show.
4. Drag elements onto the canvas and bind each value element to a source.
5. Click **&lt;/&gt; Generate YAML**, then **Copy** or **Download** and paste it
   into your ESPHome device config.

---

## 📸 Screenshots

### Editor — light & dark theme

The editor follows your Home Assistant theme automatically (or you can fix it in
the options).

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/E-ink-Studio-Editor-Screenshot-Lightmode.png" alt="E-ink Studio editor — light mode" width="100%">
</p>

### Built-in file manager

Browse, upload, download, rename, move and delete the add-on storage — projects,
fonts and profiles — straight from the sidebar.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/E-ink-Studio-File-Manager-Screenshot1.png" alt="E-ink Studio file manager" width="100%">
</p>

### File manager — text editor

A built-in text editor with undo/redo for tweaking YAML and config files in place.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/E-ink-Studio-File-Manager-Editor.png" alt="E-ink Studio file manager — text editor" width="100%">
</p>

### File manager — font viewer

Double-click any TTF/OTF/WOFF to preview the actual typeface before you use it.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/E-ink-Studio-File-Manager-Font-Viewer.png" alt="E-ink Studio file manager — font viewer" width="100%">
</p>

---

## 🧾 Example output

A temperature readout becomes something like:

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

## ⚙️ Configuration

| Option | Values | Description |
|--------|--------|-------------|
| `language` | `auto` · `nl` · `en` | UI language. `auto` follows Home Assistant. |
| `theme` | `auto` · `light` · `dark` | Colour theme. `auto` follows Home Assistant. |

---

## 🗄️ Storage & SAMBA

Projects, fonts and profiles live in the add-on config folder, reachable over
SAMBA at `\\<HA-IP>\addon_configs\<slug>_eink_studio\`:

```
projects/   ← saved designs (.json)
fonts/      ← uploaded fonts
profiles/   ← profile settings (.json)
```

Edit and back them up from your computer, or use the built-in **📁 Files**
manager inside the editor.

---

## ⚠️ Good to know

- The add-on **does not** write to your ESPHome config — you copy the generated
  YAML yourself (preview-only by design).
- The graph preview shows a sample wave; the **real history is drawn on the
  device** by ESPHome. Y-axis numbers appear once you set a fixed Y-min/Y-max.
- For an exact font preview, upload your TTF via **Fonts & colours**. Material
  Design Icons (v7.4.47) is built in.

---

*Source & issues: [github.com/Cl3tus/HA-Eink-Studio-App](https://github.com/Cl3tus/HA-Eink-Studio-App)*
