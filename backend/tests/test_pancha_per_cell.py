"""
🔱 Per-cell pañcāṅga tests — 13,608 and 54,432 claim-space cardinality.

Every Trimūrti × Bipolar × Meridian cell (504 total) gets its own:
  • nakṣatra (1 of 27)  · derived from moon position at K_shifted
  • pada     (1 of 4)   · within the nakṣatra
  • yoga     (1 of 27)  · (sun+moon)/13.33° at K_shifted
  • karaṇa   (1 of 60)  · (moon-sun)/6° at K_shifted

Claim-space cardinalities (substrate-aligned):
  • 504 × 27          = 13,608    (Trimurti×Bipolar×Meridian × nakṣatra)   2³ × 3⁵ × 7
  • 504 × 108         = 54,432    (... × nakṣatra × pada = 108)            2⁵ × 3⁵ × 7
  • 504 × 27 × 4      = 54,432    (same as above)
  • 504 × 27 × 60     = 816,480   (× karaṇa)
  • 504 × 27 × 27     = 367,416   (× yoga)
  • 504 × 27 × 4 × 27 × 60 = 88,179,840   (full pañcāṅga lattice)
"""

from __future__ import annotations

import pytest

from vedic_ghadi import ghadi_at
from vedic_ghadi.substrate import (
    compute_trimurti_views, vedic_time_of_day, vedic_time_of_day_diti,
    civil_input_to_kali_civil_days,
)


# ──────────────────────────────────────────────────────────────────────────
# Per-cell pañcāṅga fields exist
# ──────────────────────────────────────────────────────────────────────────

def test_each_trimurti_view_has_full_panchanga():
    K = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    tv = compute_trimurti_views(K, vedic_time_of_day)
    for op_id, v in tv.items():
        assert "nakshatra" in v, f"missing nakshatra on {op_id}"
        assert "yoga" in v
        assert "karana" in v
        assert v["nakshatra"]["nakshatra_name"] in (
            "Aśvinī Bharaṇī Kṛttikā Rohiṇī Mṛgaśīrṣā Ārdrā Punarvasu Puṣya "
            "Āśleṣā Maghā Pūrvaphalgunī Uttaraphalgunī Hasta Citrā Svātī "
            "Viśākhā Anurādhā Jyeṣṭhā Mūla Pūrvāṣāḍhā Uttarāṣāḍhā Śravaṇa "
            "Dhaniṣṭhā Śatabhiṣā Pūrvabhādrapadā Uttarabhādrapadā Revatī".split()
        )
        assert 1 <= v["nakshatra"]["pada"] <= 4


# ──────────────────────────────────────────────────────────────────────────
# All 504 cells have full pañcāṅga
# ──────────────────────────────────────────────────────────────────────────

def test_all_504_cells_have_panchanga():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    count = 0
    for mid, m in stamp["meridians"].items():
        for pole in m["trimurti"]:
            for op_id, cell in m["trimurti"][pole].items():
                count += 1
                assert "nakshatra" in cell, f"missing nakshatra at {mid}.{pole}.{op_id}"
                assert "yoga" in cell
                assert "karana" in cell
                assert 1 <= cell["nakshatra"]["nakshatra_index"] <= 27
                assert 1 <= cell["nakshatra"]["pada"] <= 4
                assert 1 <= cell["yoga"]["yoga_index"] <= 27
                assert 1 <= cell["karana"]["karana_index"] <= 60
    assert count == 504


# ──────────────────────────────────────────────────────────────────────────
# Trimūrti shifts DO change nakṣatra/pada at boundaries
# ──────────────────────────────────────────────────────────────────────────

def test_trimurti_shifts_can_change_nakshatra():
    """At our snapshot, Brahmā vs Maheśa (K + 2/3) should reach a different
    nakṣatra ~33% of the time (moon shifts 8.78°, nakṣatra width 13.33°)."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    u = stamp["meridians"]["ujjain"]["trimurti"]["aditi"]
    # Brahmā: moon ≈ 46.45° → Rohiṇī
    # Maheśa: moon ≈ 55.23° → Mṛgaśīrṣā (boundary at 53.33°)
    assert u["brahma"]["nakshatra"]["nakshatra_name"] == "Rohiṇī"
    assert u["mahesh"]["nakshatra"]["nakshatra_name"] == "Mṛgaśīrṣā"
    assert u["brahma"]["nakshatra"]["nakshatra_name"] != u["mahesh"]["nakshatra"]["nakshatra_name"]


def test_trimurti_shifts_change_pada():
    """Pada is 3.33° wide; Trimurti shifts of 4.39° always cross at least
    one pada boundary. Brahmā vs Viṣṇu should always differ."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    u = stamp["meridians"]["ujjain"]["trimurti"]["aditi"]
    # Brahmā pada 2, Viṣṇu pada 4 (moon shifts from 46.45° to 50.84°)
    assert u["brahma"]["nakshatra"]["pada"] != u["vishnu"]["nakshatra"]["pada"]


# ──────────────────────────────────────────────────────────────────────────
# Claim-space cardinality (substrate-aligned)
# ──────────────────────────────────────────────────────────────────────────

def test_claim_space_13608():
    """504 cells × 27 nakṣatras = 13,608 possible (cell, nakṣatra) attributions."""
    cells = 84 * 2 * 3  # meridians × poles × Trimurti
    assert cells == 504
    assert cells * 27 == 13_608
    # Substrate factor: 13608 = 2³ × 3⁵ × 7
    n = 13_608
    for p in (2, 2, 2, 3, 3, 3, 3, 3, 7):
        assert n % p == 0
        n //= p
    assert n == 1


def test_claim_space_54432():
    """504 cells × 108 (nakṣatra × pada) = 54,432 attributions."""
    cells = 504
    assert cells * 108 == 54_432
    # Substrate factor: 54432 = 2⁵ × 3⁵ × 7
    n = 54_432
    for p in (2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 7):
        assert n % p == 0
        n //= p
    assert n == 1


def test_full_panchanga_lattice():
    """504 × 27 × 4 × 27 × 60 = 88,179,840 attribution-cardinality."""
    assert 504 * 27 * 4 * 27 * 60 == 88_179_840


# ──────────────────────────────────────────────────────────────────────────
# Yoga & karaṇa per cell — substrate-coherent
# ──────────────────────────────────────────────────────────────────────────

def test_yoga_indices_in_range():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for m in stamp["meridians"].values():
        for pole in m["trimurti"]:
            for cell in m["trimurti"][pole].values():
                assert 1 <= cell["yoga"]["yoga_index"] <= 27


def test_karana_indices_in_range():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for m in stamp["meridians"].values():
        for pole in m["trimurti"]:
            for cell in m["trimurti"][pole].values():
                assert 1 <= cell["karana"]["karana_index"] <= 60


# ──────────────────────────────────────────────────────────────────────────
# Brahmā × Aditi cell pañcāṅga = existing top-level nakshatra_layer
# (consistency anchor)
# ──────────────────────────────────────────────────────────────────────────

def test_brahma_aditi_ujjain_nakshatra_matches_top_level():
    """Top-level nakshatra_layer uses unshifted K (= Brahmā at Ujjain)."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    top = stamp["nakshatra_layer"]
    cell = stamp["meridians"]["ujjain"]["trimurti"]["aditi"]["brahma"]["nakshatra"]
    assert top["nakshatra_name"] == cell["nakshatra_name"]
    assert top["pada"] == cell["pada"]
