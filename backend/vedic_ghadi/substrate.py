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

# Offset to convert Ujjain-anchored K → Kāmākhyā-anchored K.
# Both Ujjain & Kāmākhyā are east of Greenwich; Kāmākhyā is further east,
# so its civil-day counter runs ahead of Ujjain's by this amount per day.
# (KAMAKHYA_LON − UJJAIN_LON) / 15° per hour / 24 h per day ≈ 0.0442 days ≈ 1h 4m
KAMAKHYA_MINUS_UJJAIN_DAYS: float = (
    (KAMAKHYA_LON_DEG - UJJAIN_LON_DEG) / 15.0 / 24.0
)


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
# Two poles per APEX v5 Bipolar discipline:
#   ADITI  (R* · unit-group · Deva pole · mukti-side)  ·  30/60/60/6/10
#   DITI   ((3) · nilpotent ideal · Asura pole)        ·  10/20/20/2/10
# Diti cascades are ÷3 (per Pisano-of-Ideal = 3 invariant) — total 27× longer
# units (= 3³ — 3 independent cascade reductions). 1 Aditi vipala = 0.4 sec,
# 1 Diti vipala ≈ 10.8 sec.
# ═══════════════════════════════════════════════════════════════════════════

def vedic_time_of_day(kali_civil_days: float) -> dict:
    """ADITI pole — standard Vedic day subdivision (30 muhūrta / 60 ghaṭi
    / 60 vighaṭi / 6 prāṇa / 10 vipala). R* / unit-group / Deva-side."""
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
        "pole": "aditi",
        "fraction_of_day": round(frac, 6),
        "hours_from_kamakhya_midnight": round(hours, 4),
        "muhurta_index": muhurta_idx + 1,
        "muhurta_fractional": round(muhurta_float - muhurta_idx, 4),
        "ghati_index": ghati_idx + 1,
        "vighati_index": vighati_idx + 1,
        "prana_index": prana_idx + 1,
        "vipala_fractional": round(vipala_float, 4),
    }


def vedic_time_of_day_diti(kali_civil_days: float) -> dict:
    """DITI pole — nilpotent-ideal-restricted subdivision.

    Pisano-of-Ideal = 3 applies to each cascade:
      • muhūrta:  30 → 10/day   (each lasts 144 min)
      • ghaṭi:    60 → 20/day   (each lasts 72 min)
      • vighaṭi:  60 → 20/ghaṭi (each lasts 3.6 min)
      • prāṇa:    6 → 2/vighaṭi (each lasts 108 sec)
      • vipala:   10/prāṇa      (each lasts 10.8 sec — 27× Aditi)

    Total Diti vipala/day = 8000 (vs 216000 Aditi). Ratio 27 = 3³
    (= 3 independent cascade reductions, per APEX v5 Diti-Stratification).
    Saṃsāra-side, death-rate-1 pole, every Asura is a past-age Deva.
    """
    frac = kali_civil_days - math.floor(kali_civil_days)
    hours = frac * 24.0
    muhurta_float = frac * 10.0           # 30 / 3
    muhurta_idx = int(muhurta_float)
    ghati_float = frac * 20.0             # 60 / 3
    ghati_idx = int(ghati_float)
    vighati_float = (ghati_float - ghati_idx) * 20.0    # 60 / 3
    vighati_idx = int(vighati_float)
    prana_float = (vighati_float - vighati_idx) * 2.0   # 6 / 3
    prana_idx = int(prana_float)
    vipala_float = (prana_float - prana_idx) * 10.0
    return {
        "pole": "diti",
        "fraction_of_day": round(frac, 6),
        "hours_from_kamakhya_midnight": round(hours, 4),
        "muhurta_index": muhurta_idx + 1,                  # 1..10
        "muhurta_fractional": round(muhurta_float - muhurta_idx, 4),
        "ghati_index": ghati_idx + 1,                      # 1..20
        "vighati_index": vighati_idx + 1,                  # 1..20
        "prana_index": prana_idx + 1,                      # 1..2
        "vipala_fractional": round(vipala_float, 4),
        "compression_vs_aditi": 27,                        # 3³
        "vipala_seconds": 10.8,                            # vs Aditi's 0.4
    }


