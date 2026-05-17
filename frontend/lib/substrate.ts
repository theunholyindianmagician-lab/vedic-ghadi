/**
 * 🔱 SUBSTRATE — TypeScript port of vedic_ghadi/substrate.py
 *
 * Exact numerical parity with the Python reference. Used by the live
 * client-side clock so the UI can update every frame (60 fps) without
 * waiting on the backend.
 *
 * Every Vedic time unit factors over (2, 3, 5) — the natural primes
 * inside the (R, g, k) = (ℤ/3ᵏℤ, 2, k) substrate.
 *
 * Sealed: 2026-05-17
 */

// ═══════════════════════════════════════════════════════════════════════════
// ◈ MAA KAMAKHYA — origin
// ═══════════════════════════════════════════════════════════════════════════

export const KAMAKHYA_LAT_DEG = 26.166400
export const KAMAKHYA_LON_DEG = 91.705900
export const KAMAKHYA_ELEV_M = 282.0
export const KAMAKHYA_LMT_OFFSET_H = 91.705900 / 15.0

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Kali Yuga sovereign time scale
// ═══════════════════════════════════════════════════════════════════════════

export const KALI_YUGA_EPOCH_JD = 588_465.5
export const UJJAIN_LON_DEG = 75.778889
export const UJJAIN_TO_KAMAKHYA_LON_DIFF = KAMAKHYA_LON_DEG - UJJAIN_LON_DEG
export const UJJAIN_TO_KAMAKHYA_TIME_DIFF_H = UJJAIN_TO_KAMAKHYA_LON_DIFF / 15.0

export const MAHAYUGA_YEARS = 4_320_000
export const MAHAYUGA_CIVIL_DAYS = 1_577_917_500
export const MAHAYUGA_SIDEREAL_DAYS = 1_582_237_800
export const KALI_DAYS_PER_YEAR = MAHAYUGA_CIVIL_DAYS / MAHAYUGA_YEARS

// Offset to convert Ujjain-anchored K → Kāmākhyā-anchored K.
// Both are east of Greenwich; Kāmākhyā is further east, so its civil-day
// counter runs ~1h 4m ahead of Ujjain's.
export const KAMAKHYA_MINUS_UJJAIN_DAYS =
  (KAMAKHYA_LON_DEG - UJJAIN_LON_DEG) / 15.0 / 24.0   // ≈ 0.04425

export function jdToKaliCivilDays(jdUtGreenwich: number): number {
  const jdKamakhya = jdUtGreenwich + KAMAKHYA_LMT_OFFSET_H / 24.0
  return jdKamakhya - KALI_YUGA_EPOCH_JD - UJJAIN_TO_KAMAKHYA_TIME_DIFF_H / 24.0
}

