#!/usr/bin/with-contenv bashio
# ============================================================
#  E-ink Studio add-on launcher
# ============================================================
bashio::log.info "E-ink Studio start op poort 8099 (ingress)..."

# SUPERVISOR_TOKEN is automatisch beschikbaar (homeassistant_api: true).
# Hiermee proxyt de server read-only /core/api/states.
export DATA_DIR="/data"
export ADDON_VERSION="1.1.0"

exec python3 /app/server.py
