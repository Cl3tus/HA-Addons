<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/eink_studio/banner.png" alt="E-ink Studio" width="100%">
</p>

# E-ink Studio — Documentation

**A visual editor for ESPHome e-paper displays.** Design your layout visually,
bind it to live Home Assistant values, and generate the ESPHome `lambda:` + the
matching YAML blocks. No more hand-counting pixels.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/E-ink-Studio-Editor-Screenshot-Dark-Light.png" alt="E-ink Studio editor — dark & light" width="100%">
</p>

---

## 🚀 Quick start

1. Open **E-ink Studio** from the sidebar.
2. Click **○ Live** (top bar) to pull your real Home Assistant entities.
3. In **Bronnen / Sources → From Home Assistant**, search for and add the sensors
   you want to show.
4. Drag a **Value** element onto the canvas and bind it to a source; set its format
   and transform in the inspector on the right.
5. Click **&lt;/&gt; Generate YAML**, then **Copy** or **Download** and paste it into
   your ESPHome device config.
6. Put your local TTF fonts in your ESPHome config `fonts/` folder.

---

## 🧭 The interface

- **Top bar** — profile picker, *Import YAML*, *Sources*, *Fonts*, *Files*, *Live*
  (+ refresh & interval), theme, language, *Save / Open*, *Generate YAML*.
- **Left panel** — the **element palette** (drag onto the canvas) and the **Layers**
  list (reorder by dragging the handle, toggle visibility 👁, rename by double-click,
  delete 🗑).
- **Canvas toolbar** — screen selector (Waiting / Main / extra screens) with
  add / duplicate / rename / delete buttons, the device rotation read-out (↻ 90°),
  **alignment**, **layer order** (bring to front / send to back / step forward /
  step backward), undo/redo, copy/cut/paste, duplicate, delete.
- **Canvas status bar** (sticky, bottom of the canvas) — **zoom** (− / editable % field
  / + / *Fit*), **grid** + grid size, **Ruler**, **Snap grid** and **Snap ruler**.
- **Right panel (inspector)** — all properties of the selected element.

Hover any button for a tooltip (NL/EN).

### Zoom

The zoom field is editable: type a percentage and press **Enter**, or use **−/+**
(they snap to the nearest 10 %). **Fit** scales the canvas to the available space.
Maximum zoom is 500 %. When the canvas is bigger than the viewport the area scrolls.

---

## 🧱 Elements

| Element | What it is |
|---------|------------|
| **Text** | Static text only. |
| **Value** | A Home Assistant sensor value with format & transform. |
| **MDI icon** | A Material Design Icon. |
| **Line / Rectangle / Circle / Triangle / Polygon / Ring / Gauge** | Shapes (outline or filled where applicable). |
| **QR code** | Generated on the device via `qr_code:`. |
| **Graph** | A sensor-history graph via `graph:`. |
| **Refresh clock** | A `strftime` timestamp of the last refresh. |
| **Wi-Fi icon** | Signal-strength icon driven by `wifisignal`. |

Drag from the palette onto the canvas. Select with a click; **rubber-band** select
by dragging on the empty canvas (or in the margin around it); add to a selection
with **Ctrl/Shift-click**, or tick the checkboxes in the **Layers** list.

In the layers list, **T** marks a text element and **#** marks a value.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/Palette-Layers.png" alt="Element palette and layers" width="100%">
</p>

### Moving, aligning & snapping

- Drag elements on the canvas. With **Snap grid** on they align to the **grid lines**
  (grid size 8/10/16/20/25/40 px). Hold **Shift** to move freely.
- Nudge with the **arrow keys** (Shift = 10 px).
- The **alignment** buttons move the *whole selection* to the left/right/center or
  top/bottom/middle of the panel.
- The **layer-order** buttons change stacking: bring to front / send to back and
  step one forward / backward. Stacking equals the order in the **Layers** list.
- Clicking a stack of overlapping elements selects the **topmost** one (the highest
  in the Layers list); pick a lower one from the Layers list.

### Rulers & guide lines (Figma-style)

Turn on **Ruler** in the status bar to get rulers along the top and left edges.

- **Drag out of a ruler** to drop a **guide line** (top ruler → vertical guide, left
  ruler → horizontal guide). A blue line appears on the canvas while you drag.
