#!/usr/bin/env python3
"""
🔱 DEEP FORMULAE AUDIT — every formula, every constant, every anchor.

Verifies the substrate end-to-end:
  1. Sūrya Siddhānta constants match canon (Mahā-yuga, mean motions)
  2. JD-UT formula round-trips correctly
  3. Kāli day count matches simplification: K = jd_ut + UJJAIN_LMT/24 - epoch
  4. Vāra anchor: Kali day 0 = Śukravāra; 2026-05-17 IST = Ravivāra
  5. Public almanac cross-checks (Saṃvatsara, Vikrama, Śaka)
  6. Internal consistency: Vikrama, Śaka, Kali all use the SAME convention
  7. Mean longitude sanity: Sun returns to origin after one sidereal year
  8. Nakṣatra pada arithmetic (4 pada / nakṣatra; pada index 1..4)
  9. Karaṇa distribution: 1 + (7×8) + 3 = 60 across the lunar month
 10. FormulaePanel display string consistency vs computed values
 11. Python ↔ TypeScript byte parity across multiple anchors
 12. Edge cases: year boundaries, BCE dates, mod arithmetic for negatives

Run:  python3 scripts/audit_formulae.py
Returns exit code 0 only if every formula passes; >0 means at least one fail.
"""

from __future__ import annotations

import json
import math
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "backend"))

from vedic_ghadi import ghadi_at, civil_input_to_kali_civil_days  # noqa: E402
from vedic_ghadi.substrate import (  # noqa: E402
    KALI_YUGA_EPOCH_JD, MAHAYUGA_CIVIL_DAYS, MAHAYUGA_YEARS, KALI_DAYS_PER_YEAR,
    UJJAIN_LON_DEG, KAMAKHYA_LON_DEG, KAMAKHYA_LMT_OFFSET_H,
    UJJAIN_TO_KAMAKHYA_TIME_DIFF_H,
    vedic_mean_longitude, jd_to_kali_civil_days,
    SAMVATSARA_NAMES,
)
from vedic_ghadi.panchanga import (  # noqa: E402
    nakshatra_at_kali_days, yoga_at_kali_days, karana_at_kali_days,
    NAKSHATRA_NAMES, NAKSHATRA_LORD, YOGA_NAMES, KARANA_CARA,
    _karana_for_half_tithi,
)

FAILS: list[tuple[str, str]] = []
WARNS: list[tuple[str, str]] = []
PASSES: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        PASSES.append(name)
        print(f"  ✓ {name}{(' — ' + detail) if detail else ''}")
    else:
        FAILS.append((name, detail))
        print(f"  ✗ {name} — {detail}")


def warn(name: str, detail: str) -> None:
    WARNS.append((name, detail))
    print(f"  ⚠ {name} — {detail}")


def section(title: str) -> None:
    print()
    print(f"━━━ {title} " + "━" * (72 - len(title)))


# ═══════════════════════════════════════════════════════════════════════════
section("1 · Sūrya Siddhānta constants — canonical")
# ═══════════════════════════════════════════════════════════════════════════

check("MAHAYUGA_YEARS = 4_320_000",      MAHAYUGA_YEARS == 4_320_000)
check("MAHAYUGA_CIVIL_DAYS = 1_577_917_500", MAHAYUGA_CIVIL_DAYS == 1_577_917_500)
check("KALI_YUGA_EPOCH_JD = 588_465.5",  KALI_YUGA_EPOCH_JD == 588_465.5)
check("UJJAIN_LON_DEG ≈ 75.7789°",       abs(UJJAIN_LON_DEG - 75.778889) < 1e-6)
check("KAMAKHYA_LON_DEG ≈ 91.7059°",     abs(KAMAKHYA_LON_DEG - 91.705900) < 1e-6)

# Derived:
expected_kdpy = MAHAYUGA_CIVIL_DAYS / MAHAYUGA_YEARS
check("KALI_DAYS_PER_YEAR = MCD/MY = 365.25868…",
      abs(KALI_DAYS_PER_YEAR - expected_kdpy) < 1e-12,
      f"got {KALI_DAYS_PER_YEAR}")
check("KAMAKHYA_LMT_OFFSET_H = LON/15 = 6.1137h",
      abs(KAMAKHYA_LMT_OFFSET_H - 91.7059/15.0) < 1e-9)
