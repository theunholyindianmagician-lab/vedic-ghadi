/**
 * 🔱 Aṣṭakavarga — TS port of ashtakavarga.py
 * Bhinna + Sarva 337-bindu strength matrix.
 */

const TABLES: Record<string, Record<string, readonly number[]>> = {
  Sun: {
    Sun:     [1, 2, 4, 7, 8, 9, 10, 11],
    Moon:    [3, 6, 10, 11],
    Mars:    [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus:   [6, 7, 12],
    Saturn:  [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna:   [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun:     [3, 6, 7, 8, 10, 11],
    Moon:    [1, 3, 6, 7, 9, 10, 11],
    Mars:    [2, 3, 5, 6, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 2, 4, 7, 8, 10, 11],
    Venus:   [3, 4, 5, 7, 9, 10, 11],
    Saturn:  [3, 5, 6, 11],
    Lagna:   [3, 6, 10, 11],
  },
  Mars: {
    Sun:     [3, 5, 6, 10, 11],
    Moon:    [3, 6, 11],
    Mars:    [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus:   [6, 8, 11, 12],
    Saturn:  [1, 4, 7, 8, 9, 10, 11],
    Lagna:   [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun:     [5, 6, 9, 11, 12],
    Moon:    [2, 4, 6, 8, 10, 11],
    Mars:    [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus:   [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn:  [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna:   [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun:     [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon:    [2, 5, 7, 9, 11],
    Mars:    [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus:   [2, 5, 6, 9, 10, 11],
    Saturn:  [3, 5, 6, 12],
    Lagna:   [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun:     [8, 11, 12],
    Moon:    [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars:    [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus:   [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn:  [3, 4, 5, 8, 9, 10, 11],
    Lagna:   [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun:     [1, 2, 4, 7, 8, 10, 11],
    Moon:    [3, 6, 11],
    Mars:    [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus:   [6, 11, 12],
    Saturn:  [3, 5, 6, 11],
    Lagna:   [1, 3, 4, 6, 10, 11],
  },
}

export const ASHTAKAVARGA_GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const
export type AVGraha = typeof ASHTAKAVARGA_GRAHAS[number]

export const AV_VARIANT_IDS = ["bpns", "phaladipika", "varahamihira"] as const
export type AVVariant = typeof AV_VARIANT_IDS[number]

export const AV_VARIANT_META: Record<AVVariant, { label_en: string; label_hi: string; source: string }> = {
  bpns: {
    label_en: "BPHS Ch. 66",
    label_hi: "बृहत्पाराशर-होराशास्त्र · अ. 66",
    source: "BPHS (Santhanam tr.) — oracle anchor (default)",
  },
  phaladipika: {
    label_en: "Phaladīpikā Ch. 23",
    label_hi: "फलदीपिका · अ. 23",
    source: "Phaladīpikā / M.S. Mehta — 9 transposed to Moon-from-Mars",
  },
  varahamihira: {
    label_en: "Varāhamihira",
    label_hi: "वराहमिहिर",
    source: "Phaladīpikā footnote / M.S. Mehta — Jupiter row (1,4,7,8,10,11,12)",
  },
}

/** Per-variant override rows for the Chandra table (ref → offsets). */
const MOON_VARIANT_ROWS: Record<AVVariant, Record<string, readonly number[]>> = {
  bpns: {},
  phaladipika: {
    Moon:    [1, 3, 6, 7, 10, 11],
    Mars:    [2, 3, 5, 6, 9, 10, 11],
  },
  varahamihira: {
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
  },
}

export interface AshtakavargaResult {
  bhinna: Record<AVGraha, number[]>     // 7 grahas × 12 bindu counts
  sarva: number[]                        // 12 totals (sum across 7)
  sarva_total: number                    // 337 in every variant
  per_graha_totals: Record<AVGraha, number>
  lagna_sign: number
  lagna_lon_deg: number
  lagna_proxy: string
  variant: AVVariant                     // Chandra-table school
}

export type AshtakavargaVariants = Record<AVVariant, AshtakavargaResult>

function bhinnaAV(target: AVGraha, grahaSigns: Record<string, number>, lagnaSign: number, variant: AVVariant = "bpns"): number[] {
  const table = { ...TABLES[target] }
  if (target === "Moon") {
    Object.assign(table, MOON_VARIANT_ROWS[variant])
  }
  const bindus = new Array(12).fill(0)
  for (const ref of Object.keys(table)) {
    const refSign = ref === "Lagna" ? lagnaSign : grahaSigns[ref]
    for (const offset of table[ref]) {
      const targetSign = ((refSign + offset - 1) % 12 + 12) % 12
      bindus[targetSign]++
    }
  }
  return bindus
}

export function computeBhinnaSarva(grahaLons: Record<string, number>, lagnaLonDeg: number, variant: AVVariant = "bpns"): AshtakavargaResult {
  const grahaSigns: Record<string, number> = {}
  for (const g of Object.keys(grahaLons)) {
    grahaSigns[g] = ((Math.floor(grahaLons[g] / 30) % 12) + 12) % 12
  }
  const lagnaSign = ((Math.floor(lagnaLonDeg / 30) % 12) + 12) % 12

  const bhinna: Record<AVGraha, number[]> = {} as Record<AVGraha, number[]>
  for (const g of ASHTAKAVARGA_GRAHAS) {
    bhinna[g] = bhinnaAV(g, grahaSigns, lagnaSign, variant)
  }

  const sarva = new Array(12).fill(0)
  for (const g of ASHTAKAVARGA_GRAHAS) {
    for (let i = 0; i < 12; i++) sarva[i] += bhinna[g][i]
  }

  const per_graha_totals: Record<AVGraha, number> = {} as Record<AVGraha, number>
  for (const g of ASHTAKAVARGA_GRAHAS) {
    per_graha_totals[g] = bhinna[g].reduce((a, b) => a + b, 0)
  }

  return {
    bhinna,
    sarva,
    sarva_total: sarva.reduce((a, b) => a + b, 0),
    per_graha_totals,
    lagna_sign: lagnaSign,
    lagna_lon_deg: lagnaLonDeg,
    lagna_proxy: "observer ascendant (effective_49 ayanāṃśa frame)",
    variant,
  }
}

/** All documented Moon-table conventions in parallel (main = bpns). */
export function computeBhinnaSarvaVariants(grahaLons: Record<string, number>, lagnaLonDeg: number): AshtakavargaVariants {
  const out = {} as AshtakavargaVariants
  for (const v of AV_VARIANT_IDS) out[v] = computeBhinnaSarva(grahaLons, lagnaLonDeg, v)
  return out
}