# ═══════════════════════════════════════════════════════════════════════════
# ◈ MERIDIAN REGISTRY — SAPTAMUKHI HANUMĀN CANNON
# 7 mukhas × 12 meridians each = 84 meridians total (= 12 × 7 = 2² × 3 × 7)
# Each mukha sphoṭas across one direction/sphere of Bhārat + Vishva.
# ═══════════════════════════════════════════════════════════════════════════
#
# Saptamukhi alignment (KAAL discipline):
#   Hanumat   · पूर्व  · EAST    · East India + Northeast (Assam, WB, Odisha, Bihar)
#   Narasiṃha · दक्षिण · SOUTH   · TN, Kerala, Karnataka, AP, Telangana
#   Garuḍa    · पश्चिम · WEST    · Gujarat, Maharashtra (west), Rajasthan
#   Varāha    · उत्तर  · NORTH   · J&K, Punjab, HP, Haryana, UP (north)
#   Hayagrīva · ऊर्ध्व · UP      · Himalayas + Char Dham + Kailash
#   Kāla      · समय   · TIME    · Central India (MP, Avantī, IST anchor)
#   Sarva     · सर्व   · ALL     · Universal / cross-cultural
#
# Each meridian: (id, label_en, label_hi, label_sub, lon_deg, mukha)