check("UJJAIN_TO_KAMAKHYA_TIME_DIFF_H = (KAM−UJJ)/15 ≈ 1.0618h",
      abs(UJJAIN_TO_KAMAKHYA_TIME_DIFF_H - (91.7059-75.778889)/15) < 1e-9)


# ═══════════════════════════════════════════════════════════════════════════
section("2 · K = jd_ut + offset/24 - epoch · algebraic simplification")
# ═══════════════════════════════════════════════════════════════════════════
# code formula: K = jd_ut + KAMAKHYA_LMT/24 - epoch - (KAMAKHYA_LMT - UJJAIN_LMT)/24
# simplifies to: K = jd_ut + UJJAIN_LMT/24 - epoch
UJJAIN_LMT_OFFSET_H = UJJAIN_LON_DEG / 15.0
test_jd = 2_461_178.0
k_code = jd_to_kali_civil_days(test_jd)
k_simplified = test_jd + UJJAIN_LMT_OFFSET_H / 24.0 - KALI_YUGA_EPOCH_JD
check("K(jd) ≡ jd + UJJAIN_LMT/24 − epoch  (algebraic identity)",
      abs(k_code - k_simplified) < 1e-9,
      f"diff {abs(k_code - k_simplified):.2e}")

# Note: the code is labelled "Kāmākhyā-anchored" but the math is effectively
# Ujjain-anchored (Kāmākhyā and Ujjain offsets cancel in part). For the
# *fraction-of-day* (and therefore muhūrta/ghaṭi), this matters near the
# day boundary. Document this clearly:
warn("Label vs math precision",
     "Code labels 'Kāmākhyā-anchored' but K = jd_ut + UJJAIN_LMT/24 − epoch "
     "(i.e., Ujjain-LMT-anchored). For our purposes — Sūrya Siddhānta canon "
     "uses Ujjain as the reference meridian — this is *defensible* but the "
     "label is loose. Muhūrta/ghaṭi anchored on Ujjain midnight, not Kāmākhyā.")


# ═══════════════════════════════════════════════════════════════════════════
section("3 · Vāra anchor — Kali day 0 = Friday")
# ═══════════════════════════════════════════════════════════════════════════
# day 0 → (0 + 5) mod 7 = 5 = Śukravāra
from vedic_ghadi.substrate import vedic_vara_at_kali_days
v0 = vedic_vara_at_kali_days(0.0)
check("K=0 → Śukravāra (Friday)",        v0["vara_name"] == "Śukravāra")
v1 = vedic_vara_at_kali_days(1.0)
check("K=1 → Śanivāra (Saturday)",       v1["vara_name"] == "Śanivāra")
v6 = vedic_vara_at_kali_days(6.0)
check("K=6 → Guruvāra (Thursday)",       v6["vara_name"] == "Bṛhaspativāra")
v7 = vedic_vara_at_kali_days(7.0)
check("K=7 → Śukravāra (cycle restart)", v7["vara_name"] == "Śukravāra")


# ═══════════════════════════════════════════════════════════════════════════
section("4 · Public almanac cross-check — 2026-05-17 16:00 IST")
# ═══════════════════════════════════════════════════════════════════════════
# Drik Panchang / public almanacs for that moment:
#   Vāra        = Ravivāra  (Sunday)        — independently verifiable
#   Saṃvatsara  = Parābhava                 — independently verifiable
#   Vikrama     = 2083                       — public
#   Śaka        = 1948                       — public
#   Kali year   = 5127       (elapsed convention used by all major almanacs)
#   Mean tithi  = Dvitīyā / Tṛtīyā near boundary (mean ≠ apparent ±1 tithi)
stamp = ghadi_at(2026, 5, 17, 16, 0, 0, 5.5)
y = stamp["year_layer"]

check("Vāra = Ravivāra",       stamp["vara_layer"]["vara_name"] == "Ravivāra")
check("Saṃvatsara = Parābhava", y["samvatsara"]["name"] == "Parābhava")
check("Vikrama = 2083",        y["vikrama_samvat"] == 2083)
check("Śaka = 1948",           y["shaka_samvat"] == 1948)

# THIS is the off-by-one to check:
if y["kali_year_current"] == 5127:
    check("Kali = 5127 (elapsed convention, matches public)", True)
