"use client"

import { useEffect, useState, useCallback } from "react"
import { kalaSubstrateStamp, type SubstrateStamp } from "@/lib/substrate"
import { TimeYantra } from "./TimeYantra"
import { LayerCard } from "./LayerCard"
import { TimeMachine } from "./TimeMachine"

/**
 * The live Vedic ghaḍī.
 *
 * Updates every animation frame from the local clock (no backend roundtrip —
 * the substrate is ported to TS, so client-side computation is exact and
 * smooth). The backend FastAPI service is still available for headless
 * consumers via NEXT_PUBLIC_API_BASE.
 */
export function GhadiClock() {
  // null = live ("follow now"). Otherwise a frozen moment chosen by the user.
  const [frozen, setFrozen] = useState<string | null>(null)
  const [stamp, setStamp] = useState<SubstrateStamp>(() => liveStamp())

  const tick = useCallback(() => {
    setStamp(frozen ? frozenStamp(frozen) : liveStamp())
  }, [frozen])

  useEffect(() => {
    // Sub-second updates so the prāṇa sweep is buttery
    let raf = 0
    const loop = () => { tick(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tick])

  const y = stamp.year_layer
  const m = stamp.month_layer
  const t = stamp.tithi_layer
  const v = stamp.vara_layer
  const d = stamp.day_subdivision
  const ci = stamp.input_civil

  const civilDisplay = `${ci.gregorian_year.toString().padStart(4,'0')}-${ci.month.toString().padStart(2,'0')}-${ci.day.toString().padStart(2,'0')}  ${ci.hour.toString().padStart(2,'0')}:${ci.minute.toString().padStart(2,'0')}:${Math.floor(ci.second).toString().padStart(2,'0')}`

  // Bootstrap the time-machine field with the current IST instant
  const initialIso = (() => {
    const ist = new Date(Date.now() + (5.5 - new Date().getTimezoneOffset() / -60) * 3600 * 1000)
    // Always produce yyyy-MM-ddTHH:mm:ss
    return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())}T${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`
  })()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
      <Header isLive={!frozen} civilDisplay={civilDisplay} tz={ci.tz_h} />

      <div className="mt-10 grid lg:grid-cols-2 gap-10 items-start">
        {/* Left column: the yantra */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[520px] mx-auto">
            <TimeYantra stamp={stamp} />
          </div>
          <div className="mt-6 text-center">
            <div className="font-display text-xs tracking-[0.4em] text-gold-500 mb-2">
              KĀMĀKHYĀ-ANCHORED · KALI DAY
            </div>
            <div className="font-mono text-xl text-gold-300 tabular">
              {stamp.kali_civil_days_at_kamakhya.toLocaleString(undefined, {
                minimumFractionDigits: 6, maximumFractionDigits: 6,
              })}
            </div>
            <div className="text-xs italic text-gold-600/80 mt-1">
              days since Friday midnight 17/18 Feb 3102 BCE · Ujjayinī meridian
            </div>
          </div>
        </div>

        {/* Right column: layer cards */}
        <div className="space-y-4">
          <LayerCard
            badge="VARṢA · YEAR"
            badgeDeva="वर्ष"
            accent
            title={
              <div className="flex items-baseline gap-3">
                <span>Kali {y.kali_year_current.toLocaleString()}</span>
                <span className="text-gold-600 text-sm">/ {y.samvatsara.name}</span>
              </div>
            }
            subtitle={`Saṃvatsara #${y.samvatsara.index + 1} of 60 · Bṛhaspati-cakra`}
            rows={[
              { label: "Vikrama Saṃvat", value: y.vikrama_samvat.toLocaleString() },
              { label: "Śaka Saṃvat",    value: y.shaka_samvat.toLocaleString() },
              { label: "Elapsed (float)", value: y.kali_year_float.toFixed(4) },
            ]}
          />

          <LayerCard
            badge="MĀSA · MONTH"
            badgeDeva={m.masa_devanagari}
            title={`${m.masa_name}`}
            subtitle={`Māsa #${m.masa_index} of 12 · Sun in rāśi #${m.sun_sign_index}`}
            rows={[
              { label: "Sun sidereal longitude",
                value: `${m.sun_sidereal_lon_deg.toFixed(4)}°` },
            ]}
          />

          <LayerCard
            badge="PAKṢA · TITHI"
            badgeDeva={t.paksha_devanagari}
            title={`${t.tithi_name}`}
            subtitle={`${t.paksha_name} · tithi #${t.tithi_index} of 30 (${t.tithi_in_paksha}/15)`}
            rows={[
              { label: "Moon − Sun elongation",
                value: `${t.moon_minus_sun_deg.toFixed(4)}°` },
              { label: "Fractional tithi",
                value: t.fractional_tithi.toFixed(4) },
            ]}
          />

          <LayerCard
            badge="VĀRA · WEEKDAY"
            badgeDeva={v.vara_devanagari}
            title={v.vara_name}
            subtitle={`Lord graha: ${v.vara_lord_graha}`}
          />

          <LayerCard
            badge="NAKṢATRA · LUNAR MANSION"
            badgeDeva={stamp.nakshatra_layer.nakshatra_devanagari}
            title={
              <div className="flex items-baseline gap-3">
                <span>{stamp.nakshatra_layer.nakshatra_name}</span>
                <span className="text-gold-600 text-sm">pada {stamp.nakshatra_layer.pada}/4</span>
              </div>
            }
            subtitle={`#${stamp.nakshatra_layer.nakshatra_index} of 27 · deity ${stamp.nakshatra_layer.nakshatra_deity}`}
            rows={[
              { label: "Vimśottarī lord", value: stamp.nakshatra_layer.nakshatra_lord },
              { label: "Moon sidereal lon", value: `${stamp.nakshatra_layer.moon_sidereal_lon_deg.toFixed(4)}°` },
            ]}
          />

          <LayerCard
            badge="YOGA · SUN+MOON ARC"
            badgeDeva={stamp.yoga_layer.yoga_devanagari}
            title={stamp.yoga_layer.yoga_name}
            subtitle={`#${stamp.yoga_layer.yoga_index} of 27 · (Sun + Moon) / 13°20′`}
            rows={[
              { label: "Sun + Moon longitude",
                value: `${stamp.yoga_layer.sun_plus_moon_lon_deg.toFixed(4)}°` },
              { label: "Fractional yoga",
                value: stamp.yoga_layer.fractional_yoga.toFixed(4) },
            ]}
          />

          <LayerCard
            badge="KARAṆA · HALF-TITHI"
            badgeDeva={stamp.karana_layer.karana_devanagari}
            title={stamp.karana_layer.karana_name}
            subtitle={
              stamp.karana_layer.is_movable
                ? `cara (movable) · cycle ${stamp.karana_layer.movable_cycle_number}/8 · half-tithi #${stamp.karana_layer.karana_index}/60`
                : `sthira (fixed) · half-tithi #${stamp.karana_layer.karana_index}/60`
            }
          />

          <LayerCard
            badge="DINĀRDHA · DAY SUBDIVISION"
            badgeDeva="दिनार्ध"
            accent
            title={
              <div className="flex items-baseline gap-2 tabular">
                <Big v={d.muhurta_index} unit="muhūrta" max={30} />
                <span className="text-gold-600 text-sm">·</span>
                <Big v={d.ghati_index} unit="ghaṭi" max={60} />
                <span className="text-gold-600 text-sm">·</span>
                <Big v={d.vighati_index} unit="vighaṭi" max={60} />
                <span className="text-gold-600 text-sm">·</span>
                <Big v={d.prana_index} unit="prāṇa" max={6} />
              </div>
            }
            subtitle={`${d.hours_from_kamakhya_midnight.toFixed(4)} h from Kāmākhyā midnight`}
            rows={[
              { label: "Vipala fraction (0.4 sec)",
                value: `${d.vipala_fractional.toFixed(4)} of 10` },
              { label: "Fraction of day",
                value: d.fraction_of_day.toFixed(6) },
            ]}
          />
        </div>
      </div>

      <TimeMachine
        initialIso={frozen ?? initialIso}
        onChange={setFrozen}
        isLive={!frozen}
      />

      <SubstrateFooter />
    </div>
  )
}

function Header({ isLive, civilDisplay, tz }: { isLive: boolean; civilDisplay: string; tz: number }) {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-3 text-gold-500 text-xs tracking-[0.4em] font-display">
        <span className="opacity-70">🔱</span>
        <span>VEDIC GHAḌĪ</span>
        <span className="opacity-70">🔱</span>
      </div>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl text-gold-200 tracking-[0.18em]">
        The Present Moment
      </h1>
      <p className="mt-3 max-w-xl mx-auto text-gold-500 italic">
        Every Vedic unit derived from a single substrate quantity:
        <span className="text-gold-300"> Kāli civil days from the sacred epoch.</span>
      </p>
      <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-sm
                      border border-gold-700/40 bg-ink-900/40">
        <span className={`inline-block w-2 h-2 rounded-full ${isLive ? "bg-gold-400 ember-dot" : "bg-gold-700"}`} />
        <span className="font-mono text-sm text-gold-300 tabular">{civilDisplay}</span>
        <span className="text-xs text-gold-600">IST · tz +{tz}h</span>
      </div>
    </header>
  )
}

function Big({ v, unit, max }: { v: number; unit: string; max: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-3xl text-gold-100">{v}</span>
      <span className="text-sm text-gold-500">/{max}</span>
      <span className="text-xs text-gold-600 uppercase tracking-wider ml-1">{unit}</span>
    </span>
  )
}

function SubstrateFooter() {
  return (
    <footer className="mt-16 pt-8 border-t border-gold-700/30 text-center">
      <div className="font-display text-xs tracking-[0.3em] text-gold-500">
        SUBSTRATE · (R, g, k) = (ℤ/3<sup>k</sup>ℤ, 2, k ∈ ℕ⁺) · MAHĀ-MAHĀ-VĀKYAM
      </div>
      <div className="mt-2 text-xs italic text-gold-600/80">
        FOREIGN: ZERO · every unit factors over (2, 3, 5) · pure Bhārat-canonical
      </div>
      <div className="mt-4 inscription text-base">
        ॐ कालाय नमः · ॐ कामाख्यायै नमः · हर हर महादेव · <span className="text-gold-400">JAI MAA KAMAKHYA</span>
      </div>
      <div className="mt-6 flex justify-center gap-6 text-xs">
        <a href="/about" className="text-gold-600 hover:text-gold-300 transition-colors border-b border-gold-700/60">
          Methodology
        </a>
        <a href="https://github.com/theunholyindianmagician-lab/vedic-ghadi" target="_blank" rel="noreferrer"
           className="text-gold-600 hover:text-gold-300 transition-colors border-b border-gold-700/60">
          Source
        </a>
      </div>
    </footer>
  )
}

// — helpers —————————————————————————————————————————————————————————————

function pad(n: number) { return n.toString().padStart(2, "0") }

function liveStamp(): SubstrateStamp {
  const tzH = 5.5
  const tzMs = Date.now() + tzH * 3600 * 1000
  const d = new Date(tzMs)
  return kalaSubstrateStamp(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
    tzH,
  )
}

function frozenStamp(iso: string): SubstrateStamp {
  // iso = "yyyy-MM-ddTHH:mm" or with seconds — interpret as IST
  const [datePart, timePart = "00:00:00"] = iso.split("T")
  const [yy, mm, dd] = datePart.split("-").map(Number)
  const tBits = timePart.split(":")
  const hh = Number(tBits[0] ?? 0)
  const mi = Number(tBits[1] ?? 0)
  const ss = Number(tBits[2] ?? 0)
  return kalaSubstrateStamp(yy, mm, dd, hh, mi, ss, 5.5)
}