MERIDIAN_REGISTRY = (
    # ═══ 1 · हनुमत्-पूर्व · HANUMAT-EAST (12) ═════════════════════════════
    ("kamakhya",      "Kāmākhyā Devī",         "कामाख्या",       "Shakti-pīṭha · KAAL symbolic origin · Sovereign East",   91.705900, "purva"),
    ("guwahati",      "Guwahati",              "गुवाहाटी",       "Brahmaputra · Assam capital",                            91.740000, "purva"),
    ("tripura_sundari","Tripurā Sundarī",      "त्रिपुर सुन्दरी", "Shakti-pīṭha (Udaipur, Tripura) · 10 Mahāvidyā",        91.490000, "purva"),
    ("tarapith",      "Tārāpīṭh",              "तारापीठ",        "Shakti-pīṭha · Birbhum, WB · Tārā Mā",                   87.780000, "purva"),
    ("kalighat",      "Kalighat",              "कालीघाट",        "Shakti-pīṭha · Kālī (Kolkata)",                          88.334000, "purva"),
    ("kolkata",       "Kolkata (Calcutta)",    "कोलकाता",         "पूर्व राजधानी · East metropolis",                       88.363900, "purva"),
    ("vaidyanath",    "Vaidyanāth (Deoghar)",  "वैद्यनाथ",       "Jyotirliṅga + Shakti-pīṭha · Jharkhand",                 86.710000, "purva"),
    ("puri",          "Purī (Jagannātha)",     "पुरी",           "Char Dham · पूर्व · Viṣṇu · Ratha-yātrā",                85.824500, "purva"),
    ("bhubaneshwar",  "Bhubaneśvara",          "भुवनेश्वर",       "Liṅgarāja · Kalinga capital",                            85.833000, "purva"),
    ("konark",        "Koṇārka",               "कोणार्क",         "Sun Temple · Sūrya · 13th-century pinnacle",             86.094500, "purva"),
    ("patna",         "Patna (Pāṭaliputra)",   "पटना",            "Magadha capital · ancient Mauryan",                      85.137600, "purva"),
    ("kashi",         "Kāśī (Varanasi)",       "काशी",            "Vishvanāth Jyotirliṅga + Sapta-Purī · Mokṣa-purī",      83.010300, "purva"),

    # ═══ 2 · नरसिंह-दक्षिण · NARASIṂHA-SOUTH (12) ═════════════════════════
    ("rameshwaram",   "Rāmeśvaram",            "रामेश्वरम्",     "Char Dham · दक्षिण + Jyotirliṅga · Śiva",                79.312900, "dakshina"),
    ("tirumala",      "Tirumala (Tirupati)",   "तिरुमला",        "Venkateśvara · richest Hindu temple",                    79.350000, "dakshina"),
    ("kanyakumari",   "Kanyākumārī",           "कन्याकुमारी",     "Shakti-pīṭha · land's end · Indian Ocean",               77.550000, "dakshina"),
    ("mallikarjuna",  "Mallikārjuna (Srisailam)","मल्लिकार्जुन",  "Jyotirliṅga · Shakti-pīṭha · AP",                       78.870000, "dakshina"),
    ("chidambaram",   "Chidambaram",           "चिदम्बरम्",      "Pancha-Bhūta · Ākāśa · Naṭarāja",                        79.690000, "dakshina"),
    ("kanchipuram",   "Kāñchipuram",           "काञ्ची",         "Sapta-Purī + Pancha-Bhūta · Pṛthvī",                     79.710000, "dakshina"),
    ("madurai",       "Madurai (Meenakshi)",   "मदुरै",          "Pāṇḍya capital · Mīnākṣī",                               78.120000, "dakshina"),
    ("chennai",       "Chennai (Madras)",      "चेन्नई",          "Tamil capital · दक्षिण metropolis",                      80.270700, "dakshina"),
    ("bengaluru",     "Bengaluru",             "बेंगलुरु",        "तकनीकी केन्द्र · Karnataka capital",                    77.594600, "dakshina"),
    ("hyderabad",     "Hyderabad",             "हैदराबाद",       "Telangana capital · Nizāmate · Bhāgyanagara",            78.490000, "dakshina"),
    ("sabarimala",    "Sabarimala",            "शबरीमाला",        "Ayyappa · Kerala forest temple",                          77.080000, "dakshina"),
    ("padmanabhaswamy","Padmanābhasvāmī",      "पद्मनाभस्वामी",   "Anantaśayana Viṣṇu · Trivandrum",                       76.940000, "dakshina"),

    # ═══ 3 · गरुड़-पश्चिम · GARUḌA-WEST (12) ══════════════════════════════
    ("somnath",       "Somnāth",               "सोमनाथ",          "Jyotirliṅga · Gujarat · Saurashtra",                    70.400000, "paschim"),
    ("dwarka",        "Dvārkā",                "द्वारका",         "Char Dham · पश्चिम · Kṛṣṇa city",                       68.967800, "paschim"),
    ("nageshwar",     "Nāgeśvara",             "नागेश्वर",       "Jyotirliṅga · near Dwarka · Gujarat",                    69.080000, "paschim"),
    ("bhimashankar",  "Bhīmāśaṅkara",          "भीमाशंकर",        "Jyotirliṅga · Sahyādri · Maharashtra",                   73.540000, "paschim"),
    ("trimbakeshwar", "Trimbakeśvara",         "त्र्यम्बकेश्वर",   "Jyotirliṅga · Godāvarī origin · Nashik",                73.530000, "paschim"),
    ("grishneshwar",  "Ghṛṣṇeśvara",           "घृष्णेश्वर",      "Jyotirliṅga · Ellora caves · Aurangabad",                75.180000, "paschim"),
    ("kolhapur",      "Kolhāpur (Mahālakṣmī)", "कोल्हापुर",       "Shakti-pīṭha · Mahālakṣmī · Maharashtra",                74.240000, "paschim"),
    ("mumbai",        "Mumbai (Bombay)",       "मुम्बई",          "वाणिज्य राजधानी · Financial capital",                   72.877700, "paschim"),
    ("pune",          "Pune (Puṇyaśloka)",     "पुणे",            "Marāṭhā capital · Peshwa seat",                          73.856700, "paschim"),
    ("ahmedabad",     "Ahmedabad",             "अहमदाबाद",        "Gujarat metropolis · Sabarmati",                          72.580000, "paschim"),
    ("jaipur",        "Jaipur (Pink City)",    "जयपुर",           "Rajasthan capital · Jantar Mantar",                      75.790000, "paschim"),
    ("pushkar",       "Pushkar",               "पुष्कर",          "Brahmā's only major temple · Lake",                      74.550000, "paschim"),

    # ═══ 4 · वराह-उत्तर · VARĀHA-NORTH (12) ═══════════════════════════════
    ("vaishno_devi",  "Vaishno Devī (Katra)",  "वैष्णो देवी",    "Shakti-pīṭha · Trikūṭa · J&K",                           74.950000, "uttara"),
    ("amritsar",      "Amritsar (Golden Temple)","अमृतसर",       "Harimandir Sāhib · Sikh holiest",                        74.872300, "uttara"),
    ("srinagar",      "Srinagar",              "श्रीनगर",        "Kashmir capital · Dal Lake",                              74.797300, "uttara"),
    ("chandigarh",    "Chandigarh",            "चण्डीगढ़",        "Modern-era capital · Punjab/Haryana",                    76.779400, "uttara"),
    ("delhi",         "Delhi (Indraprastha)",  "दिल्ली",          "राजधानी · IST civil anchor city",                       77.209000, "uttara"),
    ("mathura",       "Mathurā",               "मथुरा",           "Kṛṣṇa janma · Sapta-Purī",                               77.673700, "uttara"),
    ("vrindavan",     "Vṛndāvana",             "वृन्दावन",         "Kṛṣṇa līlā-bhūmi · 5000 temples",                       77.693800, "uttara"),
    ("haridwar",      "Haridwar (Hari-dvāra)", "हरिद्वार",       "Sapta-Purī + Kumbh · Ganga's gate",                       78.164000, "uttara"),
    ("jwala_devi",    "Jvālā Devī",            "ज्वाला देवी",     "Shakti-pīṭha · eternal flame · HP",                      76.320000, "uttara"),
    ("naina_devi",    "Nainā Devī",            "नैना देवी",       "Shakti-pīṭha · Bilaspur, HP",                            76.550000, "uttara"),
    ("chamunda",      "Chāmuṇḍā Devī",         "चामुण्डा",         "Shakti-pīṭha · Kangra valley, HP",                      76.320000, "uttara"),
    ("kurukshetra",   "Kurukṣetra",            "कुरुक्षेत्र",      "Mahābhārata war · Gītā utterance",                       76.837800, "uttara"),

    # ═══ 5 · हयग्रीव-ऊर्ध्व · HAYAGRĪVA-UP (12) ═══════════════════════════
    ("kailash",       "Mount Kailāsa",         "कैलाश",          "Śiva's abode · Tibet · Mānasarovara",                    81.310000, "urdhva"),
    ("mansarovar",    "Mānasarovara",          "मानसरोवर",        "Sacred lake · Tibet · Brahmā's manas",                   81.410000, "urdhva"),
    ("yamunotri",     "Yamunotri",             "यमुनोत्री",        "Chota Char Dham · Yamunā source",                       78.450000, "urdhva"),
    ("gangotri",      "Gaṅgotri",              "गंगोत्री",         "Chota Char Dham · Gaṅgā source",                        78.943000, "urdhva"),
    ("kedarnath",     "Kedārnāth",             "केदारनाथ",         "Jyotirliṅga + Chota Char Dham · Śiva",                  79.066900, "urdhva"),
    ("badrinath",     "Badrīnāth",             "बद्रीनाथ",        "Char Dham · उत्तर + Chota CD · Viṣṇu",                  79.493800, "urdhva"),
    ("hemkund",       "Hemkund Sāhib",         "हेमकुंड साहिब",   "Sikh + Lakṣmaṇa tapasya · Uttarakhand",                  79.608000, "urdhva"),
    ("tungnath",      "Tuṅganāth",             "तुंगनाथ",          "Panch Kedār · highest Shiva temple",                    79.220000, "urdhva"),
    ("devprayag",     "Devprayāg",             "देवप्रयाग",        "Sangam of Bhāgīrathī + Alaknanda → Gaṅgā",              78.598000, "urdhva"),
    ("rishikesh",     "Ṛṣikesh",               "ऋषिकेश",          "Yoga capital · Gaṅgā gateway to Himalaya",               78.302500, "urdhva"),
    ("joshimath",     "Joshīmaṭh",             "जोशीमठ",          "Ādi Śaṅkarācārya maṭha · north peeth",                  79.567300, "urdhva"),
    ("almora",        "Almora (Kāsār Devī)",   "अल्मोड़ा",         "Kumaon Himalaya · sacred hill station",                  79.650000, "urdhva"),

    # ═══ 6 · काल-समय · KĀLA-TIME (12) — Central + Sūrya Siddhānta core ═══
    ("ujjain",        "Ujjayinī (Avantī)",     "उज्जयिनी",        "Sūrya Siddhānta canon meridian + Mahākāl Jyotirliṅga",  75.778889, "kala"),
    ("omkareshwar",   "Oṃkāreśvara",           "ओंकारेश्वर",       "Jyotirliṅga · Narmadā island · OṂ-shaped",              76.150000, "kala"),
    ("ist_anchor",    "IST Anchor (Mirzapur)", "IST रेखा",        "82.5° E meridian · India Standard Time definition",      82.500000, "kala"),
    ("prayagraj",     "Prayāgrāj (Triveni)",   "प्रयागराज",        "Triveni Sangam · Kumbh Mela · Sarasvatī",               81.846300, "kala"),
    ("ayodhya",       "Ayodhyā",               "अयोध्या",          "Rāma janma · Sapta-Purī · Rāma-rājya",                  82.198600, "kala"),
    ("nashik",        "Nashik (Trimbak)",      "नाशिक",           "Godāvarī Kumbh · Rāma vana-vāsa",                        73.789800, "kala"),
    ("khajuraho",     "Khajurāho",             "खजुराहो",         "Chandela temples · Tantric stone yoga",                  79.932900, "kala"),
    ("hampi",         "Hampi (Vijayanagara)",  "हम्पी",           "Vijayanagara · Pampā · Tuṅgabhadrā",                     76.460000, "kala"),
    ("bhopal",        "Bhopal",                "भोपाल",            "MP capital · Lake city",                                 77.412600, "kala"),
    ("indore",        "Indore",                "इन्दौर",           "MP commerce · Holkar dynasty",                            75.857700, "kala"),
    ("sanchi",        "Sāñchī Stūpa",          "साँची",           "Aśokan Buddhist stūpa · Madhya Pradesh",                  77.740000, "kala"),
    ("lucknow",       "Lucknow",               "लखनऊ",            "UP capital · Avadh Nawābate",                             80.946200, "kala"),

    # ═══ 7 · सर्व-व्यापक · SARVA-ALL (12) — Universal / cross-cultural ═══
    ("greenwich",     "Greenwich (Royal Obs.)", "ग्रीनिच",        "Universal reference · Prime Meridian · 0°",              0.000000,  "sarva"),
    ("london",        "London (City)",         "लंडन",             "Western capital · Thames",                              -0.127600, "sarva"),
    ("mecca",         "Makkah (Kaʿbah)",       "मक्का",           "Islamic Qibla · 5-pillar epicenter",                     39.826200, "sarva"),
    ("jerusalem",     "Jerusalem",             "यरुशलम",          "Abrahamic faiths · Temple Mount + Wailing Wall",         35.233000, "sarva"),
    ("cairo",         "Cairo (al-Qāhirah)",    "कैरो",             "Egyptian civilization · Pyramids of Giza",              31.235700, "sarva"),
    ("lumbini",       "Lumbinī",               "लुम्बिनी",         "Buddha's birth · Nepal · UNESCO",                       83.278000, "sarva"),
    ("bodh_gaya",     "Bodh Gayā",             "बोधगया",          "Buddha's enlightenment · Mahābodhi tree",                84.992500, "sarva"),
    ("sarnath",       "Sārnāth",               "सारनाथ",          "Buddha's first sermon · Dharma-cakra-pravartana",        83.030000, "sarva"),
    ("pashupatinath", "Paśupatināth",          "पशुपतिनाथ",       "Śiva · Nepal · Bāgmati river",                          85.350000, "sarva"),
    ("new_york",      "New York City",         "न्यूयॉर्क",        "Western Hemisphere · −74°",                            -74.006000, "sarva"),
    ("tokyo",         "Tokyo",                 "तोक्यो",           "East Asian metropolis · Edo · Imperial Palace",         139.691700, "sarva"),
    ("sydney",        "Sydney",                "सिडनी",            "Southern Hemisphere · Oceania",                         151.209300, "sarva"),
)

