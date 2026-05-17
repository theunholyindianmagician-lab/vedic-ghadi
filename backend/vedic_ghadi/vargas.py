"""
🔱 EKAVIṂŚATI-VARGA — 21 divisional charts (D1–D108).

Per BPHS Ch. 6 + Phaladīpikā Ch. 6:
  D1   Rāśi          general / identity
  D2   Horā          wealth (Sun's Horā = Leo, Moon's = Cancer)
  D3   Drekkāṇa      siblings
  D4   Caturthāṃśa   home / property
  D5   Pañcāṃśa      fame, power
  D6   Ṣaṣṭhāṃśa     health, illness
  D7   Saptamāṃśa    children, lineage
  D8   Aṣṭāṃśa       obstacles, sudden death
  D9   Navāṃśa       spouse, dharma  (most important after D1)
  D10  Daśāṃśa       career, action
  D11  Rudrāṃśa      destruction
  D12  Dvādaśāṃśa    parents
  D16  Ṣoḍaśāṃśa     vehicles, comforts
  D20  Viṃśāṃśa      spiritual practice
  D24  Caturviṃśāṃśa education, learning
  D27  Saptaviṃśāṃśa strengths, weaknesses
  D30  Triṃśāṃśa     misfortunes (irregular Parāśarī rule)
  D40  Khavedāṃśa    maternal lineage
  D45  Akṣavedāṃśa   paternal lineage
  D60  Ṣaṣṭhyāṃśa    past life karmas (most subtle)
  D108 Aṣṭottarāṃśa  comprehensive synthesis

Sealed: 2026-05-17
"""

from __future__ import annotations


# (n, abbrev, name_en, name_hi, body_part)
VARGA_LIST: tuple[tuple[int, str, str, str, str], ...] = (
    (1,   "D1",   "Rāśi",            "राशि",           "general / identity"),
    (2,   "D2",   "Horā",            "होरा",           "wealth"),
    (3,   "D3",   "Drekkāṇa",        "द्रेक्काण",       "siblings"),
    (4,   "D4",   "Caturthāṃśa",    "चतुर्थांश",       "home / property"),
    (5,   "D5",   "Pañcāṃśa",       "पञ्चांश",         "fame / power"),
    (6,   "D6",   "Ṣaṣṭhāṃśa",      "षष्ठांश",         "health / illness"),
    (7,   "D7",   "Saptamāṃśa",     "सप्तमांश",        "children / lineage"),
    (8,   "D8",   "Aṣṭāṃśa",        "अष्टांश",         "obstacles"),
    (9,   "D9",   "Navāṃśa",        "नवांश",           "spouse / dharma"),
    (10,  "D10",  "Daśāṃśa",        "दशांश",           "career / action"),
    (11,  "D11",  "Rudrāṃśa",       "रुद्रांश",        "destruction"),
    (12,  "D12",  "Dvādaśāṃśa",    "द्वादशांश",       "parents"),
    (16,  "D16",  "Ṣoḍaśāṃśa",      "षोडशांश",         "vehicles / comforts"),
    (20,  "D20",  "Viṃśāṃśa",       "विंशांश",         "spiritual practice"),
    (24,  "D24",  "Caturviṃśāṃśa",  "चतुर्विंशांश",    "education / learning"),
    (27,  "D27",  "Saptaviṃśāṃśa",  "सप्तविंशांश",     "strengths / weaknesses"),
    (30,  "D30",  "Triṃśāṃśa",      "त्रिंशांश",       "misfortunes (Parāśarī)"),
    (40,  "D40",  "Khavedāṃśa",     "खवेदांश",         "maternal lineage"),
    (45,  "D45",  "Akṣavedāṃśa",    "अक्षवेदांश",      "paternal lineage"),
    (60,  "D60",  "Ṣaṣṭhyāṃśa",    "षष्ट्यांश",        "past-life karmas"),
    (108, "D108", "Aṣṭottarāṃśa",  "अष्टोत्तरांश",     "comprehensive synthesis"),
)

# 12 rāśi names (0-indexed: Aries = 0)
SIGN_NAMES = (
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
)
SIGN_DEV = (
    "मेष", "वृष", "मिथुन", "कर्क", "सिंह", "कन्या",
    "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
)
SIGN_GLYPH = ("♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓")


