#!/usr/bin/with-contenv bashio
# ============================================================
#  E-ink Studio add-on launcher
# ============================================================
bashio::log.info "E-ink Studio start op poort 8099 (ingress)..."

export DATA_DIR="/data"
export ADDON_VERSION="1.2.3"

# Zoek onze map in /addon_configs (eindigt op _eink_studio).
# HA maakt deze map automatisch aan bij een (her)build zodra
# addon_configs:rw in config.yaml staat.
# De map is via SAMBA bereikbaar als \\<HA-IP>\addon_configs\<slug>.
if [ -d "/addon_configs" ]; then
    SAMBA_DIR=$(find /addon_configs -maxdepth 1 -type d -name "*_eink_studio" 2>/dev/null | head -1)
    if [ -n "$SAMBA_DIR" ]; then
        bashio::log.info "SAMBA opslag gevonden: ${SAMBA_DIR}"
        export STORAGE_DIR="$SAMBA_DIR"
    else
        bashio::log.warning "/addon_configs beschikbaar maar geen *_eink_studio map gevonden — gebruik /data als fallback"
        export STORAGE_DIR="$DATA_DIR"
    fi
else
    bashio::log.warning "/addon_configs niet gemount — gebruik /data (SAMBA niet beschikbaar)"
    export STORAGE_DIR="$DATA_DIR"
fi

exec python3 /app/server.py
