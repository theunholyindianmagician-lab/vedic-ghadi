"""
🔱 AṢṬAKAVARGA — 7 Bhinna + 1 Sarva = 337-bindu strength matrix.

Per BPHS Ch. 66 + Phaladīpikā Ch. 24:

For each of 7 grahas (Sun..Saturn — no Rāhu/Ketu), each of 8 reference
points (the other 6 grahas + itself + Lagna) contributes "bindus" to
specific signs (counted from that reference). Each graha's Bhinna-AV
is the per-sign sum; Sarva-AV is the sum across all 7 grahas.

Canonical totals (sum across 12 signs of each graha's Bhinna-AV):
  Sun = 48 · Moon = 49 · Mars = 39 · Mercury = 54 · Jupiter = 56
  Venus = 52 · Saturn = 39
  Sum (Sarva) = 337  (invariant across ALL Moon-table variants below)

CONVENTION / SOURCES (pinned 2026-08-10 against primary texts):
  Primary = BPHS Ch. 66 (Santhanam translation, archive.org full text).
  Cross-checked row-by-row against: P.V.R. Narasimha Rao's BPHS tables,
  Phaladīpikā Ch. 23 verse (siva.sh), and M.S. Mehta's ashtakavarga tables.
  All 56 rows agree EXCEPT two documented Moon-table transpositions where
  BPHS and Phaladīpikā differ:
    - Moon-from-Mars: BPHS = (2,3,5,6,10,11); Phaladīpikā adds the 9.
    - Moon-from-Jupiter: BPHS = Phaladīpikā-main = (1,2,4,7,8,10,11);
      Varāhamihira variant (Phaladīpikā footnote) = (1,4,7,8,10,11,12).

PARALLEL VARIANTS (2026-08-10): rather than picking one school, the engine
computes ALL three documented Moon-table conventions in parallel. The main
`ashtakavarga` block stays aligned to BPHS (the oracle's declared anchor);
`ashtakavarga_variants` carries all three:
  - "bpns"          BPHS Ch. 66               (default · oracle anchor)
  - "phaladipika"   Phaladīpikā Ch. 23 transposed 9 → Moon-from-Mars
  - "varahamihira"  Phaladīpikā footnote / M.S. Mehta — Jupiter row variant
Each keeps Moon = 49 and Sarva = 337 (the 9 is moved, never duplicated —
the earlier HYBRID bug took the 9 in BOTH rows → Moon totalled 50).

In this implementation we use the observer sidereal ascendant as Lagna;
`lagna_lon_deg=None` keeps the Sūrya-Lagna (Sun's sign) proxy.
"""

from __future__ import annotations

# ═══════════════════════════════════════════════════════════════════════════
# ◈ ASHTAKAVARGA TABLES — sign-offsets (1-indexed, counted from each ref)
# Each entry: {target_graha: {reference: tuple of sign-offsets}}
# ═══════════════════════════════════════════════════════════════════════════