def compute_varga(lon_deg: float, n: int) -> int:
    """Compute the Dn sign index (0-11) for a longitude.

    Uses classical Parāśara rules for D1/D2/D3/D7/D9/D10/D12/D16/D20/D24/D27/D30/D40/D45.
    For Dn not covered by special rule, falls back to the harmonic formula:
        sign = (rasi_idx × n + ⌊deg_in_sign × n / 30⌋) mod 12
    """
    lon_deg = lon_deg % 360.0
    if lon_deg < 0:
        lon_deg += 360.0
    sign_idx = int(lon_deg // 30)
    deg_in_sign = lon_deg - sign_idx * 30

    if n == 1:
        return sign_idx

    if n == 2:    # Horā — Sun's Horā = Leo (4), Moon's Horā = Cancer (3)
        # 0-indexed: Aries=0 is "odd" in classical numbering
        is_odd_sign = (sign_idx % 2 == 0)
        first_half = deg_in_sign < 15
        if is_odd_sign:
            return 4 if first_half else 3
        return 3 if first_half else 4

    if n == 3:    # Drekkāṇa — three parts of 10° → S, S+4, S+8
        part = int(deg_in_sign / 10.0)
        return (sign_idx + 4 * part) % 12

    if n == 4:    # Caturthāṃśa — four parts of 7°30' → S, S+3, S+6, S+9
        part = int(deg_in_sign * 4 / 30.0)
        return (sign_idx + 3 * part) % 12

    if n == 7:    # Saptamāṃśa — 4°17' each
        part = int(deg_in_sign * 7 / 30.0)
        is_odd_sign = (sign_idx % 2 == 0)
        start = sign_idx if is_odd_sign else (sign_idx + 6) % 12
        return (start + part) % 12

    if n == 9:    # Navāṃśa — 3°20' each, movable/fixed/dual modality
        part = int(deg_in_sign * 9 / 30.0)
        modality = sign_idx % 3      # 0=movable, 1=fixed, 2=dual
        if modality == 0:
            start = sign_idx
        elif modality == 1:
            start = (sign_idx + 8) % 12
        else:
            start = (sign_idx + 4) % 12
        return (start + part) % 12

    if n == 10:   # Daśāṃśa
        part = int(deg_in_sign * 10 / 30.0)
        is_odd_sign = (sign_idx % 2 == 0)
        start = sign_idx if is_odd_sign else (sign_idx + 8) % 12
        return (start + part) % 12

    if n == 12:   # Dvādaśāṃśa — 2°30' each, starts from same sign
        part = int(deg_in_sign * 12 / 30.0)
        return (sign_idx + part) % 12

    if n == 16:   # Ṣoḍaśāṃśa — movable/fixed/dual start from Aries/Leo/Sag
        part = int(deg_in_sign * 16 / 30.0)
        modality = sign_idx % 3
        start = (0, 4, 8)[modality]
        return (start + part) % 12

    if n == 20:   # Viṃśāṃśa — movable/fixed/dual start from Aries/Sag/Leo
        part = int(deg_in_sign * 20 / 30.0)
        modality = sign_idx % 3
        start = (0, 8, 4)[modality]
        return (start + part) % 12

    if n == 24:   # Caturviṃśāṃśa — odd sign starts from Leo, even from Cancer
        part = int(deg_in_sign * 24 / 30.0)
        is_odd_sign = (sign_idx % 2 == 0)
        start = 4 if is_odd_sign else 3
        return (start + part) % 12

    if n == 27:   # Saptaviṃśāṃśa — fiery/earthy/airy/watery start from Ar/Ca/Li/Cp
        part = int(deg_in_sign * 27 / 30.0)
        element = sign_idx % 4   # 0=fiery, 1=earthy, 2=airy, 3=watery
        start = (0, 3, 6, 9)[element]
        return (start + part) % 12

    if n == 30:   # Triṃśāṃśa — irregular Parāśarī rule
        is_odd_sign = (sign_idx % 2 == 0)
        if is_odd_sign:
            if deg_in_sign < 5.0:   return 0   # Mars → Aries
            elif deg_in_sign < 10.0: return 10  # Saturn → Aquarius
            elif deg_in_sign < 18.0: return 8   # Jupiter → Sagittarius
            elif deg_in_sign < 25.0: return 2   # Mercury → Gemini
            else:                    return 6   # Venus → Libra
        else:
            if deg_in_sign < 5.0:    return 1   # Venus → Taurus
            elif deg_in_sign < 12.0: return 5   # Mercury → Virgo
            elif deg_in_sign < 20.0: return 11  # Jupiter → Pisces
            elif deg_in_sign < 25.0: return 9   # Saturn → Capricorn
            else:                    return 7   # Mars → Scorpio

    if n == 40:   # Khavedāṃśa — odd sign starts from Aries, even from Libra
        part = int(deg_in_sign * 40 / 30.0)
        is_odd_sign = (sign_idx % 2 == 0)
        start = 0 if is_odd_sign else 6
        return (start + part) % 12

    if n == 45:   # Akṣavedāṃśa — movable/fixed/dual start from Aries/Leo/Sag
        part = int(deg_in_sign * 45 / 30.0)
        modality = sign_idx % 3
        start = (0, 4, 8)[modality]
        return (start + part) % 12

    # Default: pure harmonic rule for D5, D6, D8, D11, D60, D108, and any other
    return (sign_idx * n + int(deg_in_sign * n / 30.0)) % 12


def compute_all_vargas(lon_deg: float) -> list[int]:
    """Return the 21 Dn sign indices for one longitude (compact int list)."""
    return [compute_varga(lon_deg, v[0]) for v in VARGA_LIST]


def varga_metadata() -> list[dict]:
    """Return the 21 Dn metadata dicts for client-side display lookups."""
    return [
        {"n": v[0], "abbrev": v[1], "name_en": v[2], "name_hi": v[3], "body": v[4]}
        for v in VARGA_LIST
    ]


__all__ = [
    "VARGA_LIST", "SIGN_NAMES", "SIGN_DEV", "SIGN_GLYPH",
    "compute_varga", "compute_all_vargas", "varga_metadata",
]
