"""
🔱 Substrate correctness — anchor tests against known canonical values.

These are not approximate vibe-checks; they are anchor points where the
substrate's output is determined by Sūrya Siddhānta constants alone, so
the values are reproducible across any compliant implementation.
"""

from __future__ import annotations

import math

import pytest

from vedic_ghadi import (
    ghadi_at,
    civil_input_to_kali_civil_days,
)
from vedic_ghadi.substrate import (
    KALI_DAYS_PER_YEAR, MAHAYUGA_CIVIL_DAYS, MAHAYUGA_YEARS,
    samvatsara_at_kali_year, vedic_mean_longitude,
    vedic_vara_at_kali_days,
    KAMAKHYA_LMT_OFFSET_H,
)


# ──────────────────────────────────────────────────────────────────────────
# Sūrya Siddhānta constants — verbatim from canon
# ──────────────────────────────────────────────────────────────────────────

def test_mahayuga_constants():
    assert MAHAYUGA_YEARS == 4_320_000
    assert MAHAYUGA_CIVIL_DAYS == 1_577_917_500
    # Exact division: 1_577_917_500 / 4_320_000 = 365.258680555…
    assert KALI_DAYS_PER_YEAR == pytest.approx(365.25868055555554, abs=1e-9)


def test_kamakhya_meridian():
    # 91.7059° / 15 = 6.11373... LMT offset from Greenwich
    assert KAMAKHYA_LMT_OFFSET_H == pytest.approx(6.1137267, abs=1e-6)


# ──────────────────────────────────────────────────────────────────────────
# Kali day count — anchor at the substrate's snapshot moment
# ──────────────────────────────────────────────────────────────────────────

def test_known_kali_day_anchor():
    """2026-05-17 16:00:00 IST — the substrate's canonical day count."""
    kd = civil_input_to_kali_civil_days(2026, 5, 17, 16, 0, 0, 5.5)
    # Computed canonically from JD-UT → Kāmākhyā Kali days (Sūrya Siddhānta)
    assert kd == pytest.approx(1_872_712.647997, abs=1e-5)


def test_kali_day_progresses_one_per_civil_day():
    a = civil_input_to_kali_civil_days(2026, 1, 1, 0, 0, 0, 5.5)
    b = civil_input_to_kali_civil_days(2026, 1, 2, 0, 0, 0, 5.5)
    assert (b - a) == pytest.approx(1.0, abs=1e-9)


# ──────────────────────────────────────────────────────────────────────────
# Saṃvatsara cycle — Parābhava (#40) at 2026-05-17 anchor
# ──────────────────────────────────────────────────────────────────────────

def test_samvatsara_at_anchor():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    sv = stamp["year_layer"]["samvatsara"]
    assert sv["name"] == "Parābhava"
    assert sv["index"] == 39   # 0-based


# ──────────────────────────────────────────────────────────────────────────
# Vāra — Kali Yuga begins on Śukravāra, so day-0 must be Friday
# ──────────────────────────────────────────────────────────────────────────

def test_kali_day_zero_is_shukravara():
    v = vedic_vara_at_kali_days(0.0)
    assert v["vara_name"] == "Śukravāra"
    assert v["vara_index"] == 5
    assert v["vara_lord_graha"] == "Venus"


def test_kali_day_one_is_shanivara():
    v = vedic_vara_at_kali_days(1.0)
    assert v["vara_name"] == "Śanivāra"


def test_2026_05_17_is_ravivara():
    """17 May 2026 is a Sunday (verified independently)."""
    stamp = ghadi_at(2026, 5, 17, 12, 0, 0, 5.5)
    assert stamp["vara_layer"]["vara_name"] == "Ravivāra"


# ──────────────────────────────────────────────────────────────────────────
# Tithi: Moon − Sun elongation mod 360 / 12 gives tithi index
# ──────────────────────────────────────────────────────────────────────────

def test_tithi_at_anchor():
    """At 2026-05-17 16:00 IST the moon is Śukla Dvitīyā (verified)."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    t = stamp["tithi_layer"]
    assert t["paksha_name"] == "Śukla-pakṣa"
    assert t["tithi_name"] == "Dvitīyā"
    assert t["tithi_index"] == 2


# ──────────────────────────────────────────────────────────────────────────
# Māsa — Sun in Vṛṣabha (#2) → Jyeṣṭha
# ──────────────────────────────────────────────────────────────────────────

def test_masa_at_anchor():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    m = stamp["month_layer"]
    assert m["masa_name"] == "Jyeṣṭha"
    assert m["sun_sign_index"] == 2  # Vṛṣabha
    assert 0 <= m["sun_sidereal_lon_deg"] < 360


# ──────────────────────────────────────────────────────────────────────────
# Day subdivision — every count factors over (2, 3, 5)
# ──────────────────────────────────────────────────────────────────────────

def test_day_subdivision_factors():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    d = stamp["day_subdivision"]
    assert 1 <= d["muhurta_index"] <= 30
    assert 1 <= d["ghati_index"] <= 60
    assert 1 <= d["vighati_index"] <= 60
    assert 1 <= d["prana_index"] <= 6
    assert 0 <= d["vipala_fractional"] < 10


def test_muhurta_ghati_consistency():
    """muhūrta = 1/30 day, ghaṭi = 1/60 day → muhūrta_count = ghaṭi_count / 2."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    d = stamp["day_subdivision"]
    # We can't directly assert ghati = 2 * muhurta because they tick
    # at different rates within their fractional parts, but the
    # *index pair* is always consistent: floor(frac*30) and floor(frac*60).
    frac = d["fraction_of_day"]
    assert d["muhurta_index"] == math.floor(frac * 30) + 1
    assert d["ghati_index"] == math.floor(frac * 60) + 1


# ──────────────────────────────────────────────────────────────────────────
# Sun mean motion — should circle the zodiac in ~365.26 days
# ──────────────────────────────────────────────────────────────────────────

def test_sun_one_year_returns_to_origin():
    days_per_year = MAHAYUGA_CIVIL_DAYS / MAHAYUGA_YEARS
    lon0 = vedic_mean_longitude("Sun", 0.0)
    lon1 = vedic_mean_longitude("Sun", days_per_year)
    # Sun should return to the same longitude after one sidereal year (mod 360)
    delta = abs((lon1 - lon0 + 180) % 360 - 180)
    assert delta < 1e-6


# ──────────────────────────────────────────────────────────────────────────
# Stamp shape — every documented key is present
# ──────────────────────────────────────────────────────────────────────────

def test_stamp_keys():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for k in ("input_civil", "kali_civil_days_at_kamakhya",
              "year_layer", "month_layer", "tithi_layer",
              "vara_layer", "day_subdivision", "substrate_alignment",
              "discipline"):
        assert k in stamp, f"missing key: {k}"


# ──────────────────────────────────────────────────────────────────────────
# Substrate factor table — every count truly factors over (2, 3, 5)
# (except vāra=7 which is graha-special, called out explicitly)
# ──────────────────────────────────────────────────────────────────────────

def _factors_over_235(n: int) -> bool:
    for p in (2, 3, 5):
        while n % p == 0:
            n //= p
    return n == 1


def test_substrate_table_factors():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    table = stamp["substrate_alignment"]
    for key, (count, _desc) in table.items():
        if key in ("vara_count", "saptamukhi"):
            assert count == 7
            continue
        assert _factors_over_235(int(count)), f"{key}={count} doesn't factor over (2,3,5)"
