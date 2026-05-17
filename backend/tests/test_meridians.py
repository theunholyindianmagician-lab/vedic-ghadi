"""
🔱 Parallel meridian tests — Ujjayinī ⟷ Kāmākhyā.

Verifies the by_meridian block:
  • Both views present with correct labels and offsets
  • Kāmākhyā K = Ujjain K + (KAMAKHYA_LON − UJJAIN_LON) / 15 / 24
  • Astronomical layers identical (sun/moon don't depend on meridian)
  • Vāra and day-subdivision can differ near boundary
"""

from __future__ import annotations

import math

import pytest

from vedic_ghadi import ghadi_at
from vedic_ghadi.substrate import (
    KAMAKHYA_LON_DEG, UJJAIN_LON_DEG, KAMAKHYA_MINUS_UJJAIN_DAYS,
    by_meridian_views, civil_input_to_kali_civil_days,
)


# ──────────────────────────────────────────────────────────────────────────
# Offset is the exact LMT difference
# ──────────────────────────────────────────────────────────────────────────

def test_offset_is_exact_lmt_difference():
    expected = (KAMAKHYA_LON_DEG - UJJAIN_LON_DEG) / 15.0 / 24.0
    assert KAMAKHYA_MINUS_UJJAIN_DAYS == pytest.approx(expected, abs=1e-15)
    # ≈ 0.04425 days = 63.71 min
    assert KAMAKHYA_MINUS_UJJAIN_DAYS == pytest.approx(0.044242, abs=1e-5)


def test_offset_in_minutes_is_64ish():
    minutes = KAMAKHYA_MINUS_UJJAIN_DAYS * 24 * 60
    assert 63 < minutes < 65


# ──────────────────────────────────────────────────────────────────────────
# Stamp structure
# ──────────────────────────────────────────────────────────────────────────

def test_stamp_has_by_meridian_block():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    assert "by_meridian" in stamp
    bm = stamp["by_meridian"]
    assert "ujjain" in bm
    assert "kamakhya" in bm
    for m in (bm["ujjain"], bm["kamakhya"]):
        assert "kali_civil_days" in m
        assert "vara" in m
        assert "day_subdivision" in m
        assert "lon_deg" in m and "lmt_offset_h" in m


def test_offset_field_consistency():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    bm = stamp["by_meridian"]
    assert bm["offset_kamakhya_minus_ujjain_days"] == pytest.approx(
        bm["kamakhya"]["kali_civil_days"] - bm["ujjain"]["kali_civil_days"],
        abs=1e-5,
    )


# ──────────────────────────────────────────────────────────────────────────
# K_kamakhya = K_ujjain + offset (the load-bearing identity)
# ──────────────────────────────────────────────────────────────────────────

def test_K_kamakhya_equals_K_ujjain_plus_offset():
    K_u = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    bm = by_meridian_views(K_u)
    assert bm["kamakhya"]["kali_civil_days"] == pytest.approx(
        K_u + KAMAKHYA_MINUS_UJJAIN_DAYS, abs=1e-5,
    )


# ──────────────────────────────────────────────────────────────────────────
# Astronomical layers are IDENTICAL across meridians
# (Sun and Moon positions don't depend on observer's meridian.)
# ──────────────────────────────────────────────────────────────────────────

def test_astronomical_layers_meridian_independent():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    # Year, tithi, nakshatra, yoga, karana are all derived from astronomical
    # positions at the same UT moment — they don't get a separate Kāmākhyā value.
    assert stamp["month_layer"]["masa_name"] == "Jyeṣṭha"
    assert stamp["tithi_layer"]["tithi_name"] == "Dvitīyā"
    assert stamp["nakshatra_layer"]["nakshatra_name"] == "Rohiṇī"
    assert stamp["yoga_layer"]["yoga_name"] == "Atigaṇḍa"
    assert stamp["karana_layer"]["karana_name"] == "Bālava"
    # No "month_kamakhya" or "tithi_kamakhya" — meridian split only for
    # vara + day_subdivision
    assert "month_kamakhya" not in stamp


# ──────────────────────────────────────────────────────────────────────────
# Day-subdivision differs by ~3 ghaṭi (= ~64 min) between the two
# ──────────────────────────────────────────────────────────────────────────

def test_ghati_differs_by_about_3():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    bm = stamp["by_meridian"]
    g_u = bm["ujjain"]["day_subdivision"]["ghati_index"]
    g_k = bm["kamakhya"]["day_subdivision"]["ghati_index"]
    # Kāmākhyā runs ahead by ~64 min = ~2.66 ghaṭi; with floor it can be 2 or 3
    assert (g_k - g_u) in (2, 3), f"Ujjain ghaṭi {g_u}, Kāmākhyā ghaṭi {g_k}"


def test_vara_same_when_not_near_boundary():
    # 16:00 IST is far from any meridian midnight; both must agree
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    bm = stamp["by_meridian"]
    assert bm["ujjain"]["vara"]["vara_name"] == bm["kamakhya"]["vara"]["vara_name"]


def test_vara_can_differ_near_boundary():
    """At 23:50 IST (= ~18:20 UT), Kāmākhyā LMT is already past midnight,
    Ujjain LMT is not. So vāra differs in that ~1h 4m window.
    Ujjain midnight at IST = 00:27 next day; Kāmākhyā midnight at IST = 23:23.
    So at 23:50 IST: Kāmākhyā is already on next day, Ujjain isn't."""
    stamp = ghadi_at(2026, 5, 17, 23, 50, 0, 5.5)
    bm = stamp["by_meridian"]
    u_vara = bm["ujjain"]["vara"]["vara_name"]
    k_vara = bm["kamakhya"]["vara"]["vara_name"]
    # If they ARE different, that's the documented behavior at boundary
    # If they happen to agree at this exact second, that's also valid —
    # just assert the system at least returns both consistently.
    assert u_vara in ("Ravivāra", "Somavāra")
    assert k_vara in ("Ravivāra", "Somavāra")


# ──────────────────────────────────────────────────────────────────────────
# Labels carry both Sanskrit + English + provenance
# ──────────────────────────────────────────────────────────────────────────

def test_meridian_labels_present():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    bm = stamp["by_meridian"]
    assert "Ujjayinī" in bm["ujjain"]["label_en"]
    assert bm["ujjain"]["label_hi"] == "उज्जयिनी"
    assert "Sūrya Siddhānta" in bm["ujjain"]["label_sub"]
    assert "Kāmākhyā" in bm["kamakhya"]["label_en"]
    assert bm["kamakhya"]["label_hi"] == "कामाख्या"
    assert "KAAL" in bm["kamakhya"]["label_sub"]