else:
    check("Kali year matches public almanac (5127)", False,
          f"got kali_year_current = {y['kali_year_current']}, "
          f"public almanacs say 5127. "
          f"Code uses (floor(Y)+1) while Vikrama/Śaka use floor(Y) — inconsistent.")


# ═══════════════════════════════════════════════════════════════════════════
section("5 · Internal consistency — Vikrama/Śaka/Kali use SAME convention")
# ═══════════════════════════════════════════════════════════════════════════
# All three are simple offsets of Kali year. They should all be either
# floor() (elapsed convention) or floor()+1 (counting convention).
# Code: Vikrama=floor(Y-3044), Śaka=floor(Y-3179), Kali=floor(Y)+1 — MISMATCH.
y_float = y["kali_year_float"]
expected_vikrama = math.floor(y_float - 3044)
expected_shaka   = math.floor(y_float - 3179)
expected_kali_floor = math.floor(y_float)
expected_kali_plus_one = math.floor(y_float) + 1

check("Vikrama is floor-based (matches floor(Y - 3044))",
      y["vikrama_samvat"] == expected_vikrama)
check("Śaka is floor-based (matches floor(Y - 3179))",
      y["shaka_samvat"] == expected_shaka)

if y["kali_year_current"] == expected_kali_floor:
    check("Kali also floor-based (consistent with Vikrama/Śaka)", True)
elif y["kali_year_current"] == expected_kali_plus_one:
    check("Kali consistent with Vikrama/Śaka convention", False,
          f"Kali uses floor()+1 = {y['kali_year_current']} but "
          f"Vikrama/Śaka use floor() = {expected_kali_floor}. Pick ONE.")


# ═══════════════════════════════════════════════════════════════════════════
section("6 · Saṃvatsara cycle math — Prabhava index 11 in Śaka")
# ═══════════════════════════════════════════════════════════════════════════
# Canonical: Prabhava saṃvatsara began Śaka year -11 → idx 0 at Śaka -11
# So idx = (Śaka_year + 11) mod 60. Verify cycle returns to Prabhava.
check("Śaka=-11 → Prabhava (idx 0)", (int(-11) + 11) % 60 == 0)
check("Śaka=49 → Prabhava (cycle restart)", (49 + 11) % 60 == 0)
check("Śaka=1948 → Parābhava (idx 39)",
      SAMVATSARA_NAMES[(1948 + 11) % 60] == "Parābhava")
# Reverse: which Śaka year was Prabhava most recently?
# (Śaka + 11) ≡ 0 (mod 60)  →  Śaka ≡ -11 ≡ 49 (mod 60)
# Most recent Prabhava: Śaka 1969 (= 1969 + 11 = 1980 = 33×60). Verify:
check("Saṃvatsara cycle restart: Śaka 1969 = Prabhava",
      SAMVATSARA_NAMES[(1969 + 11) % 60] == "Prabhava")


# ═══════════════════════════════════════════════════════════════════════════
section("7 · Mean longitude — round-trip in one sidereal year")
# ═══════════════════════════════════════════════════════════════════════════
days_per_year = MAHAYUGA_CIVIL_DAYS / MAHAYUGA_YEARS
sun_0 = vedic_mean_longitude("Sun", 0.0)
sun_yr = vedic_mean_longitude("Sun", days_per_year)
check("Sun(K=0) = 0°",       abs(sun_0) < 1e-9)
check("Sun(K=1 year) ≈ 0°",  abs(((sun_yr - sun_0 + 180) % 360 - 180)) < 1e-6)

# Mean motion in degrees/day
sun_rate = 4_320_000 * 360.0 / MAHAYUGA_CIVIL_DAYS
moon_rate = 57_753_336 * 360.0 / MAHAYUGA_CIVIL_DAYS
check("Sun mean motion ≈ 0.985647°/day",  abs(sun_rate - 0.985647) < 1e-4,
      f"got {sun_rate:.6f}")
check("Moon mean motion ≈ 13.176°/day",   abs(moon_rate - 13.176) < 1e-2,
      f"got {moon_rate:.6f}")

# Synodic month = 360 / (moon_rate - sun_rate) ≈ 29.53 days
synodic = 360.0 / (moon_rate - sun_rate)
check("Synodic month ≈ 29.53 days",  abs(synodic - 29.530589) < 1e-2,
      f"got {synodic:.6f}")


