/**
 * 🔱 Aṣṭakavarga — TS port of ashtakavarga.py
 * Bhinna + Sarva 337-bindu strength matrix.
 */

const TABLES: Record<string, Record<string, readonly number[]>> = {
  Sun: {
    Sun:     [1, 2, 4, 7, 8, 9, 10, 11],
    Moon:    [3, 6, 10, 11],
    Mars:    [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus:   [6, 7, 12],
    Saturn:  [1, 2, 4, 7, 8, 10, 11],
    Lagna:   [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun:     [3, 6, 7, 8, 10, 11],
    Moon:    [1, 3, 6, 7, 9, 10, 11],
    Mars:    [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
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

export interface AshtakavargaResult {
  bhinna: Record<AVGraha, number[]>     // 7 grahas × 12 bindu counts
  sarva: number[]                        // 12 totals (sum across 7)
  sarva_total: number                    // ~337
  per_graha_totals: Record<AVGraha, number>
  lagna_sign: number
  lagna_proxy: string
}

function bhinnaAV(target: AVGraha, grahaSigns: Record<string, number>, lagnaSign: number): number[] {
  const table = TABLES[target]
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

export function computeBhinnaSarva(grahaLons: Record<string, number>): AshtakavargaResult {
  const grahaSigns: Record<string, number> = {}
  for (const g of Object.keys(grahaLons)) {
    grahaSigns[g] = ((Math.floor(grahaLons[g] / 30) % 12) + 12) % 12
  }
  const lagnaSign = grahaSigns["Sun"]

  const bhinna: Record<AVGraha, number[]> = {} as Record<AVGraha, number[]>
  for (const g of ASHTAKAVARGA_GRAHAS) {
    bhinna[g] = bhinnaAV(g, grahaSigns, lagnaSign)
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
    lagna_proxy: "Sūrya-Lagna (Sun's sign — substrate has no observer ascendant)",
  }
}
