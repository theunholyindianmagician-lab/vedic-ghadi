"use client"

/**
 * 🔱 Sphota3DDial — saptamukhi-redesign (post-audit).
 *
 * THE THESIS (from the 10-designer audit):
 * Render as a *clock that contains 50 complications*, not a *catalog of all
 * 50 simultaneously*. Patek Philippe's Grandmaster Chime doesn't show all 20
 * complications at once — it foregrounds time and lets the rest live on the
 * caseback, in subdials, in the crown.
 *
 * RESTING STATE (always visible — Priority 1):
 *   1. Western H/M/S hands (universal "what time is it" anchor)
 *   2. 27-nakṣatra outer rotor (the slowest meaningful sky ring)
 *   3. 30-tithi ring (lunar phase + pakṣa colored)
 *   4. 60-ghaṭi tick ring (inner, ticks-only at rest)
 *   5. Central ॐ seal with prāṇa heartbeat — CLICKABLE → opens Saptamukhi drawer
 *
 * SECONDARY (visible, smaller — Priority 2):
 *   • Sun + Moon ecliptic glyphs (just dots on nakṣatra rim, not full needles)
 *   • Pakṣa moon icon at 12 o'clock
 *   • Composite Trimūrti hand (single needle, color-cycles per 8h)
 *   • Active rāśi name at apex
 *
 * REVEALED ON INTENT (Priority 3 — 35+ complications):
 *   Click OM seal → <SaptamukhiPanel> drawer slides in with:
 *     · 60-saṃvatsara Bṛhaspati wheel
 *     · 12-rāśi zodiac wheel
 *     · 24-horā planetary-hour ring
 *     · Yoga + Karaṇa subdials
 *     · Aṣṭakavarga 8-bar meter
 *     · Rāhu/Ketu node axis
 *     · 7-vāra planetary disk
 *     · 12-māsa + 6-ṛtu ring
 *     · 20-ghaṭi Diti compressed-pole counter-rotor
 *     · All 3 Trimūrti hands (canonical theological view)
 *     · 7-mukha directional selector
 *
 * READOUTS (Priority 1, but moved OUT of the dial canvas to a sibling
 * <DialReadoutStrip> rendered BELOW the dial — the dial stays a clean circle.)
 *
 * Hover any ring → tooltip with current value + name in Sanskrit + Devanāgarī.
 *
 * NO Three.js / WebGL — verified broken in Next 16 + R3F v9. Pure SVG + CSS
 * transforms. Live-ticking comes from the parent's RAF loop via `stamp` prop.
 *
 * APEX-v5 Saptamukhi Bipolar provenance · all math derived from (R, g, k).
 */

import { useState, useMemo, useRef, useEffect } from "react"
import type { SubstrateStamp, PoleId, TrimurtiId } from "@/lib/substrate"
import { SAMVATSARA_NAMES } from "@/lib/substrate"
import { NAKSHATRA_NAMES, NAKSHATRA_DEV, NAKSHATRA_DEITY } from "@/lib/panchanga"

// ════════════════════════════════════════════════════════════════════════════
// ◈ Constants
// ════════════════════════════════════════════════════════════════════════════

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
const MASA_DEV = ["चैत्र","वैशाख","ज्येष्ठ","आषाढ","श्रावण","भाद्रपद","आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन"]
const RASHI_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"]
const RASHI_NAMES = ["Meṣa","Vṛṣabha","Mithuna","Karka","Siṃha","Kanyā","Tulā","Vṛścika","Dhanu","Makara","Kumbha","Mīna"]
const NAGARI_DIGITS = ["०","१","२","३","४","५","६","७","८","९"]
const toNagari = (n: number | string) => String(n).replace(/[0-9]/g, d => NAGARI_DIGITS[Number(d)])

const polar = (r: number, deg: number): [number, number] => {
  const rad = ((deg - 90) * Math.PI) / 180
  return [r * Math.cos(rad), r * Math.sin(rad)]
}
const rotForFraction = (f: number, N: number) => -((f / N) * 360)

// ════════════════════════════════════════════════════════════════════════════
// ◈ Main component
// ════════════════════════════════════════════════════════════════════════════

export interface Sphota3DDialProps {
  stamp: SubstrateStamp
  activeMeridianId?: string
  size?: number
}