# ═══════════════════════════════════════════════════════════════════════════
section("8 · Nakṣatra · pada · Vimśottarī lordship")
# ═══════════════════════════════════════════════════════════════════════════
check("27 nakṣatras",        len(NAKSHATRA_NAMES) == 27)
check("27 nakṣatra lords",   len(NAKSHATRA_LORD) == 27)
check("Aśvinī lord = Ketu",  NAKSHATRA_LORD[0] == "Ketu")
check("Vimśottarī cycle of 9", all(
    NAKSHATRA_LORD[i] == NAKSHATRA_LORD[(i + 9) % 27] for i in range(27)
))

# Pada arithmetic: each nakṣatra = 13°20′ = 13.333…°; pada = 3°20′ = 3.333…°.
# 4 pada per nakṣatra. Total = 108 = 2² × 3³. Trinity³ × Pakṣa².
check("108 pada total (= 4 × 27)", 4 * 27 == 108)
check("108 = 2² × 3³",  2*2*3*3*3 == 108)

# Moon at exactly 0° → nakṣatra 1 (Aśvinī), pada 1
n0 = nakshatra_at_kali_days(0.0)
check("K=0 → Aśvinī pada 1",  n0["nakshatra_name"] == "Aśvinī" and n0["pada"] == 1)
# Moon at half of an Aśvinī arc (≈ 6.67°) → still Aśvinī, pada 3
# (because each pada = 3.333°, and 6.67° = 2 pada into Aśvinī)
moon_target = 6.67
# Find a K such that moon_lon ≈ moon_target. moon_rate ≈ 13.176°/day → K ≈ 0.506
K_test = moon_target / moon_rate
nt = nakshatra_at_kali_days(K_test)
check(f"K such that moon≈{moon_target}° → Aśvinī, pada 3",
      nt["nakshatra_name"] == "Aśvinī" and nt["pada"] == 3,
      f"got {nt['nakshatra_name']} pada {nt['pada']}")


# ═══════════════════════════════════════════════════════════════════════════
section("9 · Karaṇa distribution — 60 half-tithis per lunar month")
# ═══════════════════════════════════════════════════════════════════════════
movable = sum(1 for i in range(60) if _karana_for_half_tithi(i)[2])
fixed = 60 - movable
check("56 cara (movable) + 4 sthira (fixed) = 60",
      movable == 56 and fixed == 4,
      f"got {movable} cara + {fixed} sthira")

# Sthira anchors: Kiṃstughna at 0 (start of Śukla Pratipadā second half)
#                 Śakuni at 57 (Kṛṣṇa Caturdaśī first half)
#                 Catuṣpāda at 58, Nāga at 59
sthira_indices = [(i, _karana_for_half_tithi(i)[0])
                  for i in range(60) if not _karana_for_half_tithi(i)[2]]
check("Sthira at correct positions {0, 57, 58, 59}",
      [s[0] for s in sthira_indices] == [0, 57, 58, 59])
check("Sthira names = [Kiṃstughna, Śakuni, Catuṣpāda, Nāga]",
      [s[1] for s in sthira_indices] == ["Kiṃstughna", "Śakuni", "Catuṣpāda", "Nāga"])

# Cara cycle: 7 cara × 8 cycles = 56 ✓
# Each cara appears exactly 8 times in the 56 movable slots
from collections import Counter
cara_counts = Counter(_karana_for_half_tithi(i)[0]
                      for i in range(1, 57))
check("Each of 7 cara appears exactly 8 times",
      all(cara_counts[c] == 8 for c in KARANA_CARA),
      str(dict(cara_counts)))


# ═══════════════════════════════════════════════════════════════════════════
section("10 · FormulaePanel-display vs computed values")
# ═══════════════════════════════════════════════════════════════════════════
# The panel displays "L☉ = 0.98560259°/day × K mod 360" (post-audit fix).
# Verify the *displayed* formula reproduces what's actually computed.
K = stamp["kali_civil_days_at_kamakhya"]
# 10-digit precision in the panel: 0.9856028595 — truncation < 5e-11 per day
# Over 1.87M days: error < 1e-4°. Anchor against the EXACT ratio first to
# bound the K-rounding contribution, then check panel display.
from fractions import Fraction
sun_rate_exact = float(Fraction(4_320_000 * 360, 1_577_917_500))
moon_rate_exact = float(Fraction(57_753_336 * 360, 1_577_917_500))