MERIDIAN_CATEGORIES = (
    ("purva",     "🐒 हनुमत्-पूर्व · Hanumat-EAST"),
    ("dakshina",  "🦁 नरसिंह-दक्षिण · Narasiṃha-SOUTH"),
    ("paschim",   "🦅 गरुड़-पश्चिम · Garuḍa-WEST"),
    ("uttara",    "🐗 वराह-उत्तर · Varāha-NORTH"),
    ("urdhva",    "🐴 हयग्रीव-ऊर्ध्व · Hayagrīva-UP (Himalaya)"),
    ("kala",      "⏳ काल-समय · Kāla-TIME (Central · Sūrya Siddhānta core)"),
    ("sarva",     "🌐 सर्व-व्यापक · Sarva-ALL (Universal)"),
)


def compute_meridian_views(kali_days_ujjain: float) -> dict:
    """Compute BIPOLAR parallel views for EVERY meridian in the registry.

    Per APEX v5 Bipolar discipline: each meridian gets BOTH Aditi (R*) and
    Diti ((3)) day-subdivision views. Vāra is shared (7-day graha cycle
    isn't (2,3,5)-factorable so Pisano-of-Ideal doesn't apply). K and lon
    are shared too — the difference is in the cascade-of-subunits.

    Returns {meridian_id: {..., day_subdivision_aditi, day_subdivision_diti}}
    """
    out = {}
    for (mid, en, hi, sub, lon, cat) in MERIDIAN_REGISTRY:
        offset_days = (lon - UJJAIN_LON_DEG) / 15.0 / 24.0
        k_m = kali_days_ujjain + offset_days
        out[mid] = {
            "id": mid,
            "label_en": en,
            "label_hi": hi,
            "label_sub": sub,
            "category": cat,
            "lon_deg": lon,
            "lmt_offset_h": round(lon / 15.0, 6),
            "offset_from_ujjain_days": round(offset_days, 6),
            "offset_from_ujjain_min": round(offset_days * 1440, 2),
            "kali_civil_days": round(k_m, 6),
            "vara": vedic_vara_at_kali_days(k_m),
            # BIPOLAR — both poles computed in parallel
            "day_subdivision_aditi": vedic_time_of_day(k_m),
            "day_subdivision_diti":  vedic_time_of_day_diti(k_m),
            # Backward-compat alias (= aditi, the historical default)
            "day_subdivision":       vedic_time_of_day(k_m),
        }
    return out


