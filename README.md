# Cl3tus HA Add-ons

A Home Assistant add-on repository bundling:

- **[Anti-Matter](anti_matter/)** — a local, cloud-free vault for your Matter, Z-Wave,
  Zigbee, HomeKit and Tuya pairing codes and QR payloads.
- **[E-ink Studio](eink_studio/)** — a visual editor for ESPHome e-paper displays, with
  live Home Assistant sensor bindings and generated `display:` YAML.

Add this single repository to install either (or both) — no need to add their
individual source repos separately.

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FCl3tus%2FHA-Addons)

1. In Home Assistant go to **Settings → Add-ons → Add-on Store → ⋮ → Repositories**.
2. Add this repository URL:
   ```
   https://github.com/Cl3tus/HA-Addons
   ```
3. Install **Anti-Matter** and/or **E-ink Studio** from the store and start them.

Each add-on's own README/DOCS lives in its subfolder; their full history and issue
trackers stay on their original repos: [Anti-Matter-HA](https://github.com/Cl3tus/Anti-Matter-HA),
[HA-Eink-Studio-App](https://github.com/Cl3tus/HA-Eink-Studio-App).
