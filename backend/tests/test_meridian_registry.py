"""🔱 Tests for the 12-meridian registry."""

from __future__ import annotations

import pytest

from vedic_ghadi import ghadi_at
from vedic_ghadi.substrate import (
    MERIDIAN_REGISTRY, MERIDIAN_CATEGORIES,
    compute_meridian_views, meridian_groups,
    UJJAIN_LON_DEG, civil_input_to_kali_civil_days,
)


def test_registry_has_84_meridians():
    # Saptamukhi cannon: 7 mukhas × 12 meridians = 84 = 2² × 3 × 7
    assert len(MERIDIAN_REGISTRY) == 84


def test_registry_has_7_mukhas():
    assert len(MERIDIAN_CATEGORIES) == 7
    cats = {c[0] for c in MERIDIAN_CATEGORIES}
    assert cats == {"purva", "dakshina", "paschim", "uttara", "urdhva", "kala", "sarva"}


def test_all_mukhas_have_exactly_12_meridians():
    """Each mukha (face of Hanumān) fires exactly 12 sphoṭas."""
    g = meridian_groups()
    for cat, _label in MERIDIAN_CATEGORIES:
        assert len(g[cat]) == 12, f"mukha {cat} has {len(g[cat])} (must be 12)"


def test_no_duplicate_meridian_ids():
    ids = [m[0] for m in MERIDIAN_REGISTRY]
    assert len(ids) == len(set(ids)), f"duplicate ids: {ids}"


def test_jyotirlinga_meridians_present():
    """12 Jyotirliṅgas — verify the registered ones are tagged correctly."""
    ids = {m[0] for m in MERIDIAN_REGISTRY}
    # Jyotirliṅgas in the registry (some are direct, others are co-located)
    jyotirlingas_in_registry = (
        "somnath", "mallikarjuna", "ujjain",          # 3 of 12 (Mahākāl = Ujjain)
        "omkareshwar", "kedarnath",                    # 5
        "bhimashankar", "kashi",                       # 7 (Vishvanāth = Kāśī)
        "trimbakeshwar", "vaidyanath",                 # 9
        "nageshwar", "rameshwaram", "grishneshwar",   # 12
    )
    for j in jyotirlingas_in_registry:
        assert j in ids, f"missing Jyotirliṅga: {j}"


def test_char_dham_all_four_present():
    ids = {m[0] for m in MERIDIAN_REGISTRY}
    for required in ("badrinath", "dwarka", "rameshwaram", "puri"):
        assert required in ids, f"missing char-dham: {required}"


def test_chota_char_dham_present():
    ids = {m[0] for m in MERIDIAN_REGISTRY}
    for required in ("yamunotri", "gangotri", "kedarnath", "badrinath"):
        assert required in ids, f"missing chota char dham: {required}"


def test_shakti_pithas_present():
    """Major Shakti-pīṭhas should be in the registry."""
    ids = {m[0] for m in MERIDIAN_REGISTRY}
    for p in ("kamakhya", "vaishno_devi", "kalighat", "tripura_sundari",
              "tarapith", "kanyakumari", "kolhapur", "jwala_devi", "chamunda"):
        assert p in ids, f"missing Shakti-pīṭha: {p}"


def test_sapta_puri_complete():
    """7 mokṣa-dāyaka purīs."""
    ids = {m[0] for m in MERIDIAN_REGISTRY}
    for sp in ("ayodhya", "mathura", "haridwar", "kashi", "kanchipuram",
               "ujjain", "dwarka"):
        assert sp in ids, f"missing Sapta-Purī: {sp}"


def test_kumbh_mela_sites_present():
    ids = {m[0] for m in MERIDIAN_REGISTRY}
    for k in ("haridwar", "prayagraj", "ujjain", "nashik"):
        assert k in ids, f"missing Kumbh site: {k}"


def test_universal_anchors_present():
    ids = {m[0] for m in MERIDIAN_REGISTRY}
    for u in ("greenwich", "mecca", "jerusalem", "lumbini", "bodh_gaya",
              "new_york", "tokyo", "sydney"):
        assert u in ids, f"missing universal anchor: {u}"
    # Greenwich is at 0° exactly
    g_entry = next(m for m in MERIDIAN_REGISTRY if m[0] == "greenwich")
    assert g_entry[4] == 0.0


