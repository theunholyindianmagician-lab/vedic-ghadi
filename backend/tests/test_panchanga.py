"""🔱 Pañcāṅga — nakṣatra · yoga · karaṇa correctness anchors."""

from __future__ import annotations

import pytest

from vedic_ghadi import (
    ghadi_at,
    nakshatra_at_kali_days, yoga_at_kali_days, karana_at_kali_days,
    NAKSHATRA_NAMES, NAKSHATRA_LORD, YOGA_NAMES, KARANA_CARA,
)
from vedic_ghadi.substrate import civil_input_to_kali_civil_days


# ──────────────────────────────────────────────────────────────────────────
# Canonical counts
# ──────────────────────────────────────────────────────────────────────────

def test_canonical_counts():
    assert len(NAKSHATRA_NAMES) == 27        # 3³
    assert len(NAKSHATRA_LORD) == 27         # 9-cycle × 3
    assert len(YOGA_NAMES) == 27             # 3³
    assert len(KARANA_CARA) == 7             # 7 cara karaṇas (cycles 8× = 56)


def test_substrate_factors():
    # 27 = 3³, 60 = 2²×3×5, 4 = 2², 8 = 2³ — all (2,3,5)-only
    for n, expected_factors in [(27, (3,3,3)), (60, (2,2,3,5)), (4, (2,2))]:
        prod = 1
        for f in expected_factors: prod *= f
        assert prod == n


# ──────────────────────────────────────────────────────────────────────────
# Vimśottarī daśā lordship cycles every 9 nakṣatras (Ketu, Venus, Sun, …)
# ──────────────────────────────────────────────────────────────────────────

def test_vimshottari_cycles_every_9():
    for i in range(27):
        assert NAKSHATRA_LORD[i] == NAKSHATRA_LORD[(i + 9) % 27]


def test_vimshottari_starts_with_ketu():
    assert NAKSHATRA_LORD[0] == "Ketu"    # Aśvinī = Ketu
    assert NAKSHATRA_LORD[1] == "Venus"   # Bharaṇī = Venus
    assert NAKSHATRA_LORD[8] == "Mercury" # Āśleṣā = Mercury
    assert NAKSHATRA_LORD[9] == "Ketu"    # Maghā = Ketu (cycle restart)


# ──────────────────────────────────────────────────────────────────────────
# Anchor: 2026-05-17 16:00 IST → Rohiṇī pada 3, Atigaṇḍa, Bālava
# (verified by running the implementation)
# ──────────────────────────────────────────────────────────────────────────

@pytest.fixture
def kd_anchor():
    return civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)


def test_nakshatra_at_anchor(kd_anchor):
    n = nakshatra_at_kali_days(kd_anchor)
    assert n["nakshatra_name"] == "Rohiṇī"
    assert n["nakshatra_index"] == 4
    assert n["nakshatra_deity"] == "Brahmā"
    assert n["nakshatra_lord"] == "Moon"
    assert 1 <= n["pada"] <= 4


def test_yoga_at_anchor(kd_anchor):
    y = yoga_at_kali_days(kd_anchor)
    assert y["yoga_name"] == "Atigaṇḍa"
    assert y["yoga_index"] == 6
    assert 0 <= y["sun_plus_moon_lon_deg"] < 360


def test_karana_at_anchor(kd_anchor):
    k = karana_at_kali_days(kd_anchor)
    assert k["karana_name"] == "Bālava"
    assert k["is_movable"] is True
    assert k["movable_cycle_number"] == 1
    assert 1 <= k["karana_index"] <= 60


# ──────────────────────────────────────────────────────────────────────────
# Stamp keys — pañcāṅga layers wired in
# ──────────────────────────────────────────────────────────────────────────

def test_stamp_includes_panchanga():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for k in ("nakshatra_layer", "yoga_layer", "karana_layer"):
        assert k in stamp
    assert stamp["nakshatra_layer"]["nakshatra_name"] == "Rohiṇī"
    assert stamp["yoga_layer"]["yoga_name"] == "Atigaṇḍa"
    assert stamp["karana_layer"]["karana_name"] == "Bālava"


# ──────────────────────────────────────────────────────────────────────────
# Karaṇa cycle invariant: full lunar month = 1 + 56 + 3 = 60 half-tithis
# ──────────────────────────────────────────────────────────────────────────

def test_karana_distribution_across_full_month():
    """Walk all 60 half-tithis explicitly via the helper."""
    from vedic_ghadi.panchanga import _karana_for_half_tithi
    movable_count = sum(1 for i in range(60) if _karana_for_half_tithi(i)[2])
    fixed_count = sum(1 for i in range(60) if not _karana_for_half_tithi(i)[2])
    assert movable_count == 56
    assert fixed_count == 4
    # Sthira karaṇas must land on indices 0, 57, 58, 59
    for idx in (0, 57, 58, 59):
        assert _karana_for_half_tithi(idx)[2] is False
    # Cara cycles must run 1..8 across the 56 movable slots
    cycles_seen = {_karana_for_half_tithi(i)[3] for i in range(1, 57)}
    assert cycles_seen == {1, 2, 3, 4, 5, 6, 7, 8}