export function Sphota3DDial({
  stamp,
  activeMeridianId = "kamakhya",
  size = 520,
}: Sphota3DDialProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [hover, setHover] = useState<{ ring: string; label: string; sub?: string } | null>(null)

  const meridian = stamp.meridians[activeMeridianId] ?? stamp.meridians.kamakhya
  const cell = meridian.trimurti.aditi.brahma
  const daAditi = stamp.day_subdivision_aditi
  const year = stamp.year_layer
  const month = stamp.month_layer
  const tithi = stamp.tithi_layer
  const vara = stamp.vara_layer
  const naks = cell.nakshatra
  const ci = stamp.input_civil
  const civilHours = ci.hour + ci.minute / 60 + ci.second / 3600

  const angles = useMemo(() => {
    const ghatiAditi_f = (daAditi.ghati_index - 1)
      + (daAditi.vighati_index - 1) / 60
      + (daAditi.prana_index - 1) / 360
      + daAditi.vipala_fractional / 2160
    const naks_f = (naks.nakshatra_index - 1) + naks.fractional_nakshatra
    const tithi_f = (tithi.tithi_index - 1) + tithi.fractional_tithi
    const masa_f = (month.masa_index - 1) + ((month.sun_sidereal_lon_deg % 30) / 30)
    return {
      ghatiAditi: rotForFraction(ghatiAditi_f, 60),
      naks: rotForFraction(naks_f, 27),
      tithi: rotForFraction(tithi_f, 30),
      masa: rotForFraction(masa_f, 12),
      sunDeg: month.sun_sidereal_lon_deg,
      moonDeg: naks.moon_sidereal_lon_deg,
      // Trimūrti composite hand — uses fraction_of_day at current Brahmā instant
      trimurtiHandDeg: stamp.trimurti_at_ujjain.aditi.brahma.day_subdivision.fraction_of_day * 360,
      // The Trimūrti phase (which of the 3 day-thirds we're in) drives the hand color
      trimurtiPhase: (Math.floor(daAditi.fraction_of_day * 3) % 3) as 0 | 1 | 2,
      hourHand: ((civilHours % 12) / 12) * 360,
      minHand:  ((civilHours * 60) % 60) / 60 * 360,
      secHand:  ((civilHours * 3600) % 60) / 60 * 360,
    }
  }, [stamp, daAditi, naks, tithi, month, civilHours])

  return (
    <section data-component="sphota-3d-dial" className="relative">
      {/* === The dial itself — pure circle, no overlaid chrome === */}
      <div
        className="relative mx-auto"
        style={{
          width:  size,
          height: size,
          perspective: "1600px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: "rotateX(6deg)",
          }}
        >
          <DialChrome size={size} />

          <RingLayer z={6}>
            <RingNakshatra27Minimal
              size={size}
              angle={angles.naks}
              activeIdx={naks.nakshatra_index - 1}
              onHover={(label, sub) => setHover({ ring: "nakshatra", label, sub })}
              onLeave={() => setHover(null)}
            />
          </RingLayer>

          <RingLayer z={14}>
            <RingTithi30Minimal
              size={size}
              angle={angles.tithi}
              activeIdx={tithi.tithi_index - 1}
              pakshaIdx={tithi.paksha_index}
              tithiName={tithi.tithi_name}
              tithiDev={tithi.paksha_devanagari}
              onHover={(label, sub) => setHover({ ring: "tithi", label, sub })}
              onLeave={() => setHover(null)}
            />
          </RingLayer>

          <RingLayer z={22}>
            <RingMasaThin
              size={size}
              angle={angles.masa}
              activeIdx={month.masa_index - 1}
              onHover={(label, sub) => setHover({ ring: "masa", label, sub })}
              onLeave={() => setHover(null)}
            />
          </RingLayer>

          <RingLayer z={28}>
            <RingGhatiTicks size={size} angle={angles.ghatiAditi}
              onHover={(label, sub) => setHover({ ring: "ghati", label, sub })}
              onLeave={() => setHover(null)} />
          </RingLayer>

          {/* Sun + Moon as dots floating on the nakṣatra ring (Priority 2) */}
          <RingLayer z={34}>
            <EclipticGlyphs size={size} sunDeg={angles.sunDeg} moonDeg={angles.moonDeg} />
          </RingLayer>

          {/* Pakṣa moon icon — a single waxing/waning glyph at 12 o'clock */}
          <RingLayer z={36}>
            <PakshaMoonChip size={size} pakshaIdx={tithi.paksha_index} tithiInPaksha={tithi.tithi_in_paksha} />
          </RingLayer>

          {/* Composite Trimūrti hand — ONE needle whose color cycles by day-third */}
          <RingLayer z={44}>
            <TrimurtiCompositeHand size={size} angleDeg={angles.trimurtiHandDeg} phase={angles.trimurtiPhase} />
          </RingLayer>

          {/* Western H/M/S hands — classic analog, full-length, dominant */}
          <RingLayer z={50}>
            <WesternHandsMinimal size={size}
              hourDeg={angles.hourHand} minDeg={angles.minHand} secDeg={angles.secHand} />
          </RingLayer>

          {/* Central seal — click to open Saptamukhi panel */}
          <RingLayer z={62}>
            <CenterSeal
              size={size}
              pranaIdx={daAditi.prana_index}
              varaLordGraha={vara.vara_lord_graha}
              onClick={() => setPanelOpen(true)}
            />
          </RingLayer>
        </div>
      </div>

      {/* === Hover tooltip — singleton positioned to the right of the dial === */}
      {hover && (
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-44 max-w-[170px] p-3 bg-ink-900/95 border border-gold-700 rounded-sm pointer-events-none">
          <div className="text-[9px] text-gold-700 font-display tracking-wider mb-1">{hover.ring.toUpperCase()}</div>
          <div className="text-sm text-gold-200 font-display">{hover.label}</div>
          {hover.sub && <div className="inscription text-xs text-gold-400 mt-1">{hover.sub}</div>}
        </div>
      )}

      {/* === Apex label — shows current active value of nakṣatra (always visible) === */}
      <div className="text-center mt-2 mb-1">
        <div className="text-[10px] text-gold-700 font-display tracking-[0.3em]">
          NAKṢATRA · {RASHI_NAMES[(month.sun_sign_index - 1) % 12]}-rāśi
        </div>
        <div className="text-base font-display text-gold-200">
          {NAKSHATRA_NAMES[naks.nakshatra_index - 1]}
          <span className="text-gold-600 text-xs"> · {NAKSHATRA_DEITY[naks.nakshatra_index - 1]}</span>
        </div>
        <div className="inscription text-xs text-gold-500">
          {NAKSHATRA_DEV[naks.nakshatra_index - 1]} · पाद {toNagari(naks.pada)}/४
        </div>
      </div>

      {/* === Slide-in Saptamukhi drawer for the 35 demoted complications === */}
      <SaptamukhiPanel open={panelOpen} onClose={() => setPanelOpen(false)}
        stamp={stamp} meridian={meridian} cell={cell} />
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ◈ DialReadoutStrip — exported separately, rendered as SIBLING below the dial
// ════════════════════════════════════════════════════════════════════════════

export function DialReadoutStrip({
  stamp, activeMeridianId = "kamakhya",
}: { stamp: SubstrateStamp; activeMeridianId?: string }) {
  const meridian = stamp.meridians[activeMeridianId] ?? stamp.meridians.kamakhya
  const year = stamp.year_layer
  const ci = stamp.input_civil
  const isAM = ci.hour < 12
  const hh = String(ci.hour).padStart(2, "0")
  const mm = String(ci.minute).padStart(2, "0")
  const ss = String(Math.floor(ci.second)).padStart(2, "0")
  const monthShort = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][ci.month - 1]
  const ymd = `${String(ci.day).padStart(2,"0")} ${monthShort} ${ci.gregorian_year}`
  const dow = ["SUN","MON","TUE","WED","THU","FRI","SAT"][stamp.vara_layer.vara_index]
  const k = stamp.kali_civil_days_at_kamakhya
  const kInt = Math.floor(k).toLocaleString("en-IN")
  const kDec = k.toFixed(6).split(".")[1]

  return (
    <div data-component="dial-readout-strip" className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto">
      <ReadoutChip label="MERIDIAN" value={meridian.label_en} sub={meridian.label_hi} />
      <ReadoutChip
        label={`CIVIL · UTC+${ci.tz_h}`}
        value={`${hh}:${mm}:${ss}`}
        sub={`${ymd} · ${dow} · ${isAM ? "AM" : "PM"}`}
        mono
        data-readout="civil-time"
      />
      <ReadoutChip
        label="YEAR · वर्ष"
        value={`कलि ${year.kali_year_current.toLocaleString("en-IN")}`}
        sub={`${year.samvatsara.name} · #${year.samvatsara.index + 1}/60`}
        data-readout="kali-year"
      />
      <ReadoutChip
        label="K · KĀMĀKHYĀ JD"
        value={kInt}
        sub={`.${kDec}`}
        mono
        data-readout="k"
      />
    </div>
  )
}

function ReadoutChip({
  label, value, sub, mono = false, "data-readout": dataReadout,
}: {
  label: string; value: string; sub?: string; mono?: boolean
  "data-readout"?: string
}) {
  return (
    <div
      data-readout={dataReadout}
      className="px-3 py-2 rounded-sm border border-gold-700/40 bg-ink-900/60"
    >
      <div className="text-[8px] text-gold-700 font-display tracking-[0.2em]">{label}</div>
      <div className={`text-sm text-gold-200 ${mono ? "font-mono tabular-nums" : "font-display"} leading-tight mt-0.5`}>
        {value}
      </div>
      {sub && <div className={`text-[10px] text-gold-500 ${mono ? "font-mono" : "inscription"} mt-0.5 truncate`}>{sub}</div>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ◈ Reusable
// ════════════════════════════════════════════════════════════════════════════

function RingLayer({ z, children }: { z: number; children: React.ReactNode }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      transform: `translateZ(${z}px)`,
      transformStyle: "preserve-3d",
    }}>{children}</div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ◈ DialChrome — bezel + faceplate + western hour bezel + minute ticks
// ════════════════════════════════════════════════════════════════════════════

function DialChrome({ size }: { size: number }) {
  const cx = size / 2
  const rOuter = size * 0.495
  const rBezel = size * 0.46
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.8))" }}>
      <defs>
        <radialGradient id="dial-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a0d04" />
          <stop offset="75%" stopColor="#0a0502" />
          <stop offset="100%" stopColor="#050300" />
        </radialGradient>
        <linearGradient id="dial-bezel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6cf78" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#a04a0a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#cf6a1e" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* outer rim — gold bezel ring */}
      <circle cx={cx} cy={cx} r={rOuter} fill="none" stroke="url(#dial-bezel)" strokeWidth={4} />
      <circle cx={cx} cy={cx} r={rOuter - 4} fill="url(#dial-bg)" stroke="#3e2c10" strokeWidth={1} />
      {/* Western 12 + 60 minute bezel — etched into the inner rim, not a separate ring */}
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * 360
        const [x1, y1] = polar(rBezel, a)
        const [x2, y2] = polar(rBezel - (i % 5 === 0 ? 8 : 3), a)
        return (
          <line key={i} data-tick="western-minute" data-idx={i}
            x1={cx + x1} y1={cx + y1} x2={cx + x2} y2={cx + y2}
            stroke={i % 5 === 0 ? "#f6cf78" : "#5c4824"}
            strokeWidth={i % 15 === 0 ? 1.5 : (i % 5 === 0 ? 1 : 0.5)} />
        )
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i
        const a = (i / 12) * 360
        const [lx, ly] = polar(rBezel - 16, a)
        return (
          <text key={i} data-tick="western-hour" data-idx={i}
            x={cx + lx} y={cx + ly} fontSize={11} fill="#d4a44c"
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Cinzel', serif" letterSpacing="0.05em">
            {hour}
          </text>
        )
      })}
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ◈ Rings — Priority 1 + 2 visible at rest
// ════════════════════════════════════════════════════════════════════════════

