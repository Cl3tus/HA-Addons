#!/usr/bin/env python3
"""
E-ink Studio add-on server.

Responsibilities:
  * Serve the static frontend (www/) under the Ingress path (relative URLs).
  * Proxy read-only Home Assistant state data via the Supervisor API.
  * Persist projects + uploaded fonts under /data (the add-on's persistent volume).

Everything is read-only towards Home Assistant. Nothing is written to the
ESPHome config; fonts/projects live only inside this add-on's volume.
"""

import os
import json
import base64
import re
import shutil
import asyncio
from pathlib import Path

from aiohttp import web, ClientSession, ClientTimeout

DATA_DIR          = Path(os.environ.get("DATA_DIR", "/data"))
WWW_DIR           = Path(__file__).parent / "www"
PROJECTS_DIR      = DATA_DIR / "projects"
FONTS_DIR         = DATA_DIR / "fonts"
ADDON_CONFIGS_DIR = Path("/addon_configs")
PORT = 8099

SUPERVISOR_TOKEN      = os.environ.get("SUPERVISOR_TOKEN", "")
SUPERVISOR_STATES_URL = "http://supervisor/core/api/states"

# samba_host uit add-on options (/data/options.json) — optioneel
_options_file = DATA_DIR / "options.json"
try:
    _opts = json.loads(_options_file.read_text("utf-8")) if _options_file.exists() else {}
except Exception:
    _opts = {}
SAMBA_HOST = _opts.get("samba_host", "")

SAFE_NAME  = re.compile(r"^[A-Za-z0-9._-]+$")
FILES_ROOT = DATA_DIR

for d in (PROJECTS_DIR, FONTS_DIR):
    d.mkdir(parents=True, exist_ok=True)


def _safe(name: str) -> bool:
    return bool(name) and bool(SAFE_NAME.match(name)) and ".." not in name


def _get_root(key: str) -> Path:
    return ADDON_CONFIGS_DIR if key == "addon_configs" else FILES_ROOT


def _resolve_fs(path: str, root: Path = None) -> "Path | None":
    """Resolve a user-supplied path under root, blocking traversal."""
    root = root or FILES_ROOT
    try:
        rel = (path or "").lstrip("/\\")
        resolved = (root / rel).resolve()
        resolved.relative_to(root.resolve())
        return resolved
    except Exception:
        return None


# ---------------------------------------------------------------- HA states
async def api_states(request: web.Request) -> web.Response:
    """Read-only proxy to HA states (all entities; the UI filters)."""
    if not SUPERVISOR_TOKEN:
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
                    return web.json_response(
                        {"error": "ha_error", "status": r.status}, status=502)
                data = await r.json()
    except Exception as e:  # noqa: BLE001
        return web.json_response({"error": "fetch_failed", "detail": str(e)}, status=502)

    # Trim to what the editor needs: entity_id, state, unit, friendly_name.
    slim = []
    for st in data:
        attrs = st.get("attributes", {}) or {}
        slim.append({
            "entity_id": st.get("entity_id"),
            "state": st.get("state"),
            "unit": attrs.get("unit_of_measurement"),
            "name": attrs.get("friendly_name"),
            "device_class": attrs.get("device_class"),
        })
    return web.json_response(slim)


# ---------------------------------------------------------------- projects
async def projects_list(request: web.Request) -> web.Response:
    items = []
    for p in sorted(PROJECTS_DIR.glob("*.json")):
        items.append(p.stem)
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
    (PROJECTS_DIR / f"{name}.json").write_text(
        json.dumps(body, ensure_ascii=False, indent=2), "utf-8")
    return web.json_response({"ok": True})


async def project_delete(request: web.Request) -> web.Response:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    f = PROJECTS_DIR / f"{name}.json"
    if f.exists():
        f.unlink()
    return web.json_response({"ok": True})


# ---------------------------------------------------------------- fonts
async def fonts_list(request: web.Request) -> web.Response:
    items = []
    for p in sorted(FONTS_DIR.glob("*")):
        if p.is_file():
            items.append(p.name)
    return web.json_response({"fonts": items})


async def font_put(request: web.Request) -> web.Response:
    """Store an uploaded font. Body: {name, dataUrl}."""
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
        return web.json_response({"error": "bad_base64"}, status=400)
    if len(raw) > 8 * 1024 * 1024:
        return web.json_response({"error": "too_large"}, status=413)
    (FONTS_DIR / name).write_bytes(raw)
    return web.json_response({"ok": True})


async def font_get(request: web.Request) -> web.StreamResponse:
    name = request.match_info["name"]
    if not _safe(name):
        return web.json_response({"error": "bad_name"}, status=400)
    f = FONTS_DIR / name
    if not f.exists():
        return web.json_response({"error": "not_found"}, status=404)
    return web.FileResponse(f)


