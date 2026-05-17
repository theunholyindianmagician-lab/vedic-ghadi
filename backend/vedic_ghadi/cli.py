"""
🔱 vedic-ghadi CLI — `python -m vedic_ghadi` or installed `vedic-ghadi` script.

    vedic-ghadi                # show current Vedic moment
    vedic-ghadi --loop         # live clock (refresh every prāṇa = 4 sec)
    vedic-ghadi --json         # emit JSON stamp instead of formatted text
    vedic-ghadi --at "2026-05-17 16:30"  # any moment (ISO-ish format)
    vedic-ghadi --tz 5.5       # timezone offset in hours
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time

from .ghadi import ghadi_at, ghadi_now, render_ghadi_text


def _parse_at(at: str, tz_h: float) -> dict:
    """Accept '2026-05-17', '2026-05-17 16:30', '2026-05-17T16:30:45'."""
    s = at.replace("T", " ").strip()
    if " " in s:
        date_part, time_part = s.split(" ", 1)
    else:
        date_part, time_part = s, "00:00:00"
    y, mo, d = [int(x) for x in date_part.split("-")]
    bits = time_part.split(":")
    h = int(bits[0]) if len(bits) >= 1 and bits[0] else 0
    mi = int(bits[1]) if len(bits) >= 2 and bits[1] else 0
    sec = float(bits[2]) if len(bits) >= 3 and bits[2] else 0.0
    return ghadi_at(y, mo, d, h, mi, sec, tz_h)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="vedic-ghadi",
        description="🔱 Substrate-derived Vedic clock for any civil moment.",
    )
    p.add_argument("--loop", action="store_true",
                   help="live clock, refresh every prāṇa (4 sec)")
    p.add_argument("--json", action="store_true",
                   help="emit JSON stamp instead of formatted text")
    p.add_argument("--at", type=str, default=None,
                   help='exact moment, ISO-ish ("2026-05-17 16:30:00")')
    p.add_argument("--tz", type=float, default=5.5,
                   help="timezone offset in hours (default: 5.5 = IST)")
    args = p.parse_args(argv)

    def render() -> str:
        stamp = (_parse_at(args.at, args.tz) if args.at
                 else ghadi_now(args.tz))
        if args.json:
            return json.dumps(stamp, ensure_ascii=False, indent=2)
        return render_ghadi_text(stamp)

    if args.loop:
        try:
            while True:
                os.system("clear" if os.name == "posix" else "cls")
                print(render())
                time.sleep(4.0)  # 1 prāṇa
        except KeyboardInterrupt:
            print("\n  ॐ शान्ति · ghaḍī stopped.\n")
            return 0
    else:
        print(render())
        return 0


if __name__ == "__main__":
    sys.exit(main())
