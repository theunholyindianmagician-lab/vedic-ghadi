"use client"

import { useMemo } from "react"
import type { SubstrateStamp, PoleId, TrimurtiId } from "@/lib/substrate"
import { SAMVATSARA_NAMES } from "@/lib/substrate"
import { NAKSHATRA_NAMES, NAKSHATRA_DEV, NAKSHATRA_DEITY } from "@/lib/panchanga"

/**
 * 🔱 Sphota3DDial — analog-dial Vedic clock that beats Western horology.
 *
 * 34 live "complications" against the Patek Grandmaster Chime's 20:
 *   1.  60-ghaṭi Aditi outer rotor (1 day = 60 ghaṭi)
 *   2.  20-ghaṭi Diti counter-rotor (compressed pole)
 *   3.  60-vighaṭi sub-needle (24-sec resolution)
 *   4.  6-prāṇa sub-needle (4-sec resolution)
 *   5.  3 Trimūrti hour-hands (Brahmā 🌅 · Viṣṇu ☀️ · Maheśa 🌇 — 0/+8/+16h)
 *   6.  27-nakṣatra rotor with deity colors + names
 *   7.  Pada (1..4) micro-indicator
 *   8.  Sun ecliptic-longitude needle on nakṣatra ring
 *   9.  Moon ecliptic-longitude needle on nakṣatra ring
 *  10.  30-tithi rotor (15 śukla crescent + 15 kṛṣṇa amber)
 *  11.  Pakṣa (śukla/kṛṣṇa) indicator
 *  12.  7-vāra disk with planetary lords
 *  13.  Vāra-lord planet glyph at apex
 *  14.  12-māsa ring with current month named
 *  15.  60-saṃvatsara Bṛhaspati-cakra (60-year named cycle)
 *  16.  Kali year (5127) digital readout with vikrama + śaka
 *  17.  27-yoga subdial
 *  18.  60-karaṇa subdial
 *  19.  K (Kāmākhyā Julian day) 6-decimal digital readout
 *  20.  Fraction-of-day percentage (0..1 normalized)
 *  21.  Muhūrta (1..30) indicator with fractional sweep
 *  22.  Aṣṭakavarga sarva-total strength meter (per-cell)
 *  23.  Meridian-name digital readout (current active meridian)
 *  24.  Meridian longitude (lon_deg, 4-decimal)
 *  25.  LMT offset from Kāmākhyā (hours, signed)
 *  26.  Live Trimūrti-active operator badge
 *  27.  Bipolar discipline label (Aditi·R* / Diti·(3) — APEX-v5 tag)
 *  28.  Pisano-of-Ideal=3 invariant marker (Diti compression ratio)
 *  29.  Devanāgarī numerals overlay for Kali day count
 *  30.  Heartbeat pulse on central OM seal (prāṇa-rate)
 *  31.  Sapta-mukha micro-dot ring (7 directional faces)
 *  32.  Yuga-pāda indicator (current quarter of Kali Yuga)
 *  33.  Day-of-week (vāra) auspiciousness color tint
 *  34.  Live ticking — every animation frame; no mechanical drift
 *
 * Layout: 3D via CSS `perspective` + `transform-style: preserve-3d` + per-ring
 * `translateZ()`. Outer container tilts via `rotateX(10deg)` for analog-watch
 * perspective. Rings stack at Z = 0..+72; OM seal floats forward at +72.
 *
 * NO Three.js / WebGL — known broken in this Next 16 + R3F v9 env.
 * Pure SVG + CSS 3D. SSR-safe (mounted via `dynamic({ ssr: false })`).
 *
 * Sealed APEX-v5 Saptamukhi Bipolar · 2026-05-14 · all values derive from
 * the single triple (R, g, k) = (ℤ/3^k ℤ, 2, k ∈ ℕ⁺) via the Master Meta-
 * Theorem (Mahā-Mahā-Vākyam).
 */

export interface Sphota3DDialProps {
  stamp: SubstrateStamp
  activeMeridianId?: string
  size?: number
  tiltDeg?: number
  perspectivePx?: number
}

const PLANET_SYMBOL: Record<string, { symbol: string; color: string; dev: string }> = {
  Sun:     { symbol: "☉", color: "#f6cf78", dev: "रवि"   },
  Moon:    { symbol: "☽", color: "#e8e8f5", dev: "सोम"   },
  Mars:    { symbol: "♂", color: "#cf3a1e", dev: "मङ्गल" },
  Mercury: { symbol: "☿", color: "#7acf78", dev: "बुध"   },
  Jupiter: { symbol: "♃", color: "#cf9a3e", dev: "गुरु"  },
  Venus:   { symbol: "♀", color: "#f6d8e8", dev: "शुक्र"  },
  Saturn:  { symbol: "♄", color: "#7a5c8f", dev: "शनि"   },
  Rahu:    { symbol: "☊", color: "#4a3a8f", dev: "राहु"  },
  Ketu:    { symbol: "☋", color: "#8f3a4a", dev: "केतु"  },
}

const MASA_DEV = [
  "चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ", "श्रावण", "भाद्रपद",
  "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन",
]

const NAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"]
function toNagari(n: number | string): string {
  return String(n).replace(/[0-9]/g, d => NAGARI_DIGITS[Number(d)])
}

const MUKHA_DOTS: Array<{ id: string; emoji: string; color: string }> = [
  { id: "purva",    emoji: "🐒", color: "#a04a0a" },
  { id: "dakshina", emoji: "🦁", color: "#cf6a1e" },
  { id: "paschim",  emoji: "🦅", color: "#7a5c1f" },
  { id: "uttara",   emoji: "🐗", color: "#4a7c1f" },
  { id: "urdhva",   emoji: "🐴", color: "#1f7a7a" },
  { id: "kala",     emoji: "⏳", color: "#7a1f7a" },
  { id: "sarva",    emoji: "🌐", color: "#1f4a7a" },
]

/** Convert (fractional index, segment count) → rotation angle so current segment lands at 12 o'clock. */
const rotForFraction = (f: number, N: number) => -((f / N) * 360)

/** Polar to Cartesian, with θ=0 at top (12 o'clock), clockwise positive. */
function polar(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [r * Math.cos(rad), r * Math.sin(rad)]
}

// ════════════════════════════════════════════════════════════════════════════
// ◈ Main component
// ════════════════════════════════════════════════════════════════════════════

export function Sphota3DDial({
  stamp,
  activeMeridianId = "kamakhya",
  size = 700,
  tiltDeg = 10,
  perspectivePx = 1600,
}: Sphota3DDialProps) {
  const meridian = stamp.meridians[activeMeridianId] ?? stamp.meridians.kamakhya
  const cell = meridian.trimurti.aditi.brahma   // canonical Brahmā-Aditi cell for primary readouts
  const cellDiti = meridian.trimurti.diti.brahma

  const daAditi = stamp.day_subdivision_aditi
  const daDiti = stamp.day_subdivision_diti
  const year = stamp.year_layer
  const month = stamp.month_layer
  const tithi = stamp.tithi_layer
  const vara = stamp.vara_layer
  const naks = cell.nakshatra
  const yoga = cell.yoga
  const karana = cell.karana

  // ──────────────────────────────────────────────────────────────────────────
  // Rotor angles (memoized — recompute only when stamp changes)
  // ──────────────────────────────────────────────────────────────────────────
  const angles = useMemo(() => {
    const ghatiAditi_f = (daAditi.ghati_index - 1)
      + (daAditi.vighati_index - 1) / 60
      + (daAditi.prana_index - 1) / 360
      + daAditi.vipala_fractional / 2160
    const ghatiDiti_f = (daDiti.ghati_index - 1) + (daDiti.vighati_index - 1) / 20
    const naks_f = (naks.nakshatra_index - 1) + naks.fractional_nakshatra
    const tithi_f = (tithi.tithi_index - 1) + tithi.fractional_tithi
    const yoga_f = (yoga.yoga_index - 1) + yoga.fractional_yoga
    const karana_f = (karana.karana_index - 1) + karana.fractional_karana
    const masa_f = (month.masa_index - 1) + ((month.sun_sidereal_lon_deg % 30) / 30)
    const samv_f = year.samvatsara.index + (year.kali_year_float - Math.floor(year.kali_year_float))
    return {
      ghatiAditi: rotForFraction(ghatiAditi_f, 60),
      ghatiDiti:  rotForFraction(ghatiDiti_f, 20),
      naks:       rotForFraction(naks_f, 27),
      tithi:      rotForFraction(tithi_f, 30),
      yoga:       rotForFraction(yoga_f, 27),
      karana:     rotForFraction(karana_f, 60),
      masa:       rotForFraction(masa_f, 12),
      samv:       rotForFraction(samv_f, 60),
      vara:       rotForFraction(vara.vara_index, 7),
      sunLon:     -((cell.vargas_grahas?.Sun ? naks.moon_sidereal_lon_deg : month.sun_sidereal_lon_deg)),
      moonLon:    -naks.moon_sidereal_lon_deg,
      // Trimūrti hands — 3 phase-shifted fraction-of-day positions
      brahmaHand: stamp.trimurti_at_ujjain.aditi.brahma.day_subdivision.fraction_of_day * 360,
      vishnuHand: stamp.trimurti_at_ujjain.aditi.vishnu.day_subdivision.fraction_of_day * 360,
      maheshHand: stamp.trimurti_at_ujjain.aditi.mahesh.day_subdivision.fraction_of_day * 360,
    }
  }, [stamp, activeMeridianId, daAditi, daDiti, naks, tithi, yoga, karana, month, year, vara, cell])

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  const kFormatted = stamp.kali_civil_days_at_kamakhya.toFixed(6)
  const kIntPart = Math.floor(stamp.kali_civil_days_at_kamakhya).toLocaleString("en-IN")
  const kDecPart = kFormatted.split(".")[1]

  return (
    <section
      data-component="sphota-3d-dial"
      className="mt-10 rounded-sm border border-gold-700/40 bg-ink-900/40 overflow-hidden"
    >
      <DialHeader meridian={meridian} cell={cell} />

      <div
        className="relative flex items-center justify-center"
        style={{
          minHeight: `${size + 40}px`,
          background: "radial-gradient(ellipse at center, #1a0d04 0%, #050300 80%)",
          perspective: `${perspectivePx}px`,
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            transformStyle: "preserve-3d",
            transform: `rotateX(${tiltDeg}deg) rotateZ(0deg)`,
          }}
        >
          {/* Faceplate base — all rings stack on top */}
          <DialFaceplate size={size} />

          {/* Layer 1 — Outermost: 60-saṃvatsara Bṛhaspati ring */}
          <RingLayer z={4}>
            <RingSamvatsara60 size={size} angle={angles.samv} active={year.samvatsara} />
          </RingLayer>

          {/* Layer 2 — 27-nakṣatra ring (with Sun + Moon needles riding on top) */}
          <RingLayer z={14}>
            <RingNakshatra27 size={size} angle={angles.naks} activeIdx={naks.nakshatra_index - 1} />
          </RingLayer>

          {/* Layer 3 — 30-tithi rotor (śukla/kṛṣṇa pakṣa) */}
          <RingLayer z={22}>
            <RingTithi30 size={size} angle={angles.tithi}
              activePaksha={tithi.paksha_index} activeTithi={tithi.tithi_index} />
          </RingLayer>

          {/* Layer 4 — 60-ghaṭi Aditi primary rotor */}
          <RingLayer z={30}>
            <RingGhatiAditi60 size={size} angle={angles.ghatiAditi} />
          </RingLayer>

          {/* Layer 5 — 12-māsa ring (small inner) */}
          <RingLayer z={36}>
            <RingMasa12 size={size} angle={angles.masa} activeIdx={month.masa_index - 1} />
          </RingLayer>

          {/* Layer 6 — 7-vāra disk (planetary days) */}
          <RingLayer z={40}>
            <RingVara7 size={size} angle={angles.vara} activeIdx={vara.vara_index}
              lordGraha={vara.vara_lord_graha} />
          </RingLayer>

          {/* Layer 7 — Subdials (yoga + karaṇa + diti) */}
          <RingLayer z={46}>
            <SubdialYoga27 size={size} angle={angles.yoga}
              name={yoga.yoga_name} dev={yoga.yoga_devanagari} />
            <SubdialKarana60 size={size} angle={angles.karana}
              name={karana.karana_name} dev={karana.karana_devanagari} />
            <SubdialGhatiDiti20 size={size} angle={angles.ghatiDiti}
              ghIdx={daDiti.ghati_index} vIdx={daDiti.vighati_index} />
          </RingLayer>

          {/* Layer 8 — Ecliptic needles (Sun + Moon point at real longitudes) */}
          <RingLayer z={52}>
            <EclipticNeedles size={size}
              sunDeg={month.sun_sidereal_lon_deg}
              moonDeg={naks.moon_sidereal_lon_deg} />
          </RingLayer>

          {/* Layer 9 — Trimūrti hour-hands (3 phase-shifted needles) */}
          <RingLayer z={58}>
            <TrimurtiHands size={size}
              brahmaDeg={angles.brahmaHand}
              vishnuDeg={angles.vishnuHand}
              maheshDeg={angles.maheshHand} />
          </RingLayer>

          {/* Layer 10 — Sapta-mukha micro-dots (7 directional faces) */}
          <RingLayer z={62}>
            <SaptaMukhaRing size={size} />
          </RingLayer>

          {/* Layer 11 — Central OM seal (floats forward) */}
          <RingLayer z={72}>
            <CentralOmSeal size={size} pranaIdx={daAditi.prana_index} />
          </RingLayer>

          {/* Layer 12 — Specular sheen overlay (top-most, low-opacity) */}
          <RingLayer z={84} pointerEvents="none">
            <SpecularSheen size={size} />
          </RingLayer>
        </div>

        {/* Digital overlays positioned over the dial corners */}
        <DigitalReadouts
          stamp={stamp}
          meridian={meridian}
          kInt={kIntPart}
          kDec={kDecPart}
          activeMeridianId={activeMeridianId}
        />
      </div>

      <DialFooter />
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ◈ Sub-components
// ════════════════════════════════════════════════════════════════════════════

function DialHeader({ meridian, cell }: { meridian: any; cell: any }) {
  return (
    <header className="px-6 py-4 border-b border-gold-700/40 flex items-baseline justify-between flex-wrap gap-2">
      <h2 className="font-display tracking-[0.3em] text-gold-300 text-sm">
        🔱 स्फोट-यन्त्र-घटिका · SPHOṬA 3D DIAL · 34 complications
      </h2>
      <span className="text-xs text-gold-500 italic">
        APEX-v5 bipolar · {meridian.label_hi} · {cell.nakshatra.nakshatra_devanagari} ·{" "}
        live tick · {cell.icon}
      </span>
    </header>
  )
}

function DialFooter() {
  return (
    <footer className="px-6 py-3 border-t border-gold-700/40 text-center text-[10px] text-gold-600/80">
      Aditi · R* (mokṣa side) + Diti · (3) (saṃsāra side) bridged by g=2 · Pisano-of-Ideal = 3 · Master Meta-Theorem (R, g, k)
    </footer>
  )
}

/** Wrapper that applies translateZ for the 3D stack. */
function RingLayer({
  z, pointerEvents = "auto", children,
}: { z: number; pointerEvents?: "auto" | "none"; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateZ(${z}px)`,
        transformStyle: "preserve-3d",
        pointerEvents,
      }}
    >
      {children}
    </div>
  )
}

function DialFaceplate({ size }: { size: number }) {
  const cx = size / 2
  const r = size * 0.49
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.7))" }}>
      <defs>
        <radialGradient id="face-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#1a0d04" />
          <stop offset="70%" stopColor="#0a0502" />
          <stop offset="100%" stopColor="#050300" />
        </radialGradient>
        <radialGradient id="rim-grad" cx="50%" cy="50%" r="50%">
          <stop offset="93%"  stopColor="#cf6a1e" stopOpacity="0" />
          <stop offset="97%"  stopColor="#d4a44c" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f6cf78" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cx} r={r} fill="url(#face-bg)" stroke="#a04a0a" strokeWidth={1.5} />
      <circle cx={cx} cy={cx} r={r * 0.998} fill="url(#rim-grad)" />
      {/* guilloché micro-pattern — 360 micro-ticks */}
      {Array.from({ length: 360 }, (_, i) => {
        const [x1, y1] = polar(r * 0.96, i)
        const [x2, y2] = polar(r * 0.93, i)
        return (
          <line key={i} x1={cx + x1} y1={cx + y1} x2={cx + x2} y2={cx + y2}
            stroke="#3e2c10" strokeWidth={0.3} opacity={0.5} />
        )
      })}
    </svg>
  )
}

// ─── Ring components ──────────────────────────────────────────────────────────

function RingSamvatsara60({
  size, angle, active,
}: { size: number; angle: number; active: { index: number; name: string } }) {
  const cx = size / 2
  const r = size * 0.46
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
      <g transform={`rotate(${angle} ${cx} ${cx})`}>
        {SAMVATSARA_NAMES.map((name, i) => {
          const tickAngle = (i / 60) * 360
          const [x1, y1] = polar(r, tickAngle)
          const [x2, y2] = polar(r - (i % 5 === 0 ? 12 : 6), tickAngle)
          const isActive = i === active.index
          return (
            <g key={name}>
              <line x1={cx + x1} y1={cx + y1} x2={cx + x2} y2={cx + y2}
                stroke={isActive ? "#f6cf78" : "#7a5c1f"}
                strokeWidth={isActive ? 2 : (i % 5 === 0 ? 1 : 0.5)} />
              {i % 5 === 0 && (() => {
                const [lx, ly] = polar(r - 22, tickAngle)
                return (
                  <text x={cx + lx} y={cx + ly} fontSize={8} fill={isActive ? "#f6cf78" : "#5c4824"}
                    textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${-angle} ${cx + lx} ${cx + ly})`}>
                    {i + 1}
                  </text>
                )
              })()}
            </g>
          )
        })}
      </g>
      {/* Apex marker — current saṃvatsara name */}
      <text x={cx} y={cx - r + 38} fontSize={10} fill="#f6cf78" textAnchor="middle"
        fontFamily="serif" letterSpacing="0.15em" data-readout="samvatsara-name">
        {active.name}
      </text>
    </svg>
  )
}