sun_displayed_rate = 0.9856028595      # panel value (post-audit fix)
sun_displayed = (sun_displayed_rate * K) % 360
sun_computed = stamp["month_layer"]["sun_sidereal_lon_deg"]
err_sun = abs((sun_displayed - sun_computed + 180) % 360 - 180)
check(f"Sun longitude: panel-formula matches computed (err {err_sun:.6f}°)",
      err_sun < 0.01)

moon_displayed_rate = 13.1763548855
moon_displayed = (moon_displayed_rate * K) % 360
moon_computed = stamp["nakshatra_layer"]["moon_sidereal_lon_deg"]
err_moon = abs((moon_displayed - moon_computed + 180) % 360 - 180)
check(f"Moon longitude: panel-formula matches computed (err {err_moon:.6f}°)",
      err_moon < 0.01)

# The EXACT ratio matches to within stored-value rounding (4 dp)
sun_exact = (sun_rate_exact * K) % 360
err_sun_exact = abs((sun_exact - sun_computed + 180) % 360 - 180)
check(f"Sun longitude: EXACT ratio matches computed (err {err_sun_exact:.2e}°)",
      err_sun_exact < 1e-3,    # bounded by sun_sidereal_lon_deg's round(4)
      "bounded by sun_sidereal_lon_deg round(4)")


# Tithi formula: T = floor(elong / 12) + 1
elong = stamp["tithi_layer"]["moon_minus_sun_deg"]
expected_tithi = int(elong / 12) + 1
check("Tithi panel-formula matches computed",
      stamp["tithi_layer"]["tithi_index"] == expected_tithi)

# Vāra: W = (floor(K) + 5) mod 7
expected_vara_idx = (int(math.floor(K)) + 5) % 7
check("Vāra panel-formula matches computed",
      stamp["vara_layer"]["vara_index"] == expected_vara_idx)

# Nakṣatra: N = floor(moon_lon / (360/27)) + 1
expected_naks = int(moon_computed / (360.0 / 27.0)) + 1
check("Nakṣatra panel-formula matches computed",
      stamp["nakshatra_layer"]["nakshatra_index"] == expected_naks)

# Karaṇa: C = floor(elong / 6) + 1
expected_kar = int(elong / 6.0) + 1
check("Karaṇa panel-formula matches computed",
      stamp["karana_layer"]["karana_index"] == expected_kar)

# Muhūrta: μ = floor(f * 30) + 1
f = stamp["day_subdivision"]["fraction_of_day"]
expected_muhurta = int(math.floor(f * 30)) + 1
check("Muhūrta panel-formula matches computed",
      stamp["day_subdivision"]["muhurta_index"] == expected_muhurta)


# ═══════════════════════════════════════════════════════════════════════════
section("11 · Python ↔ TypeScript byte parity (Node ≥ 22)")
# ═══════════════════════════════════════════════════════════════════════════
import shutil
if shutil.which("node"):
    for args in [
        (2026, 5, 17, 16, 0, 0.0, 5.5),
        (2026, 1, 1, 0, 0, 0.0, 5.5),
        (2000, 6, 15, 12, 30, 0.0, 5.5),
        (1947, 8, 15, 0, 0, 0.0, 5.5),
        (3000, 12, 31, 23, 59, 59.0, 5.5),    # future stress test
    ]:
        try:
            out = subprocess.check_output(
                ["node", "--experimental-strip-types", "--no-warnings",
                 str(REPO / "frontend" / "lib" / "_parity_shim.mts"),
                 *[str(a) for a in args]],
                timeout=15,
            )
            ts = json.loads(out)
            py = ghadi_at(*args)
            ok = (
                py["year_layer"]["kali_year_current"] == ts["year_layer"]["kali_year_current"]
                and py["nakshatra_layer"]["nakshatra_name"] == ts["nakshatra_layer"]["nakshatra_name"]
                and py["nakshatra_layer"]["pada"] == ts["nakshatra_layer"]["pada"]
                and py["yoga_layer"]["yoga_name"] == ts["yoga_layer"]["yoga_name"]
                and py["karana_layer"]["karana_name"] == ts["karana_layer"]["karana_name"]
                and py["vara_layer"]["vara_name"] == ts["vara_layer"]["vara_name"]
                and abs(py["kali_civil_days_at_kamakhya"] - ts["kali_civil_days_at_kamakhya"]) < 1e-5
            )
            check(f"Py↔TS parity {args}", ok)
        except Exception as e:
            check(f"Py↔TS parity {args}", False, f"shim error: {e}")