- Drag a guide's **marker** in the ruler to reposition it; **right-click** a marker
  to remove that guide, or right-click an empty ruler for *Remove guides*.
- Guides are **per profile** and saved with the design.
- With **Snap ruler** on, an element snaps its **visible-ink edges** to the guides —
  exactly where its pixels start, not the looser font box. Both axes snap
  independently, so you can lock onto a vertical *and* a horizontal guide at once
  (snap into the cross where two guides meet). Hold **Shift** to bypass.
- **Snap grid** and **Snap ruler** are mutually exclusive — enabling one disables the
  other. The guide lines sit *behind* your elements so they never cover your design.

### Conditions (if/else)

Every element can have a **condition** based on a source. Per branch you can hide
the element or override its colour — the studio emits a proper
`if (…) { … } else { … }` in the lambda.

---

## 📊 Values, format & transforms

Select a **Value** element → inspector → **Source** + **Format & transform**.

- **Source** — pick a Home Assistant sensor.
- **Format (Builder)** — prefix, suffix and decimals. A **space is added before the
  suffix automatically** (`1065` + `L/u` → `1065 L/u`); `°`, `%`, `‰` stay attached.
- **Format (Raw printf)** — full control over the format string.
- **Transforms**
  - *Numbers*: round to N decimals, scale (× factor).
  - *on/off*: map to your own labels.
  - *Time*: `HH:MM`, `HH:MM:SS` (works with or without a date prefix).
  - *Dates*: `YYYY-MM-DD`, `DD-MM-YYYY`, `DD/MM/YYYY`, `DD-MM`, `DD/MM`.
  - **Custom format** — type a pattern with tokens and a NL/EN choice for names:
    `{wd} {wday} {mon} {month} {dd} {mm} {yyyy} {yy} {hh} {min} {ss}`.
    Example: `{wd} {dd} {mon}` → **Zo 19 apr** / **Sun 19 Apr**.

> Date/time transforms assume an **ISO** value (`YYYY-MM-DD` / `HH:MM:SS` /
> `YYYY-MM-DD HH:MM:SS`) as Home Assistant provides. Set a realistic **sample**
> value on the source to see the live preview.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/Inspector-Value.png" alt="Inspector — value element" width="100%">
</p>

---

## 🔌 Live Home Assistant data

Click **○ Live** to fetch the current states (read-only, via the Supervisor API).

- **↻** refreshes now; the dropdown sets **auto-refresh** (off / 1–30 min / custom).
- When Live is on, value elements and condition previews follow the real states.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/Sources-Picker.png" alt="Value sources picker" width="100%">
</p>

### Sources & type detection

Open **Sources** to map each source to an `id`, an `entity_id`, a **sample** value and
a **type (lambda)** (number / bool / time / string — how the lambda reads it).

- With **Live** on, each row also shows the **type (HA)** that Home Assistant detects
  from the entity's domain, `device_class` and live value (green ✓ when it matches your
  dropdown, red ✗ + the detected type when it doesn't).
