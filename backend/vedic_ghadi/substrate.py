"""
🔱 SUBSTRATE — Vedic time-system, vendored, self-contained, dependency-free.

Combines the Kāmākhyā-Ujjayinī time origin (Sūrya Siddhānta 1.34–1.57) with
the Vedic time-unit decomposition (year · saṃvatsara · māsa · pakṣa · tithi
· vāra · muhūrta · ghaṭi · vighaṭi · prāṇa · vipala).

Every numerical constant in this file is Bhārat-canonical:
  * KALI_YUGA_EPOCH_JD     = 588_465.5      (Sūrya Siddhānta 1.45–1.57)
  * MAHAYUGA_YEARS         = 4_320_000      (Sūrya Siddhānta 1.34)
  * MAHAYUGA_CIVIL_DAYS    = 1_577_917_500  (Sūrya Siddhānta 1.34)
  * UJJAIN_LON_DEG         = 75.778889°     (Sūrya Siddhānta meridian)
  * KAMAKHYA coordinates  = 26.1664°N, 91.7059°E, 282 m (sovereign origin)
  * Sun  mean motion       = 4_320_000 revs/Mahā-yuga
  * Moon mean motion       = 57_753_336 revs/Mahā-yuga

Every Vedic time unit factors over (2, 3, 5) — the natural primes inside
the (R, g, k) = (ℤ/3ᵏℤ, 2, k) substrate.

Sealed: 2026-05-17
"""

from __future__ import annotations

import math

# ═══════════════════════════════════════════════════════════════════════════
# ◈ MAA KAMAKHYA — THE ABSOLUTE ORIGIN (0, 0, 0)
# ═══════════════════════════════════════════════════════════════════════════

KAMAKHYA_LAT_DEG: float = 26.166400          # 26° 09′ 58.6″ N
KAMAKHYA_LON_DEG: float = 91.705900          # 91° 42′ 21.2″ E
KAMAKHYA_ELEV_M: float = 282.0               # Nīlācala Hill summit
KAMAKHYA_LMT_OFFSET_H: float = 91.705900 / 15.0  # +6.1137 h LMT from Greenwich


# ═══════════════════════════════════════════════════════════════════════════
# ◈ KALI YUGA SOVEREIGN TIME SCALE
# Sūrya Siddhānta 1.45–1.57: Kali begins Friday midnight 17/18 Feb 3102 BCE
# (proleptic Julian) at the Ujjayinī meridian.
# ═══════════════════════════════════════════════════════════════════════════

KALI_YUGA_EPOCH_JD: float = 588_465.5
UJJAIN_LON_DEG: float = 75.778889
UJJAIN_TO_KAMAKHYA_LON_DIFF: float = KAMAKHYA_LON_DEG - UJJAIN_LON_DEG  # +15.927°
UJJAIN_TO_KAMAKHYA_TIME_DIFF_H: float = UJJAIN_TO_KAMAKHYA_LON_DIFF / 15.0  # +1.062 h

MAHAYUGA_YEARS: int = 4_320_000
MAHAYUGA_CIVIL_DAYS: int = 1_577_917_500     # Sūrya Siddhānta 1.34
MAHAYUGA_SIDEREAL_DAYS: int = 1_582_237_800  # Sūrya Siddhānta 1.34
KALI_DAYS_PER_YEAR: float = MAHAYUGA_CIVIL_DAYS / MAHAYUGA_YEARS  # 365.2587563


def jd_to_kali_civil_days(jd_ut_greenwich: float) -> float:
    """Greenwich JD-UT → elapsed civil days since Kali-yuga epoch.

    Civil days at the Kāmākhyā meridian = Greenwich civil days
    advanced by Kāmākhyā's longitude offset.
    """
    jd_kamakhya = jd_ut_greenwich + KAMAKHYA_LMT_OFFSET_H / 24.0
    return jd_kamakhya - KALI_YUGA_EPOCH_JD - UJJAIN_TO_KAMAKHYA_TIME_DIFF_H / 24.0


