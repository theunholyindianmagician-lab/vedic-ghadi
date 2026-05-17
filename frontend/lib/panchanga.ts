/**
 * 🔱 PAÑCĀṄGA — nakṣatra · yoga · karaṇa (TypeScript port of panchanga.py)
 *
 * Exact parity with the Python reference. Imported into substrate.ts so
 * `kalaSubstrateStamp()` returns the full 8-layer stamp including pañcāṅga.
 */

import { vedicMeanLongitude } from "./substrate.ts"

// ═══════════════════════════════════════════════════════════════════════════
// ◈ 27 Nakṣatras
// ═══════════════════════════════════════════════════════════════════════════

export const NAKSHATRA_NAMES = [
  "Aśvinī", "Bharaṇī", "Kṛttikā",
  "Rohiṇī", "Mṛgaśīrṣā", "Ārdrā",
  "Punarvasu", "Puṣya", "Āśleṣā",
  "Maghā", "Pūrvaphalgunī", "Uttaraphalgunī",
  "Hasta", "Citrā", "Svātī",
  "Viśākhā", "Anurādhā", "Jyeṣṭhā",
  "Mūla", "Pūrvāṣāḍhā", "Uttarāṣāḍhā",
  "Śravaṇa", "Dhaniṣṭhā", "Śatabhiṣā",
  "Pūrvabhādrapadā", "Uttarabhādrapadā", "Revatī",
] as const

export const NAKSHATRA_DEV = [
  "अश्विनी", "भरणी", "कृत्तिका",
  "रोहिणी", "मृगशीर्षा", "आर्द्रा",
  "पुनर्वसु", "पुष्य", "आश्लेषा",
  "मघा", "पूर्वफल्गुनी", "उत्तरफल्गुनी",
  "हस्त", "चित्रा", "स्वाती",
  "विशाखा", "अनुराधा", "ज्येष्ठा",
  "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा",
  "श्रवण", "धनिष्ठा", "शतभिषा",
  "पूर्वभाद्रपदा", "उत्तरभाद्रपदा", "रेवती",
] as const

export const NAKSHATRA_DEITY = [
  "Aśvinī Kumāra", "Yama", "Agni",
  "Brahmā", "Soma", "Rudra",
  "Aditi", "Bṛhaspati", "Nāga",
  "Pitṛ", "Bhaga", "Aryaman",
  "Savitṛ", "Tvāṣṭṛ", "Vāyu",
  "Indrāgnī", "Mitra", "Indra",
  "Nirṛti", "Āpas", "Viśvedevāḥ",
  "Viṣṇu", "Vasu", "Varuṇa",
  "Aja Ekapāda", "Ahirbudhnya", "Pūṣan",
] as const

export const NAKSHATRA_LORD = [
  "Ketu", "Venus", "Sun",
  "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun",
  "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun",
  "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury",
] as const

// ═══════════════════════════════════════════════════════════════════════════
// ◈ 27 Yogas
// ═══════════════════════════════════════════════════════════════════════════

export const YOGA_NAMES = [
  "Viṣkambha", "Prīti", "Āyuṣmān",
  "Saubhāgya", "Śobhana", "Atigaṇḍa",
  "Sukarmā", "Dhṛti", "Śūla",
  "Gaṇḍa", "Vṛddhi", "Dhruva",
  "Vyāghāta", "Harṣaṇa", "Vajra",
  "Siddhi", "Vyatīpāta", "Varīyāna",
  "Parigha", "Śiva", "Siddha",
  "Sādhya", "Śubha", "Śukla",
  "Brahmā", "Indra", "Vaidhṛti",
] as const

export const YOGA_DEV = [
  "विष्कम्भ", "प्रीति", "आयुष्मान्",
  "सौभाग्य", "शोभन", "अतिगण्ड",
  "सुकर्मा", "धृति", "शूल",
  "गण्ड", "वृद्धि", "ध्रुव",
  "व्याघात", "हर्षण", "वज्र",
  "सिद्धि", "व्यतीपात", "वरीयान",
  "परिघ", "शिव", "सिद्ध",
  "साध्य", "शुभ", "शुक्ल",
  "ब्रह्मा", "इन्द्र", "वैधृति",
] as const

// ═══════════════════════════════════════════════════════════════════════════
// ◈ 11 Karaṇas (7 cara movable + 4 sthira fixed)
// ═══════════════════════════════════════════════════════════════════════════

export const KARANA_CARA = ["Bava", "Bālava", "Kaulava", "Taitila", "Gara", "Vaṇij", "Viṣṭi"] as const
export const KARANA_CARA_DEV = ["बव", "बालव", "कौलव", "तैतिल", "गर", "वणिज्", "विष्टि"] as const