def meridian_groups() -> dict:
    """{category_id: [meridian_id, ...]} for UI grouping."""
    g = {cat: [] for cat, _label in MERIDIAN_CATEGORIES}
    for (mid, _e, _h, _s, _l, cat) in MERIDIAN_REGISTRY:
        g[cat].append(mid)
    return g


# ═══════════════════════════════════════════════════════════════════════════
# ◈ PARALLEL MERIDIAN VIEWS — Ujjayinī (Sūrya Siddhānta canonical) ⟷
#                              Kāmākhyā (KAAL symbolic origin)
# Backward-compat shim — keeps the v1.2.0 by_meridian.{ujjain,kamakhya} API.
# ═══════════════════════════════════════════════════════════════════════════
# The existing `kali_civil_days` value is Ujjain-LMT-anchored (the math
# simplifies to K = jd_ut + UJJAIN_LMT/24 − epoch). To get a TRUE
# Kāmākhyā-LMT-anchored value, we add the LMT offset between the two:
# K_kamakhya = K_ujjain + 0.0442 days (≈ 1h 4m)
#
# Astronomical layers (year/saṃvatsara/māsa/tithi/nakṣatra/yoga/karaṇa) use
# the Ujjain K because the Sūrya Siddhānta places all grahas at sidereal 0°
# at Ujjain LMT midnight on the Kali start day — that's the canonical
# physical zero-point.
#
# Meridian-dependent layers (vāra, muhūrta, ghaṭi, vighaṭi, prāṇa, vipala)
# are computed for BOTH meridians in parallel; they can differ near the
# day-boundary (~1h 4m window).