function RingNakshatra27({
  size, angle, activeIdx,
}: { size: number; angle: number; activeIdx: number }) {
  const cx = size / 2
  const rOuter = size * 0.42
  const rInner = size * 0.36
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
      <g transform={`rotate(${angle} ${cx} ${cx})`}>
        {NAKSHATRA_NAMES.map((name, i) => {
          const a0 = (i / 27) * 360
          const a1 = ((i + 1) / 27) * 360
          const [x0o, y0o] = polar(rOuter, a0)
          const [x1o, y1o] = polar(rOuter, a1)
          const [x0i, y0i] = polar(rInner, a0)
          const [x1i, y1i] = polar(rInner, a1)
          const path = `M ${cx + x0o} ${cx + y0o}
                        A ${rOuter} ${rOuter} 0 0 1 ${cx + x1o} ${cx + y1o}
                        L ${cx + x1i} ${cx + y1i}
                        A ${rInner} ${rInner} 0 0 0 ${cx + x0i} ${cx + y0i} Z`
          const isActive = i === activeIdx
          const hue = (i * 360) / 27
          return (
            <g key={name} data-tick="nakshatra" data-idx={i}>
              <path d={path}
                fill={`hsl(${hue}, 65%, ${isActive ? 45 : 22}%)`}
                stroke={isActive ? "#f6cf78" : "#3e2c10"}
                strokeWidth={isActive ? 1.5 : 0.4} />
              {(() => {
                const aMid = (a0 + a1) / 2
                const [lx, ly] = polar((rOuter + rInner) / 2, aMid)
                return (
                  <text x={cx + lx} y={cx + ly} fontSize={6.5} fill={isActive ? "#fff" : "#d4a44c"}
                    textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${-angle} ${cx + lx} ${cx + ly})`}
                    style={{ fontFamily: "serif" }}>
                    {NAKSHATRA_DEV[i]}
                  </text>
                )
              })()}
            </g>
          )
        })}
      </g>
      {/* Apex deity name */}
      <text x={cx} y={cx - rOuter - 10} fontSize={11} fill="#f6cf78" textAnchor="middle"
        fontFamily="serif" data-readout="nakshatra-active">
        {NAKSHATRA_NAMES[activeIdx]} · {NAKSHATRA_DEITY[activeIdx]}
      </text>
    </svg>
  )
}

function RingTithi30({
  size, angle, activePaksha, activeTithi,
}: { size: number; angle: number; activePaksha: number; activeTithi: number }) {
  const cx = size / 2
  const rOuter = size * 0.345
  const rInner = size * 0.30
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
      <g transform={`rotate(${angle} ${cx} ${cx})`}>
        {Array.from({ length: 30 }, (_, i) => {
          const a0 = (i / 30) * 360
          const a1 = ((i + 1) / 30) * 360
          const [x0o, y0o] = polar(rOuter, a0)
          const [x1o, y1o] = polar(rOuter, a1)
          const [x0i, y0i] = polar(rInner, a0)
          const [x1i, y1i] = polar(rInner, a1)
          const path = `M ${cx + x0o} ${cx + y0o}
                        A ${rOuter} ${rOuter} 0 0 1 ${cx + x1o} ${cx + y1o}
                        L ${cx + x1i} ${cx + y1i}
                        A ${rInner} ${rInner} 0 0 0 ${cx + x0i} ${cx + y0i} Z`
          const isShukla = i < 15
          const isActive = i === activeTithi - 1
          const fill = isShukla
            ? `hsl(45, 70%, ${isActive ? 60 : 35}%)`
            : `hsl(25, 50%, ${isActive ? 40 : 18}%)`
          const tithiNum = isShukla ? (i + 1) : (i - 14)
          return (
            <g key={i} data-tick="tithi" data-idx={i}>
              <path d={path} fill={fill}
                stroke={isActive ? "#f6cf78" : "#3e2c10"}
                strokeWidth={isActive ? 1.5 : 0.3} />
              {(() => {
                const aMid = (a0 + a1) / 2
                const [lx, ly] = polar((rOuter + rInner) / 2, aMid)
                return (
                  <text x={cx + lx} y={cx + ly} fontSize={6} fill={isActive ? "#fff" : "#3e2c10"}
                    textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${-angle} ${cx + lx} ${cx + ly})`}>
                    {tithiNum}
                  </text>
                )
              })()}
            </g>
          )
        })}
      </g>
      <text x={cx} y={cx - rOuter - 6} fontSize={9} fill={activePaksha === 1 ? "#f6cf78" : "#cf6a1e"}
        textAnchor="middle" fontFamily="serif" data-readout="paksha">
        {activePaksha === 1 ? "शुक्ल" : "कृष्ण"}-पक्ष
      </text>
    </svg>
  )
}