function karanaForHalfTithi(idx: number): { name: string; dev: string; isMovable: boolean; cycle: number } {
  if (idx === 0)  return { name: "Kiṃstughna", dev: "किंस्तुघ्न", isMovable: false, cycle: 0 }
  if (idx === 57) return { name: "Śakuni",     dev: "शकुनि",     isMovable: false, cycle: 0 }
  if (idx === 58) return { name: "Catuṣpāda",  dev: "चतुष्पाद",  isMovable: false, cycle: 0 }
  if (idx === 59) return { name: "Nāga",       dev: "नाग",       isMovable: false, cycle: 0 }
  const caraIdx = (idx - 1) % 7
  const cycle = Math.floor((idx - 1) / 7) + 1
  return { name: KARANA_CARA[caraIdx], dev: KARANA_CARA_DEV[caraIdx], isMovable: true, cycle }
}

// ═══════════════════════════════════════════════════════════════════════════
// ◈ Public functions
// ═══════════════════════════════════════════════════════════════════════════

export interface NakshatraLayer {
  nakshatra_index: number
  nakshatra_name: string
  nakshatra_devanagari: string
  nakshatra_deity: string
  nakshatra_lord: string
  pada: number
  pada_fractional: number
  moon_sidereal_lon_deg: number
  fractional_nakshatra: number
}

export function nakshatraAtKaliDays(kaliDays: number): NakshatraLayer {
  const moonLon = vedicMeanLongitude("Moon", kaliDays)
  const arc = 360.0 / 27.0
  const naksFloat = moonLon / arc
  const naksIdx = (((Math.floor(naksFloat) % 27) + 27) % 27)
  const padaFloat = (naksFloat - Math.floor(naksFloat)) * 4.0
  const padaIdx = Math.floor(padaFloat) + 1
  return {
    nakshatra_index: naksIdx + 1,
    nakshatra_name: NAKSHATRA_NAMES[naksIdx],
    nakshatra_devanagari: NAKSHATRA_DEV[naksIdx],
    nakshatra_deity: NAKSHATRA_DEITY[naksIdx],
    nakshatra_lord: NAKSHATRA_LORD[naksIdx],
    pada: padaIdx,
    pada_fractional: Math.round((padaFloat - (padaIdx - 1)) * 1e4) / 1e4,
    moon_sidereal_lon_deg: Math.round(moonLon * 1e4) / 1e4,
    fractional_nakshatra: Math.round((naksFloat - Math.floor(naksFloat)) * 1e4) / 1e4,
  }
}

export interface YogaLayer {
  yoga_index: number
  yoga_name: string
  yoga_devanagari: string
  sun_plus_moon_lon_deg: number
  fractional_yoga: number
}

export function yogaAtKaliDays(kaliDays: number): YogaLayer {
  const sunLon = vedicMeanLongitude("Sun", kaliDays)
  const moonLon = vedicMeanLongitude("Moon", kaliDays)
  const sumLon = ((sunLon + moonLon) % 360.0 + 360.0) % 360.0
  const arc = 360.0 / 27.0
  const yogaFloat = sumLon / arc
  const yogaIdx = (((Math.floor(yogaFloat) % 27) + 27) % 27)
  return {
    yoga_index: yogaIdx + 1,
    yoga_name: YOGA_NAMES[yogaIdx],
    yoga_devanagari: YOGA_DEV[yogaIdx],
    sun_plus_moon_lon_deg: Math.round(sumLon * 1e4) / 1e4,
    fractional_yoga: Math.round((yogaFloat - Math.floor(yogaFloat)) * 1e4) / 1e4,
  }
}

export interface KaranaLayer {
  karana_index: number
  karana_name: string
  karana_devanagari: string
  is_movable: boolean
  movable_cycle_number: number
  fractional_karana: number
}

export function karanaAtKaliDays(kaliDays: number): KaranaLayer {
  const sunLon = vedicMeanLongitude("Sun", kaliDays)
  const moonLon = vedicMeanLongitude("Moon", kaliDays)
  let elong = (moonLon - sunLon) % 360.0
  if (elong < 0) elong += 360.0
  const halfTithiFloat = elong / 6.0
  const halfTithiIdx = (((Math.floor(halfTithiFloat) % 60) + 60) % 60)
  const k = karanaForHalfTithi(halfTithiIdx)
  return {
    karana_index: halfTithiIdx + 1,
    karana_name: k.name,
    karana_devanagari: k.dev,
    is_movable: k.isMovable,
    movable_cycle_number: k.cycle,
    fractional_karana: Math.round((halfTithiFloat - Math.floor(halfTithiFloat)) * 1e4) / 1e4,
  }
}
