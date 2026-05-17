"use client"

import { useState } from "react"
import type { SubstrateStamp } from "@/lib/substrate"

/**
 * 🔱 सूत्र-पट्ट · FORMULAE PANEL
 *
 * हर वैदिक इकाई का सूत्र (formula) दिखाता है — साथ ही इस क्षण के लिए
 * substitute किए हुए values भी। एक सूत्र क्लिक करने पर detail expand होती है।
 */
export function FormulaePanel({ stamp }: { stamp: SubstrateStamp }) {
  const [open, setOpen] = useState(false)
  const K = stamp.kali_civil_days_at_kamakhya
  const sunLon = stamp.month_layer.sun_sidereal_lon_deg
  const moonLon = stamp.nakshatra_layer.moon_sidereal_lon_deg
  const elong = stamp.tithi_layer.moon_minus_sun_deg
  const frac = stamp.day_subdivision.fraction_of_day

  return (
    <section className="mt-12 rounded-sm border border-gold-700/40 bg-ink-900/40 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4
                   hover:bg-gold-500/5 transition-colors"
      >
        <div className="flex items-baseline gap-3">
          <span className="font-display tracking-[0.3em] text-gold-400 text-sm">
            सूत्र-पट्ट · FORMULAE
          </span>
          <span className="text-xs text-gold-600 italic">
            हर इकाई का गणित — एक ही substrate quantity से
          </span>
        </div>
        <span className="text-gold-500 text-xl">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-6 pb-8 space-y-8">
          <Constants />
          <SourceQuantity K={K} stamp={stamp} />
          <YearFormulae K={K} stamp={stamp} />
          <MonthTithiFormulae sunLon={sunLon} moonLon={moonLon} elong={elong} stamp={stamp} />
          <VaraFormula K={K} stamp={stamp} />
          <PanchangaFormulae sunLon={sunLon} moonLon={moonLon} elong={elong} stamp={stamp} />
          <DaySubdivisionFormulae frac={frac} stamp={stamp} />
          <SubstrateNote />
        </div>
      )}
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 pb-1 border-b border-gold-700/30">
        <h3 className="font-display tracking-[0.18em] text-gold-300 text-sm">{title}</h3>
        {subtitle && <span className="text-xs italic text-gold-600/80">{subtitle}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Formula({
  label, deva, formula, substitution, result, note,
}: {
  label: string
  deva?: string
  formula: string
  substitution?: string
  result: React.ReactNode
  note?: string
}) {
  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-2 md:gap-4 items-start">
      <div className="flex items-baseline gap-2 pt-1">
        <span className="font-display text-gold-300 text-sm">{label}</span>
        {deva && <span className="inscription text-sm opacity-80">{deva}</span>}
      </div>
      <div className="space-y-1">
        <code className="block text-xs text-gold-400 bg-ink-800/60 px-2 py-1 rounded-sm font-mono">
          {formula}
        </code>
        {substitution && (
          <code className="block text-xs text-gold-600 px-2 font-mono">
            = {substitution}
          </code>
        )}
        <div className="text-sm text-gold-200 tabular px-2">
          → <span className="text-gold-100 font-display">{result}</span>
        </div>
        {note && <div className="text-xs italic text-gold-600/70 px-2">{note}</div>}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────

function Constants() {
  const rows = [
    ["KALI_YUGA_EPOCH_JD",     "588 465.5",          "सूर्य सिद्धान्त १.४५–१.५७ · शुक्रवार आधी रात 17/18 Feb 3102 BCE"],
    ["MAHAYUGA_YEARS",         "4 320 000",          "एक महायुग · सूर्य सिद्धान्त १.३४"],
    ["MAHAYUGA_CIVIL_DAYS",    "1 577 917 500",      "एक महायुग के सावन दिन"],
    ["KALI_DAYS_PER_YEAR",     "365.258680555…",     "= MAHAYUGA_CIVIL_DAYS / MAHAYUGA_YEARS"],
    ["KAMAKHYA_LON_DEG",       "91.7059°",           "नीलाचल · गुवाहाटी · सोवरेन शून्य देशान्तर"],
    ["KAMAKHYA_LMT_OFFSET",    "+6.1137 h",          "= 91.7059° / 15° per hour"],
    ["UJJAIN_LON_DEG",         "75.778889°",         "अवन्तिकापुर · सूर्य सिद्धान्त मेरिडियन"],
    ["SUN_REVS_PER_MAHAYUGA",  "4 320 000",          "रवि — एक revolution = एक नाक्षत्र वर्ष"],
    ["MOON_REVS_PER_MAHAYUGA", "57 753 336",         "चन्द्र — एक revolution = एक नाक्षत्र मास"],
  ]
  return (
    <Section title="◈ नियतांक · CONSTANTS" subtitle="हर सूत्र इन्हीं नौ संख्याओं पर खड़ा है">
      <div className="space-y-1">
        {rows.map(([name, value, note]) => (
          <div key={name} className="grid md:grid-cols-[260px_180px_1fr] gap-2 text-xs font-mono">
            <span className="text-gold-500">{name}</span>
            <span className="text-gold-200 tabular">{value}</span>
            <span className="text-gold-600/80 italic">{note}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

function SourceQuantity({ K, stamp }: { K: number; stamp: SubstrateStamp }) {
  return (
    <Section title="◈ मूल राशि · SOURCE QUANTITY"
             subtitle="यही एक संख्या — बाकी सब इसी से निकलता है">
      <Formula
        label="Greg → JD"
        formula="JD_UT = ⌊365.25(y+4716)⌋ + ⌊30.6001(m+1)⌋ + d + B − 1524.5 + h/24"
        note="ग्रेगोरियन इनपुट — पूरे computation में एकमात्र पाश्चात्य संदर्भ"
        result={<span className="text-xs">y={stamp.input_civil.gregorian_year}, m={stamp.input_civil.month}, d={stamp.input_civil.day}</span>}
      />
      <Formula
        label="Kali सावन दिन"
        deva="कलि दिन"
        formula="K = JD_UT + KAMAKHYA_OFFSET/24 − KALI_EPOCH_JD − UJJAIN_DIFF/24"
        substitution={`JD_UT + 6.1137/24 − 588 465.5 − 1.062/24`}
        result={`K = ${K.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`}
        note="कामाख्या मेरिडियन-केन्द्रित कलि सावन दिन (एकमात्र source quantity)"
      />
    </Section>
  )
}

function YearFormulae({ K, stamp }: { K: number; stamp: SubstrateStamp }) {
  const y = stamp.year_layer
  return (
    <Section title="◈ वर्ष-स्तर · YEAR LAYER" subtitle="K / 365.25868 → कलि वर्ष → विक्रम / शक / संवत्सर">
      <Formula
        label="Kali वर्ष"
        deva="कलि वर्ष"
        formula="Y = K / KALI_DAYS_PER_YEAR    ·    ⌊Y⌋ = elapsed Kali years"
        substitution={`${K.toLocaleString(undefined, {maximumFractionDigits: 4})} / 365.258680…`}
        result={`Y = ${y.kali_year_float.toFixed(4)}  →  कलि वर्ष = ${y.kali_year_current.toLocaleString()} (बीत चुके)`}
        note="ELAPSED convention — Vikrama/Śaka से consistent · हर public almanac यही convention follow करता है"
      />
      <Formula label="विक्रम संवत्" deva="विक्रम"
        formula="V = Y − 3044"
        result={`V = ${y.vikrama_samvat.toLocaleString()}`} />
      <Formula label="शक संवत्" deva="शक"
        formula="Ś = Y − 3179"
        result={`Ś = ${y.shaka_samvat.toLocaleString()}`} />
      <Formula label="संवत्सर (६० चक्र)" deva="बृहस्पति चक्र"
        formula="S = (⌊Ś⌋ + 11) mod 60"
        substitution={`(${y.shaka_samvat} + 11) mod 60`}
        result={`#${y.samvatsara.index + 1} / 60 → ${y.samvatsara.name}`}
        note="६० = २² × ३ × ५ — substrate-aligned" />
    </Section>
  )
}

function MonthTithiFormulae({ sunLon, moonLon, elong, stamp }: {
  sunLon: number; moonLon: number; elong: number; stamp: SubstrateStamp
}) {
  const m = stamp.month_layer
  const t = stamp.tithi_layer
  return (
    <Section title="◈ मास · पक्ष · तिथि" subtitle="सूर्य-चन्द्र मध्यम लम्बांश से">
      <Formula label="Sun मध्यम लम्बांश" deva="रवि-सूर्य"
        formula="L☉ = (4 320 000 × 360 / 1 577 917 500) × K  mod 360"
        substitution="= (207 360 / 210 389) × K  mod 360 = 0.9856028595°/day × K  mod 360"
        result={`L☉ = ${sunLon.toFixed(4)}°`}
        note="Sūrya Siddhānta 1.29 — रवि revolutions per Mahā-yuga = 4 320 000 · exact ratio 207 360/210 389 used in code (no truncation)" />
      <Formula label="Moon मध्यम लम्बांश" deva="चन्द्र"
        formula="L☾ = (57 753 336 × 360 / 1 577 917 500) × K  mod 360"
        substitution="= (5 680 656 / 431 125) × K  mod 360 = 13.1763548855°/day × K  mod 360"
        result={`L☾ = ${moonLon.toFixed(4)}°`}
        note="Sūrya Siddhānta 1.29 — चन्द्र revolutions per Mahā-yuga = 57 753 336 · exact ratio 5 680 656/431 125 used in code (no truncation)" />
      <Formula label="मास (sidereal)" deva={m.masa_devanagari}
        formula="M = (⌊L☉ / 30⌋ + 1) mod 12"
        substitution={`(⌊${sunLon.toFixed(2)} / 30⌋ + 1) mod 12`}
        result={`#${m.masa_index} / 12 → ${m.masa_name}`}
        note="सूर्य की राशि से मास निर्धारित" />
      <Formula label="तिथि" deva="तिथि"
        formula="T = ⌊((L☾ − L☉) mod 360) / 12⌋ + 1"
        substitution={`⌊${elong.toFixed(4)}° / 12⌋ + 1`}
        result={`T = ${t.tithi_index} / 30 → ${t.tithi_name}`}
        note="३० = २ × ३ × ५ — substrate-aligned" />
      <Formula label="पक्ष" deva={t.paksha_devanagari}
        formula="P = ⌊(T − 1) / 15⌋"
        result={`P = ${t.paksha_index - 1} → ${t.paksha_name}`} />
    </Section>
  )
}

function VaraFormula({ K, stamp }: { K: number; stamp: SubstrateStamp }) {
  const v = stamp.vara_layer
  return (
    <Section title="◈ वार" subtitle="कलियुग का दिन-० = शुक्रवार">
      <Formula label="वार" deva={v.vara_devanagari}
        formula="W = (⌊K⌋ + 5) mod 7"
        substitution={`(${Math.floor(K).toLocaleString()} + 5) mod 7`}
        result={`W = ${v.vara_index} → ${v.vara_name} (lord ${v.vara_lord_graha})`}
        note="+5 इसलिए क्योंकि कलि का दिन-० शुक्रवार (5) है" />
    </Section>
  )
}

function PanchangaFormulae({ sunLon, moonLon, elong, stamp }: {
  sunLon: number; moonLon: number; elong: number; stamp: SubstrateStamp
}) {
  const n = stamp.nakshatra_layer
  const y = stamp.yoga_layer
  const k = stamp.karana_layer
  return (
    <Section title="◈ पञ्चाङ्ग — नक्षत्र · योग · करण"
             subtitle="कोई नया input नहीं — वही दो लम्बांश, दो और divisors">
      <Formula label="नक्षत्र (२७)" deva={n.nakshatra_devanagari}
        formula="N = ⌊L☾ / (360/27)⌋ + 1"
        substitution={`⌊${moonLon.toFixed(4)}° / 13.333°⌋ + 1`}
        result={`N = ${n.nakshatra_index} / 27 → ${n.nakshatra_name} (देवता ${n.nakshatra_deity})`}
        note="२७ = ३³ — Trinity³ substrate" />
      <Formula label="पाद (२७ × ४ = १०८)"
        formula="Pa = ⌊(L☾ mod 13.333°) / 3.333°⌋ + 1"
        result={`पाद ${n.pada} / 4 · Vimśottarī lord: ${n.nakshatra_lord}`}
        note="४ = २²  ·  १०८ = २² × ३³" />
      <Formula label="योग (२७)" deva={y.yoga_devanagari}
        formula="Yg = ⌊((L☉ + L☾) mod 360) / (360/27)⌋ + 1"
        substitution={`⌊${y.sun_plus_moon_lon_deg.toFixed(4)}° / 13.333°⌋ + 1`}
        result={`Yg = ${y.yoga_index} / 27 → ${y.yoga_name}`} />
      <Formula label="करण (आधी तिथि)" deva={k.karana_devanagari}
        formula="C = ⌊((L☾ − L☉) mod 360) / 6⌋ + 1"
        substitution={`⌊${elong.toFixed(4)}° / 6⌋ + 1`}
        result={`C = ${k.karana_index} / 60 → ${k.karana_name} ${k.is_movable ? `(चर, चक्र ${k.movable_cycle_number}/8)` : "(स्थिर)"}`}
        note="६० = २² × ३ × ५ · ७ चर × ८ चक्र + ४ स्थिर = ६०" />
    </Section>
  )
}

function DaySubdivisionFormulae({ frac, stamp }: { frac: number; stamp: SubstrateStamp }) {
  const d = stamp.day_subdivision
  return (
    <Section title="◈ दिनार्ध · DAY SUBDIVISION" subtitle="K के दशमलव भाग को ३० / ६० / ६ / १० में बाँटना">
      <Formula label="दिन-भाग" deva="दिनांश"
        formula="f = K − ⌊K⌋"
        result={`f = ${frac.toFixed(6)}  →  ${(frac * 24).toFixed(4)} h`} />
      <Formula label="मुहूर्त (४८ min)" deva="मुहूर्त"
        formula="μ = ⌊f × 30⌋ + 1"
        result={`#${d.muhurta_index} / 30 (${d.muhurta_fractional.toFixed(4)} fractional)`}
        note="३० = २ × ३ × ५" />
      <Formula label="घटी (२४ min)" deva="घटी"
        formula="g = ⌊f × 60⌋ + 1"
        result={`#${d.ghati_index} / 60`}
        note="६० = २² × ३ × ५" />
      <Formula label="विघटी (२४ sec)" deva="विघटी"
        formula="v = ⌊((f × 60) mod 1) × 60⌋ + 1"
        result={`#${d.vighati_index} / 60`} />
      <Formula label="प्राण (४ sec)" deva="प्राण"
        formula="p = ⌊(v_frac) × 6⌋ + 1"
        result={`#${d.prana_index} / 6`}
        note="६ = २ × ३ — Bhāva (3) × Pakṣa (2)" />
      <Formula label="विपल (०.४ sec)" deva="विपल"
        formula="vi = (p_frac) × 10"
        result={`${d.vipala_fractional.toFixed(4)} / 10`}
        note="seconds-level resolution" />
    </Section>
  )
}

function SubstrateNote() {
  return (
    <div className="mt-6 pt-4 border-t border-gold-700/30 text-center">
      <div className="font-display text-xs tracking-[0.25em] text-gold-400 mb-2">
        substrate alignment — हर divisor (२, ३, ५) primes में
      </div>
      <div className="text-xs font-mono text-gold-500 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <span>७ <span className="text-gold-600">(विशेष · ग्रह)</span></span>
        <span>१२ = २² × ३</span>
        <span>२७ = ३³</span>
        <span>३० = २ × ३ × ५</span>
        <span>६० = २² × ३ × ५</span>
        <span>६ = २ × ३</span>
        <span>९ = ३²</span>
      </div>
      <div className="mt-3 text-xs italic text-gold-600/80">
        (R, g, k) = (ℤ/3<sup>k</sup>ℤ, 2, k ∈ ℕ⁺) — Mahā-Mahā-Vākyam
      </div>
    </div>
  )
}
