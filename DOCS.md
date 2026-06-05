<img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/eink_studio/icon.png" width="120" align="right" alt="E-ink Studio">

# E-ink Studio — Documentation

**A WYSIWYG editor for ESPHome e-paper displays.** Design your layout visually,
bind it to live Home Assistant values, and generate the ESPHome `lambda:` + the
matching YAML blocks. No more hand-counting pixels.

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/E-ink-Studio-Editor-Screenshot.png" alt="E-ink Studio editor" width="100%">
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
- **Canvas toolbar** — screen selector (Main / Waiting), zoom −/+/Fit, grid + grid
  size, Snap, alignment, undo/redo, copy/cut/paste, duplicate, delete.
- **Right panel (inspector)** — all properties of the selected element.

Hover any button for a tooltip (NL/EN).

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

<!-- 📸 SCREENSHOT WANTED: palette-layers.png — close-up of the left panel (palette + layers) -->

### Moving, aligning & snapping

- Drag elements on the canvas; with **Snap** on they align to the **grid lines**
  (grid size 8/10/16/20/25/40 px). Hold **Shift** to move freely.
- Nudge with the **arrow keys** (Shift = 10 px).
- The **alignment** buttons move the *whole selection* to the left/right/center or
  top/bottom/middle of the panel.

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

<!-- 📸 SCREENSHOT WANTED: inspector-value.png — the inspector for a Value element (Source + Format & transform) -->

---

## 🔌 Live Home Assistant data

Click **○ Live** to fetch the current states (read-only, via the Supervisor API).

- **↻** refreshes now; the dropdown sets **auto-refresh** (off / 1–30 min / custom).
- When Live is on, value elements and condition previews follow the real states.

<!-- 📸 SCREENSHOT WANTED: sources-picker.png — the Sources modal / HA entity picker -->

---

## 🔤 Fonts & colours

Open **Fonts**:

- Add **Google Fonts** or **local TTF/OTF** (upload directly). Click a loaded font
  id for an inline preview.
- The same TTF filename is uploaded only once (de-duplicated).
- **Material Design Icons** (v7.4.47) is bundled and also placed in your `fonts/`
  folder so you can replace it with your own build.
- **Colours** follow the display's colour type (mono / black-white-red / 7-colour)
  automatically — set the model in **Profile settings**.

---

## 🖼️ Two screens

Each design has a **Main** screen and a **Waiting-for-data** screen (shown until the
first data arrives). Switch between them with the selector above the canvas. Turn
the waiting screen on/off in **Profile settings**.

---

## ⚙️ Profile settings

Open the **⚙** next to the profile picker.

- **Profile name**, **model** (the colour palette adapts; for known panels the
  **width/height** are pre-filled to the native resolution, rotation-aware),
  **rotation**, **width/height**, **canvas background** (preview only).
- **Use waiting screen** on/off.
- **Generated YAML Blocks** — choose exactly which blocks the generator emits:
  - **Refresh logic** (`esphome` on_boot + `script` + `time`) with boot priority,
    delay, wait timeout and the refresh interval (minutes).
  - **globals**, **font**, **color**, **sensor**, **text_sensor** — each on/off.
  - **SPI bus** (`clk_pin` / `mosi_pin`).
  - **Display pins** — `data_rate`, `cs_pin` (+ ignore_strapping), `dc_pin`,
    `busy_pin` (+ inverted), `reset_pin`, `reset_duration` — each individually
    on/off.
- **Duplicate profile** (the copy gets `(1)`, `(2)`, …) and **Delete profile**.

<!-- 📸 SCREENSHOT WANTED: profile-yaml-blocks.png — Profile settings with "Generated YAML Blocks" expanded -->

---

## 🧾 Generate YAML

Click **&lt;/&gt; Generate YAML** to open the (resizable) code drawer.

- **Copy** / **Download .yaml**.
- The **base64 recovery code** at the bottom (`# eink-editor:v…:`) stores your full
  editable design. Paste that YAML back via **Import YAML** to restore everything
  exactly — keep the checkbox on if you want round-tripping.

Example output for a temperature readout:

```yaml
font:
  - file: "fonts/Roboto-Regular.ttf"
    id: font_klein
    size: 25

display:
  - platform: waveshare_epaper
    id: eink_display
    model: 7.50in-bV3
    rotation: 90°
    update_interval: never
    lambda: |-
      it.printf(120, 60, id(font_klein), color_text, TextAlign::TOP_CENTER,
                "%.1f °C", id(aquarium_temp).state);
```

<!-- 📸 SCREENSHOT WANTED: generate-yaml.png — the Generate YAML drawer -->

---

## 📥 Import YAML

Paste an existing ESPHome config:

- Only `font:`, `color:` and `homeassistant`-platform `sensor:` / `text_sensor:`
  blocks are read; everything else (wifi, api, secrets, …) is ignored — no errors.
- The studio also **reverse-engineers the `display:` lambda** into editable elements
  (standard `it.*` calls with literal coordinates) and shows a **summary** of what
  was and wasn't imported, and which **YAML blocks** are present.
- A YAML the studio generated itself (with the recovery code) is restored **1-to-1**.

<!-- 📸 SCREENSHOT WANTED: import-summary.png — the import dialog and/or the import summary popup -->

---

## 🗂️ File manager

Open **📁 Files** (or `files.html`):

- Collapsible **tree** (expand a folder to see its files inline).
- **Multi-select** with row checkboxes; upload, download, rename, move, delete.
- Built-in **text editor** (undo/redo) and **font preview** (double-click a TTF).
- The same storage is reachable over **SAMBA** (see below).

<p align="center">
  <img src="https://raw.githubusercontent.com/Cl3tus/HA-Eink-Studio-App/main/docs/screenshots/E-ink-Studio-File-Manager-Screenshot1.png" alt="File manager" width="100%">
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
| Shift while dragging | Bypass grid snap |

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

## ⚠️ Good to know

- The add-on **does not** write to your ESPHome config — you copy the generated YAML
  yourself (preview-only by design).
- The **graph** preview shows a sample wave; the real history is drawn on the device
  by ESPHome. Y-axis numbers appear once you set a fixed Y-min/Y-max.
- For an exact font preview, upload your TTF via **Fonts**.
- Date/time name transforms generate a small helper block in the lambda (with a
  length guard, so an empty/unknown value at boot can't crash the device).

---

*Source & issues: [github.com/Cl3tus/HA-Eink-Studio-App](https://github.com/Cl3tus/HA-Eink-Studio-App)*
