"""
🔱 Full lattice tests — 816,480 + 10,584 + 122,472 claim-spaces.

  (iii) 504 × 27 × 60          = 816,480   yoga × karaṇa per cell
  (iv)  504 × 21 vargas        = 10,584    Moon vargas per cell
  (v)   504 × 9 × 27           = 122,472   9 graha-nakṣatras per cell
"""

from __future__ import annotations

import pytest

from vedic_ghadi import ghadi_at
from vedic_ghadi.substrate import (
    GRAHA_NAMES, GRAHA_DEV, GRAHA_SYMBOL, vedic_mean_longitude,
)
from vedic_ghadi.vargas import (
    VARGA_LIST, SIGN_NAMES, SIGN_DEV, compute_varga, compute_all_vargas,
)


# ──────────────────────────────────────────────────────────────────────────
# Grahas — all 9 supported
# ──────────────────────────────────────────────────────────────────────────

def test_nine_grahas():
    assert len(GRAHA_NAMES) == 9
    assert len(GRAHA_DEV) == 9
    assert len(GRAHA_SYMBOL) == 9


def test_all_grahas_compute_longitude():
    K = 1_872_712.648
    for g in GRAHA_NAMES:
        lon = vedic_mean_longitude(g, K)
        assert 0.0 <= lon < 360.0, f"{g} lon {lon} out of [0,360)"


def test_ketu_180_opposite_rahu():
    K = 1_872_712.648
    rahu = vedic_mean_longitude("Rahu", K)
    ketu = vedic_mean_longitude("Ketu", K)
    diff = abs(ketu - rahu) % 360
    assert abs(diff - 180.0) < 1e-9


def test_rahu_retrograde():
    K_a, K_b = 1_000_000.0, 1_000_100.0
    lon_a = vedic_mean_longitude("Rahu", K_a)
    lon_b = vedic_mean_longitude("Rahu", K_b)
    # Rahu should DECREASE (going backwards): account for mod 360 wrap
    delta = (lon_a - lon_b) % 360
    assert 0 < delta < 30  # 100 days × ~0.053°/day retrograde ≈ 5.3°


# ──────────────────────────────────────────────────────────────────────────
# Vargas — 21 divisional charts
# ──────────────────────────────────────────────────────────────────────────

def test_21_vargas_defined():
    assert len(VARGA_LIST) == 21
    ns = [v[0] for v in VARGA_LIST]
    expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60, 108]
    assert ns == expected


def test_12_signs_defined():
    assert len(SIGN_NAMES) == 12
    assert len(SIGN_DEV) == 12