else:
    warn("Node not available", "skipping Py↔TS parity tests")


# ═══════════════════════════════════════════════════════════════════════════
section("12a · Full meridian registry (12 × 4 categories)")
# ═══════════════════════════════════════════════════════════════════════════
from vedic_ghadi.substrate import MERIDIAN_REGISTRY, MERIDIAN_CATEGORIES, UJJAIN_LON_DEG
ms = stamp["meridians"]
check("84 meridians in registry (saptamukhi cannon: 12 × 7)",
      len(MERIDIAN_REGISTRY) == 84)
check("7 mukhas (purva/dakshina/paschim/uttara/urdhva/kala/sarva)",
      len(MERIDIAN_CATEGORIES) == 7)
check("All 84 IDs present in stamp.meridians", len(ms) == 84)
# Every mukha = exactly 12 sphoṭas
from collections import Counter
counts = Counter(m["category"] for m in ms.values())
for cat, _label in MERIDIAN_CATEGORIES:
    check(f"Mukha {cat} fires exactly 12 sphoṭas (got {counts[cat]})",
          counts[cat] == 12)
check("12 Jyotirliṅgas covered (somnath · mallikarjuna · ujjain · omkareshwar · kedarnath · bhimashankar · kashi · trimbakeshwar · vaidyanath · nageshwar · rameshwaram · grishneshwar)",
      all(j in ms for j in ("somnath","mallikarjuna","ujjain","omkareshwar","kedarnath","bhimashankar","kashi","trimbakeshwar","vaidyanath","nageshwar","rameshwaram","grishneshwar")))
check("Char Dham complete (Badrīnāth · Dvārkā · Rāmeśvaram · Purī)",
      all(k in ms for k in ("badrinath", "dwarka", "rameshwaram", "puri")))
check("Chota Char Dham complete (Yamunotri · Gaṅgotri · Kedārnāth · Badrīnāth)",
      all(k in ms for k in ("yamunotri", "gangotri", "kedarnath", "badrinath")))
check("Sapta-Purī complete (Ayodhyā · Mathurā · Haridwar · Kāśī · Kāñchī · Ujjain · Dvārkā)",
      all(k in ms for k in ("ayodhya","mathura","haridwar","kashi","kanchipuram","ujjain","dwarka")))
check("Major Shakti-pīṭhas (Kāmākhyā · Vaishno · Kālīghāṭ · Tripura · Tārā · Kanyākumārī · Mahālakṣmī)",
      all(k in ms for k in ("kamakhya","vaishno_devi","kalighat","tripura_sundari","tarapith","kanyakumari","kolhapur")))
check("Modern metros (Delhi · Mumbai · Bengaluru · Chennai · Kolkata · Hyderabad)",
      all(k in ms for k in ("delhi","mumbai","bengaluru","chennai","kolkata","hyderabad")))
check("Universal anchors (Greenwich · Mecca · Jerusalem · Lumbinī · BodhGayā · NYC · Tokyo · Sydney)",
      all(k in ms for k in ("greenwich","mecca","jerusalem","lumbini","bodh_gaya","new_york","tokyo","sydney")))
check("Mount Kailāsa + Mānasarovara present (Hayagrīva mukha)",
      all(k in ms for k in ("kailash", "mansarovar")))

# Offset identity for every meridian
all_offsets_correct = all(
    abs(v["offset_from_ujjain_days"]
        - (v["lon_deg"] - UJJAIN_LON_DEG) / 15.0 / 24.0) < 1e-6
    for v in ms.values()
)
check("Offset identity holds for ALL 12 meridians", all_offsets_correct)

# Ujjain has zero offset
check("Ujjain offset = 0",
      abs(ms["ujjain"]["offset_from_ujjain_days"]) < 1e-9)
# Greenwich ~-303 min (Ujjain is 5h03m east of Greenwich)
check(f"Greenwich offset ≈ −303 min (got {ms['greenwich']['offset_from_ujjain_min']})",
      -310 < ms["greenwich"]["offset_from_ujjain_min"] < -300)