- A per-row **↺** snap icon (just left of the row's ✕) appears only on a mismatch and
  sets that row to what HA detects; **Detect types** fixes them all at once. Your manual
  dropdown still wins — HA's type is only a suggestion.
- The **sample** column is **off by default** and its show/hide choice is saved per
  profile. Samples drive the preview when Live is off.

This catches the classic "an `ai_task`/string entity marked as a number" mistake before
it reaches a graph trace or the ESPHome build.

---

## 🔤 Fonts & colours

Open **Fonts**:

- Add **Google Fonts** or **local TTF/OTF** (upload directly). Click a loaded font
  id for an inline preview.
- **Weight** is a named dropdown (Thin 100 … Black 900) and there's an **Italic**
  checkbox for Google Fonts (emits `italic: true`). The edit-font preview updates
  **live** as you change the size, weight or italic — Roboto and Noto Sans Display are
  bundled as **variable fonts**, so every weight 100–900 previews distinctly.
- The same TTF filename is uploaded only once (de-duplicated).
- **Material Design Icons** (v7.4.47) is bundled and also placed in your `fonts/`
  folder so you can replace it with your own build.
- **Download Fonts (.zip)** — the button bottom-left of the Fonts dialog bundles your
  whole `fonts/` folder into one archive; unpack it into ESPHome's `config/fonts/` by
  hand. The add-on never writes into the ESPHome config itself (that would need a broad
  read/write mount into another add-on's config — a security risk we avoid).
- **Colours** follow the display's colour type (mono / black-white-red / 7-colour)
  automatically — set the model in **Profile settings**.

---

## 🖼️ Screens

Every design has a **Main** screen and an optional **Waiting-for-data** screen (shown
until the first data arrives after boot). Switch between them with the selector above
the canvas; turn the waiting screen on/off in **Profile settings → Use waiting screen**.

### Multiple screens (Home Assistant–switchable)

Turn on **Use multiple screens** in Profile settings to design **up to 10** separate
screens, each with its own elements. The selector above the canvas then shows
**add / duplicate / rename / delete** buttons. With two or more screens the generated
YAML branches per screen and adds your chosen Home Assistant controls — pick them under
**Profile settings → Generated YAML Blocks → Screen control in HA**:

- **Dropdown (select)** — a template `select` whose options are your screen names.
- **Buttons** — one template `button` per screen (handy on a dashboard).
- **Both** — the dropdown *and* the buttons.
- **None** — no HA controls; the screen select stays `internal: true` so the display
  still works while you drive it from your own automations.

Switching a screen forces an immediate redraw, independent of new sensor data.
**Screen rotation (HA switch)** (same panel) adds a template `switch` exposed to Home
Assistant that advances to the next screen on every refresh interval — no
`input_boolean` or `configuration.yaml` edit needed. Single-screen designs generate
exactly the same YAML as before, and your existing layout migrates into the first
screen automatically (the recovery code round-trips all screens).

---

## ⚙️ Profile settings

Open the **⚙** next to the profile picker.

- **Profile name**, **model** (the colour palette adapts; for known panels the
  **width/height** are pre-filled to the native resolution, rotation-aware),
  **rotation**, **width/height**, **canvas background** (preview only).
- **Use waiting screen** on/off.
- **Use multiple screens** on/off (remembered per profile) — off gives a single
  screen and hides the add/duplicate/rename/delete buttons; on enables the full
  multi-screen controls (see *Screens* above).
- **Negative mode** on/off (per profile) — fills the screen with the ink colour and
  draws everything in the paper colour, i.e. a black screen with white content. The
  canvas preview turns dark with a light grid and the YAML gets an `it.fill(...)`
  with the two base colours swapped.
- **Generated YAML Blocks** — choose exactly which blocks the generator emits:
  - **Refresh logic** (`esphome` on_boot + `script` + `time`) with boot priority,
    delay, wait timeout and the refresh interval (minutes).
  - **Screen control in HA** (dropdown / buttons / both / none) and **Screen rotation
    (HA switch)** — greyed out unless *Use multiple screens* is on (see *Screens*).
  - **globals**, **font**, **color**, **sensor**, **text_sensor** — each on/off.
  - **SPI bus** (`clk_pin` / `mosi_pin`).
  - **Display pins** — `data_rate`, `cs_pin` (+ ignore_strapping), `dc_pin`,
    `busy_pin` (+ inverted), `reset_pin`, `reset_duration` — each individually
    on/off.
- **Save** stays greyed out until you change something. The footer has **Duplicate
  profile** / **Delete profile** on the left and **Close** / **Save** on the right
  (the copy gets `(1)`, `(2)`, …).

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/Profile-Yaml-Blocks.png" alt="Profile settings — generated YAML blocks" width="100%">
</p>

---

## 🧾 Generate YAML

Click **&lt;/&gt; Generate YAML** to open the (resizable) code drawer.

- **Pre-flight check** — if any layer points at a missing/empty source (which would
  make ESPHome fail with `Couldn't find ID 'undefined'`), a missing condition/graph
  source, or a missing font, a popup lists exactly which layers are wrong and on which
  screen. Click a row to jump to that element, or **Generate anyway**.
- **Copy** / **Download .yaml**.
- The **base64 recovery code** at the bottom (`# eink-editor:v…:`) stores your full
  editable design. Paste that YAML back via **Import YAML** to restore everything
  exactly — keep the checkbox on if you want round-tripping.

Example output for a temperature readout:

```yaml
font:
  - file:
      type: gfonts
      family: Roboto
      weight: 400
    id: font_small
    size: 25

display:
  - platform: waveshare_epaper
    id: eink_display
    model: 7.50in-bV3
    rotation: 90°
    update_interval: never
    lambda: |-
      it.printf(120, 60, id(font_small), color_text, TextAlign::TOP_CENTER,
                "%.1f °C", id(aquarium_temp).state);
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/Generate-YAML.png" alt="Generate YAML drawer" width="100%">
</p>

---

## 📥 Import YAML

Paste an existing ESPHome config:

- Only `font:`, `color:` and `homeassistant`-platform `sensor:` / `text_sensor:`
  blocks are read; everything else (wifi, api, secrets, …) is ignored — no errors.
- The studio also **reverse-engineers the `display:` lambda** into editable elements
  (standard `it.*` calls with literal coordinates) and shows a **summary** of what
  was and wasn't imported, and which **YAML blocks** are present.
- A YAML the studio generated itself (with the recovery code) is restored **1-to-1**.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/Import-Summary.png" alt="YAML import summary" width="100%">
</p>

---

## 🗂️ File manager

Open **📁 Files** (or `files.html`):

- **Tree** view, **fully expanded by default** (collapse a folder to hide its files).
- **Multi-select** with row checkboxes; upload, download, rename, move, delete.
- Built-in **text editor** (undo/redo) and **font preview** (double-click a TTF).
- The same storage is reachable over **SAMBA** (see below).

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/en/File-Manager.png" alt="File manager" width="100%">
</p>

---

## ⌨️ Shortcuts

| Key | Action |
|-----|--------|
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+D | Duplicate |
| Ctrl+C / Ctrl+X / Ctrl+V | Copy / Cut / Paste (paste keeps position on another screen) |
| Ctrl+A | Select all (or select the YAML when the code drawer is open) |
| Del / Backspace | Delete selection |
| Arrows (Shift = 10 px) | Nudge |
| Shift while dragging | Bypass grid/ruler snap |

---

## 🔧 Configuration (add-on options)

| Option | Values | Description |
|--------|--------|-------------|
| `language` | `auto` · `nl` · `en` | UI language. `auto` follows Home Assistant. |
| `theme` | `auto` · `light` · `dark` | Colour theme. `auto` follows Home Assistant. |

Both can also be toggled live inside the editor.

## 🗄️ Storage & SAMBA

Projects, fonts and profiles live in the add-on config folder, reachable over SAMBA
at `\\<HA-IP>\addon_configs\<slug>_eink_studio\`:

```
projects/   ← saved designs (.json)
fonts/      ← uploaded fonts (incl. the bundled MDI ttf)
profiles/   ← profile settings (.json)
```

Edit and back them up from your computer, or use the built-in **📁 Files** manager.

---

## 📈 Graphs & legend

A **Graph** draws one or more sensor traces via ESPHome's `graph:`. Per trace you set
the sensor, line type, thickness and colour. Enable **Draw legend** to render a
separate legend box; per trace you can give a **custom label** (free text — empty uses
the sensor id), and choose the name/value fonts, whether to show values/units, the
direction and the legend position.

---

## 🎯 Pixel-accurate placement

The canvas mirrors the device: text and icons are positioned on the font's **real
baseline** inside its full line-height box (read from the font metrics), exactly like
ESPHome's `TextAlign`. What you see in the editor lines up 1-to-1 with the e-paper,
including decorative display fonts and icon fonts.

---

## ⚠️ Good to know

- The add-on **does not** write to your ESPHome config — you copy the generated YAML
  yourself (preview-only by design).
- The **graph** preview shows a sample wave; the real history is drawn on the device
  by ESPHome. Y-axis numbers appear once you set a fixed Y-min/Y-max.
- For an exact font preview, upload your TTF via **Fonts**.
- **Icon (MDI) fonts** generate only the icons you actually use; they carry no
  text/digit glyphs (adding those would fail the ESPHome build).
- Date/time name transforms generate a small helper block in the lambda (with a
  length guard, so an empty/unknown value at boot can't crash the device).

---

*Source & issues: [github.com/Cl3tus/HA-Eink-Studio-App](https://github.com/Cl3tus/HA-Eink-Studio-App)*
