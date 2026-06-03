# E-ink Studio

A WYSIWYG editor for ESPHome e-ink displays, running as a Home Assistant add-on.
Design your display layout visually and generate the ESPHome `lambda` + matching
YAML.

## Features
- Full editor in the HA sidebar (Ingress — no separate tab needed).
- **Live preview**: reads Home Assistant states read-only, so the preview shows
  real sensor values. Click **○ Live** in the top bar to refresh.
- Projects, fonts and profiles are stored **inside the add-on** and exposed over
  SAMBA at `\\<HA-IP>\addon_configs\<slug>_eink_studio\`. Nothing is written to
  your ESPHome config.
- Built-in **file manager** (📁 Files) to browse, upload, download, rename, move
  and delete files/folders.
- All libraries (Konva, js-yaml, Material Design Icons, IBM Plex, Noto/Roboto)
  are **bundled** — works without an internet connection.

## Usage
1. Open **E-ink Studio** in the sidebar.
2. Design your layout; for each value element pick the right HA sensor.
3. Click **○ Live** to load real data into the preview (all entities are
   fetched; you filter/pick them in the UI).
4. **Generate YAML** → copy or download, then paste into your ESPHome config.

## Configuration
Two options on the **Configuration** tab:

- `language` — `auto` (follow HA / browser), `nl` or `en`.
- `theme` — `auto` (follow HA light/dark), `light` or `dark`.

Both can also be toggled from inside the editor; the add-on option is the
default.

## Storage
- Projects: `projects/*.json` — **Save** writes here, **Open** lists them.
- Fonts: `fonts/*` — uploaded TTFs are copied here (persistent).
- Profiles: `profiles/*.json` — profile settings.

All of these live in the add-on config folder, reachable over SAMBA so you can
edit/back them up from your computer. They survive add-on restarts and updates.

## Note
- The add-on does **not** write to your ESPHome config or fonts folder
  (preview-only by design).
- For an exact preview of custom fonts (e.g. digital.ttf, GothamRnd-Book.ttf):
  upload them via **Fonts & colours**. Material Design Icons (v7.4.47) is built in.