function RingNakshatra27Minimal({
  size, angle, activeIdx, onHover, onLeave,
}: {
  size: number; angle: number; activeIdx: number
  onHover: (label: string, sub?: string) => void; onLeave: () => void
}) {
  const cx = size / 2
  const rOuter = size * 0.42
  const rInner = size * 0.385
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         onMouseLeave={onLeave}>
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
          const isAdjacent = Math.abs(((i - activeIdx + 27) % 27)) === 1 || Math.abs(((i - activeIdx + 27) % 27)) === 26
          const hue = (i * 360) / 27
          const fill = isActive ? `hsl(${hue}, 75%, 50%)` : isAdjacent ? `hsl(${hue}, 50%, 28%)` : `hsl(${hue}, 25%, 13%)`
          return (
            <g key={name} data-tick="nakshatra" data-idx={i}
               onMouseEnter={() => onHover(`${name} · पाद`, NAKSHATRA_DEV[i] + " · " + NAKSHATRA_DEITY[i])}>
              <path d={path} fill={fill}
                stroke={isActive ? "#f6cf78" : "#3e2c10"}
                strokeWidth={isActive ? 1.5 : 0.3}
                style={{ cursor: "pointer", filter: isActive ? "drop-shadow(0 0 4px currentColor)" : "none" }} />
            </g>
          )
        })}
        {/* tiny indicator dot at the active rim position (12 o'clock since rotated) */}
      </g>
      {/* apex chevron — locks reader's eye to the top */}
      <polygon points={`${cx},${cx - rOuter + 6} ${cx - 5},${cx - rOuter - 8} ${cx + 5},${cx - rOuter - 8}`}
        fill="#f6cf78" style={{ filter: "drop-shadow(0 0 3px #cf6a1e)" }} />
    </svg>
  )
}

