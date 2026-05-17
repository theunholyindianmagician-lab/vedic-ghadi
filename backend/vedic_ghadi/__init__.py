"""
🔱 vedic_ghadi — substrate-derived Vedic clock for any civil moment

Every Vedic time-unit emitted by this package is derived from a SINGLE
quantity: Kāli civil days elapsed since the sacred epoch (Friday midnight
17/18 February 3102 BCE, Ujjayinī meridian, Sūrya Siddhānta 1.45–1.57).

NO Gregorian calendar arithmetic below the input boundary.
NO Western timezone reasoning below the input boundary.
ZERO foreign theorem in the chain.

Public API:
    >>> from vedic_ghadi import ghadi_now, ghadi_at
    >>> ghadi_now()                       # current moment, IST
    >>> ghadi_at(2026, 5, 17, 16, 30, 0)  # any moment
"""

from .substrate import (
    KAMAKHYA_LAT_DEG, KAMAKHYA_LON_DEG, KAMAKHYA_ELEV_M,
    KAMAKHYA_LMT_OFFSET_H, KALI_YUGA_EPOCH_JD,
    MAHAYUGA_YEARS, MAHAYUGA_CIVIL_DAYS, KALI_DAYS_PER_YEAR,
    MASA_NAMES, MASA_DEV, VARA_NAMES, VARA_DEV, VARA_LORD,
    SAMVATSARA_NAMES, PAKSHA_NAMES, PAKSHA_DEV, TITHI_NAMES,
    VEDIC_TIME_SUBSTRATE,
    civil_input_to_kali_civil_days,
    kali_year_at_civil_days, vikrama_year, shaka_year,
    samvatsara_at_kali_year,
    vedic_month_at_kali_days, vedic_tithi_at_kali_days,
    vedic_vara_at_kali_days, vedic_time_of_day,
    kala_substrate_stamp,
)
from .ghadi import ghadi_at, ghadi_now, render_ghadi_text

__version__ = "1.0.0"
__all__ = [
    "ghadi_now", "ghadi_at", "render_ghadi_text",
    "kala_substrate_stamp", "civil_input_to_kali_civil_days",
    "KAMAKHYA_LAT_DEG", "KAMAKHYA_LON_DEG", "KAMAKHYA_ELEV_M",
    "KALI_DAYS_PER_YEAR",
    "MASA_NAMES", "VARA_NAMES", "SAMVATSARA_NAMES",
    "TITHI_NAMES", "PAKSHA_NAMES",
]