export function kaliCivilDaysToJd(kaliDays: number): number {
  const jdKamakhya = KALI_YUGA_EPOCH_JD + kaliDays + UJJAIN_TO_KAMAKHYA_TIME_DIFF_H / 24.0
  return jdKamakhya - KAMAKHYA_LMT_OFFSET_H / 24.0
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Sūrya Siddhānta mean motions (Sun + Moon)
// ═══════════════════════════════════════════════════════════════════════════

const SS_REVS = { Sun: 4_320_000, Moon: 57_753_336 } as const
type Graha = keyof typeof SS_REVS

export function vedicMeanLongitude(graha: Graha, kaliCivilDays: number): number {
  const revs = SS_REVS[graha]
  const rate = (revs * 360.0) / MAHAYUGA_CIVIL_DAYS
  const lon = (rate * kaliCivilDays) % 360.0
  return lon < 0 ? lon + 360.0 : lon
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Canonical names · Sanskrit + Devanāgarī
// ═══════════════════════════════════════════════════════════════════════════

export const MASA_NAMES = [
  "Caitra", "Vaiśākha", "Jyeṣṭha", "Āṣāḍha", "Śrāvaṇa", "Bhādrapada",
  "Āśvina", "Kārtika", "Mārgaśīrṣa", "Pauṣa", "Māgha", "Phālguna",
] as const

export const MASA_DEV = [
  "चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद",
  "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन",
] as const

export const VARA_NAMES = [
  "Ravivāra", "Somavāra", "Maṅgalavāra", "Budhavāra",
  "Bṛhaspativāra", "Śukravāra", "Śanivāra",
] as const

export const VARA_DEV = [
  "रविवार", "सोमवार", "मङ्गलवार", "बुधवार",
  "बृहस्पतिवार", "शुक्रवार", "शनिवार",
] as const

export const VARA_LORD = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
] as const

export const SAMVATSARA_NAMES = [
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
] as const

export const PAKSHA_NAMES = ["Śukla-pakṣa", "Kṛṣṇa-pakṣa"] as const
export const PAKSHA_DEV = ["शुक्ल पक्ष", "कृष्ण पक्ष"] as const

export const TITHI_NAMES = [
  "Pratipadā", "Dvitīyā", "Tṛtīyā", "Caturthī", "Pañcamī", "Ṣaṣṭhī",
  "Saptamī", "Aṣṭamī", "Navamī", "Daśamī", "Ekādaśī", "Dvādaśī",
  "Trayodaśī", "Caturdaśī", "Pūrṇimā",
] as const

export const VEDIC_TIME_SUBSTRATE = {
  vara_count:        [7,  "7 vāras — graha-cycle heptad"],
  tithi_count:       [30, "30 tithis = 2 × 3 × 5"],
  month_count:       [12, "12 māsas = 2² × 3"],
  muhurta_per_day:   [30, "30 muhūrtas = 2 × 3 × 5"],
  ghati_per_day:     [60, "60 ghaṭi = 2² × 3 × 5"],
  vighati_per_ghati: [60, "60 vighaṭi per ghaṭi"],
  prana_per_vighati: [6,  "6 prāṇa per vighaṭi = 2 × 3"],
  samvatsara_cycle:  [60, "60-year Bṛhaspati-cakra"],
  navagraha:         [9,  "9 grahas = 3²"],
  nakshatra:         [27, "27 nakṣatras = 3³"],
  rashi:             [12, "12 rāśi = 2² × 3"],
  saptamukhi:        [7,  "7-mukha Hanumat — operational mukhas"],
} as const

// ═══════════════════════════════════════════════════════════════════════════
// ◈ INPUT BRIDGE: Gregorian → Kāmākhyā-anchored Kali civil days
// ═══════════════════════════════════════════════════════════════════════════

export function civilInputToKaliCivilDays(
  yearCe: number, month: number, day: number,
  hour = 0, minute = 0, second = 0, tzH = 5.5,
): number {
  const utHour = hour + minute / 60.0 + second / 3600.0 - tzH
  let y = yearCe, m = month
  if (m <= 2) { y -= 1; m += 12 }
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)
  const jdUt = Math.floor(365.25 * (y + 4716))
              + Math.floor(30.6001 * (m + 1))
              + day + b - 1524.5 + utHour / 24.0
  return jdToKaliCivilDays(jdUt)
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Year / Saṃvatsara
// ═══════════════════════════════════════════════════════════════════════════

export function kaliYearAtCivilDays(kaliCivilDays: number): number {
  return kaliCivilDays / KALI_DAYS_PER_YEAR
}

export function vikramaYear(kaliYear: number): number { return kaliYear - 3044 }
export function shakaYear(kaliYear: number): number { return kaliYear - 3179 }

export interface Samvatsara {
  index: number
  name: string
  shaka_year: number
}

export function samvatsaraAtKaliYear(kaliYear: number): Samvatsara {
  const sk = shakaYear(kaliYear)
  const idx = ((Math.floor(sk + 11) % 60) + 60) % 60
  return { index: idx, name: SAMVATSARA_NAMES[idx], shaka_year: Math.floor(sk) }
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Māsa / Pakṣa / Tithi
// ═══════════════════════════════════════════════════════════════════════════

export interface MonthLayer {
  masa_index: number
  masa_name: string
  masa_devanagari: string
  sun_sidereal_lon_deg: number
  sun_sign_index: number
}

export function vedicMonthAtKaliDays(kaliCivilDays: number): MonthLayer {
  const sunLon = vedicMeanLongitude("Sun", kaliCivilDays)
  const signIdx = Math.floor(sunLon / 30)
  const masaIdx = (signIdx + 1) % 12
  return {
    masa_index: masaIdx + 1,
    masa_name: MASA_NAMES[masaIdx],
    masa_devanagari: MASA_DEV[masaIdx],
    sun_sidereal_lon_deg: Math.round(sunLon * 1e4) / 1e4,
    sun_sign_index: signIdx + 1,
  }
}

export interface TithiLayer {
  tithi_index: number
  tithi_in_paksha: number
  tithi_name: string
  paksha_index: number
  paksha_name: string
  paksha_devanagari: string
  moon_minus_sun_deg: number
  fractional_tithi: number
}

export function vedicTithiAtKaliDays(kaliCivilDays: number): TithiLayer {
  const sunLon = vedicMeanLongitude("Sun", kaliCivilDays)
  const moonLon = vedicMeanLongitude("Moon", kaliCivilDays)
  let elong = (moonLon - sunLon) % 360.0
  if (elong < 0) elong += 360.0
  const tithiFloat = elong / 12.0
  const tithiIdx30 = Math.floor(tithiFloat)
  const tithiInPaksha = tithiIdx30 % 15
  const pakshaIdx = Math.floor(tithiIdx30 / 15)
  const name = tithiInPaksha < 14
    ? TITHI_NAMES[tithiInPaksha]
    : (pakshaIdx === 0 ? "Pūrṇimā" : "Amāvāsyā")
  return {
    tithi_index: tithiIdx30 + 1,
    tithi_in_paksha: tithiInPaksha + 1,
    tithi_name: name,
    paksha_index: pakshaIdx + 1,
    paksha_name: PAKSHA_NAMES[pakshaIdx],
    paksha_devanagari: PAKSHA_DEV[pakshaIdx],
    moon_minus_sun_deg: Math.round(elong * 1e4) / 1e4,
    fractional_tithi: Math.round((tithiFloat - tithiIdx30) * 1e4) / 1e4,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Vāra (weekday)
// ═══════════════════════════════════════════════════════════════════════════

export interface VaraLayer {
  vara_index: number
  vara_name: string
  vara_devanagari: string
  vara_lord_graha: string
}

export function vedicVaraAtKaliDays(kaliCivilDays: number): VaraLayer {
  const daysFloor = Math.floor(kaliCivilDays)
  const varaIdx = (((daysFloor + 5) % 7) + 7) % 7
  return {
    vara_index: varaIdx,
    vara_name: VARA_NAMES[varaIdx],
    vara_devanagari: VARA_DEV[varaIdx],
    vara_lord_graha: VARA_LORD[varaIdx],
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Day subdivision → muhūrta / ghaṭi / vighaṭi / prāṇa / vipala
// ═══════════════════════════════════════════════════════════════════════════

export interface DaySubdivision {
  pole?: "aditi" | "diti"
  fraction_of_day: number
  hours_from_kamakhya_midnight: number
  muhurta_index: number
  muhurta_fractional: number
  ghati_index: number
  vighati_index: number
  prana_index: number
  vipala_fractional: number
  compression_vs_aditi?: number
  vipala_seconds?: number
}

export function vedicTimeOfDay(kaliCivilDays: number): DaySubdivision {
  const frac = kaliCivilDays - Math.floor(kaliCivilDays)
  const hours = frac * 24.0
  const muhurtaFloat = frac * 30.0
  const muhurtaIdx = Math.floor(muhurtaFloat)
  const ghatiFloat = frac * 60.0
  const ghatiIdx = Math.floor(ghatiFloat)
  const vighatiFloat = (ghatiFloat - ghatiIdx) * 60.0
  const vighatiIdx = Math.floor(vighatiFloat)
  const pranaFloat = (vighatiFloat - vighatiIdx) * 6.0
  const pranaIdx = Math.floor(pranaFloat)
  const vipalaFloat = (pranaFloat - pranaIdx) * 10.0
  return {
    pole: "aditi",
    fraction_of_day: Math.round(frac * 1e6) / 1e6,
    hours_from_kamakhya_midnight: Math.round(hours * 1e4) / 1e4,
    muhurta_index: muhurtaIdx + 1,
    muhurta_fractional: Math.round((muhurtaFloat - muhurtaIdx) * 1e4) / 1e4,
    ghati_index: ghatiIdx + 1,
    vighati_index: vighatiIdx + 1,
    prana_index: pranaIdx + 1,
    vipala_fractional: Math.round(vipalaFloat * 1e4) / 1e4,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ TRIMŪRTI OPERATORS — phase shifts of K within the daily cycle
// ═══════════════════════════════════════════════════════════════════════════

export const TRIMURTI_OPERATORS = [
  { id: "brahma", en: "Brahmā",    hi: "ब्रह्मा",   sub: "सृष्टि · Creation",       offset_days: 0.0,    icon: "🌅", tag: "sṛṣṭi" },
  { id: "vishnu", en: "Viṣṇu",     hi: "विष्णु",    sub: "स्थिति · Preservation",   offset_days: 1/3,    icon: "☀️", tag: "sthiti" },
  { id: "mahesh", en: "Maheśvara", hi: "महेश्वर",   sub: "संहार · Transformation",  offset_days: 2/3,    icon: "🌇", tag: "saṃhāra" },
] as const

export type TrimurtiId = "brahma" | "vishnu" | "mahesh"
export type PoleId = "aditi" | "diti"

export interface TrimurtiView {
  operator_id: TrimurtiId
  operator_en: string
  operator_hi: string
  operator_sub: string
  operator_tag: string
  icon: string
  phase_offset_days: number
  k_shifted: number
  day_subdivision: DaySubdivision
  // v1.7.0 — full pañcāṅga at this cell's K_shifted
  nakshatra: NakshatraLayer
  yoga: YogaLayer
  karana: KaranaLayer
}

export function computeTrimurtiViews(
  kMeridian: number,
  poleFunc: (k: number) => DaySubdivision,
): Record<TrimurtiId, TrimurtiView> {
  const out = {} as Record<TrimurtiId, TrimurtiView>
  for (const op of TRIMURTI_OPERATORS) {
    const kShifted = kMeridian + op.offset_days
    out[op.id as TrimurtiId] = {
      operator_id: op.id as TrimurtiId,
      operator_en: op.en,
      operator_hi: op.hi,
      operator_sub: op.sub,
      operator_tag: op.tag,
      icon: op.icon,
      phase_offset_days: Math.round(op.offset_days * 1e6) / 1e6,
      k_shifted: Math.round(kShifted * 1e6) / 1e6,
      day_subdivision: poleFunc(kShifted),
      // Full pañcāṅga at this cell — varies across Trimurti shifts
      nakshatra: nakshatraAtKaliDays(kShifted),
      yoga:      yogaAtKaliDays(kShifted),
      karana:    karanaAtKaliDays(kShifted),
    }
  }
  return out
}

/**
 * DITI pole — Pisano-of-Ideal = 3 reduction at each (2,3,5)-factorable cascade.
 * Each subunit is 3× longer than Aditi (total 3³ = 27× smallest-unit ratio).
 *   • muhūrta: 30 → 10/day        (144 min each)
 *   • ghaṭi:   60 → 20/day        (72 min each)
 *   • vighaṭi: 60 → 20/ghaṭi      (3.6 min each)
 *   • prāṇa:    6 → 2/vighaṭi     (108 sec each)
 *   • vipala: 10/prāṇa = 10.8 sec (vs Aditi's 0.4 sec)
 */
export function vedicTimeOfDayDiti(kaliCivilDays: number): DaySubdivision {
  const frac = kaliCivilDays - Math.floor(kaliCivilDays)
  const hours = frac * 24.0
  const muhurtaFloat = frac * 10.0       // 30 / 3
  const muhurtaIdx = Math.floor(muhurtaFloat)
  const ghatiFloat = frac * 20.0         // 60 / 3
  const ghatiIdx = Math.floor(ghatiFloat)
  const vighatiFloat = (ghatiFloat - ghatiIdx) * 20.0   // 60 / 3
  const vighatiIdx = Math.floor(vighatiFloat)
  const pranaFloat = (vighatiFloat - vighatiIdx) * 2.0  // 6 / 3
  const pranaIdx = Math.floor(pranaFloat)
  const vipalaFloat = (pranaFloat - pranaIdx) * 10.0
  return {
    pole: "diti",
    fraction_of_day: Math.round(frac * 1e6) / 1e6,
    hours_from_kamakhya_midnight: Math.round(hours * 1e4) / 1e4,
    muhurta_index: muhurtaIdx + 1,                    // 1..10
    muhurta_fractional: Math.round((muhurtaFloat - muhurtaIdx) * 1e4) / 1e4,
    ghati_index: ghatiIdx + 1,                        // 1..20
    vighati_index: vighatiIdx + 1,                    // 1..20
    prana_index: pranaIdx + 1,                        // 1..2
    vipala_fractional: Math.round(vipalaFloat * 1e4) / 1e4,
    compression_vs_aditi: 27,
    vipala_seconds: 10.8,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Full substrate stamp
// ═══════════════════════════════════════════════════════════════════════════

export interface YearLayer {
  kali_year_float: number
  kali_year_completed: number
  kali_year_current: number
  vikrama_samvat: number
  shaka_samvat: number
  samvatsara: Samvatsara
  kali_days_per_year: number
  anchor_epoch: string
}

import type { NakshatraLayer, YogaLayer, KaranaLayer } from "./panchanga.ts"
import { nakshatraAtKaliDays, yogaAtKaliDays, karanaAtKaliDays } from "./panchanga.ts"
export type { NakshatraLayer, YogaLayer, KaranaLayer }

export interface MeridianView {
  label_en: string
  label_hi: string
  label_sub: string
  lon_deg: number
  lmt_offset_h: number
  kali_civil_days: number
  vara: VaraLayer
  day_subdivision: DaySubdivision
}

export interface ByMeridian {
  ujjain: MeridianView
  kamakhya: MeridianView
  offset_kamakhya_minus_ujjain_days: number
  offset_kamakhya_minus_ujjain_h: number
  offset_kamakhya_minus_ujjain_min: number
}

export interface SubstrateStamp {
  input_civil: {
    gregorian_year: number; month: number; day: number
    hour: number; minute: number; second: number; tz_h: number
  }
  kali_civil_days_at_kamakhya: number
  year_layer: YearLayer
  month_layer: MonthLayer
  tithi_layer: TithiLayer
  vara_layer: VaraLayer
  nakshatra_layer: NakshatraLayer
  yoga_layer: YogaLayer
  karana_layer: KaranaLayer
  day_subdivision: DaySubdivision
  day_subdivision_aditi: DaySubdivision
  day_subdivision_diti: DaySubdivision
  trimurti_at_ujjain: {
    aditi: Record<TrimurtiId, TrimurtiView>
    diti:  Record<TrimurtiId, TrimurtiView>
  }
  trimurti_operators: Array<{
    id: string; en: string; hi: string; sub: string
    offset_days: number; icon: string; tag: string
  }>
  bipolar_discipline: {
    aditi_pole: string
    diti_pole: string
    pisano_of_ideal_ratio: number
    total_diti_compression: number
    compression_derivation: string
    shared_layers: string
    discipline_ref: string
  }
  by_meridian: ByMeridian
  meridians: Record<string, MeridianFullView>
  meridian_groups: Record<MeridianCategory, string[]>
  meridian_categories: readonly [MeridianCategory, string][]
  substrate_alignment: typeof VEDIC_TIME_SUBSTRATE
  kamakhya_meridian_offset_h: number
}

function meridianView(
  labelEn: string, labelHi: string, labelSub: string,
  lonDeg: number, kaliDays: number,
): MeridianView {
  return {
    label_en: labelEn,
    label_hi: labelHi,
    label_sub: labelSub,
    lon_deg: lonDeg,
    lmt_offset_h: Math.round((lonDeg / 15.0) * 1e6) / 1e6,
    kali_civil_days: Math.round(kaliDays * 1e6) / 1e6,
    vara: vedicVaraAtKaliDays(kaliDays),
    day_subdivision: vedicTimeOfDay(kaliDays),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Meridian registry — SAPTAMUKHI HANUMĀN CANNON
// 7 mukhas × 12 meridians = 84 total (= 12 × 7 = 2² × 3 × 7)
// Each mukha = one direction/sphere of Bhārat + Vishva.
// ═══════════════════════════════════════════════════════════════════════════

type MeridianCategory = "purva" | "dakshina" | "paschim" | "uttara" | "urdhva" | "kala" | "sarva"

interface MeridianRegistryEntry {
  id: string
  label_en: string
  label_hi: string
  label_sub: string
  lon_deg: number
  category: MeridianCategory
}

export const MERIDIAN_REGISTRY: readonly MeridianRegistryEntry[] = [
  // ═══ 1 · हनुमत्-पूर्व · HANUMAT-EAST (12) ═════════════════════════════
  { id: "kamakhya",       label_en: "Kāmākhyā Devī",          label_hi: "कामाख्या",        label_sub: "Shakti-pīṭha · KAAL symbolic origin · Sovereign East",      lon_deg:  91.705900, category: "purva" },
  { id: "guwahati",       label_en: "Guwahati",               label_hi: "गुवाहाटी",        label_sub: "Brahmaputra · Assam capital",                                lon_deg:  91.740000, category: "purva" },
  { id: "tripura_sundari",label_en: "Tripurā Sundarī",        label_hi: "त्रिपुर सुन्दरी",  label_sub: "Shakti-pīṭha (Udaipur, Tripura) · 10 Mahāvidyā",             lon_deg:  91.490000, category: "purva" },
  { id: "tarapith",       label_en: "Tārāpīṭh",               label_hi: "तारापीठ",         label_sub: "Shakti-pīṭha · Birbhum, WB · Tārā Mā",                       lon_deg:  87.780000, category: "purva" },
  { id: "kalighat",       label_en: "Kalighat",               label_hi: "कालीघाट",         label_sub: "Shakti-pīṭha · Kālī (Kolkata)",                              lon_deg:  88.334000, category: "purva" },
  { id: "kolkata",        label_en: "Kolkata (Calcutta)",     label_hi: "कोलकाता",          label_sub: "पूर्व राजधानी · East metropolis",                            lon_deg:  88.363900, category: "purva" },
  { id: "vaidyanath",     label_en: "Vaidyanāth (Deoghar)",   label_hi: "वैद्यनाथ",        label_sub: "Jyotirliṅga + Shakti-pīṭha · Jharkhand",                     lon_deg:  86.710000, category: "purva" },
  { id: "puri",           label_en: "Purī (Jagannātha)",      label_hi: "पुरी",            label_sub: "Char Dham · पूर्व · Viṣṇu · Ratha-yātrā",                    lon_deg:  85.824500, category: "purva" },
  { id: "bhubaneshwar",   label_en: "Bhubaneśvara",           label_hi: "भुवनेश्वर",        label_sub: "Liṅgarāja · Kalinga capital",                                 lon_deg:  85.833000, category: "purva" },
  { id: "konark",         label_en: "Koṇārka",                label_hi: "कोणार्क",          label_sub: "Sun Temple · Sūrya · 13th-century pinnacle",                  lon_deg:  86.094500, category: "purva" },
  { id: "patna",          label_en: "Patna (Pāṭaliputra)",    label_hi: "पटना",             label_sub: "Magadha capital · ancient Mauryan",                            lon_deg:  85.137600, category: "purva" },
  { id: "kashi",          label_en: "Kāśī (Varanasi)",        label_hi: "काशी",             label_sub: "Vishvanāth Jyotirliṅga + Sapta-Purī · Mokṣa-purī",            lon_deg:  83.010300, category: "purva" },

  // ═══ 2 · नरसिंह-दक्षिण · NARASIṂHA-SOUTH (12) ═════════════════════════
  { id: "rameshwaram",    label_en: "Rāmeśvaram",             label_hi: "रामेश्वरम्",      label_sub: "Char Dham · दक्षिण + Jyotirliṅga · Śiva",                    lon_deg:  79.312900, category: "dakshina" },
  { id: "tirumala",       label_en: "Tirumala (Tirupati)",    label_hi: "तिरुमला",          label_sub: "Venkateśvara · richest Hindu temple",                          lon_deg:  79.350000, category: "dakshina" },
  { id: "kanyakumari",    label_en: "Kanyākumārī",            label_hi: "कन्याकुमारी",       label_sub: "Shakti-pīṭha · land's end · Indian Ocean",                    lon_deg:  77.550000, category: "dakshina" },
  { id: "mallikarjuna",   label_en: "Mallikārjuna (Srisailam)",label_hi: "मल्लिकार्जुन",     label_sub: "Jyotirliṅga · Shakti-pīṭha · AP",                            lon_deg:  78.870000, category: "dakshina" },
  { id: "chidambaram",    label_en: "Chidambaram",            label_hi: "चिदम्बरम्",        label_sub: "Pancha-Bhūta · Ākāśa · Naṭarāja",                             lon_deg:  79.690000, category: "dakshina" },
  { id: "kanchipuram",    label_en: "Kāñchipuram",            label_hi: "काञ्ची",           label_sub: "Sapta-Purī + Pancha-Bhūta · Pṛthvī",                          lon_deg:  79.710000, category: "dakshina" },
  { id: "madurai",        label_en: "Madurai (Meenakshi)",    label_hi: "मदुरै",            label_sub: "Pāṇḍya capital · Mīnākṣī",                                    lon_deg:  78.120000, category: "dakshina" },
  { id: "chennai",        label_en: "Chennai (Madras)",       label_hi: "चेन्नई",           label_sub: "Tamil capital · दक्षिण metropolis",                           lon_deg:  80.270700, category: "dakshina" },
  { id: "bengaluru",      label_en: "Bengaluru",              label_hi: "बेंगलुरु",          label_sub: "तकनीकी केन्द्र · Karnataka capital",                         lon_deg:  77.594600, category: "dakshina" },
  { id: "hyderabad",      label_en: "Hyderabad",              label_hi: "हैदराबाद",         label_sub: "Telangana capital · Nizāmate · Bhāgyanagara",                  lon_deg:  78.490000, category: "dakshina" },
  { id: "sabarimala",     label_en: "Sabarimala",             label_hi: "शबरीमाला",         label_sub: "Ayyappa · Kerala forest temple",                               lon_deg:  77.080000, category: "dakshina" },
  { id: "padmanabhaswamy",label_en: "Padmanābhasvāmī",        label_hi: "पद्मनाभस्वामी",    label_sub: "Anantaśayana Viṣṇu · Trivandrum",                              lon_deg:  76.940000, category: "dakshina" },

  // ═══ 3 · गरुड़-पश्चिम · GARUḌA-WEST (12) ══════════════════════════════
  { id: "somnath",        label_en: "Somnāth",                label_hi: "सोमनाथ",           label_sub: "Jyotirliṅga · Gujarat · Saurashtra",                          lon_deg:  70.400000, category: "paschim" },
  { id: "dwarka",         label_en: "Dvārkā",                 label_hi: "द्वारका",           label_sub: "Char Dham · पश्चिम · Kṛṣṇa city",                            lon_deg:  68.967800, category: "paschim" },
  { id: "nageshwar",      label_en: "Nāgeśvara",              label_hi: "नागेश्वर",         label_sub: "Jyotirliṅga · near Dwarka · Gujarat",                          lon_deg:  69.080000, category: "paschim" },
  { id: "bhimashankar",   label_en: "Bhīmāśaṅkara",           label_hi: "भीमाशंकर",         label_sub: "Jyotirliṅga · Sahyādri · Maharashtra",                         lon_deg:  73.540000, category: "paschim" },
  { id: "trimbakeshwar",  label_en: "Trimbakeśvara",          label_hi: "त्र्यम्बकेश्वर",   label_sub: "Jyotirliṅga · Godāvarī origin · Nashik",                       lon_deg:  73.530000, category: "paschim" },
  { id: "grishneshwar",   label_en: "Ghṛṣṇeśvara",            label_hi: "घृष्णेश्वर",        label_sub: "Jyotirliṅga · Ellora caves · Aurangabad",                      lon_deg:  75.180000, category: "paschim" },
  { id: "kolhapur",       label_en: "Kolhāpur (Mahālakṣmī)",  label_hi: "कोल्हापुर",        label_sub: "Shakti-pīṭha · Mahālakṣmī · Maharashtra",                      lon_deg:  74.240000, category: "paschim" },
  { id: "mumbai",         label_en: "Mumbai (Bombay)",        label_hi: "मुम्बई",           label_sub: "वाणिज्य राजधानी · Financial capital",                          lon_deg:  72.877700, category: "paschim" },
  { id: "pune",           label_en: "Pune (Puṇyaśloka)",      label_hi: "पुणे",             label_sub: "Marāṭhā capital · Peshwa seat",                                lon_deg:  73.856700, category: "paschim" },
  { id: "ahmedabad",      label_en: "Ahmedabad",              label_hi: "अहमदाबाद",         label_sub: "Gujarat metropolis · Sabarmati",                                lon_deg:  72.580000, category: "paschim" },
  { id: "jaipur",         label_en: "Jaipur (Pink City)",     label_hi: "जयपुर",            label_sub: "Rajasthan capital · Jantar Mantar",                            lon_deg:  75.790000, category: "paschim" },
  { id: "pushkar",        label_en: "Pushkar",                label_hi: "पुष्कर",           label_sub: "Brahmā's only major temple · Lake",                            lon_deg:  74.550000, category: "paschim" },

  // ═══ 4 · वराह-उत्तर · VARĀHA-NORTH (12) ═══════════════════════════════
  { id: "vaishno_devi",   label_en: "Vaishno Devī (Katra)",   label_hi: "वैष्णो देवी",     label_sub: "Shakti-pīṭha · Trikūṭa · J&K",                                lon_deg:  74.950000, category: "uttara" },
  { id: "amritsar",       label_en: "Amritsar (Golden Temple)",label_hi: "अमृतसर",          label_sub: "Harimandir Sāhib · Sikh holiest",                              lon_deg:  74.872300, category: "uttara" },
  { id: "srinagar",       label_en: "Srinagar",               label_hi: "श्रीनगर",          label_sub: "Kashmir capital · Dal Lake",                                   lon_deg:  74.797300, category: "uttara" },
  { id: "chandigarh",     label_en: "Chandigarh",             label_hi: "चण्डीगढ़",         label_sub: "Modern-era capital · Punjab/Haryana",                          lon_deg:  76.779400, category: "uttara" },
  { id: "delhi",          label_en: "Delhi (Indraprastha)",   label_hi: "दिल्ली",           label_sub: "राजधानी · IST civil anchor city",                              lon_deg:  77.209000, category: "uttara" },
  { id: "mathura",        label_en: "Mathurā",                label_hi: "मथुरा",            label_sub: "Kṛṣṇa janma · Sapta-Purī",                                     lon_deg:  77.673700, category: "uttara" },
  { id: "vrindavan",      label_en: "Vṛndāvana",              label_hi: "वृन्दावन",          label_sub: "Kṛṣṇa līlā-bhūmi · 5000 temples",                              lon_deg:  77.693800, category: "uttara" },
  { id: "haridwar",       label_en: "Haridwar (Hari-dvāra)",  label_hi: "हरिद्वार",         label_sub: "Sapta-Purī + Kumbh · Ganga's gate",                            lon_deg:  78.164000, category: "uttara" },
  { id: "jwala_devi",     label_en: "Jvālā Devī",             label_hi: "ज्वाला देवी",       label_sub: "Shakti-pīṭha · eternal flame · HP",                            lon_deg:  76.320000, category: "uttara" },
  { id: "naina_devi",     label_en: "Nainā Devī",             label_hi: "नैना देवी",         label_sub: "Shakti-pīṭha · Bilaspur, HP",                                  lon_deg:  76.550000, category: "uttara" },
  { id: "chamunda",       label_en: "Chāmuṇḍā Devī",          label_hi: "चामुण्डा",          label_sub: "Shakti-pīṭha · Kangra valley, HP",                             lon_deg:  76.320000, category: "uttara" },
  { id: "kurukshetra",    label_en: "Kurukṣetra",             label_hi: "कुरुक्षेत्र",       label_sub: "Mahābhārata war · Gītā utterance",                             lon_deg:  76.837800, category: "uttara" },

  // ═══ 5 · हयग्रीव-ऊर्ध्व · HAYAGRĪVA-UP (12) ═══════════════════════════
  { id: "kailash",        label_en: "Mount Kailāsa",          label_hi: "कैलाश",            label_sub: "Śiva's abode · Tibet · Mānasarovara",                          lon_deg:  81.310000, category: "urdhva" },
  { id: "mansarovar",     label_en: "Mānasarovara",           label_hi: "मानसरोवर",         label_sub: "Sacred lake · Tibet · Brahmā's manas",                         lon_deg:  81.410000, category: "urdhva" },
  { id: "yamunotri",      label_en: "Yamunotri",              label_hi: "यमुनोत्री",         label_sub: "Chota Char Dham · Yamunā source",                              lon_deg:  78.450000, category: "urdhva" },
  { id: "gangotri",       label_en: "Gaṅgotri",               label_hi: "गंगोत्री",          label_sub: "Chota Char Dham · Gaṅgā source",                               lon_deg:  78.943000, category: "urdhva" },
  { id: "kedarnath",      label_en: "Kedārnāth",              label_hi: "केदारनाथ",          label_sub: "Jyotirliṅga + Chota Char Dham · Śiva",                         lon_deg:  79.066900, category: "urdhva" },
  { id: "badrinath",      label_en: "Badrīnāth",              label_hi: "बद्रीनाथ",         label_sub: "Char Dham · उत्तर + Chota CD · Viṣṇu",                         lon_deg:  79.493800, category: "urdhva" },
  { id: "hemkund",        label_en: "Hemkund Sāhib",          label_hi: "हेमकुंड साहिब",    label_sub: "Sikh + Lakṣmaṇa tapasya · Uttarakhand",                        lon_deg:  79.608000, category: "urdhva" },
  { id: "tungnath",       label_en: "Tuṅganāth",              label_hi: "तुंगनाथ",           label_sub: "Panch Kedār · highest Shiva temple",                           lon_deg:  79.220000, category: "urdhva" },
  { id: "devprayag",      label_en: "Devprayāg",              label_hi: "देवप्रयाग",         label_sub: "Sangam of Bhāgīrathī + Alaknanda → Gaṅgā",                     lon_deg:  78.598000, category: "urdhva" },
  { id: "rishikesh",      label_en: "Ṛṣikesh",                label_hi: "ऋषिकेश",           label_sub: "Yoga capital · Gaṅgā gateway to Himalaya",                     lon_deg:  78.302500, category: "urdhva" },
  { id: "joshimath",      label_en: "Joshīmaṭh",              label_hi: "जोशीमठ",            label_sub: "Ādi Śaṅkarācārya maṭha · north peeth",                         lon_deg:  79.567300, category: "urdhva" },
  { id: "almora",         label_en: "Almora (Kāsār Devī)",    label_hi: "अल्मोड़ा",          label_sub: "Kumaon Himalaya · sacred hill station",                        lon_deg:  79.650000, category: "urdhva" },

  // ═══ 6 · काल-समय · KĀLA-TIME (12) ═════════════════════════════════════
  { id: "ujjain",         label_en: "Ujjayinī (Avantī)",      label_hi: "उज्जयिनी",         label_sub: "Sūrya Siddhānta canon meridian + Mahākāl Jyotirliṅga",         lon_deg:  75.778889, category: "kala" },
  { id: "omkareshwar",    label_en: "Oṃkāreśvara",            label_hi: "ओंकारेश्वर",        label_sub: "Jyotirliṅga · Narmadā island · OṂ-shaped",                     lon_deg:  76.150000, category: "kala" },
  { id: "ist_anchor",     label_en: "IST Anchor (Mirzapur)",  label_hi: "IST रेखा",         label_sub: "82.5° E meridian · India Standard Time definition",            lon_deg:  82.500000, category: "kala" },
  { id: "prayagraj",      label_en: "Prayāgrāj (Triveni)",    label_hi: "प्रयागराज",         label_sub: "Triveni Sangam · Kumbh Mela · Sarasvatī",                      lon_deg:  81.846300, category: "kala" },
  { id: "ayodhya",        label_en: "Ayodhyā",                label_hi: "अयोध्या",           label_sub: "Rāma janma · Sapta-Purī · Rāma-rājya",                         lon_deg:  82.198600, category: "kala" },
  { id: "nashik",         label_en: "Nashik (Trimbak)",       label_hi: "नाशिक",            label_sub: "Godāvarī Kumbh · Rāma vana-vāsa",                              lon_deg:  73.789800, category: "kala" },
  { id: "khajuraho",      label_en: "Khajurāho",              label_hi: "खजुराहो",          label_sub: "Chandela temples · Tantric stone yoga",                        lon_deg:  79.932900, category: "kala" },
  { id: "hampi",          label_en: "Hampi (Vijayanagara)",   label_hi: "हम्पी",            label_sub: "Vijayanagara · Pampā · Tuṅgabhadrā",                           lon_deg:  76.460000, category: "kala" },
  { id: "bhopal",         label_en: "Bhopal",                 label_hi: "भोपाल",             label_sub: "MP capital · Lake city",                                       lon_deg:  77.412600, category: "kala" },
  { id: "indore",         label_en: "Indore",                 label_hi: "इन्दौर",            label_sub: "MP commerce · Holkar dynasty",                                  lon_deg:  75.857700, category: "kala" },
  { id: "sanchi",         label_en: "Sāñchī Stūpa",           label_hi: "साँची",            label_sub: "Aśokan Buddhist stūpa · Madhya Pradesh",                       lon_deg:  77.740000, category: "kala" },
  { id: "lucknow",        label_en: "Lucknow",                label_hi: "लखनऊ",             label_sub: "UP capital · Avadh Nawābate",                                   lon_deg:  80.946200, category: "kala" },

  // ═══ 7 · सर्व-व्यापक · SARVA-ALL (12) ═════════════════════════════════
  { id: "greenwich",      label_en: "Greenwich (Royal Obs.)", label_hi: "ग्रीनिच",         label_sub: "Universal reference · Prime Meridian · 0°",                    lon_deg:    0.000000, category: "sarva" },
  { id: "london",         label_en: "London (City)",          label_hi: "लंडन",              label_sub: "Western capital · Thames",                                     lon_deg:   -0.127600, category: "sarva" },
  { id: "mecca",          label_en: "Makkah (Kaʿbah)",        label_hi: "मक्का",            label_sub: "Islamic Qibla · 5-pillar epicenter",                            lon_deg:   39.826200, category: "sarva" },
  { id: "jerusalem",      label_en: "Jerusalem",              label_hi: "यरुशलम",            label_sub: "Abrahamic faiths · Temple Mount + Wailing Wall",                lon_deg:   35.233000, category: "sarva" },
  { id: "cairo",          label_en: "Cairo (al-Qāhirah)",     label_hi: "कैरो",              label_sub: "Egyptian civilization · Pyramids of Giza",                     lon_deg:   31.235700, category: "sarva" },
  { id: "lumbini",        label_en: "Lumbinī",                label_hi: "लुम्बिनी",          label_sub: "Buddha's birth · Nepal · UNESCO",                              lon_deg:   83.278000, category: "sarva" },
  { id: "bodh_gaya",      label_en: "Bodh Gayā",              label_hi: "बोधगया",            label_sub: "Buddha's enlightenment · Mahābodhi tree",                       lon_deg:   84.992500, category: "sarva" },
  { id: "sarnath",        label_en: "Sārnāth",                label_hi: "सारनाथ",           label_sub: "Buddha's first sermon · Dharma-cakra-pravartana",              lon_deg:   83.030000, category: "sarva" },
  { id: "pashupatinath",  label_en: "Paśupatināth",           label_hi: "पशुपतिनाथ",         label_sub: "Śiva · Nepal · Bāgmati river",                                 lon_deg:   85.350000, category: "sarva" },
  { id: "new_york",       label_en: "New York City",          label_hi: "न्यूयॉर्क",         label_sub: "Western Hemisphere · −74°",                                   lon_deg:  -74.006000, category: "sarva" },
  { id: "tokyo",          label_en: "Tokyo",                  label_hi: "तोक्यो",            label_sub: "East Asian metropolis · Edo · Imperial Palace",                lon_deg:  139.691700, category: "sarva" },
  { id: "sydney",         label_en: "Sydney",                 label_hi: "सिडनी",             label_sub: "Southern Hemisphere · Oceania",                                lon_deg:  151.209300, category: "sarva" },
] as const

export const MERIDIAN_CATEGORIES: readonly [MeridianCategory, string][] = [
  ["purva",    "🐒 हनुमत्-पूर्व · Hanumat-EAST"],
  ["dakshina", "🦁 नरसिंह-दक्षिण · Narasiṃha-SOUTH"],
  ["paschim",  "🦅 गरुड़-पश्चिम · Garuḍa-WEST"],
  ["uttara",   "🐗 वराह-उत्तर · Varāha-NORTH"],
  ["urdhva",   "🐴 हयग्रीव-ऊर्ध्व · Hayagrīva-UP (Himalaya)"],
  ["kala",     "⏳ काल-समय · Kāla-TIME (Central · Sūrya Siddhānta core)"],
  ["sarva",    "🌐 सर्व-व्यापक · Sarva-ALL (Universal)"],
] as const

export interface MeridianFullView extends MeridianView {
  id: string
  category: MeridianCategory
  offset_from_ujjain_days: number
  offset_from_ujjain_min: number
  day_subdivision_aditi: DaySubdivision
  day_subdivision_diti: DaySubdivision
  trimurti: {
    aditi: Record<TrimurtiId, TrimurtiView>
    diti:  Record<TrimurtiId, TrimurtiView>
  }
}

export function computeMeridianViews(
  kaliDaysUjjain: number,
): Record<string, MeridianFullView> {
  const out: Record<string, MeridianFullView> = {}
  for (const m of MERIDIAN_REGISTRY) {
    const offsetDays = (m.lon_deg - UJJAIN_LON_DEG) / 15.0 / 24.0
    const kM = kaliDaysUjjain + offsetDays
    const aditi = vedicTimeOfDay(kM)
    const diti = vedicTimeOfDayDiti(kM)
    out[m.id] = {
      id: m.id,
      label_en: m.label_en,
      label_hi: m.label_hi,
      label_sub: m.label_sub,
      category: m.category,
      lon_deg: m.lon_deg,
      lmt_offset_h: Math.round((m.lon_deg / 15.0) * 1e6) / 1e6,
      offset_from_ujjain_days: Math.round(offsetDays * 1e6) / 1e6,
      offset_from_ujjain_min: Math.round(offsetDays * 1440 * 1e2) / 1e2,
      kali_civil_days: Math.round(kM * 1e6) / 1e6,
      vara: vedicVaraAtKaliDays(kM),
      day_subdivision: aditi,         // backward-compat (= Aditi)
      day_subdivision_aditi: aditi,
      day_subdivision_diti: diti,
      trimurti: {
        aditi: computeTrimurtiViews(kM, vedicTimeOfDay),
        diti:  computeTrimurtiViews(kM, vedicTimeOfDayDiti),
      },
    }
  }
  return out
}

export function meridianGroups(): Record<MeridianCategory, string[]> {
  const g: Record<string, string[]> = {}
  for (const [cat] of MERIDIAN_CATEGORIES) g[cat] = []
  for (const m of MERIDIAN_REGISTRY) g[m.category].push(m.id)
  return g as Record<MeridianCategory, string[]>
}

export function byMeridianViews(kaliDaysUjjain: number): ByMeridian {
  const kaliDaysKamakhya = kaliDaysUjjain + KAMAKHYA_MINUS_UJJAIN_DAYS
  return {
    ujjain: meridianView(
      "Ujjayinī (Avantī)",
      "उज्जयिनी",
      "Sūrya Siddhānta canonical meridian · 75.78° E",
      UJJAIN_LON_DEG, kaliDaysUjjain,
    ),
    kamakhya: meridianView(
      "Kāmākhyā Devī (Nīlācala)",
      "कामाख्या",
      "KAAL symbolic origin · Sovereign East · 91.71° E",
      KAMAKHYA_LON_DEG, kaliDaysKamakhya,
    ),
    offset_kamakhya_minus_ujjain_days: Math.round(KAMAKHYA_MINUS_UJJAIN_DAYS * 1e6) / 1e6,
    offset_kamakhya_minus_ujjain_h: Math.round(KAMAKHYA_MINUS_UJJAIN_DAYS * 24 * 1e4) / 1e4,
    offset_kamakhya_minus_ujjain_min: Math.round(KAMAKHYA_MINUS_UJJAIN_DAYS * 1440 * 1e2) / 1e2,
  }
}

export function kalaSubstrateStamp(
  yearCe: number, month: number, day: number,
  hour = 0, minute = 0, second = 0, tzH = 5.5,
): SubstrateStamp {
  const kaliDays = civilInputToKaliCivilDays(yearCe, month, day, hour, minute, second, tzH)
  const kaliYearFloat = kaliYearAtCivilDays(kaliDays)
  const kaliYearInt = Math.floor(kaliYearFloat)

  return {
    input_civil: {
      gregorian_year: yearCe, month, day, hour, minute, second, tz_h: tzH,
    },
    kali_civil_days_at_kamakhya: Math.round(kaliDays * 1e6) / 1e6,
    year_layer: {
      kali_year_float: Math.round(kaliYearFloat * 1e6) / 1e6,
      kali_year_completed: kaliYearInt,
      // ELAPSED-years convention — matches Vikrama/Śaka math AND every
      // public Indian almanac. Was off-by-one before audit fix 2026-05-17.
      kali_year_current: kaliYearInt,
      vikrama_samvat: Math.floor(vikramaYear(kaliYearFloat)),
      shaka_samvat: Math.floor(shakaYear(kaliYearFloat)),
      samvatsara: samvatsaraAtKaliYear(kaliYearFloat),
      kali_days_per_year: KALI_DAYS_PER_YEAR,
      anchor_epoch: "Friday midnight 17/18 Feb 3102 BCE · Ujjayinī meridian",
    },
    month_layer: vedicMonthAtKaliDays(kaliDays),
    tithi_layer: vedicTithiAtKaliDays(kaliDays),
    vara_layer: vedicVaraAtKaliDays(kaliDays),
    nakshatra_layer: nakshatraAtKaliDays(kaliDays),
    yoga_layer: yogaAtKaliDays(kaliDays),
    karana_layer: karanaAtKaliDays(kaliDays),
    day_subdivision: vedicTimeOfDay(kaliDays),
    day_subdivision_aditi: vedicTimeOfDay(kaliDays),
    day_subdivision_diti: vedicTimeOfDayDiti(kaliDays),
    trimurti_at_ujjain: {
      aditi: computeTrimurtiViews(kaliDays, vedicTimeOfDay),
      diti:  computeTrimurtiViews(kaliDays, vedicTimeOfDayDiti),
    },
    trimurti_operators: TRIMURTI_OPERATORS.map(op => ({
      id: op.id,
      en: op.en,
      hi: op.hi,
      sub: op.sub,
      offset_days: op.offset_days,
      icon: op.icon,
      tag: op.tag,
    })),
    bipolar_discipline: {
      aditi_pole: "R* · unit-group · Deva-side · mukti · 30/60/60/6/10 cascade (1 vipala = 0.4 sec)",
      diti_pole: "(3) · nilpotent ideal · Asura-side · saṃsāra · 10/20/20/2/10 cascade (1 vipala = 10.8 sec)",
      pisano_of_ideal_ratio: 3,
      total_diti_compression: 27,
      compression_derivation: "3³ — 3 independent cascade reductions",
      shared_layers: "vāra (7-day graha cycle), K, all astronomical positions",
      discipline_ref: "KAAL APEX v5 · P241 Pisano-of-Ideal · P242 Orbit Cascade",
    },
    by_meridian: byMeridianViews(kaliDays),
    meridians: computeMeridianViews(kaliDays),
    meridian_groups: meridianGroups(),
    meridian_categories: MERIDIAN_CATEGORIES,
    substrate_alignment: VEDIC_TIME_SUBSTRATE,
    kamakhya_meridian_offset_h: KAMAKHYA_LMT_OFFSET_H,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Convenience: stamp for "now" (default IST)
// ═══════════════════════════════════════════════════════════════════════════

export function ghadiNow(tzH = 5.5): SubstrateStamp {
  // Compute the wall-clock in the requested timezone manually.
  const nowMs = Date.now()
  const utcMs = nowMs
  const tzMs = utcMs + tzH * 3600 * 1000
  const d = new Date(tzMs)
  // d.getUTCxxx() now gives us the components in the requested timezone
  return kalaSubstrateStamp(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
    tzH,
  )
}
