import { NextRequest, NextResponse } from "next/server"
import { kalaSubstrateStamp, ghadiNow } from "@/lib/substrate"

/**
 * Headless JSON endpoint — same shape as the Python FastAPI /now and /at.
 *
 *   GET /api/ghadi                    → current moment, IST
 *   GET /api/ghadi?tz=0               → current moment, UTC
 *   GET /api/ghadi?date=2026-05-17T16:30:00&tz=5.5
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

  if (date) {
    try {
      const s = date.replace("T", " ").trim()
      const [datePart, timePart = "00:00:00"] = s.split(" ")
      const [y, mo, d] = datePart.split("-").map(Number)
      const tBits = timePart.split(":")
      const h = Number(tBits[0] ?? 0)
      const mi = Number(tBits[1] ?? 0)
      const sec = Number(tBits[2] ?? 0)
      return NextResponse.json(kalaSubstrateStamp(y, mo, d, h, mi, sec, tz))
    } catch (e) {
      return NextResponse.json(
        { error: `Bad date format: ${date}. Use 2026-05-17T16:30:00` },
        { status: 400 },
      )
    }
  }

  return NextResponse.json(ghadiNow(tz))
}
