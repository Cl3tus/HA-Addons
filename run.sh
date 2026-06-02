#!/usr/bin/with-contenv bashio
# ============================================================
#  E-ink Studio add-on launcher
# ============================================================
bashio::log.info "E-ink Studio start op poort 8099 (ingress)..."

export DATA_DIR="/data"
export ADDON_VERSION="1.2.4"

# Maak de addon_configs map aan als die nog niet bestaat.
# /addon_configs is altijd gemount (addon_configs:rw in config.yaml).
# De mapnaam is de CRC32 van de repo-URL + _eink_studio.
ADDON_CONFIGS_DIR="/addon_configs/3d980088_eink_studio"
mkdir -p "$ADDON_CONFIGS_DIR" 2>/dev/null \
    && bashio::log.info "SAMBA opslag: ${ADDON_CONFIGS_DIR}" \
    || bashio::log.warning "Kon ${ADDON_CONFIGS_DIR} niet aanmaken — val terug op /data"

if [ -d "$ADDON_CONFIGS_DIR" ]; then
    export STORAGE_DIR="$ADDON_CONFIGS_DIR"
else
    export STORAGE_DIR="$DATA_DIR"
fi

exec python3 /app/server.py