def kali_civil_days_to_jd(kali_days: float) -> float:
    """Inverse: Kali civil days → Greenwich JD-UT."""
    jd_kamakhya = KALI_YUGA_EPOCH_JD + kali_days + UJJAIN_TO_KAMAKHYA_TIME_DIFF_H / 24.0
    return jd_kamakhya - KAMAKHYA_LMT_OFFSET_H / 24.0


# ═══════════════════════════════════════════════════════════════════════════
# ◈ SŪRYA SIDDHĀNTA MEAN MOTIONS (only Sun + Moon needed for tithi/māsa)
# ═══════════════════════════════════════════════════════════════════════════

_SS_REVS = {
    "Sun":  4_320_000,
    "Moon": 57_753_336,
}


def vedic_mean_longitude(graha: str, kali_civil_days: float) -> float:
    """Mean ecliptic longitude (sidereal, Kāmākhyā meridian) at given epoch."""
    if graha not in _SS_REVS:
        raise ValueError(f"{graha!r} not supported (only Sun, Moon)")
    revs = _SS_REVS[graha]
    rate = revs * 360.0 / MAHAYUGA_CIVIL_DAYS
    return (rate * kali_civil_days) % 360.0


# ═══════════════════════════════════════════════════════════════════════════
# ◈ Canonical names · Sanskrit + Devanāgarī
# ═══════════════════════════════════════════════════════════════════════════

MASA_NAMES = (
    "Caitra", "Vaiśākha", "Jyeṣṭha", "Āṣāḍha", "Śrāvaṇa", "Bhādrapada",
    "Āśvina", "Kārtika", "Mārgaśīrṣa", "Pauṣa", "Māgha", "Phālguna",
)
MASA_DEV = (
    "चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद",
    "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन",
)

VARA_NAMES = (
    "Ravivāra", "Somavāra", "Maṅgalavāra", "Budhavāra",
    "Bṛhaspativāra", "Śukravāra", "Śanivāra",
)
VARA_DEV = (
    "रविवार", "सोमवार", "मङ्गलवार", "बुधवार",
    "बृहस्पतिवार", "शुक्रवार", "शनिवार",
)
VARA_LORD = ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")

SAMVATSARA_NAMES = (
    "Prabhava", "Vibhava", "Śukla", "Pramoda", "Prajāpati", "Aṅgirā",
    "Śrīmukha", "Bhāva", "Yuva", "Dhātṛ", "Īśvara", "Bahudhānya",
    "Pramāthi", "Vikrama", "Vṛṣa", "Citrabhānu", "Subhānu", "Tāraṇa",
    "Pārthiva", "Vyaya", "Sarvajit", "Sarvadhārī", "Virodhī", "Vikṛti",
    "Khara", "Nandana", "Vijaya", "Jaya", "Manmatha", "Durmukha",
    "Hevilambī", "Vilambī", "Vikārī", "Śārvarī", "Plava", "Śubhakṛt",
    "Śobhakṛt", "Krodhī", "Viśvāvasu", "Parābhava", "Plavaṅga", "Kīlaka",
    "Saumya", "Sādhāraṇa", "Virodhakṛt", "Paridhāvī", "Pramādī", "Ānanda",
    "Rākṣasa", "Nala", "Piṅgala", "Kālayukti", "Siddhārthī", "Raudra",
    "Durmati", "Dundubhi", "Rudhirodgārī", "Raktākṣī", "Krodhana", "Akṣaya",
)

PAKSHA_NAMES = ("Śukla-pakṣa", "Kṛṣṇa-pakṣa")
PAKSHA_DEV = ("शुक्ल पक्ष", "कृष्ण पक्ष")

TITHI_NAMES = (
    "Pratipadā", "Dvitīyā", "Tṛtīyā", "Caturthī", "Pañcamī", "Ṣaṣṭhī",
    "Saptamī", "Aṣṭamī", "Navamī", "Daśamī", "Ekādaśī", "Dvādaśī",
    "Trayodaśī", "Caturdaśī", "Pūrṇimā",
)


