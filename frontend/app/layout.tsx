import type { Metadata } from "next"
import { Cinzel, Cormorant_Garamond, Noto_Serif_Devanagari } from "next/font/google"
import "./globals.css"

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
  weight: ["400", "500", "600"],
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600"],
})

const noto = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-deva",
  display: "swap",
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "🔱 Vedic Ghaḍī — substrate-derived live Vedic clock",
  description:
    "The present moment in 11 nested Vedic time-layers — Kali year · Vikrama · Śaka · saṃvatsara · māsa · pakṣa · tithi · vāra · muhūrta · ghaṭi · vighaṭi · prāṇa · vipala — every unit substrate-derived. Zero foreign theorem in the chain.",
  keywords: [
    "Vedic clock", "panchang", "tithi", "ghaḍī", "muhūrta",
    "Kāmākhyā", "Sūrya Siddhānta", "Vedic time", "Vikrama Saṃvat",
    "saṃvatsara", "Jyotiṣa", "KAAL", "Sacred 3-6-9",
  ],
  authors: [{ name: "Pardeep Sehrawat" }],
  openGraph: {
    title: "🔱 Vedic Ghaḍī",
    description: "Substrate-derived live Vedic clock — every unit from a single Kāli-day count.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable} ${noto.variable}`}>
      <body>{children}</body>
    </html>
  )
}