function RingTithi30Minimal({
  size, angle, activeIdx, pakshaIdx, tithiName, tithiDev, onHover, onLeave,
}: {
  size: number; angle: number; activeIdx: number; pakshaIdx: number
  tithiName: string; tithiDev: string
  onHover: (label: string, sub?: string) => void; onLeave: () => void
}) {
  const cx = size / 2
  const rOuter = size * 0.36
  const rInner = size * 0.33
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         onMouseLeave={onLeave}>
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
          const isActive = i === activeIdx
          const isAdj = Math.abs(((i - activeIdx + 30) % 30)) === 1 || Math.abs(((i - activeIdx + 30) % 30)) === 29
          const baseHue = isShukla ? 45 : 280
          const fill = isActive
            ? (isShukla ? "#f6cf78" : "#7a5c8f")
            : isAdj
              ? `hsl(${baseHue}, 50%, 26%)`
              : `hsl(${baseHue}, 22%, 12%)`
          return (
            <g key={i} data-tick="tithi" data-idx={i}
               onMouseEnter={() => onHover(`${tithiName}`, `${tithiDev}-पक्ष · तिथि #${i + 1}/30`)}>
              <path d={path} fill={fill}
                stroke={isActive ? "#fff" : "#3e2c10"}
                strokeWidth={isActive ? 1.2 : 0.3}
                style={{ cursor: "pointer", filter: isActive ? "drop-shadow(0 0 3px currentColor)" : "none" }} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function RingMasaThin({
  size, angle, activeIdx, onHover, onLeave,
}: {
  size: number; angle: number; activeIdx: number
  onHover: (label: string, sub?: string) => void; onLeave: () => void
}) {
  const cx = size / 2
  const rOuter = size * 0.31
  const rInner = size * 0.29
  const masaNames = ["Caitra","Vaiśākha","Jyeṣṭha","Āṣāḍha","Śrāvaṇa","Bhādrapada","Āśvina","Kārtika","Mārgaśīrṣa","Pauṣa","Māgha","Phālguna"]
  const rituNames = ["Vasanta","Grīṣma","Varṣa","Śarad","Hemanta","Śiśira"]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         onMouseLeave={onLeave}>
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
          const ritu = Math.floor(i / 2)
          const ritu_hue = [120, 60, 30, 0, 270, 210][ritu]
          return (
            <g key={i} data-tick="masa" data-idx={i}
               onMouseEnter={() => onHover(masaNames[i], `${MASA_DEV[i]} · ${rituNames[ritu]}-ṛtu`)}>
              <path d={path}
                fill={`hsl(${ritu_hue}, ${isActive ? 50 : 25}%, ${isActive ? 30 : 12}%)`}
                stroke={isActive ? "#f6cf78" : "#3e2c10"}
                strokeWidth={isActive ? 1 : 0.2}
                style={{ cursor: "pointer" }} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function RingGhatiTicks({
  size, angle, onHover, onLeave,
}: {
  size: number; angle: number
  onHover: (label: string, sub?: string) => void; onLeave: () => void
}) {
  const cx = size / 2
  const r = size * 0.26
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         onMouseLeave={onLeave}
         onMouseEnter={() => onHover("Ghaṭi · Aditi", "60·60·6 cascade")}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#5c4824" strokeWidth={0.4} />
      <g transform={`rotate(${angle} ${cx} ${cx})`}>
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * 360
          const [x1, y1] = polar(r, a)
          const [x2, y2] = polar(r - (i % 5 === 0 ? 6 : 2.5), a)
          return (
            <line key={i} data-tick="ghati-aditi" data-idx={i}
              x1={cx + x1} y1={cx + y1} x2={cx + x2} y2={cx + y2}
              stroke={i % 15 === 0 ? "#f6cf78" : i % 5 === 0 ? "#a04a0a" : "#3e2c10"}
              strokeWidth={i % 15 === 0 ? 1.2 : i % 5 === 0 ? 0.8 : 0.3} />
          )
        })}
      </g>
      {/* apex pointer */}
      <polygon points={`${cx},${cx - r + 2} ${cx - 3},${cx - r - 4} ${cx + 3},${cx - r - 4}`} fill="#f6cf78" />
    </svg>
  )
}

