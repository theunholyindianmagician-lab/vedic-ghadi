"use client"

import { useState, useMemo, Suspense } from "react"
import { Canvas, type ThreeEvent } from "@react-three/fiber"
import { OrbitControls, Text, Html } from "@react-three/drei"
import * as THREE from "three"
import type { SubstrateStamp, MeridianFullView, TrimurtiId, PoleId } from "@/lib/substrate"
import { NAKSHATRA_NAMES, NAKSHATRA_DEV } from "@/lib/panchanga"

/**
 * 🔱 Sphota3D — Three.js 3D visualization of 504 cells.
 *
 * Cylindrical-spherical layout:
 *   • Azimuth (φ): 7 mukha sectors × 12 meridians × 6 cells per ring
 *   • Radius (r):   meridian-index step within mukha sector
 *   • Height (z):   pole + trimurti
 *       Aditi-Brahmā  z = +1.0
 *       Aditi-Viṣṇu   z = +0.6
 *       Aditi-Maheśa  z = +0.2
 *       Diti-Brahmā   z = −0.2
 *       Diti-Viṣṇu    z = −0.6
 *       Diti-Maheśa   z = −1.0
 *
 * Each cell = colored sphere (hue = current nakṣatra 0..27).
 * Auto-rotation + OrbitControls for free exploration.
 * Hover any sphere → HTML overlay with cell detail.
 */

interface CellPoint {
  position: [number, number, number]
  color: string
  meridian: MeridianFullView
  pole: PoleId
  op: TrimurtiId
  nakIdx: number
}

const MUKHA_ORDER: Array<{ id: string; emoji: string; color: string }> = [
  { id: "purva",    emoji: "🐒", color: "#a04a0a" },
  { id: "dakshina", emoji: "🦁", color: "#cf6a1e" },
  { id: "paschim",  emoji: "🦅", color: "#7a5c1f" },
  { id: "uttara",   emoji: "🐗", color: "#4a7c1f" },
  { id: "urdhva",   emoji: "🐴", color: "#1f7a7a" },
  { id: "kala",     emoji: "⏳", color: "#7a1f7a" },
  { id: "sarva",    emoji: "🌐", color: "#1f4a7a" },
]

const POLE_TRIMURTI_Z: Record<string, number> = {
  "aditi-brahma":  +1.0,
  "aditi-vishnu":  +0.6,
  "aditi-mahesh":  +0.2,
  "diti-brahma":   -0.2,
  "diti-vishnu":   -0.6,
  "diti-mahesh":   -1.0,
}

