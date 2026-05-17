"use client"

import { useState } from "react"
import type { SubstrateStamp, MeridianFullView, TrimurtiId } from "@/lib/substrate"

/**
 * 🔱 SphotaSunburst — 504 cells visualized as a SVG sunburst.
 *
 * Geometry:
 *   • 7 mukha sectors (Hanumat/Narasimha/Garuda/Varaha/Hayagriva/Kala/Sarva)
 *     arranged like 7 rays from center, each sector spans ~51.4° of the circle
 *   • Within each mukha: 12 meridians as 12 concentric arcs at increasing radius
 *   • Within each meridian arc: 6 cells (2 poles × 3 Trimurti) as 6 angular wedges
 *   • Each wedge colored by its current nakṣatra (27 colors)
 *   • Inner aura: Aṣṭakavarga Sarva total tint
 *
 * Click a wedge → it becomes the "active cell" highlighted in the table.
 */
export function SphotaSunburst({ stamp }: { stamp: SubstrateStamp }) {
  const [hover, setHover] = useState<{ mid: string; pole: "aditi"|"diti"; op: TrimurtiId } | null>(null)
  const size = 600
  const cx = size / 2
  const cy = size / 2
  const innerR = 50
  const outerR = 280
  const ringStep = (outerR - innerR) / 12     // 12 meridians per mukha = 12 rings

  // Mukha sectors (7 of 360°)
  const mukhaSectorDeg = 360 / 7
  const mukhaInfo: Record<string, { offset: number; color: string; emoji: string; label: string }> = {
    "purva":    { offset: 0,            color: "#a04a0a", emoji: "🐒", label: "हनुमत्-पूर्व" },
    "dakshina": { offset: mukhaSectorDeg, color: "#cf6a1e", emoji: "🦁", label: "नरसिंह-दक्षिण" },
    "paschim":  { offset: 2*mukhaSectorDeg, color: "#7a5c1f", emoji: "🦅", label: "गरुड़-पश्चिम" },
    "uttara":   { offset: 3*mukhaSectorDeg, color: "#4a7c1f", emoji: "🐗", label: "वराह-उत्तर" },
    "urdhva":   { offset: 4*mukhaSectorDeg, color: "#1f7a7a", emoji: "🐴", label: "हयग्रीव-ऊर्ध्व" },
    "kala":     { offset: 5*mukhaSectorDeg, color: "#7a1f7a", emoji: "⏳", label: "काल-समय" },
    "sarva":    { offset: 6*mukhaSectorDeg, color: "#1f4a7a", emoji: "🌐", label: "सर्व-व्यापक" },
  }

  // Nakshatra → color (27 colors in HSL)
  const nakColor = (idx: number) => `hsl(${idx * 360 / 27}, 65%, 55%)`

  const wedges: React.ReactElement[] = []

  for (const m of Object.values(stamp.meridians)) {
    const mukha = mukhaInfo[m.category]
    if (!mukha) continue
    // Find meridian's index within its mukha (0..11) — by east→west
    const idsInMukha = stamp.meridian_groups[m.category]
      .slice()
      .sort((a, b) => stamp.meridians[b].lon_deg - stamp.meridians[a].lon_deg)
    const meridianIdx = idsInMukha.indexOf(m.id)

    const r0 = innerR + meridianIdx * ringStep
    const r1 = r0 + ringStep * 0.95

    // 6 cells: 2 poles × 3 Trimurti
    let cellIdx = 0
    for (const pole of ["aditi", "diti"] as const) {
      for (const op of ["brahma", "vishnu", "mahesh"] as const) {
        const cell = m.trimurti[pole][op]
        const nakIdx = cell.nakshatra.nakshatra_index - 1
        const fillColor = nakColor(nakIdx)
        // Sub-angle within the mukha sector
        const a0 = mukha.offset + (cellIdx / 6) * mukhaSectorDeg
        const a1 = mukha.offset + ((cellIdx + 1) / 6) * mukhaSectorDeg * 0.98
        const path = arcPath(cx, cy, r0, r1, a0, a1)
        const key = `${m.id}-${pole}-${op}`
        wedges.push(
          <path
            key={key}
            d={path}
            fill={fillColor}
            fillOpacity={pole === "diti" ? 0.45 : 0.85}
            stroke="#0a0703"
            strokeWidth={0.3}
            className="cursor-pointer transition-opacity hover:opacity-80"
            onMouseEnter={() => setHover({ mid: m.id, pole, op })}
            onMouseLeave={() => setHover(null)}
          >
            <title>
              {m.label_en} · {pole} · {op} → {cell.nakshatra.nakshatra_name} pa{cell.nakshatra.pada}
              {"\n"}AV total: {cell.ashtakavarga.sarva_total}
            </title>
          </path>
        )
        cellIdx++
      }
    }
  }

  // Mukha sector outlines + labels
  const mukhaLabels = Object.entries(mukhaInfo).map(([catId, info]) => {
    const midAngle = info.offset + mukhaSectorDeg / 2
    const labelR = outerR + 25
    const x = cx + labelR * Math.cos((midAngle - 90) * Math.PI / 180)
    const y = cy + labelR * Math.sin((midAngle - 90) * Math.PI / 180)
    return (
      <g key={catId}>
        {/* sector divider */}
        <line
          x1={cx + innerR * Math.cos((info.offset - 90) * Math.PI / 180)}
          y1={cy + innerR * Math.sin((info.offset - 90) * Math.PI / 180)}
          x2={cx + (outerR + 15) * Math.cos((info.offset - 90) * Math.PI / 180)}
          y2={cy + (outerR + 15) * Math.sin((info.offset - 90) * Math.PI / 180)}
          stroke="#6b4d1c"
          strokeWidth={1}
          opacity={0.6}
        />
        <text x={x} y={y - 6} textAnchor="middle" fontSize="13" fill={info.color}>
          {info.emoji}
        </text>
        <text x={x} y={y + 8} textAnchor="middle" fontSize="9"
              fill="#e9b863" fontFamily="Noto Serif Devanagari">
          {info.label}
        </text>
      </g>
    )
  })

  const hoverCell = hover ? stamp.meridians[hover.mid]?.trimurti[hover.pole][hover.op] : null
  const hoverM = hover ? stamp.meridians[hover.mid] : null

  return (
    <section className="mt-10 rounded-sm border border-gold-700/40 bg-ink-900/40 overflow-hidden">
      <header className="px-6 py-4 border-b border-gold-700/40">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-display tracking-[0.3em] text-gold-300 text-sm">
            🔱 स्फोट-सूर्यमंडल · SPHOṬA SUNBURST · 504 cells live
          </h2>
          <span className="text-xs text-gold-500 italic">
            7 mukha sectors × 12 meridians × 6 cells (2 pole × 3 Trimurti)
          </span>
        </div>
        <p className="mt-1 text-xs text-gold-600/80 italic">
          हर wedge = 1 cell · color = current nakṣatra (27 hues) ·
          opacity = pole (full Aditi, faded Diti) · hover for detail
        </p>
      </header>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 p-6">
        <div className="relative">
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}
               className="drop-shadow-[0_0_20px_rgba(212,164,76,0.15)]">
            <defs>
              <radialGradient id="centerSeal" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a0d04" />
                <stop offset="100%" stopColor="#0a0703" />
              </radialGradient>
            </defs>
            {/* outer rim */}
            <circle cx={cx} cy={cy} r={outerR + 5} fill="none"
                    stroke="#6b4d1c" strokeWidth={0.5} opacity={0.5} />
            {wedges}
            {mukhaLabels}
            {/* central seal */}
            <circle cx={cx} cy={cy} r={innerR - 2} fill="url(#centerSeal)"
                    stroke="#d4a44c" strokeWidth={0.8} />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="22"
                  fill="#f6cf78" fontFamily="Noto Serif Devanagari">ॐ</text>
            <text x={cx} y={cy + 22} textAnchor="middle" fontSize="7"
                  fill="#d4a44c" fontFamily="Noto Serif Devanagari" letterSpacing="2">
              504
            </text>
          </svg>
        </div>

        <div className="lg:w-80 text-sm">
          {hoverCell && hoverM ? (
            <div className="space-y-3 p-4 rounded-sm border border-gold-700/50 bg-ink-800/60">
              <div>
                <div className="text-xs text-gold-600 font-display tracking-wider mb-1">HOVERED CELL</div>
                <div className="font-display text-gold-200">{hoverM.label_en}</div>
                <div className="inscription text-sm text-gold-400">{hoverM.label_hi}</div>
              </div>
              <div className="text-xs text-gold-500">
                {hover && (
                  <>
                    <span className="text-gold-300">{hover.pole}</span> ·{" "}
                    <span className="text-gold-300">{hover.op}</span>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="नक्षत्र"
                      value={`${hoverCell.nakshatra.nakshatra_name} pa${hoverCell.nakshatra.pada}`} />
                <Stat label="योग" value={hoverCell.yoga.yoga_name} />
                <Stat label="करण" value={hoverCell.karana.karana_name} />
                <Stat label="AV total" value={`${hoverCell.ashtakavarga.sarva_total}`} />
              </div>
              <div className="text-[10px] text-gold-600 italic">
                K shifted: {hoverCell.k_shifted.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gold-600 italic p-4 text-center">
              hover over any wedge to see its cell detail<br/>
              <span className="text-[10px]">click रोकें — nakshatra/yoga/karaṇa/AV</span>
            </div>
          )}

          <div className="mt-4 text-[10px] text-gold-600/80 leading-relaxed px-1">
            <div className="font-display tracking-wider text-gold-500 mb-1">LEGEND</div>
            • Each ring = 1 meridian (12 per mukha sector)<br/>
            • 6 wedges per ring = 2 poles × 3 Trimurti<br/>
            • Color = current nakṣatra (27-hue cycle)<br/>
            • Opacity: Aditi = full · Diti = faded<br/>
            • Wedges shift color as K progresses through the day
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-ink-900/60 border border-gold-700/30 px-2 py-1.5">
      <div className="text-[9px] inscription text-gold-600">{label}</div>
      <div className="text-xs text-gold-200 font-display">{value}</div>
    </div>
  )
}

/** SVG arc path: ring sector from (cx,cy) radius r0→r1, angle a0→a1 (degrees, 0=top). */
function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  // Convert to math (0 = right, ccw). SVG y is down so we flip with -y trick.
  const toRad = (d: number) => (d - 90) * Math.PI / 180
  const x0_inner = cx + r0 * Math.cos(toRad(a0))
  const y0_inner = cy + r0 * Math.sin(toRad(a0))
  const x0_outer = cx + r1 * Math.cos(toRad(a0))
  const y0_outer = cy + r1 * Math.sin(toRad(a0))
  const x1_outer = cx + r1 * Math.cos(toRad(a1))
  const y1_outer = cy + r1 * Math.sin(toRad(a1))
  const x1_inner = cx + r0 * Math.cos(toRad(a1))
  const y1_inner = cy + r0 * Math.sin(toRad(a1))
  const largeArc = (a1 - a0) > 180 ? 1 : 0
  return [
    `M ${x0_inner} ${y0_inner}`,
    `L ${x0_outer} ${y0_outer}`,
    `A ${r1} ${r1} 0 ${largeArc} 1 ${x1_outer} ${y1_outer}`,
    `L ${x1_inner} ${y1_inner}`,
    `A ${r0} ${r0} 0 ${largeArc} 0 ${x0_inner} ${y0_inner}`,
    "Z",
  ].join(" ")
}
