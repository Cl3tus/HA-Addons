#!/usr/bin/with-contenv bashio
# ============================================================
#  E-ink Studio add-on launcher
# ============================================================
bashio::log.info "E-ink Studio start op poort 8099 (ingress)..."

export DATA_DIR="/data"
export ADDON_VERSION="3.9.75"

# addon_config:rw monteert de add-on config-map op /config.
# Op de SAMBA-share is dit zichtbaar als addon_configs\3d980088_eink_studio.
# SAMBA_SLUG wordt meegestuurd naar de frontend voor de badge.
if [ -d "/config" ]; then
    bashio::log.info "SAMBA opslag actief: /config (\\\\<HA-IP>\\addon_configs\\3d980088_eink_studio)"
    export STORAGE_DIR="/config"
    export SAMBA_SLUG="3d980088_eink_studio"
else
    bashio::log.warning "/config niet gemount — val terug op /data"
    export STORAGE_DIR="$DATA_DIR"
    export SAMBA_SLUG=""
fi

exec python3 /app/server.py