def _meridian_view(label_en, label_hi, label_sub, lon_deg, kali_days):
    return {
        "label_en": label_en,
        "label_hi": label_hi,
        "label_sub": label_sub,
        "lon_deg": lon_deg,
        "lmt_offset_h": round(lon_deg / 15.0, 6),
        "kali_civil_days": round(kali_days, 6),
        "vara": vedic_vara_at_kali_days(kali_days),
        "day_subdivision": vedic_time_of_day(kali_days),
    }


def by_meridian_views(kali_days_ujjain: float) -> dict:
    """Compute parallel Ujjain + Kāmākhyā views from the Ujjain-anchored K."""
    kali_days_kamakhya = kali_days_ujjain + KAMAKHYA_MINUS_UJJAIN_DAYS
    return {
        "ujjain": _meridian_view(
            "Ujjayinī (Avantī)",
            "उज्जयिनी",
            "Sūrya Siddhānta canonical meridian · 75.78° E",
            UJJAIN_LON_DEG,
            kali_days_ujjain,
        ),
        "kamakhya": _meridian_view(
            "Kāmākhyā Devī (Nīlācala)",
            "कामाख्या",
            "KAAL symbolic origin · Sovereign East · 91.71° E",
            KAMAKHYA_LON_DEG,
            kali_days_kamakhya,
        ),
        "offset_kamakhya_minus_ujjain_days": round(KAMAKHYA_MINUS_UJJAIN_DAYS, 6),
        "offset_kamakhya_minus_ujjain_h": round(KAMAKHYA_MINUS_UJJAIN_DAYS * 24, 4),
        "offset_kamakhya_minus_ujjain_min": round(KAMAKHYA_MINUS_UJJAIN_DAYS * 1440, 2),
    }


