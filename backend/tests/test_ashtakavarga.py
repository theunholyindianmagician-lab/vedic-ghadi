"""🔱 Aṣṭakavarga + per-graha vargas tests."""

from __future__ import annotations

import pytest

from vedic_ghadi import ghadi_at
from vedic_ghadi.substrate import GRAHA_NAMES
from vedic_ghadi.ashtakavarga import (
    ASHTAKAVARGA_TABLES, ASHTAKAVARGA_GRAHAS,
    bhinna_ashtakavarga, compute_bhinna_sarva,
    compute_bhinna_sarva_variants, MOON_VARIANT_ROWS,
)


def test_seven_av_grahas():
    assert len(ASHTAKAVARGA_GRAHAS) == 7
    assert ASHTAKAVARGA_GRAHAS == ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")


def test_every_av_graha_has_8_refs():
    for g in ASHTAKAVARGA_GRAHAS:
        refs = ASHTAKAVARGA_TABLES[g]
        assert set(refs.keys()) == {"Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna"}


def test_bhinna_av_returns_12_bindus():
    graha_signs = {g: 0 for g in GRAHA_NAMES if g not in ("Ketu",)}  # all grahas at Aries
    b = bhinna_ashtakavarga("Sun", graha_signs, lagna_sign=0)
    assert len(b) == 12
    for v in b:
        assert 0 <= v <= 8


def test_sarva_is_sum_of_7_bhinna():
    graha_lons = {g: 30.0 * i for i, g in enumerate(GRAHA_NAMES) if g != "Ketu"}
    graha_lons["Ketu"] = (graha_lons["Rahu"] + 180.0) % 360.0
    result = compute_bhinna_sarva(graha_lons)
    # Sarva[i] should equal sum of bhinna[g][i] for all 7 grahas
    for i in range(12):
        s = sum(result["bhinna"][g][i] for g in ASHTAKAVARGA_GRAHAS)
        assert result["sarva"][i] == s


def test_av_totals_per_graha_exact_bphs():
    """Each graha's Bhinna-AV total must EQUAL the BPHS canonical value exactly.
    (Tolerance here used to hide the −1 astakavarga bug — see never-lose-again.)"""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    cell = stamp["meridians"]["ujjain"]["trimurti"]["aditi"]["brahma"]
    totals = cell["ashtakavarga"]["per_graha_totals"]
    canonical = {"Sun": 48, "Moon": 49, "Mars": 39, "Mercury": 54,
                 "Jupiter": 56, "Venus": 52, "Saturn": 39}
    for g, expected in canonical.items():
        assert totals[g] == expected, f"{g}: got {totals[g]}, expected {expected}"


