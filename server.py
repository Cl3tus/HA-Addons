#!/usr/bin/env python3
"""
E-ink Studio add-on server.

Responsibilities:
  * Serve the static frontend (www/) under the Ingress path (relative URLs).
  * Proxy read-only Home Assistant state data via the Supervisor API.
  * Persist projects + uploaded fonts under STORAGE_DIR.
    - STORAGE_DIR defaults to /data but is set to
      /addon_configs/<slug> via run.sh so data is directly visible
      in the SAMBA share (\\<HA-IP>\\addon_configs\\<slug>).

Everything is read-only towards Home Assistant. Nothing is written to the
ESPHome config; fonts/projects live only inside this add-on's volume.
"""

import os
import io
import json
import base64
import re
import shutil
import zipfile
import asyncio
import logging
from collections import Counter
from pathlib import Path
from urllib.parse import quote

from aiohttp import web, ClientSession, ClientTimeout

# ---------------------------------------------------------------- logging
# bashio-style line ("[date time] LEVEL: msg") so the add-on log reads
# consistently. Includes the date so multi-day logs stay readable. Lines are
# ANSI-coloured per level (INFO green like bashio, WARNING yellow, ERROR red);
# the HA log viewer renders the codes. Everything goes to stdout, which HA captures.
class _ColorFormatter(logging.Formatter):
    # Timestamp + level stay white; only the message is coloured per level.
    COLORS = {
        logging.DEBUG: "\033[90m",      # grey
        logging.INFO: "\033[32m",       # green (matches bashio)
        logging.WARNING: "\033[33m",    # yellow
        logging.ERROR: "\033[31m",      # red
        logging.CRITICAL: "\033[1;31m", # bold red
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        ts = self.formatTime(record, self.datefmt)
        color = self.COLORS.get(record.levelno, "")
        return f"[{ts}] {record.levelname}: {color}{record.getMessage()}{self.RESET}"


_handler = logging.StreamHandler()
_handler.setFormatter(_ColorFormatter(datefmt="%Y-%m-%d %H:%M:%S"))
logging.basicConfig(level=logging.INFO, handlers=[_handler])
log = logging.getLogger("eink")

DATA_DIR     = Path(os.environ.get("DATA_DIR", "/data"))
# STORAGE_DIR is where projects/fonts are kept.  run.sh points this at
# /addon_configs/<slug> so the data is reachable via SAMBA.
STORAGE_DIR  = Path(os.environ.get("STORAGE_DIR", str(DATA_DIR)))
WWW_DIR      = Path(__file__).parent / "www"
PROJECTS_DIR  = STORAGE_DIR / "projects"
FONTS_DIR     = STORAGE_DIR / "fonts"
PROFILES_DIR  = STORAGE_DIR / "profiles"
FILES_ROOT    = STORAGE_DIR
PORT = 8099

SUPERVISOR_TOKEN      = os.environ.get("SUPERVISOR_TOKEN", "")
SUPERVISOR_STATES_URL = "http://supervisor/core/api/states"

# User options from /data/options.json
_options_file = DATA_DIR / "options.json"
try:
    _opts = json.loads(_options_file.read_text("utf-8")) if _options_file.exists() else {}
except Exception as e:  # noqa: BLE001
    log.warning("options.json onleesbaar (%s) — val terug op standaardinstellingen", e)
    _opts = {}
def _norm_lang(v):
    v = str(v or "auto").strip().lower()
    return {"nederlands": "nl", "dutch": "nl", "nl": "nl",
            "english": "en", "engels": "en", "en": "en"}.get(v, "auto")

def _norm_theme(v):
    v = str(v or "auto").strip().lower()
    return v if v in ("light", "dark") else "auto"

LANGUAGE   = _norm_lang(_opts.get("language", "auto"))   # auto | nl | en
THEME      = _norm_theme(_opts.get("theme", "auto"))     # auto | light | dark
LIVE_ON_START    = bool(_opts.get("live_on_start", True))
try:    LIVE_INTERVAL = max(0, int(_opts.get("live_interval", 1)))
except Exception: LIVE_INTERVAL = 1
ENTITY_DOMAINS   = [str(d).strip().lower() for d in (_opts.get("entity_domains") or []) if str(d).strip()]
HIDE_UNAVAILABLE = bool(_opts.get("hide_unavailable", False))
SAMBA_SLUG = os.environ.get("SAMBA_SLUG", "")
VERSION    = os.environ.get("ADDON_VERSION", "?")

SAFE_NAME = re.compile(r"^[A-Za-z0-9._-]+$")

# Create storage dirs
for _d in (PROJECTS_DIR, FONTS_DIR, PROFILES_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# Seed the bundled Material Design Icons TTF into fonts/ so it shows up in the
# file manager and can be replaced with your own build (it is no longer only
# baked into the web assets).
try:
    _mdi_src = WWW_DIR / "vendor" / "mdi" / "fonts" / "materialdesignicons-webfont.ttf"
    _mdi_dst = FONTS_DIR / "materialdesignicons-webfont.ttf"
    if _mdi_src.exists() and not _mdi_dst.exists():
        shutil.copy2(str(_mdi_src), str(_mdi_dst))
        log.info("MDI-font geseed naar fonts/%s", _mdi_dst.name)
except Exception as e:  # noqa: BLE001
    log.warning("MDI-font seeden mislukt: %s", e)

# Migrate existing data from /data to STORAGE_DIR (runs once)
if STORAGE_DIR != DATA_DIR:
    for _sub in ("projects", "fonts"):
        _old = DATA_DIR / _sub
        _new = STORAGE_DIR / _sub
        if _old.exists() and not any(_new.iterdir()) if _new.exists() else _old.exists():
            try:
                if _new.exists():
                    shutil.rmtree(_new)
                shutil.copytree(str(_old), str(_new))
                log.info("data gemigreerd: %s -> %s (%d bestanden)",
                         _old, _new, sum(1 for _ in _new.rglob("*") if _.is_file()))
            except Exception as e:  # noqa: BLE001
                log.warning("migratie %s -> %s mislukt: %s", _old, _new, e)


def _safe(name: str) -> bool:
    return bool(name) and bool(SAFE_NAME.match(name)) and ".." not in name


def _design_stats(body: dict) -> dict:
    """Countable gist of a design — used for the summary + change diff."""
    screens = body.get("screens") or []
    return {
        "schermen": len(screens),
        "elementen": sum(len(s.get("elements") or []) for s in screens),
        "fonts": len(body.get("fonts") or []),
        "bronnen": len(body.get("sources") or []),
    }


def _design_summary(body: dict) -> str:
    """One-line gist of a saved design (profile/project) for the log."""
    try:
        st = _design_stats(body)
        return (f"naam='{body.get('name', '?')}' schermen={st['schermen']} "
                f"elementen={st['elementen']} fonts={st['fonts']} "
                f"bronnen={st['bronnen']}")
    except Exception:  # noqa: BLE001
        return ""


def _sources_str(body: dict) -> str:
    """List the defined sources: id=entity[kind], e.g. temp=sensor.buiten[number]."""
    out = []
    for s in (body.get("sources") or []):
        sid = s.get("id") or "?"
        ent = s.get("entityId") or ""
        kind = s.get("kind") or ""
        out.append(sid + (f"={ent}" if ent else "") + (f"[{kind}]" if kind else ""))
    return ", ".join(out)


def _stats_diff(old: dict, new: dict) -> str:
    """Describe what changed between two saved designs (for the 'bijgewerkt' log)."""
    parts = []
    if old.get("name") != new.get("name"):
        parts.append(f"naam '{old.get('name')}'→'{new.get('name')}'")
    os_, ns = _design_stats(old), _design_stats(new)
    for k in ("schermen", "elementen", "fonts", "bronnen"):
        if os_[k] != ns[k]:
            parts.append(f"{k} {os_[k]}→{ns[k]}")
    old_ids = {s.get("id") for s in (old.get("sources") or [])}
    new_ids = {s.get("id") for s in (new.get("sources") or [])}
    added = sorted(i for i in (new_ids - old_ids) if i)
    removed = sorted(i for i in (old_ids - new_ids) if i)
    if added:
        parts.append("bron+ " + ",".join(added))
    if removed:
        parts.append("bron- " + ",".join(removed))
    return ", ".join(parts)


def _resolve_fs(path: str) -> "Path | None":
    """Resolve a user-supplied path under FILES_ROOT, blocking traversal."""
    try:
        rel = (path or "").lstrip("/\\")
        resolved = (FILES_ROOT / rel).resolve()
        resolved.relative_to(FILES_ROOT.resolve())
        return resolved
    except Exception:
        log.warning("pad-traversal geweigerd: %r", path)
        return None


# ---------------------------------------------------------------- HA states
# The frontend polls /api/states every live_interval seconds, so logging each
# call would flood. _live_log only emits when the state actually changes
# (ok <-> no_token <-> error), giving one line per transition.
_live_status = None


def _live_log(status: str, msg: str, level: int = logging.INFO) -> None:
    global _live_status
    if status != _live_status:
        _live_status = status
        log.log(level, msg)


async def api_states(request: web.Request) -> web.Response:
    """Read-only proxy to HA states (all entities; the UI filters)."""
    if not SUPERVISOR_TOKEN:
        _live_log("no_token", "live data: SUPERVISOR_TOKEN ontbreekt — niet beschikbaar (503)",
                  logging.WARNING)
        return web.json_response(
            {"error": "no_supervisor_token",
             "detail": "SUPERVISOR_TOKEN ontbreekt; live data niet beschikbaar."},
            status=503,
        )
    headers = {"Authorization": f"Bearer {SUPERVISOR_TOKEN}"}
    try:
        async with ClientSession(timeout=ClientTimeout(total=15)) as s:
            async with s.get(SUPERVISOR_STATES_URL, headers=headers) as r:
                if r.status != 200:
                    _live_log("error", f"live data: HA states-API gaf status {r.status} (502)",
                              logging.WARNING)
                    return web.json_response(
                        {"error": "ha_error", "status": r.status}, status=502)
                data = await r.json()
    except Exception as e:  # noqa: BLE001
        _live_log("error", f"live data: ophalen mislukt: {e} (502)", logging.WARNING)
        return web.json_response({"error": "fetch_failed", "detail": str(e)}, status=502)

    slim = []
    for st in data:
        eid = st.get("entity_id") or ""
        # apply the add-on entity filter so the picker (and its count) reflect it
        if ENTITY_DOMAINS and eid.split(".")[0] not in ENTITY_DOMAINS:
            continue
        state = st.get("state")
        if HIDE_UNAVAILABLE and state in ("unavailable", "unknown"):
            continue
        attrs = st.get("attributes", {}) or {}
        slim.append({
            "entity_id": eid,
            "state": state,
            "unit": attrs.get("unit_of_measurement"),
            "name": attrs.get("friendly_name"),
            "device_class": attrs.get("device_class"),
        })
    doms = Counter(s["entity_id"].split(".")[0] for s in slim if s["entity_id"])
    breakdown = ", ".join(f"{d}={n}" for d, n in doms.most_common())
    filt = f" (filter: {len(ENTITY_DOMAINS)} domeinen)" if ENTITY_DOMAINS else " (geen filter)"
    msg = (f"live data actief: {len(slim)} entiteiten over "
           f"{len(doms)} domeinen{filt} — {breakdown}")
    # If the domain filter is on, also report which domains it drops, so you can
    # see exactly what's being hidden (the entities missing from the picker).
    if ENTITY_DOMAINS:
        excl = Counter()
        for st in data:
            eid = st.get("entity_id") or ""
            dom = eid.split(".")[0] if eid else ""
            if dom and dom not in ENTITY_DOMAINS:
                excl[dom] += 1
        if excl:
            dropped = sum(excl.values())
            msg += (f" | filter sluit {dropped} entiteiten uit: "
                    + ", ".join(f"{d}={n}" for d, n in excl.most_common()))
    _live_log("ok", msg)
    return web.json_response(slim)


# ---------------------------------------------------------------- projects
async def projects_list(request: web.Request) -> web.Response:
    items = [p.stem for p in sorted(PROJECTS_DIR.glob("*.json"))]
    return web.json_response({"projects": items})


async def project_get(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    f = PROJECTS_DIR / f"{name}.json"
    if not f.exists():
        return web.json_response({"error": "not_found"}, status=404)
    return web.json_response(json.loads(f.read_text("utf-8")))


async def project_put(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    body = await request.json()
    f = PROJECTS_DIR / f"{name}.json"
    new_text = json.dumps(body, ensure_ascii=False, indent=2)
    existed = f.exists()
    # Only log when the content actually changed. The frontend re-PUTs every
    # project/profile on each sync; logging unchanged writes would flood the log.
    changed = (not existed) or f.read_text("utf-8") != new_text
    f.write_text(new_text, "utf-8")
    if changed:
        log.info("project %s: %s — %s",
                 "bijgewerkt" if existed else "aangemaakt", name, _design_summary(body))
    return web.json_response({"ok": True})


async def project_delete(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    f = PROJECTS_DIR / f"{name}.json"
    if f.exists():
        f.unlink()
        log.info("project verwijderd: %s", name)
    return web.json_response({"ok": True})


# ---------------------------------------------------------------- fonts
async def fonts_list(request: web.Request) -> web.Response:
    items = [p.name for p in sorted(FONTS_DIR.glob("*")) if p.is_file()]
    return web.json_response({"fonts": items})


async def fonts_zip(request: web.Request) -> web.Response:
    """Bundle every file in fonts/ into a single .zip for download.

    Read-only: streams the add-on's own fonts folder so the user can drop the
    archive into ESPHome's config/fonts/ by hand. ESPHome only reads fonts that
    live next to its YAML, so we never write there ourselves (that would need a
    broad rw mount into another add-on's config — the security risk we avoid)."""
    files = [p for p in sorted(FONTS_DIR.glob("*")) if p.is_file()]
    if not files:
        return web.json_response({"error": "no_fonts"}, status=404)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in files:
            zf.write(str(p), arcname=p.name)
    return web.Response(
        body=buf.getvalue(),
        headers={
            "Content-Type": "application/zip",
            "Content-Disposition": 'attachment; filename="eink-fonts.zip"',
        },
    )


async def font_put(request: web.Request) -> web.Response:
    body = await request.json()
    name = body.get("name", "")
    data_url = body.get("dataUrl", "")
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    m = re.match(r"^data:[^;]*;base64,(.*)$", data_url or "", re.S)
    if not m:
        return web.json_response({"error": "bad_data"}, status=400)
    try:
        raw = base64.b64decode(m.group(1))
    except Exception:  # noqa: BLE001
        log.warning("font upload geweigerd (ongeldige base64): %s", name)
        return web.json_response({"error": "bad_base64"}, status=400)
    if len(raw) > 8 * 1024 * 1024:
        log.warning("font upload geweigerd (te groot: %d KB): %s", len(raw) // 1024, name)
        return web.json_response({"error": "too_large"}, status=413)
    dest = FONTS_DIR / name
    existed = dest.exists()
    dest.write_bytes(raw)
    log.info("font %s: %s (%d KB)",
             "aangepast" if existed else "toegevoegd", name, len(raw) // 1024)
    return web.json_response({"ok": True})


async def font_get(request: web.Request) -> web.StreamResponse:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    f = FONTS_DIR / name
    if not f.exists():
        return web.json_response({"error": "not_found"}, status=404)
    return web.FileResponse(f)


# ---------------------------------------------------------------- profiles
async def profiles_list(request: web.Request) -> web.Response:
    items = [p.stem for p in sorted(PROFILES_DIR.glob("*.json"))]
    return web.json_response({"profiles": items})


async def profile_get(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    f = PROFILES_DIR / f"{name}.json"
    if not f.exists():
        return web.json_response({"error": "not_found"}, status=404)
    return web.json_response(json.loads(f.read_text("utf-8")))


async def profile_put(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    body = await request.json()
    f = PROFILES_DIR / f"{name}.json"
    new_text = json.dumps(body, ensure_ascii=False, indent=2)
    # Only log a real change — every profile is re-PUT on sync (see project_put).
    old_text = f.read_text("utf-8") if f.exists() else None
    f.write_text(new_text, "utf-8")
    if old_text is None:
        log.info("profiel aangemaakt: %s — %s", name, _design_summary(body))
        src = _sources_str(body)
        if src:
            log.info("  bronnen: %s", src)
    elif old_text != new_text:
        try:
            diff = _stats_diff(json.loads(old_text), body)
        except Exception:  # noqa: BLE001
            diff = ""
        log.info("profiel bijgewerkt: %s — %s", name, diff or "inhoud gewijzigd (layout/tekst)")
    return web.json_response({"ok": True})


async def profile_delete(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    f = PROFILES_DIR / f"{name}.json"
    if f.exists():
        f.unlink()
        log.info("profiel verwijderd: %s", name)
    return web.json_response({"ok": True})


# ---------------------------------------------------------------- file explorer
async def fs_list(request: web.Request) -> web.Response:
    target = _resolve_fs(request.rel_url.query.get("path", ""))
    if target is None:
        return web.json_response({"error": "bad_path"}, status=400)
    if not target.exists():
        return web.json_response({"path": "", "entries": []})
    if not target.is_dir():
        return web.json_response({"error": "not_a_dir"}, status=400)
    entries = []
    for p in sorted(target.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
        st = p.stat()
        entries.append({
            "name": p.name,
            "type": "dir" if p.is_dir() else "file",
            "size": st.st_size if p.is_file() else None,
            "modified": st.st_mtime,
        })
    rel = str(target.relative_to(FILES_ROOT.resolve())).replace("\\", "/")
    if rel == ".":
        rel = ""
    return web.json_response({"path": rel, "entries": entries})


async def fs_mkdir(request: web.Request) -> web.Response:
    body   = await request.json()
    target = _resolve_fs(body.get("path", ""))
    if target is None or target == FILES_ROOT.resolve():
        return web.json_response({"error": "bad_path"}, status=400)
    target.mkdir(parents=True, exist_ok=True)
    log.info("map aangemaakt: %s", body.get("path", ""))
    return web.json_response({"ok": True})


async def fs_delete(request: web.Request) -> web.Response:
    target = _resolve_fs(request.rel_url.query.get("path", ""))
    if target is None or target == FILES_ROOT.resolve():
        return web.json_response({"error": "bad_path"}, status=400)
    if not target.exists():
        return web.json_response({"ok": True})
    if target.is_dir():
        shutil.rmtree(target)
        log.info("map verwijderd: %s", request.rel_url.query.get("path", ""))
    else:
        target.unlink()
        log.info("bestand verwijderd: %s", request.rel_url.query.get("path", ""))
    return web.json_response({"ok": True})


async def fs_move(request: web.Request) -> web.Response:
    body = await request.json()
    src  = _resolve_fs(body.get("src", ""))
    dst  = _resolve_fs(body.get("dst", ""))
    if src is None or dst is None:
        return web.json_response({"error": "bad_path"}, status=400)
    if src == FILES_ROOT.resolve():
        return web.json_response({"error": "cannot_move_root"}, status=400)
    if not src.exists():
        return web.json_response({"error": "not_found"}, status=404)
    try:
        dst.relative_to(src)
        return web.json_response({"error": "cannot_move_into_self"}, status=400)
    except ValueError:
        pass
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))
    log.info("verplaatst: %s -> %s", body.get("src", ""), body.get("dst", ""))
    return web.json_response({"ok": True})


async def fs_upload(request: web.Request) -> web.Response:
    reader      = await request.multipart()
    target_path = ""
    uploaded    = []
    async for part in reader:
        if part.name == "path":
            target_path = await part.text()
        elif part.name == "file":
            fname = Path(part.filename or "upload").name
            data  = await part.read()
            if len(data) > 32 * 1024 * 1024:
                log.warning("upload geweigerd (te groot: %d KB): %s", len(data) // 1024, fname)
                return web.json_response({"error": "too_large"}, status=413)
            dest = _resolve_fs((target_path.rstrip("/") + "/" + fname).lstrip("/"))
            if dest is None:
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            uploaded.append(fname)
    if uploaded:
        log.info("geupload naar %s/: %s", target_path.strip("/"), ", ".join(uploaded))
    return web.json_response({"ok": True, "uploaded": uploaded})


async def fs_download(request: web.Request) -> web.StreamResponse:
    target = _resolve_fs(request.rel_url.query.get("path", ""))
    if target is None or not target.exists() or not target.is_file():
        return web.json_response({"error": "not_found"}, status=404)
    return web.FileResponse(
        target,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(target.name)}"},
    )


async def fs_read(request: web.Request) -> web.Response:
    """Return a text file's contents for in-browser editing."""
    target = _resolve_fs(request.rel_url.query.get("path", ""))
    if target is None or not target.exists() or not target.is_file():
        return web.json_response({"error": "not_found"}, status=404)
    if target.stat().st_size > 2 * 1024 * 1024:
        return web.json_response({"error": "too_large"}, status=413)
    try:
        text = target.read_text("utf-8")
    except (UnicodeDecodeError, ValueError):
        return web.json_response({"error": "not_text"}, status=415)
    return web.json_response({"path": request.rel_url.query.get("path", ""), "content": text})


async def fs_write(request: web.Request) -> web.Response:
    """Write text content back to a file. Body: {path, content}."""
    body = await request.json()
    target = _resolve_fs(body.get("path", ""))
    if target is None or target == FILES_ROOT.resolve():
        return web.json_response({"error": "bad_path"}, status=400)
    content = body.get("content", "")
    if not isinstance(content, str):
        return web.json_response({"error": "bad_content"}, status=400)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, "utf-8")
    log.info("bestand opgeslagen: %s (%d tekens)", body.get("path", ""), len(content))
    return web.json_response({"ok": True})


# ---------------------------------------------------------------- meta
async def api_info(request: web.Request) -> web.Response:
    return web.json_response({
        "app": "E-ink Studio",
        "version": os.environ.get("ADDON_VERSION", "1.0.0"),
        "live_data": bool(SUPERVISOR_TOKEN),
        "samba_slug": SAMBA_SLUG,
        "language": LANGUAGE,
        "theme": THEME,
        "live_on_start": LIVE_ON_START,
        "live_interval": LIVE_INTERVAL,
        "entity_domains": ENTITY_DOMAINS,
        "hide_unavailable": HIDE_UNAVAILABLE,
    })


# ---------------------------------------------------------------- editor log
# The editor itself runs in the browser, so the server can't see editor-side
# events (YAML generation, glyph mismatches, font edits). The frontend POSTs the
# noteworthy ones here so they land in the add-on log next to the server events.
_LOG_LEVELS = {"info": logging.INFO, "warning": logging.WARNING, "error": logging.ERROR}


async def api_log(request: web.Request) -> web.Response:
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001
        return web.json_response({"error": "bad_json"}, status=400)
    level = _LOG_LEVELS.get(str(body.get("level", "info")).lower(), logging.INFO)
    msg = str(body.get("msg", "")).replace("\n", " ").strip()[:500]
    if msg:
        log.log(level, "editor: %s", msg)
    return web.json_response({"ok": True})


# ---------------------------------------------------------------- static
async def index(request: web.Request) -> web.StreamResponse:
    return web.FileResponse(WWW_DIR / "index.html")


def _log_startup() -> None:
    """One-shot dump of the resolved config + storage state at boot."""
    log.info("E-ink Studio v%s — server start op poort %d", VERSION, PORT)
    log.info(
        "config — taal=%s thema=%s live=%s/%ss domains=%s verberg_onbeschikbaar=%s",
        LANGUAGE, THEME, "aan" if LIVE_ON_START else "uit", LIVE_INTERVAL,
        ENTITY_DOMAINS or "alle", HIDE_UNAVAILABLE,
    )
    log.info(
        "opslag — %s (samba=%s) | live-data=%s",
        STORAGE_DIR, SAMBA_SLUG or "geen",
        "ja (token aanwezig)" if SUPERVISOR_TOKEN else "nee (geen token)",
    )
    log.info(
        "gevonden — %d projecten, %d fonts, %d profielen",
        len(list(PROJECTS_DIR.glob("*.json"))),
        len([p for p in FONTS_DIR.glob("*") if p.is_file()]),
        len(list(PROFILES_DIR.glob("*.json"))),
    )


def build_app() -> web.Application:
    app = web.Application(client_max_size=64 * 1024 * 1024)
    app.router.add_get("/api/info", api_info)
    app.router.add_post("/api/log", api_log)
    app.router.add_get("/api/states", api_states)
    app.router.add_get("/api/projects", projects_list)
    app.router.add_get("/api/projects/{name}", project_get)
    app.router.add_put("/api/projects/{name}", project_put)
    app.router.add_delete("/api/projects/{name}", project_delete)
    app.router.add_get("/api/fonts", fonts_list)
    app.router.add_get("/api/fonts.zip", fonts_zip)
    app.router.add_put("/api/fonts/{name}", font_put)
    app.router.add_get("/api/fonts/{name}", font_get)
    app.router.add_get("/api/profiles", profiles_list)
    app.router.add_get("/api/profiles/{name}", profile_get)
    app.router.add_put("/api/profiles/{name}", profile_put)
    app.router.add_delete("/api/profiles/{name}", profile_delete)
    app.router.add_get("/api/fs/list", fs_list)
    app.router.add_post("/api/fs/mkdir", fs_mkdir)
    app.router.add_delete("/api/fs/entry", fs_delete)
    app.router.add_post("/api/fs/move", fs_move)
    app.router.add_post("/api/fs/upload", fs_upload)
    app.router.add_get("/api/fs/download", fs_download)
    app.router.add_get("/api/fs/read", fs_read)
    app.router.add_post("/api/fs/write", fs_write)
    app.router.add_get("/", index)
    app.router.add_static("/", WWW_DIR, show_index=False)
    return app


if __name__ == "__main__":
    _log_startup()
    # access_log=None: skip aiohttp's per-request log line (one per asset/poll
    # would drown the add-on log); we log the meaningful mutations explicitly.
    web.run_app(build_app(), host="0.0.0.0", port=PORT,
                print=None, access_log=None)
