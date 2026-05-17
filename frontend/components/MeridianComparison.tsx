"use client"

import type { ByMeridian, MeridianView } from "@/lib/substrate"

/**
 * 🔱 मेरिडियन-समानांतर · PARALLEL MERIDIANS
 *
 * Same instant, two perspectives:
 *   • Ujjayinī (उज्जयिनī) — Sūrya Siddhānta canonical (computational truth)
 *   • Kāmākhyā (कामाख्या) — KAAL symbolic origin (sovereign east)
 *
 * They differ by 1h 4m (Kāmākhyā is ~16° further east). Astronomical layers
 * (year/saṃvatsara/māsa/tithi/nakṣatra/yoga/karaṇa) are identical between
 * the two; only vāra & day-subdivision can differ near day boundaries.
 */
export function MeridianComparison({ bm }: { bm: ByMeridian }) {
  const sameVara = bm.ujjain.vara.vara_index === bm.kamakhya.vara.vara_index
  return (
    <section className="mt-10 rounded-sm border border-gold-700/50 bg-ink-900/60 overflow-hidden">
      <header className="px-6 py-4 border-b border-gold-700/40 bg-gradient-to-r from-amber-deep/40 via-ink-900 to-amber-deep/40">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-display tracking-[0.3em] text-gold-300 text-sm">
            मेरिडियन-समानांतर · PARALLEL MERIDIANS
          </h2>
          <span className="text-xs text-gold-500 italic">
            दोनों एक ही क्षण · ΔK = {bm.offset_kamakhya_minus_ujjain_min} min
          </span>
        </div>
        <p className="mt-1 text-xs text-gold-600/80 italic">
          वर्ष / मास / तिथि / नक्षत्र / योग / करण — दोनों meridian पर समान।
          सिर्फ वार और दिनार्ध meridian-dependent।
        </p>
      </header>

      <div className="grid md:grid-cols-2 divide-x divide-gold-700/40">
        <MeridianCard m={bm.ujjain} accent="ujjain" sameVara={sameVara} />
        <MeridianCard m={bm.kamakhya} accent="kamakhya" sameVara={sameVara} />
      </div>

      <footer className="px-6 py-3 border-t border-gold-700/40 bg-ink-900/40 text-center text-xs">
        <div className="text-gold-500 font-mono">
          K<sub>kamakhya</sub> = K<sub>ujjain</sub> + (91.7059 − 75.7789) / 15 / 24
          &nbsp;=&nbsp; K<sub>ujjain</sub> + {bm.offset_kamakhya_minus_ujjain_days.toFixed(6)} days
        </div>
        <div className="text-gold-600/80 italic mt-1">
          (Kāmākhyā is 15.93° east of Ujjayinī → its civil-day counter runs ahead by 1h 4m)
        </div>
      </footer>
    </section>
  )
}

function MeridianCard({
  m, accent, sameVara,
}: { m: MeridianView; accent: "ujjain" | "kamakhya"; sameVara: boolean }) {
  const d = m.day_subdivision
  const v = m.vara
  const tint = accent === "kamakhya"
    ? "from-amber-ember/15 via-transparent to-transparent"
    : "from-gold-700/10 via-transparent to-transparent"
  return (
    <div className={`relative p-6 bg-gradient-to-br ${tint}`}>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="font-display tracking-[0.25em] text-gold-400 text-sm">
            {m.label_en}
          </div>
          <div className="inscription text-base text-gold-300">{m.label_hi}</div>
        </div>
        <div className="text-right text-xs text-gold-600 font-mono tabular">
          {m.lon_deg.toFixed(4)}°E<br />
          LMT +{m.lmt_offset_h.toFixed(4)}h
        </div>
      </div>
      <p className="text-xs italic text-gold-600/80 mb-4">{m.label_sub}</p>

      {/* Kali day count */}
      <div className="mb-4 pb-3 border-b border-gold-700/30">
        <div className="text-[10px] tracking-[0.2em] text-gold-600 font-display mb-0.5">
          KALI सावन दिन
        </div>
        <div className="font-mono text-base text-gold-200 tabular">
          {m.kali_civil_days.toLocaleString(undefined, {
            minimumFractionDigits: 6, maximumFractionDigits: 6,
          })}
        </div>
      </div>

      {/* Vāra */}
      <div className="mb-4 pb-3 border-b border-gold-700/30">
        <div className="text-[10px] tracking-[0.2em] text-gold-600 font-display mb-0.5">
          वार · WEEKDAY
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-display text-lg text-gold-200">{v.vara_name}</span>
            <span className="inscription text-sm ml-2 opacity-80">{v.vara_devanagari}</span>
          </div>
          {!sameVara && (
            <span className="text-[10px] uppercase tracking-wider text-amber-ember px-2 py-0.5 border border-amber-ember/60 rounded-sm">
              differs
            </span>
          )}
        </div>
        <div className="text-xs text-gold-600 mt-0.5">lord {v.vara_lord_graha}</div>
      </div>

      {/* Day subdivision */}
      <div>
        <div className="text-[10px] tracking-[0.2em] text-gold-600 font-display mb-2">
          दिनार्ध · DAY SUBDIVISION
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm tabular">
          <Row label="मुहूर्त" v={d.muhurta_index} max={30} />
          <Row label="घटी"    v={d.ghati_index}   max={60} />
          <Row label="विघटी"  v={d.vighati_index} max={60} />
          <Row label="प्राण"   v={d.prana_index}   max={6}  />
        </div>
        <div className="mt-3 text-xs text-gold-600">
          {d.hours_from_kamakhya_midnight.toFixed(4)} h since local midnight
          {" · "}
          विपल {d.vipala_fractional.toFixed(2)} / 10
        </div>
      </div>
    </div>
  )
}

function Row({ label, v, max }: { label: string; v: number; max: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs inscription text-gold-500">{label}</span>
      <span>
        <span className="text-gold-100 text-lg">{v}</span>
        <span className="text-gold-600 text-xs">/{max}</span>
      </span>
    </div>
  )
}
