#!/usr/bin/with-contenv bashio
# ============================================================
#  E-ink Studio add-on launcher
# ============================================================
bashio::log.info "E-ink Studio start op poort 8099 (ingress)..."

export DATA_DIR="/data"
export ADDON_VERSION="1.2.5"

# addon_config:rw in config.yaml laat HA de add-on config-map mounten op /config.
# Op de host is dit dezelfde map als \\<HA-IP>\addon_configs\<slug>\ via SAMBA.
# HA maakt /config automatisch aan — geen mkdir nodig.
if [ -d "/config" ]; then
    bashio::log.info "SAMBA opslag actief: /config"
    export STORAGE_DIR="/config"
else
    bashio::log.warning "/config niet gemount — val terug op /data"
    export STORAGE_DIR="$DATA_DIR"
fi

exec python3 /app/server.py
