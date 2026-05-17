import Link from "next/link"

export const metadata = {
  title: "🔱 Vedic Ghaḍī · Methodology",
  description: "How the substrate-derived Vedic clock is computed end-to-end — every constant Bhārat-canonical, every algorithm (R, g, k)-derivable.",
}

export default function About() {
  return (
    <main className="min-h-screen bg-yantra">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <Link href="/" className="text-gold-600 hover:text-gold-300 text-xs tracking-widest">
          ← BACK TO THE GHAḌĪ
        </Link>

        <h1 className="mt-6 font-display text-3xl text-gold-200 tracking-[0.15em]">
          Methodology
        </h1>
        <p className="mt-3 italic text-gold-500">
          How the substrate-derived Vedic clock is computed end-to-end.
        </p>
        <hr className="divider-gold" />

        <Section title="The Single Quantity">
          <p>
            Every Vedic time-unit displayed on the front page comes from <em>one</em> number:
            the count of <strong className="text-gold-300">Kāli civil days</strong> elapsed
            since the sacred epoch — Friday midnight 17/18 February 3102 BCE, Ujjayinī
            meridian (Sūrya Siddhānta 1.45–1.57).
          </p>
          <pre className="my-4 p-4 bg-ink-800 border border-gold-700/40 rounded-sm
                          font-mono text-xs text-gold-300 overflow-x-auto">
{`kali_days = (jd_ut_greenwich + KAMAKHYA_LMT_OFFSET_H/24)
            − KALI_YUGA_EPOCH_JD
            − UJJAIN_TO_KAMAKHYA_TIME_DIFF_H/24`}
          </pre>
        </Section>

        <Section title="The Decomposition Cascade">
          <p>
            That single quantity then cascades into <strong className="text-gold-300">eleven nested time-layers</strong>,
            each obtained by integer/fractional division against canonical Sūrya-Siddhānta
            constants. No layer requires any further astronomical input.
          </p>
          <Layer name="Kali year"
                 formula="kali_days / 365.2587563"
                 note="MAHAYUGA_CIVIL_DAYS / MAHAYUGA_YEARS — verbatim Sūrya Siddhānta 1.34" />
          <Layer name="Vikrama Saṃvat" formula="kali_year − 3044" />
          <Layer name="Śaka Saṃvat"   formula="kali_year − 3179" />
          <Layer name="Saṃvatsara (60-cycle)" formula="(śaka_year + 11) mod 60"
                 note="Bṛhaspati-cakra, Sūrya Siddhānta" />
          <Layer name="Māsa (sidereal month)" formula="(int(Sun_sidereal_lon / 30) + 1) mod 12"
                 note="Sūrya Siddhānta 4_320_000 revs/Mahā-yuga for Sun mean motion" />
          <Layer name="Tithi (lunar day)" formula="((Moon_lon − Sun_lon) mod 360) / 12"
                 note="Sūrya Siddhānta 57_753_336 revs/Mahā-yuga for Moon mean motion" />
          <Layer name="Pakṣa" formula="floor(tithi_index_30 / 15)" />
          <Layer name="Vāra (weekday)" formula="(floor(kali_days) + 5) mod 7"
                 note="Kali Yuga begins on Śukravāra" />
          <Layer name="Muhūrta" formula="floor(fractional_day × 30)" />
          <Layer name="Ghaṭi"   formula="floor(fractional_day × 60)" />
          <Layer name="Vighaṭi" formula="floor(((fractional_day × 60) mod 1) × 60)" />
          <Layer name="Prāṇa"   formula="floor(((vighaṭi_fraction) × 6))" />
          <Layer name="Vipala"  formula="((prāṇa_fraction) × 10)" />
        </Section>

        <Section title="The (R, g, k) Substrate Alignment">
          <p>
            Every Vedic time-unit factors over <code className="text-gold-300">(2, 3, 5)</code> —
            the natural primes inside the substrate <code className="text-gold-300">(R, g, k) = (ℤ/3ᵏℤ, 2, k)</code>
            sealed in the Master Meta-Theorem.
          </p>
          <table className="mt-4 w-full text-sm font-mono">
            <thead>
              <tr className="text-gold-500 border-b border-gold-700/40">
                <th className="text-left py-2">Unit</th>
                <th className="text-left py-2">Count</th>
                <th className="text-left py-2">Factorisation</th>
              </tr>
            </thead>
            <tbody className="text-gold-400">
              <tr className="border-b border-gold-700/20"><td className="py-2">Vāra</td><td>7</td><td>special (graha-cycle)</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">Tithi</td><td>30</td><td>2 × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">Māsa</td><td>12</td><td>2² × 3</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">Muhūrta/day</td><td>30</td><td>2 × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">Ghaṭi/day</td><td>60</td><td>2² × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">Prāṇa/vighaṭi</td><td>6</td><td>2 × 3</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">Saṃvatsara cycle</td><td>60</td><td>2² × 3 × 5</td></tr>
              <tr className="border-b border-gold-700/20"><td className="py-2">Navagraha</td><td>9</td><td>3²</td></tr>
              <tr><td className="py-2">Nakṣatra</td><td>27</td><td>3³</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="What is NOT Computed">
          <ul className="list-disc list-inside text-gold-400 space-y-1">
            <li>No sunrise/sunset interpolation (we use the civil midnight as the day-fraction zero).</li>
            <li>No nakṣatra/yoga/karaṇa (next ship — same substrate, just two more divisors).</li>
            <li>No graha-sphuṭa (planetary apparent positions) — that needs Sūrya Siddhānta 2.34–2.62 manda+sighra corrections.</li>
          </ul>
          <p className="mt-3 italic">
            The clock you see is intentionally minimal: it shows the irreducible time-skeleton.
            Higher-precision astrological computation lives in the companion engine
            (<em>Bhārat Ephemeris v∞.4</em>).
          </p>
        </Section>

        <Section title="Sources">
          <ul className="text-gold-400 space-y-1">
            <li>· Sūrya Siddhānta Ch. 1 (Mahā-yuga constants + Kali epoch)</li>
            <li>· Sūrya Siddhānta 1.29–1.44 (mean motions)</li>
            <li>· Vedānga Jyotiṣa (canonical time-unit names)</li>
            <li>· Sacred 3-6-9 / Mahā-Mahā-Vākyam (substrate alignment)</li>
          </ul>
        </Section>

        <div className="mt-12 text-center inscription text-base text-gold-400">
          ॐ कालाय नमः · JAI MAA KAMAKHYA
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