ASHTAKAVARGA_TABLES = {
    # ── SŪRYA AṢṬAKAVARGA ─────────────────────────────────────────────
    "Sun": {
        "Sun":     (1, 2, 4, 7, 8, 9, 10, 11),
        "Moon":    (3, 6, 10, 11),
        "Mars":    (1, 2, 4, 7, 8, 9, 10, 11),
        "Mercury": (3, 5, 6, 9, 10, 11, 12),
        "Jupiter": (5, 6, 9, 11),
        "Venus":   (6, 7, 12),
        "Saturn":  (1, 2, 4, 7, 8, 9, 10, 11),
        "Lagna":   (3, 4, 6, 10, 11, 12),
    },
    # ── CHANDRA AṢṬAKAVARGA ───────────────────────────────────────────
    "Moon": {
        "Sun":     (3, 6, 7, 8, 10, 11),
        "Moon":    (1, 3, 6, 7, 9, 10, 11),
        "Mars":    (2, 3, 5, 6, 10, 11),
        "Mercury": (1, 3, 4, 5, 7, 8, 10, 11),
        "Jupiter": (1, 2, 4, 7, 8, 10, 11),
        "Venus":   (3, 4, 5, 7, 9, 10, 11),
        "Saturn":  (3, 5, 6, 11),
        "Lagna":   (3, 6, 10, 11),
    },
    # ── MAṄGALA AṢṬAKAVARGA ───────────────────────────────────────────
    "Mars": {
        "Sun":     (3, 5, 6, 10, 11),
        "Moon":    (3, 6, 11),
        "Mars":    (1, 2, 4, 7, 8, 10, 11),
        "Mercury": (3, 5, 6, 11),
        "Jupiter": (6, 10, 11, 12),
        "Venus":   (6, 8, 11, 12),
        "Saturn":  (1, 4, 7, 8, 9, 10, 11),
        "Lagna":   (1, 3, 6, 10, 11),
    },
    # ── BUDHA AṢṬAKAVARGA ─────────────────────────────────────────────
    "Mercury": {
        "Sun":     (5, 6, 9, 11, 12),
        "Moon":    (2, 4, 6, 8, 10, 11),
        "Mars":    (1, 2, 4, 7, 8, 9, 10, 11),
        "Mercury": (1, 3, 5, 6, 9, 10, 11, 12),
        "Jupiter": (6, 8, 11, 12),
        "Venus":   (1, 2, 3, 4, 5, 8, 9, 11),
        "Saturn":  (1, 2, 4, 7, 8, 9, 10, 11),
        "Lagna":   (1, 2, 4, 6, 8, 10, 11),
    },
    # ── GURU (BṚHASPATI) AṢṬAKAVARGA ─────────────────────────────────
    "Jupiter": {
        "Sun":     (1, 2, 3, 4, 7, 8, 9, 10, 11),
        "Moon":    (2, 5, 7, 9, 11),
        "Mars":    (1, 2, 4, 7, 8, 10, 11),
        "Mercury": (1, 2, 4, 5, 6, 9, 10, 11),
        "Jupiter": (1, 2, 3, 4, 7, 8, 10, 11),
        "Venus":   (2, 5, 6, 9, 10, 11),
        "Saturn":  (3, 5, 6, 12),
        "Lagna":   (1, 2, 4, 5, 6, 7, 9, 10, 11),
    },
    # ── ŚUKRA AṢṬAKAVARGA ─────────────────────────────────────────────
    "Venus": {
        "Sun":     (8, 11, 12),
        "Moon":    (1, 2, 3, 4, 5, 8, 9, 11, 12),
        "Mars":    (3, 5, 6, 9, 11, 12),
        "Mercury": (3, 5, 6, 9, 11),
        "Jupiter": (5, 8, 9, 10, 11),
        "Venus":   (1, 2, 3, 4, 5, 8, 9, 10, 11),
        "Saturn":  (3, 4, 5, 8, 9, 10, 11),
        "Lagna":   (1, 2, 3, 4, 5, 8, 9, 11),
    },
    # ── ŚANI AṢṬAKAVARGA ──────────────────────────────────────────────
    "Saturn": {
        "Sun":     (1, 2, 4, 7, 8, 10, 11),
        "Moon":    (3, 6, 11),
        "Mars":    (3, 5, 6, 10, 11, 12),
        "Mercury": (6, 8, 9, 10, 11, 12),
        "Jupiter": (5, 6, 11, 12),
        "Venus":   (6, 11, 12),
        "Saturn":  (3, 5, 6, 11),
        "Lagna":   (1, 3, 4, 6, 10, 11),
    },
}

ASHTAKAVARGA_GRAHAS = ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")

# ═══════════════════════════════════════════════════════════════════════════
# ◈ MOON-TABLE VARIANTS — three documented Chandra-AV conventions, shown in
# parallel. Only the Chandra rows ever differ; Sarva total stays 337 in all.
#   bpns          · BPHS Ch. 66                — 9 in Moon-from-Moon (default)
#   phaladipika   · Phaladīpikā Ch. 23 / Mehta — 9 in Moon-from-Mars (transposed)
#   varahamihira  · Phaladīpikā footnote/Mehta — Jupiter row (1,4,7,8,10,11,12)
# ═══════════════════════════════════════════════════════════════════════════

AV_VARIANT_IDS = ("bpns", "phaladipika", "varahamihira")

AV_VARIANT_META = {
    "bpns": {
        "label_en": "BPHS Ch. 66",
        "label_hi": "बृहत्पाराशर-होराशास्त्र · अ. 66",
        "source": "BPHS (Santhanam tr.) — oracle anchor (default)",
    },
    "phaladipika": {
        "label_en": "Phaladīpikā Ch. 23",
        "label_hi": "फलदीपिका · अ. 23",
        "source": "Phaladīpikā / M.S. Mehta — 9 transposed to Moon-from-Mars",
    },
    "varahamihira": {
        "label_en": "Varāhamihira",
        "label_hi": "वराहमिहिर",
        "source": "Phaladīpikā footnote / M.S. Mehta — Jupiter row (1,4,7,8,10,11,12)",
    },
}

# Per-variant override rows for the Chandra table (ref → offsets).
# Keys are references of ASHTAKAVARGA_TABLES["Moon"]; a row listed here
# REPLACES the base BPHS row for that variant.
MOON_VARIANT_ROWS = {
    "bpns": {},  # base table already IS BPHS
    "phaladipika": {
        "Moon":    (1, 3, 6, 7, 10, 11),        # 9 removed from Moon-from-Moon
        "Mars":    (2, 3, 5, 6, 9, 10, 11),     # 9 added to Moon-from-Mars
    },
    "varahamihira": {
        "Jupiter": (1, 4, 7, 8, 10, 11, 12),    # −2 · +12 vs (1,2,4,7,8,10,11)
    },
}


