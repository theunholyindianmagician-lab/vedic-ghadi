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
  fraction_of_day: number
  hours_from_kamakhya_midnight: number
  muhurta_index: number
  muhurta_fractional: number
  ghati_index: number
  vighati_index: number
  prana_index: number
  vipala_fractional: number
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
// ◈ Meridian registry — 12 named meridians × 4 categories (TS port)
// ═══════════════════════════════════════════════════════════════════════════

type MeridianCategory = "sacred" | "char-dham" | "modern" | "universal"

interface MeridianRegistryEntry {
  id: string
  label_en: string
  label_hi: string
  label_sub: string
  lon_deg: number
  category: MeridianCategory
}

export const MERIDIAN_REGISTRY: readonly MeridianRegistryEntry[] = [
  { id: "kamakhya",    label_en: "Kāmākhyā Devī",         label_hi: "कामाख्या",      label_sub: "KAAL symbolic origin · Sovereign East · Shakti-pīṭha",   lon_deg:  91.705900, category: "sacred" },
  { id: "ujjain",      label_en: "Ujjayinī (Avantī)",     label_hi: "उज्जयिनी",      label_sub: "Sūrya Siddhānta canonical meridian · केन्द्र",            lon_deg:  75.778889, category: "sacred" },
  { id: "kashi",       label_en: "Kāśī (Varanasi)",       label_hi: "काशी",         label_sub: "Shiva · Mokṣa-purī · 12 Jyotirliṅga",                     lon_deg:  83.010300, category: "sacred" },
  { id: "badrinath",   label_en: "Badrīnāth",             label_hi: "बद्रीनाथ",      label_sub: "Char Dham · उत्तर · Viṣṇu",                                lon_deg:  79.493800, category: "char-dham" },
  { id: "dwarka",      label_en: "Dvārkā",                label_hi: "द्वारका",        label_sub: "Char Dham · पश्चिम · Kṛṣṇa",                              lon_deg:  68.967800, category: "char-dham" },
  { id: "rameshwaram", label_en: "Rāmeśvaram",            label_hi: "रामेश्वरम्",    label_sub: "Char Dham · दक्षिण · Śiva",                                lon_deg:  79.312900, category: "char-dham" },
  { id: "puri",        label_en: "Purī (Jagannātha)",     label_hi: "पुरी",         label_sub: "Char Dham · पूर्व · Viṣṇu",                                lon_deg:  85.824500, category: "char-dham" },
  { id: "delhi",       label_en: "Delhi (Indraprastha)",  label_hi: "दिल्ली",        label_sub: "राजधानी · IST anchor",                                     lon_deg:  77.209000, category: "modern" },
  { id: "mumbai",      label_en: "Mumbai (Bombay)",       label_hi: "मुम्बई",        label_sub: "वाणिज्य राजधानी · Financial",                              lon_deg:  72.877700, category: "modern" },
  { id: "bengaluru",   label_en: "Bengaluru",             label_hi: "बेंगलुरु",       label_sub: "तकनीकी केन्द्र · Tech",                                    lon_deg:  77.594600, category: "modern" },
  { id: "greenwich",   label_en: "Greenwich (Royal Obs.)", label_hi: "ग्रीनिच",      label_sub: "Universal reference · Prime Meridian · 0°",                lon_deg:   0.000000, category: "universal" },
  { id: "new_york",    label_en: "New York City",         label_hi: "न्यूयॉर्क",      label_sub: "Western Hemisphere · −74°",                               lon_deg: -74.006000, category: "universal" },
] as const

export const MERIDIAN_CATEGORIES: readonly [MeridianCategory, string][] = [
  ["sacred",    "🔱 सनातन · Sacred Trinity (KAAL)"],
  ["char-dham", "🛕 चार धाम · Four Cardinal Dhāma"],
  ["modern",    "🏙️  आधुनिक भारत · Modern India"],
  ["universal", "🌍 वैश्विक · Universal references"],
] as const

export interface MeridianFullView extends MeridianView {
  id: string
  category: MeridianCategory
  offset_from_ujjain_days: number
  offset_from_ujjain_min: number
}

export function computeMeridianViews(
  kaliDaysUjjain: number,
): Record<string, MeridianFullView> {
  const out: Record<string, MeridianFullView> = {}
  for (const m of MERIDIAN_REGISTRY) {
    const offsetDays = (m.lon_deg - UJJAIN_LON_DEG) / 15.0 / 24.0
    const kM = kaliDaysUjjain + offsetDays
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
      day_subdivision: vedicTimeOfDay(kM),
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
