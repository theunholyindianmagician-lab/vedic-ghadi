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
  Sum (Sarva) = 337

In this implementation we use SŪRYA-LAGNA (Sun's sign) as Lagna proxy
because the substrate doesn't compute observer ascendant (no lat/lon).
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
        "Mars":    (1, 2, 4, 7, 8, 10, 11),
        "Mercury": (3, 5, 6, 9, 10, 11, 12),
        "Jupiter": (5, 6, 9, 11),
        "Venus":   (6, 7, 12),
        "Saturn":  (1, 2, 4, 7, 8, 10, 11),
        "Lagna":   (3, 4, 6, 10, 11, 12),
    },
    # ── CHANDRA AṢṬAKAVARGA ───────────────────────────────────────────
    "Moon": {
        "Sun":     (3, 6, 7, 8, 10, 11),
        "Moon":    (1, 3, 6, 7, 9, 10, 11),
        "Mars":    (2, 3, 5, 6, 9, 10, 11),
        "Mercury": (1, 3, 4, 5, 7, 8, 10, 11),
        "Jupiter": (1, 4, 7, 8, 10, 11, 12),
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


def bhinna_ashtakavarga(target_graha: str, graha_signs: dict, lagna_sign: int) -> list[int]:
    """Compute Bhinna-AV for one graha — returns [12 bindu counts per sign]."""
    table = ASHTAKAVARGA_TABLES[target_graha]
    bindus = [0] * 12
    for ref_name, offsets in table.items():
        ref_sign = lagna_sign if ref_name == "Lagna" else graha_signs[ref_name]
        for offset in offsets:
            # offset is 1-indexed (1 = same sign, 2 = next sign east, etc.)
            target_sign = (ref_sign + offset - 1) % 12
            bindus[target_sign] += 1
    return bindus


def compute_bhinna_sarva(graha_lons: dict) -> dict:
    """Compute full Aṣṭakavarga from 9-graha longitudes dict.

    Uses Sūrya-Lagna (Sun's sign) as Lagna proxy since substrate doesn't
    compute observer ascendant.

    Returns:
        {
          "bhinna": {graha: [12 bindus]},           # 7 grahas × 12 signs
          "sarva":  [12 totals],                     # sum across 7 grahas
          "sarva_total": int,                        # sum of sarva = ~337
          "per_graha_totals": {graha: int},          # sum per graha
          "lagna_sign": int,                         # Sun-sign used as proxy
        }
    """
    # Convert longitudes → sign indices (0-11)
    graha_signs = {g: int(graha_lons[g] // 30) % 12 for g in graha_lons}
    lagna_sign = graha_signs["Sun"]  # Sūrya-Lagna proxy

    bhinna = {}
    for graha in ASHTAKAVARGA_GRAHAS:
        bhinna[graha] = bhinna_ashtakavarga(graha, graha_signs, lagna_sign)

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
        "lagna_proxy": "Sūrya-Lagna (Sun's sign — substrate has no observer ascendant)",
    }


__all__ = [
    "ASHTAKAVARGA_TABLES", "ASHTAKAVARGA_GRAHAS",
    "bhinna_ashtakavarga", "compute_bhinna_sarva",
]
