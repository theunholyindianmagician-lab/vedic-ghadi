"""
🔱 Python / TypeScript parity test.

Runs the TypeScript port via Node's --experimental-strip-types on the same
anchor inputs as the Python reference, and asserts agreement on every
named/integer field of the stamp.

Skipped automatically if Node is missing or older than 22 (no native TS stripping).
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from vedic_ghadi import ghadi_at

REPO_ROOT = Path(__file__).resolve().parents[2]
SHIM = REPO_ROOT / "frontend" / "lib" / "_parity_shim.mts"


def _node_supports_strip_types() -> bool:
    if not shutil.which("node"):
        return False
    try:
        out = subprocess.check_output(
            ["node", "--version"], stderr=subprocess.STDOUT, timeout=5,
        ).decode().strip().lstrip("v")
        major = int(out.split(".")[0])
        return major >= 22
    except (subprocess.CalledProcessError, ValueError, IndexError):
        return False


HAVE_NODE = _node_supports_strip_types()


def _ts_stamp(args: tuple[int, int, int, int, int, float, float]) -> dict:
    cmd = [
        "node", "--experimental-strip-types", "--no-warnings",
        str(SHIM),
        *[str(a) for a in args],
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, timeout=15, check=True)
    except subprocess.CalledProcessError as e:
        pytest.fail(f"Node parity shim failed:\n{e.stderr.decode()}")
    return json.loads(proc.stdout.decode())


@pytest.mark.skipif(not HAVE_NODE, reason="node ≥ 22 not available (needs --experimental-strip-types)")
@pytest.mark.parametrize("args", [
    (2026, 5, 17, 16, 0, 0.0, 5.5),    # Today's anchor
    (2026, 1, 1, 0, 0, 0.0, 5.5),      # Year start
    (2000, 6, 15, 12, 30, 0.0, 5.5),   # Y2K
    (1947, 8, 15, 0, 0, 0.0, 5.5),     # Independence
])
def test_python_ts_parity(args):
    py = ghadi_at(*args)
    ts = _ts_stamp(args)

    # Year layer
    assert py["year_layer"]["kali_year_current"] == ts["year_layer"]["kali_year_current"]
    assert py["year_layer"]["kali_year_completed"] == ts["year_layer"]["kali_year_completed"]
    assert py["year_layer"]["vikrama_samvat"] == ts["year_layer"]["vikrama_samvat"]
    assert py["year_layer"]["shaka_samvat"] == ts["year_layer"]["shaka_samvat"]
    assert py["year_layer"]["samvatsara"]["name"] == ts["year_layer"]["samvatsara"]["name"]
    assert py["year_layer"]["samvatsara"]["index"] == ts["year_layer"]["samvatsara"]["index"]

    # Month / tithi / vāra
    assert py["month_layer"]["masa_name"] == ts["month_layer"]["masa_name"]
    assert py["month_layer"]["masa_index"] == ts["month_layer"]["masa_index"]
    assert py["month_layer"]["sun_sign_index"] == ts["month_layer"]["sun_sign_index"]
    assert py["tithi_layer"]["tithi_name"] == ts["tithi_layer"]["tithi_name"]
    assert py["tithi_layer"]["tithi_index"] == ts["tithi_layer"]["tithi_index"]
    assert py["tithi_layer"]["paksha_name"] == ts["tithi_layer"]["paksha_name"]
    assert py["vara_layer"]["vara_name"] == ts["vara_layer"]["vara_name"]
    assert py["vara_layer"]["vara_index"] == ts["vara_layer"]["vara_index"]

    # Day subdivision (every integer must match)
    assert py["day_subdivision"]["muhurta_index"] == ts["day_subdivision"]["muhurta_index"]
    assert py["day_subdivision"]["ghati_index"] == ts["day_subdivision"]["ghati_index"]
    assert py["day_subdivision"]["vighati_index"] == ts["day_subdivision"]["vighati_index"]
    assert py["day_subdivision"]["prana_index"] == ts["day_subdivision"]["prana_index"]

    # Pañcāṅga additions
    assert py["nakshatra_layer"]["nakshatra_name"] == ts["nakshatra_layer"]["nakshatra_name"]
    assert py["nakshatra_layer"]["pada"] == ts["nakshatra_layer"]["pada"]
    assert py["nakshatra_layer"]["nakshatra_lord"] == ts["nakshatra_layer"]["nakshatra_lord"]
    assert py["yoga_layer"]["yoga_name"] == ts["yoga_layer"]["yoga_name"]
    assert py["karana_layer"]["karana_name"] == ts["karana_layer"]["karana_name"]
    assert py["karana_layer"]["is_movable"] == ts["karana_layer"]["is_movable"]

    # Kali day count — within a microsecond
    assert abs(py["kali_civil_days_at_kamakhya"]
               - ts["kali_civil_days_at_kamakhya"]) < 1e-5
