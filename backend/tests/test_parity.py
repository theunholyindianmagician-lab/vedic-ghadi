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


def _ts_varga(longitude: float, division: int) -> int:
    script = (
        'import { computeVarga } from "./frontend/lib/vargas.ts"; '
        'process.stdout.write(String(computeVarga(Number(process.argv[1]), '
        'Number(process.argv[2]))));'
    )
    try:
        output = subprocess.check_output(
            [
                "node", "--experimental-strip-types", "--no-warnings",
                "--input-type=module", "-e", script, str(longitude), str(division),
            ],
            cwd=REPO_ROOT,
            stderr=subprocess.STDOUT,
            timeout=15,
        )
    except subprocess.CalledProcessError as error:
        pytest.fail(f"Node varga parity check failed:\n{error.output.decode()}")
    return int(output.decode())


@pytest.mark.skipif(
    not HAVE_NODE,
    reason="node >= 22 not available (needs --experimental-strip-types)",
)
@pytest.mark.parametrize(("longitude", "expected_sign"), [
    (0.0, 0),
    (0.5, 1),
    (45.0, 7),
    (359.9, 10),
])
def test_d60_python_typescript_parity_and_bphs_vectors(longitude, expected_sign):
    """D60 must satisfy BPHS 6.31-6.33 identically in both implementations."""
    from vedic_ghadi.vargas import compute_varga

    assert compute_varga(longitude, 60) == expected_sign
    assert _ts_varga(longitude, 60) == expected_sign


@pytest.mark.skipif(not HAVE_NODE, reason="node ≥ 22 not available (needs --experimental-strip-types)")
@pytest.mark.parametrize("args", [
    (2026, 5, 17, 16, 0, 0.0, 5.5),    # Today's anchor
    (2026, 1, 1, 0, 0, 0.0, 5.5),      # Year start
    (2000, 6, 15, 12, 30, 0.0, 5.5),   # Y2K
    (1947, 8, 15, 0, 0, 0.0, 5.5),     # Independence
    (79, 1, 1, 12, 0, 0.0, 5.5),       # Pre-79 CE edge — negative Śaka years
    (1, 1, 1, 12, 0, 0.0, 5.5),        # Pre-79 CE edge — negative Śaka years
    (0, 1, 1, 12, 0, 0.0, 5.5),        # Pre-79 CE edge — year-zero crossover
    (-100, 6, 1, 12, 0, 0.0, 5.5),     # Pre-79 CE edge — deep negative
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

    # Parallel meridian block
    for m in ("ujjain", "kamakhya"):
        assert py["by_meridian"][m]["vara"]["vara_name"] == ts["by_meridian"][m]["vara"]["vara_name"]
        assert py["by_meridian"][m]["day_subdivision"]["ghati_index"] == ts["by_meridian"][m]["day_subdivision"]["ghati_index"]
        assert py["by_meridian"][m]["day_subdivision"]["muhurta_index"] == ts["by_meridian"][m]["day_subdivision"]["muhurta_index"]
        assert abs(py["by_meridian"][m]["kali_civil_days"]
                   - ts["by_meridian"][m]["kali_civil_days"]) < 1e-5

    # Full 12-meridian registry parity
    assert set(py["meridians"].keys()) == set(ts["meridians"].keys()), \
        f"Py {sorted(py['meridians'].keys())} vs TS {sorted(ts['meridians'].keys())}"
    for mid in py["meridians"]:
        p = py["meridians"][mid]
        t = ts["meridians"][mid]
        assert p["vara"]["vara_name"] == t["vara"]["vara_name"], f"vara differs at {mid}"
        assert p["day_subdivision"]["ghati_index"] == t["day_subdivision"]["ghati_index"], f"ghaṭi differs at {mid}"
        assert p["day_subdivision"]["muhurta_index"] == t["day_subdivision"]["muhurta_index"], f"muhūrta differs at {mid}"
        assert p["day_subdivision"]["prana_index"] == t["day_subdivision"]["prana_index"], f"prāṇa differs at {mid}"
        assert p["lon_deg"] == t["lon_deg"], f"lon differs at {mid}"
        assert p["category"] == t["category"], f"category differs at {mid}"
        assert abs(p["kali_civil_days"] - t["kali_civil_days"]) < 1e-5, f"K differs at {mid}"


@pytest.mark.skipif(not HAVE_NODE, reason="node ≥ 22 not available (needs --experimental-strip-types)")
@pytest.mark.parametrize("args", [
    (2026, 5, 17, 16, 0, 0.0, 5.5),    # Today's anchor
    (2000, 6, 15, 12, 30, 0.0, 5.5),   # Y2K
    (79, 1, 1, 12, 0, 0.0, 5.5),       # Pre-79 CE edge — negative Śaka years
    (0, 1, 1, 12, 0, 0.0, 5.5),        # Pre-79 CE edge — year-zero crossover
])
def test_av_parity(args):
    """Aṣṭakavarga must be byte-identical Py vs TS — every cell, every sign,
    every Moon-table variant (bpns / phaladipika / varahamihira)."""
    py = ghadi_at(*args)
    ts = _ts_stamp(args)
    for mid in py["meridians"]:
        for pole in ("aditi", "diti"):
            for op in ("brahma", "vishnu", "mahesh"):
                key = f"{mid}/{pole}/{op}"
                pa = py["meridians"][mid]["trimurti"][pole][op]["ashtakavarga"]
                ta = ts["meridians"][mid]["trimurti"][pole][op]["ashtakavarga"]
                assert pa["bhinna"] == ta["bhinna"], f"bhinna differs at {key}"
                assert pa["sarva"] == ta["sarva"], f"sarva differs at {key}"
                assert pa["sarva_total"] == ta["sarva_total"], f"sarva_total differs at {key}"
                assert pa["per_graha_totals"] == ta["per_graha_totals"], f"per_graha_totals differs at {key}"
                assert pa["lagna_sign"] == ta["lagna_sign"], f"lagna_sign differs at {key}"

                # All three Moon-table conventions in parallel must match too.
                pav = py["meridians"][mid]["trimurti"][pole][op]["ashtakavarga_variants"]
                tav = ts["meridians"][mid]["trimurti"][pole][op]["ashtakavarga_variants"]
                assert set(pav) == set(tav) == {"bpns", "phaladipika", "varahamihira"}, key
                for vid in ("bpns", "phaladipika", "varahamihira"):
                    assert pav[vid]["bhinna"] == tav[vid]["bhinna"], f"{vid} bhinna differs at {key}"
                    assert pav[vid]["sarva"] == tav[vid]["sarva"], f"{vid} sarva differs at {key}"
                    assert pav[vid]["sarva_total"] == tav[vid]["sarva_total"] == 337, f"{vid} total at {key}"

