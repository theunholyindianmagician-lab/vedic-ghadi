"use client"

import { ReactNode } from "react"

interface LayerCardProps {
  badge: string             // small uppercase label e.g. "VARṢA"
  badgeDeva?: string        // Devanāgarī label e.g. "वर्ष"
  title: ReactNode          // big main value
  subtitle?: ReactNode      // supporting line
  rows?: { label: string; value: ReactNode }[]
  accent?: boolean          // brighter gold treatment
  formula?: string          // inline mini-formula shown at the bottom
}

export function LayerCard({ badge, badgeDeva, title, subtitle, rows, accent, formula }: LayerCardProps) {
  return (
    <div className={[
      "relative rounded-sm border bg-ink-900/60 backdrop-blur-sm p-5",
      "transition-shadow duration-700",
      accent
        ? "border-gold-500/60 shadow-gold-glow"
        : "border-gold-700/40 hover:border-gold-600/60",
    ].join(" ")}>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[10px] tracking-[0.3em] text-gold-500 font-display">
          {badge}
        </span>
        {badgeDeva && (
          <span className="inscription text-sm opacity-80">{badgeDeva}</span>
        )}
      </div>
      <div className="font-display text-2xl text-gold-200 leading-tight tabular">
        {title}
      </div>
      {subtitle && (
        <div className="mt-1 text-sm text-gold-500 italic">{subtitle}</div>
      )}
      {rows && rows.length > 0 && (
        <div className="mt-4 space-y-1.5 text-sm">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span className="text-gold-600/80">{r.label}</span>
              <span className="text-gold-300 tabular">{r.value}</span>
            </div>
          ))}
        </div>
      )}
      {formula && (
        <div className="mt-4 pt-3 border-t border-gold-700/25">
          <div className="text-[10px] tracking-[0.2em] text-gold-600 font-display mb-1">
            सूत्र · FORMULA
          </div>
          <code className="block text-[11px] font-mono text-gold-400/90 leading-relaxed">
            {formula}
          </code>
        </div>
      )}
    </div>
  )
}