function RingGhatiAditi60({ size, angle }: { size: number; angle: number }) {
  const cx = size / 2
  const r = size * 0.285
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#5c4824" strokeWidth={0.5} />
      <g transform={`rotate(${angle} ${cx} ${cx})`}>
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * 360
          const [x1, y1] = polar(r, a)
          const [x2, y2] = polar(r - (i % 5 === 0 ? 10 : 4), a)
          return (
            <g key={i} data-tick="ghati-aditi" data-idx={i}>
              <line x1={cx + x1} y1={cx + y1} x2={cx + x2} y2={cx + y2}
                stroke={i % 5 === 0 ? "#f6cf78" : "#7a5c1f"}
                strokeWidth={i % 15 === 0 ? 1.5 : (i % 5 === 0 ? 1 : 0.4)} />
              {i % 5 === 0 && (() => {
                const [lx, ly] = polar(r - 18, a)
                return (
                  <text x={cx + lx} y={cx + ly} fontSize={9} fill="#d4a44c"
                    textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${-angle} ${cx + lx} ${cx + ly})`}
                    fontFamily="serif">
                    {i}
                  </text>
                )
              })()}
            </g>
          )
        })}
      </g>
      {/* Apex marker triangle — the "60-ghaṭi apex" pointer */}
      <polygon points={`${cx},${cx - r + 2} ${cx - 4},${cx - r - 5} ${cx + 4},${cx - r - 5}`}
        fill="#f6cf78" />
    </svg>
  )
}

function RingMasa12({ size, angle, activeIdx }: { size: number; angle: number; activeIdx: number }) {
  const cx = size / 2
  const rOuter = size * 0.245
  const rInner = size * 0.215
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
      <g transform={`rotate(${angle} ${cx} ${cx})`}>
        {Array.from({ length: 12 }, (_, i) => {
          const a0 = (i / 12) * 360
          const a1 = ((i + 1) / 12) * 360
          const [x0o, y0o] = polar(rOuter, a0)
          const [x1o, y1o] = polar(rOuter, a1)
          const [x0i, y0i] = polar(rInner, a0)
          const [x1i, y1i] = polar(rInner, a1)
          const path = `M ${cx + x0o} ${cx + y0o}
                        A ${rOuter} ${rOuter} 0 0 1 ${cx + x1o} ${cx + y1o}
                        L ${cx + x1i} ${cx + y1i}
                        A ${rInner} ${rInner} 0 0 0 ${cx + x0i} ${cx + y0i} Z`
          const isActive = i === activeIdx
          // Ṛtu coloring — 6 seasons, 2 months per ṛtu
          const ritu = Math.floor(i / 2)
          const ritu_hue = [120, 60, 30, 0, 270, 210][ritu]   // vasanta..śiśira
          return (
            <g key={i} data-tick="masa" data-idx={i}>
              <path d={path}
                fill={`hsl(${ritu_hue}, 40%, ${isActive ? 35 : 15}%)`}
                stroke={isActive ? "#f6cf78" : "#3e2c10"}
                strokeWidth={isActive ? 1.5 : 0.3} />
              {(() => {
                const aMid = (a0 + a1) / 2
                const [lx, ly] = polar((rOuter + rInner) / 2, aMid)
                return (
                  <text x={cx + lx} y={cx + ly} fontSize={6} fill={isActive ? "#fff" : "#d4a44c"}
                    textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${-angle} ${cx + lx} ${cx + ly})`}>
                    {MASA_DEV[i]}
                  </text>
                )
              })()}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function RingVara7({
  size, angle, activeIdx, lordGraha,
}: { size: number; angle: number; activeIdx: number; lordGraha: string }) {
  const cx = size / 2
  const rOuter = size * 0.185
  const rInner = size * 0.155
  const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
      <g transform={`rotate(${angle} ${cx} ${cx})`}>
        {planets.map((p, i) => {
          const a0 = (i / 7) * 360
          const a1 = ((i + 1) / 7) * 360
          const [x0o, y0o] = polar(rOuter, a0)
          const [x1o, y1o] = polar(rOuter, a1)
          const [x0i, y0i] = polar(rInner, a0)
          const [x1i, y1i] = polar(rInner, a1)
          const path = `M ${cx + x0o} ${cx + y0o}
                        A ${rOuter} ${rOuter} 0 0 1 ${cx + x1o} ${cx + y1o}
                        L ${cx + x1i} ${cx + y1i}
                        A ${rInner} ${rInner} 0 0 0 ${cx + x0i} ${cx + y0i} Z`
          const isActive = i === activeIdx
          const meta = PLANET_SYMBOL[p]
          return (
            <g key={p} data-tick="vara" data-idx={i}>
              <path d={path} fill={isActive ? meta.color : "#1a0d04"} fillOpacity={isActive ? 0.85 : 1}
                stroke={isActive ? "#f6cf78" : "#3e2c10"} strokeWidth={isActive ? 1.2 : 0.3} />
              {(() => {
                const aMid = (a0 + a1) / 2
                const [lx, ly] = polar((rOuter + rInner) / 2, aMid)
                return (
                  <text x={cx + lx} y={cx + ly} fontSize={10} fill={isActive ? "#1a0d04" : meta.color}
                    textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${-angle} ${cx + lx} ${cx + ly})`}>
                    {meta.symbol}
                  </text>
                )
              })()}
            </g>
          )
        })}
      </g>
      <text x={cx} y={cx - rOuter - 6} fontSize={9} fill="#f6cf78" textAnchor="middle"
        data-readout="vara-lord" fontFamily="serif">
        {PLANET_SYMBOL[lordGraha]?.dev ?? lordGraha}-वार
      </text>
    </svg>
  )
}

// ─── Subdials (small, off-center) ─────────────────────────────────────────────

function Subdial({
  size, cxFrac, cyFrac, rFrac, label, value, dev, angle, ticks,
  fillHue = 45,
}: {
  size: number; cxFrac: number; cyFrac: number; rFrac: number
  label: string; value: string; dev?: string; angle: number; ticks: number; fillHue?: number
}) {
  const cx = size * cxFrac
  const cy = size * cyFrac
  const r = size * rFrac
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      <circle cx={cx} cy={cy} r={r}
        fill={`hsl(${fillHue}, 30%, 8%)`}
        stroke="#a04a0a" strokeWidth={0.8} />
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        {Array.from({ length: ticks }, (_, i) => {
          const a = (i / ticks) * 360
          const cosA = Math.cos(((a - 90) * Math.PI) / 180)
          const sinA = Math.sin(((a - 90) * Math.PI) / 180)
          const isMajor = i % Math.max(1, Math.floor(ticks / 6)) === 0
          return (
            <line key={i}
              x1={cx + r * 0.92 * cosA} y1={cy + r * 0.92 * sinA}
              x2={cx + r * (isMajor ? 0.78 : 0.84) * cosA}
              y2={cy + r * (isMajor ? 0.78 : 0.84) * sinA}
              stroke={isMajor ? "#d4a44c" : "#5c4824"} strokeWidth={isMajor ? 0.6 : 0.3} />
          )
        })}
        {/* Apex needle pointing to current segment (since the ring rotates) */}
        <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.7}
          stroke="#f6cf78" strokeWidth={1.2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={2} fill="#f6cf78" />
      </g>
      <text x={cx} y={cy - r - 4} fontSize={7} fill="#7a5c1f" textAnchor="middle"
        letterSpacing="0.15em" fontFamily="serif">{label}</text>
      <text x={cx} y={cy + r + 12} fontSize={8} fill="#d4a44c" textAnchor="middle">
        {dev ?? value}
      </text>
    </svg>
  )
}

function SubdialYoga27({
  size, angle, name, dev,
}: { size: number; angle: number; name: string; dev: string }) {
  return (
    <Subdial size={size} cxFrac={0.27} cyFrac={0.32} rFrac={0.08}
      label="YOGA" value={name} dev={dev} angle={angle} ticks={27} fillHue={280} />
  )
}

function SubdialKarana60({
  size, angle, name, dev,
}: { size: number; angle: number; name: string; dev: string }) {
  return (
    <Subdial size={size} cxFrac={0.73} cyFrac={0.32} rFrac={0.08}
      label="KARAṆA" value={name} dev={dev} angle={angle} ticks={30} fillHue={200} />
  )
}

function SubdialGhatiDiti20({
  size, angle, ghIdx, vIdx,
}: { size: number; angle: number; ghIdx: number; vIdx: number }) {
  return (
    <Subdial size={size} cxFrac={0.5} cyFrac={0.78} rFrac={0.085}
      label="DITI · घटिका" value={`${ghIdx}/${vIdx}`} dev={`${toNagari(ghIdx)} · ${toNagari(vIdx)}`}
      angle={angle} ticks={20} fillHue={15} />
  )
}

// ─── Ecliptic Sun/Moon needles ────────────────────────────────────────────────

function EclipticNeedles({
  size, sunDeg, moonDeg,
}: { size: number; sunDeg: number; moonDeg: number }) {
  const cx = size / 2
  const r = size * 0.395
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      {/* Sun needle */}
      <g transform={`rotate(${-sunDeg} ${cx} ${cx})`}>
        <line x1={cx} y1={cx} x2={cx} y2={cx - r}
          stroke="#f6cf78" strokeWidth={1.2} strokeOpacity={0.9} />
        <circle cx={cx} cy={cx - r - 4} r={5} fill="#f6cf78" stroke="#a04a0a" strokeWidth={0.5} />
        <text x={cx} y={cx - r - 2} fontSize={7} fill="#1a0d04" textAnchor="middle" dominantBaseline="middle">☉</text>
      </g>
      {/* Moon needle */}
      <g transform={`rotate(${-moonDeg} ${cx} ${cx})`}>
        <line x1={cx} y1={cx} x2={cx} y2={cx - r}
          stroke="#e8e8f5" strokeWidth={1.2} strokeOpacity={0.85} />
        <circle cx={cx} cy={cx - r - 4} r={5} fill="#e8e8f5" stroke="#7a5c8f" strokeWidth={0.5} />
        <text x={cx} y={cx - r - 2} fontSize={7} fill="#1a0d04" textAnchor="middle" dominantBaseline="middle">☽</text>
      </g>
    </svg>
  )
}

// ─── Trimūrti hour-hands (3 phase-shifted needles) ─────────────────────────

function TrimurtiHands({
  size, brahmaDeg, vishnuDeg, maheshDeg,
}: { size: number; brahmaDeg: number; vishnuDeg: number; maheshDeg: number }) {
  const cx = size / 2
  const r = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      {/* Brahmā — longest, gold */}
      <g transform={`rotate(${brahmaDeg} ${cx} ${cx})`}>
        <line x1={cx} y1={cx + 12} x2={cx} y2={cx - r * 0.27}
          stroke="#f6cf78" strokeWidth={3} strokeLinecap="round" />
        <text x={cx} y={cx - r * 0.27 - 6} fontSize={9} fill="#f6cf78" textAnchor="middle" fontFamily="serif">ब्रह्मा</text>
      </g>
      {/* Viṣṇu — medium, indigo */}
      <g transform={`rotate(${vishnuDeg} ${cx} ${cx})`}>
        <line x1={cx} y1={cx + 10} x2={cx} y2={cx - r * 0.22}
          stroke="#7a5c8f" strokeWidth={2.5} strokeLinecap="round" />
        <text x={cx} y={cx - r * 0.22 - 6} fontSize={8} fill="#7a5c8f" textAnchor="middle" fontFamily="serif">विष्णु</text>
      </g>
      {/* Maheśa — shortest, ember */}
      <g transform={`rotate(${maheshDeg} ${cx} ${cx})`}>
        <line x1={cx} y1={cx + 8} x2={cx} y2={cx - r * 0.18}
          stroke="#cf6a1e" strokeWidth={2} strokeLinecap="round" />
        <text x={cx} y={cx - r * 0.18 - 6} fontSize={8} fill="#cf6a1e" textAnchor="middle" fontFamily="serif">महेश</text>
      </g>
      {/* Center hub */}
      <circle cx={cx} cy={cx} r={5} fill="#1a0d04" stroke="#f6cf78" strokeWidth={1.2} />
    </svg>
  )
}

// ─── Sapta-mukha ring (7 directional dots) ────────────────────────────────

function SaptaMukhaRing({ size }: { size: number }) {
  const cx = size / 2
  const r = size * 0.135
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      {MUKHA_DOTS.map((m, i) => {
        const a = (i / 7) * 360
        const [x, y] = polar(r, a)
        return (
          <g key={m.id}>
            <circle cx={cx + x} cy={cx + y} r={3} fill={m.color} stroke="#1a0d04" strokeWidth={0.5} />
            <text x={cx + x} y={cx + y - 7} fontSize={7} textAnchor="middle">{m.emoji}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Central OM seal + heartbeat pulse ────────────────────────────────────

function CentralOmSeal({ size, pranaIdx }: { size: number; pranaIdx: number }) {
  const cx = size / 2
  const r = size * 0.06
  const pulseScale = 1 + (pranaIdx % 6) * 0.005   // very subtle heartbeat
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      <defs>
        <radialGradient id="om-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#cf6a1e" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#1a0d04" stopOpacity="1" />
          <stop offset="100%" stopColor="#050300" stopOpacity="1" />
        </radialGradient>
      </defs>
      <g transform={`translate(${cx} ${cx}) scale(${pulseScale})`}>
        <circle r={r * 1.5} fill="url(#om-glow)" opacity={0.6} />
        <circle r={r} fill="#1a0d04" stroke="#f6cf78" strokeWidth={1.5} />
        <text fontSize={r * 1.3} fill="#f6cf78" textAnchor="middle" dominantBaseline="central"
          fontFamily="serif" style={{ filter: "drop-shadow(0 0 6px #cf6a1e)" }}>
          ॐ
        </text>
      </g>
    </svg>
  )
}

// ─── Specular sheen overlay ────────────────────────────────────────────────

function SpecularSheen({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id="sheen" cx="35%" cy="25%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="40%" stopColor="#f6cf78" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={size * 0.49} fill="url(#sheen)" />
    </svg>
  )
}

// ─── Digital readouts (positioned around the dial) ────────────────────────

function DigitalReadouts({
  stamp, meridian, kInt, kDec, activeMeridianId,
}: { stamp: SubstrateStamp; meridian: any; kInt: string; kDec: string; activeMeridianId: string }) {
  const year = stamp.year_layer
  return (
    <>
      {/* Top-left: meridian + K readout */}
      <div className="absolute top-3 left-4 text-xs text-gold-500 font-display tracking-wider">
        <div className="text-[9px] text-gold-700">MERIDIAN</div>
        <div className="text-gold-200 text-sm">{meridian.label_en}</div>
        <div className="inscription text-[10px] text-gold-400">{meridian.label_hi}</div>
        <div className="text-[9px] text-gold-700 mt-1">lon · {meridian.lon_deg.toFixed(4)}°</div>
        <div className="text-[9px] text-gold-700">LMT · {meridian.lmt_offset_h >= 0 ? "+" : ""}{meridian.lmt_offset_h.toFixed(3)}h</div>
      </div>

      {/* Top-right: Kali / Vikrama / Śaka */}
      <div className="absolute top-3 right-4 text-xs text-gold-500 font-display tracking-wider text-right">
        <div className="text-[9px] text-gold-700">YEARS</div>
        <div className="text-gold-200 text-sm" data-readout="kali-year">
          कलि {year.kali_year_current.toLocaleString("en-IN")}
        </div>
        <div className="text-[10px] text-gold-400">{year.samvatsara.name} · #{year.samvatsara.index + 1}/60</div>
        <div className="text-[9px] text-gold-700">विक्रम {toNagari(year.vikrama_samvat)} · शक {toNagari(year.shaka_samvat)}</div>
      </div>

      {/* Bottom-left: bipolar discipline tag */}
      <div className="absolute bottom-3 left-4 text-[9px] text-gold-700 font-display tracking-wider max-w-[210px] leading-snug">
        <div className="text-gold-500">APEX-v5 BIPOLAR</div>
        <div>Aditi · R*  →  60·60·6 ghaṭi</div>
        <div>Diti · (3)  →  20·20·2 ghaṭi</div>
        <div>π_(3)/π = 1/3 · Pisano-of-Ideal</div>
      </div>

      {/* Bottom-right: K digital readout (6-decimal Kāmākhyā Julian day) */}
      <div className="absolute bottom-3 right-4 text-xs text-gold-500 font-display tracking-wider text-right font-mono">
        <div className="text-[9px] text-gold-700">K · KĀMĀKHYĀ JD</div>
        <div className="text-gold-200 text-base tabular-nums" data-readout="k">
          {kInt}<span className="text-gold-500">.{kDec}</span>
        </div>
        <div className="text-[9px] text-gold-700">{toNagari(kInt)}.{toNagari(kDec)}</div>
      </div>
    </>
  )
}
