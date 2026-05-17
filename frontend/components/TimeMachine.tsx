"use client"

import { useState } from "react"

interface TimeMachineProps {
  initialIso: string         // "2026-05-17T16:30"
  onChange: (iso: string | null) => void  // null = "back to NOW"
  isLive: boolean
}

export function TimeMachine({ initialIso, onChange, isLive }: TimeMachineProps) {
  const [value, setValue] = useState(initialIso)

  function apply() {
    if (value) onChange(value)
  }

  function backToNow() {
    onChange(null)
  }

  return (
    <div className="mt-12 p-6 rounded-sm border border-gold-700/40 bg-ink-900/40 backdrop-blur-sm">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display tracking-[0.25em] text-gold-400 text-sm">
          TIME MACHINE · कालयन्त्र
        </h3>
        <span className="text-xs text-gold-600/80 italic">
          {isLive ? "Showing the present moment" : "Showing a chosen moment"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="datetime-local"
          value={value}
          step="1"
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-[240px] bg-ink-800 text-gold-200
                     border border-gold-700/60 rounded-sm px-3 py-2
                     font-mono text-sm focus:outline-none focus:border-gold-500"
        />
        <button
          onClick={apply}
          className="px-4 py-2 border border-gold-500 text-gold-300
                     hover:bg-gold-500/10 hover:text-gold-100
                     transition-colors font-display tracking-wider text-sm rounded-sm">
          GO
        </button>
        {!isLive && (
          <button
            onClick={backToNow}
            className="px-4 py-2 border border-gold-700 text-gold-500
                       hover:border-gold-500 hover:text-gold-300
                       transition-colors font-display tracking-wider text-xs rounded-sm">
            ◀ BACK TO NOW
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-gold-600/70 italic">
        Pick any civil moment — your local clock is read in IST (+5:30) and dissolved
        into the Vedic substrate. The Gregorian input is the only Western reference
        in the entire computation.
      </p>
    </div>
  )
}