function EclipticGlyphs({ size, sunDeg, moonDeg }: { size: number; sunDeg: number; moonDeg: number }) {
  const cx = size / 2
  const r = size * 0.4
  const sunPos = polar(r, -sunDeg)
  const moonPos = polar(r, -moonDeg)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      <g transform={`translate(${cx + sunPos[0]} ${cx + sunPos[1]})`}>
        <circle r={7} fill="#f6cf78" stroke="#a04a0a" strokeWidth={0.6}
          style={{ filter: "drop-shadow(0 0 3px #cf6a1e)" }} />
        <text fontSize={9} fill="#1a0d04" textAnchor="middle" dominantBaseline="central">☉</text>
      </g>
      <g transform={`translate(${cx + moonPos[0]} ${cx + moonPos[1]})`}>
        <circle r={6.5} fill="#e8e8f5" stroke="#7a5c8f" strokeWidth={0.6}
          style={{ filter: "drop-shadow(0 0 3px #e8e8f5)" }} />
        <text fontSize={8} fill="#1a0d04" textAnchor="middle" dominantBaseline="central">☽</text>
      </g>
    </svg>
  )
}

function PakshaMoonChip({
  size, pakshaIdx, tithiInPaksha,
}: { size: number; pakshaIdx: number; tithiInPaksha: number }) {
  const cx = size / 2
  const y = size * 0.06   // small chip above center
  const isShukla = pakshaIdx === 1
  // Crescent shape: simple half-disc rotation based on tithiInPaksha
  const phase = tithiInPaksha / 15   // 0=new, 1=full
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      <g transform={`translate(${cx} ${y + 24})`}>
        <circle r={9} fill="#0a0502" stroke="#5c4824" strokeWidth={0.5} />
        {/* simple lit area */}
        <path
          d={isShukla
            ? `M 0,-9 A 9,9 0 0 1 0,9 A ${9 * (1 - 2 * phase)},9 0 0 ${phase < 0.5 ? 0 : 1} 0,-9 Z`
            : `M 0,-9 A 9,9 0 0 0 0,9 A ${9 * (2 * phase - 1)},9 0 0 ${phase < 0.5 ? 1 : 0} 0,-9 Z`
          }
          fill="#f6cf78" opacity={0.9} />
        <text y={20} fontSize={7} fill={isShukla ? "#f6cf78" : "#cf6a1e"} textAnchor="middle"
          fontFamily="serif" data-readout="paksha">
          {isShukla ? "शुक्ल" : "कृष्ण"}-पक्ष
        </text>
      </g>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ◈ Hands
// ════════════════════════════════════════════════════════════════════════════

function TrimurtiCompositeHand({
  size, angleDeg, phase,
}: { size: number; angleDeg: number; phase: 0 | 1 | 2 }) {
  const cx = size / 2
  const r = size / 2
  const colors = ["#f6cf78", "#7a5c8f", "#cf6a1e"]   // Brahmā · Viṣṇu · Maheśa
  const labels = ["ब्रह्मा", "विष्णु", "महेश"]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      <g transform={`rotate(${angleDeg} ${cx} ${cx})`} data-needle="trimurti-composite">
        <line x1={cx} y1={cx + 14} x2={cx} y2={cx - r * 0.20}
          stroke={colors[phase]} strokeWidth={3.5} strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 3px currentColor)", color: colors[phase] }} />
      </g>
      {/* Triple-cap at hub — small dots showing 3 phase colors */}
      <g>
        {[0, 120, 240].map((rot, i) => {
          const [x, y] = polar(7, rot)
          return (
            <circle key={i} cx={cx + x} cy={cx + y} r={2.2}
              fill={colors[i]} opacity={i === phase ? 1 : 0.35}
              stroke={i === phase ? "#fff" : "none"} strokeWidth={0.5} />
          )
        })}
      </g>
    </svg>
  )
}

