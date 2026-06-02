#!/usr/bin/with-contenv bashio
# ============================================================
#  E-ink Studio add-on launcher
# ============================================================
bashio::log.info "E-ink Studio start op poort 8099 (ingress)..."

# SUPERVISOR_TOKEN is automatisch beschikbaar (homeassistant_api: true).
# Hiermee proxyt de server read-only /core/api/states.
export DATA_DIR="/data"
export ADDON_VERSION="1.2.0"

# Koppel /data aan /addon_configs/d5a9c741_eink_studio zodat de map
# bereikbaar is via SAMBA (\\<HA-IP>\addon_configs\d5a9c741_eink_studio).
SAMBA_LINK="/addon_configs/d5a9c741_eink_studio"
if [ -L "$SAMBA_LINK" ]; then
    bashio::log.info "SAMBA koppeling bestaat al: ${SAMBA_LINK}"
elif [ ! -e "$SAMBA_LINK" ]; then
    ln -s /data "$SAMBA_LINK" \
        && bashio::log.info "SAMBA koppeling aangemaakt: ${SAMBA_LINK} -> /data" \
        || bashio::log.warning "Kon SAMBA koppeling niet aanmaken: ${SAMBA_LINK}"
elif [ -d "$SAMBA_LINK" ] && [ -z "$(ls -A "$SAMBA_LINK" 2>/dev/null)" ]; then
    rmdir "$SAMBA_LINK" \
        && ln -s /data "$SAMBA_LINK" \
        && bashio::log.info "Lege map vervangen door SAMBA koppeling: ${SAMBA_LINK} -> /data" \
        || bashio::log.warning "Kon SAMBA koppeling niet aanmaken (rmdir mislukt): ${SAMBA_LINK}"
else
    bashio::log.warning "SAMBA koppeling overgeslagen: ${SAMBA_LINK} bestaat al en is niet leeg"
fi

exec python3 /app/server.py
