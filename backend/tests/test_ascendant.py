"""
🔱 Observer ascendant — parity + regression.

Pins the single-observer-mode ascendant pipeline against the sibling
engine (bharat-ephemeris-offline/math-core.js, Swiss-verified <0.1°) and
against the TS substrate port.

Frame: tropical ascendant minus effective_49 ayanāṃśa (54 − shared-debt
4.8″/yr ≈ 49.2″/yr). Parity pins were generated from the sibling engine
on 2026-08-10 (see substrate.py docstring).
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from vedic_ghadi.substrate import (
    ayanamsha_effective49_deg,
    sidereal_ascendant_deg,
    tropical_ascendant_deg,
)
from vedic_ghadi.ashtakavarga import compute_bhinna_sarva

REPO_ROOT = Path(__file__).resolve().parents[2]
SHIM = REPO_ROOT / "frontend" / "lib" / "_parity_shim.mts"

# (jd, lat, lon, expected_tropical_asc, expected_sidereal_asc, expected_ayanamsha)
# Pinned from sibling engine math-core.js on 2026-08-10.
SIBLING_PINS = [
    (2451545.0, 23.1765, 75.7683, 96.28805163851985, 75.77433699315873, 20.513714645361112),
    (2451545.0, -33.8688, 151.2093, 152.49289964826244, 131.97918500290132, 20.513714645361112),
    (2451545.0, 40.7128, -74.006, 274.2436156715285, 253.72990102616745, 20.513714645361112),
    (2460000.0, 26.1664, 91.7059, 158.3552861366834, 137.52520752985367, 20.8300786068297),
    (2440587.5, 28.6139, 77.209, 255.51743685448625, 235.41372316805973, 20.103713686426513),
    (2480000.0, 51.5074, -0.1276, 311.2915176620751, 289.7130914231493, 21.578426238925708),
]


@pytest.mark.parametrize("jd,lat,lon,trop,sid,ayan", SIBLING_PINS)
def test_ascendant_matches_sibling_pins(jd, lat, lon, trop, sid, ayan):
    """Exact match against the Swiss-verified sibling engine (<= 1e-9 deg)."""
    assert tropical_ascendant_deg(jd, lat, lon) == pytest.approx(trop, abs=1e-9)
    assert sidereal_ascendant_deg(jd, lat, lon) == pytest.approx(sid, abs=1e-9)
    assert ayanamsha_effective49_deg(jd) == pytest.approx(ayan, abs=1e-9)


def _node_supports_strip_types() -> bool:
    if not shutil.which("node"):
        return False
    try:
        out = subprocess.check_output(
            ["node", "--version"], stderr=subprocess.STDOUT, timeout=5,
        ).decode().strip().lstrip("v")
        return int(out.split(".")[0]) >= 22
    except (subprocess.CalledProcessError, ValueError, IndexError):
        return False


HAVE_NODE = _node_supports_strip_types()


def _ts_stamp_with_observer(y, mo, d, h, mi, sec, tz, lat, lon) -> dict:
    cmd = [
        "node", "--experimental-strip-types", "--no-warnings",
        str(SHIM), str(y), str(mo), str(d), str(h), str(mi), str(sec), str(tz),
        str(lat), str(lon),
    ]
    proc = subprocess.run(cmd, capture_output=True, timeout=15, check=True)
    return json.loads(proc.stdout.decode())


@pytest.mark.skipif(not HAVE_NODE, reason="node ≥ 22 not available (needs --experimental-strip-types)")
@pytest.mark.parametrize("args", [
    (2026, 5, 17, 16, 0, 0.0, 5.5, 23.1765, 75.778889),
    (2026, 5, 17, 16, 0, 0.0, 5.5, -33.8688, 151.2093),
    (2000, 6, 15, 12, 30, 0.0, 5.5, 40.7128, -74.0060),
    (1, 1, 1, 12, 0, 0.0, 5.5, 23.1765, 75.778889),
])
def test_av_observer_parity_py_ts(args):
    """Aṣṭakavarga with an explicit observer must be byte-identical Py vs TS."""
    from vedic_ghadi import ghadi_at

    lat = args[7]
    lon = args[8]
    py = ghadi_at(args[0], args[1], args[2], args[3], args[4], args[5], args[6], lat, lon)
    ts = _ts_stamp_with_observer(*args)

    for mid in py["meridians"]:
        for pole in ("aditi", "diti"):
            for op in ("brahma", "vishnu", "mahesh"):
                pa = py["meridians"][mid]["trimurti"][pole][op]["ashtakavarga"]
                ta = ts["meridians"][mid]["trimurti"][pole][op]["ashtakavarga"]
                key = f"{mid}/{pole}/{op}"
                assert pa["bhinna"] == ta["bhinna"], f"bhinna differs at {key}"
                assert pa["sarva"] == ta["sarva"], f"sarva differs at {key}"
                assert pa["sarva_total"] == ta["sarva_total"], f"sarva_total differs at {key}"
                assert pa["per_graha_totals"] == ta["per_graha_totals"], f"per_graha_totals differs at {key}"
                assert pa["lagna_sign"] == ta["lagna_sign"], f"lagna_sign differs at {key}"
                assert pa["lagna_lon_deg"] == pytest.approx(ta["lagna_lon_deg"], abs=1e-6), f"lagna_lon differs at {key}"


def test_observer_lagna_differs_from_sun_proxy():
    """At Ujjain mid-afternoon the ascendant is NOT the Sun's sign."""
    from vedic_ghadi import ghadi_at
    from vedic_ghadi.substrate import (
        kali_civil_days_to_jd, sidereal_ascendant_deg, vedic_mean_longitude,
    )

    stamp = ghadi_at(2026, 5, 17, 16, 0, 0.0, 5.5)
    k = stamp["kali_civil_days_at_kamakhya"]
    graha_lons = {
        g: vedic_mean_longitude(g, k)
        for g in ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu")
    }

    legacy = compute_bhinna_sarva(graha_lons)  # Sun-sign proxy (no observer)
    lagna_lon = sidereal_ascendant_deg(kali_civil_days_to_jd(k), 23.1765, 75.778889)
    observer = compute_bhinna_sarva(graha_lons, lagna_lon)

    assert legacy["lagna_proxy"] == "Sūrya-Lagna (Sun's sign — no observer passed)"
    assert observer["lagna_proxy"] == "observer ascendant (effective_49 ayanāṃśa frame)"
    assert observer["lagna_sign"] != legacy["lagna_sign"], (
        "observer ascendant must not equal Sun's sign proxy"
    )
    assert observer["lagna_lon_deg"] == pytest.approx(lagna_lon, abs=1e-9)

    # Observer-driven AV bindus must differ from the Sun-proxy AV in at
    # least the sarva matrix (Lagna contributes bindus to every graha table).
    assert observer["sarva"] != legacy["sarva"]
