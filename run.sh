#!/usr/bin/with-contenv bashio
# ============================================================
#  E-ink Studio add-on launcher
# ============================================================
# bashio::log only stamps the time (its timestamp format is read-only), so we log
# these startup lines ourselves to match server.py: a white "[date] LEVEL:" prefix
# with a per-level coloured message (INFO green, WARNING yellow).
log_line() {   # $1=LEVEL  $2=ANSI colour  $3=message
    printf '[%s] %s: %b%s\033[0m\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" "$2" "$3"
}

log_line INFO '\033[32m' "E-ink Studio start op poort 8099 (ingress)..."

export DATA_DIR="/data"
export ADDON_VERSION="3.9.104"

# addon_config:rw monteert de add-on config-map op /config.
# Op de SAMBA-share is dit zichtbaar als addon_configs\3d980088_eink_studio.
# SAMBA_SLUG wordt meegestuurd naar de frontend voor de badge.
if [ -d "/config" ]; then
    log_line INFO '\033[32m' "SAMBA opslag actief: /config (\\\\<HA-IP>\\addon_configs\\3d980088_eink_studio)"
    export STORAGE_DIR="/config"
    export SAMBA_SLUG="3d980088_eink_studio"
else
    log_line WARNING '\033[33m' "/config niet gemount — val terug op /data"
    export STORAGE_DIR="$DATA_DIR"
    export SAMBA_SLUG=""
fi

exec python3 /app/server.py
