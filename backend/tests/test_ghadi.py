"""Public ghaḍī helpers: civil-time input boundaries."""

from __future__ import annotations

import datetime as standard_datetime
from unittest.mock import patch

import vedic_ghadi.ghadi as ghadi_module


def test_ghadi_now_preserves_negative_fractional_timezone_offset():
    """A -3.5 hour offset must remain -03:30, not become -02:30."""
    captured_timezones: list[standard_datetime.tzinfo] = []
    real_datetime = standard_datetime.datetime

    class FixedDateTime:
        @classmethod
        def now(cls, timezone: standard_datetime.tzinfo) -> standard_datetime.datetime:
            captured_timezones.append(timezone)
            return real_datetime(2026, 1, 1, 12, 0, 0)

    with patch.object(ghadi_module.datetime, "datetime", FixedDateTime), patch.object(
        ghadi_module, "ghadi_at", return_value={}
    ):
        ghadi_module.ghadi_now(tz_h=-3.5)

    assert captured_timezones[0].utcoffset(None) == standard_datetime.timedelta(hours=-3.5)