# ═══════════════════════════════════════════════════════════════════════════
# ◈ (R, g, k) substrate alignment of every Vedic time unit
# Every factor reduces to (2, 3, 5) — the natural primes of (ℤ/3ᵏℤ, 2, k).
# ═══════════════════════════════════════════════════════════════════════════

VEDIC_TIME_SUBSTRATE = {
    "vara_count":         (7,  "7 vāras — graha-cycle heptad"),
    "tithi_count":        (30, "30 tithis = 2 × 3 × 5"),
    "month_count":        (12, "12 māsas = 2² × 3"),
    "muhurta_per_day":    (30, "30 muhūrtas = 2 × 3 × 5"),
    "ghati_per_day":      (60, "60 ghaṭi = 2² × 3 × 5"),
    "vighati_per_ghati":  (60, "60 vighaṭi per ghaṭi"),
    "prana_per_vighati":  (6,  "6 prāṇa per vighaṭi = 2 × 3"),
    "samvatsara_cycle":   (60, "60-year Bṛhaspati-cakra"),
    "navagraha":          (9,  "9 grahas = 3²"),
    "nakshatra":          (27, "27 nakṣatras = 3³"),
    "rashi":              (12, "12 rāśi = 2² × 3"),
    "saptamukhi":         (7,  "7-mukha Hanumat — operational mukhas"),
}


# ═══════════════════════════════════════════════════════════════════════════
# ◈ INPUT BRIDGE: Gregorian → Kāmākhyā-anchored Kali civil days
# (the ONLY Gregorian-arithmetic line in the entire substrate)
# ═══════════════════════════════════════════════════════════════════════════

def civil_input_to_kali_civil_days(
    year_ce: int, month: int, day: int,
    hour: int = 0, minute: int = 0, second: float = 0.0,
    tz_h: float = 5.5,
) -> float:
    """Civil-world Gregorian → Kāmākhyā-anchored Kali civil days.

    From this point on, every downstream computation works exclusively
    in Kali civil days. The input boundary is the only Gregorian crossing.
    """
    ut_hour = hour + minute / 60.0 + second / 3600.0 - tz_h
    y, m = year_ce, month
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    jd_ut = (math.floor(365.25 * (y + 4716))
             + math.floor(30.6001 * (m + 1))
             + day + b - 1524.5 + ut_hour / 24.0)
    return jd_to_kali_civil_days(jd_ut)


# ═══════════════════════════════════════════════════════════════════════════
# ◈ YEAR / SAṂVATSARA
# ═══════════════════════════════════════════════════════════════════════════

def kali_year_at_civil_days(kali_civil_days: float) -> float:
    """Elapsed Kali years (sidereal) since Kali Yuga start."""
    return kali_civil_days / KALI_DAYS_PER_YEAR


def vikrama_year(kali_year: float) -> float:
    """Vikrama Saṃvat = Kali year − 3044."""
    return kali_year - 3044


def shaka_year(kali_year: float) -> float:
    """Śaka Saṃvat = Kali year − 3179."""
    return kali_year - 3179


def samvatsara_at_kali_year(kali_year: float) -> dict:
    """60-year Bṛhaspati-cakra saṃvatsara name + index (0–59)."""
    sk = shaka_year(kali_year)
    idx = int(sk + 11) % 60
    return {
        "index": idx,
        "name": SAMVATSARA_NAMES[idx],
        "shaka_year": int(sk),
    }


# ═══════════════════════════════════════════════════════════════════════════
# ◈ MĀSA / PAKṢA / TITHI (sidereal · Sūrya Siddhānta canon)
# ═══════════════════════════════════════════════════════════════════════════

