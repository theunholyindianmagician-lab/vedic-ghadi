"""🔱 FastAPI service — endpoint smoke tests."""

from __future__ import annotations

import pytest

try:
    from fastapi.testclient import TestClient
    from vedic_ghadi.api import app
    client = TestClient(app)
    _have_fastapi = True
except ImportError:
    _have_fastapi = False


pytestmark = pytest.mark.skipif(not _have_fastapi, reason="fastapi not installed")


def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_landing_html():
    r = client.get("/")
    assert r.status_code == 200
    assert "Vedic Ghaḍī" in r.text
    assert "/now" in r.text
    assert "/docs" in r.text


def test_now_default_tz():
    r = client.get("/now")
    assert r.status_code == 200
    body = r.json()
    assert body["input_civil"]["tz_h"] == 5.5
    assert "year_layer" in body
    assert "day_subdivision" in body


def test_now_with_tz():
    r = client.get("/now?tz=0")
    assert r.status_code == 200
    assert r.json()["input_civil"]["tz_h"] == 0.0


def test_at_iso_format():
    r = client.get("/at?date=2026-05-17T16:00:00&tz=5.5")
    assert r.status_code == 200
    body = r.json()
    assert body["year_layer"]["samvatsara"]["name"] == "Parābhava"
    assert body["vara_layer"]["vara_name"] == "Ravivāra"
    assert body["month_layer"]["masa_name"] == "Jyeṣṭha"


def test_at_date_only():
    r = client.get("/at?date=2026-05-17")
    assert r.status_code == 200


def test_at_bad_format():
    r = client.get("/at?date=not-a-date")
    assert r.status_code == 400
