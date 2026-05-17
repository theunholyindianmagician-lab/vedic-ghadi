"use client"

import { useEffect, useState, useCallback } from "react"
import { kalaSubstrateStamp, type SubstrateStamp } from "@/lib/substrate"
import { TimeYantra } from "./TimeYantra"
import { LayerCard } from "./LayerCard"
import { TimeMachine } from "./TimeMachine"
import { FormulaePanel } from "./FormulaePanel"
import { MeridianComparison } from "./MeridianComparison"
import { MeridianGrid } from "./MeridianGrid"
import { SphotaSunburst } from "./SphotaSunburst"

/**
 * 🔱 वैदिक घडी — जीवंत
 *
 * हर animation-frame पर local clock से refresh होती है। Substrate TS में
 * port है, इसलिए client-side पूरा computation smoothly चलता है।
 */
export function GhadiClock() {
  const [frozen, setFrozen] = useState<string | null>(null)
  const [stamp, setStamp] = useState<SubstrateStamp>(() => liveStamp())

  const tick = useCallback(() => {
    setStamp(frozen ? frozenStamp(frozen) : liveStamp())
  }, [frozen])

  useEffect(() => {
    let raf = 0
    const loop = () => { tick(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tick])

  const y = stamp.year_layer
  const m = stamp.month_layer
  const t = stamp.tithi_layer
  const ci = stamp.input_civil

  const civilDisplay = `${ci.gregorian_year.toString().padStart(4,'0')}-${ci.month.toString().padStart(2,'0')}-${ci.day.toString().padStart(2,'0')}  ${ci.hour.toString().padStart(2,'0')}:${ci.minute.toString().padStart(2,'0')}:${Math.floor(ci.second).toString().padStart(2,'0')}`

  const initialIso = (() => {
    const ist = new Date(Date.now() + (5.5 - new Date().getTimezoneOffset() / -60) * 3600 * 1000)
    return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())}T${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`
  })()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
      <Header isLive={!frozen} civilDisplay={civilDisplay} tz={ci.tz_h} />

      <div className="mt-10 grid lg:grid-cols-2 gap-10 items-start">
        {/* बायाँ स्तम्भ: यन्त्र */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[520px] mx-auto">
            <TimeYantra stamp={stamp} />
          </div>
          <div className="mt-6 text-center">
            <div className="font-display text-xs tracking-[0.4em] text-gold-500 mb-2">
              कामाख्या-केन्द्रित · कलि दिन
            </div>
            <div className="font-mono text-xl text-gold-300 tabular">
              {stamp.kali_civil_days_at_kamakhya.toLocaleString(undefined, {
                minimumFractionDigits: 6, maximumFractionDigits: 6,
              })}
            </div>
            <div className="text-xs italic text-gold-600/80 mt-1">
              पवित्र युगादि (शुक्रवार आधी रात 17/18 फरवरी 3102 BCE · अवन्तिकापुर) से दिन
            </div>
            <div className="mt-2 text-[10px] font-mono text-gold-700 tracking-wider">
              K = JD_UT + 6.1137/24 − 588 465.5 − 1.062/24
            </div>
          </div>
        </div>

        {/* दायाँ स्तम्भ: layer cards */}
        <div className="space-y-4">
          <LayerCard
            badge="वर्ष · VARṢA"
            badgeDeva="वर्ष"
            accent
            title={
              <div className="flex items-baseline gap-3">
                <span>कलि {y.kali_year_current.toLocaleString()}</span>
                <span className="text-gold-600 text-sm">/ {y.samvatsara.name}</span>
              </div>
            }
            subtitle={`संवत्सर #${y.samvatsara.index + 1} / 60 · बृहस्पति-चक्र`}
            rows={[
              { label: "विक्रम संवत्",  value: y.vikrama_samvat.toLocaleString() },
              { label: "शक संवत्",     value: y.shaka_samvat.toLocaleString() },
              { label: "elapsed (float)", value: y.kali_year_float.toFixed(4) },
            ]}
            formula="Y = K / 365.25868 · V = Y − 3044 · Ś = Y − 3179 · S = (Ś+11) mod 60"
          />

          <LayerCard
            badge="मास · MĀSA"
            badgeDeva={m.masa_devanagari}
            title={m.masa_name}
            subtitle={`मास #${m.masa_index} / 12 · सूर्य राशि #${m.sun_sign_index}`}
            rows={[
              { label: "सूर्य सिद्ध लम्बांश",
                value: `${m.sun_sidereal_lon_deg.toFixed(4)}°` },
            ]}
            formula="M = (⌊L☉ / 30⌋ + 1) mod 12"
          />

          <LayerCard
            badge="पक्ष · तिथि"
            badgeDeva={t.paksha_devanagari}
            title={t.tithi_name}
            subtitle={`${t.paksha_name} · तिथि #${t.tithi_index} / 30 (${t.tithi_in_paksha}/15)`}
            rows={[
              { label: "चन्द्र − सूर्य",
                value: `${t.moon_minus_sun_deg.toFixed(4)}°` },
              { label: "fractional तिथि",
                value: t.fractional_tithi.toFixed(4) },
            ]}
            formula="T = ⌊((L☾ − L☉) mod 360) / 12⌋ + 1"
          />

          <LayerCard
            badge="नक्षत्र · NAKṢATRA"
            badgeDeva={stamp.nakshatra_layer.nakshatra_devanagari}
            title={
              <div className="flex items-baseline gap-3">
                <span>{stamp.nakshatra_layer.nakshatra_name}</span>
                <span className="text-gold-600 text-sm">पाद {stamp.nakshatra_layer.pada}/4</span>
              </div>
            }
            subtitle={`#${stamp.nakshatra_layer.nakshatra_index} / 27 · देवता ${stamp.nakshatra_layer.nakshatra_deity}`}
            rows={[
              { label: "विंशोत्तरी स्वामी", value: stamp.nakshatra_layer.nakshatra_lord },
              { label: "चन्द्र सिद्ध लम्बांश", value: `${stamp.nakshatra_layer.moon_sidereal_lon_deg.toFixed(4)}°` },
            ]}
            formula="N = ⌊L☾ / (360/27)⌋ + 1  · पाद = ⌊nak_frac × 4⌋ + 1"
          />

          <LayerCard
            badge="योग · YOGA"
            badgeDeva={stamp.yoga_layer.yoga_devanagari}
            title={stamp.yoga_layer.yoga_name}
            subtitle={`#${stamp.yoga_layer.yoga_index} / 27 · (सूर्य + चन्द्र) / 13°20′`}
            rows={[
              { label: "सूर्य + चन्द्र लम्बांश",
                value: `${stamp.yoga_layer.sun_plus_moon_lon_deg.toFixed(4)}°` },
              { label: "fractional योग",
                value: stamp.yoga_layer.fractional_yoga.toFixed(4) },
            ]}
            formula="Yg = ⌊((L☉ + L☾) mod 360) / (360/27)⌋ + 1"
          />

          <LayerCard
            badge="करण · KARAṆA"
            badgeDeva={stamp.karana_layer.karana_devanagari}
            title={stamp.karana_layer.karana_name}
            subtitle={
              stamp.karana_layer.is_movable
                ? `चर (movable) · चक्र ${stamp.karana_layer.movable_cycle_number}/8 · आधी-तिथि #${stamp.karana_layer.karana_index}/60`
                : `स्थिर (fixed) · आधी-तिथि #${stamp.karana_layer.karana_index}/60`
            }
            formula="C = ⌊((L☾ − L☉) mod 360) / 6⌋ + 1  · ७ चर × ८ चक्र + ४ स्थिर"
          />

        </div>
      </div>

      {/* दोनों meridian primary — Ujjayinī (Sūrya Siddhānta) ⟷ Kāmākhyā (KAAL) */}
      <MeridianComparison bm={stamp.by_meridian} />

      {/* सर्व-मेरिडियन — सब 84 cities, parallel table */}
      <MeridianGrid stamp={stamp} />

      {/* 504 cells live visualization */}
      <SphotaSunburst stamp={stamp} />

      <FormulaePanel stamp={stamp} />

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
        <span>वैदिक घडी · VEDIC GHAḌĪ</span>
        <span className="opacity-70">🔱</span>
      </div>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl text-gold-200 tracking-[0.18em]">
        वर्तमान क्षण
      </h1>
      <p className="mt-3 max-w-xl mx-auto text-gold-500 italic">
        हर वैदिक इकाई एक ही substrate-राशि से निकलती है —
        <span className="text-gold-300"> पवित्र युगादि से कलि सावन दिन।</span>
      </p>
      <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-sm
                      border border-gold-700/40 bg-ink-900/40">
        <span className={`inline-block w-2 h-2 rounded-full ${isLive ? "bg-gold-400 ember-dot" : "bg-gold-700"}`} />
        <span className="font-mono text-sm text-gold-300 tabular">{civilDisplay}</span>
        <span className="text-xs text-gold-600">IST · tz +{tz}h {isLive ? "· जीवंत" : "· स्थिर"}</span>
      </div>
    </header>
  )
}

// Big helper removed — moved to MeridianComparison.tsx

function SubstrateFooter() {
  return (
    <footer className="mt-16 pt-8 border-t border-gold-700/30 text-center">
      <div className="font-display text-xs tracking-[0.3em] text-gold-500">
        मूल आधार · SUBSTRATE — (R, g, k) = (ℤ/3<sup>k</sup>ℤ, 2, k ∈ ℕ⁺) · महा-महा-वाक्यम्
      </div>
      <div className="mt-2 text-xs italic text-gold-600/80">
        विदेशी निर्भरता: शून्य · हर इकाई (२, ३, ५) में विभाज्य · पूर्ण भारत-canonical
      </div>
      <div className="mt-4 inscription text-base">
        ॐ कालाय नमः · ॐ कामाख्यायै नमः · हर हर महादेव · <span className="text-gold-400">JAI MAA KAMAKHYA</span>
      </div>
      <div className="mt-6 flex justify-center gap-6 text-xs">
        <a href="/about" className="text-gold-600 hover:text-gold-300 transition-colors border-b border-gold-700/60">
          विधि · Methodology
        </a>
        <a href="https://github.com/theunholyindianmagician-lab/vedic-ghadi" target="_blank" rel="noreferrer"
           className="text-gold-600 hover:text-gold-300 transition-colors border-b border-gold-700/60">
          स्रोत · Source
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
  const [datePart, timePart = "00:00:00"] = iso.split("T")
  const [yy, mm, dd] = datePart.split("-").map(Number)
  const tBits = timePart.split(":")
  const hh = Number(tBits[0] ?? 0)
  const mi = Number(tBits[1] ?? 0)
  const ss = Number(tBits[2] ?? 0)
  return kalaSubstrateStamp(yy, mm, dd, hh, mi, ss, 5.5)
}