def bhinna_ashtakavarga(
    target_graha: str, graha_signs: dict, lagna_sign: int,
    variant: str = "bpns",
) -> list[int]:
    """Compute Bhinna-AV for one graha — returns [12 bindu counts per sign].

    `variant` selects the Chandra-table school ("bpns" default; others only
    affect target_graha == "Moon").
    """
    if variant not in AV_VARIANT_IDS:
        raise ValueError(
            f"unknown AV variant {variant!r}; choose from {AV_VARIANT_IDS}"
        )
    table = dict(ASHTAKAVARGA_TABLES[target_graha])
    if target_graha == "Moon":
        table.update(MOON_VARIANT_ROWS[variant])
    bindus = [0] * 12
    for ref_name, offsets in table.items():
        ref_sign = lagna_sign if ref_name == "Lagna" else graha_signs[ref_name]
        for offset in offsets:
            # offset is 1-indexed (1 = same sign, 2 = next sign east, etc.)
            target_sign = (ref_sign + offset - 1) % 12
            bindus[target_sign] += 1
    return bindus


def compute_bhinna_sarva(
    graha_lons: dict, lagna_lon_deg: float = None, variant: str = "bpns",
) -> dict:
    """Compute full Aṣṭakavarga from 9-graha longitudes dict + observer lagna.

    Single-observer mode: Lagna is the sidereal ascendant (effective_49
    frame) at the observer's latitude/longitude, NOT the Sun's sign.
    `lagna_lon_deg=None` keeps the legacy Sūrya-Lagna proxy (backward
    compatible for callers that don't pass an observer).

    `variant` selects the Chandra-table school (see MOON_VARIANT_ROWS).

    Returns:
        {
          "bhinna": {graha: [12 bindus]},           # 7 grahas × 12 signs
          "sarva":  [12 totals],                     # sum across 7 grahas
          "sarva_total": int,                        # sum of sarva = 337 (all variants)
          "per_graha_totals": {graha: int},          # sum per graha
          "lagna_sign": int,                         # observer-ascendant sign
          "lagna_lon_deg": float,                    # observer sidereal ascendant
          "lagna_proxy": str,                        # frame description
          "variant": str,                            # Moon-table school
        }
    """
    # Convert longitudes → sign indices (0-11)
    graha_signs = {g: int(graha_lons[g] // 30) % 12 for g in graha_lons}
    if lagna_lon_deg is None:
        lagna_sign = graha_signs["Sun"]  # Sūrya-Lagna proxy (legacy)
        lagna_proxy = "Sūrya-Lagna (Sun's sign — no observer passed)"
    else:
        lagna_sign = int(lagna_lon_deg // 30) % 12
        lagna_proxy = "observer ascendant (effective_49 ayanāṃśa frame)"

    bhinna = {}
    for graha in ASHTAKAVARGA_GRAHAS:
        bhinna[graha] = bhinna_ashtakavarga(graha, graha_signs, lagna_sign, variant)

    # Sarva — sum across all 7 grahas per sign
    sarva = [0] * 12
    for graha in ASHTAKAVARGA_GRAHAS:
        for i in range(12):
            sarva[i] += bhinna[graha][i]

    per_graha_totals = {g: sum(bhinna[g]) for g in ASHTAKAVARGA_GRAHAS}

    return {
        "bhinna": bhinna,
        "sarva": sarva,
        "sarva_total": sum(sarva),
        "per_graha_totals": per_graha_totals,
        "lagna_sign": lagna_sign,
        "lagna_lon_deg": lagna_lon_deg,
        "lagna_proxy": lagna_proxy,
        "variant": variant,
    }


def compute_bhinna_sarva_variants(
    graha_lons: dict, lagna_lon_deg: float = None,
) -> dict:
    """Compute ALL documented Moon-table variants in parallel.

    Returns {variant_id: result} for bpns / phaladipika / varahamihira.
    `bpns` is identical to compute_bhinna_sarva(...) with default variant,
    so the main section stays aligned while the alternatives are shown
    alongside — nothing is skipped.
    """
    return {
        vid: compute_bhinna_sarva(graha_lons, lagna_lon_deg, vid)
        for vid in AV_VARIANT_IDS
    }


__all__ = [
    "ASHTAKAVARGA_TABLES", "ASHTAKAVARGA_GRAHAS",
    "AV_VARIANT_IDS", "AV_VARIANT_META", "MOON_VARIANT_ROWS",
    "bhinna_ashtakavarga", "compute_bhinna_sarva",
    "compute_bhinna_sarva_variants",
]