function buildPoints(stamp: SubstrateStamp): CellPoint[] {
  const points: CellPoint[] = []
  const innerR = 1.5
  const ringStep = 0.22

  for (const mukha of MUKHA_ORDER) {
    const ids = stamp.meridian_groups[mukha.id as keyof typeof stamp.meridian_groups]
    if (!ids) continue
    const sorted = [...ids].sort((a, b) => stamp.meridians[b].lon_deg - stamp.meridians[a].lon_deg)

    sorted.forEach((mid, meridianIdx) => {
      const m = stamp.meridians[mid]
      const r = innerR + meridianIdx * ringStep
      // sector center azimuth — center sector at this mukha
      const mukhaIdx = MUKHA_ORDER.findIndex(x => x.id === mukha.id)
      const sectorCenter = (mukhaIdx / 7) * 2 * Math.PI
      const sectorWidth = (2 * Math.PI) / 7

      let cellIdx = 0
      for (const pole of ["aditi", "diti"] as const) {
        for (const op of ["brahma", "vishnu", "mahesh"] as const) {
          const cell = m.trimurti[pole][op]
          const nakIdx = cell.nakshatra.nakshatra_index - 1
          // Distribute 6 cells across the sector width
          const phi = sectorCenter + (cellIdx / 6 - 0.5) * sectorWidth * 0.95
          const x = r * Math.cos(phi)
          const y = r * Math.sin(phi)
          const z = POLE_TRIMURTI_Z[`${pole}-${op}`] || 0
          const color = `hsl(${(nakIdx * 360) / 27}, 70%, 55%)`
          points.push({
            position: [x, y, z],
            color,
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

export function Sphota3D({ stamp }: { stamp: SubstrateStamp }) {
  const [hover, setHover] = useState<CellPoint | null>(null)
  const points = useMemo(() => buildPoints(stamp), [stamp])

  return (
    <section className="mt-10 rounded-sm border border-gold-700/40 bg-ink-900/40 overflow-hidden">
      <header className="px-6 py-4 border-b border-gold-700/40 flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="font-display tracking-[0.3em] text-gold-300 text-sm">
          🔱 स्फोट-त्रिआयाम · SPHOṬA 3D · 504 cells in space
        </h2>
        <span className="text-xs text-gold-500 italic">
          drag to rotate · scroll to zoom · ⏵ auto-rotating
        </span>
      </header>

      <div className="relative" style={{ height: "640px", background: "radial-gradient(ellipse at center, #1a0d04 0%, #050300 80%)" }}>
        <Canvas
          camera={{ position: [4, 4, 4], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.6} color="#d4a44c" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#a04a0a" />

          <Suspense fallback={null}>
            <CellCloud points={points} onHover={setHover} />
            <CentralSeal />
            <MukhaLabels />
            <PoleAxisLabels />
          </Suspense>

          <OrbitControls
            autoRotate
            autoRotateSpeed={0.5}
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={12}
          />
        </Canvas>

        {hover && (
          <div className="absolute top-4 right-4 max-w-[260px] p-3 bg-ink-900/90 border border-gold-700 rounded-sm backdrop-blur-sm pointer-events-none">
            <div className="text-[10px] text-gold-600 font-display tracking-wider mb-1">HOVERED CELL</div>
            <div className="text-sm font-display text-gold-200">{hover.meridian.label_en}</div>
            <div className="inscription text-xs text-gold-400">{hover.meridian.label_hi}</div>
            <div className="text-[10px] text-gold-500 mt-2">
              {hover.pole} · {hover.op}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <Chip label="नक्षत्र" value={`${NAKSHATRA_NAMES[hover.nakIdx]} pa${hover.meridian.trimurti[hover.pole][hover.op].nakshatra.pada}`} />
              <Chip label="योग"     value={hover.meridian.trimurti[hover.pole][hover.op].yoga.yoga_name} />
              <Chip label="करण"     value={hover.meridian.trimurti[hover.pole][hover.op].karana.karana_name} />
              <Chip label="AV"      value={`${hover.meridian.trimurti[hover.pole][hover.op].ashtakavarga.sarva_total}`} />
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-4 text-[10px] text-gold-600 max-w-md leading-relaxed pointer-events-none">
          7 mukha rings × 12 meridians × 6 cells (pole × trimurti) · stacked along Z
          <br/>Aditi up · Diti down · Brahmā/Viṣṇu/Maheśa layer at descending z
        </div>
      </div>

      <footer className="px-6 py-3 border-t border-gold-700/40 text-center text-[10px] text-gold-600/80">
        सर्व 504 cells in 3D · color = current nakṣatra (27-hue) · live morph as K advances
      </footer>
    </section>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-1.5 py-0.5 bg-ink-800/60 rounded-sm">
      <div className="text-[9px] inscription text-gold-600">{label}</div>
      <div className="text-[11px] text-gold-200">{value}</div>
    </div>
  )
}

/** Instanced sphere cloud — 504 cells drawn in ONE draw call for performance. */
function CellCloud({
  points, onHover,
}: { points: CellPoint[]; onHover: (p: CellPoint | null) => void }) {
  // Use callback ref pattern to bind matrices once mesh exists
  const setMesh = (m: THREE.InstancedMesh | null) => {
    if (!m) return
    const dummy = new THREE.Object3D()
    points.forEach((p, i) => {
      dummy.position.set(...p.position)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, new THREE.Color(p.color))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    const id = e.instanceId
    if (id != null && points[id]) onHover(points[id])
  }
  function handlePointerOut() { onHover(null) }

  return (
    <instancedMesh
      ref={setMesh}
      args={[undefined, undefined, points.length]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshStandardMaterial roughness={0.4} metalness={0.6} />
    </instancedMesh>
  )
}

function CentralSeal() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial color="#1a0d04" emissive="#a04a0a" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[0, 0, 0.41]}
        fontSize={0.3}
        color="#f6cf78"
        anchorX="center"
        anchorY="middle"
      >
        OM
      </Text>
    </group>
  )
}

function MukhaLabels() {
  // Mukha emoji labels around the outside
  const labelR = 4.5
  return (
    <group>
      {MUKHA_ORDER.map((mukha, i) => {
        const phi = (i / 7) * 2 * Math.PI
        const x = labelR * Math.cos(phi)
        const y = labelR * Math.sin(phi)
        return (
          <Html
            key={mukha.id}
            position={[x, y, 0]}
            center
            style={{ pointerEvents: "none", fontSize: "20px", textShadow: "0 0 6px rgba(0,0,0,0.8)" }}
          >
            {mukha.emoji}
          </Html>
        )
      })}
    </group>
  )
}

function PoleAxisLabels() {
  return (
    <group>
      <Text position={[0, 0, 1.4]} fontSize={0.18} color="#d4a44c"
            anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#0a0703">
        ADITI ⬆
      </Text>
      <Text position={[0, 0, -1.4]} fontSize={0.18} color="#cf6a1e"
            anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#0a0703">
        DITI ⬇
      </Text>
    </group>
  )
}
