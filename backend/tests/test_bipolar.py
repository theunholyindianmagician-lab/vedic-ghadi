"""
🔱 APEX v5 Bipolar discipline tests.

Verifies that every meridian-pole sphoṭa (Aditi + Diti) is correctly
computed per the Pisano-of-Ideal = 3 reduction.

Reference: KAAL APEX v5 — P240 Diti-Stratification, P241 Pisano-of-Ideal,
P242 Orbit Cascade. Diti cascade applies ÷3 to each (2,3,5)-factorable
sub-day unit.
"""

from __future__ import annotations

import math

import pytest

from vedic_ghadi import ghadi_at
from vedic_ghadi.substrate import (
    vedic_time_of_day, vedic_time_of_day_diti,
)


# ──────────────────────────────────────────────────────────────────────────
# Diti cascade — every sub-day count is ÷3 of Aditi
# ──────────────────────────────────────────────────────────────────────────

def test_diti_subdivision_at_anchor():
    """At 2026-05-17 16:00 IST (UJjain K = 1872712.648, f ≈ 0.648):"""
    K = 1_872_712.648
    a = vedic_time_of_day(K)
    d = vedic_time_of_day_diti(K)
    # Aditi (standard)
    assert a["muhurta_index"] == 20    # floor(0.648 * 30) + 1 = 20 ✓
    assert a["ghati_index"]   == 39    # floor(0.648 * 60) + 1 = 39 ✓
    assert a["prana_index"]   in range(1, 7)
    # Diti (÷3 each cascade)
    assert d["muhurta_index"] == 7     # floor(0.648 * 10) + 1 = 7
    assert d["ghati_index"]   == 13    # floor(0.648 * 20) + 1 = 13
    assert d["prana_index"]   in (1, 2)


def test_diti_muhurta_runs_1_to_10():
    """Diti muhūrta cycles 10 per day (vs Aditi's 30)."""
    for f_pct in range(0, 100, 5):
        K = float(f_pct) / 100
        d = vedic_time_of_day_diti(K)
        assert 1 <= d["muhurta_index"] <= 10


def test_diti_ghati_runs_1_to_20():
    for f_pct in range(0, 100, 5):
        K = float(f_pct) / 100
        d = vedic_time_of_day_diti(K)
        assert 1 <= d["ghati_index"] <= 20


def test_diti_prana_runs_1_to_2():
    for f_pct in range(0, 100, 5):
        K = float(f_pct) / 100
        d = vedic_time_of_day_diti(K)
        assert 1 <= d["prana_index"] <= 2


def test_diti_metadata_present():
    d = vedic_time_of_day_diti(1_872_712.648)
    assert d["pole"] == "diti"
    assert d["compression_vs_aditi"] == 27
    assert d["vipala_seconds"] == 10.8


def test_aditi_metadata_present():
    a = vedic_time_of_day(1_872_712.648)
    assert a.get("pole") == "aditi"


# ──────────────────────────────────────────────────────────────────────────
# Aditi/Diti ratio identities
# ──────────────────────────────────────────────────────────────────────────

def test_total_diti_vipala_per_day_is_8000():
    """Aditi: 30×2×60×6×10 = 216_000 vipala/day.
       Diti:  10×2×20×2×10 =  8_000 vipala/day.
       Ratio = 27 = 3³."""
    aditi_per_day = 30 * 2 * 60 * 6 * 10
    diti_per_day  = 10 * 2 * 20 * 2 * 10
    assert aditi_per_day == 216_000
    assert diti_per_day  == 8_000
    assert aditi_per_day // diti_per_day == 27


def test_diti_vipala_duration_27x_aditi():
    """1 Aditi vipala = 0.4 sec; 1 Diti vipala = 10.8 sec; ratio = 27."""
    assert 10.8 / 0.4 == 27.0


# ──────────────────────────────────────────────────────────────────────────
# Stamp shape — bipolar block included
# ──────────────────────────────────────────────────────────────────────────

def test_stamp_has_bipolar_subdivisions():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    assert "day_subdivision_aditi" in stamp
    assert "day_subdivision_diti" in stamp
    assert stamp["day_subdivision_aditi"]["pole"] == "aditi"
    assert stamp["day_subdivision_diti"]["pole"] == "diti"


def test_stamp_has_bipolar_discipline_block():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    assert "bipolar_discipline" in stamp
    bd = stamp["bipolar_discipline"]
    assert bd["pisano_of_ideal_ratio"] == 3
    assert bd["total_diti_compression"] == 27
    assert "APEX v5" in bd["discipline_ref"]


# ──────────────────────────────────────────────────────────────────────────
# Every meridian has both poles
# ──────────────────────────────────────────────────────────────────────────

def test_every_meridian_has_both_poles():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for mid, m in stamp["meridians"].items():
        assert "day_subdivision_aditi" in m, f"missing aditi on {mid}"
        assert "day_subdivision_diti"  in m, f"missing diti on {mid}"
        # Both share the same K and vāra (only subdivision differs)
        assert m["day_subdivision_aditi"]["fraction_of_day"] == m["day_subdivision_diti"]["fraction_of_day"]
        # Aditi muhurta in [1,30], Diti in [1,10]
        assert 1 <= m["day_subdivision_aditi"]["muhurta_index"] <= 30
        assert 1 <= m["day_subdivision_diti"]["muhurta_index"]  <= 10


def test_bipolar_total_views_168():
    """84 meridians × 2 poles = 168 meridian-pole sphoṭas."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    assert len(stamp["meridians"]) == 84
    total_views = sum(
        sum(1 for k in m if k.startswith("day_subdivision_"))
        for m in stamp["meridians"].values()
    )
    # Each meridian has aditi + diti = 2 bipolar views
    assert total_views == 84 * 2  # 168


# ──────────────────────────────────────────────────────────────────────────
# Diti-Aditi consistency
# ──────────────────────────────────────────────────────────────────────────

def test_diti_muhurta_is_floor_of_aditi_muhurta_over_3():
    """For the same K, Diti muhūrta index = floor((Aditi_muhurta_idx - 1) / 3) + 1
    (i.e., 3 consecutive Aditi muhūrtas map to 1 Diti muhūrta)."""
    for K in (1_872_712.10, 1_872_712.25, 1_872_712.50, 1_872_712.75, 1_872_712.95):
        a = vedic_time_of_day(K)
        d = vedic_time_of_day_diti(K)
        expected = (a["muhurta_index"] - 1) // 3 + 1
        assert d["muhurta_index"] == expected, (
            f"K={K}: Aditi μ={a['muhurta_index']} → expected Diti μ={expected}, got {d['muhurta_index']}"
        )