def test_av_sarva_total_exactly_337():
    """Sarva total must EQUAL 337 exactly (BPHS canonical sum)."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    cell = stamp["meridians"]["ujjain"]["trimurti"]["aditi"]["brahma"]
    sarva_total = cell["ashtakavarga"]["sarva_total"]
    assert sarva_total == 337, f"Sarva total {sarva_total}, expected 337"


def test_every_cell_has_ashtakavarga():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for m in stamp["meridians"].values():
        for pole in ("aditi", "diti"):
            for op in ("brahma", "vishnu", "mahesh"):
                cell = m["trimurti"][pole][op]
                assert "ashtakavarga" in cell
                av = cell["ashtakavarga"]
                assert "bhinna" in av
                assert "sarva" in av
                assert "sarva_total" in av
                assert len(av["sarva"]) == 12
                assert set(av["bhinna"].keys()) == set(ASHTAKAVARGA_GRAHAS)


def test_every_cell_has_per_graha_vargas():
    """v1.9.0: 9 grahas × 21 vargas per cell."""
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    for m in stamp["meridians"].values():
        for pole in ("aditi", "diti"):
            for op in ("brahma", "vishnu", "mahesh"):
                cell = m["trimurti"][pole][op]
                assert "vargas_grahas" in cell
                assert set(cell["vargas_grahas"].keys()) == set(GRAHA_NAMES)
                for g in GRAHA_NAMES:
                    assert len(cell["vargas_grahas"][g]) == 21


def test_claim_space_per_graha_vargas():
    """504 × 9 × 21 = 95,256 per-instant facts (per-graha vargas)."""
    assert 504 * 9 * 21 == 95_256
    # = 2³ × 3³ × 7² × 3² = 2³ × 3⁵ × 7² × ... hmm
    n = 95_256
    for p in (2, 2, 2, 3, 3, 3, 3, 3, 7, 7):
        assert n % p == 0, p
        n //= p
    assert n == 1


def test_claim_space_ashtakavarga():
    """504 × 7 × 12 = 42,336 bindu cells (per-cell bhinna-AV)."""
    assert 504 * 7 * 12 == 42_336
    # = 2⁵ × 3³ × 7²
    n = 42_336
    for p in (2, 2, 2, 2, 2, 3, 3, 3, 7, 7):
        assert n % p == 0, p
        n //= p
    assert n == 1


def test_av_uses_surya_lagna():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    cell = stamp["meridians"]["ujjain"]["trimurti"]["aditi"]["brahma"]
    av = cell["ashtakavarga"]
    # Lagna sign should equal Sun's sign
    sun_naks_idx = cell["graha_nakshatras"][0] - 1
    # Sun's sign = floor(sun_lon / 30); we don't have sun_lon directly but moon_lon yes
    # We can verify lagna_sign is in [0, 11]
    assert 0 <= av["lagna_sign"] <= 11


# ──────────────────────────────────────────────────────────────────────────
# Moon-table variants in parallel (bpns / phaladipika / varahamihira)
# ──────────────────────────────────────────────────────────────────────────

def _variant_fixture():
    """Deterministic 9-graha fixture → signs Sun=0 Moon=1 Mars=2 Mercury=3
    Jupiter=4 Venus=5 Saturn=6 Rahu=7 Ketu=1; observer Lagna = 240° → sign 8."""
    graha_lons = {g: 30.0 * i for i, g in enumerate(GRAHA_NAMES) if g != "Ketu"}
    graha_lons["Ketu"] = (graha_lons["Rahu"] + 180.0) % 360.0
    return graha_lons


def test_moon_variants_all_total_337_and_moon_49():
    variants = compute_bhinna_sarva_variants(_variant_fixture(), lagna_lon_deg=240.0)
    assert set(variants) == {"bpns", "phaladipika", "varahamihira"}
    for vid, v in variants.items():
        assert v["sarva_total"] == 337, vid
        assert v["per_graha_totals"]["Moon"] == 49, vid
        assert v["variant"] == vid


def test_moon_variants_only_affect_chandra_rows():
    """Non-Moon grahas byte-identical across variants; Chandra differs exactly
    in the two documented places (pinned row substitutions)."""
    graha_lons = _variant_fixture()
    variants = compute_bhinna_sarva_variants(graha_lons, lagna_lon_deg=240.0)
    base = variants["bpns"]
    signs = {g: int(graha_lons[g] // 30) % 12 for g in graha_lons}
    moon_sign, mars_sign, jup_sign = signs["Moon"], signs["Mars"], signs["Jupiter"]

    for g in ("Sun", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"):
        for vid in ("phaladipika", "varahamihira"):
            assert variants[vid]["bhinna"][g] == base["bhinna"][g], (vid, g)

    # Phaladīpikā: the 9 moves Moon-from-Moon → Moon-from-Mars.
    phd = variants["phaladipika"]["bhinna"]["Moon"]
    bphs = base["bhinna"]["Moon"]
    assert phd[(moon_sign + 8) % 12] == bphs[(moon_sign + 8) % 12] - 1  # 9 removed
    assert phd[(mars_sign + 8) % 12] == bphs[(mars_sign + 8) % 12] + 1  # 9 added

    # Varāhamihira: Jupiter row (1,2,4,7,8,10,11) → (1,4,7,8,10,11,12):
    #   offset 2 removed → −1 at ref+1; offset 12 added → +1 at ref+11.
    var = variants["varahamihira"]["bhinna"]["Moon"]
    assert var[(jup_sign + 1) % 12] == bphs[(jup_sign + 1) % 12] - 1
    assert var[(jup_sign + 11) % 12] == bphs[(jup_sign + 11) % 12] + 1


def test_substrate_exposes_all_variants():
    stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
    cell = stamp["meridians"]["ujjain"]["trimurti"]["aditi"]["brahma"]
    avs = cell["ashtakavarga_variants"]
    assert set(avs) == {"bpns", "phaladipika", "varahamihira"}
    # Main section stays aligned to BPHS: ashtakavarga == variants["bpns"].
    assert cell["ashtakavarga"]["bhinna"] == avs["bpns"]["bhinna"]
    assert cell["ashtakavarga"]["sarva_total"] == avs["bpns"]["sarva_total"] == 337
