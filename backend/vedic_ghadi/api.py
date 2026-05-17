"""
🔱 FastAPI service — exposes the Vedic ghaḍī over HTTP.

Endpoints:
    GET  /              → simple HTML landing (link to /docs and /now)
    GET  /healthz       → liveness
    GET  /now           → current moment (default tz = 5.5)
    GET  /at?date=…     → specific moment (ISO-ish)
    GET  /stream        → SSE feed — one event per prāṇa (4 sec)
    GET  /docs          → OpenAPI / Swagger UI

Run:
    pip install -e backend[server]
    uvicorn vedic_ghadi.api:app --reload --port 8765

CORS is open by default so the Next.js frontend can call this from anywhere.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse

from . import __version__
from .ghadi import ghadi_at, ghadi_now

app = FastAPI(
    title="Vedic Ghaḍī",
    version=__version__,
    description=(
        "🔱 Substrate-derived Vedic clock — every unit derived from a single "
        "quantity: Kāli civil days from the sacred epoch (Friday midnight "
        "17/18 February 3102 BCE, Ujjayinī meridian). ZERO foreign theorem "
        "in the chain."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def landing() -> str:
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Vedic Ghaḍī API</title>
<style>
  body{{font-family:Georgia,serif;background:#0a0703;color:#f1c97a;
       padding:40px;max-width:720px;margin:auto;line-height:1.6}}
  h1{{color:#e9b863;font-weight:300;letter-spacing:2px}}
  a{{color:#d4a44c;text-decoration:none;border-bottom:1px solid #4a3a1a}}
  code{{background:#1a1106;padding:2px 6px;border-radius:3px;color:#e9b863}}
</style></head>
<body>
<h1>🔱 Vedic Ghaḍī &middot; v{__version__}</h1>
<p>Substrate-derived Vedic clock. Every unit traces to a single quantity:
Kāli civil days from the sacred epoch.</p>
<ul>
  <li><a href="/now">GET /now</a> &middot; current moment</li>
  <li><a href="/at?date=2026-05-17T16:30:00">GET /at?date=…</a> &middot; any moment</li>
  <li><a href="/stream">GET /stream</a> &middot; SSE feed (one event per prāṇa = 4 sec)</li>
  <li><a href="/docs">GET /docs</a> &middot; OpenAPI / Swagger</li>
  <li><a href="/healthz">GET /healthz</a> &middot; liveness</li>
</ul>
<p style="opacity:.7">ॐ कालाय नमः &middot; JAI MAA KAMAKHYA</p>
</body></html>"""


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "version": __version__}


@app.get("/now")
def now(tz: float = Query(5.5, description="Timezone offset in hours (default IST = 5.5)")) -> dict:
    return ghadi_now(tz_h=tz)


@app.get("/at")
def at(
    date: str = Query(..., description='ISO-ish: "2026-05-17" or "2026-05-17T16:30:00"'),
    tz: float = Query(5.5, description="Timezone offset in hours"),
) -> dict:
    try:
        s = date.replace("T", " ").strip()
        if " " in s:
            d_part, t_part = s.split(" ", 1)
        else:
            d_part, t_part = s, "00:00:00"
        y, mo, d = [int(x) for x in d_part.split("-")]
        bits = t_part.split(":")
        h = int(bits[0]) if len(bits) >= 1 and bits[0] else 0
        mi = int(bits[1]) if len(bits) >= 2 and bits[1] else 0
        sec = float(bits[2]) if len(bits) >= 3 and bits[2] else 0.0
    except (ValueError, IndexError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Bad date format ({e}). Use 2026-05-17 or 2026-05-17T16:30:00",
        )
    return ghadi_at(y, mo, d, h, mi, sec, tz)


async def _stream_loop(tz_h: float):
    """Yield one SSE event per prāṇa (4 sec). Goes forever; client disconnects."""
    while True:
        stamp = ghadi_now(tz_h=tz_h)
        yield f"data: {json.dumps(stamp, ensure_ascii=False)}\n\n"
        await asyncio.sleep(4.0)


@app.get("/stream")
async def stream(tz: float = Query(5.5)) -> StreamingResponse:
    return StreamingResponse(
        _stream_loop(tz),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