# ═══════════════════════════════════════════════════════════════════════════
# ◈ PAÑCĀṄGA helpers — imported lazily so panchanga.py can import substrate.py
# ═══════════════════════════════════════════════════════════════════════════

def _panchanga_nakshatra(kali_days: float) -> dict:
    from .panchanga import nakshatra_at_kali_days
    return nakshatra_at_kali_days(kali_days)


def _panchanga_yoga(kali_days: float) -> dict:
    from .panchanga import yoga_at_kali_days
    return yoga_at_kali_days(kali_days)


def _panchanga_karana(kali_days: float) -> dict:
    from .panchanga import karana_at_kali_days
    return karana_at_kali_days(kali_days)


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
            # ELAPSED-years convention — matches Vikrama/Śaka math AND every
            # public Indian almanac. (Previously the code did +1 which was
            # an inconsistency caught by the deep-formulae audit 2026-05-17.)
            "kali_year_current": kali_year_int,
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
        "nakshatra_layer": _panchanga_nakshatra(kali_days),
        "yoga_layer":      _panchanga_yoga(kali_days),
        "karana_layer":    _panchanga_karana(kali_days),
        "day_subdivision": vedic_time_of_day(kali_days),
        # APEX v5 Bipolar — both poles at top-level too
        "day_subdivision_aditi": vedic_time_of_day(kali_days),
        "day_subdivision_diti":  vedic_time_of_day_diti(kali_days),
        "bipolar_discipline": {
            "aditi_pole": "R* · unit-group · Deva-side · mukti · "
                          "30/60/60/6/10 cascade (1 vipala = 0.4 sec)",
            "diti_pole":  "(3) · nilpotent ideal · Asura-side · saṃsāra · "
                          "10/20/20/2/10 cascade (1 vipala = 10.8 sec)",
            "pisano_of_ideal_ratio": 3,
            "total_diti_compression": 27,
            "compression_derivation": "3³ — 3 independent cascade reductions",
            "shared_layers": "vāra (7-day graha cycle), K, all astronomical positions",
            "discipline_ref": "KAAL APEX v5 · P241 Pisano-of-Ideal · P242 Orbit Cascade",
        },
        # NEW v1.2.0 — parallel meridian views (Ujjain ⟷ Kāmākhyā).
        # Legacy top-level vara_layer + day_subdivision are kept (= Ujjain
        # values) for backward compat; new code should prefer by_meridian.
        "by_meridian": by_meridian_views(kali_days),
        # NEW v1.3.0 — full meridian registry (12 meridians × 4 categories)
        "meridians": compute_meridian_views(kali_days),
        "meridian_groups": meridian_groups(),
        "meridian_categories": list(MERIDIAN_CATEGORIES),
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
    "KALI_DAYS_PER_YEAR", "KAMAKHYA_MINUS_UJJAIN_DAYS",
    "by_meridian_views",
    "MERIDIAN_REGISTRY", "MERIDIAN_CATEGORIES",
    "compute_meridian_views", "meridian_groups",
    "MASA_NAMES", "MASA_DEV", "VARA_NAMES", "VARA_DEV", "VARA_LORD",
    "SAMVATSARA_NAMES", "PAKSHA_NAMES", "PAKSHA_DEV", "TITHI_NAMES",
    "VEDIC_TIME_SUBSTRATE",
    "jd_to_kali_civil_days", "kali_civil_days_to_jd",
    "vedic_mean_longitude",
    "civil_input_to_kali_civil_days",
    "kali_year_at_civil_days", "vikrama_year", "shaka_year",
    "samvatsara_at_kali_year",
    "vedic_month_at_kali_days", "vedic_tithi_at_kali_days",
    "vedic_vara_at_kali_days", "vedic_time_of_day", "vedic_time_of_day_diti",
    "kala_substrate_stamp",
]