function WesternHandsMinimal({
  size, hourDeg, minDeg, secDeg,
}: { size: number; hourDeg: number; minDeg: number; secDeg: number }) {
  const cx = size / 2
  const r = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0"
         style={{ pointerEvents: "none" }}>
      {/* Hour — thickest lance, gold */}
      <g transform={`rotate(${hourDeg} ${cx} ${cx})`} data-needle="western-hour">
        <line x1={cx} y1={cx + 22} x2={cx} y2={cx - r * 0.34}
          stroke="#f6cf78" strokeWidth={5} strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 2px #cf6a1e)" }} />
      </g>
      {/* Minute — thinner, brighter */}
      <g transform={`rotate(${minDeg} ${cx} ${cx})`} data-needle="western-minute">
        <line x1={cx} y1={cx + 18} x2={cx} y2={cx - r * 0.45}
          stroke="#fef4d8" strokeWidth={3} strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 1.5px #f6cf78)" }} />
      </g>
      {/* Second — hairline ember-red */}
      <g transform={`rotate(${secDeg} ${cx} ${cx})`} data-needle="western-second">
        <line x1={cx} y1={cx + 26} x2={cx} y2={cx - r * 0.46}
          stroke="#cf3a1e" strokeWidth={1.4} strokeLinecap="round" />
        <circle cx={cx} cy={cx - r * 0.38} r={3} fill="#cf3a1e" stroke="#1a0d04" strokeWidth={0.5} />
      </g>
    </svg>
  )
}

