"""
🔱 PAÑCĀṄGA — the five limbs (vāra · tithi · nakṣatra · yoga · karaṇa).

vāra and tithi already live in substrate.py — this module adds the remaining
three. Same substrate, two more divisors:

    nakṣatra  = floor(moon_lon / (360 / 27))           ·  27 stars
    yoga      = floor((sun_lon + moon_lon) / (360/27)) ·  27 yogas
    karaṇa    = half a tithi                           ·  60 half-tithis/month
              (cycle: 7 cara movable + 4 sthira fixed = 11 names)

All three are pure rational divisions of the same two Sūrya-Siddhānta-mean
longitudes already computed for tithi/māsa. Zero new astronomical input.

Divisor table (all factor over (2, 3, 5) — substrate-aligned):
    nakṣatra count = 27 = 3³
    pada per nakṣatra = 4 = 2²
    yoga count = 27 = 3³
    half-tithi count = 60 = 2² × 3 × 5
    karaṇa cycle = 60 half-tithis traversing 11 names

Sealed: 2026-05-17
"""

from __future__ import annotations

from .substrate import vedic_mean_longitude

# ═══════════════════════════════════════════════════════════════════════════
# ◈ 27 NAKṢATRAS (lunar mansions · Vedānga Jyotiṣa canonical order)
# ═══════════════════════════════════════════════════════════════════════════

NAKSHATRA_NAMES = (
    "Aśvinī",       "Bharaṇī",      "Kṛttikā",
    "Rohiṇī",       "Mṛgaśīrṣā",    "Ārdrā",
    "Punarvasu",    "Puṣya",        "Āśleṣā",
    "Maghā",        "Pūrvaphalgunī","Uttaraphalgunī",
    "Hasta",        "Citrā",        "Svātī",
    "Viśākhā",      "Anurādhā",     "Jyeṣṭhā",
    "Mūla",         "Pūrvāṣāḍhā",   "Uttarāṣāḍhā",
    "Śravaṇa",      "Dhaniṣṭhā",    "Śatabhiṣā",
    "Pūrvabhādrapadā", "Uttarabhādrapadā", "Revatī",
)

NAKSHATRA_DEV = (
    "अश्विनी", "भरणी", "कृत्तिका",
    "रोहिणी", "मृगशीर्षा", "आर्द्रा",
    "पुनर्वसु", "पुष्य", "आश्लेषा",
    "मघा", "पूर्वफल्गुनी", "उत्तरफल्गुनी",
    "हस्त", "चित्रा", "स्वाती",
    "विशाखा", "अनुराधा", "ज्येष्ठा",
    "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा",
    "श्रवण", "धनिष्ठा", "शतभिषा",
    "पूर्वभाद्रपदा", "उत्तरभाद्रपदा", "रेवती",
)

# Ruling deity for each nakṣatra (Bṛhat-Saṃhitā Ch. 9 canonical)
NAKSHATRA_DEITY = (
    "Aśvinī Kumāra", "Yama", "Agni",
    "Brahmā", "Soma", "Rudra",
    "Aditi", "Bṛhaspati", "Nāga",
    "Pitṛ", "Bhaga", "Aryaman",
    "Savitṛ", "Tvāṣṭṛ", "Vāyu",
    "Indrāgnī", "Mitra", "Indra",
    "Nirṛti", "Āpas", "Viśvedevāḥ",
    "Viṣṇu", "Vasu", "Varuṇa",
    "Aja Ekapāda", "Ahirbudhnya", "Pūṣan",
)

# Ruling graha for each nakṣatra (Vimśottarī daśā 9-cycle starting with Ketu)
NAKSHATRA_LORD = (
    "Ketu", "Venus", "Sun",       # Aśvinī, Bharaṇī, Kṛttikā
    "Moon", "Mars", "Rahu",       # Rohiṇī, Mṛgaśīrṣā, Ārdrā
    "Jupiter", "Saturn", "Mercury",  # Punarvasu, Puṣya, Āśleṣā
    "Ketu", "Venus", "Sun",
    "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun",
    "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury",
)

# ═══════════════════════════════════════════════════════════════════════════
# ◈ 27 YOGAS (Sun + Moon longitude / nakṣatra-arc)
# ═══════════════════════════════════════════════════════════════════════════

YOGA_NAMES = (
    "Viṣkambha",  "Prīti",      "Āyuṣmān",
    "Saubhāgya",  "Śobhana",    "Atigaṇḍa",
    "Sukarmā",    "Dhṛti",      "Śūla",
    "Gaṇḍa",      "Vṛddhi",     "Dhruva",
    "Vyāghāta",   "Harṣaṇa",    "Vajra",
    "Siddhi",     "Vyatīpāta",  "Varīyāna",
    "Parigha",    "Śiva",       "Siddha",
    "Sādhya",     "Śubha",      "Śukla",
    "Brahmā",     "Indra",      "Vaidhṛti",
)

YOGA_DEV = (
    "विष्कम्भ", "प्रीति", "आयुष्मान्",
    "सौभाग्य", "शोभन", "अतिगण्ड",
    "सुकर्मा", "धृति", "शूल",
    "गण्ड", "वृद्धि", "ध्रुव",
    "व्याघात", "हर्षण", "वज्र",
    "सिद्धि", "व्यतीपात", "वरीयान",
    "परिघ", "शिव", "सिद्ध",
    "साध्य", "शुभ", "शुक्ल",
    "ब्रह्मा", "इन्द्र", "वैधृति",
)

