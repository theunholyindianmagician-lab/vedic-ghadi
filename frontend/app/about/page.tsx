import Link from "next/link"

export const metadata = {
  title: "🔱 वैदिक घडी · विधि / Methodology",
  description: "Substrate-derived Vedic clock — हर सूत्र, हर नियतांक, हर derivation step-by-step।",
}

export default function About() {
  return (
    <main className="min-h-screen bg-yantra">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <Link href="/" className="text-gold-600 hover:text-gold-300 text-xs tracking-widest">
          ← घडी पर वापस
        </Link>

        <h1 className="mt-6 font-display text-3xl text-gold-200 tracking-[0.15em]">
          विधि · Methodology
        </h1>
        <p className="mt-3 italic text-gold-500">
          substrate-derived वैदिक घडी end-to-end कैसे compute होती है।
        </p>
        <hr className="divider-gold" />

        <Section title="◈ एक ही राशि · The Single Quantity">
          <p>
            पहले पन्ने पर जो भी दिखता है — वो सब एक ही संख्या से निकलता है:
            <strong className="text-gold-300"> कलि सावन दिन</strong> (Kāli civil
            days) — पवित्र युगादि से लेकर अभी तक के सावन दिन। युगादि =
            शुक्रवार आधी रात 17/18 फरवरी 3102 BCE, अवन्तिकापुर (Ujjayinī)
            मेरिडियन (सूर्य सिद्धान्त १.४५–१.५७)।
          </p>
          <pre className="my-4 p-4 bg-ink-800 border border-gold-700/40 rounded-sm
                          font-mono text-xs text-gold-300 overflow-x-auto">
{`K = (JD_UT + KAMAKHYA_LMT/24)
    − KALI_YUGA_EPOCH_JD
    − UJJAIN_TO_KAMAKHYA_DIFF/24`}
          </pre>
        </Section>

        <Section title="◈ Cascade · नौ स्तर">
          <p>
            फिर यही एक संख्या <strong className="text-gold-300">ग्यारह nested स्तरों</strong> में
            cascade करती है। हर स्तर canonical Sūrya-Siddhānta constants पर
            integer/fractional division है। किसी भी नए astronomical input की
            आवश्यकता नहीं।
          </p>
          <Layer name="कलि वर्ष" formula="Y = K / 365.258680…"
                 note="MAHAYUGA_CIVIL_DAYS / MAHAYUGA_YEARS — सूर्य सिद्धान्त १.३४" />
          <Layer name="विक्रम संवत्" formula="V = Y − 3044" />
          <Layer name="शक संवत्"     formula="Ś = Y − 3179" />
          <Layer name="संवत्सर (६० चक्र)" formula="S = (⌊Ś⌋ + 11) mod 60"
                 note="बृहस्पति-चक्र · सूर्य सिद्धान्त" />
          <Layer name="मास (sidereal)" formula="M = (⌊L☉ / 30⌋ + 1) mod 12"
                 note="L☉ = सूर्य मध्यम लम्बांश · Sūrya Siddhānta 1.29 से" />
          <Layer name="तिथि (lunar day)" formula="T = ⌊((L☾ − L☉) mod 360) / 12⌋ + 1"
                 note="L☾ = चन्द्र मध्यम लम्बांश · Sūrya Siddhānta 1.29 से" />
          <Layer name="पक्ष" formula="P = ⌊(T − 1) / 15⌋" />
          <Layer name="वार" formula="W = (⌊K⌋ + 5) mod 7"
                 note="कलि दिन-० = शुक्रवार (5)" />
          <Layer name="नक्षत्र (२७)" formula="N = ⌊L☾ / (360/27)⌋ + 1" />
          <Layer name="पाद (४ per नक्षत्र)" formula="Pa = ⌊(N_frac × 4)⌋ + 1" />
          <Layer name="योग (२७)" formula="Yg = ⌊((L☉ + L☾) mod 360) / (360/27)⌋ + 1" />
          <Layer name="करण (६० आधी-तिथि)" formula="C = ⌊((L☾ − L☉) mod 360) / 6⌋ + 1"
                 note="७ चर × ८ चक्र + ४ स्थिर = ६०" />
          <Layer name="मुहूर्त"  formula="μ = ⌊f × 30⌋ + 1   (f = K − ⌊K⌋)" />
          <Layer name="घटी"     formula="g = ⌊f × 60⌋ + 1" />
          <Layer name="विघटी"   formula="v = ⌊((f × 60) mod 1) × 60⌋ + 1" />
          <Layer name="प्राण"   formula="p = ⌊v_frac × 6⌋ + 1" />
          <Layer name="विपल"    formula="vi = p_frac × 10" />
        </Section>

        <Section title="◈ (R, g, k) Substrate · हर divisor (२, ३, ५) में">
          <p>
            हर वैदिक काल-इकाई <code className="text-gold-300">(2, 3, 5)</code>
            में विभाज्य है — यही वो primes हैं जो substrate
            <code className="text-gold-300"> (R, g, k) = (ℤ/3ᵏℤ, 2, k)</code> के
            अन्दर natural हैं (Mahā-Mahā-Vākyam में सीलबन्द)।
          </p>
          <table className="mt-4 w-full text-sm font-mono">
            <thead>
              <tr className="text-gold-500 border-b border-gold-700/40">
                <th className="text-left py-2">इकाई</th>
                <th className="text-left py-2">गणना</th>
                <th className="text-left py-2">Factorisation</th>
              </tr>
            </thead>
            <tbody className="text-gold-400">
              <tr className="border-b border-gold-700/20"><td className="py-2">वार</td><td>7</td><td>विशेष (graha-cycle)</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">तिथि</td><td>30</td><td>2 × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">मास</td><td>12</td><td>2² × 3</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">नक्षत्र</td><td>27</td><td>3³</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">योग</td><td>27</td><td>3³</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">पाद</td><td>4</td><td>2²</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">करण (आधी-तिथि)</td><td>60</td><td>2² × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">मुहूर्त / दिन</td><td>30</td><td>2 × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">घटी / दिन</td><td>60</td><td>2² × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">प्राण / विघटी</td><td>6</td><td>2 × 3</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">संवत्सर चक्र</td><td>60</td><td>2² × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">नवग्रह</td><td>9</td><td>3²</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="◈ क्या नहीं compute होता">
          <ul className="list-disc list-inside text-gold-400 space-y-1">
            <li>सूर्योदय / सूर्यास्त interpolation नहीं — civil midnight ही दिनांश का शून्य है।</li>
            <li>ग्रह-स्फुट (apparent positions) नहीं — उसके लिए Sūrya Siddhānta 2.34–2.62 के manda+sighra corrections चाहिए।</li>
          </ul>
          <p className="mt-3 italic">
            यह घडी जानबूझकर minimal है: सिर्फ irreducible काल-skeleton दिखाती है।
            High-precision astrological computation companion engine <em>Bhārat
            Ephemeris v∞.4</em> में है।
          </p>
        </Section>

        <Section title="◈ स्रोत · Sources">
          <ul className="text-gold-400 space-y-1">
            <li>· सूर्य सिद्धान्त Ch. १ (Mahā-yuga + Kali epoch)</li>
            <li>· सूर्य सिद्धान्त १.२९–१.४४ (मध्यम गति · mean motions)</li>
            <li>· वेदाङ्ग ज्योतिष (canonical काल-इकाई नाम)</li>
            <li>· Mahā-Mahā-Vākyam — (R, g, k) substrate alignment</li>
            <li>· बृहत्-संहिता Ch. ९ — नक्षत्र देवता</li>
            <li>· BPHS — Vimśottarī daśā lordship</li>
          </ul>
        </Section>

        <div className="mt-12 text-center inscription text-base text-gold-400">
          ॐ कालाय नमः · हर हर महादेव · JAI MAA KAMAKHYA
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg text-gold-300 tracking-[0.18em] mb-3">{title}</h2>
      <div className="text-gold-400 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

function Layer({ name, formula, note }: { name: string; formula: string; note?: string }) {
  return (
    <div className="mt-3 pl-4 border-l border-gold-700/40">
      <div className="font-display text-gold-300 text-sm tracking-wider">{name}</div>
      <code className="block text-xs text-gold-500 mt-0.5">{formula}</code>
      {note && <div className="text-xs italic text-gold-600/80 mt-0.5">{note}</div>}
    </div>
  )
}