# ──────────────────────────────────────────────────────────────────────────
# Per-meridian view correctness
# ──────────────────────────────────────────────────────────────────────────

def test_views_keyed_by_id():
    K_u = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    views = compute_meridian_views(K_u)
    for m in MERIDIAN_REGISTRY:
        assert m[0] in views, f"missing view: {m[0]}"
        v = views[m[0]]
        assert v["id"] == m[0]
        assert v["lon_deg"] == m[4]
        assert v["category"] == m[5]
        assert "kali_civil_days" in v
        assert "vara" in v
        assert "day_subdivision" in v


def test_offset_from_ujjain_is_exact():
    """For every meridian M, offset = (LON_M − UJJAIN_LON) / 15 / 24 (in days)."""
    K_u = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    views = compute_meridian_views(K_u)
    for v in views.values():
        expected = (v["lon_deg"] - UJJAIN_LON_DEG) / 15.0 / 24.0
        assert v["offset_from_ujjain_days"] == pytest.approx(expected, abs=1e-6)


def test_ujjain_view_has_zero_offset():
    K_u = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    views = compute_meridian_views(K_u)
    assert views["ujjain"]["offset_from_ujjain_days"] == pytest.approx(0.0, abs=1e-9)
    assert views["ujjain"]["kali_civil_days"] == pytest.approx(K_u, abs=1e-6)


def test_greenwich_runs_about_5h_behind_ujjain():
    """Ujjain LMT is +5:03 from Greenwich, so Greenwich is ~5h behind."""
    K_u = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    views = compute_meridian_views(K_u)
    g_min = views["greenwich"]["offset_from_ujjain_min"]
    assert -310 < g_min < -300, f"Greenwich offset {g_min} min off expected ~-303"


def test_new_york_runs_about_10h_behind_ujjain():
    """NYC at -74° is 74+76 = 150° west of Ujjain → -10h offset."""
    K_u = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    views = compute_meridian_views(K_u)
    ny_min = views["new_york"]["offset_from_ujjain_min"]
    assert -610 < ny_min < -590, f"NYC offset {ny_min} min off expected ~-599"


def test_kamakhya_runs_about_64m_ahead():
    K_u = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    views = compute_meridian_views(K_u)
    k_min = views["kamakhya"]["offset_from_ujjain_min"]
    assert 63 < k_min < 65, f"Kāmākhyā offset {k_min} min off expected ~63.71"


# ──────────────────────────────────────────────────────────────────────────
# All vāras valid; vāra index in [0, 6]
# ──────────────────────────────────────────────────────────────────────────

def test_every_meridian_has_valid_vara_and_subdivision():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for mid, v in stamp["meridians"].items():
        assert 0 <= v["vara"]["vara_index"] <= 6
        assert 1 <= v["day_subdivision"]["muhurta_index"] <= 30
        assert 1 <= v["day_subdivision"]["ghati_index"] <= 60
        assert 1 <= v["day_subdivision"]["prana_index"] <= 6


# ──────────────────────────────────────────────────────────────────────────
# Stamp shape
# ──────────────────────────────────────────────────────────────────────────

def test_stamp_includes_full_registry():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    assert "meridians" in stamp
    assert "meridian_groups" in stamp
    assert "meridian_categories" in stamp
    assert len(stamp["meridians"]) == 84


def test_backward_compat_by_meridian_still_works():
    """The old by_meridian.ujjain / .kamakhya API must still resolve."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    assert stamp["by_meridian"]["ujjain"]["kali_civil_days"] == pytest.approx(
        stamp["meridians"]["ujjain"]["kali_civil_days"], abs=1e-9,
    )
    assert stamp["by_meridian"]["kamakhya"]["kali_civil_days"] == pytest.approx(
        stamp["meridians"]["kamakhya"]["kali_civil_days"], abs=1e-9,
    )