# ═══════════════════════════════════════════════════════════════════════════
# ◈ 11 KARAṆAS (half-tithi cycle: 7 cara movable + 4 sthira fixed)
# ═══════════════════════════════════════════════════════════════════════════

# 7 cara (movable) karaṇas cycle 8 times across the lunar month, plus
# 4 sthira (fixed) karaṇas appear at specific positions:
#   half-tithi 0 (Śukla Pratipadā first half)             → Kiṃstughna  (sthira)
#   half-tithi 1..56 (continuous cycle)                   → 7 cara × 8 cycles
#   half-tithi 57..59 (Kṛṣṇa Caturdaśī → Amāvāsyā)        → Śakuni, Catuṣpāda, Nāga (sthira)
#   total 60 half-tithis = 1 Kiṃstughna + 56 cara + 3 sthira

KARANA_CARA = ("Bava", "Bālava", "Kaulava", "Taitila", "Gara", "Vaṇij", "Viṣṭi")
KARANA_CARA_DEV = ("बव", "बालव", "कौलव", "तैतिल", "गर", "वणिज्", "विष्टि")
KARANA_STHIRA = ("Kiṃstughna", "Śakuni", "Catuṣpāda", "Nāga")
KARANA_STHIRA_DEV = ("किंस्तुघ्न", "शकुनि", "चतुष्पाद", "नाग")


def _karana_for_half_tithi(idx: int) -> tuple[str, str, bool, int]:
    """Return (name, devanagari, is_movable, cycle_number 1-8 if cara)."""
    if idx == 0:
        return ("Kiṃstughna", "किंस्तुघ्न", False, 0)
    if idx == 57:
        return ("Śakuni", "शकुनि", False, 0)
    if idx == 58:
        return ("Catuṣpāda", "चतुष्पाद", False, 0)
    if idx == 59:
        return ("Nāga", "नाग", False, 0)
    # idx 1..56 — cara cycle
    cara_idx = (idx - 1) % 7
    cycle = (idx - 1) // 7 + 1
    return (KARANA_CARA[cara_idx], KARANA_CARA_DEV[cara_idx], True, cycle)


# ═══════════════════════════════════════════════════════════════════════════
# ◈ Public functions — operate on Kali civil days
# ═══════════════════════════════════════════════════════════════════════════

def nakshatra_at_kali_days(kali_civil_days: float) -> dict:
    """Lunar mansion at this moment (27 stars of 13°20′ each)."""
    moon_lon = vedic_mean_longitude("Moon", kali_civil_days)
    arc = 360.0 / 27.0                            # = 13.3333…°
    naks_float = moon_lon / arc                   # 0..27
    naks_idx = int(naks_float) % 27
    pada_float = (naks_float - int(naks_float)) * 4.0   # 0..4
    pada_idx = int(pada_float) + 1                # 1..4
    return {
        "nakshatra_index": naks_idx + 1,         # 1..27
        "nakshatra_name": NAKSHATRA_NAMES[naks_idx],
        "nakshatra_devanagari": NAKSHATRA_DEV[naks_idx],
        "nakshatra_deity": NAKSHATRA_DEITY[naks_idx],
        "nakshatra_lord": NAKSHATRA_LORD[naks_idx],
        "pada": pada_idx,                        # 1..4
        "pada_fractional": round(pada_float - (pada_idx - 1), 4),
        "moon_sidereal_lon_deg": round(moon_lon, 4),
        "fractional_nakshatra": round(naks_float - int(naks_float), 4),
    }


def yoga_at_kali_days(kali_civil_days: float) -> dict:
    """Yoga = (Sun + Moon longitude) / (360/27) · 27 yogas of 13°20′ each."""
    sun_lon = vedic_mean_longitude("Sun", kali_civil_days)
    moon_lon = vedic_mean_longitude("Moon", kali_civil_days)
    sum_lon = (sun_lon + moon_lon) % 360.0
    arc = 360.0 / 27.0
    yoga_float = sum_lon / arc                    # 0..27
    yoga_idx = int(yoga_float) % 27
    return {
        "yoga_index": yoga_idx + 1,              # 1..27
        "yoga_name": YOGA_NAMES[yoga_idx],
        "yoga_devanagari": YOGA_DEV[yoga_idx],
        "sun_plus_moon_lon_deg": round(sum_lon, 4),
        "fractional_yoga": round(yoga_float - int(yoga_float), 4),
    }


def karana_at_kali_days(kali_civil_days: float) -> dict:
    """Karaṇa = half a tithi · 60 per synodic month · 11 names."""
    sun_lon = vedic_mean_longitude("Sun", kali_civil_days)
    moon_lon = vedic_mean_longitude("Moon", kali_civil_days)
    elong = (moon_lon - sun_lon) % 360.0
    half_tithi_float = elong / 6.0                # 0..60
    half_tithi_idx = int(half_tithi_float) % 60
    name, dev, is_movable, cycle = _karana_for_half_tithi(half_tithi_idx)
    return {
        "karana_index": half_tithi_idx + 1,      # 1..60
        "karana_name": name,
        "karana_devanagari": dev,
        "is_movable": is_movable,
        "movable_cycle_number": cycle,           # 1..8 for cara, 0 for sthira
        "fractional_karana": round(half_tithi_float - int(half_tithi_float), 4),
    }


__all__ = [
    "NAKSHATRA_NAMES", "NAKSHATRA_DEV", "NAKSHATRA_DEITY", "NAKSHATRA_LORD",
    "YOGA_NAMES", "YOGA_DEV",
    "KARANA_CARA", "KARANA_STHIRA",
    "nakshatra_at_kali_days", "yoga_at_kali_days", "karana_at_kali_days",
]
