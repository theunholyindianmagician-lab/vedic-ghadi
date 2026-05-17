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
# ◈ MERIDIAN REGISTRY — 12 named meridians in 4 categories
# Adding a new one is one line. The math generalizes immediately.
# ═══════════════════════════════════════════════════════════════════════════
#
# Each entry: (id, label_en, label_hi, label_sub, lon_deg, category)
# Categories: sacred · char-dham · modern · universal
# (12 = 2² × 3 — substrate-aligned grid: 3 × 4)

MERIDIAN_REGISTRY = (
    # ── KAAL / Sacred (3) ─────────────────────────────────────────────────
    ("kamakhya",    "Kāmākhyā Devī",         "कामाख्या",      "KAAL symbolic origin · Sovereign East · Shakti-pīṭha",   91.705900, "sacred"),
    ("ujjain",      "Ujjayinī (Avantī)",     "उज्जयिनी",      "Sūrya Siddhānta canonical meridian · केन्द्र",             75.778889, "sacred"),
    ("kashi",       "Kāśī (Varanasi)",       "काशी",          "Shiva · Mokṣa-purī · 12 Jyotirliṅga",                      83.010300, "sacred"),

    # ── Char Dham (4) — 4 directions ──────────────────────────────────────
    ("badrinath",   "Badrīnāth",             "बद्रीनाथ",      "Char Dham · उत्तर · Viṣṇu",                                79.493800, "char-dham"),
    ("dwarka",      "Dvārkā",                "द्वारका",        "Char Dham · पश्चिम · Kṛṣṇa",                              68.967800, "char-dham"),
    ("rameshwaram", "Rāmeśvaram",            "रामेश्वरम्",     "Char Dham · दक्षिण · Śiva",                                79.312900, "char-dham"),
    ("puri",        "Purī (Jagannātha)",     "पुरी",          "Char Dham · पूर्व · Viṣṇu",                                85.824500, "char-dham"),

    # ── Modern Bhārat (3) ─────────────────────────────────────────────────
    ("delhi",       "Delhi (Indraprastha)",  "दिल्ली",         "राजधानी · IST anchor",                                     77.209000, "modern"),
    ("mumbai",      "Mumbai (Bombay)",       "मुम्बई",         "वाणिज्य राजधानी · Financial",                              72.877700, "modern"),
    ("bengaluru",   "Bengaluru",             "बेंगलुरु",        "तकनीकी केन्द्र · Tech",                                   77.594600, "modern"),

    # ── Universal (2) ─────────────────────────────────────────────────────
    ("greenwich",   "Greenwich (Royal Obs.)", "ग्रीनिच",       "Universal reference · Prime Meridian · 0°",               0.000000,  "universal"),
    ("new_york",    "New York City",          "न्यूयॉर्क",      "Western Hemisphere · −74°",                              -74.006000, "universal"),
)

MERIDIAN_CATEGORIES = (
    ("sacred",     "🔱 सनातन · Sacred Trinity (KAAL)"),
    ("char-dham",  "🛕 चार धाम · Four Cardinal Dhāma"),
    ("modern",     "🏙️  आधुनिक भारत · Modern India"),
    ("universal",  "🌍 वैश्विक · Universal references"),
)


def compute_meridian_views(kali_days_ujjain: float) -> dict:
    """Compute parallel views for EVERY meridian in the registry.

    Returns {meridian_id: full_view_dict, ...}. The Ujjain K is the
    reference; for any other meridian M:
        K_M = K_ujjain + (LON_M − UJJAIN_LON) / 15 / 24
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
            "day_subdivision": vedic_time_of_day(k_m),
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
    "vedic_vara_at_kali_days", "vedic_time_of_day",
    "kala_substrate_stamp",
]