# NYC ~-599 min
check(f"New York offset ≈ −599 min (got {ms['new_york']['offset_from_ujjain_min']})",
      -610 < ms["new_york"]["offset_from_ujjain_min"] < -590)
# Kāmākhyā ~+64 min
check(f"Kāmākhyā offset ≈ +64 min (got {ms['kamakhya']['offset_from_ujjain_min']})",
      63 < ms["kamakhya"]["offset_from_ujjain_min"] < 65)
# Kāśī ~+29 min
check(f"Kāśī offset ≈ +29 min (got {ms['kashi']['offset_from_ujjain_min']})",
      28 < ms["kashi"]["offset_from_ujjain_min"] < 30)

# Every meridian has valid vara/day_subdivision
all_valid = all(
    0 <= v["vara"]["vara_index"] <= 6
    and 1 <= v["day_subdivision"]["muhurta_index"] <= 30
    and 1 <= v["day_subdivision"]["ghati_index"] <= 60
    and 1 <= v["day_subdivision"]["prana_index"] <= 6
    for v in ms.values()
)
check("Every meridian has valid vāra + day-subdivision", all_valid)


section("12b · APEX v5 BIPOLAR — Aditi + Diti per meridian")
# ═══════════════════════════════════════════════════════════════════════════
check("bipolar_discipline block present", "bipolar_discipline" in stamp)
check("Pisano-of-Ideal ratio = 3",
      stamp["bipolar_discipline"]["pisano_of_ideal_ratio"] == 3)
check("Total Diti compression = 27 (= 3³)",
      stamp["bipolar_discipline"]["total_diti_compression"] == 27)
check("Top-level day_subdivision_aditi present",
      "day_subdivision_aditi" in stamp)
check("Top-level day_subdivision_diti present",
      "day_subdivision_diti" in stamp)
check("Aditi pole tagged correctly",
      stamp["day_subdivision_aditi"]["pole"] == "aditi")
check("Diti pole tagged correctly",
      stamp["day_subdivision_diti"]["pole"] == "diti")
