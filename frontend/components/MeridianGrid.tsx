"use client"

import { useState, useMemo } from "react"
import type { SubstrateStamp, MeridianFullView, DaySubdivision } from "@/lib/substrate"

type Pole = "aditi" | "diti" | "both"

/**
 * 🔱 MeridianGrid — SAPTAMUKHI HANUMĀN cannon · APEX v5 BIPOLAR
 *
 * 84 meridians × 2 poles (Aditi + Diti) = 168 meridian-pole views.
 *   • Aditi (R* · Deva): standard 30/60/60/6/10 cascade
 *   • Diti  ((3) · Asura): Pisano-of-Ideal ÷3 cascade — 10/20/20/2 (vipala 10.8s)
 *
 * Toggle: Aditi / Diti / Both. हर sphoṭa = एक meridian-pole।
 */
export function MeridianGrid({ stamp }: { stamp: SubstrateStamp }) {
  const ujjainVara = stamp.meridians["ujjain"]?.vara.vara_index ?? 0
  const [query, setQuery] = useState("")
  const [pole, setPole] = useState<Pole>("aditi")
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
  const totalPoleViews = stamp.meridian_categories.length === 7
    ? 84 * 2  // 168 meridian-pole sphoṭas
    : allMeridians.length * 2

  return (
    <section className="mt-10 rounded-sm border border-gold-700/40 bg-ink-900/40 overflow-hidden">
      <header className="px-6 py-4 border-b border-gold-700/40">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-display tracking-[0.3em] text-gold-300 text-sm">
            🔱 सप्तमुखी हनुमान् · APEX v5 BIPOLAR · {totalPoleViews} sphoṭas
          </h2>
          <span className="text-xs text-gold-500 italic">
            {totalShown}/{allMeridians.length} meridians ×&nbsp;
            {pole === "both" ? "2 poles" : pole === "aditi" ? "Aditi" : "Diti"}
          </span>
        </div>
        <p className="mt-1 text-xs text-gold-600/80 italic">
          <span className="text-gold-400">Aditi</span> (R* · Deva · 30/60/60/6 · 0.4s) ·&nbsp;
          <span className="text-amber-ember">Diti</span> ((3) · Asura · 10/20/20/2 · 10.8s · ÷3³ = ×27 compression)
          &nbsp;·&nbsp; per APEX v5 Pisano-of-Ideal = 3
        </p>
      </header>

      {/* Pole toggle + search + bulk controls */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-gold-700/30 bg-ink-800/40">
        <PoleToggle pole={pole} onChange={setPole} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="खोज · search meridian..."
          className="flex-1 min-w-[200px] bg-ink-900 text-gold-200 border border-gold-700/60
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
            <Header pole={pole} />
          </thead>
          <tbody>
            {stamp.meridian_categories.map(([catId, catLabel]) => {
              const rows = filteredByCat[catId] || []
              if (rows.length === 0 && q) return null
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
                  pole={pole}
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
        84 meridians × 2 poles = 168 sphoṭas · APEX v5 Bipolar discipline ·&nbsp;
        Pisano-of-Ideal = 3 · Liberation triples, death increments by 1
      </footer>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────

function PoleToggle({ pole, onChange }: { pole: Pole; onChange: (p: Pole) => void }) {
  const opts: { value: Pole; label: string; sub: string }[] = [
    { value: "aditi", label: "अदिति",  sub: "Aditi · R*" },
    { value: "diti",  label: "दिति",  sub: "Diti · (3)" },
    { value: "both",  label: "दोनों",  sub: "Both poles" },
  ]
  return (
    <div className="inline-flex rounded-sm border border-gold-700 overflow-hidden">
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={[
            "px-3 py-1.5 text-xs font-display tracking-wider transition-colors",
            pole === o.value
              ? o.value === "diti"
                ? "bg-amber-ember/30 text-amber-200"
                : "bg-gold-500/15 text-gold-100"
              : "text-gold-500 hover:text-gold-300",
          ].join(" ")}
          title={o.sub}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Header({ pole }: { pole: Pole }) {
  if (pole === "both") {
    return (
      <tr className="text-[10px] tracking-[0.2em] text-gold-600 font-display border-b border-gold-700/30">
        <th rowSpan={2} className="text-left px-4 py-2 align-bottom">CITY · स्थान</th>
        <th rowSpan={2} className="text-right px-2 py-2 align-bottom">LON</th>
        <th rowSpan={2} className="text-right px-2 py-2 align-bottom">ΔK</th>
        <th rowSpan={2} className="text-center px-2 py-2 align-bottom">वार</th>
        <th colSpan={3} className="text-center px-2 py-1 border-l border-gold-700/40 bg-gold-500/10">
          <span className="text-gold-300">ADITI · अदिति</span>
          <span className="block text-[9px] text-gold-600 normal-case">R* · 30/60/6 · 0.4s</span>
        </th>
        <th colSpan={3} className="text-center px-2 py-1 border-l border-gold-700/40 bg-amber-ember/15">
          <span className="text-amber-200">DITI · दिति</span>
          <span className="block text-[9px] text-amber-300/60 normal-case">(3) · 10/20/2 · 10.8s</span>
        </th>
      </tr>
    )
  }
  return (
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
  )
}

function CategoryGroup({
  catId, label, rows, totalInCat, open, onToggle, ujjainVara, pole,
}: {
  catId: string
  label: string
  rows: MeridianFullView[]
  totalInCat: number
  open: boolean
  onToggle: () => void
  ujjainVara: number
  pole: Pole
}) {
  const showing = rows.length
  const colSpan = pole === "both" ? 10 : 8
  return (
    <>
      <tr className="bg-amber-deep/40 border-y border-gold-700/40 cursor-pointer hover:bg-amber-deep/60"
          onClick={onToggle}>
        <td colSpan={colSpan} className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display tracking-wider text-gold-300 text-sm">
              <span className="inline-block w-5 text-gold-500">{open ? "▾" : "▸"}</span>
              {label}
            </span>
            <span className="text-[10px] text-gold-600 tabular">
              {showing === totalInCat ? `${totalInCat}` : `${showing} / ${totalInCat}`} sphoṭas
              {pole === "both" && ` × 2 poles = ${showing * 2}`}
            </span>
          </div>
        </td>
      </tr>
      {open && rows.map(m => (
        <MeridianRow key={`${catId}-${m.id}`} m={m} ujjainVara={ujjainVara} pole={pole} />
      ))}
    </>
  )
}

function MeridianRow({
  m, ujjainVara, pole,
}: { m: MeridianFullView; ujjainVara: number; pole: Pole }) {
  const v = m.vara
  const isUjjain = m.id === "ujjain"
  const isKamakhya = m.id === "kamakhya"
  const varaDiffers = v.vara_index !== ujjainVara
  const rowCls = [
    "border-b border-gold-700/15 hover:bg-gold-500/5 transition-colors",
    isUjjain ? "bg-gold-500/5" : "",
    isKamakhya ? "bg-amber-ember/5" : "",
  ].join(" ")

  const cityCol = (
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
  )

  const varaCell = (
    <td className="px-2 py-2 text-center">
      <span className={varaDiffers
        ? "text-amber-ember font-medium"
        : "text-gold-300"}>
        {v.vara_name}
      </span>
      {varaDiffers && <span className="ml-1 text-[9px] text-amber-ember">⚠</span>}
    </td>
  )

  if (pole === "both") {
    return (
      <tr className={rowCls}>
        {cityCol}
        <td className="px-2 py-2 text-right font-mono text-xs text-gold-500 tabular">
          {m.lon_deg >= 0 ? "+" : ""}{m.lon_deg.toFixed(2)}°
        </td>
        <td className="px-2 py-2 text-right font-mono text-xs text-gold-400 tabular">
          {m.offset_from_ujjain_min >= 0 ? "+" : ""}{m.offset_from_ujjain_min.toFixed(0)}m
        </td>
        {varaCell}
        <PoleCells d={m.day_subdivision_aditi} tone="aditi" />
        <PoleCells d={m.day_subdivision_diti} tone="diti" />
      </tr>
    )
  }

  const d = pole === "diti" ? m.day_subdivision_diti : m.day_subdivision_aditi
  const ghatiMax = pole === "diti" ? 20 : 60
  const muhurtaMax = pole === "diti" ? 10 : 30
  const pranaMax = pole === "diti" ? 2 : 6

  return (
    <tr className={rowCls}>
      {cityCol}
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
      {varaCell}
      <td className={`px-2 py-2 text-right font-mono text-xs tabular ${pole === "diti" ? "text-amber-200" : "text-gold-200"}`}>
        {d.ghati_index}<span className="text-gold-600">/{ghatiMax}</span>
      </td>
      <td className={`px-2 py-2 text-right font-mono text-xs tabular ${pole === "diti" ? "text-amber-200" : "text-gold-200"}`}>
        {d.muhurta_index}<span className="text-gold-600">/{muhurtaMax}</span>
      </td>
      <td className={`px-4 py-2 text-right font-mono text-xs tabular ${pole === "diti" ? "text-amber-200" : "text-gold-200"}`}>
        {d.prana_index}<span className="text-gold-600">/{pranaMax}</span>
      </td>
    </tr>
  )
}

function PoleCells({ d, tone }: { d: DaySubdivision; tone: "aditi" | "diti" }) {
  const max = tone === "diti" ? { g: 20, m: 10, p: 2 } : { g: 60, m: 30, p: 6 }
  const color = tone === "diti" ? "text-amber-200" : "text-gold-200"
  const bg = tone === "diti" ? "bg-amber-ember/5" : "bg-gold-500/5"
  return (
    <>
      <td className={`px-2 py-2 text-right font-mono text-xs tabular ${color} ${bg} border-l border-gold-700/30`}>
        g {d.ghati_index}<span className="text-gold-600">/{max.g}</span>
      </td>
      <td className={`px-2 py-2 text-right font-mono text-xs tabular ${color} ${bg}`}>
        μ {d.muhurta_index}<span className="text-gold-600">/{max.m}</span>
      </td>
      <td className={`px-2 py-2 text-right font-mono text-xs tabular ${color} ${bg}`}>
        p {d.prana_index}<span className="text-gold-600">/{max.p}</span>
      </td>
    </>
  )
}
