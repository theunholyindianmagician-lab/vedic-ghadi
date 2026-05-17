/**
 * 🔱 Vargas (21 divisional charts) — TS port of vargas.py
 * Byte-identical to the Python reference.
 */

export interface VargaEntry {
  n: number
  abbrev: string
  name_en: string
  name_hi: string
  body: string
}

export const VARGA_LIST: readonly [number, string, string, string, string][] = [
  [1,   "D1",   "Rāśi",            "राशि",           "general / identity"],
  [2,   "D2",   "Horā",            "होरा",           "wealth"],
  [3,   "D3",   "Drekkāṇa",        "द्रेक्काण",       "siblings"],
  [4,   "D4",   "Caturthāṃśa",    "चतुर्थांश",       "home / property"],
  [5,   "D5",   "Pañcāṃśa",       "पञ्चांश",         "fame / power"],
  [6,   "D6",   "Ṣaṣṭhāṃśa",      "षष्ठांश",         "health / illness"],
  [7,   "D7",   "Saptamāṃśa",     "सप्तमांश",        "children / lineage"],
  [8,   "D8",   "Aṣṭāṃśa",        "अष्टांश",         "obstacles"],
  [9,   "D9",   "Navāṃśa",        "नवांश",           "spouse / dharma"],
  [10,  "D10",  "Daśāṃśa",        "दशांश",           "career / action"],
  [11,  "D11",  "Rudrāṃśa",       "रुद्रांश",        "destruction"],
  [12,  "D12",  "Dvādaśāṃśa",    "द्वादशांश",       "parents"],
  [16,  "D16",  "Ṣoḍaśāṃśa",      "षोडशांश",         "vehicles / comforts"],
  [20,  "D20",  "Viṃśāṃśa",       "विंशांश",         "spiritual practice"],
  [24,  "D24",  "Caturviṃśāṃśa",  "चतुर्विंशांश",    "education / learning"],
  [27,  "D27",  "Saptaviṃśāṃśa",  "सप्तविंशांश",     "strengths / weaknesses"],
  [30,  "D30",  "Triṃśāṃśa",      "त्रिंशांश",       "misfortunes (Parāśarī)"],
  [40,  "D40",  "Khavedāṃśa",     "खवेदांश",         "maternal lineage"],
  [45,  "D45",  "Akṣavedāṃśa",    "अक्षवेदांश",      "paternal lineage"],
  [60,  "D60",  "Ṣaṣṭhyāṃśa",    "षष्ट्यांश",        "past-life karmas"],
  [108, "D108", "Aṣṭottarāṃśa",  "अष्टोत्तरांश",     "comprehensive synthesis"],
] as const

export const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const

export const SIGN_DEV = [
  "मेष", "वृष", "मिथुन", "कर्क", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const

export const SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"] as const

export function computeVarga(lonDeg: number, n: number): number {
  let lon = lonDeg % 360.0
  if (lon < 0) lon += 360.0
  const signIdx = Math.floor(lon / 30)
  const degInSign = lon - signIdx * 30

  if (n === 1) return signIdx

  if (n === 2) {
    const isOdd = (signIdx % 2 === 0)
    const firstHalf = degInSign < 15
    if (isOdd) return firstHalf ? 4 : 3
    return firstHalf ? 3 : 4
  }

  if (n === 3) {
    const part = Math.floor(degInSign / 10.0)
    return (signIdx + 4 * part) % 12
  }

  if (n === 4) {
    const part = Math.floor(degInSign * 4 / 30.0)
    return (signIdx + 3 * part) % 12
  }

  if (n === 7) {
    const part = Math.floor(degInSign * 7 / 30.0)
    const isOdd = (signIdx % 2 === 0)
    const start = isOdd ? signIdx : (signIdx + 6) % 12
    return (start + part) % 12
  }

  if (n === 9) {
    const part = Math.floor(degInSign * 9 / 30.0)
    const modality = signIdx % 3
    const start = modality === 0 ? signIdx
                : modality === 1 ? (signIdx + 8) % 12
                :                  (signIdx + 4) % 12
    return (start + part) % 12
  }

  if (n === 10) {
    const part = Math.floor(degInSign * 10 / 30.0)
    const isOdd = (signIdx % 2 === 0)
    const start = isOdd ? signIdx : (signIdx + 8) % 12
    return (start + part) % 12
  }

  if (n === 12) {
    const part = Math.floor(degInSign * 12 / 30.0)
    return (signIdx + part) % 12
  }

  if (n === 16) {
    const part = Math.floor(degInSign * 16 / 30.0)
    const modality = signIdx % 3
    const start = [0, 4, 8][modality]
    return (start + part) % 12
  }

  if (n === 20) {
    const part = Math.floor(degInSign * 20 / 30.0)
    const modality = signIdx % 3
    const start = [0, 8, 4][modality]
    return (start + part) % 12
  }

  if (n === 24) {
    const part = Math.floor(degInSign * 24 / 30.0)
    const isOdd = (signIdx % 2 === 0)
    const start = isOdd ? 4 : 3
    return (start + part) % 12
  }

  if (n === 27) {
    const part = Math.floor(degInSign * 27 / 30.0)
    const element = signIdx % 4
    const start = [0, 3, 6, 9][element]
    return (start + part) % 12
  }

  if (n === 30) {
    const isOdd = (signIdx % 2 === 0)
    if (isOdd) {
      if (degInSign < 5.0)  return 0   // Mars/Aries
      if (degInSign < 10.0) return 10  // Saturn/Aquarius
      if (degInSign < 18.0) return 8   // Jupiter/Sagittarius
      if (degInSign < 25.0) return 2   // Mercury/Gemini
      return 6                          // Venus/Libra
    } else {
      if (degInSign < 5.0)  return 1   // Venus/Taurus
      if (degInSign < 12.0) return 5   // Mercury/Virgo
      if (degInSign < 20.0) return 11  // Jupiter/Pisces
      if (degInSign < 25.0) return 9   // Saturn/Capricorn
      return 7                          // Mars/Scorpio
    }
  }

  if (n === 40) {
    const part = Math.floor(degInSign * 40 / 30.0)
    const isOdd = (signIdx % 2 === 0)
    const start = isOdd ? 0 : 6
    return (start + part) % 12
  }

  if (n === 45) {
    const part = Math.floor(degInSign * 45 / 30.0)
    const modality = signIdx % 3
    const start = [0, 4, 8][modality]
    return (start + part) % 12
  }

  // Default: pure harmonic rule
  return (signIdx * n + Math.floor(degInSign * n / 30.0)) % 12
}

export function computeAllVargas(lonDeg: number): number[] {
  return VARGA_LIST.map(v => computeVarga(lonDeg, v[0]))
}