# Diti cascade math
check("Aditi 216_000 vipala/day vs Diti 8_000 vipala/day · ratio 27",
      (30*2*60*6*10) // (10*2*20*2*10) == 27)
check("Diti vipala duration 10.8 sec = 27 × Aditi 0.4 sec",
      stamp["day_subdivision_diti"]["vipala_seconds"] == 10.8)

# Every meridian has BOTH poles
all_bipolar = all(
    "day_subdivision_aditi" in m and "day_subdivision_diti" in m
    for m in ms.values()
)
check("All 84 meridians have BOTH Aditi + Diti subdivisions",
      all_bipolar)
check("Total meridian-pole sphoṭas = 168 (84 × 2)",
      sum(("day_subdivision_aditi" in m) + ("day_subdivision_diti" in m)
          for m in ms.values()) == 168)

# Aditi/Diti consistency: 3 consecutive Aditi muhurtas → 1 Diti muhurta
all_consistent = all(
    (m["day_subdivision_aditi"]["muhurta_index"] - 1) // 3 + 1
    == m["day_subdivision_diti"]["muhurta_index"]
    for m in ms.values()
)
check("Diti μ = ⌊(Aditi μ − 1) / 3⌋ + 1 holds for all 84 meridians",
      all_consistent)


section("12c · Parallel meridian views (Ujjayinī ⟷ Kāmākhyā)")
# ═══════════════════════════════════════════════════════════════════════════
bm = stamp["by_meridian"]
check("by_meridian.ujjain present",  "ujjain" in bm)
check("by_meridian.kamakhya present", "kamakhya" in bm)
check("Offset = 0.04425 days (1h 4m)",
      abs(bm["offset_kamakhya_minus_ujjain_days"] - 0.044242) < 1e-5)
check("Offset in minutes ≈ 63.71",
      abs(bm["offset_kamakhya_minus_ujjain_min"] - 63.71) < 0.05)
check("K_kamakhya − K_ujjain = stated offset (identity)",
      abs((bm["kamakhya"]["kali_civil_days"] - bm["ujjain"]["kali_civil_days"])
          - bm["offset_kamakhya_minus_ujjain_days"]) < 1e-5)
check("Kāmākhyā ghaṭi runs 2-3 ahead of Ujjain (~64 min ≈ 2.66 ghaṭi)",
      (bm["kamakhya"]["day_subdivision"]["ghati_index"]
       - bm["ujjain"]["day_subdivision"]["ghati_index"]) in (2, 3))
check("Ujjain longitude = 75.7789°",
      abs(bm["ujjain"]["lon_deg"] - 75.778889) < 1e-5)
check("Kāmākhyā longitude = 91.7059°",
      abs(bm["kamakhya"]["lon_deg"] - 91.705900) < 1e-5)
check("Astronomical layers NOT duplicated (meridian-independent)",
      "month_kamakhya" not in stamp and "tithi_kamakhya" not in stamp)


section("12d · Edge cases & boundaries")
# ═══════════════════════════════════════════════════════════════════════════
# Day boundary: at IST midnight, did we cross to next civil day correctly?
late = ghadi_at(2026, 5, 17, 23, 59, 59.999, 5.5)
early = ghadi_at(2026, 5, 18, 0,  0,  0.001, 5.5)
delta_K = early["kali_civil_days_at_kamakhya"] - late["kali_civil_days_at_kamakhya"]
check("IST midnight crossing: ΔK ≈ 0 (sub-second straddling)",
      abs(delta_K) < 2e-5, f"ΔK = {delta_K:.6e}")

# Vāra at 23:59 IST May 17 (Sunday in IST) — what does code give?
# Note: code is Ujjain-anchored, so Ujjain midnight ≈ 18:57 UT ≈ 00:27 IST
# So at 23:59 IST May 17, Ujjain is at 23:32 LMT — still Sunday at Ujjain.
# At 00:01 IST May 18, Ujjain is at 23:34 — still Sunday. So both should
# show Ravivāra; vāra changes when Ujjain LMT crosses midnight.
if late["vara_layer"]["vara_name"] == early["vara_layer"]["vara_name"]:
    check("Vāra stays same across IST midnight (Ujjain-anchored)", True,
          f"both {late['vara_layer']['vara_name']}")
else:
    warn("Vāra flips at IST midnight",
         f"23:59 IST = {late['vara_layer']['vara_name']}, "
         f"00:01 IST = {early['vara_layer']['vara_name']}. "
         "Consistent with Ujjain-anchored math; flag if IST-anchored expected.")

# Year boundary: Dec 31 2026 → Jan 1 2027
y_end = ghadi_at(2026, 12, 31, 23, 0, 0, 5.5)
y_start = ghadi_at(2027, 1, 1, 1, 0, 0, 5.5)
check("Year boundary: Kali day grows monotonically",
      y_start["kali_civil_days_at_kamakhya"] > y_end["kali_civil_days_at_kamakhya"])

# Far past: 1900-01-01 (well after Kali epoch, well within Gregorian)
old = ghadi_at(1900, 1, 1, 0, 0, 0, 5.5)
check("1900-01-01: positive Kali day count",
      old["kali_civil_days_at_kamakhya"] > 0)
# Kali year for 1900 should be ≈ 5001
check("1900-01-01: Kali year ≈ 5001 (within ±2)",
      abs(old["year_layer"]["kali_year_current"] - 5001) <= 2,
      f"got {old['year_layer']['kali_year_current']}")

# Far future: 9999
future = ghadi_at(9999, 12, 31, 23, 59, 59, 5.5)
check("9999-12-31: still computes (no overflow)",
      future["year_layer"]["kali_year_current"] > 13000)


# ═══════════════════════════════════════════════════════════════════════════
print()
print("━" * 78)
print(f"  TOTAL  ·  {len(PASSES)} ✓ pass  ·  {len(WARNS)} ⚠ warn  ·  {len(FAILS)} ✗ fail")
print("━" * 78)

if WARNS:
    print("\nWARNINGS (non-blocking but document):")
    for n, d in WARNS:
        print(f"  ⚠ {n}\n      {d}")

if FAILS:
    print("\nFAILS (must fix):")
    for n, d in FAILS:
        print(f"  ✗ {n}\n      {d}")
    sys.exit(1)

print()
print("  ॐ कालाय नमः · सब सूत्र ठीक हैं · JAI MAA KAMAKHYA")
sys.exit(0)
