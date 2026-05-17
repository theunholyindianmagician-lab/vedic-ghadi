"use client"

import type { SubstrateStamp, MeridianFullView, TrimurtiId, PoleId } from "@/lib/substrate"
import { NAKSHATRA_NAMES, NAKSHATRA_DEV } from "@/lib/panchanga"

/**
 * 🔱 Cell Detail Panel — full cosmic snapshot for ONE (meridian, pole, trimurti) cell.
 *
 * Shows:
 *   • 9 graha → nakṣatra (122,472 claim-space ÷ 504)
 *   • 21 Moon vargas (D1–D108) (10,584 ÷ 504)
 *   • yoga + karaṇa (816,480 ÷ 504)
 *   • full day-subdivision cascade
 *
 * Trimurti shifts make each cell genuinely distinct.
 */
export function CellDetailPanel({
  stamp, m, pole, trimurti,
}: {
  stamp: SubstrateStamp
  m: MeridianFullView
  pole: PoleId
  trimurti: TrimurtiId
}) {
  const cell = m.trimurti[pole][trimurti]
  const grahaMeta = stamp.graha_metadata
  const vargaMeta = stamp.varga_metadata
  const signMeta = stamp.sign_metadata

  return (
    <div className="border border-gold-700/40 rounded-sm bg-ink-900/60 p-5 space-y-5">
      <header className="border-b border-gold-700/30 pb-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display tracking-[0.2em] text-gold-300 text-sm">
            🔱 CELL DETAIL · पूर्ण cosmic snapshot
          </h3>
          <span className="text-xs text-gold-500 font-mono tabular">
            {m.label_en} · {cell.icon} {cell.operator_en} · {pole}
          </span>
        </div>
        <p className="text-xs text-gold-600/70 italic mt-1">
          K = {cell.k_shifted.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
          {" · "}moon = {cell.moon_lon_deg.toFixed(4)}°
        </p>
      </header>

      {/* Pañcāṅga + Day Subdivision summary */}
      <section>
        <h4 className="text-[10px] tracking-[0.25em] text-gold-500 font-display mb-2">
          ◈ पञ्चाङ्ग सार · pañcāṅga summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="नक्षत्र" value={`${cell.nakshatra.nakshatra_name} pa${cell.nakshatra.pada}`}
                deva={cell.nakshatra.nakshatra_devanagari} />
          <Stat label="योग"     value={cell.yoga.yoga_name}
                deva={cell.yoga.yoga_devanagari} />
          <Stat label="करण"     value={cell.karana.karana_name}
                deva={cell.karana.karana_devanagari} />
          <Stat label="वार"     value={m.vara.vara_name}
                deva={m.vara.vara_devanagari} />
        </div>
      </section>

      {/* 9 grahas → nakṣatras */}
      <section>
        <h4 className="text-[10px] tracking-[0.25em] text-gold-500 font-display mb-2 flex items-baseline justify-between">
          <span>◈ नवग्रह नक्षत्र · 9 graha nakṣatras at K<sub>shifted</sub></span>
          <span className="text-gold-600 italic normal-case tracking-normal">
            (504 × 9 × 27 = 122,472 claim-space)
          </span>
        </h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {grahaMeta.map((g, i) => {
            const naksIdx = cell.graha_nakshatras[i] - 1
            return (
              <div key={g.name}
                   className="flex items-baseline gap-2 px-2 py-1.5 rounded-sm bg-ink-800/60 border border-gold-700/30">
                <span className="text-base text-gold-300 w-5">{g.symbol}</span>
                <div className="flex-1">
                  <div className="text-xs font-display text-gold-200">{g.name}</div>
                  <div className="text-[10px] inscription text-gold-500">{g.dev}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gold-200">{NAKSHATRA_NAMES[naksIdx]}</div>
                  <div className="text-[10px] inscription text-gold-500">{NAKSHATRA_DEV[naksIdx]}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 21 Moon vargas */}
      <section>
        <h4 className="text-[10px] tracking-[0.25em] text-gold-500 font-display mb-2 flex items-baseline justify-between">
          <span>◈ चन्द्र-वर्ग · Moon's 21 vargas (Ekaviṃśati-varga)</span>
          <span className="text-gold-600 italic normal-case tracking-normal">
            (504 × 21 = 10,584 claim-space)
          </span>
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-1.5 text-xs">
          {vargaMeta.map((v, i) => {
            const sIdx = cell.vargas_moon[i]
            const sign = signMeta[sIdx]
            return (
              <div key={v.abbrev}
                   className="px-2 py-1.5 rounded-sm bg-ink-800/60 border border-gold-700/30 text-center"
                   title={v.body}>
                <div className="text-[10px] font-mono text-gold-500">{v.abbrev}</div>
                <div className="text-sm text-gold-200">{sign.glyph}</div>
                <div className="text-[10px] inscription text-gold-400">{sign.dev}</div>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[10px] text-gold-600/70 italic">
          hover over each varga for the body-part / domain it governs · classical Parāśarī rules used for D2/D3/D7/D9/D10/D12/D16/D20/D24/D27/D30/D40/D45
        </p>
      </section>
    </div>
  )
}

function Stat({ label, value, deva }: { label: string; value: string; deva?: string }) {
  return (
    <div className="px-2 py-1.5 rounded-sm bg-ink-800/60 border border-gold-700/30">
      <div className="text-[10px] inscription text-gold-600 tracking-wider">{label}</div>
      <div className="text-sm text-gold-200 font-display">{value}</div>
      {deva && <div className="text-[10px] inscription text-gold-500">{deva}</div>}
    </div>
  )
}