# ---------------------------------------------------------------- file explorer
async def fs_list(request: web.Request) -> web.Response:
    root   = _get_root(request.rel_url.query.get("root", "data"))
    target = _resolve_fs(request.rel_url.query.get("path", ""), root)
    if target is None:
        return web.json_response({"error": "bad_path"}, status=400)
    if not target.exists():
        # addon_configs may not exist when the share is not mounted
        return web.json_response({"error": "not_found", "path": "", "entries": []}, status=200)
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
    rel = str(target.relative_to(root.resolve())).replace("\\", "/")
    if rel == ".":
        rel = ""
    return web.json_response({"path": rel, "entries": entries})


async def fs_mkdir(request: web.Request) -> web.Response:
    body   = await request.json()
    root   = _get_root(body.get("root", "data"))
    target = _resolve_fs(body.get("path", ""), root)
    if target is None or target == root.resolve():
        return web.json_response({"error": "bad_path"}, status=400)
    target.mkdir(parents=True, exist_ok=True)
    return web.json_response({"ok": True})


async def fs_delete(request: web.Request) -> web.Response:
    root   = _get_root(request.rel_url.query.get("root", "data"))
    target = _resolve_fs(request.rel_url.query.get("path", ""), root)
    if target is None or target == root.resolve():
        return web.json_response({"error": "bad_path"}, status=400)
    if not target.exists():
        return web.json_response({"ok": True})
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    return web.json_response({"ok": True})


async def fs_move(request: web.Request) -> web.Response:
    body = await request.json()
    root = _get_root(body.get("root", "data"))
    src  = _resolve_fs(body.get("src", ""), root)
    dst  = _resolve_fs(body.get("dst", ""), root)
    if src is None or dst is None:
        return web.json_response({"error": "bad_path"}, status=400)
    if src == root.resolve():
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
    return web.json_response({"ok": True})


async def fs_upload(request: web.Request) -> web.Response:
    reader      = await request.multipart()
    target_path = ""
    root_key    = "data"
    uploaded    = []
    async for part in reader:
        if part.name == "path":
            target_path = await part.text()
        elif part.name == "root":
            root_key = await part.text()
        elif part.name == "file":
            root  = _get_root(root_key)
            fname = Path(part.filename or "upload").name
            data  = await part.read()
            if len(data) > 32 * 1024 * 1024:
                return web.json_response({"error": "too_large"}, status=413)
            dest = _resolve_fs((target_path.rstrip("/") + "/" + fname).lstrip("/"), root)
            if dest is None:
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            uploaded.append(fname)
    return web.json_response({"ok": True, "uploaded": uploaded})


async def fs_download(request: web.Request) -> web.StreamResponse:
    from urllib.parse import quote
    root   = _get_root(request.rel_url.query.get("root", "data"))
    target = _resolve_fs(request.rel_url.query.get("path", ""), root)
    if target is None or not target.exists() or not target.is_file():
        return web.json_response({"error": "not_found"}, status=404)
    return web.FileResponse(
        target,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(target.name)}"},
    )


# ---------------------------------------------------------------- meta
async def api_info(request: web.Request) -> web.Response:
    return web.json_response({
        "app": "E-ink Studio",
        "version": os.environ.get("ADDON_VERSION", "1.0.0"),
        "live_data": bool(SUPERVISOR_TOKEN),
        "samba_host": SAMBA_HOST,
        "addon_configs_available": ADDON_CONFIGS_DIR.exists(),
    })


# ---------------------------------------------------------------- static
async def index(request: web.Request) -> web.StreamResponse:
    return web.FileResponse(WWW_DIR / "index.html")


def build_app() -> web.Application:
    app = web.Application(client_max_size=64 * 1024 * 1024)
    app.router.add_get("/api/info", api_info)
    app.router.add_get("/api/states", api_states)
    app.router.add_get("/api/projects", projects_list)
    app.router.add_get("/api/projects/{name}", project_get)
    app.router.add_put("/api/projects/{name}", project_put)
    app.router.add_delete("/api/projects/{name}", project_delete)
    app.router.add_get("/api/fonts", fonts_list)
    app.router.add_put("/api/fonts/{name}", font_put)
    app.router.add_get("/api/fonts/{name}", font_get)
    app.router.add_get("/api/fs/list", fs_list)
    app.router.add_post("/api/fs/mkdir", fs_mkdir)
    app.router.add_delete("/api/fs/entry", fs_delete)
    app.router.add_post("/api/fs/move", fs_move)
    app.router.add_post("/api/fs/upload", fs_upload)
    app.router.add_get("/api/fs/download", fs_download)
    app.router.add_get("/", index)
    app.router.add_static("/", WWW_DIR, show_index=False)
    return app


if __name__ == "__main__":
    web.run_app(build_app(), host="0.0.0.0", port=PORT)
