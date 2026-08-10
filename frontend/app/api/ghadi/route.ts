import { NextRequest, NextResponse } from "next/server"
import { kalaSubstrateStamp, ghadiNow } from "@/lib/substrate"

/**
 * Headless JSON endpoint — same shape as the Python FastAPI /now and /at.
 *
 *   GET /api/ghadi                    → current moment, IST
 *   GET /api/ghadi?tz=0               → current moment, UTC
 *   GET /api/ghadi?date=2026-05-17T16:30:00&tz=5.5
 *   GET /api/ghadi?lat=23.1765&lon=75.778889   → observer override for lagna
 *
 * This means the frontend doesn't need the Python backend to be running —
 * the substrate is ported to TS. The backend remains the canonical source
 * of truth for non-JS consumers.
 */
export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tz = Number(searchParams.get("tz") ?? "5.5")
  const date = searchParams.get("date")
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  const hasObserver = lat !== null || lon !== null
  const latN = lat !== null ? Number(lat) : undefined
  const lonN = lon !== null ? Number(lon) : undefined

  if (date) {
    try {
      const s = date.replace("T", " ").trim()
      const [datePart, timePart = "00:00:00"] = s.split(" ")
      const [y, mo, d] = datePart.split("-").map(Number)
      const tBits = timePart.split(":")
      const h = Number(tBits[0] ?? 0)
      const mi = Number(tBits[1] ?? 0)
      const sec = Number(tBits[2] ?? 0)
      if (hasObserver) return NextResponse.json(kalaSubstrateStamp(y, mo, d, h, mi, sec, tz, latN, lonN))
      return NextResponse.json(kalaSubstrateStamp(y, mo, d, h, mi, sec, tz))
    } catch (e) {
      return NextResponse.json(
        { error: `Bad date format: ${date}. Use 2026-05-17T16:30:00` },
        { status: 400 },
      )
    }
  }

  if (hasObserver) return NextResponse.json(ghadiNow(tz, latN, lonN))
  return NextResponse.json(ghadiNow(tz))
}