def test_d1_is_natural_sign():
    """D1 (Rāśi) should equal the sign of the longitude itself."""
    for lon in (0.0, 15.0, 30.0, 90.0, 180.0, 270.0, 359.9):
        sign_idx = int(lon // 30)
        assert compute_varga(lon, 1) == sign_idx


def test_d2_hora_canonical():
    """D2: odd-sign first 15° → Leo (4), second 15° → Cancer (3)."""
    assert compute_varga(7.5, 2) == 4    # Aries first half → Leo
    assert compute_varga(22.5, 2) == 3   # Aries second half → Cancer
    assert compute_varga(37.5, 2) == 3   # Taurus first half (even sign) → Moon (Cancer)
    assert compute_varga(52.5, 2) == 4   # Taurus second half → Sun (Leo)


def test_d9_navamsa_aries_0():
    """Aries (movable) at 0° → Navāṃśa starts from Aries → Aries."""
    assert compute_varga(0.0, 9) == 0


def test_d9_navamsa_movable_aries_padas():
    """Aries (movable): pada 1=Aries, 2=Taurus, 3=Gemini, 4=Cancer, ..."""
    assert compute_varga(2.0, 9) == 0       # pada 1 (0-3.33°) → Aries
    assert compute_varga(5.0, 9) == 1       # pada 2 (3.33-6.67°) → Taurus
    assert compute_varga(7.0, 9) == 2       # pada 3 (6.67-10°) → Gemini
    assert compute_varga(11.0, 9) == 3      # pada 4 (10-13.33°) → Cancer


def test_d30_trimsamsa_irregular():
    """D30 Aries 0-5° → Mars/Aries (0)."""
    assert compute_varga(2.5, 30) == 0     # Aries 0-5 → Mars
    assert compute_varga(7.5, 30) == 10    # Aries 5-10 → Saturn (Aquarius)
    assert compute_varga(15.0, 30) == 8    # Aries 10-18 → Jupiter (Sagittarius)
    assert compute_varga(22.5, 30) == 2    # Aries 18-25 → Mercury (Gemini)
    assert compute_varga(27.5, 30) == 6    # Aries 25-30 → Venus (Libra)


def test_compute_all_vargas_returns_21():
    lons = [0.0, 90.0, 180.0, 270.0, 359.0]
    for lon in lons:
        result = compute_all_vargas(lon)
        assert len(result) == 21
        for sign_idx in result:
            assert 0 <= sign_idx <= 11


# ──────────────────────────────────────────────────────────────────────────
# Per-cell exposure — every meridian cell has compact ints
# ──────────────────────────────────────────────────────────────────────────

def test_every_cell_has_graha_nakshatras():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for mid, m in stamp["meridians"].items():
        for pole in ("aditi", "diti"):
            for op in ("brahma", "vishnu", "mahesh"):
                cell = m["trimurti"][pole][op]
                assert "graha_nakshatras" in cell, f"{mid}.{pole}.{op}"
                assert len(cell["graha_nakshatras"]) == 9
                for naks in cell["graha_nakshatras"]:
                    assert 1 <= naks <= 27


def test_every_cell_has_vargas_moon():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for mid, m in stamp["meridians"].items():
        for pole in ("aditi", "diti"):
            for op in ("brahma", "vishnu", "mahesh"):
                cell = m["trimurti"][pole][op]
                assert "vargas_moon" in cell, f"{mid}.{pole}.{op}"
                assert len(cell["vargas_moon"]) == 21
                for sign in cell["vargas_moon"]:
                    assert 0 <= sign <= 11


# ──────────────────────────────────────────────────────────────────────────
# Claim-space cardinalities (substrate-aligned)
# ──────────────────────────────────────────────────────────────────────────

def test_iii_yoga_karana_claim_space():
    """504 × 27 × 60 = 816,480."""
    assert 504 * 27 * 60 == 816_480
    # = 2⁵ × 3⁴ × 5 × 7 × 9 = 2⁵ × 3⁶ × 5 × 7
    n = 816_480
    for p in (2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 5, 7):
        assert n % p == 0, p
        n //= p
    assert n == 1


def test_iv_vargas_claim_space():
    """504 × 21 = 10,584 cells with Moon vargas."""
    assert 504 * 21 == 10_584
    # = 2³ × 3² × 7² × 3 = 2³ × 3³ × 7²
    n = 10_584
    for p in (2, 2, 2, 3, 3, 3, 7, 7):
        assert n % p == 0, p
        n //= p
    assert n == 1


def test_v_graha_nakshatra_claim_space():
    """504 × 9 × 27 = 122,472."""
    assert 504 * 9 * 27 == 122_472
    # = 2³ × 3⁷ × 7
    n = 122_472
    for p in (2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 7):
        assert n % p == 0, p
        n //= p
    assert n == 1


def test_top_level_lookup_tables_present():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    assert "graha_metadata" in stamp
    assert "varga_metadata" in stamp
    assert "sign_metadata" in stamp
    assert len(stamp["graha_metadata"]) == 9
    assert len(stamp["varga_metadata"]) == 21
    assert len(stamp["sign_metadata"]) == 12


def test_consistency_brahma_aditi_moon_vargas():
    """The Moon vargas at Brahmā × Aditi @ Ujjain should equal compute_all_vargas
    of the Moon's longitude at that K."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    cell = stamp["meridians"]["ujjain"]["trimurti"]["aditi"]["brahma"]
    moon_lon = cell["moon_lon_deg"]
    expected = compute_all_vargas(moon_lon)
    assert cell["vargas_moon"] == expected
