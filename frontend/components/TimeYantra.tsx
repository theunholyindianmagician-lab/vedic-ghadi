"use client"

import type { SubstrateStamp } from "@/lib/substrate"

/**
 * Concentric Vedic-time yantra.
 *
 * Five rings, outer → inner:
 *   1. Saṃvatsara  (60-cycle position)
 *   2. Māsa        (12 sidereal months)
 *   3. Tithi       (30 lunar days)
 *   4. Ghaṭi       (60 per day, 24-min units)
 *   5. Prāṇa       (6 per vighaṭi, 4-sec units — innermost, fastest)
 *
 * Each ring shows the current segment lit + a sweeping pointer.
 * The 4-second prāṇa ring sweeps visibly so the yantra is alive.
 */
export function TimeYantra({ stamp }: { stamp: SubstrateStamp }) {
  const size = 520
  const c = size / 2

  // Fractional positions (0..1 around the dial)
  const samvatsaraFrac = stamp.year_layer.samvatsara.index / 60
  const masaFrac = (stamp.month_layer.masa_index - 1) / 12
  const tithiFrac = (stamp.tithi_layer.tithi_index - 1 + stamp.tithi_layer.fractional_tithi) / 30
  const ghatiFrac = stamp.day_subdivision.fraction_of_day
  // Prāṇa: smooth within the current vighaṭi (4-sec sweep)
  const pranaInVighatiFrac = ((stamp.day_subdivision.vighati_index - 1) + 0) / 60
  const pranaSecondsFrac =
    (stamp.day_subdivision.fraction_of_day * 86400) % 4 / 4

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="ring-glow">
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3a1f06" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#0a0703" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0a0703" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"  stopColor="#fef4d8" />
            <stop offset="50%" stopColor="#d4a44c" />
            <stop offset="100%" stopColor="#6b4d1c" />
          </linearGradient>
        </defs>

        {/* central glow disc */}
        <circle cx={c} cy={c} r={c - 4} fill="url(#centerGlow)" />

        {/* === outer ring: saṃvatsara (60) === */}
        <Ring cx={c} cy={c} r={240} segments={60} activeIdx={stamp.year_layer.samvatsara.index} thickness={2} />
        <Pointer cx={c} cy={c} r={240} frac={samvatsaraFrac} length={14} />
        <text x={c} y={28} textAnchor="middle" fontFamily="var(--font-cinzel)"
              fontSize="11" letterSpacing="3" fill="#a67c33">SAṂVATSARA · 60</text>

        {/* === māsa ring (12) === */}
        <Ring cx={c} cy={c} r={200} segments={12} activeIdx={stamp.month_layer.masa_index - 1} thickness={3} />
        <Pointer cx={c} cy={c} r={200} frac={masaFrac} length={12} />

        {/* === tithi ring (30) === */}
        <Ring cx={c} cy={c} r={160} segments={30} activeIdx={stamp.tithi_layer.tithi_index - 1} thickness={2} />
        <Pointer cx={c} cy={c} r={160} frac={tithiFrac} length={10} />

        {/* === ghaṭi ring (60) === */}
        <Ring cx={c} cy={c} r={120} segments={60} activeIdx={stamp.day_subdivision.ghati_index - 1} thickness={2} />
        <Pointer cx={c} cy={c} r={120} frac={ghatiFrac} length={10} sweeping />

        {/* === prāṇa ring (6) — innermost, sweeps every 4 sec === */}
        <Ring cx={c} cy={c} r={80} segments={6} activeIdx={stamp.day_subdivision.prana_index - 1} thickness={4} />
        <Pointer cx={c} cy={c} r={80} frac={pranaSecondsFrac} length={16} accent />

        {/* central seal: ॐ कालाय */}
        <circle cx={c} cy={c} r={48} fill="#0a0703" stroke="url(#goldGrad)" strokeWidth="1" />
        <text x={c} y={c + 4} textAnchor="middle" fontFamily="Noto Serif Devanagari"
              fontSize="22" fill="#f6cf78">ॐ</text>
        <text x={c} y={c + 24} textAnchor="middle" fontFamily="Noto Serif Devanagari"
              fontSize="9" fill="#d4a44c" letterSpacing="2">कालाय</text>
      </svg>

      {/* live ember dot */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="ember-dot inline-block w-2 h-2 rounded-full bg-gold-400" />
        <span className="text-xs text-gold-500 font-mono tracking-wider">LIVE</span>
      </div>
    </div>
  )
}

function Ring({
  cx, cy, r, segments, activeIdx, thickness,
}: { cx: number; cy: number; r: number; segments: number; activeIdx: number; thickness: number }) {
  const ticks = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI - Math.PI / 2  // 12 o'clock origin
    const x1 = cx + (r - 4) * Math.cos(angle)
    const y1 = cy + (r - 4) * Math.sin(angle)
    const x2 = cx + (r + 4) * Math.cos(angle)
    const y2 = cy + (r + 4) * Math.sin(angle)
    const isActive = i === activeIdx
    ticks.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isActive ? "#f6cf78" : "#3e2c10"}
            strokeWidth={isActive ? 2.5 : 1}
            strokeLinecap="round" />
    )
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none"
              stroke="rgba(212, 164, 76, 0.18)" strokeWidth={thickness} />
      {ticks}
    </g>
  )
}

function Pointer({
  cx, cy, r, frac, length, sweeping, accent,
}: { cx: number; cy: number; r: number; frac: number; length: number; sweeping?: boolean; accent?: boolean }) {
  const angle = frac * 2 * Math.PI - Math.PI / 2
  const x1 = cx + (r - length) * Math.cos(angle)
  const y1 = cy + (r - length) * Math.sin(angle)
  const x2 = cx + (r + length) * Math.cos(angle)
  const y2 = cy + (r + length) * Math.sin(angle)
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={accent ? "#f6cf78" : "#e9b863"}
          strokeWidth={accent ? 3 : 2}
          strokeLinecap="round"
          opacity={sweeping ? 0.95 : 1} />
  )
}
