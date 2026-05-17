"use client"

import type { SubstrateStamp, MeridianFullView } from "@/lib/substrate"

/**
 * 🔱 MeridianGrid — 12 meridians × 4 categories, all in parallel.
 *
 * Compact table grouped by category. Sorted east → west within each group.
 * Shows ΔK from Ujjain, vāra, ghaṭi, muhūrta for every meridian at the
 * same UT moment.
 */
export function MeridianGrid({ stamp }: { stamp: SubstrateStamp }) {
  const ujjainVara = stamp.meridians["ujjain"].vara.vara_index

  return (
    <section className="mt-10 rounded-sm border border-gold-700/40 bg-ink-900/40 overflow-hidden">
      <header className="px-6 py-4 border-b border-gold-700/40">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-display tracking-[0.3em] text-gold-300 text-sm">
            सर्व-मेरिडियन · ALL MERIDIANS
          </h2>
          <span className="text-xs text-gold-500 italic">
            एक ही क्षण · 12 दृष्टि · हर meridian = अपना K + वार + दिनार्ध
          </span>
        </div>
        <p className="mt-1 text-xs text-gold-600/80 italic">
          K<sub>M</sub> = K<sub>ujjain</sub> + (LON<sub>M</sub> − 75.7789°) / 15 / 24
          &nbsp;·&nbsp; eastward → ahead, westward → behind
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[0.2em] text-gold-600 font-display border-b border-gold-700/30">
              <th className="text-left px-4 py-2">CITY</th>
              <th className="text-left px-2 py-2">देवनागरी</th>
              <th className="text-right px-2 py-2">LON</th>
              <th className="text-right px-2 py-2">ΔK (min)</th>
              <th className="text-right px-2 py-2">K (सावन दिन)</th>
              <th className="text-center px-2 py-2">वार</th>
              <th className="text-right px-2 py-2">घटी</th>
              <th className="text-right px-2 py-2">मुहूर्त</th>
              <th className="text-right px-4 py-2">प्राण</th>
            </tr>
          </thead>
          <tbody>
            {stamp.meridian_categories.map(([catId, catLabel]) => (
              <CategoryGroup
                key={catId}
                label={catLabel}
                ids={stamp.meridian_groups[catId]}
                meridians={stamp.meridians}
                ujjainVara={ujjainVara}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CategoryGroup({
  label, ids, meridians, ujjainVara,
}: {
  label: string
  ids: string[]
  meridians: Record<string, MeridianFullView>
  ujjainVara: number
}) {
  // Sort east → west (descending longitude) within the category
  const sorted = ids.slice().sort((a, b) => meridians[b].lon_deg - meridians[a].lon_deg)
  return (
    <>
      <tr className="bg-amber-deep/30 border-y border-gold-700/30">
        <td colSpan={9} className="px-4 py-2 font-display tracking-wider text-gold-400 text-xs">
          {label}
        </td>
      </tr>
      {sorted.map(mid => (
        <MeridianRow key={mid} m={meridians[mid]} ujjainVara={ujjainVara} />
      ))}
    </>
  )
}

function MeridianRow({ m, ujjainVara }: { m: MeridianFullView; ujjainVara: number }) {
  const d = m.day_subdivision
  const v = m.vara
  const isUjjain = m.id === "ujjain"
  const isKamakhya = m.id === "kamakhya"
  const varaDiffers = v.vara_index !== ujjainVara
  return (
    <tr className={[
      "border-b border-gold-700/15 hover:bg-gold-500/5 transition-colors",
      isUjjain ? "bg-gold-500/5" : "",
      isKamakhya ? "bg-amber-ember/5" : "",
    ].join(" ")}>
      <td className="px-4 py-2 text-gold-300">
        <div className="flex items-center gap-2">
          {isKamakhya && <span className="text-xs">🔱</span>}
          {isUjjain && <span className="text-xs">📜</span>}
          <span className="font-display text-xs tracking-wider">{m.label_en}</span>
        </div>
        <div className="text-[10px] italic text-gold-600/70 mt-0.5 line-clamp-1">
          {m.label_sub}
        </div>
      </td>
      <td className="px-2 py-2 inscription text-sm text-gold-400">{m.label_hi}</td>
      <td className="px-2 py-2 text-right font-mono text-xs text-gold-500 tabular">
        {m.lon_deg >= 0 ? "+" : ""}{m.lon_deg.toFixed(4)}°
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs text-gold-400 tabular">
        {m.offset_from_ujjain_min >= 0 ? "+" : ""}{m.offset_from_ujjain_min.toFixed(2)}
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs text-gold-300 tabular">
        {m.kali_civil_days.toLocaleString(undefined, {
          minimumFractionDigits: 4, maximumFractionDigits: 4,
        })}
      </td>
      <td className="px-2 py-2 text-center">
        <span className={varaDiffers
          ? "text-amber-ember font-medium"
          : "text-gold-300"}>
          {v.vara_name}
        </span>
        {varaDiffers && <span className="ml-1 text-[9px] text-amber-ember">⚠</span>}
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs text-gold-200 tabular">
        {d.ghati_index}<span className="text-gold-600">/60</span>
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs text-gold-200 tabular">
        {d.muhurta_index}<span className="text-gold-600">/30</span>
      </td>
      <td className="px-4 py-2 text-right font-mono text-xs text-gold-200 tabular">
        {d.prana_index}<span className="text-gold-600">/6</span>
      </td>
    </tr>
  )
}