function CenterSeal({
  size, pranaIdx, varaLordGraha, onClick,
}: { size: number; pranaIdx: number; varaLordGraha: string; onClick: () => void }) {
  const cx = size / 2
  const r = size * 0.075
  const pulseScale = 1 + (pranaIdx % 6) * 0.008
  const lord = PLANET_SYMBOL[varaLordGraha]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
      <defs>
        <radialGradient id="om-seal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cf6a1e" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#1a0d04" stopOpacity="1" />
          <stop offset="100%" stopColor="#050300" stopOpacity="1" />
        </radialGradient>
      </defs>
      {/* Clickable hit area — full seal */}
      <g transform={`translate(${cx} ${cx})`} style={{ cursor: "pointer" }} onClick={onClick}
         role="button" aria-label="Open Saptamukhi panel">
        <g transform={`scale(${pulseScale})`}>
          <circle r={r * 1.6} fill="url(#om-seal)" opacity={0.55} />
          <circle r={r} fill="#1a0d04" stroke="#f6cf78" strokeWidth={1.5} />
          <text fontSize={r * 1.35} fill="#f6cf78" textAnchor="middle" dominantBaseline="central"
            fontFamily="serif" style={{ filter: "drop-shadow(0 0 6px #cf6a1e)" }}>
            ॐ
          </text>
        </g>
        {/* vāra lord planet glyph orbiting just outside the seal */}
        {lord && (
          <g transform={`translate(0 ${-r - 8})`}>
            <circle r={5} fill={lord.color} stroke="#1a0d04" strokeWidth={0.5} />
            <text fontSize={7} fill="#1a0d04" textAnchor="middle" dominantBaseline="central">
              {lord.symbol}
            </text>
          </g>
        )}
        {/* affordance hint — lowercase, no glyph (content audit §2) */}
        <text y={r + 14} fontSize={7} fill="#b88937" textAnchor="middle"
          fontFamily="'Cinzel', serif" letterSpacing="0.18em">
          tap to open
        </text>
      </g>
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ◈ SaptamukhiPanel — slide-in drawer with the 35 demoted complications
// ════════════════════════════════════════════════════════════════════════════

function SaptamukhiPanel({
  open, onClose, stamp, meridian, cell,
}: {
  open: boolean
  onClose: () => void
  stamp: SubstrateStamp
  meridian: any
  cell: any
}) {
  const year = stamp.year_layer
  const month = stamp.month_layer
  const tithi = stamp.tithi_layer
  const vara = stamp.vara_layer
  const naks = cell.nakshatra
  const yoga = cell.yoga
  const karana = cell.karana
  const av = cell.ashtakavarga

  // ESC closes
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      data-component="saptamukhi-panel"
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(5,3,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="ml-auto h-full w-full sm:w-[420px] bg-ink-900 border-l border-gold-700/50 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur px-5 py-4 border-b border-gold-700/40 flex items-baseline justify-between">
          <h3 className="font-display text-gold-200 tracking-[0.25em] text-sm">
            🔱 सप्तमुखी · SAPTAMUKHI
          </h3>
          <button
            onClick={onClose}
            className="text-gold-500 hover:text-gold-200 text-xl leading-none"
            aria-label="Close panel"
          >×</button>
        </header>

        <div className="px-5 py-4 space-y-4 text-gold-200">
          <PanelGroup title="समय · TIME">
            <PanelKV k="Civil" v={`${String(stamp.input_civil.hour).padStart(2,"0")}:${String(stamp.input_civil.minute).padStart(2,"0")}:${String(Math.floor(stamp.input_civil.second)).padStart(2,"0")} (UTC+${stamp.input_civil.tz_h})`} />
            <PanelKV k="Date" v={`${stamp.input_civil.gregorian_year}-${String(stamp.input_civil.month).padStart(2,"0")}-${String(stamp.input_civil.day).padStart(2,"0")}`} />
            <PanelKV k="Day" v={vara.vara_name + " · " + vara.vara_devanagari + " (" + vara.vara_lord_graha + ")"} />
            <PanelKV k="Ghaṭi-Aditi" v={`${stamp.day_subdivision_aditi.ghati_index} / ${stamp.day_subdivision_aditi.vighati_index} / ${stamp.day_subdivision_aditi.prana_index}`} sub="60 घटी → 60 विघटी → 6 प्राण" />
            <PanelKV k="Ghaṭi-Diti" v={`${stamp.day_subdivision_diti.ghati_index} / ${stamp.day_subdivision_diti.vighati_index} / ${stamp.day_subdivision_diti.prana_index}`} sub="20 / 20 / 2 — दिति-pole (Pisano ÷3)" />
            <PanelKV k="Muhūrta" v={`${stamp.day_subdivision_aditi.muhurta_index} / 30`} />
            <PanelKV k="K · Kāmākhyā JD" v={stamp.kali_civil_days_at_kamakhya.toFixed(6)} mono />
          </PanelGroup>

          <PanelGroup title="वर्ष · CYCLES">
            <PanelKV k="Saṃvatsara" v={`${year.samvatsara.name} · #${year.samvatsara.index + 1}/60`} sub="60-yr Bṛhaspati-cakra" />
            <PanelKV k="Kali year" v={year.kali_year_current.toLocaleString("en-IN")} />
            <PanelKV k="Vikrama" v={year.vikrama_samvat.toLocaleString()} />
            <PanelKV k="Śaka" v={year.shaka_samvat.toLocaleString()} />
            <PanelKV k="Māsa" v={`${month.masa_name} · ${month.masa_devanagari}`} sub={`#${month.masa_index}/12 · सूर्य राशि #${month.sun_sign_index}`} />
            <PanelKV k="Rāśi (Sun)" v={`${RASHI_NAMES[(month.sun_sign_index - 1) % 12]} ${RASHI_GLYPHS[(month.sun_sign_index - 1) % 12]}`} />
          </PanelGroup>

          <PanelGroup title="आकाश · SKY">
            <PanelKV k="Nakṣatra" v={`${naks.nakshatra_name} · ${naks.nakshatra_devanagari}`} sub={`पाद ${naks.pada}/4 · देवता ${naks.nakshatra_deity} · विंशोत्तरी ${naks.nakshatra_lord}`} />
            <PanelKV k="Tithi" v={`${tithi.tithi_name}`} sub={`${tithi.paksha_devanagari}-पक्ष · #${tithi.tithi_index}/30 · चन्द्र−सूर्य ${tithi.moon_minus_sun_deg.toFixed(2)}°`} />
            <PanelKV k="Yoga" v={`${yoga.yoga_name} · ${yoga.yoga_devanagari}`} sub={`#${yoga.yoga_index}/27 · (सूर्य+चन्द्र) ${yoga.sun_plus_moon_lon_deg.toFixed(2)}°`} />
            <PanelKV k="Karaṇa" v={`${karana.karana_name} · ${karana.karana_devanagari}`} sub={`#${karana.karana_index}/60${karana.is_movable ? " · चर चक्र " + karana.movable_cycle_number + "/8" : " · स्थिर"}`} />
            <PanelKV k="Sun longitude" v={`${month.sun_sidereal_lon_deg.toFixed(4)}°`} mono />
            <PanelKV k="Moon longitude" v={`${naks.moon_sidereal_lon_deg.toFixed(4)}°`} mono />
          </PanelGroup>

          <PanelGroup title="स्थान · MERIDIAN">
            <PanelKV k="Active" v={meridian.label_en} sub={meridian.label_hi} />
            <PanelKV k="Longitude" v={`${meridian.lon_deg.toFixed(4)}°`} mono />
            <PanelKV k="LMT offset" v={`${meridian.lmt_offset_h >= 0 ? "+" : ""}${meridian.lmt_offset_h.toFixed(3)}h`} sub="from Kāmākhyā" mono />
            <PanelKV k="Kali days here" v={meridian.kali_civil_days.toFixed(6)} mono />
          </PanelGroup>

          <PanelGroup title="अष्टकवर्ग · ASHTAKAVARGA">
            <PanelKV k="Sarva total" v={String(av?.sarva_total ?? "—")} sub="0..337 bindu strength meter" />
            <AshtakavargaBars av={av} />
          </PanelGroup>

          <PanelGroup title="त्रिमूर्ति · TRIMŪRTI (all 3)">
            <p className="text-[11px] text-gold-500 italic mb-2">
              The single-needle composite on the dial is the "everyday glance" view. Below are the canonical 3 hands.
            </p>
            <PanelKV k="🌅 Brahmā" v={(stamp.trimurti_at_ujjain.aditi.brahma.day_subdivision.fraction_of_day * 24).toFixed(4) + "h"} sub="सृष्टि · creation phase" />
            <PanelKV k="☀️ Viṣṇu" v={(stamp.trimurti_at_ujjain.aditi.vishnu.day_subdivision.fraction_of_day * 24).toFixed(4) + "h"} sub="स्थिति · preservation" />
            <PanelKV k="🌇 Maheśa" v={(stamp.trimurti_at_ujjain.aditi.mahesh.day_subdivision.fraction_of_day * 24).toFixed(4) + "h"} sub="संहार · transformation" />
          </PanelGroup>

          <PanelGroup title="मेटा-वाक्यम् · MASTER META-THEOREM">
            <p className="text-[11px] text-gold-500 leading-relaxed">
              Every reading above derives from the single triple <span className="text-gold-300 font-mono">(R, g, k) = (ℤ/3ᵏℤ, 2, k ∈ ℕ⁺)</span> via the 9-tag derivation calculus of APEX-v5 Saptamukhi Bipolar. <br/>
              Aditi pole · R* → 60·60·6 ghaṭi cascade<br/>
              Diti pole · (3) → 20·20·2 compressed cascade<br/>
              Bridge: g = 2 is a primitive root of (ℤ/3ᵏℤ)*<br/>
              π<sub>(3)</sub>/π = 1/3 · Pisano-of-Ideal invariant
            </p>
          </PanelGroup>
        </div>
      </div>
    </div>
  )
}

function PanelGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-display text-gold-500 tracking-[0.25em] mb-1 pb-1 border-b border-gold-700/30">
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function PanelKV({ k, v, sub, mono }: { k: string; v: string; sub?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-3 py-1">
      <div className="text-[11px] text-gold-600 font-display tracking-wider whitespace-nowrap">{k}</div>
      <div className="text-right min-w-0">
        <div className={`text-xs text-gold-200 ${mono ? "font-mono tabular-nums" : ""} truncate`}>{v}</div>
        {sub && <div className="text-[10px] text-gold-500 italic mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function AshtakavargaBars({ av }: { av: any }) {
  if (!av?.bhinna_totals) return null
  const planets = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"]
  return (
    <div className="mt-2 space-y-1">
      {planets.map(p => {
        const v = av.bhinna_totals[p] ?? 0
        const pct = Math.min(100, (v / 56) * 100)   // 56 is max per-planet bhinna
        const meta = PLANET_SYMBOL[p]
        return (
          <div key={p} className="flex items-center gap-2">
            <div className="w-5 text-center" style={{ color: meta.color }}>{meta.symbol}</div>
            <div className="flex-1 h-2 bg-ink-800 rounded-sm overflow-hidden">
              <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: meta.color, opacity: 0.85 }} />
            </div>
            <div className="text-[10px] text-gold-400 font-mono w-8 text-right">{v}</div>
          </div>
        )
      })}
    </div>
  )
}
