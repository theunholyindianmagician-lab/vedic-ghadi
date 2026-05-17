"use client"

import { useState, useEffect, useRef } from "react"

interface TimeMachineProps {
  initialIso: string
  onChange: (iso: string | null) => void
  isLive: boolean
}

const SPEEDS = [
  { label: "1×",     mult: 1 },
  { label: "60×",    mult: 60 },         // 1 min/sec real
  { label: "600×",   mult: 600 },        // 10 min/sec real
  { label: "3600×",  mult: 3600 },       // 1 hour/sec real
  { label: "21600×", mult: 21600 },      // 6 hours/sec real
] as const

export function TimeMachine({ initialIso, onChange, isLive }: TimeMachineProps) {
  const [value, setValue] = useState(initialIso)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(600)            // 10 min per real second
  const lastTickRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  // 24h slider state: hours since initial IST midnight of the chosen day
  const baseDate = value.split("T")[0]               // yyyy-MM-dd
  const timeStr = value.includes("T") ? value.split("T")[1] : "00:00:00"
  const [h, m, s] = timeStr.split(":").map(Number)
  const sliderHours = (h ?? 0) + (m ?? 0)/60 + (s ?? 0)/3600

  // Apply slider change → update value
  function setHours(hours: number) {
    hours = Math.max(0, Math.min(23.9999, hours))
    const H = Math.floor(hours)
    const M = Math.floor((hours - H) * 60)
    const S = Math.floor(((hours - H) * 60 - M) * 60)
    const next = `${baseDate}T${pad(H)}:${pad(M)}:${pad(S)}`
    setValue(next)
    onChange(next)
  }

  // Playback loop
  useEffect(() => {
    if (!playing) {
      lastTickRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    function tick(now: number) {
      if (lastTickRef.current != null) {
        const dtSec = (now - lastTickRef.current) / 1000
        const virtualSec = dtSec * speed
        const newHours = sliderHours + virtualSec / 3600
        if (newHours >= 24) {
          // Wrap to next day or stop. We'll just stop at 23:59:59 for clarity.
          setHours(23.9999)
          setPlaying(false)
          return
        }
        setHours(newHours)
      }
      lastTickRef.current = now
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, sliderHours])

  function apply() {
    if (value) onChange(value)
  }
  function backToNow() {
    setPlaying(false)
    onChange(null)
  }
  function jumpHour(delta: number) {
    setHours(sliderHours + delta)
  }

  return (
    <div className="mt-12 p-6 rounded-sm border border-gold-700/40 bg-ink-900/40 backdrop-blur-sm">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display tracking-[0.25em] text-gold-400 text-sm">
          कालयन्त्र · TIME MACHINE · 24h playback
        </h3>
        <span className="text-xs text-gold-600/80 italic">
          {isLive ? "वर्तमान क्षण दिखा रहा है"
                  : playing ? `▶ playing @ ${speed.toLocaleString()}× speed`
                            : "चुना हुआ क्षण दिखा रहा है"}
        </span>
      </div>

      {/* Datetime input + Go/Back */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="datetime-local"
          value={value}
          step="1"
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-[240px] bg-ink-800 text-gold-200
                     border border-gold-700/60 rounded-sm px-3 py-2
                     font-mono text-sm focus:outline-none focus:border-gold-500"
        />
        <button onClick={apply}
                className="px-4 py-2 border border-gold-500 text-gold-300 hover:bg-gold-500/10 hover:text-gold-100 transition-colors font-display tracking-wider text-sm rounded-sm">
          देखें · GO
        </button>
        {!isLive && (
          <button onClick={backToNow}
                  className="px-4 py-2 border border-gold-700 text-gold-500 hover:border-gold-500 hover:text-gold-300 transition-colors font-display tracking-wider text-xs rounded-sm">
            ◀ अभी पर वापस
          </button>
        )}
      </div>

      {/* 24-hour slider */}
      <div className="mt-2">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[10px] tracking-[0.2em] text-gold-500 font-display">
            ⏱️ 24-HOUR PLAYBACK · {baseDate}
          </span>
          <span className="text-xs font-mono text-gold-300 tabular">
            {pad(Math.floor(sliderHours))}:{pad(Math.floor((sliderHours % 1) * 60))}:{pad(Math.floor(((sliderHours * 60) % 1) * 60))} IST
          </span>
        </div>
        <input
          type="range"
          min={0} max={23.9999} step={0.001}
          value={sliderHours}
          onChange={(e) => setHours(parseFloat(e.target.value))}
          className="w-full accent-gold-500"
        />
        <div className="flex justify-between text-[9px] text-gold-700 font-mono mt-0.5">
          <span>00:00</span>
          <span>06:00 ब्राह्म</span>
          <span>12:00 मध्य</span>
          <span>18:00 साय</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setPlaying(p => !p)}
          className={[
            "px-4 py-2 border rounded-sm text-sm font-display tracking-wider transition-colors",
            playing
              ? "border-amber-ember bg-amber-ember/15 text-amber-100"
              : "border-gold-500 text-gold-300 hover:bg-gold-500/10",
          ].join(" ")}>
          {playing ? "⏸ रोको" : "▶ चलाओ"}
        </button>

        <div className="inline-flex rounded-sm border border-gold-700 overflow-hidden">
          {SPEEDS.map((s) => (
            <button key={s.mult} onClick={() => setSpeed(s.mult)}
                    className={[
                      "px-2 py-1.5 text-xs font-mono tracking-wider transition-colors",
                      s.mult === speed ? "bg-gold-500/15 text-gold-100" : "text-gold-500 hover:text-gold-300",
                    ].join(" ")}>
              {s.label}
            </button>
          ))}
        </div>

        <button onClick={() => jumpHour(-1)}
                className="px-2 py-1.5 border border-gold-700 text-gold-500 hover:border-gold-500 rounded-sm text-xs font-mono">
          −1h
        </button>
        <button onClick={() => jumpHour(+1)}
                className="px-2 py-1.5 border border-gold-700 text-gold-500 hover:border-gold-500 rounded-sm text-xs font-mono">
          +1h
        </button>
        <button onClick={() => setHours(0)}
                className="px-2 py-1.5 border border-gold-700 text-gold-500 hover:border-gold-500 rounded-sm text-xs font-mono">
          00:00
        </button>
        <button onClick={() => setHours(12)}
                className="px-2 py-1.5 border border-gold-700 text-gold-500 hover:border-gold-500 rounded-sm text-xs font-mono">
          12:00
        </button>
      </div>

      <p className="mt-3 text-xs text-gold-600/70 italic">
        ▶ चलाओ — देखो कैसे 504 cells दिन के दौरान morph होते हैं । speed = real-second से virtual-time की गति ।
        K_shifted के साथ नक्षत्र / pada / yoga / karaṇa भी shift होते हैं ।
      </p>
    </div>
  )
}

function pad(n: number) { return n.toString().padStart(2, "0") }
