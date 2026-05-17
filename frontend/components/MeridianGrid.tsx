"use client"

import { useState, useMemo } from "react"
import type { SubstrateStamp, MeridianFullView } from "@/lib/substrate"

/**
 * 🔱 MeridianGrid — SAPTAMUKHI HANUMĀN cannon
 *
 * 84 meridians (= 12 × 7) parallel-computed from the same K. Organized
 * into 7 mukhas (directions/spheres), 12 per mukha. Search + collapsible
 * sections. हर meridian = एक sphoṭa from the saptamukhi cannon।
 */
export function MeridianGrid({ stamp }: { stamp: SubstrateStamp }) {
  const ujjainVara = stamp.meridians["ujjain"]?.vara.vara_index ?? 0
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const [catId] of stamp.meridian_categories) init[catId] = true
    return init
  })

  const allMeridians = useMemo(() => Object.values(stamp.meridians), [stamp])
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return allMeridians
    return allMeridians.filter(m =>
      m.id.toLowerCase().includes(q) ||
      m.label_en.toLowerCase().includes(q) ||
      m.label_hi.includes(query) ||
      m.label_sub.toLowerCase().includes(q),
    )
  }, [allMeridians, q, query])

  const filteredByCat = useMemo(() => {
    const grouped: Record<string, MeridianFullView[]> = {}
    for (const m of filtered) {
      if (!grouped[m.category]) grouped[m.category] = []
      grouped[m.category].push(m)
    }
    // Sort east → west within each category
    for (const cat in grouped) {
      grouped[cat].sort((a, b) => b.lon_deg - a.lon_deg)
    }
    return grouped
  }, [filtered])

  function toggleCat(catId: string) {
    setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }))
  }
  function expandAll() {
    const next: Record<string, boolean> = {}
    for (const [catId] of stamp.meridian_categories) next[catId] = true
    setExpanded(next)
  }
  function collapseAll() {
    const next: Record<string, boolean> = {}
    for (const [catId] of stamp.meridian_categories) next[catId] = false
    setExpanded(next)
  }

  const totalShown = filtered.length

  return (
    <section className="mt-10 rounded-sm border border-gold-700/40 bg-ink-900/40 overflow-hidden">
      <header className="px-6 py-4 border-b border-gold-700/40">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-display tracking-[0.3em] text-gold-300 text-sm">
            🔱 सप्तमुखी हनुमान् · SAPTAMUKHI CANNON
          </h2>
          <span className="text-xs text-gold-500 italic">
            {totalShown} of {allMeridians.length} meridians · 7 mukhas × 12 = 84
          </span>
        </div>
        <p className="mt-1 text-xs text-gold-600/80 italic">
          K<sub>M</sub> = K<sub>ujjain</sub> + (LON<sub>M</sub> − 75.7789°) / 15 / 24
          &nbsp;·&nbsp; हर sphoṭa एक meridian · eastward → ahead, westward → behind
        </p>
      </header>

      {/* Search + bulk controls */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gold-700/30 bg-ink-800/40">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="खोज · search by name, city, या Devanāgarī..."
          className="flex-1 bg-ink-900 text-gold-200 border border-gold-700/60
                     rounded-sm px-3 py-1.5 text-sm font-mono
                     focus:outline-none focus:border-gold-500
                     placeholder-gold-700"
        />
        <button onClick={expandAll}
                className="px-3 py-1.5 text-xs font-display tracking-wider
                           text-gold-400 border border-gold-700 hover:border-gold-500
                           hover:text-gold-200 rounded-sm transition-colors">
          + सब खोलो
        </button>
        <button onClick={collapseAll}
                className="px-3 py-1.5 text-xs font-display tracking-wider
                           text-gold-400 border border-gold-700 hover:border-gold-500
                           hover:text-gold-200 rounded-sm transition-colors">
          − सब बंद
        </button>
      </div>

      <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-ink-900 z-10">
            <tr className="text-[10px] tracking-[0.2em] text-gold-600 font-display border-b border-gold-700/30">
              <th className="text-left px-4 py-2">CITY · स्थान</th>
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
            {stamp.meridian_categories.map(([catId, catLabel]) => {
              const rows = filteredByCat[catId] || []
              if (rows.length === 0 && q) return null  // hide empty cats when filtering
              return (
                <CategoryGroup
                  key={catId}
                  catId={catId}
                  label={catLabel}
                  rows={rows}
                  totalInCat={stamp.meridian_groups[catId]?.length ?? 0}
                  open={expanded[catId]}
                  onToggle={() => toggleCat(catId)}
                  ujjainVara={ujjainVara}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {totalShown === 0 && (
        <div className="px-6 py-12 text-center text-gold-600 italic">
          कोई meridian नहीं मिला · no match for &quot;{query}&quot;
        </div>
      )}

      <footer className="px-6 py-3 border-t border-gold-700/40 text-center text-xs text-gold-600/80">
        84 = 12 × 7 · 12 zodiac × 7 mukha · substrate-aligned
        &nbsp;·&nbsp; coords from canonical sources · accurate to ±0.05° (~3 km)
      </footer>
    </section>
  )
}

function CategoryGroup({
  catId, label, rows, totalInCat, open, onToggle, ujjainVara,
}: {
  catId: string
  label: string
  rows: MeridianFullView[]
  totalInCat: number
  open: boolean
  onToggle: () => void
  ujjainVara: number
}) {
  const showing = rows.length
  return (
    <>
      <tr className="bg-amber-deep/40 border-y border-gold-700/40 cursor-pointer hover:bg-amber-deep/60"
          onClick={onToggle}>
        <td colSpan={8} className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display tracking-wider text-gold-300 text-sm">
              <span className="inline-block w-5 text-gold-500">{open ? "▾" : "▸"}</span>
              {label}
            </span>
            <span className="text-[10px] text-gold-600 tabular">
              {showing === totalInCat ? `${totalInCat}` : `${showing} / ${totalInCat}`} sphoṭas
            </span>
          </div>
        </td>
      </tr>
      {open && rows.map(m => (
        <MeridianRow key={`${catId}-${m.id}`} m={m} ujjainVara={ujjainVara} />
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
        <div className="flex items-center gap-2 flex-wrap">
          {isKamakhya && <span className="text-xs">🔱</span>}
          {isUjjain && <span className="text-xs">📜</span>}
          <span className="font-display text-xs tracking-wider">{m.label_en}</span>
          <span className="inscription text-sm text-gold-400">{m.label_hi}</span>
        </div>
        <div className="text-[10px] italic text-gold-600/70 mt-0.5 line-clamp-1">
          {m.label_sub}
        </div>
      </td>
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
