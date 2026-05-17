"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import type { SubstrateStamp, MeridianFullView, TrimurtiId, PoleId } from "@/lib/substrate"
import { NAKSHATRA_NAMES } from "@/lib/panchanga"

/**
 * 🔱 Sphota3DIso — pure-SVG isometric projection of the 504-cell substrate.
 *
 * No Three.js, no WebGL, no R3F. Just an isometric (Y′ = Y cos θ − Z sin θ)
 * projection of the same (φ, r, z) lattice that Sphota3D builds, rendered as
 * 504 circles on an SVG canvas with depth-sorting + parallax mouse drag.
 *
 * Lattice (same as Sphota3D):
 *   • Azimuth (φ): 7 mukha sectors × 12 meridians × 6 cells per ring
 *   • Radius  (r): meridian-index step within mukha sector
 *   • Height  (z): pole × trimurti (Aditi up · Diti down)
 *
 * Why this exists: Three.js render loop is currently blocked by a
 * `THREE.Clock` deprecation in three@0.184 + R3F@9.6 (Heron r2 frontend has
 * no equivalent on the engine, so it falls cleanly back to SVG depth-sort).
 */

const MUKHA_ORDER: Array<{ id: string; emoji: string; color: string; label_hi: string }> = [
  { id: "purva",    emoji: "🐒", color: "#a04a0a", label_hi: "हनुमत्-पूर्व" },
  { id: "dakshina", emoji: "🦁", color: "#cf6a1e", label_hi: "नरसिंह-दक्षिण" },
  { id: "paschim",  emoji: "🦅", color: "#7a5c1f", label_hi: "गरुड़-पश्चिम" },
  { id: "uttara",   emoji: "🐗", color: "#4a7c1f", label_hi: "वराह-उत्तर" },
  { id: "urdhva",   emoji: "🐴", color: "#1f7a7a", label_hi: "हयग्रीव-ऊर्ध्व" },
  { id: "kala",     emoji: "⏳", color: "#7a1f7a", label_hi: "काल-समय" },
  { id: "sarva",    emoji: "🌐", color: "#1f4a7a", label_hi: "सर्व-व्यापक" },
]

const POLE_TRIMURTI_Z: Record<string, number> = {
  "aditi-brahma":  +2.0,
  "aditi-vishnu":  +1.2,
  "aditi-mahesh":  +0.4,
  "diti-brahma":   -0.4,
  "diti-vishnu":   -1.2,
  "diti-mahesh":   -2.0,
}

interface CellPoint {
  x: number; y: number; z: number
  color: string
  meridian: MeridianFullView
  pole: PoleId
  op: TrimurtiId
  nakIdx: number
}

function buildPoints(stamp: SubstrateStamp): CellPoint[] {
  const points: CellPoint[] = []
  const innerR = 3.0
  const ringStep = 0.5
  for (let mukhaIdx = 0; mukhaIdx < MUKHA_ORDER.length; mukhaIdx++) {
    const mukha = MUKHA_ORDER[mukhaIdx]
    const ids = stamp.meridian_groups[mukha.id as keyof typeof stamp.meridian_groups]
    if (!ids) continue
    const sorted = [...ids].sort((a, b) => stamp.meridians[b].lon_deg - stamp.meridians[a].lon_deg)
    sorted.forEach((mid, meridianIdx) => {
      const m = stamp.meridians[mid]
      const r = innerR + meridianIdx * ringStep
      const sectorCenter = (mukhaIdx / 7) * 2 * Math.PI
      const sectorWidth = (2 * Math.PI) / 7
      let cellIdx = 0
      for (const pole of ["aditi", "diti"] as const) {
        for (const op of ["brahma", "vishnu", "mahesh"] as const) {
          const cell = m.trimurti[pole][op]
          const nakIdx = cell.nakshatra.nakshatra_index - 1
          const phi = sectorCenter + (cellIdx / 6 - 0.5) * sectorWidth * 0.95
          points.push({
            x: r * Math.cos(phi),
            y: r * Math.sin(phi),
            z: POLE_TRIMURTI_Z[`${pole}-${op}`] ?? 0,
            color: `hsl(${(nakIdx * 360) / 27}, 70%, 55%)`,
            meridian: m,
            pole,
            op,
            nakIdx,
          })
          cellIdx++
        }
      }
    })
  }
  return points
}

