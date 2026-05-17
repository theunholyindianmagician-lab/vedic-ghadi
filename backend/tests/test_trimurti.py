"""
🔱 APEX v5 TRIMŪRTI × BIPOLAR tests — 504 sphoṭas.

Per KAAL APEX v5 Saptamukhi Trimurti decomposition:
  Brahmā (सृष्टि) — creation operator, phase 0
  Viṣṇu  (स्थिति) — preservation operator, phase 1/3
  Maheśa (संहार) — transformation operator, phase 2/3

For each meridian × pole, the 3 Trimurti views are phase-shifted K
re-cascaded through the pole's subdivision.

84 meridians × 2 poles × 3 Trimūrti = 504 cascade-view sphoṭas.
"""

from __future__ import annotations

import math

import pytest

from vedic_ghadi import ghadi_at
from vedic_ghadi.substrate import (
    TRIMURTI_OPERATORS, compute_trimurti_views,
    vedic_time_of_day, vedic_time_of_day_diti,
    civil_input_to_kali_civil_days,
)


# ──────────────────────────────────────────────────────────────────────────
# Trimurti operators — canonical definitions
# ──────────────────────────────────────────────────────────────────────────

def test_three_trimurti_operators():
    assert len(TRIMURTI_OPERATORS) == 3
    ids = [op[0] for op in TRIMURTI_OPERATORS]
    assert ids == ["brahma", "vishnu", "mahesh"]


def test_phase_offsets_are_0_one_third_two_thirds():
    offsets = {op[0]: op[4] for op in TRIMURTI_OPERATORS}
    assert offsets["brahma"] == 0.0
    assert offsets["vishnu"] == pytest.approx(1.0 / 3.0, abs=1e-12)
    assert offsets["mahesh"] == pytest.approx(2.0 / 3.0, abs=1e-12)


def test_offsets_sum_to_one():
    """Brahmā (0) + Viṣṇu (1/3) + Maheśa (2/3) = 1 — full day complete."""
    total = sum(op[4] for op in TRIMURTI_OPERATORS)
    assert total == pytest.approx(1.0, abs=1e-12)


# ──────────────────────────────────────────────────────────────────────────
# compute_trimurti_views shape
# ──────────────────────────────────────────────────────────────────────────

def test_compute_views_returns_3_operators():
    K = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    tv = compute_trimurti_views(K, vedic_time_of_day)
    assert set(tv.keys()) == {"brahma", "vishnu", "mahesh"}


def test_each_view_has_required_fields():
    K = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    tv = compute_trimurti_views(K, vedic_time_of_day)
    for op_id, v in tv.items():
        assert v["operator_id"] == op_id
        assert "icon" in v
        assert "operator_en" in v
        assert "operator_hi" in v
        assert "k_shifted" in v
        assert "day_subdivision" in v


def test_brahma_view_uses_unshifted_K():
    """Brahmā offset = 0, so day_subdivision should match vedic_time_of_day(K) exactly."""
    K = 1_872_712.648
    tv = compute_trimurti_views(K, vedic_time_of_day)
    direct = vedic_time_of_day(K)
    assert tv["brahma"]["day_subdivision"]["muhurta_index"] == direct["muhurta_index"]
    assert tv["brahma"]["day_subdivision"]["ghati_index"] == direct["ghati_index"]


def test_vishnu_view_uses_K_plus_one_third():
    K = 1_872_712.648
    tv = compute_trimurti_views(K, vedic_time_of_day)
    direct = vedic_time_of_day(K + 1.0 / 3.0)
    assert tv["vishnu"]["day_subdivision"]["muhurta_index"] == direct["muhurta_index"]


def test_mahesh_view_uses_K_plus_two_thirds():
    K = 1_872_712.648
    tv = compute_trimurti_views(K, vedic_time_of_day)
    direct = vedic_time_of_day(K + 2.0 / 3.0)
    assert tv["mahesh"]["day_subdivision"]["muhurta_index"] == direct["muhurta_index"]


# ──────────────────────────────────────────────────────────────────────────
# 504 = 84 × 2 × 3 sphoṭa count
# ──────────────────────────────────────────────────────────────────────────

def test_total_504_sphotas():
    """Every meridian × pole × Trimurti = 1 cascade-view sphoṭa."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    total = 0
    for m in stamp["meridians"].values():
        for pole in m["trimurti"]:
            for op_id in m["trimurti"][pole]:
                total += 1
                # And each is a valid view
                assert "day_subdivision" in m["trimurti"][pole][op_id]
    assert total == 84 * 2 * 3 == 504


def test_every_meridian_has_complete_trimurti_block():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for mid, m in stamp["meridians"].items():
        assert "trimurti" in m, f"missing trimurti on {mid}"
        assert set(m["trimurti"].keys()) == {"aditi", "diti"}, f"missing pole on {mid}"
        for pole in ("aditi", "diti"):
            assert set(m["trimurti"][pole].keys()) == {"brahma", "vishnu", "mahesh"}, \
                f"missing Trimurti operator on {mid}.{pole}"


# ──────────────────────────────────────────────────────────────────────────
# Mathematical identities
# ──────────────────────────────────────────────────────────────────────────

def test_brahma_aditi_matches_existing_day_subdivision_aditi():
    """The Brahmā × Aditi view should equal the existing day_subdivision_aditi
    (Brahmā is the unshifted reference operator)."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for mid, m in stamp["meridians"].items():
        b_aditi = m["trimurti"]["aditi"]["brahma"]["day_subdivision"]
        existing = m["day_subdivision_aditi"]
        for key in ("muhurta_index", "ghati_index", "vighati_index", "prana_index"):
            assert b_aditi[key] == existing[key], (
                f"{mid}: Brahmā-Aditi {key} differs ({b_aditi[key]} vs {existing[key]})"
            )


def test_vishnu_and_mahesh_differ_from_brahma_in_general():
    """Phase-shifted views give different subdivisions (except at trivial Ks)."""
    K = 1_872_712.648
    tv = compute_trimurti_views(K, vedic_time_of_day)
    b = tv["brahma"]["day_subdivision"]["muhurta_index"]
    v = tv["vishnu"]["day_subdivision"]["muhurta_index"]
    m = tv["mahesh"]["day_subdivision"]["muhurta_index"]
    # At K = 1872712.648 (frac=0.648), Brahmā μ=20, Viṣṇu μ=30, Maheśa μ=10
    assert b == 20
    assert v == 30
    assert m == 10
    assert b != v and v != m and b != m


def test_top_level_trimurti_at_ujjain_present():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    assert "trimurti_at_ujjain" in stamp
    assert "trimurti_operators" in stamp
    assert len(stamp["trimurti_operators"]) == 3


# ──────────────────────────────────────────────────────────────────────────
# Diti × Trimurti — Pisano-of-Ideal still applies under each shift
# ──────────────────────────────────────────────────────────────────────────

def test_diti_trimurti_uses_diti_cascade():
    """Diti × any-Trimurti should always have muhūrta ∈ [1, 10] (not [1, 30])."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for mid, m in stamp["meridians"].items():
        for op in ("brahma", "vishnu", "mahesh"):
            d = m["trimurti"]["diti"][op]["day_subdivision"]
            assert 1 <= d["muhurta_index"] <= 10, (
                f"{mid}.diti.{op} muhūrta out of [1,10]: {d['muhurta_index']}"
            )
            assert 1 <= d["ghati_index"] <= 20
            assert 1 <= d["prana_index"] <= 2
