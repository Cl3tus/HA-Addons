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
import asyncio
from pathlib import Path

from aiohttp import web, ClientSession, ClientTimeout

DATA_DIR = Path(os.environ.get("DATA_DIR", "/data"))
WWW_DIR = Path(__file__).parent / "www"
PROJECTS_DIR = DATA_DIR / "projects"
FONTS_DIR = DATA_DIR / "fonts"
PORT = 8099

SUPERVISOR_TOKEN = os.environ.get("SUPERVISOR_TOKEN", "")
SUPERVISOR_STATES_URL = "http://supervisor/core/api/states"

SAFE_NAME = re.compile(r"^[A-Za-z0-9._-]+$")

for d in (PROJECTS_DIR, FONTS_DIR):
    d.mkdir(parents=True, exist_ok=True)


def _safe(name: str) -> bool:
    return bool(name) and bool(SAFE_NAME.match(name)) and ".." not in name


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


# ---------------------------------------------------------------- meta
async def api_info(request: web.Request) -> web.Response:
    return web.json_response({
        "app": "E-ink Studio",
        "version": os.environ.get("ADDON_VERSION", "1.0.0"),
        "live_data": bool(SUPERVISOR_TOKEN),
    })


# ---------------------------------------------------------------- static
async def index(request: web.Request) -> web.StreamResponse:
    return web.FileResponse(WWW_DIR / "index.html")


def build_app() -> web.Application:
    app = web.Application(client_max_size=16 * 1024 * 1024)
    app.router.add_get("/api/info", api_info)
    app.router.add_get("/api/states", api_states)
    app.router.add_get("/api/projects", projects_list)
    app.router.add_get("/api/projects/{name}", project_get)
    app.router.add_put("/api/projects/{name}", project_put)
    app.router.add_delete("/api/projects/{name}", project_delete)
    app.router.add_get("/api/fonts", fonts_list)
    app.router.add_put("/api/fonts/{name}", font_put)
    app.router.add_get("/api/fonts/{name}", font_get)
    app.router.add_get("/", index)
    app.router.add_static("/", WWW_DIR, show_index=False)
    return app


if __name__ == "__main__":
    web.run_app(build_app(), host="0.0.0.0", port=PORT)