/** Isometric projection: rotate around Z by yaw, then project on Y by pitch. */
function project(p: CellPoint, yawDeg: number, pitchDeg: number, scale: number) {
  const yaw = (yawDeg * Math.PI) / 180
  const pitch = (pitchDeg * Math.PI) / 180
  // rotate around Z (azimuth)
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const xr = p.x * cy - p.y * sy
  const yr = p.x * sy + p.y * cy
  // project: Y′ = yr*cos(pitch) - z*sin(pitch);  depth = yr*sin(pitch) + z*cos(pitch)
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  const screenX = xr * scale
  const screenY = (yr * cp - p.z * sp) * scale
  const depth = yr * sp + p.z * cp
  return { screenX, screenY, depth }
}

export function Sphota3DIso({ stamp }: { stamp: SubstrateStamp }) {
  const [hover, setHover] = useState<CellPoint | null>(null)
  const [yaw, setYaw] = useState(0)
  const [pitch, setPitch] = useState(55)
  const dragging = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null)
  const autoRotateRef = useRef<number | null>(null)

  const points = useMemo(() => buildPoints(stamp), [stamp])

  // Auto-rotate when not dragging
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      const dt = (now - last) / 1000
      last = now
      if (!dragging.current && autoRotateRef.current !== 0) {
        setYaw(y => (y + dt * 8) % 360)   // 8°/sec
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const projected = useMemo(() => {
    const scale = 35
    return points
      .map((p, i) => ({ ...project(p, yaw, pitch, scale), p, i }))
      .sort((a, b) => a.depth - b.depth)   // painters: far first, near last
  }, [points, yaw, pitch])

  // Mukha labels (outer ring, projected)
  const mukhaLabels = useMemo(() => {
    const scale = 35
    const labelR = 10.5
    return MUKHA_ORDER.map((mu, i) => {
      const phi = (i / 7) * 2 * Math.PI
      const pp = project({ x: labelR * Math.cos(phi), y: labelR * Math.sin(phi), z: 0 } as CellPoint, yaw, pitch, scale)
      return { ...pp, mu }
    })
  }, [yaw, pitch])

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = { x: e.clientX, y: e.clientY, yaw, pitch }
    autoRotateRef.current = 0
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    const dx = e.clientX - dragging.current.x
    const dy = e.clientY - dragging.current.y
    setYaw((dragging.current.yaw + dx * 0.4) % 360)
    setPitch(Math.max(10, Math.min(85, dragging.current.pitch + dy * 0.3)))
  }
  function onMouseUp() {
    dragging.current = null
    // resume auto-rotate after 2s of inactivity
    setTimeout(() => { if (!dragging.current) autoRotateRef.current = null }, 2000)
  }

  return (
    <section className="mt-10 rounded-sm border border-gold-700/40 bg-ink-900/40 overflow-hidden">
      <header className="px-6 py-4 border-b border-gold-700/40 flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="font-display tracking-[0.3em] text-gold-300 text-sm">
          🔱 स्फोट-समत्रिमिति · SPHOṬA ISO · 504 cells (pure-SVG depth-sort)
        </h2>
        <span className="text-xs text-gold-500 italic">
          drag to rotate · yaw {yaw.toFixed(0)}° · pitch {pitch.toFixed(0)}° · auto-rotate ON
        </span>
      </header>

      <div
        className="relative cursor-grab active:cursor-grabbing select-none"
        style={{ height: "640px", background: "radial-gradient(ellipse at center, #1a0d04 0%, #050300 80%)" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <svg viewBox="-500 -350 1000 700" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
          {/* central seal */}
          <circle cx={0} cy={0} r={28} fill="#1a0d04" stroke="#cf6a1e" strokeWidth={2} />
          <text x={0} y={8} textAnchor="middle" fontSize={28} fill="#f6cf78" style={{ fontFamily: "serif" }}>ॐ</text>

          {/* depth-sorted cells */}
          {projected.map(({ screenX, screenY, depth, p, i }) => {
            // Subtle depth fade — far cells dimmer
            const alpha = 0.45 + 0.55 * ((depth + 10) / 20)
            const r = 5 + Math.max(0, (depth + 8) / 16) * 2
            return (
              <circle
                key={i}
                cx={screenX}
                cy={screenY}
                r={r}
                fill={p.color}
                opacity={Math.max(0.35, Math.min(1, alpha))}
                stroke="#000"
                strokeWidth={0.5}
                onMouseEnter={() => setHover(p)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              />
            )
          })}

          {/* mukha emoji labels */}
          {mukhaLabels.map(({ screenX, screenY, mu }) => (
            <text key={mu.id} x={screenX} y={screenY} fontSize={20} textAnchor="middle" dominantBaseline="middle"
                  style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.9))" }}>
              {mu.emoji}
            </text>
          ))}
        </svg>

        {hover && (
          <div className="absolute top-4 right-4 max-w-[260px] p-3 bg-ink-900/95 border border-gold-700 rounded-sm backdrop-blur-sm pointer-events-none">
            <div className="text-[10px] text-gold-600 font-display tracking-wider mb-1">HOVERED CELL</div>
            <div className="text-sm font-display text-gold-200">{hover.meridian.label_en}</div>
            <div className="inscription text-xs text-gold-400">{hover.meridian.label_hi}</div>
            <div className="text-[10px] text-gold-500 mt-2">
              {hover.pole} · {hover.op}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div className="px-1.5 py-0.5 bg-ink-800/60 rounded-sm">
                <div className="text-[9px] inscription text-gold-600">नक्षत्र</div>
                <div className="text-[11px] text-gold-200">{NAKSHATRA_NAMES[hover.nakIdx]} pa{hover.meridian.trimurti[hover.pole][hover.op].nakshatra.pada}</div>
              </div>
              <div className="px-1.5 py-0.5 bg-ink-800/60 rounded-sm">
                <div className="text-[9px] inscription text-gold-600">योग</div>
                <div className="text-[11px] text-gold-200">{hover.meridian.trimurti[hover.pole][hover.op].yoga.yoga_name}</div>
              </div>
              <div className="px-1.5 py-0.5 bg-ink-800/60 rounded-sm">
                <div className="text-[9px] inscription text-gold-600">करण</div>
                <div className="text-[11px] text-gold-200">{hover.meridian.trimurti[hover.pole][hover.op].karana.karana_name}</div>
              </div>
              <div className="px-1.5 py-0.5 bg-ink-800/60 rounded-sm">
                <div className="text-[9px] inscription text-gold-600">AV</div>
                <div className="text-[11px] text-gold-200">{hover.meridian.trimurti[hover.pole][hover.op].ashtakavarga.sarva_total}</div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-4 text-[10px] text-gold-600 max-w-md leading-relaxed pointer-events-none">
          7 mukha rings × 12 meridians × 6 cells (pole × trimurti) · isometric depth-sort
          <br/>Aditi up · Diti down · no Three.js · no WebGL · zero dependencies
        </div>
      </div>

      <footer className="px-6 py-3 border-t border-gold-700/40 text-center text-[10px] text-gold-600/80">
        सर्व 504 cells · pure-SVG fallback · color = current nakṣatra (27-hue) · live morph as K advances
      </footer>
    </section>
  )
}