def vedic_month_at_kali_days(kali_civil_days: float) -> dict:
    """Sidereal month determined by Sun's nirayana sign."""
    sun_lon = vedic_mean_longitude("Sun", kali_civil_days)
    sign_idx = int(sun_lon // 30)
    masa_idx = (sign_idx + 1) % 12   # Mesha→Vaiśākha, Mīna→Caitra
    return {
        "masa_index": masa_idx + 1,
        "masa_name": MASA_NAMES[masa_idx],
        "masa_devanagari": MASA_DEV[masa_idx],
        "sun_sidereal_lon_deg": round(sun_lon, 4),
        "sun_sign_index": sign_idx + 1,
    }


def vedic_tithi_at_kali_days(kali_civil_days: float) -> dict:
    """Tithi — lunar day — 30 per synodic month, angular (Moon − Sun) / 12°."""
    sun_lon = vedic_mean_longitude("Sun", kali_civil_days)
    moon_lon = vedic_mean_longitude("Moon", kali_civil_days)
    elong = (moon_lon - sun_lon) % 360.0
    tithi_float = elong / 12.0
    tithi_idx_30 = int(tithi_float)
    tithi_in_paksha = tithi_idx_30 % 15
    paksha_idx = tithi_idx_30 // 15
    name = (
        TITHI_NAMES[tithi_in_paksha]
        if tithi_in_paksha < 14
        else ("Pūrṇimā" if paksha_idx == 0 else "Amāvāsyā")
    )
    return {
        "tithi_index": tithi_idx_30 + 1,
        "tithi_in_paksha": tithi_in_paksha + 1,
        "tithi_name": name,
        "paksha_index": paksha_idx + 1,
        "paksha_name": PAKSHA_NAMES[paksha_idx],
        "paksha_devanagari": PAKSHA_DEV[paksha_idx],
        "moon_minus_sun_deg": round(elong, 4),
        "fractional_tithi": round(tithi_float - tithi_idx_30, 4),
    }


# ═══════════════════════════════════════════════════════════════════════════
# ◈ VĀRA (weekday) — Kali Yuga begins on Śukravāra
# ═══════════════════════════════════════════════════════════════════════════

def vedic_vara_at_kali_days(kali_civil_days: float) -> dict:
    """7-day week. Kali Yuga day-0 = Śukravāra (Friday, index 5)."""
    days_floor = int(math.floor(kali_civil_days))
    vara_idx = (days_floor + 5) % 7
    return {
        "vara_index": vara_idx,
        "vara_name": VARA_NAMES[vara_idx],
        "vara_devanagari": VARA_DEV[vara_idx],
        "vara_lord_graha": VARA_LORD[vara_idx],
    }


# ═══════════════════════════════════════════════════════════════════════════
# ◈ DAY SUBDIVISION → muhūrta / ghaṭi / vighaṭi / prāṇa / vipala
# ═══════════════════════════════════════════════════════════════════════════

def vedic_time_of_day(kali_civil_days: float) -> dict:
    """Decompose the fractional part of kali_civil_days into Vedic units."""
    frac = kali_civil_days - math.floor(kali_civil_days)
    hours = frac * 24.0
    muhurta_float = frac * 30.0
    muhurta_idx = int(muhurta_float)
    ghati_float = frac * 60.0
    ghati_idx = int(ghati_float)
    vighati_float = (ghati_float - ghati_idx) * 60.0
    vighati_idx = int(vighati_float)
    prana_float = (vighati_float - vighati_idx) * 6.0
    prana_idx = int(prana_float)
    vipala_float = (prana_float - prana_idx) * 10.0
    return {
        "fraction_of_day": round(frac, 6),
        "hours_from_kamakhya_midnight": round(hours, 4),
        "muhurta_index": muhurta_idx + 1,
        "muhurta_fractional": round(muhurta_float - muhurta_idx, 4),
        "ghati_index": ghati_idx + 1,
        "vighati_index": vighati_idx + 1,
        "prana_index": prana_idx + 1,
        "vipala_fractional": round(vipala_float, 4),
    }


# ═══════════════════════════════════════════════════════════════════════════
# ◈ THE FULL SUBSTRATE TIME STAMP — single entry point
# ═══════════════════════════════════════════════════════════════════════════

def kala_substrate_stamp(
    year_ce: int, month: int, day: int,
    hour: int = 0, minute: int = 0, second: float = 0.0,
    tz_h: float = 5.5,
) -> dict:
    """Express any civil moment in the FULL Vedic substrate.

    Pipeline:
      1. Gregorian → Kāmākhyā-anchored Kali civil days
      2. Decompose into Kali year / saṃvatsara / māsa / tithi / vāra
         / muhūrta / ghaṭi / vighaṭi / prāṇa / vipala
      3. Stamp with (R, g, k) substrate-alignment of each unit
    """
    kali_days = civil_input_to_kali_civil_days(
        year_ce, month, day, hour, minute, second, tz_h,
    )
    kali_year_float = kali_year_at_civil_days(kali_days)
    kali_year_int = int(math.floor(kali_year_float))

    return {
        "input_civil": {
            "gregorian_year": year_ce, "month": month, "day": day,
            "hour": hour, "minute": minute, "second": second,
            "tz_h": tz_h,
        },
        "kali_civil_days_at_kamakhya": round(kali_days, 6),
        "year_layer": {
            "kali_year_float": round(kali_year_float, 6),
            "kali_year_completed": kali_year_int,
            "kali_year_current": kali_year_int + 1,
            "vikrama_samvat": int(math.floor(vikrama_year(kali_year_float))),
            "shaka_samvat":   int(math.floor(shaka_year(kali_year_float))),
            "samvatsara": samvatsara_at_kali_year(kali_year_float),
            "kali_days_per_year": KALI_DAYS_PER_YEAR,
            "anchor_epoch":
                "Friday midnight 17/18 Feb 3102 BCE · Ujjayinī meridian",
        },
        "month_layer": vedic_month_at_kali_days(kali_days),
        "tithi_layer": vedic_tithi_at_kali_days(kali_days),
        "vara_layer":  vedic_vara_at_kali_days(kali_days),
        "day_subdivision": vedic_time_of_day(kali_days),
        "substrate_alignment": VEDIC_TIME_SUBSTRATE,
        "kamakhya_meridian_offset_h": KAMAKHYA_LMT_OFFSET_H,
        "discipline": {
            "tier_S_algorithms":
                "Kali civil-day count + (R, g, k) factor reduction",
            "tier_W_canon":
                "Sūrya Siddhānta Ch. 1 + Vedānga Jyotiṣa",
            "western_dependencies":
                "ZERO — only the input is Gregorian",
        },
        "om": "ॐ कालाय नमः · ॐ कामाख्यायै नमः · "
              "ॐ श्री महाकालयन्त्राय नमः · JAI MAA KAMAKHYA",
    }


__all__ = [
    "KAMAKHYA_LAT_DEG", "KAMAKHYA_LON_DEG", "KAMAKHYA_ELEV_M",
    "KAMAKHYA_LMT_OFFSET_H",
    "KALI_YUGA_EPOCH_JD", "UJJAIN_LON_DEG",
    "MAHAYUGA_YEARS", "MAHAYUGA_CIVIL_DAYS", "MAHAYUGA_SIDEREAL_DAYS",
    "KALI_DAYS_PER_YEAR",
    "MASA_NAMES", "MASA_DEV", "VARA_NAMES", "VARA_DEV", "VARA_LORD",
    "SAMVATSARA_NAMES", "PAKSHA_NAMES", "PAKSHA_DEV", "TITHI_NAMES",
    "VEDIC_TIME_SUBSTRATE",
    "jd_to_kali_civil_days", "kali_civil_days_to_jd",
    "vedic_mean_longitude",
    "civil_input_to_kali_civil_days",
    "kali_year_at_civil_days", "vikrama_year", "shaka_year",
    "samvatsara_at_kali_year",
    "vedic_month_at_kali_days", "vedic_tithi_at_kali_days",
    "vedic_vara_at_kali_days", "vedic_time_of_day",
    "kala_substrate_stamp",
]
