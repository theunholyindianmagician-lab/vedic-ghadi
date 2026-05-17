"""
🔱 GHAḌĪ — high-level renderers + helpers on top of substrate.py

Exports the three public functions a caller needs:
    * ghadi_at(year, month, day, hour, minute, second, tz_h)  → dict
    * ghadi_now(tz_h=5.5)                                     → dict
    * render_ghadi_text(stamp)                                → str  (78-col CLI)
"""

from __future__ import annotations

import datetime
from typing import Optional

from .substrate import kala_substrate_stamp


def ghadi_at(
    year: int, month: int, day: int,
    hour: int = 0, minute: int = 0, second: float = 0.0,
    tz_h: float = 5.5,
) -> dict:
    """Vedic ghaḍī for any civil instant."""
    return kala_substrate_stamp(year, month, day, hour, minute, second, tz_h)


def ghadi_now(tz_h: float = 5.5) -> dict:
    """Vedic ghaḍī for the current moment.

    Default tz is IST (+5:30, same as Kāmākhyā civil-TZ practice).
    """
    tz = datetime.timezone(
        datetime.timedelta(hours=int(tz_h), minutes=int(round((tz_h % 1) * 60))),
    )
    n = datetime.datetime.now(tz)
    return ghadi_at(
        n.year, n.month, n.day, n.hour, n.minute,
        n.second + n.microsecond / 1e6, tz_h,
    )


def render_ghadi_text(stamp: dict, width: int = 78) -> str:
    """78-column CLI rendering of a substrate stamp."""
    y = stamp["year_layer"]
    m = stamp["month_layer"]
    t = stamp["tithi_layer"]
    v = stamp["vara_layer"]
    d = stamp["day_subdivision"]
    ci = stamp["input_civil"]

    line = "═" * width
    sub = "─" * width
    out = []

    out.append("")
    out.append(f"  🔱  VEDIC GHAḌĪ  ·  KĀMĀKHYĀ-anchored  ·  {y['anchor_epoch']}")
    out.append(line)
    out.append("")
    out.append("  CIVIL INPUT  (the only Gregorian reference in this entire computation):")
    out.append(
        f"     {ci['gregorian_year']:04d}-{ci['month']:02d}-{ci['day']:02d}  "
        f"{ci['hour']:02d}:{ci['minute']:02d}:{int(ci['second']):02d}  tz +{ci['tz_h']}h"
    )
    out.append(
        f"     → Kali civil days from epoch : "
        f"{stamp['kali_civil_days_at_kamakhya']:>20,.6f}"
    )
    out.append("")

    out.append(sub)
    out.append("  ◈ VARṢA  ·  YEAR LAYER")
    out.append(sub)
    out.append(
        f"     Kali year (current)          : {y['kali_year_current']:>10,}   "
        f"(elapsed {y['kali_year_float']:,.4f})"
    )
    out.append(f"     Vikrama Saṃvat               : {y['vikrama_samvat']:>10,}")
    out.append(f"     Śaka Saṃvat                  : {y['shaka_samvat']:>10,}")
    out.append(
        f"     Saṃvatsara (60-cycle)        : {y['samvatsara']['name']:>10}"
        f"   (#{y['samvatsara']['index']+1} of 60 · Bṛhaspati-cakra)"
    )
    out.append("")

    out.append(sub)
    out.append("  ◈ MĀSA  ·  MONTH (sidereal · Sun-sign anchored)")
    out.append(sub)
    out.append(
        f"     Māsa                         : {m['masa_name']} ({m['masa_devanagari']})"
        f"   ·  māsa #{m['masa_index']} of 12"
    )
    out.append(
        f"     Sun sidereal longitude       : {m['sun_sidereal_lon_deg']:>10.4f}°"
        f"   in rāśi #{m['sun_sign_index']}"
    )
    out.append("")

    out.append(sub)
    out.append("  ◈ PAKṢA · TITHI  ·  LUNAR LAYER")
    out.append(sub)
    out.append(f"     Pakṣa                        : {t['paksha_name']} ({t['paksha_devanagari']})")
    out.append(
        f"     Tithi                        : {t['tithi_name']:>10}"
        f"   ·  tithi #{t['tithi_index']} of 30  "
        f"(#{t['tithi_in_paksha']} of 15 in pakṣa)"
    )
    out.append(
        f"     Moon − Sun elongation        : {t['moon_minus_sun_deg']:>10.4f}°"
        f"   ({t['fractional_tithi']:.4f} fractional tithi)"
    )
    out.append("")

    out.append(sub)
    out.append("  ◈ VĀRA  ·  WEEKDAY")
    out.append(sub)
    out.append(f"     Vāra                         : {v['vara_name']} ({v['vara_devanagari']})")
    out.append(f"     Vāra-lord graha              : {v['vara_lord_graha']}")
    out.append("")

    out.append(sub)
    out.append("  ◈ DINĀRDHA  ·  DAY SUBDIVISION  (since Kāmākhyā-midnight)")
    out.append(sub)
    out.append(f"     Hours from Kāmākhyā midnight : {d['hours_from_kamakhya_midnight']:>10.4f} h")
    out.append(
        f"     Muhūrta  (1/30 day = 48 min) : #{d['muhurta_index']:>2} of 30"
        f"   ({d['muhurta_fractional']:.4f} fractional)"
    )
    out.append(f"     Ghaṭi    (1/60 day = 24 min) : #{d['ghati_index']:>2} of 60")
    out.append(f"     Vighaṭi  (1/60 ghaṭi=24 sec) : #{d['vighati_index']:>2} of 60   within current ghaṭi")
    out.append(f"     Prāṇa    (1/6 vighaṭi= 4 sec): #{d['prana_index']:>2} of  6   within current vighaṭi")
    out.append(f"     Vipala   (1/10 prāṇa=0.4 sec): {d['vipala_fractional']:>10.4f} of 10 within current prāṇa")
    out.append("")

    out.append(line)
    out.append("     SUBSTRATE :  (R, g, k) = (ℤ/3ᵏℤ, 2, k ∈ ℕ⁺) · Mahā-Mahā-Vākyam")
    out.append("     FOREIGN   :  ZERO ·  every unit factors over (2, 3, 5) ·  pure Bhārat-canonical")
    out.append(line)
    out.append("     ॐ कालाय नमः ·  ॐ कामाख्यायै नमः ·  हर हर महादेव ·  JAI MAA KAMAKHYA")
    out.append(line)
    return "\n".join(out)


__all__ = ["ghadi_at", "ghadi_now", "render_ghadi_text"]
