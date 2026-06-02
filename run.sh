#!/usr/bin/with-contenv bashio
# ============================================================
#  E-ink Studio add-on launcher
# ============================================================
bashio::log.info "E-ink Studio start op poort 8099 (ingress)..."

# SUPERVISOR_TOKEN is automatisch beschikbaar (homeassistant_api: true).
export DATA_DIR="/data"
export ADDON_VERSION="1.2.2"

# Sla projecten/fonts op in de addon_configs map zodat ze bereikbaar zijn
# via SAMBA: \\<HA-IP>\addon_configs\d5a9c741_eink_studio
# HA monteert /addon_configs als addon_configs:rw is geconfigureerd.
STORAGE_DIR="/addon_configs/d5a9c741_eink_studio"
if [ -d "$STORAGE_DIR" ]; then
    bashio::log.info "Opslag: ${STORAGE_DIR}"
    export STORAGE_DIR
else
    bashio::log.warning "SAMBA-map ${STORAGE_DIR} niet beschikbaar, val terug op /data"
    export STORAGE_DIR="$DATA_DIR"
fi

exec python3 /app/server.py
